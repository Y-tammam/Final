"use client";

import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { priceEGP, discountPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { WishlistButton } from '@/components/store/wishlist-button';

const CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

// كارت المنتج بشكل هادي وفاخر: من غير بادجات صارخة، الصورة التانية بتظهر
// بالتدريج لما الماوس يقف على الكارت (ديسكتوب بس)، وزوم بطيء جداً.
export function ProductCard({ product, isNew = false }: { product: Product; isNew?: boolean }) {
  const { addItem } = useCart();
  const effectivePrice = product.sale_price_egp ?? product.price_egp;
  const discount = discountPercent(product.price_egp, product.sale_price_egp);
  const inStockVariant = product.variants?.find((v) => v.stock_quantity > 0);
  const secondImage = product.images[1];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStockVariant) return;
    const result = addItem(product, inStockVariant, 1);
    if (result.added === 0) toast.error('كل الكمية المتاحة من المنتج ده في سلتك');
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title_ar}
            fill
            sizes={CARD_SIZES}
            className={cn(
              'object-cover transition-all [transition-duration:1400ms] ease-luxury group-hover:scale-[1.04]',
              // لو فيه صورة تانية، الأولى بتختفي بالتدريج على الديسكتوب
              secondImage && 'lg:group-hover:opacity-0'
            )}
          />
        )}
        {/* الصورة التانية (لو موجودة) - من غير priority فبتتحمل lazy */}
        {secondImage && (
          <Image
            src={secondImage}
            alt=""
            aria-hidden
            fill
            sizes={CARD_SIZES}
            className="hidden lg:block object-cover opacity-0 scale-[1.02] transition-all [transition-duration:1400ms] ease-luxury group-hover:opacity-100 group-hover:scale-[1.04]"
          />
        )}

        {/* ليبلات هادية في الركن اليمين: جديد / نسبة الخصم */}
        {(isNew || discount) && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            {isNew && (
              <span className="bg-background/90 text-foreground font-body text-[10px] uppercase tracking-[0.2em] px-2 py-0.5">
                جديد
              </span>
            )}
            {discount && (
              <span className="bg-background/90 text-foreground font-body text-[11px] tracking-wide px-2 py-0.5 num-rtl">
                -{discount}%
              </span>
            )}
          </div>
        )}

        {/* المفضلة - الركن الشمال فوق */}
        <WishlistButton product={product} className="absolute top-3 left-3 z-10" />

        {/* إضافة سريعة: شريط أسود رفيع بيظهر مع الـ hover */}
        {inStockVariant && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-0 inset-x-0 bg-foreground text-primary-foreground font-arabic text-xs tracking-wide py-3 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-luxury flex items-center justify-center gap-2 hover:bg-foreground/90"
          >
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} />
            إضافة سريعة
          </button>
        )}

        {/* نفدت الكمية: ليبل صغير تحت بدل ما نغمّق الصورة كلها */}
        {!inStockVariant && (
          <div className="absolute bottom-0 inset-x-0 bg-background/90 text-foreground font-arabic text-xs text-center py-2 tracking-wide">
            نفدت الكمية
          </div>
        )}
      </div>

      <div className="pt-4">
        <h3 className="font-arabic font-normal text-foreground text-sm sm:text-[15px] leading-snug line-clamp-1">
          {product.title_ar}
        </h3>
        {product.fabric_details_ar && (
          <p className="font-arabic text-muted-foreground text-xs mt-1 line-clamp-1">
            {product.fabric_details_ar}
          </p>
        )}
        <div className="flex items-baseline gap-2 mt-2">
          <span className={cn('font-body text-sm font-light num-rtl', discount ? 'text-accent' : 'text-foreground')}>
            {priceEGP(effectivePrice)} ج.م
          </span>
          {discount && (
            <span className="font-body text-xs font-light text-muted-foreground line-through num-rtl">
              {priceEGP(product.price_egp)} ج.م
            </span>
          )}
        </div>
        {/* Color dots */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5">
            {Array.from(new Map(product.variants.map((v) => [v.color_hex ?? '', v])).values()).slice(0, 4).map((v) => (
              <span
                key={v.id}
                title={v.color_ar}
                className={cn('w-2.5 h-2.5 rounded-full border border-border', !v.color_hex && 'bg-muted')}
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
