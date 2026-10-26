"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Heart, X } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist-context';
import { priceEGP, discountPercent } from '@/lib/format';

// محتوى صفحة المفضلة - client لأن البيانات في localStorage مش في قاعدة البيانات
export function WishlistContent() {
  const { items, remove } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <Heart className="w-10 h-10 mx-auto text-muted-foreground" strokeWidth={1} />
        <p className="font-arabic text-lg mt-6">قائمة المفضلة فاضية</p>
        <p className="font-arabic text-sm text-muted-foreground mt-2">
          اضغطي على القلب في أي منتج عشان تحفظيه هنا وترجعيله بعدين
        </p>
        <Link
          href="/shop"
          className="inline-block mt-8 bg-foreground text-primary-foreground font-arabic text-sm px-8 py-3.5 hover:bg-foreground/85 transition-colors duration-300"
        >
          تسوقي الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <p className="font-arabic text-sm text-muted-foreground mb-8 num-rtl">{items.length} منتج محفوظ</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
        {items.map((p) => {
          const discount = discountPercent(p.price_egp, p.sale_price_egp);
          return (
            <div key={p.id} className="group relative">
              <Link href={`/product/${p.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {p.images[0] && (
                    <Image
                      src={p.images[0]}
                      alt={p.title_ar}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform [transition-duration:1200ms] ease-luxury group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <h3 className="font-arabic font-normal text-sm sm:text-base text-foreground mt-4 line-clamp-1">{p.title_ar}</h3>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="font-body text-sm text-foreground num-rtl">
                    {priceEGP(p.sale_price_egp ?? p.price_egp)} ج.م
                  </span>
                  {discount && (
                    <span className="font-body text-xs text-muted-foreground line-through num-rtl">
                      {priceEGP(p.price_egp)}
                    </span>
                  )}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="إزالة من المفضلة"
                title="إزالة من المفضلة"
                className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
