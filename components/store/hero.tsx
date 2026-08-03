"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

export function Hero() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  // جلب المنتجات التي تحتوي على is_featured = true
  useEffect(() => {
    async function fetchFeatured() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data && data.length > 0) {
        setFeaturedProducts(data as Product[]);
      }
      setLoading(false);
    }

    fetchFeatured();
  }, []);

  // التبديل التلقائي بين السلايدات
  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % featuredProducts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredProducts.length]);

  const goTo = (i: number) => setActive(i);
  const next = () => setActive((prev) => (prev + 1) % featuredProducts.length);
  const prev = () => setActive((p) => (p - 1 + featuredProducts.length) % featuredProducts.length);

  if (loading) {
    return <div className="h-[85vh] min-h-[560px] bg-foreground animate-pulse" />;
  }

  // إذا لم يكن هناك منتجات مميزة، لا يعرض شيئاً أو يمكنك إضافة خيار افتراضي
  if (featuredProducts.length === 0) return null;

  return (
    <section className="relative h-[85vh] min-h-[560px] max-h-[760px] overflow-hidden bg-foreground">
      {featuredProducts.map((product, i) => {
        const imageUrl = product.images?.[0] || '/placeholder.jpg';
        return (
          <div
            key={product.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-luxury',
              i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <Image
              src={imageUrl}
              alt={product.title_ar}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-foreground/20" />
            <div className="absolute inset-0 bg-gradient-to-l from-foreground/40 to-transparent" />

            <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-8 flex items-center">
              <div
                className={cn(
                  'max-w-xl transition-all duration-1000 ease-luxury mr-0 ml-auto text-right',
                  i === active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
              >
                <span className="inline-block text-accent text-xs sm:text-sm tracking-[0.3em] uppercase font-body mb-4">
                  {BRAND_CONFIG.nameArabic}
                </span>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-semibold text-primary-foreground leading-[1.1] mb-5 text-balance">
                  {product.title_ar}
                </h1>
                <p className="font-arabic text-primary-foreground/85 text-base sm:text-lg leading-relaxed mb-8 max-w-md line-clamp-2">
                  {product.description_ar || 'اكتشفي أرقى المنتجات الفاخرة بخامات ممتازة'}
                </p>
                <Link
                  href={`/product/${product.slug}`}
                  className="inline-flex items-center gap-3 bg-background text-foreground font-arabic px-8 py-4 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all duration-400 group"
                >
                  تسوقي المنتج
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* الأسهم */}
      {featuredProducts.length > 1 && (
        <>
          <button onClick={prev} aria-label="السابق" className="absolute top-1/2 right-4 -translate-y-1/2 w-11 h-11 rounded-full glass-dark text-primary-foreground flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all z-10">
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button onClick={next} aria-label="التالي" className="absolute top-1/2 left-4 -translate-y-1/2 w-11 h-11 rounded-full glass-dark text-primary-foreground flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all z-10">
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* النقاط */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {featuredProducts.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`شريحة ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  i === active ? 'w-8 bg-accent' : 'w-1.5 bg-primary-foreground/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
