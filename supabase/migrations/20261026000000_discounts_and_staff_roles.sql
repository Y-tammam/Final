/*
# أكواد الخصم + أدوار الموظفين (مالك / موظف)

## أدوار لوحة التحكم
- جدول admin_users بقى فيه عمود role:
  - owner (المالك): صلاحيات كاملة زي ما كانت.
  - staff (موظف): يشوف الطلبات ويغيّر حالتها بس. مايقدرش يعدّل المنتجات
    أو الأسعار أو الشحن أو أكواد الخصم، ولا يمسح طلبات، ولا يعدّل أي بيانات
    في الطلب غير الحالة (فيه trigger بيمنع ده على مستوى قاعدة البيانات).
- كل الحسابات اللي في admin_users دلوقتي بتبقى owner تلقائي.
- is_admin() بقت معناها "مالك"، و is_staff() معناها "مالك أو موظف".
- المالك بيضيف الموظفين ويشيلهم من صفحة "الفريق" في لوحة التحكم
  (الموظف لازم يكون عامل حساب في الموقع الأول بنفس الإيميل).

## أكواد الخصم
- جدول discount_codes: نسبة أو مبلغ ثابت، حد أدنى للطلب، حد أقصى للخصم،
  تاريخ بداية وانتهاء، أقصى عدد استخدامات، ومرة واحدة لكل رقم موبايل.
- الخصم بيتحسب جوه place_order على السيرفر بس، والعداد بيزيد في نفس
  العملية (فمحدش يقدر يتلاعب بالخصم أو يستخدم الكود أكتر من المسموح).
- preview_discount(): بتستخدمها صفحة الشيك أوت عشان تعرض الخصم قبل التأكيد.

## إلغاء الطلب
- لما حالة الطلب تتغير لـ "ملغي" المخزون بيرجع تلقائي (ولو رجعت تاني من
  ملغي لحالة تانية المخزون بيتخصم تاني).

## تقوية أمنية إضافية (من مراجعة الأمان)
- حد أقصى 20 قطعة في الطلب الواحد، وحد 10 طلبات في الساعة لكل IP (غير حد
  الـ 5 لكل رقم)، وقفل بيمنع الطلبات المتوازية تعدّي الحد.
- order_items بقت بتحفظ اسم المنتج والمقاس واللون وقت الطلب، فتعديل أو
  حذف المنتج بعد كده مبيضيّعش تفاصيل الطلبات القديمة.
- العميلة تقدر تشوف منتجات طلباتها في صفحة حسابها.
- مقاسات/ألوان المنتجات المسودة مبقتش ظاهرة للعامة.
- إيصال فودافون كاش: صور webp/jpeg/png بس وحجم أقصى أصغر.
- تعديل المنتج مبقاش بيمسح المقاسات ويضيفها من جديد، والمخزون بيتعدّل
  بالفرق (adjust_variant_stock).

## الشحن المجاني
- جدول store_settings (صف واحد): free_shipping_threshold_egp. لو قيمة
  المنتجات بعد الخصم وصلت الرقم ده الشحن بيبقى مجاني (place_order بيطبقه).
  بيتعدّل من صفحة الشحن في لوحة التحكم، و NULL = مفيش شحن مجاني.

## التشغيل
شغّلي الملف ده في Supabase SQL Editor بعد ملف 20261020000000. آمن يتشغل
أكتر من مرة.
*/

-- =====================================================================
-- الأدوار
-- =====================================================================
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('owner', 'staff'));

-- is_admin() = مالك (كل السياسات القديمة اللي بتستخدمها بقت للمالك بس)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner');
$$;

-- is_staff() = أي حد له دخول على لوحة التحكم (مالك أو موظف)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated, anon;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM admin_users WHERE user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated, anon;

-- الموظف يقرا الطلبات ويحدّثها (التحديث مقصور على الحالة بالـ trigger تحت)
DROP POLICY IF EXISTS "admin_read_orders" ON orders;
CREATE POLICY "admin_read_orders" ON orders FOR SELECT
  TO authenticated USING ((select is_staff()));

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING ((select is_staff())) WITH CHECK ((select is_staff()));

DROP POLICY IF EXISTS "admin_read_order_items" ON order_items;
CREATE POLICY "admin_read_order_items" ON order_items FOR SELECT
  TO authenticated USING ((select is_staff()));

DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (status = 'active' OR (select is_staff()));

