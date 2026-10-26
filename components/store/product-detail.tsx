"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, MessageCircle, Ruler, Check, ChevronLeft, ChevronRight, Truck, Eye, Sparkles, X, Maximize2, Plus } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/types';
import { restSelect } from '@/lib/rest';
import { useCart } from '@/lib/cart-context';
import { priceEGP, discountPercent } from '@/lib/format';
import { BRAND_CONFIG, TURKISH_SIZE_GUIDE } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ProductCard } from './product-card';
import { WishlistButton } from './wishlist-button';
import { RecentlyViewed } from './recently-viewed';
import { useRecordRecentlyViewed } from '@/lib/recently-viewed';
import { track } from '@/lib/analytics';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = (v: string | number) => String(v).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
// "2-4 أيام عمل" → "٢–٤ أيام عمل"
const DELIVERY_DAYS = toArabicDigits(BRAND_CONFIG.shipping.defaultDeliveryDays).replace('-', '–');

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { addItem, items } = useCart();

  // الصفحة متكاشة (ممكن تكون قديمة بدقيقة)، فبنجيب المخزون الحقيقي أول ما
  // تفتح عشان العميلة متشوفش مقاس متاح وهو خلص.
  const [variants, setVariants] = useState(product.variants ?? []);
  useEffect(() => {
    let active = true;
    setVariants(product.variants ?? []);
    restSelect<ProductVariant>('product_variants', `select=*&product_id=eq.${encodeURIComponent(product.id)}`).then((data) => {
      if (active && data) setVariants(data);
    });
    return () => {
      active = false;
    };
  }, [product.id, product.variants]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  // بقت رسالة تحت الاختيارات بدل toast: بتظهر بس بعد ما العميلة تدوس "أضيفي" من غير اختيار
  const [triedWithoutSelection, setTriedWithoutSelection] = useState(false);
  const selectionRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useRecordRecentlyViewed(product);
  useEffect(() => {
    track('ViewContent', {
      content_ids: [product.id],
      content_type: 'product',
      content_name: product.title_ar,
      value: product.sale_price_egp ?? product.price_egp,
    });
  }, [product.id, product.title_ar, product.sale_price_egp, product.price_egp]);

  const imageCount = product.images.length;
  const showImage = (i: number) => setActiveImage((i + imageCount) % imageCount);

  // سحب الصورة يمين/شمال على الموبايل بيقلّب بين الصور
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || imageCount < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    // الصفحة RTL: السحب لليمين = الصورة اللي بعدها
    showImage(activeImage + (dx > 0 ? 1 : -1));
  };

  const effectivePrice = product.sale_price_egp ?? product.price_egp;
  const discount = discountPercent(product.price_egp, product.sale_price_egp);

  const sizes = [...new Set(variants?.map((v) => v.size) ?? [])];
  const colors = Array.from(new Map((variants ?? []).map((v) => [v.color_ar, v])).values());

  const availableVariant = variants?.find(
    (v) => v.size === selectedSize && v.color_ar === selectedColor
  );
  const stock = availableVariant?.stock_quantity ?? 0;
  const inCart = items.find((i) => i.variant.id === availableVariant?.id)?.quantity ?? 0;
  // المتاح للإضافة = المخزون - اللي في السلة أصلاً
  const canAdd = Math.max(0, stock - inCart);
  const inStock = stock > 0;
  // إجمالي المخزون الحقيقي لكل المقاسات - لجملة "متبقي X قطع" قبل الاختيار
  const totalStock = (variants ?? []).reduce((n, v) => n + Math.max(0, v.stock_quantity), 0);

  // لما المقاس/اللون يتغير، الكمية متعديش المتاح
  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, canAdd || 1)));
  }, [canAdd]);

  const missingSelection =
    !selectedColor && colors.length > 0 && !selectedSize && sizes.length > 0
      ? 'اختاري اللون والمقاس الأول'
      : !selectedColor && colors.length > 0
        ? 'اختاري اللون الأول'
        : !selectedSize && sizes.length > 0
          ? 'اختاري المقاس الأول'
          : null;
  const selectionMessage = triedWithoutSelection ? missingSelection : null;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      setTriedWithoutSelection(true);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      selectionRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    if (!availableVariant || !inStock) {
      toast.error('هذا المقاس واللون غير متوفر حالياً');
      return;
    }
    const result = addItem(product, availableVariant, qty);
    if (result.added === 0) {
      toast.error(`عندك ${result.inCart} في السلة، ودي كل الكمية المتاحة من المقاس ده`);
    } else if (result.added < qty) {
      toast.warning(`اتضاف ${result.added} بس - المتاح ${result.available} وكلهم دلوقتي في سلتك`);
    } else {
      toast.success('تمت الإضافة إلى السلة');
    }
  };

  const buildWhatsAppMessage = () => {
    const msg = `مرحباً، أرغب في طلب:\n${product.title_ar}\nالمقاس: ${selectedSize ?? '—'}\nاللون: ${selectedColor ?? '—'}\nالكمية: ${qty}\nالسعر: ${priceEGP(effectivePrice)} ج.م`;
    return `https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
  };

  // سطر الندرة: هادي (نقطة برونز صغيرة، من غير أحمر) ويظهر بس لما المخزون الحقيقي ≤ ٣
  const scarcityText =
    selectedSize && selectedColor
      ? inStock && canAdd === 0
        ? null
        : inStock && stock <= 3
          ? stock === 1
            ? 'آخر قطعة متاحة من المقاس ده'
            : `متبقي ${toArabicDigits(stock)} قطع فقط من المقاس ده`
          : null
      : totalStock > 0 && totalStock <= 3
        ? totalStock === 1
          ? 'آخر قطعة متاحة'
          : `متبقي ${toArabicDigits(totalStock)} قطع فقط`
        : null;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav aria-label="مسار التصفح" className="hidden sm:flex items-center gap-2 text-[13px] font-arabic text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3" aria-hidden="true" />
          <Link href="/shop" className="hover:text-foreground transition-colors">المتجر</Link>
          <ChevronLeft className="w-3 h-3" aria-hidden="true" />
          <span className="text-foreground line-clamp-1" aria-current="page">{product.title_ar}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          {/* Gallery - على الموبايل بعرض الشاشة كله */}
          <div className="-mx-4 sm:mx-0 flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails - ديسكتوب بس */}
            {product.images.length > 1 && (
              <div className="hidden lg:flex lg:flex-col gap-3 lg:max-h-[640px] lg:overflow-y-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`عرض الصورة ${toArabicDigits(i + 1)}`}
                    aria-current={i === activeImage ? 'true' : undefined}
                    className={cn(
                      'relative w-20 h-[106px] shrink-0 overflow-hidden border transition-[opacity,border-color]',
                      i === activeImage ? 'border-foreground' : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Main image */}
            <div className="relative flex-1">
            <button
              type="button"
              aria-label="تكبير الصورة"
              className="relative block w-full aspect-[3/4] overflow-hidden bg-muted group cursor-zoom-in"
              onClick={() => setZoomOpen(true)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {product.images[activeImage] && (
                <Image
                  src={product.images[activeImage]}
                  alt={product.title_ar}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-luxury motion-safe:lg:group-hover:scale-[1.03]"
                />
              )}
              <span className="absolute bottom-4 left-4 w-9 h-9 bg-background/85 flex items-center justify-center" aria-hidden="true">
                <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
              </span>
              {imageCount > 1 && (
                <span className="lg:hidden absolute bottom-5 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
                  {product.images.map((_, i) => (
                    <span key={i} className={cn('h-[3px] transition-[width,background-color] duration-300', i === activeImage ? 'w-5 bg-foreground' : 'w-2 bg-foreground/30')} />
                  ))}
                </span>
              )}
            </button>
              {/* المفضلة على الصورة في الموبايل (على الديسكتوب زرار كامل تحت) - جنب زرار التكبير مش جواه */}
              <WishlistButton product={product} className="sm:hidden absolute top-2 left-2 z-10" />
            </div>
          </div>

          {/* Info */}
          <div className="lg:py-4">
            {product.category && (
              <Link href={`/shop/${encodeURIComponent(product.category.slug)}`} className="font-arabic text-[13px] text-accent-text hover:text-foreground transition-colors">
                {product.category.name_ar}
              </Link>
            )}
            <h1 className="font-display text-[26px] sm:text-4xl font-medium leading-[1.3] mt-1 mb-3 text-balance">{product.title_ar}</h1>

            <div className="flex items-baseline flex-wrap gap-x-3 font-arabic tabular-nums">
              <span className="text-[22px] sm:text-2xl font-medium text-foreground">{priceEGP(effectivePrice)} ج.م</span>
              {discount && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    <span className="sr-only">بدلاً من </span>
                    {priceEGP(product.price_egp)} ج.م
                  </span>
                  <span className="text-sm text-foreground/70">وفّري {toArabicDigits(discount)}٪</span>
                </>
              )}
            </div>

            {scarcityText && (
              <p className="mt-3 font-arabic text-sm text-foreground/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                {scarcityText}
              </p>
            )}

            <div ref={selectionRef} className="mt-7 scroll-mt-28">
              {/* Color selection */}
              {colors.length > 0 && (
                <fieldset className="mb-6">
                  <legend className="font-arabic text-sm mb-3">
                    <span className="font-medium">اللون:</span>{' '}
                    <span className="text-foreground/70">{selectedColor ?? 'اختاري اللون'}</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.color_ar)}
                        aria-pressed={selectedColor === c.color_ar}
                        className={cn(
                          'flex items-center gap-2 h-11 px-3.5 border transition-colors duration-200',
                          selectedColor === c.color_ar ? 'border-foreground' : 'border-border hover:border-foreground/40'
                        )}
                      >
                        <span
                          className={cn('w-4 h-4 rounded-full border border-border', !c.color_hex && 'bg-muted')}
                          style={c.color_hex ? { backgroundColor: c.color_hex } : undefined}
                          aria-hidden="true"
                        />
                        <span className="font-arabic text-sm">{c.color_ar}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Size selection */}
              {sizes.length > 0 && (
                <fieldset className="mb-4">
                  <legend className="sr-only">المقاس</legend>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-arabic text-sm font-medium" aria-hidden="true">المقاس</span>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="flex items-center gap-1.5 font-arabic text-[13px] text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-[text-decoration-color] py-2 -my-2"
                    >
                      <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                      دليل المقاسات
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const variant = variants?.find((v) => v.size === size && v.color_ar === selectedColor);
                      const available = variant ? variant.stock_quantity > 0 : variants?.some((v) => v.size === size && v.stock_quantity > 0);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          disabled={!available}
                          aria-pressed={selectedSize === size}
                          aria-label={available ? `مقاس ${size}` : `مقاس ${size} - غير متوفر`}
                          className={cn(
                            'min-w-12 h-12 px-3 border font-body text-sm transition-colors duration-200 num-rtl',
                            selectedSize === size ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground/80 hover:border-foreground/40',
                            !available && 'opacity-30 line-through cursor-not-allowed'
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* رسالة الاختيار الناقص (بدل الـ toast) + حالة المخزون للاختيار الحالي */}
              <div aria-live="polite" className="min-h-[1.75rem] font-arabic text-sm">
                {selectionMessage ? (
                  <p className="text-foreground font-medium">{selectionMessage}</p>
                ) : selectedSize && selectedColor && inStock && canAdd === 0 ? (
                  <p className="inline-flex items-center gap-2 text-foreground/70">
                    <Check className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    كل الكمية المتاحة ({toArabicDigits(stock)}) في سلتك
                  </p>
                ) : selectedSize && selectedColor && !inStock ? (
                  <p className="text-foreground/70">نفدت الكمية من المقاس واللون دول</p>
                ) : null}
              </div>
            </div>

            {/* Quantity - ديسكتوب بس؛ على الموبايل الكمية ١ ويتعدل من السلة */}
            <div className="hidden sm:block mt-4 mb-6">
              <span className="font-arabic text-sm font-medium block mb-3" id="qty-label">الكمية</span>
              <div className="flex items-center border border-border w-fit" role="group" aria-labelledby="qty-label">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 hover:bg-muted transition-colors font-body"
                  aria-label="إنقاص"
                >
                  −
                </button>
                <span className="font-arabic w-12 text-center tabular-nums" aria-live="polite">{toArabicDigits(qty)}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(q + 1, Math.max(1, canAdd)))}
                  disabled={!!availableVariant && qty >= canAdd}
                  className="w-11 h-11 hover:bg-muted transition-colors font-body disabled:opacity-30"
                  aria-label="زيادة"
                >
                  +
                </button>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex flex-col gap-3 mb-5">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full h-14 bg-foreground text-background font-arabic text-[15px] hover:bg-foreground/85 transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
                أضيفي إلى السلة
              </button>
              <WishlistButton product={product} variant="full" />
              <a
                href={buildWhatsAppMessage()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 font-arabic text-sm text-foreground/80 hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                أو اطلبي عبر واتساب
              </a>
            </div>

            {/* سطر التوصيل */}
            <p className="mt-5 sm:mt-0 font-arabic text-sm text-foreground/80 flex items-center gap-2">
              <Truck className="w-4 h-4 text-accent-text shrink-0" strokeWidth={1.5} aria-hidden="true" />
              يصلكِ خلال {DELIVERY_DAYS}
              {BRAND_CONFIG.shipping.allowInspectionOnDelivery && ' • معاينة قبل الدفع'}
            </p>

            {/* Trust badges */}
            <ul className="hidden sm:grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
              <li className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-accent-text shrink-0" strokeWidth={1.25} aria-hidden="true" />
                <span className="font-arabic text-[13px] text-foreground/75">معاينة قبل الدفع</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-accent-text shrink-0" strokeWidth={1.25} aria-hidden="true" />
                <span className="font-arabic text-[13px] text-foreground/75">شحن لكل المحافظات</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-accent-text shrink-0" strokeWidth={1.25} aria-hidden="true" />
                <span className="font-arabic text-[13px] text-foreground/75">خامة تركية فاخرة</span>
              </li>
            </ul>

            {/* تفاصيل المنتج - أكورديون (details/summary من غير JS) */}
            <div className="mt-8 border-t border-border">
              <AccordionItem title="تفاصيل المنتج" defaultOpen>
                {product.description_ar && <p className="whitespace-pre-line">{product.description_ar}</p>}
                {product.fabric_details_ar && (
                  <p className="flex items-center gap-2 mt-3">
                    <Sparkles className="w-4 h-4 text-accent-text shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    الخامة: {product.fabric_details_ar}
                  </p>
                )}
                {product.is_turkish_import && <p className="mt-3">صناعة تركية أصلية</p>}
              </AccordionItem>
              <AccordionItem title="المقاس والقياس">
                <p>المقاسات تركية. لو مترددة بين مقاسين، ننصح بالمقاس الأكبر للعبايات والفساتين الواسعة.</p>
                <button type="button" onClick={() => setSizeGuideOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-foreground underline underline-offset-4">
                  <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  افتحي جدول المقاسات
                </button>
              </AccordionItem>
              <AccordionItem title="التوصيل والدفع">
                <ul className="space-y-2">
                  <li>التوصيل لكل محافظات مصر خلال {BRAND_CONFIG.shipping.defaultDeliveryDays}.</li>
                  {BRAND_CONFIG.shipping.allowInspectionOnDelivery && <li>تقدري تعايني الطلب قبل ما تدفعي.</li>}
                  <li>الدفع عند الاستلام أو بفودافون كاش.</li>
                  <li>لأي استفسار عن الاستبدال، تواصلي معنا على واتساب.</li>
                </ul>
              </AccordionItem>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16 lg:mt-28" aria-labelledby="related-title">
            <h2 id="related-title" className="font-display text-2xl sm:text-3xl font-medium leading-[1.3] mb-8 lg:mb-12">قد يعجبك أيضاً</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 lg:gap-x-8">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <RecentlyViewed excludeId={product.id} />

      {/* Mobile sticky bar: السعر جنب زرار الإضافة. data-sticky-bar بيخلي الفوتر
          ياخد مسافة تحت (globals.css) عشان الشريط مايغطيش آخره. */}
      <div
        data-sticky-bar
        className="sm:hidden fixed bottom-0 right-0 left-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center gap-3"
      >
        <div className="shrink-0 font-arabic tabular-nums leading-tight">
          <p className="text-base font-medium text-foreground">{priceEGP(effectivePrice)} ج.م</p>
          {discount && <p className="text-[13px] text-muted-foreground line-through">{priceEGP(product.price_egp)} ج.م</p>}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 min-w-0 h-12 bg-foreground text-background font-arabic text-[15px] flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          أضيفي للسلة
        </button>
        <a
          href={buildWhatsAppMessage()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-12 border border-border text-foreground flex items-center justify-center shrink-0"
          aria-label="اطلبي عبر واتساب"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
        </a>
      </div>

      {/* عرض الصور بالحجم الكامل (تقدري تعملي zoom بإصبعين على الموبايل) */}
      {zoomOpen && (
        <ImageLightbox
          images={product.images}
          alt={product.title_ar}
          index={activeImage}
          onIndexChange={showImage}
          onClose={() => setZoomOpen(false)}
        />
      )}

      {/* Size guide modal */}
      {sizeGuideOpen && <SizeGuide onClose={() => setSizeGuideOpen(false)} />}
    </>
  );
}

function SizeGuide({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-foreground/50 fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        className="relative bg-background max-w-2xl w-full max-h-[85vh] overflow-y-auto overscroll-contain p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+24px)] fade-in"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="size-guide-title" className="font-display text-2xl font-medium leading-[1.3]">دليل المقاسات التركية</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="إغلاق" className="w-11 h-11 -ml-3 inline-flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <p className="font-arabic text-sm text-foreground/75 mb-5">
          المقاسات التركية مقاسة بالسنتيمتر. للحصول على أفضل قياس، قارني بمقاس ملابسك المفضلة.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="font-arabic text-right py-3 px-2 font-medium text-muted-foreground">تركي</th>
                <th className="font-arabic text-right py-3 px-2 font-medium text-muted-foreground">دولي</th>
                <th className="font-arabic text-right py-3 px-2 font-medium text-muted-foreground">الصدر (سم)</th>
                <th className="font-arabic text-right py-3 px-2 font-medium text-muted-foreground">الخصر (سم)</th>
                <th className="font-arabic text-right py-3 px-2 font-medium text-muted-foreground">الأرداف (سم)</th>
              </tr>
            </thead>
            <tbody>
              {TURKISH_SIZE_GUIDE.map((row) => (
                <tr key={row.turkish} className="border-b border-border/60">
                  <td className="font-body py-3 px-2 num-rtl font-medium tabular-nums">{row.turkish}</td>
                  <td className="font-body py-3 px-2 num-rtl">{row.eu}</td>
                  <td className="font-body py-3 px-2 num-rtl tabular-nums">{row.chest}</td>
                  <td className="font-body py-3 px-2 num-rtl tabular-nums">{row.waist}</td>
                  <td className="font-body py-3 px-2 num-rtl tabular-nums">{row.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-arabic text-[13px] text-muted-foreground mt-5">
          للمساعدة في اختيار المقاس المناسب، تواصلي معنا عبر واتساب.
        </p>
      </div>
    </div>
  );
}

function AccordionItem({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border" open={defaultOpen}>
      <summary className="flex items-center justify-between py-4 min-h-[44px] cursor-pointer list-none font-arabic text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <Plus className="w-4 h-4 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.5} aria-hidden="true" />
      </summary>
      <div className="pb-5 font-arabic text-[15px] text-foreground/75 leading-[1.85]">{children}</div>
    </details>
  );
}

function ImageLightbox({
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // الـ focus بيروح لزرار الإغلاق أول ما العرض يفتح (مرة واحدة)
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndexChange(index + 1);
      if (e.key === 'ArrowRight') onIndexChange(index - 1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [index, onClose, onIndexChange]);

  return (
    <div className="fixed inset-0 z-[90] bg-background overscroll-contain fade-in" role="dialog" aria-modal="true" aria-label={alt}>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="إغلاق" className="absolute top-4 left-4 z-10 w-11 h-11 bg-background/90 flex items-center justify-center">
        <X className="w-6 h-6" strokeWidth={1.25} />
      </button>
      <div className="relative w-full h-full">
        <Image src={images[index]} alt={alt} fill sizes="100vw" quality={90} className="object-contain" />
      </div>
      {images.length > 1 && (
        <>
          <button type="button" onClick={() => onIndexChange(index - 1)} aria-label="السابق" className="absolute top-1/2 right-3 -translate-y-1/2 w-11 h-11 bg-background/90 flex items-center justify-center">
            <ChevronRight className="w-6 h-6" strokeWidth={1.25} />
          </button>
          <button type="button" onClick={() => onIndexChange(index + 1)} aria-label="التالي" className="absolute top-1/2 left-3 -translate-y-1/2 w-11 h-11 bg-background/90 flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" strokeWidth={1.25} />
          </button>
          <p className="absolute bottom-5 inset-x-0 text-center font-arabic text-sm tabular-nums" aria-live="polite">
            {toArabicDigits(index + 1)} / {toArabicDigits(images.length)}
          </p>
        </>
      )}
    </div>
  );
}
