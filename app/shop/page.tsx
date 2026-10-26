import type { Metadata } from 'next';
import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ShopContent } from '@/components/store/shop-content';
import { ShopHeader } from '@/components/store/shop-header';
import { getAllProducts, getCategories } from '@/lib/data';
import { BRAND_CONFIG } from '@/lib/brand';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'المتجر - كل التشكيلة',
  description: `تسوقي كل تشكيلة ${BRAND_CONFIG.nameArabic}: عبايات وفساتين وأزياء تركية فاخرة، توصيل لكل محافظات مصر والدفع عند الاستلام.`,
  alternates: { canonical: '/shop' },
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);

  return (
    <StorefrontLayout>
      <ShopHeader title="المتجر" subtitle="اكتشفي تشكيلتنا الكاملة من الأزياء التركية الفاخرة" />
      <ShopContent products={products} categories={categories} />
    </StorefrontLayout>
  );
}
