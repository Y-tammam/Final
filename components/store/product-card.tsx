"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { priceEGP, discountPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export function ProductCard({ product, isNew = false }: { product: Product; isNew?: boolean }) {
  const { addItem } = useCart();
  const effectivePrice = product.sale_price_egp ?? product.price_egp;
  const discount = discountPercent(product.price_egp, product.sale_price_egp);
  const inStockVariant = product.variants?.find((v) => v.stock_quantity > 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStockVariant) return;
    addItem(product, inStockVariant, 1);
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-sm">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title_ar}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-luxury"
          />
        )}
        {isNew && (
          <div className="absolute top-3 left-3">
            <span className="bg-accent text-accent-foreground text-[10px] font-arabic font-semibold px-2.5 py-1 rounded-sm">
              جديد
            </span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-start">
          {product.is_turkish_import && (
            <span className="bg-foreground/85 text-primary-foreground text-[10px] font-arabic px-2.5 py-1 rounded-sm backdrop-blur-sm">
              تركي 100%
            </span>
          )}
          {discount && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-sm">
              -{discount}%
            </span>
          )}
        </div>
        {/* Quick add button - desktop hover */}
        {inStockVariant && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-sm text-foreground font-arabic text-sm py-2.5 rounded-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-luxury flex items-center justify-center gap-2 hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            إضافة سريعة
          </button>
        )}
        {!inStockVariant && (
          <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
            <span className="font-arabic text-primary-foreground bg-foreground/80 px-4 py-2 rounded-sm text-sm">
              نفدت الكمية
            </span>
          </div>
        )}
      </div>

      <div className="pt-4">
        <h3 className="font-arabic text-foreground text-sm sm:text-base font-medium leading-snug line-clamp-1 group-hover:text-accent transition-colors">
          {product.title_ar}
        </h3>
        <p className="font-arabic text-muted-foreground text-xs mt-1 line-clamp-1">
          {product.fabric_details_ar}
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-body text-base font-semibold text-foreground num-rtl">
            {priceEGP(effectivePrice)} ج.م
          </span>
          {discount && (
            <span className="font-body text-xs text-muted-foreground line-through num-rtl">
              {priceEGP(product.price_egp)}
            </span>
          )}
        </div>
        {/* Color dots */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5">
            {Array.from(new Map(product.variants.map((v) => [v.color_hex ?? '', v])).values()).slice(0, 4).map((v) => (
              <span
                key={v.id}
                className={cn('w-3 h-3 rounded-full border border-border', !v.color_hex && 'bg-muted')}
                style={v.color_hex ? { backgroundColor: v.color_hex } : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export { ProductCard as ProductCardTall };
export type { Product, ProductVariant };
