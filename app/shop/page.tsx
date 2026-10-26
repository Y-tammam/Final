import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ShopContentWithUrlFilter } from '@/components/store/shop-content';
import { getAllProducts, getCategories } from '@/lib/data';

export const revalidate = 60;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);

  return (
    <StorefrontLayout>
      <div className="bg-secondary/40 py-10 lg:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-medium leading-[1.3]">المتجر</h1>
          <p className="font-arabic text-muted-foreground mt-3 max-w-md mx-auto">اكتشفي تشكيلتنا الكاملة من الأزياء التركية الفاخرة</p>
        </div>
      </div>
      <ShopContentWithUrlFilter products={products} categories={categories} />
    </StorefrontLayout>
  );
}
