"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewed } from '@/lib/recently-viewed';
import { priceEGP } from '@/lib/format';

// صف أفقي بيتسحب بالعرض فيه آخر المنتجات اللي اتشافت (من غير المنتج الحالي).
// لو القائمة فاضية مش بيرندر حاجة خالص.
export function RecentlyViewed({ excludeId, title = 'شوهد مؤخراً' }: { excludeId?: string; title?: string }) {
  const items = useRecentlyViewed().filter((p) => p.id !== excludeId);
  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 border-t border-border">
      <h2 className="font-display text-2xl sm:text-3xl font-medium leading-[1.3] mb-6">{title}</h2>
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin]">
        {items.map((p) => {
          const price = p.sale_price_egp ?? p.price_egp;
          return (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="group shrink-0 w-32 sm:w-40 snap-start"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {p.images[0] && (
                  <Image
                    src={p.images[0]}
                    alt={p.title_ar}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform [transition-duration:1200ms] ease-luxury motion-safe:group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <p className="font-arabic text-[13px] sm:text-sm leading-[1.6] text-foreground mt-2 line-clamp-1">{p.title_ar}</p>
              <p className="font-arabic text-[13px] text-muted-foreground tabular-nums">{priceEGP(price)} ج.م</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
