/*
# إصلاح أمني حرج: قفل صلاحيات الأدمن على مستخدمين معتمدين فقط

## المشكلة اللي بنصلحها
السياسات القديمة كانت بتدي أي مستخدم "authenticated" (أي حد عمل حساب عادي
من المتجر عن طريق نافذة تسجيل الدخول العامة) صلاحية كاملة على كل الجداول:
قراءة كل الطلبات (بيانات عملاء)، وتعديل/حذف أي منتج أو طلب أو سعر شحن.
الفحص القديم في الكود (middleware / admin-guard) كان بيعتمد على
`user_metadata.role` وهو حقل قابل للتعديل من المستخدم نفسه من المتصفح،
يعني مكنش بيحمي حاجة فعلياً على مستوى قاعدة البيانات.

## الحل
1. جدول جديد admin_users: قايمة صريحة بمعرّفات (user_id) الحسابات
   المسموح لها تدير المتجر. الجدول ده مقفول تماماً (RLS مفعّل وبدون أي
   policy) فمفيش حد يقدر يقرأه أو يعدّله من الفرونت إند حتى لو authenticated.
2. دالة is_admin(): بتتأكد هل المستخدم الحالي موجود في admin_users؟
   الدالة SECURITY DEFINER عشان تقدر تقرا الجدول المقفول من فوق.
3. كل سياسة كانت بتقول "TO authenticated USING (true)" استُبدلت بـ
   "TO authenticated USING (is_admin())" — يعني دلوقتي أي عملية كتابة/قراءة
   حساسة لازم المستخدم يكون في جدول admin_users فعلاً، مش بس عنده حساب.
4. سياسة "customer_read_own_orders" (العميل يشوف طلباته هو بس) فضلت زي ما هي.

## خطوة لازم تعملها إنت بنفسك بعد تشغيل الملف ده
اعملي حساب الأدمن (لو لسه ما عملتيهوش) من صفحة /admin/login أو Supabase
Dashboard > Authentication، وبعدين هات الـ User UID بتاعه من
Supabase Dashboard > Authentication > Users، وشغّلي السطر ده يدوياً
في SQL Editor (غيّري القيمة بالـ UID الحقيقي):

  insert into admin_users (user_id) values ('ضعي-الـ-UID-هنا');

من غير السطر ده محدش هيقدر يدخل لوحة التحكم، حتى لو حسابه فيه
role: admin في user_metadata.
*/

-- ---------- admin_users ----------
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- عمداً مفيش أي policy هنا: يعني مفيش حد (ولا حتى authenticated) يقدر
-- يقرا أو يعدّل الجدول ده مباشرة من الفرونت إند. الوصول الوحيد له عن
-- طريق دالة is_admin() اللي شغالة بصلاحيات الأونر (SECURITY DEFINER).

-- ---------- is_admin() ----------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

-- ---------- categories ----------
DROP POLICY IF EXISTS "auth_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (is_admin());

-- ---------- products ----------
DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (is_admin());

-- ---------- product_variants ----------
DROP POLICY IF EXISTS "auth_insert_variants" ON product_variants;
CREATE POLICY "admin_insert_variants" ON product_variants FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_variants" ON product_variants;
CREATE POLICY "admin_update_variants" ON product_variants FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_variants" ON product_variants;
CREATE POLICY "admin_delete_variants" ON product_variants FOR DELETE
  TO authenticated USING (is_admin());

-- ---------- orders ----------
-- ملحوظة: anon_insert_orders و customer_read_own_orders فضلوا زي ما هما
-- (الشيك أوت للعميل والحساب الشخصي لازم يشتغلوا عادي).
DROP POLICY IF EXISTS "auth_read_orders" ON orders;
CREATE POLICY "admin_read_orders" ON orders FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "admin_delete_orders" ON orders FOR DELETE
  TO authenticated USING (is_admin());

-- ---------- order_items ----------
DROP POLICY IF EXISTS "auth_read_order_items" ON order_items;
CREATE POLICY "admin_read_order_items" ON order_items FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_update_order_items" ON order_items;
CREATE POLICY "admin_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_order_items" ON order_items;
CREATE POLICY "admin_delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (is_admin());

-- ---------- shipping_rates ----------
DROP POLICY IF EXISTS "auth_insert_shipping" ON shipping_rates;
CREATE POLICY "admin_insert_shipping" ON shipping_rates FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_shipping" ON shipping_rates;
CREATE POLICY "admin_update_shipping" ON shipping_rates FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_shipping" ON shipping_rates;
CREATE POLICY "admin_delete_shipping" ON shipping_rates FOR DELETE
  TO authenticated USING (is_admin());
