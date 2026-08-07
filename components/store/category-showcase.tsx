import Link from 'next/link';
import Image from 'next/image';
import type { Category, Product } from '@/lib/types';
import { ChevronLeft } from 'lucide-react';

const CATEGORY_IMAGES: Record<string, string> = {
  abayas: "https://images.pexels.com/photos/13838842/pexels-photo-13838842.jpeg?auto=compress&cs=tinysrgb&w=900",
  dresses: "https://images.pexels.com/photos/37607882/pexels-photo-37607882.jpeg?auto=compress&cs=tinysrgb&w=900",
  casual: "https://images.pexels.com/photos/18885255/pexels-photo-18885255.jpeg?auto=compress&cs=tinysrgb&w=900",
};

export function CategoryShowcase({ categories, products }: { categories: Category[]; products: Product[] }) {
  const countFor = (slug: string) => products.filter((p) => p.category?.slug === slug).length;

  return (
    <section className="bg-secondary/50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="font-body text-xs tracking-[0.3em] uppercase text-accent">Collections</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold mt-2">تسوقي حسب الفئة</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-foreground fade-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {(cat.image_url || CATEGORY_IMAGES[cat.slug]) && (
                <Image
                  src={cat.image_url || CATEGORY_IMAGES[cat.slug]}
                  alt={cat.name_ar}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-luxury"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 right-0 left-0 p-8 text-center">
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-primary-foreground mb-2">
                  {cat.name_ar}
                </h3>
                <p className="font-arabic text-primary-foreground/70 text-sm mb-4">
                  {countFor(cat.slug)} منتج
                </p>
                <span className="inline-flex items-center gap-2 font-arabic text-sm text-accent group-hover:gap-3 transition-all">
                  تسوقي الآن
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
