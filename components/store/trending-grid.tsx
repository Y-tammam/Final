import Link from 'next/link';
import { ProductCard } from '@/components/store/product-card';
import type { Product } from '@/lib/types';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// ٤ قطع على الموبايل و٨ على الديسكتوب
export function TrendingGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28" aria-labelledby="trending-title">
      <div className="flex items-end justify-between gap-6 mb-10 lg:mb-14">
        <div>
          <h2 id="trending-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.3]">
            الأكثر رواجاً
          </h2>
          <p className="font-arabic text-muted-foreground mt-3 max-w-md">قطع مختارة بعناية من أرقى الموديلات التركية</p>
        </div>
        <Link
          href="/shop"
          className="hidden sm:inline-flex shrink-0 items-center gap-1.5 font-arabic text-sm text-foreground/70 hover:text-foreground transition-colors py-2"
        >
          عرض الكل
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 lg:gap-x-8 lg:gap-y-14">
        {products.slice(0, 8).map((product, i) => (
          <div key={product.id} className={cn(i >= 4 && 'hidden lg:block')}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="sm:hidden mt-10 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center h-12 px-10 border border-foreground font-arabic text-[15px] text-foreground hover:bg-foreground hover:text-background transition-colors duration-300"
        >
          عرض كل المنتجات
        </Link>
      </div>
    </section>
  );
}
