"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { CartItem, Product, ProductVariant } from './types';
import { track } from './analytics';
import { restSelect } from './rest';

/*
 * المخزون في السلة
 * =================
 * 1. السلة مبتسمحش تزوّد كمية أي مقاس/لون عن المخزون المتاح (addItem و
 *    updateQuantity بيقفلوا على stock_quantity) - قبل كده كان ممكن تضيفي
 *    4 قطع مرتين ويبقى في السلة 8 والمخزون 4.
 * 2. المخزون اللي في السلة ممكن يكون قديم (السلة محفوظة في المتصفح، وصفحة
 *    المنتج متكاشة)، فـ refreshStock() بتجيب المخزون الحقيقي من قاعدة
 *    البيانات لما السلة تتفتح أو صفحة الدفع تفتح، وبتظبط الكميات تلقائي.
 * 3. الحماية النهائية في place_order على السيرفر: بيقفل صف المخزون وقت
 *    الطلب، فلو زبونتين طلبوا آخر قطعة في نفس اللحظة، واحدة بس اللي طلبها
 *    هيعدّي، والتانية هتاخد رسالة إن الكمية مش متوفرة وسلتها هتتظبط.
 */

export type AddResult = {
  /** الكمية اللي اتضافت فعلاً (ممكن تكون أقل من المطلوب) */
  added: number;
  /** الكمية الموجودة في السلة من المقاس ده بعد الإضافة */
  inCart: number;
  /** المخزون المتاح */
  available: number;
};

export type StockChange = { title: string; detail: string; from: number; to: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => AddResult;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  refreshStock: () => Promise<StockChange[]>;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

// v2: بنخزن الحقول اللي السلة محتاجاها بس (مش المنتج كله بالوصف وكل
// المقاسات)، والمفتاح عليه رقم نسخة عشان لو الشكل اتغير بعدين.
const STORAGE_KEY = 'soraia_cart:v2';
const LEGACY_KEY = 'anaca_cart';

function slimProduct(p: Product): Product {
  return {
    id: p.id,
    slug: p.slug,
    title_ar: p.title_ar,
    title_en: p.title_en,
    images: p.images?.slice(0, 1) ?? [],
    price_egp: p.price_egp,
    sale_price_egp: p.sale_price_egp,
    description_ar: null,
    description_en: null,
    is_turkish_import: p.is_turkish_import,
    fabric_details_ar: null,
    category_id: p.category_id,
    is_featured: false,
    status: p.status,
    created_at: p.created_at,
  };
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    localStorage.removeItem(LEGACY_KEY);
    return parsed
      .filter((i) => i?.product?.id && i?.variant?.id && i.quantity > 0)
      .map((i) => ({
        ...i,
        product: slimProduct(i.product),
        quantity: Math.min(i.quantity, Math.max(0, i.variant.stock_quantity ?? i.quantity)),
      }))
      .filter((i) => i.quantity > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // نسخة دايماً محدّثة من السلة، عشان addItem يقدر يرجّع النتيجة فوراً
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode / quota */
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, variant: ProductVariant, quantity = 1): AddResult => {
    const available = Math.max(0, variant.stock_quantity ?? 0);
    const current = itemsRef.current.find((i) => i.variant.id === variant.id)?.quantity ?? 0;
    const added = Math.max(0, Math.min(quantity, available - current));
    const result = { added, inCart: current + added, available };
    if (added === 0) return result;

    setItems((prev) => {
      const existing = prev.find((i) => i.variant.id === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variant.id === variant.id
            ? { ...i, variant, quantity: Math.min(i.quantity + added, available) }
            : i
        );
      }
      return [...prev, { product: slimProduct(product), variant, quantity: added }];
    });
    setIsOpen(true);
    track('AddToCart', {
      content_ids: [product.id],
      content_type: 'product',
      content_name: product.title_ar,
      value: (product.sale_price_egp ?? product.price_egp) * added,
    });
    return result;
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.variant.id === variantId
            ? { ...i, quantity: Math.min(quantity, Math.max(0, i.variant.stock_quantity)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // بتجيب المخزون الحقيقي لكل مقاسات السلة، وبتقلل الكمية أو تشيل المنتج
  // لو المخزون خلص. بترجع قايمة التغييرات عشان تتعرض للعميلة.
  const refreshStock = useCallback(async (): Promise<StockChange[]> => {
    const current = itemsRef.current;
    if (current.length === 0) return [];
    const ids = current.map((i) => i.variant.id);
    const data = await restSelect<ProductVariant>(
      'product_variants',
      `select=id,stock_quantity,size,color_ar,color_hex,sku,product_id&id=in.(${ids.map(encodeURIComponent).join(',')})`
    );
    if (!data) return [];

    // المقاس اللي مرجعش خالص = اتمسح أو المنتج بقى مسودة (RLS بيخفيه)
    const fresh = new Map(data.map((v) => [v.id, v as ProductVariant]));
    const changes: StockChange[] = [];
    for (const item of current) {
      const stock = Math.max(0, fresh.get(item.variant.id)?.stock_quantity ?? 0);
      if (item.quantity > stock) {
        changes.push({
          title: item.product.title_ar,
          detail: `${item.variant.color_ar} • مقاس ${item.variant.size}`,
          from: item.quantity,
          to: stock,
        });
      }
    }

    // بنطبق على أحدث نسخة من السلة (لو العميلة ضافت حاجة والطلب شغال،
    // اللي اتضاف بعد الطلب بيفضل زي ما هو)
    setItems((prev) =>
      prev
        .map((i) => {
          if (!ids.includes(i.variant.id)) return i;
          const v = fresh.get(i.variant.id);
          const stock = Math.max(0, v?.stock_quantity ?? 0);
          return { ...i, variant: v ? { ...i.variant, ...v } : i.variant, quantity: Math.min(i.quantity, stock) };
        })
        .filter((i) => i.quantity > 0)
    );
    return changes;
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const price = i.product.sale_price_egp ?? i.product.price_egp;
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, refreshStock, totalItems, subtotal, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

/** رسالة للعميلة لما المخزون يغيّر حاجة في سلتها */
export function describeStockChanges(changes: StockChange[]): string {
  return changes
    .map((c) => (c.to === 0 ? `${c.title} (${c.detail}) نفد من المخزون واتشال من السلة` : `${c.title} (${c.detail}): متاح ${c.to} بس`))
    .join('\n');
}
