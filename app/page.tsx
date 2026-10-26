import { StorefrontLayout } from '@/components/store/storefront-layout';
import { Hero } from '@/components/store/hero';
import { ValueProps } from '@/components/store/value-props';
import { NewArrivals } from '@/components/store/new-arrivals';
import { TrendingGrid } from '@/components/store/trending-grid';
import { CategoryShowcase } from '@/components/store/category-showcase';
import { AboutSection } from '@/components/store/about-section';
import { getFeaturedProducts, getCategories, getCategoryCounts, getNewArrivals } from '@/lib/data';
import { BRAND_CONFIG } from '@/lib/brand';

export const revalidate = 300;

export default async function HomePage() {
  const [featured, categories, categoryCounts, newArrivals] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getCategoryCounts(),
    getNewArrivals(8),
  ]);

  return (
    <StorefrontLayout>
      {/* عنوان الصفحة الوحيد (h1) - مخفي بصرياً لأن اللوجو والهيرو بيقوموا بالدور ده،
          لكن محركات البحث وقارئ الشاشة محتاجينه. عناوين سلايدات الهيرو h2. */}
      <h1 className="sr-only">
        {BRAND_CONFIG.nameArabic} — {BRAND_CONFIG.tagline}
      </h1>
      {/* الهيرو بياخد المنتجات المميزة من السيرفر مباشرة بدل ما يجيبها من
          المتصفح بعد تحميل الجافاسكربت - ده كان أكبر سبب لتأخير LCP. */}
      <Hero products={featured.slice(0, 5)} />
      <CategoryShowcase categories={categories} counts={categoryCounts} />
      <NewArrivals products={newArrivals} />
      <ValueProps />
      <TrendingGrid products={featured} />
      <AboutSection />
    </StorefrontLayout>
  );
}
