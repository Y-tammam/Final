"use client";

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/store/product-card';
import type { Product, Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-asc', label: 'السعر: الأقل أولاً' },
  { value: 'price-desc', label: 'السعر: الأعلى أولاً' },
];

export function ShopContent({
  products,
  categories,
  activeCategory,
}: {
  products: Product[];
  categories: Category[];
  activeCategory?: string;
}) {
  const [filter, setFilter] = useState<string>(activeCategory ?? 'all');
  const [sort, setSort] = useState('newest');

  const filtered = useMemo(() => {
    let result = filter === 'all' ? products : products.filter((p) => p.category?.slug === filter);
    result = [...result];
    if (sort === 'price-asc') {
      result.sort((a, b) => (a.sale_price_egp ?? a.price_egp) - (b.sale_price_egp ?? b.price_egp));
    } else if (sort === 'price-desc') {
      result.sort((a, b) => (b.sale_price_egp ?? b.price_egp) - (a.sale_price_egp ?? a.price_egp));
    }
    return result;
  }, [products, filter, sort]);

  const chip = (active: boolean) =>
    cn(
      'shrink-0 snap-start font-arabic text-sm h-11 px-5 rounded-full border transition-colors duration-300',
      active ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground/75 hover:border-foreground/50 hover:text-foreground'
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      {/* Filters bar - على الموبايل الفئات صف واحد بيتسحب بالعرض */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-12">
        <div
          role="group"
          aria-label="تصفية حسب الفئة"
          className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:flex-wrap items-center gap-2 overflow-x-auto sm:overflow-visible snap-x scroll-px-4 overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button type="button" onClick={() => setFilter('all')} aria-pressed={filter === 'all'} className={chip(filter === 'all')}>
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.slug)}
              aria-pressed={filter === cat.slug}
              className={chip(filter === cat.slug)}
            >
              {cat.name_ar}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <p className="sm:hidden font-arabic text-sm text-muted-foreground" aria-live="polite">
            {filtered.length.toLocaleString('ar-EG')} منتج
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="font-arabic text-sm text-muted-foreground">
              ترتيب
            </label>
            <select
              id="shop-sort"
              name="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="font-arabic text-sm bg-background border border-border h-11 px-3"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="hidden sm:block font-arabic text-sm text-muted-foreground mb-6" aria-live="polite">
        {filtered.length.toLocaleString('ar-EG')} منتج
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-arabic text-foreground">مفيش منتجات في الفئة دي دلوقتي</p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-4 font-arabic text-sm text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-[text-decoration-color]"
          >
            عرض كل المنتجات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 lg:gap-x-8 lg:gap-y-14">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

// الصفحة نفسها بقت ثابتة (بتتكاش) عشان مبتقراش searchParams على السيرفر.
// الفئة المختارة من الرابط (?category=...) بتتقري هنا في المتصفح.
function ShopContentFromUrl(props: { products: Product[]; categories: Category[] }) {
  const category = useSearchParams().get('category') ?? undefined;
  return <ShopContent key={category ?? 'all'} {...props} activeCategory={category} />;
}

export function ShopContentWithUrlFilter(props: { products: Product[]; categories: Category[] }) {
  return (
    <Suspense fallback={<ShopContent {...props} />}>
      <ShopContentFromUrl {...props} />
    </Suspense>
  );
}
