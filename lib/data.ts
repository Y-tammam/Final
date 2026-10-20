import { supabasePublic as supabase } from './supabase-public';
import type { Product, Category, ShippingRate } from './types';

// كل الدوال هنا للمتجر العام بس (مفيش كوكيز) عشان الصفحات تتكاش.
// بيانات الأدمن في lib/admin-data.ts وبتستخدم supabaseServer().
const PRODUCT_SELECT = '*, category:categories(*), variants:product_variants(*)';

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false });
  if (error) return [];
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
  if (error) return [];
  return (data ?? []) as Product[];
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) return [];
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
  if (error) return [];
  return (data ?? []) as Product[];
}

// عدد المنتجات في كل فئة (للصفحة الرئيسية) - بنجيب عمود واحد بس بدل كل
// المنتجات بالـ variants.
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('products')
    .select('category_id')
    .eq('status', 'active');
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !data) return null;
  return data as Product;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name_ar');
  if (error) return [];
  return data ?? [];
}

export async function getShippingRates(): Promise<ShippingRate[]> {
  const { data, error } = await supabase.from('shipping_rates').select('*').order('governorate_ar');
  if (error) return [];
  return data ?? [];
}
