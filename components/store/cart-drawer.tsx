"use client";

import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useCart, describeStockChanges } from '@/lib/cart-context';
import { priceEGP } from '@/lib/format';
import { FreeShippingProgress } from '@/components/store/free-shipping-progress';
import { cn } from '@/lib/utils';

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number | null }) {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, refreshStock, subtotal, totalItems } = useCart();

  // كل ما السلة تتفتح بنتأكد من المخزون الحقيقي (ممكن حد تاني اشترى)
  useEffect(() => {
    if (!isOpen) return;
    refreshStock().then((changes) => {
      if (changes.length > 0) toast.warning(describeStockChanges(changes), { duration: 7000 });
    });
  }, [isOpen, refreshStock]);

  // inert بيمنع الـ Tab وقارئ الشاشة يدخلوا جوه السلة وهي مقفولة. بنحطه على الـ DOM
  // مباشرة لأن React 18 types مفيهاش inert، وNext بيشغّل React 19 اللي بيعامل
  // inert="" على إنه false - فالـ attribute اليدوي هو الطريقة المضمونة للاتنين.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (isOpen) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [isOpen]);

  // Esc بيقفل السلة، والـ focus بيروح لزرار الإغلاق، والسكرول ورا بيتقفل
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div ref={rootRef} className={cn('fixed inset-0 z-[70]', !isOpen && 'pointer-events-none')} aria-hidden={!isOpen}>
      {/* backdrop */}
      <div
        className={cn('absolute inset-0 bg-foreground/40 transition-opacity duration-500', isOpen ? 'opacity-100' : 'opacity-0')}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={cn(
          'absolute top-0 left-0 bottom-0 w-full max-w-[92vw] sm:max-w-md bg-background flex flex-col transition-transform duration-500 ease-luxury',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* header */}
        <div className="flex items-center justify-between pr-6 pl-3 h-16 border-b border-border">
          <div className="flex items-baseline gap-2">
            <h2 id="cart-drawer-title" className="font-display text-xl font-medium leading-[1.3]">سلة التسوق</h2>
            {totalItems > 0 && (
              <span className="font-arabic text-sm text-muted-foreground tabular-nums">({totalItems.toLocaleString('ar-EG')})</span>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق السلة"
            className="w-11 h-11 inline-flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" strokeWidth={1} aria-hidden="true" />
              <p className="font-arabic text-foreground">سلتك فاضية</p>
              <p className="font-arabic text-sm text-muted-foreground">ابدئي من التشكيلة الجديدة</p>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="mt-3 inline-flex items-center h-12 px-10 bg-foreground text-background font-arabic text-[15px] hover:bg-foreground/85 transition-colors duration-300"
              >
                تصفحي المتجر
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.variant.id} className="flex gap-4 py-5 first:pt-0">
                  <div className="relative w-20 h-[106px] shrink-0 overflow-hidden bg-muted">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0]} alt={item.product.title_ar} fill sizes="80px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-arabic text-sm font-medium leading-[1.6] line-clamp-2">{item.product.title_ar}</h3>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variant.id)}
                        className="-mt-2.5 -ml-3 w-11 h-11 shrink-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`حذف ${item.product.title_ar} من السلة`}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <p className="font-arabic text-[13px] text-muted-foreground">
                      {item.variant.color_ar} • مقاس {item.variant.size}
                    </p>
                    {item.variant.stock_quantity <= 3 && (
                      <p className="font-arabic text-[13px] text-foreground/80 mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                        {item.quantity >= item.variant.stock_quantity
                          ? 'دي كل الكمية المتاحة'
                          : `متبقي ${item.variant.stock_quantity.toLocaleString('ar-EG')} فقط`}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="w-10 h-10 inline-flex items-center justify-center hover:bg-muted transition-colors"
                          aria-label="إنقاص الكمية"
                        >
                          <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <span className="font-arabic text-sm w-8 text-center tabular-nums" aria-live="polite">
                          {item.quantity.toLocaleString('ar-EG')}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.stock_quantity}
                          className="w-10 h-10 inline-flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label="زيادة الكمية"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="font-arabic text-[15px] font-medium tabular-nums">
                        {priceEGP(item.product.sale_price_egp ?? item.product.price_egp)} ج.م
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
            <FreeShippingProgress subtotal={subtotal} threshold={freeShippingThreshold} />
            <div className="flex items-baseline justify-between">
              <span className="font-arabic text-foreground/80">المجموع الفرعي</span>
              <span className="font-arabic text-lg font-semibold tabular-nums">{priceEGP(subtotal)} ج.م</span>
            </div>
            <p className="font-arabic text-[13px] text-muted-foreground -mt-2">يُحسب الشحن في الخطوة الجاية</p>
            <p className="font-arabic text-[13px] text-foreground/80 text-center pt-1">الدفع عند الاستلام • معاينة قبل الدفع</p>
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full h-[52px] bg-foreground text-background font-arabic text-[15px] hover:bg-foreground/85 transition-colors duration-300 tabular-nums"
            >
              إتمام الطلب • {priceEGP(subtotal)} ج.م
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center font-arabic text-sm text-foreground/70 hover:text-foreground transition-colors py-2"
            >
              متابعة التسوق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
