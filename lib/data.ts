import { cache } from 'react';
import { supabasePublic as supabase } from './supabase-public';
import type { Product, Category, ShippingRate, StoreSettings, StorePage } from './types';

// كل الدوال هنا للمتجر العام بس (مفيش كوكيز) عشان الصفحات تتكاش.
// لو قاعدة البيانات رجّعت خطأ بنرمي exception بدل ما نرجّع قايمة فاضية:
// كده Next بيفضل يعرض آخر نسخة سليمة من الصفحة بدل ما يكاش متجر فاضي أو
// sitemap فاضي (وده بيضر الأرشفة في جوجل).
// بيانات الأدمن في lib/admin-data.ts وبتستخدم supabaseServer().
// وقت الـ build (أو لو قاعدة البيانات مش متاحة وقتها) بنكمّل بقيمة فاضية عشان
// الـ build ميفشلش، والصفحة بتتحدث في أول revalidate.
function failed<T>(error: { message: string }, fallback: T): T {
  if (process.env.NEXT_PHASE === 'phase-production-build') return fallback;
  throw new Error(`Supabase: ${error.message}`);
}

const PRODUCT_SELECT = '*, category:categories(*), variants:product_variants(*)';

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false });
  if (error) return failed(error, [] as Product[]);
  return (data ?? []) as Product[];
}

// آخر منتجات اتضافت للمتجر (وصلنا حديثاً) - بتتحدد بترتيب created_at
// تنازلياً، فمش محتاجين أي عمود جديد في قاعدة البيانات.
export async function getNewArrivals(limit = 5): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return failed(error, [] as Product[]);
  return (data ?? []) as Product[];
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) return failed(error, [] as Product[]);
  return (data ?? []) as Product[];
}

// منتجات مشابهة لصفحة المنتج: نفس الفئة وبحد أقصى limit، بدل ما نجيب
// كل منتجات المتجر ونفلترها.
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!product.category_id) return [];
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return failed(error, [] as Product[]);
  return (data ?? []) as Product[];
}

// عدد المنتجات في كل فئة (للصفحة الرئيسية) - بنجيب عمود واحد بس بدل كل
// المنتجات بالـ variants.
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('products')
    .select('category_id')
    .eq('status', 'active');
  if (error) return failed(error, {});
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

// cache: الصفحة و generateMetadata الاتنين بينادوها - طلب واحد بس
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error) return failed(error, null);
  return (data as Product) ?? null;
});

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name_ar');
  if (error) return failed(error, []);
  return data ?? [];
}

export async function getShippingRates(): Promise<ShippingRate[]> {
  const { data, error } = await supabase.from('shipping_rates').select('*').order('governorate_ar');
  if (error) return failed(error, []);
  return data ?? [];
}

// إعدادات عامة للمتجر (حد الشحن المجاني). بتتعدّل من صفحة الشحن في لوحة
// التحكم، و place_order بيطبقها على السيرفر.
export async function getStoreSettings(): Promise<StoreSettings> {
  const { data } = await supabase.from('store_settings').select('*').maybeSingle();
  return {
    free_shipping_threshold_egp: data?.free_shipping_threshold_egp ?? null,
    announcement_text: data?.announcement_text ?? null,
    announcement_link: data?.announcement_link ?? null,
    announcement_ends_at: data?.announcement_ends_at ?? null,
  };
}

export async function getStorePage(slug: string): Promise<StorePage | null> {
  const { data, error } = await supabase.from('store_pages').select('*').eq('slug', slug).maybeSingle();
  if (error) return failed(error, null);
  return (data as StorePage) ?? null;
}

export async function getStorePages(): Promise<StorePage[]> {
  const { data } = await supabase.from('store_pages').select('*');
  return (data ?? []) as StorePage[];
}
