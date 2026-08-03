/*
# E-Commerce Schema: Turkish Luxury Women's Fashion (Egypt)

## Overview
Complete database schema for a luxury Turkish women's fashion e-commerce store
targeting the Egyptian market. Supports a public customer storefront
(no sign-in, cash-on-delivery checkout by phone + address) and a protected
admin dashboard (Supabase email/password auth) for managing catalog and orders.

## New Tables
1. categories        - product categories (abayas, dresses, casual) - bilingual
2. products          - catalog with bilingual titles, EGP pricing, image array
3. product_variants  - size / color / stock matrix per product (Turkish sizes)
4. orders            - customer orders tailored for Egyptian COD e-commerce
5. order_items       - line items per order
6. shipping_rates    - per-governorate shipping costs in EGP

## Security Model (mixed tenant)
- Customer storefront runs as the `anon` role (no sign-in). Anon CAN:
  - READ the public catalog (categories, products, product_variants, shipping_rates)
  - INSERT orders + order_items (the checkout flow)
  Anon CANNOT read orders back (customer privacy; no customer accounts exist).
- Admin dashboard runs as the `authenticated` role (Supabase email/password).
  Authenticated admins CAN: full CRUD on every table (catalog, orders, shipping).

Because the storefront has no customer sign-up, the only authenticated users are
admins who create their account through the gated /admin/login setup flow.

## Notes
- All monetary columns are DECIMAL(10,2) in EGP.
- products.images is a TEXT[] array of image URLs (multiple gallery images).
- orders.order_number is an auto-incrementing SERIAL for human-friendly IDs.
- Turkish sizes stored as VARCHAR (38, 40, 42, 44, 46 or S / M / L).
- Indexes added on all foreign-key and frequently-filtered columns.
*/

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_categories" ON categories;
CREATE POLICY "auth_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories" ON categories FOR DELETE
  TO authenticated USING (true);

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price_egp DECIMAL(10,2) NOT NULL,
  sale_price_egp DECIMAL(10,2),
  is_turkish_import BOOLEAN DEFAULT true,
  fabric_details_ar VARCHAR(255),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- ---------- product_variants ----------
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(50) NOT NULL,
  color_ar VARCHAR(50) NOT NULL,
  color_hex VARCHAR(10),
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(100) UNIQUE
);
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_variants" ON product_variants;
CREATE POLICY "anon_read_variants" ON product_variants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_variants" ON product_variants;
CREATE POLICY "auth_insert_variants" ON product_variants FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_variants" ON product_variants;
CREATE POLICY "auth_update_variants" ON product_variants FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_variants" ON product_variants;
CREATE POLICY "auth_delete_variants" ON product_variants FOR DELETE
  TO authenticated USING (true);

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  whatsapp_phone VARCHAR(50),
  governorate VARCHAR(100) NOT NULL,
  city_address TEXT NOT NULL,
  subtotal_egp DECIMAL(10,2) NOT NULL,
  shipping_fee_egp DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  total_amount_egp DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'COD',
  order_status VARCHAR(50) DEFAULT 'pending',
  allow_inspection BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- anon can place orders (checkout) but cannot read them back
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_orders" ON orders;
CREATE POLICY "auth_read_orders" ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- ---------- order_items ----------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price_egp DECIMAL(10,2) NOT NULL
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_order_items" ON order_items;
CREATE POLICY "auth_read_order_items" ON order_items FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_order_items" ON order_items;
CREATE POLICY "auth_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_order_items" ON order_items;
CREATE POLICY "auth_delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (true);

-- ---------- shipping_rates ----------
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate_ar VARCHAR(100) UNIQUE NOT NULL,
  cost_egp DECIMAL(10,2) NOT NULL,
  estimated_days VARCHAR(50) DEFAULT '2-3 أيام'
);
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_shipping" ON shipping_rates;
CREATE POLICY "anon_read_shipping" ON shipping_rates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_shipping" ON shipping_rates;
CREATE POLICY "auth_insert_shipping" ON shipping_rates FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_shipping" ON shipping_rates;
CREATE POLICY "auth_update_shipping" ON shipping_rates FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_shipping" ON shipping_rates;
CREATE POLICY "auth_delete_shipping" ON shipping_rates FOR DELETE
  TO authenticated USING (true);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
