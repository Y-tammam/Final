import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ShopContent } from '@/components/store/shop-content';
import { getAllProducts, getCategories } from '@/lib/data';

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const activeCategory = searchParams.category;

  return (
    <StorefrontLayout>
      <div className="bg-secondary/40 py-12 lg:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="font-body text-xs tracking-[0.3em] uppercase text-accent">Collection</span>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-2">المتجر</h1>
          <p className="font-arabic text-muted-foreground mt-3">اكتشفي تشكيلتنا الكاملة من الأزياء التركية الفاخرة</p>
        </div>
      </div>
      <ShopContent products={products} categories={categories} activeCategory={activeCategory} />
    </StorefrontLayout>
  );
}
