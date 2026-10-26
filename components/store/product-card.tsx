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
// الخصومات الصغيرة مش بتستاهل بادج على الصورة - السعر المشطوب كفاية
const MIN_BADGE_DISCOUNT = 20;

const arNum = (n: number) => n.toLocaleString('ar-EG');

function colorLabel(n: number): string {
  if (n === 1) return 'لون واحد';
  if (n === 2) return 'لونان';
  if (n <= 10) return `${arNum(n)} ألوان`;
  return `${arNum(n)} لوناً`;
}

// كارت المنتج بشكل هادي وفاخر.
// الهيكل: div.relative فيه الصورة والنص، واللينك على العنوان بيغطي الكارت كله
// (after:inset-0)، وأزرار المفضلة والإضافة السريعة "جنب" اللينك مش جواه -
// زرار جوه <a> مش HTML صحيح وبيلخبط قارئ الشاشة والكيبورد.
export function ProductCard({ product, isNew = false }: { product: Product; isNew?: boolean }) {
  const { addItem } = useCart();
  const effectivePrice = product.sale_price_egp ?? product.price_egp;
  const discount = discountPercent(product.price_egp, product.sale_price_egp);
  const inStockVariants = product.variants?.filter((v) => v.stock_quantity > 0) ?? [];
  const inStockVariant = inStockVariants[0];
  // الإضافة السريعة منطقية بس لو فيه اختيار واحد متاح؛ غير كده لازم تختار المقاس
  const singleVariant = inStockVariants.length === 1 ? inStockVariant : undefined;
  const secondImage = product.images[1];
  const colorCount = new Set(product.variants?.map((v) => v.color_ar) ?? []).size;
  const href = `/product/${product.slug}`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!singleVariant) return;
    const result = addItem(product, singleVariant, 1);
    if (result.added === 0) toast.error('كل الكمية المتاحة من المنتج ده في سلتك');
  };

  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title_ar}
            fill
            sizes={CARD_SIZES}
            className={cn(
              'object-cover transition-[opacity,transform] [transition-duration:1400ms] ease-luxury motion-safe:group-hover:scale-[1.04]',
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
            className="hidden lg:block object-cover opacity-0 scale-[1.02] transition-[opacity,transform] [transition-duration:1400ms] ease-luxury group-hover:opacity-100 motion-safe:group-hover:scale-[1.04]"
          />
        )}

        {/* ليبلات هادية في الركن اليمين: جديد / نسبة خصم كبيرة بس */}
        {(isNew || (discount && discount >= MIN_BADGE_DISCOUNT)) && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1 pointer-events-none">
            {isNew && (
              <span className="bg-background/90 text-foreground font-arabic text-xs leading-5 px-2">جديد</span>
            )}
            {discount && discount >= MIN_BADGE_DISCOUNT && (
              <span className="bg-background/90 text-foreground font-arabic text-xs leading-5 px-2 tabular-nums">
                -{arNum(discount)}٪
              </span>
            )}
          </div>
        )}

        {/* المفضلة - الركن الشمال فوق. z-10 عشان تبقى فوق اللينك الممدود */}
        <WishlistButton product={product} className="absolute top-1 left-1 z-10" />

        {/* ديسكتوب بس: إضافة سريعة لو فيه اختيار واحد متاح، وإلا "اختاري المقاس".
            بتظهر مع الـ hover أو لما الزرار ياخد focus من الكيبورد. */}
        {singleVariant ? (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`إضافة ${product.title_ar} إلى السلة`}
            className="hidden lg:flex absolute z-10 bottom-0 inset-x-0 bg-foreground text-background font-arabic text-sm py-3 items-center justify-center gap-2 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 focus-visible:outline-offset-[-4px] focus-visible:outline-background transition-[opacity,transform,background-color] duration-500 ease-luxury hover:bg-foreground/90"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            إضافة سريعة
          </button>
        ) : inStockVariant ? (
          <span
            aria-hidden="true"
            className="hidden lg:block absolute bottom-0 inset-x-0 pointer-events-none bg-background/95 text-foreground font-arabic text-sm py-3 text-center opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-500 ease-luxury"
          >
            اختاري المقاس
          </span>
        ) : null}

        {/* نفدت الكمية: ليبل صغير تحت بدل ما نغمّق الصورة كلها */}
        {!inStockVariant && (
          <div className="absolute bottom-0 inset-x-0 bg-background/90 text-foreground font-arabic text-[13px] text-center py-2 pointer-events-none">
            نفدت الكمية
          </div>
        )}
      </div>

      <div className="pt-3 sm:pt-4">
        <h3 className="font-arabic font-normal text-foreground text-sm sm:text-[15px] leading-[1.6] line-clamp-1">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-foreground"
          >
            {product.title_ar}
          </Link>
        </h3>
        {product.fabric_details_ar && (
          <p className="font-arabic text-muted-foreground text-[13px] leading-[1.6] mt-0.5 line-clamp-1">
            {product.fabric_details_ar}
          </p>
        )}
        <div className="flex items-baseline flex-wrap gap-x-2 mt-1.5 font-arabic tabular-nums">
          <span className={cn('text-sm sm:text-[15px] text-foreground', discount && 'font-medium')}>
            {priceEGP(effectivePrice)} ج.م
          </span>
          {discount && (
            <span className="text-[13px] text-muted-foreground line-through">
              <span className="sr-only">بدلاً من </span>
              {priceEGP(product.price_egp)} ج.م
            </span>
          )}
        </div>
        {colorCount > 0 && (
          <p className="font-arabic text-[13px] text-muted-foreground mt-1">{colorLabel(colorCount)}</p>
        )}
      </div>

    </div>
  );
}

export { ProductCard as ProductCardTall };
export type { Product, ProductVariant };
