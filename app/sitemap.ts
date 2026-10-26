import type { MetadataRoute } from 'next';
import { getAllProducts, getCategories } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

// خريطة الموقع لجوجل: بتتحدث كل ساعة وفيها كل المنتجات والفئات النشطة.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/shop?category=${encodeURIComponent(c.slug)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${encodeURIComponent(p.slug)}`,
      lastModified: p.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: p.images?.slice(0, 1),
    })),
  ];
}