-- الموظف ميقدرش يغيّر غير حالة الطلب
CREATE OR REPLACE FUNCTION orders_guard_staff_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- current_user = 'authenticated' يعني التعديل جاي مباشرة من لوحة التحكم،
  -- مش من دوال السيرفر (place_order / attach_order_receipt).
  IF current_user = 'authenticated' AND NOT is_admin()
     AND (to_jsonb(NEW) - 'order_status') IS DISTINCT FROM (to_jsonb(OLD) - 'order_status') THEN
    RAISE EXCEPTION 'صلاحيتك تسمح بتغيير حالة الطلب فقط';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_guard_staff_update ON orders;
CREATE TRIGGER trg_orders_guard_staff_update
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_guard_staff_update();

-- ---------- إدارة الفريق (للمالك بس) ----------
CREATE OR REPLACE FUNCTION list_staff()
RETURNS TABLE (user_id UUID, email TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;
  RETURN QUERY
    SELECT a.user_id, u.email::TEXT, a.role, a.created_at
      FROM admin_users a
      JOIN auth.users u ON u.id = a.user_id
     ORDER BY a.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION set_staff_member(p_email TEXT, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;
  IF p_role NOT IN ('owner', 'staff') THEN
    RAISE EXCEPTION 'دور غير صحيح';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'مفيش حساب بالإيميل ده - لازم الموظف يعمل حساب في الموقع الأول';
  END IF;

  IF p_role = 'staff' AND v_user_id = auth.uid() THEN
    RAISE EXCEPTION 'مينفعش تشيل صلاحية المالك من حسابك';
  END IF;

  INSERT INTO admin_users (user_id, role) VALUES (v_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

CREATE OR REPLACE FUNCTION remove_staff_member(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'مينفعش تشيل حسابك';
  END IF;
  DELETE FROM admin_users WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION list_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION set_staff_member(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION remove_staff_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION list_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION set_staff_member(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_staff_member(UUID) TO authenticated;

-- =====================================================================
-- إعدادات المتجر (صف واحد)
-- =====================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  free_shipping_threshold_egp NUMERIC(10,2) CHECK (free_shipping_threshold_egp IS NULL OR free_shipping_threshold_egp > 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO store_settings (id, free_shipping_threshold_egp) VALUES (true, 3000)
ON CONFLICT (id) DO NOTHING;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_store_settings" ON store_settings;
CREATE POLICY "public_read_store_settings" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_update_store_settings" ON store_settings;
CREATE POLICY "admin_update_store_settings" ON store_settings FOR UPDATE
  TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));

-- =====================================================================
-- أكواد الخصم
-- =====================================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code = upper(code) AND length(code) BETWEEN 3 AND 30),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value NUMERIC(10,2) NOT NULL CHECK (value > 0),
  min_order_egp NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (min_order_egp >= 0),
  max_discount_egp NUMERIC(10,2) CHECK (max_discount_egp IS NULL OR max_discount_egp > 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INT NOT NULL DEFAULT 0,
  one_per_phone BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT discount_percent_max CHECK (discount_type <> 'percent' OR value <= 100)
);
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- المالك بس. العملاء مبيقروش الجدول ده خالص (عشان محدش يعرف الأكواد)،
-- بيتعاملوا معاه من خلال preview_discount / place_order بس.
DROP POLICY IF EXISTS "admin_all_discount_codes" ON discount_codes;
CREATE POLICY "admin_all_discount_codes" ON discount_codes FOR ALL
  TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_ip TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_ip_created ON orders(client_ip, created_at DESC) WHERE client_ip IS NOT NULL;

-- نسخة من بيانات المنتج وقت الطلب (عشان تعديل المنتج بعدين ميأثرش على الطلب)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_title TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_size TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_color TEXT;

-- فهارس على مفاتيح order_items (حذف منتج أو مقاس كان بيعمل scan للجدول كله)
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

-- العميلة بتقرا طلباتها هي بس. (select auth.uid()) بتتحسب مرة واحدة في
-- الاستعلام بدل مرة لكل صف - توصية Supabase لأداء RLS.
DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;
CREATE POLICY "customer_read_own_orders" ON orders FOR SELECT
  TO authenticated USING ((select auth.uid()) = user_id);

-- العميلة تقرا عناصر طلباتها هي بس (صفحة حسابي)
DROP POLICY IF EXISTS "customer_read_own_order_items" ON order_items;
CREATE POLICY "customer_read_own_order_items" ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = (select auth.uid())));

-- مقاسات/ألوان المنتجات المسودة مش للعامة
DROP POLICY IF EXISTS "anon_read_variants" ON product_variants;
CREATE POLICY "anon_read_variants" ON product_variants FOR SELECT
  TO anon, authenticated
  USING ((select is_staff()) OR EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'active'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_egp NUMERIC(10,2) NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_orders_discount_phone ON orders(discount_code, customer_phone) WHERE discount_code IS NOT NULL;

-- بتحسب قيمة الخصم أو بترمي رسالة واضحة للعميلة. داخلية (مش متاحة للـ API).
CREATE OR REPLACE FUNCTION compute_discount(p_code discount_codes, p_subtotal NUMERIC, p_phone TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_discount NUMERIC;
BEGIN
  IF p_code.id IS NULL OR NOT p_code.is_active
     OR (p_code.starts_at IS NOT NULL AND now() < p_code.starts_at) THEN
    RAISE EXCEPTION 'كود الخصم غير صحيح';
  END IF;
  IF p_code.expires_at IS NOT NULL AND now() > p_code.expires_at THEN
    RAISE EXCEPTION 'كود الخصم انتهت صلاحيته';
  END IF;
  IF p_code.usage_limit IS NOT NULL AND p_code.used_count >= p_code.usage_limit THEN
    RAISE EXCEPTION 'كود الخصم وصل للحد الأقصى من الاستخدام';
  END IF;
  IF p_subtotal < p_code.min_order_egp THEN
    RAISE EXCEPTION 'كود الخصم ده لطلبات بقيمة % ج.م أو أكثر', p_code.min_order_egp;
  END IF;
  IF p_code.one_per_phone AND p_phone <> '' AND EXISTS (
    SELECT 1 FROM orders o
     WHERE o.discount_code = p_code.code AND o.customer_phone = p_phone
       AND o.order_status <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'استخدمتي كود الخصم ده قبل كده';
  END IF;

  IF p_code.discount_type = 'percent' THEN
    v_discount := round(p_subtotal * p_code.value / 100, 2);
    IF p_code.max_discount_egp IS NOT NULL THEN
      v_discount := least(v_discount, p_code.max_discount_egp);
    END IF;
  ELSE
    v_discount := p_code.value;
  END IF;
  RETURN least(v_discount, p_subtotal);
END;
$$;
REVOKE ALL ON FUNCTION compute_discount(discount_codes, NUMERIC, TEXT) FROM PUBLIC;

-- معاينة الخصم في صفحة الشيك أوت (للعرض بس - الحساب الحقيقي في place_order)
CREATE OR REPLACE FUNCTION preview_discount(p_code TEXT, p_subtotal NUMERIC, p_phone TEXT DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code discount_codes;
BEGIN
  IF length(coalesce(p_code, '')) > 30 THEN
    RAISE EXCEPTION 'كود الخصم غير صحيح';
  END IF;
  SELECT * INTO v_code FROM discount_codes WHERE code = upper(trim(p_code));
  RETURN compute_discount(
    v_code, coalesce(p_subtotal, 0),
    regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')
  );
END;
$$;
REVOKE ALL ON FUNCTION preview_discount(TEXT, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION preview_discount(TEXT, NUMERIC, TEXT) TO anon, authenticated;

-- ---------- place_order بالخصم ----------
DROP FUNCTION IF EXISTS place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION place_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_whatsapp_phone TEXT,
  p_governorate TEXT,
  p_city_address TEXT,
  p_notes TEXT,
  p_payment_method TEXT,
  p_allow_inspection BOOLEAN,
  p_items JSONB,
  p_discount_code TEXT DEFAULT NULL
)
RETURNS TABLE (order_id UUID, order_number INT, total_amount_egp NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_phone TEXT := regexp_replace(coalesce(p_customer_phone, ''), '[^0-9+]', '', 'g');
  v_shipping NUMERIC;
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_code discount_codes;
  v_order_id UUID;
  v_order_number INT;
  v_item JSONB;
  v_qty INT;
  v_variant RECORD;
  v_total_qty INT;
  v_headers JSON := nullif(current_setting('request.headers', true), '')::JSON;
  v_ip TEXT;
BEGIN
  -- IP العميلة (Supabase بيمرر هيدرز الطلب للدالة)
  v_ip := coalesce(
    v_headers->>'cf-connecting-ip',
    trim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1))
  );
  v_ip := nullif(left(v_ip, 64), '');

  IF length(trim(coalesce(p_customer_name, ''))) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'الرجاء إدخال الاسم';
  END IF;
  IF length(regexp_replace(v_phone, '[^0-9]', '', 'g')) NOT BETWEEN 10 AND 15 THEN
    RAISE EXCEPTION 'الرجاء إدخال رقم هاتف صحيح';
  END IF;
  IF length(trim(coalesce(p_city_address, ''))) NOT BETWEEN 5 AND 500 THEN
    RAISE EXCEPTION 'الرجاء إدخال العنوان بالتفصيل';
  END IF;
  IF length(coalesce(p_notes, '')) > 1000 OR length(coalesce(p_whatsapp_phone, '')) > 20
     OR length(coalesce(p_discount_code, '')) > 30 THEN
    RAISE EXCEPTION 'البيانات المدخلة طويلة جداً';
  END IF;
  IF p_payment_method NOT IN ('COD', 'Vodafone Cash') THEN
    RAISE EXCEPTION 'طريقة الدفع دي غير متاحة حالياً';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 30 THEN
    RAISE EXCEPTION 'سلتك فارغة';
  END IF;

  SELECT coalesce(sum((e->>'quantity')::INT), 0) INTO v_total_qty FROM jsonb_array_elements(p_items) e;
  IF v_total_qty > 20 THEN
    RAISE EXCEPTION 'الحد الأقصى 20 قطعة في الطلب الواحد - للطلبات الأكبر تواصلي معنا على واتساب';
  END IF;

  -- قفل على الرقم والـ IP لحد آخر العملية: طلبات متوازية من نفس المصدر
  -- بتستنى بعض، فمتقدرش تعدّي الحد مع بعض.
  PERFORM pg_advisory_xact_lock(hashtext('order-phone:' || v_phone));
  IF v_ip IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('order-ip:' || v_ip));
  END IF;

  IF (SELECT count(*) FROM orders o
      WHERE o.customer_phone = v_phone AND o.created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'عدد كبير من الطلبات من نفس الرقم، برجاء المحاولة بعد قليل أو التواصل معنا على واتساب';
  END IF;
  IF v_ip IS NOT NULL AND (SELECT count(*) FROM orders o
      WHERE o.client_ip = v_ip AND o.created_at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'عدد كبير من الطلبات، برجاء المحاولة بعد قليل أو التواصل معنا على واتساب';
  END IF;

  SELECT s.cost_egp INTO v_shipping FROM shipping_rates s WHERE s.governorate_ar = p_governorate;
  IF v_shipping IS NULL THEN
    RAISE EXCEPTION 'الرجاء اختيار المحافظة';
  END IF;

  INSERT INTO orders (
    client_ip, user_id, customer_name, customer_phone, whatsapp_phone, governorate, city_address,
    subtotal_egp, shipping_fee_egp, total_amount_egp, payment_method, order_status,
    allow_inspection, notes
  ) VALUES (
    v_ip, auth.uid(), trim(p_customer_name), v_phone, nullif(trim(coalesce(p_whatsapp_phone, '')), ''),
    p_governorate, trim(p_city_address), 0, v_shipping, 0, p_payment_method, 'pending',
    coalesce(p_allow_inspection, true), nullif(trim(coalesce(p_notes, '')), '')
  )
  RETURNING id, orders.order_number INTO v_order_id, v_order_number;

  -- بالترتيب حسب variant_id: طلبين فيهم نفس المنتجات بيقفلوا الصفوف بنفس
  -- الترتيب، فمفيش deadlock.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'variant_id' LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'كمية غير صحيحة';
    END IF;

    SELECT pv.id, pv.product_id, pv.stock_quantity, pv.size, pv.color_ar, p.title_ar,
           coalesce(p.sale_price_egp, p.price_egp) AS unit_price
      INTO v_variant
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
     WHERE pv.id = (v_item->>'variant_id')::UUID
       AND p.status = 'active'
     FOR UPDATE OF pv;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'منتج في السلة لم يعد متاحاً، برجاء تحديث السلة';
    END IF;
    IF coalesce(v_variant.stock_quantity, 0) < v_qty THEN
      RAISE EXCEPTION 'الكمية المطلوبة من أحد المنتجات غير متوفرة حالياً';
    END IF;

    UPDATE product_variants SET stock_quantity = stock_quantity - v_qty WHERE id = v_variant.id;

    INSERT INTO order_items (
      order_id, product_id, variant_id, quantity, unit_price_egp, product_title, variant_size, variant_color
    ) VALUES (
      v_order_id, v_variant.product_id, v_variant.id, v_qty, v_variant.unit_price,
      v_variant.title_ar, v_variant.size, v_variant.color_ar
    );

    v_subtotal := v_subtotal + v_variant.unit_price * v_qty;
  END LOOP;

  IF nullif(trim(coalesce(p_discount_code, '')), '') IS NOT NULL THEN
    -- FOR UPDATE: بيمنع إن طلبين في نفس اللحظة يعدّوا حد الاستخدام
    SELECT * INTO v_code FROM discount_codes WHERE code = upper(trim(p_discount_code)) FOR UPDATE;
    v_discount := compute_discount(v_code, v_subtotal, v_phone);
    UPDATE discount_codes SET used_count = used_count + 1 WHERE id = v_code.id;
  END IF;

  -- شحن مجاني لو قيمة المنتجات بعد الخصم وصلت الحد
  IF (SELECT st.free_shipping_threshold_egp FROM store_settings st LIMIT 1) <= v_subtotal - v_discount THEN
    v_shipping := 0;
  END IF;

  UPDATE orders
     SET subtotal_egp = v_subtotal,
         shipping_fee_egp = v_shipping,
         discount_code = v_code.code,
         discount_egp = v_discount,
         total_amount_egp = v_subtotal - v_discount + v_shipping
   WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_order_number, v_subtotal - v_discount + v_shipping;
END;
$$;

REVOKE ALL ON FUNCTION place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB, TEXT) TO anon, authenticated;

-- ---------- attach_order_receipt (أشد) ----------
CREATE OR REPLACE FUNCTION attach_order_receipt(p_order_id UUID, p_receipt TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- صور raster بس (مش SVG اللي ممكن يكون فيها سكريبت)، وحجم أقصى ~450KB
  IF p_receipt IS NULL OR length(p_receipt) > 600000
     OR p_receipt !~ '^data:image/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$' THEN
    RAISE EXCEPTION 'صورة الإيصال غير صالحة';
  END IF;

  UPDATE orders
     SET payment_receipt_url = p_receipt
   WHERE id = p_order_id
     AND payment_method = 'Vodafone Cash'
     AND payment_receipt_url IS NULL
     AND created_at > now() - interval '2 hours';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'تعذر إرفاق الإيصال لهذا الطلب';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION attach_order_receipt(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attach_order_receipt(UUID, TEXT) TO anon, authenticated;

-- ---------- تعديل المخزون بالفرق (لوحة التحكم) ----------
-- بدل ما الفورم يكتب رقم المخزون كله (ويمسح المبيعات اللي حصلت وهو مفتوح)،
-- بيبعت الفرق بس: +5 أو -2.
CREATE OR REPLACE FUNCTION adjust_variant_stock(p_variant_id UUID, p_delta INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock INT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;
  UPDATE product_variants
     SET stock_quantity = greatest(0, coalesce(stock_quantity, 0) + p_delta)
   WHERE id = p_variant_id
  RETURNING stock_quantity INTO v_stock;
  RETURN v_stock;
END;
$$;
REVOKE ALL ON FUNCTION adjust_variant_stock(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION adjust_variant_stock(UUID, INT) TO authenticated;

-- =====================================================================
-- إلغاء الطلب بيرجّع المخزون
-- =====================================================================
CREATE OR REPLACE FUNCTION orders_restock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sign INT;
BEGIN
  IF NEW.order_status = 'cancelled' AND OLD.order_status IS DISTINCT FROM 'cancelled' THEN
    v_sign := 1;   -- الطلب اتلغى: رجّع الكمية للمخزون
  ELSIF OLD.order_status = 'cancelled' AND NEW.order_status IS DISTINCT FROM 'cancelled' THEN
    v_sign := -1;  -- الإلغاء اتراجع عنه: اخصم الكمية تاني
  ELSE
    RETURN NEW;
  END IF;

  UPDATE product_variants pv
     SET stock_quantity = greatest(0, pv.stock_quantity + v_sign * oi.quantity)
    FROM order_items oi
   WHERE oi.order_id = NEW.id AND oi.variant_id = pv.id;

  IF NEW.discount_code IS NOT NULL THEN
    UPDATE discount_codes
       SET used_count = greatest(0, used_count - v_sign)
     WHERE code = NEW.discount_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_restock_on_cancel ON orders;
CREATE TRIGGER trg_orders_restock_on_cancel
  AFTER UPDATE OF order_status ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_restock_on_cancel();

NOTIFY pgrst, 'reload schema';
