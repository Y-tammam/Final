import { supabaseServer } from './supabase-server';
import type { Order, Product } from './types';

export async function getDashboardStats() {
  const supabase = await supabaseServer();
  const [ordersRes, productsRes, variantsRes] = await Promise.all([
    supabase.from('orders').select('*'),
    supabase.from('products').select('id, title_ar, status, price_egp, sale_price_egp'),
    supabase.from('product_variants').select('id, product_id, size, color_ar, stock_quantity, sku, product:products(title_ar)'),
  ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const products = (productsRes.data ?? []) as Product[];
  const variants = (variantsRes.data ?? []) as any[];

  const deliveredOrders = orders.filter((o) => o.order_status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((s, o) => s + Number(o.total_amount_egp), 0);
  const pendingOrders = orders.filter((o) => o.order_status === 'pending').length;
  const lowStockVariants = variants.filter((v) => v.stock_quantity <= 3);

  const { data: itemsData } = await supabase
    .from('order_items')
    .select('product_id, quantity, product:products(title_ar)');
  const productSales: Record<string, { title: string; qty: number }> = {};
  for (const item of (itemsData ?? []) as any[]) {
    if (!item.product_id) continue;
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = { title: item.product?.title_ar ?? 'منتج', qty: 0 };
    }
    productSales[item.product_id].qty += item.quantity;
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const now = new Date();
  const dailyRevenue: { date: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dayOrders = orders.filter((o) => {
      const created = new Date(o.created_at);
      return created >= dayStart && created <= dayEnd;
    });
    dailyRevenue.push({
      date: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString('ar-EG', { weekday: 'short' }),
      revenue: dayOrders.filter((o) => o.order_status === 'delivered').reduce((s, o) => s + Number(o.total_amount_egp), 0),
      orders: dayOrders.length,
    });
  }

  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders,
    totalProducts: products.length,
    lowStock: lowStockVariants,
    topProducts,
    dailyRevenue,
    recentOrders: orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6),
  };
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items:order_items(*, product:products(*), variant:product_variants(*))')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Order[];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items:order_items(*, product:products(*), variant:product_variants(*))')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Order;
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Product[];
}

export async function getShippingRatesAdmin() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('shipping_rates').select('*').order('governorate_ar');
  if (error) return [];
  return data ?? [];
}

export async function getCategoriesAdmin() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('categories').select('*').order('name_ar');
  if (error) return [];
  return data ?? [];
}
