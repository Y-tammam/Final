import { StorefrontLayout } from '@/components/store/storefront-layout';
import { Hero } from '@/components/store/hero';
import { ValueProps } from '@/components/store/value-props';
import { TrendingGrid } from '@/components/store/trending-grid';
import { CategoryShowcase } from '@/components/store/category-showcase';
import { AboutSection } from '@/components/store/about-section';
import { getFeaturedProducts, getCategories, getAllProducts } from '@/lib/data';

export const revalidate = 300;

export default async function HomePage() {
  const [featured, categories, allProducts] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getAllProducts(),
  ]);

  return (
    <StorefrontLayout>
      <Hero />
      <ValueProps />
      <TrendingGrid products={featured} />
      <CategoryShowcase categories={categories} products={allProducts} />
      <AboutSection />
    </StorefrontLayout>
  );
}
