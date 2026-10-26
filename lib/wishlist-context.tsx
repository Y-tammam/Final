"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Product } from './types';

// نسخة مصغرة من المنتج بنخزنها في localStorage بدل المنتج كامل (بالـ variants
// والوصف وكل الصور) عشان التخزين يفضل صغير ومنتعداش حد الـ 5MB بتاع المتصفح.
// نفس الشكل ده بيستخدم في "شوهد مؤخراً" (lib/recently-viewed.ts).
export type ProductSnapshot = {
  id: string;
  slug: string;
  title_ar: string;
  images: string[];
  price_egp: number;
  sale_price_egp: number | null;
};

export type SnapshotSource = Pick<Product, 'id' | 'slug' | 'title_ar' | 'images' | 'price_egp' | 'sale_price_egp'>;

export function toSnapshot(p: SnapshotSource): ProductSnapshot {
  return {
    id: p.id,
    slug: p.slug,
    title_ar: p.title_ar,
    // أول صورة بس - هي اللي بتظهر في الكروت
    images: p.images?.[0] ? [p.images[0]] : [],
    price_egp: p.price_egp,
    sale_price_egp: p.sale_price_egp ?? null,
  };
}

type WishlistContextValue = {
  items: ProductSnapshot[];
  has: (id: string) => boolean;
  toggle: (product: SnapshotSource) => boolean;
  remove: (id: string) => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const STORAGE_KEY = 'soraia_wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ProductSnapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // نفس أسلوب السلة: بنقرا من localStorage بعد أول render بس (عشان الـ HTML
  // اللي جاي من السيرفر يطابق أول render في المتصفح ومايحصلش hydration error)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* empty */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* empty */
    }
  }, [items, hydrated]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  // بترجع true لو المنتج اتضاف، false لو اتشال - عشان الزرار يعرف يطلع toast ولا لأ
  const toggle = useCallback(
    (product: SnapshotSource) => {
      const exists = items.some((i) => i.id === product.id);
      setItems((prev) =>
        prev.some((i) => i.id === product.id)
          ? prev.filter((i) => i.id !== product.id)
          : [toSnapshot(product), ...prev]
      );
      return !exists;
    },
    [items]
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <WishlistContext.Provider value={{ items, has, toggle, remove, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
