import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ShopContent } from '@/components/store/shop-content';
import { ShopHeader } from '@/components/store/shop-header';
import { getAllProducts, getCategories } from '@/lib/data';
import { BRAND_CONFIG } from '@/lib/brand';

// صفحة لكل فئة (/shop/abayas): عنوان ووصف ورابط canonical خاصين بيها،
// والمنتجات مفلترة على السيرفر - دي الصفحات اللي بتطلع في جوجل لما حد
// يدوّر على "عبايات تركي" مثلاً.
export const revalidate = 60;

type PageProps = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

async function findCategory(slug: string) {
  const categories = await getCategories();
  const decoded = decodeURIComponent(slug);
  return { categories, category: categories.find((c) => c.slug === decoded) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const { category } = await findCategory(slug);
  if (!category) return {};
  return {
    title: `${category.name_ar} تركي فاخر`,
    description: `تسوقي ${category.name_ar} تركي فاخرة من ${BRAND_CONFIG.nameArabic} - خامات أصلية، توصيل لكل محافظات مصر والدفع عند الاستلام مع المعاينة.`,
    alternates: { canonical: `/shop/${encodeURIComponent(category.slug)}` },
    openGraph: category.image_url ? { images: [category.image_url] } : undefined,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const [{ categories, category }, products] = await Promise.all([findCategory(slug), getAllProducts()]);
  if (!category) notFound();

  return (
    <StorefrontLayout>
      <ShopHeader title={category.name_ar} subtitle={`${category.name_ar} تركي بخامات فاخرة وتفاصيل مختارة بعناية`} />
      <ShopContent
        products={products.filter((p) => p.category_id === category.id)}
        categories={categories}
        activeCategory={category.slug}
      />
    </StorefrontLayout>
  );
}
