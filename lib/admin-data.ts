import { supabaseServer } from './supabase-server';
import type { CheckoutDraft, DiscountCode, Order, Product } from './types';

export async function getDashboardStats() {
  const supabase = await supabaseServer();
  const [ordersRes, productsRes, variantsRes] = await Promise.all([
    supabase.from('orders').select('id, order_number, customer_name, governorate, total_amount_egp, order_status, payment_method, attribution, created_at'),
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

  // أداء كل حملة إعلانية: الطلبات اللي اتسلّمت فعلاً مقابل الملغية (مهم جداً
  // مع الدفع عند الاستلام - Ads Manager بيعد كل طلب حتى لو اترفض)
  const campaignMap = new Map<string, { campaign: string; orders: number; delivered: number; cancelled: number; revenue: number }>();
  for (const o of orders) {
    const a = (o.attribution ?? {}) as Record<string, string>;
    const key = a.utm_campaign ? `${a.utm_source ?? ''} / ${a.utm_campaign}` : a.utm_source || 'مباشر / بدون إعلان';
    const row = campaignMap.get(key) ?? { campaign: key, orders: 0, delivered: 0, cancelled: 0, revenue: 0 };
    row.orders += 1;
    if (o.order_status === 'delivered') {
      row.delivered += 1;
      row.revenue += Number(o.total_amount_egp);
    }
    if (o.order_status === 'cancelled') row.cancelled += 1;
    campaignMap.set(key, row);
  }
  const campaigns = Array.from(campaignMap.values()).sort((a, b) => b.orders - a.orders).slice(0, 10);

  return {
    campaigns,
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

// كل أعمدة الطلب ما عدا payment_receipt_url (صورة الإيصال - ممكن تكون مئات
// الكيلوبايتات لكل طلب، وكانت بتتحمل كلها مع القايمة). الإيصال بيتجاب لما
// الطلب يتفتح (components/admin/orders-client.tsx).
const ORDER_LIST_COLUMNS =
  'id, order_number, customer_name, customer_phone, whatsapp_phone, governorate, city_address, ' +
  'subtotal_egp, shipping_fee_egp, total_amount_egp, discount_code, discount_egp, payment_method, ' +
  'order_status, allow_inspection, notes, attribution, created_at';

export async function getAllOrders(limit = 500): Promise<Order[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('orders')
    .select(`${ORDER_LIST_COLUMNS}, order_items:order_items(*, product:products(id, title_ar, images, slug), variant:product_variants(*))`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as unknown as Order[];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('orders')
    .select(`${ORDER_LIST_COLUMNS}, payment_receipt_url, order_items:order_items(*, product:products(id, title_ar, images, slug), variant:product_variants(*))`)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Order;
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

export async function getDiscountCodesAdmin(): Promise<DiscountCode[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as DiscountCode[];
}

// السلات المتروكة: اللي كتبت رقمها في صفحة الدفع وما كملتش من 30 دقيقة على الأقل
export async function getCheckoutDraftsAdmin(): Promise<CheckoutDraft[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('checkout_drafts')
    .select('id, phone, customer_name, governorate, cart, subtotal_egp, attribution, created_at, updated_at, contacted_at')
    .is('recovered_order_id', null)
    .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) return [];
  return (data ?? []) as CheckoutDraft[];
}
