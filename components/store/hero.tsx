"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

const AUTOPLAY_MS = 6000;

// المنتجات المميزة بتيجي من السيرفر (app/page.tsx) جاهزة مع الـ HTML.
// قبل كده الهيرو كان بيجيبها من المتصفح بعد تحميل الجافاسكربت، فأكبر صورة
// في الصفحة (LCP) كانت بتستنى JS + طلب لقاعدة البيانات قبل ما تبدأ تتحمل.
//
// الـ h1 بتاع الصفحة موجود في app/page.tsx (sr-only)، فعناوين السلايدات h2.
// التبديل التلقائي بيقف لما الماوس/الـ focus يكون جوه الهيرو، أو لو العميلة
// لمست الشاشة، أو لو الجهاز مفعّل "تقليل الحركة"، وفيه زرار إيقاف/تشغيل.
export function Hero({ products: featuredProducts }: { products: Product[] }) {
  const count = featuredProducts.length;
  const [active, setActive] = useState(0);
  // صور السلايدات بتتحمل لما ييجي دورها بس (السلايد الحالي + اللي بعده).
  // قبل كده الخمس صور كانوا بيتحملوا مع بعض وبيزاحموا أول صورة (LCP).
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => {
    if (count < 2) return;
    setSeen((prev) => {
      const next = (active + 1) % count;
      if (prev.has(active) && prev.has(next)) return prev;
      return new Set(prev).add(active).add(next);
    });
  }, [active, count]);
  // autoplay = اختيار العميلة (الزرار)، interacting = الماوس/الـ focus جوه الهيرو
  const [autoplay, setAutoplay] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // "تقليل الحركة" مفعّل على الجهاز → العرض التلقائي بيبدأ متوقف (وتقدر تشغّله بالزرار)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAutoplay(false);
  }, []);

  const playing = count > 1 && autoplay && !interacting;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [playing, count]);

  const next = useCallback(() => setActive((p) => (p + 1) % count), [count]);
  const prev = useCallback(() => setActive((p) => (p - 1 + count) % count), [count]);

  if (count === 0) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    // اللمس = العميلة بتتفرج بنفسها، فبنوقف التبديل التلقائي
    setAutoplay(false);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    // الصفحة RTL: السحب لليمين = السلايد اللي بعده
    if (dx > 0) next();
    else prev();
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="تشكيلة مختارة"
      className="relative h-[78svh] min-h-[520px] sm:h-[85vh] sm:min-h-[560px] max-h-[780px] overflow-hidden bg-foreground"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInteracting(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {featuredProducts.map((product, i) => {
        const imageUrl = product.images?.[0] || '/placeholder.jpg';
        const isActive = i === active;
        return (
          <div
            key={product.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} من ${count}`}
            aria-hidden={!isActive}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-luxury',
              isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {/* أول صورة بس priority (preload)، والباقي بيتحمل لما ييجي دوره */}
            {seen.has(i) && (
            <Image
              src={imageUrl}
              alt={product.title_ar}
              fill
              priority={i === 0}
              sizes="100vw"
              quality={70}
              className="object-cover"
            />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/25 to-foreground/10" />

            <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-8 flex items-end pb-24 sm:pb-28">
              <div
                className={cn(
                  'max-w-xl text-right transition-[opacity,transform] duration-1000 ease-luxury',
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
              >
                <h2 className="font-display text-[34px] sm:text-5xl lg:text-6xl font-medium text-primary-foreground leading-[1.3] mb-4 text-balance">
                  {product.title_ar}
                </h2>
                <p className="font-arabic text-primary-foreground/85 text-base sm:text-lg leading-[1.75] mb-8 max-w-md line-clamp-2">
                  {product.description_ar || 'قطع مختارة بخامات تركية، تصلكِ لباب البيت مع معاينة قبل الدفع'}
                </p>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <Link
                    href="/shop"
                    tabIndex={isActive ? undefined : -1}
                    className="inline-flex items-center gap-3 bg-background text-foreground font-arabic text-[15px] px-8 h-12 hover:bg-foreground hover:text-background transition-colors duration-300"
                  >
                    تسوّقي التشكيلة
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/product/${product.slug}`}
                    tabIndex={isActive ? undefined : -1}
                    className="font-arabic text-[15px] text-primary-foreground underline decoration-primary-foreground/40 underline-offset-8 hover:decoration-primary-foreground transition-[text-decoration-color] duration-300"
                  >
                    شاهدي القطعة
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          {/* الأسهم - ديسكتوب بس؛ على الموبايل السحب والنقاط */}
          <button
            type="button"
            onClick={prev}
            aria-label="السابق"
            className="hidden sm:flex absolute top-1/2 right-4 -translate-y-1/2 w-11 h-11 text-primary-foreground/80 items-center justify-center hover:text-primary-foreground transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={1.25} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="التالي"
            className="hidden sm:flex absolute top-1/2 left-4 -translate-y-1/2 w-11 h-11 text-primary-foreground/80 items-center justify-center hover:text-primary-foreground transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={1.25} />
          </button>

          {/* النقاط + إيقاف/تشغيل */}
          <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-10">
            <div className="max-w-7xl mx-auto px-3 lg:px-5 flex items-center">
              {featuredProducts.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`عرض الشريحة ${i + 1}`}
                  aria-current={i === active ? 'true' : undefined}
                  className="w-11 h-11 flex items-center justify-center group"
                >
                  <span
                    className={cn(
                      'block h-px w-7 transition-colors duration-500',
                      i === active ? 'bg-primary-foreground' : 'bg-primary-foreground/35 group-hover:bg-primary-foreground/70'
                    )}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAutoplay((a) => !a)}
                aria-label={autoplay ? 'إيقاف العرض التلقائي' : 'تشغيل العرض التلقائي'}
                className="w-11 h-11 mr-1 flex items-center justify-center text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                {autoplay ? (
                  <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
                ) : (
                  <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
