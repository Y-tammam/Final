import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ProductDetail } from '@/components/store/product-detail';
import { getProductBySlug, getAllProducts } from '@/lib/data';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const allProducts = await getAllProducts();
  const related = allProducts
    .filter((p) => p.id !== product.id && p.category?.slug === product.category?.slug)
    .slice(0, 4);

  return (
    <StorefrontLayout>
      <ProductDetail product={product} related={related} />
    </StorefrontLayout>
  );
}
