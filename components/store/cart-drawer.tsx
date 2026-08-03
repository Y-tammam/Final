"use client";

import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { priceEGP } from '@/lib/format';
import { BRAND_CONFIG } from '@/lib/brand';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal, totalItems } = useCart();

  return (
    <div className={cn('fixed inset-0 z-[70]', !isOpen && 'pointer-events-none')}>
      {/* backdrop */}
      <div
        className={cn('absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-400', isOpen ? 'opacity-100' : 'opacity-0')}
        onClick={() => setIsOpen(false)}
      />
      {/* panel */}
      <div
        className={cn(
          'absolute top-0 left-0 bottom-0 w-full max-w-md bg-background shadow-2xl flex flex-col transition-transform duration-500 ease-luxury',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-accent" strokeWidth={1.5} />
            <h2 className="font-arabic text-lg font-semibold">سلة التسوق</h2>
            {totalItems > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{totalItems}</span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} aria-label="إغلاق" className="p-1.5 hover:bg-muted rounded-sm transition-colors">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
              </div>
              <p className="font-arabic text-muted-foreground">سلتك فارغة</p>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="font-arabic text-sm text-accent hover:underline"
              >
                تصفح المتجر
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.variant.id} className="flex gap-4">
                  <div className="relative w-20 h-24 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0]} alt={item.product.title_ar} fill sizes="80px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-arabic text-sm font-medium line-clamp-1">{item.product.title_ar}</h3>
                    <p className="font-arabic text-xs text-muted-foreground mt-0.5">
                      {item.variant.color_ar} • مقاس {item.variant.size}
                    </p>
                    <p className="font-body text-sm font-semibold mt-1 num-rtl">
                      {priceEGP(item.product.sale_price_egp ?? item.product.price_egp)} ج.م
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border rounded-sm">
                        <button onClick={() => updateQuantity(item.variant.id, item.quantity - 1)} className="p-1.5 hover:bg-muted transition-colors" aria-label="إنقاص">
                          <Minus className="w-3 h-3" strokeWidth={2} />
                        </button>
                        <span className="font-body text-sm w-8 text-center num-rtl">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.stock_quantity}
                          className="p-1.5 hover:bg-muted transition-colors disabled:opacity-30"
                          aria-label="زيادة"
                        >
                          <Plus className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.variant.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" aria-label="حذف">
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-arabic text-muted-foreground">المجموع الفرعي</span>
              <span className="font-body text-xl font-semibold num-rtl">{priceEGP(subtotal)} ج.م</span>
            </div>
            <p className="font-arabic text-xs text-muted-foreground">يُحسب الشحن عند إتمام الطلب</p>
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="block w-full bg-foreground text-primary-foreground font-arabic text-center py-3.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all duration-400"
            >
              إتمام الطلب
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center font-arabic text-sm text-foreground/70 hover:text-accent transition-colors"
            >
              متابعة التسوق
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
