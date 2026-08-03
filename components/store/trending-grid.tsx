import Link from 'next/link';
import { ProductCard } from '@/components/store/product-card';
import type { Product } from '@/lib/types';
import { ChevronLeft } from 'lucide-react';

export function TrendingGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="flex items-end justify-between mb-12">
        <div>
          <span className="font-body text-xs tracking-[0.3em] uppercase text-accent">Trending</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold mt-2">الأكثر رواجاً</h2>
          <p className="font-arabic text-muted-foreground mt-3 max-w-md">قطع مختارة بعناية من أرقى الموديلات التركية الفاخرة</p>
        </div>
        <Link href="/shop" className="hidden sm:flex items-center gap-2 font-arabic text-sm text-foreground/70 hover:text-accent transition-colors group">
          عرض الكل
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8">
        {products.map((product, i) => (
          <div key={product.id} className="fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="sm:hidden mt-10 text-center">
        <Link href="/shop" className="inline-flex items-center gap-2 font-arabic text-sm text-accent">
          عرض كل المنتجات
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
