"use client";

import { useState, useMemo } from 'react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'font-arabic text-sm px-4 py-2 rounded-full border transition-all',
              filter === 'all' ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border text-foreground/70 hover:border-accent'
            )}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.slug)}
              className={cn(
                'font-arabic text-sm px-4 py-2 rounded-full border transition-all',
                filter === cat.slug ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border text-foreground/70 hover:border-accent'
              )}
            >
              {cat.name_ar}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-arabic text-xs text-muted-foreground">ترتيب:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="font-arabic text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="font-arabic text-sm text-muted-foreground mb-6">{filtered.length} منتج</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-arabic text-muted-foreground">لا توجد منتجات في هذه الفئة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8">
          {filtered.map((product, i) => (
            <div key={product.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
