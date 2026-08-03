"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, MessageCircle, Ruler, Check, ChevronLeft, Truck, Eye, Sparkles, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { priceEGP, discountPercent } from '@/lib/format';
import { BRAND_CONFIG, TURKISH_SIZE_GUIDE } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ProductCard } from './product-card';

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const effectivePrice = product.sale_price_egp ?? product.price_egp;
  const discount = discountPercent(product.price_egp, product.sale_price_egp);

  const sizes = [...new Set(product.variants?.map((v) => v.size) ?? [])];
  const colors = Array.from(new Map((product.variants ?? []).map((v) => [v.color_ar, v])).values());

  const availableVariant = product.variants?.find(
    (v) => v.size === selectedSize && v.color_ar === selectedColor
  );
  const inStock = availableVariant ? availableVariant.stock_quantity > 0 : false;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('الرجاء اختيار المقاس واللون');
      return;
    }
    if (!availableVariant || availableVariant.stock_quantity === 0) {
      toast.error('هذا المقاس واللون غير متوفر حالياً');
      return;
    }
    if (qty > availableVariant.stock_quantity) {
      toast.error(`الكمية المتاحة: ${availableVariant.stock_quantity}`);
      return;
    }
    addItem(product, availableVariant, qty);
    toast.success('تمت الإضافة إلى السلة');
  };

  const buildWhatsAppMessage = () => {
    const msg = `مرحباً، أرغب في طلب:\n${product.title_ar}\nالمقاس: ${selectedSize ?? '—'}\nاللون: ${selectedColor ?? '—'}\nالكمية: ${qty}\nالسعر: ${priceEGP(effectivePrice)} ج.م`;
    return `https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-arabic text-muted-foreground mb-8">
          <Link href="/" className="hover:text-accent">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3" />
          <Link href="/shop" className="hover:text-accent">المتجر</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-foreground">{product.title_ar}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex lg:flex-col gap-3 lg:max-h-[600px] lg:overflow-y-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'relative w-20 h-24 lg:w-20 lg:h-24 shrink-0 overflow-hidden rounded-sm border-2 transition-all',
                      i === activeImage ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Main image */}
            <div className="relative flex-1 aspect-[3/4] overflow-hidden rounded-sm bg-muted">
              {product.images[activeImage] && (
                <Image
                  src={product.images[activeImage]}
                  alt={product.title_ar}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
              {discount && (
                <span className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-sm">
                  -{discount}%
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="lg:py-4">
            {product.category && (
              <Link href={`/shop?category=${product.category.slug}`} className="font-arabic text-xs text-accent hover:underline">
                {product.category.name_ar}
              </Link>
            )}
            <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2 mb-3">{product.title_ar}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="font-body text-2xl font-semibold num-rtl">{priceEGP(effectivePrice)} ج.م</span>
              {discount && (
                <span className="font-body text-lg text-muted-foreground line-through num-rtl">
                  {priceEGP(product.price_egp)}
                </span>
              )}
            </div>

            <p className="font-arabic text-muted-foreground leading-relaxed mb-6">
              {product.description_ar}
            </p>

            {/* Fabric */}
            {product.fabric_details_ar && (
              <div className="flex items-center gap-2 mb-6 bg-secondary/50 rounded-sm px-4 py-3">
                <Sparkles className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                <span className="font-arabic text-sm text-foreground/80">الخامة: {product.fabric_details_ar}</span>
              </div>
            )}

            {/* Color selection */}
            {colors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-arabic text-sm font-medium">اللون: {selectedColor ?? 'اختاري اللون'}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.color_ar)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-sm border transition-all',
                        selectedColor === c.color_ar ? 'border-accent bg-accent/5' : 'border-border hover:border-foreground/40'
                      )}
                    >
                      <span
                        className={cn('w-5 h-5 rounded-full border border-border', !c.color_hex && 'bg-muted')}
                        style={c.color_hex ? { backgroundColor: c.color_hex } : undefined}
                      />
                      <span className="font-arabic text-xs">{c.color_ar}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-arabic text-sm font-medium">المقاس</span>
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="flex items-center gap-1.5 font-arabic text-xs text-accent hover:underline"
                  >
                    <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} />
                    دليل المقاسات
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {sizes.map((size) => {
                    const variant = product.variants?.find((v) => v.size === size && v.color_ar === selectedColor);
                    const available = variant ? variant.stock_quantity > 0 : product.variants?.some((v) => v.size === size && v.stock_quantity > 0);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={!available}
                        className={cn(
                          'min-w-12 h-12 px-3 rounded-sm border font-body text-sm transition-all num-rtl',
                          selectedSize === size ? 'border-accent bg-accent/5 text-foreground' : 'border-border text-foreground/70 hover:border-foreground/40',
                          !available && 'opacity-30 line-through cursor-not-allowed'
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <span className="font-arabic text-sm font-medium block mb-3">الكمية</span>
              <div className="flex items-center border border-border rounded-sm w-fit">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 hover:bg-muted transition-colors font-body"
                  aria-label="إنقاص"
                >
                  −
                </button>
                <span className="font-body w-12 text-center num-rtl">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-2.5 hover:bg-muted transition-colors font-body"
                  aria-label="زيادة"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock status */}
            {selectedSize && selectedColor && (
              <div className="mb-6">
                {inStock ? (
                  <span className="inline-flex items-center gap-2 font-arabic text-sm text-success">
                    <Check className="w-4 h-4" strokeWidth={2} />
                    متوفر — جاهز للشحن
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 font-arabic text-sm text-destructive">
                    <X className="w-4 h-4" strokeWidth={2} />
                    نفدت الكمية
                  </span>
                )}
              </div>
            )}

            {/* Desktop actions */}
            <div className="hidden sm:flex flex-col gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                className="w-full bg-foreground text-primary-foreground font-arabic py-4 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all duration-400 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                أضيفي إلى السلة
              </button>
              <a
                href={buildWhatsAppMessage()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-foreground text-foreground font-arabic py-4 rounded-sm hover:bg-foreground hover:text-primary-foreground transition-all duration-400 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
                اطلبي عبر واتساب
              </a>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-border">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
                <span className="font-arabic text-xs text-foreground/70">معاينة قبل الدفع</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
                <span className="font-arabic text-xs text-foreground/70">شحن لكل المحافظات</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
                <span className="font-arabic text-xs text-foreground/70">خامة تركية فاخرة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-10 text-center">قد يعجبك أيضاً</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky bar */}
      <div className="sm:hidden fixed bottom-0 right-0 left-0 z-40 glass border-t border-border p-3 flex items-center gap-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-foreground text-primary-foreground font-arabic py-3 rounded-sm flex items-center justify-center gap-2 text-sm"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          أضيفي للسلة
        </button>
        <a
          href={buildWhatsAppMessage()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-success/10 text-success rounded-sm flex items-center justify-center shrink-0"
          aria-label="واتساب"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
        </a>
      </div>

      {/* Size guide modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm fade-in" onClick={() => setSizeGuideOpen(false)} />
          <div className="relative bg-background rounded-sm shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-semibold">دليل المقاسات التركية</h2>
              <button onClick={() => setSizeGuideOpen(false)} aria-label="إغلاق" className="p-1.5 hover:bg-muted rounded-sm">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <p className="font-arabic text-sm text-muted-foreground mb-5">
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
                      <td className="font-body py-3 px-2 num-rtl font-medium">{row.turkish}</td>
                      <td className="font-body py-3 px-2 num-rtl">{row.eu}</td>
                      <td className="font-body py-3 px-2 num-rtl">{row.chest}</td>
                      <td className="font-body py-3 px-2 num-rtl">{row.waist}</td>
                      <td className="font-body py-3 px-2 num-rtl">{row.hips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-arabic text-xs text-muted-foreground mt-5">
              للمساعدة في اختيار المقاس المناسب، تواصلي معنا عبر واتساب.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
