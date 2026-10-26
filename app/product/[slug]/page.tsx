import { StorefrontLayout } from '@/components/store/storefront-layout';
import { ProductDetail } from '@/components/store/product-detail';
import { getProductBySlug, getRelatedProducts } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import { BRAND_CONFIG } from '@/lib/brand';

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
    alternates: { canonical: `/product/${encodeURIComponent(product.slug)}` },
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

  // بيانات منظمة (JSON-LD) لجوجل: بتخلي المنتج يظهر في نتايج البحث بالسعر
  // والتوفر، وهي أساس كتالوج المنتجات لإعلانات جوجل وميتا.
  const url = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;
  const inStock = product.variants?.some((v) => v.stock_quantity > 0) ?? false;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title_ar,
      description: product.description_ar ?? undefined,
      image: product.images,
      sku: product.id,
      brand: { '@type': 'Brand', name: BRAND_CONFIG.nameArabic },
      category: product.category?.name_ar,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'EGP',
        price: Number(product.sale_price_egp ?? product.price_egp).toFixed(2),
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'المتجر', item: `${SITE_URL}/shop` },
        { '@type': 'ListItem', position: 3, name: product.title_ar, item: url },
      ],
    },
  ];

  return (
    <StorefrontLayout>
      <script
        type="application/ld+json"
        // escape لـ "<" عشان أي نص في وصف المنتج ميقدرش يقفل وسم الـ script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductDetail product={product} related={related} />
    </StorefrontLayout>
  );
}
