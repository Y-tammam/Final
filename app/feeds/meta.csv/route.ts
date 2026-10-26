import { getAllProducts } from '@/lib/data';
import { BRAND_CONFIG } from '@/lib/brand';
import { SITE_URL } from '@/lib/site';

// كتالوج المنتجات لإعلانات ميتا (Advantage+ catalog / إعلانات ديناميكية)
// وبيشتغل كمان مع TikTok و Google Merchant Center (نفس الأعمدة).
// الرابط: https://<الدومين>/feeds/meta.csv - حطيه في Commerce Manager
// كـ "Scheduled feed" يتحدث يومياً. الـ id هنا لازم يطابق content_ids
// اللي الـ Pixel بيبعتها (product.id) عشان الإعلانات تربط المشاهدات بالمنتج.
export const revalidate = 3600;

function csv(value: unknown): string {
  const s = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const products = await getAllProducts();
  const header = [
    'id', 'title', 'description', 'availability', 'condition', 'price', 'sale_price',
    'link', 'image_link', 'additional_image_link', 'brand', 'product_type', 'inventory',
  ];
  const rows = products
    .filter((p) => p.images?.[0])
    .map((p) => {
      const inventory = (p.variants ?? []).reduce((n, v) => n + Math.max(0, v.stock_quantity), 0);
      const onSale = p.sale_price_egp !== null && Number(p.sale_price_egp) < Number(p.price_egp);
      return [
        p.id,
        p.title_ar,
        p.description_ar || p.title_ar,
        inventory > 0 ? 'in stock' : 'out of stock',
        'new',
        `${Number(p.price_egp).toFixed(2)} EGP`,
        onSale ? `${Number(p.sale_price_egp).toFixed(2)} EGP` : '',
        `${SITE_URL}/product/${encodeURIComponent(p.slug)}`,
        p.images[0],
        p.images.slice(1, 10).join(','),
        BRAND_CONFIG.nameArabic,
        p.category?.name_ar ?? '',
        inventory,
      ].map(csv).join(',');
    });

  return new Response([header.join(','), ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
