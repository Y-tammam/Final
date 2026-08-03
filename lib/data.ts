import { supabaseServer } from './supabase-server';
import type { Product, Category, ShippingRate } from './types';

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Product[];
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Product[];
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)')
    .eq('status', 'active')
    .eq('category.slug', slug)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Product;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('categories').select('*').order('name_ar');
  if (error) return [];
  return data ?? [];
}

export async function getShippingRates(): Promise<ShippingRate[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('shipping_rates').select('*').order('governorate_ar');
  if (error) return [];
  return data ?? [];
}
