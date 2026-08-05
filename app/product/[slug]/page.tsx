import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ProductDetail } from '@/components/store/product-detail';
import { getProductBySlug, getAllProducts } from '@/lib/data';
import { notFound } from 'next/navigation';

// سبب رسالة خطأ 500: الصفحة كانت فيها تعارض "static vs dynamic" في Next.js.
// كانت مضبوطة كـ ISR (revalidate = 60) مع generateStaticParams فاضية، يعني
// نكست بيحاول يولّد الصفحة بشكل ثابت (static) وقت الطلب، لكن جوه الصفحة
// بنستخدم supabaseServer() اللي بيقرا الكوكيز (cookies) عشان صلاحيات الأدمن
// - وقراءة الكوكيز دي بتجبر الصفحة تبقى ديناميكية. التعارض ده بين "المفروض
// تبقى ثابتة" و"لازم تبقى ديناميكية" هو اللي كان بيرمي Internal Server Error
// على أي صفحة منتج. الحل: نخلي الصفحة ديناميكية بشكل صريح ونشيل الإعدادات
// المتعارضة معاها.
export const dynamic = 'force-dynamic';

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
