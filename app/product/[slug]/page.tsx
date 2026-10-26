import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ProductDetail } from '@/components/store/product-detail';
import { getProductBySlug, getRelatedProducts } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// كانت الصفحة force-dynamic لأن supabaseServer() بيقرا الكوكيز (وده كان سبب
// خطأ 500 مع ISR). دلوقتي بيانات المتجر بتيجي من عميل عام من غير كوكيز
// (lib/supabase-public.ts)، فرجعنا ISR: أول زيارة لأي منتج بتبني الصفحة،
// وبعدها بتتقدم من الكاش وبتتحدث في الخلفية كل دقيقة.
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

// عنوان وصورة خاصين بكل منتج: بيظهروا في نتايج جوجل وفي معاينة الرابط لما
// يتشارك على واتساب/فيسبوك أو يتحط في إعلان.
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const description = product.description_ar?.slice(0, 160) || undefined;
  return {
    title: product.title_ar,
    description,
    openGraph: {
      title: product.title_ar,
      description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);

  return (
    <StorefrontLayout>
      <ProductDetail product={product} related={related} />
    </StorefrontLayout>
  );
}
