export type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  price_egp: number;
  sale_price_egp: number | null;
  is_turkish_import: boolean;
  fabric_details_ar: string | null;
  category_id: string | null;
  images: string[];
  is_featured: boolean;
  status: string;
  created_at: string;
  category?: Category;
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  color_ar: string;
  color_hex: string | null;
  stock_quantity: number;
  sku: string | null;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  whatsapp_phone: string | null;
  governorate: string;
  city_address: string;
  subtotal_egp: number;
  shipping_fee_egp: number;
  total_amount_egp: number;
  payment_method: string;
  payment_receipt_url: string | null;
  order_status: string;
  allow_inspection: boolean;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  unit_price_egp: number;
  product?: Product;
  variant?: ProductVariant;
};

export type ShippingRate = {
  id: string;
  governorate_ar: string;
  cost_egp: number;
  estimated_days: string;
};

export type CartItem = {
  product: Product;
  variant: ProductVariant;
  quantity: number;
};
