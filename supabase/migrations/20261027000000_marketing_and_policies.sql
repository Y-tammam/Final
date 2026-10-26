/*
# أدوات الإعلانات + صفحات السياسات + حماية من الطلبات الوهمية

## اللي بيضيفه الملف ده
1. شريط الإعلانات أعلى الموقع: نص + رابط + تاريخ انتهاء، بيتعدّل من لوحة
   التحكم (صفحة الإعدادات) من غير ما تنشري الموقع تاني - عشان العرض اللي في
   الإعلان يبقى نفس اللي العميلة تشوفه أول ما تدخل.
2. صفحات السياسات (الشحن، الاستبدال والاسترجاع، الخصوصية): بتتكتب من لوحة
   التحكم. ميتا وجوجل بيطلبوا الصفحات دي قبل ما يوافقوا على الإعلانات.
3. مصدر كل طلب (utm_source / utm_campaign / fbclid ...): عشان تعرفي كل حملة
   جابت كام طلب اتسلّم فعلاً، مش بس اللي Ads Manager بيعدّه.
4. event_id + fbp/fbc لكل طلب: لـ Meta Conversions API (الشراء بيتبعت من
   السيرفر كمان، فالإعلانات بتتحسن حتى لو المتصفح فيه مانع إعلانات).
5. حظر أرقام: رقم بيرفض الاستلام كتير؟ المالك يحظره من صفحة الطلب، وأي طلب
   جديد منه بيترفض (أو تسمحي له بفودافون كاش بس).
6. السلات المتروكة: لما العميلة تكتب رقمها في صفحة الدفع وما تكملش، بيتسجل
   في "الطلبات المتروكة" عشان تكلميها على واتساب.

## التشغيل
شغّليه في Supabase SQL Editor بعد ملف 20261026000000. آمن يتشغل أكتر من مرة.
*/

-- =====================================================================
-- 1) شريط الإعلانات
-- =====================================================================
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_text TEXT
  CHECK (announcement_text IS NULL OR length(announcement_text) <= 200);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_link TEXT
  CHECK (announcement_link IS NULL OR announcement_link ~ '^/[A-Za-z0-9/_?=&%.#-]*$');
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_ends_at TIMESTAMPTZ;

-- =====================================================================
-- 2) صفحات السياسات
-- =====================================================================
CREATE TABLE IF NOT EXISTS store_pages (
  slug TEXT PRIMARY KEY CHECK (slug IN ('shipping', 'exchange', 'privacy')),
  title_ar TEXT NOT NULL CHECK (length(title_ar) BETWEEN 2 AND 120),
  body_ar TEXT NOT NULL DEFAULT '' CHECK (length(body_ar) <= 20000),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;

INSERT INTO store_pages (slug, title_ar) VALUES
  ('shipping', 'سياسة الشحن والتوصيل'),
  ('exchange', 'سياسة الاستبدال والاسترجاع'),
  ('privacy', 'سياسة الخصوصية')
ON CONFLICT (slug) DO NOTHING;

DROP POLICY IF EXISTS "public_read_store_pages" ON store_pages;
CREATE POLICY "public_read_store_pages" ON store_pages FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_update_store_pages" ON store_pages;
CREATE POLICY "admin_update_store_pages" ON store_pages FOR UPDATE
  TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));

-- =====================================================================
-- 3+4) مصدر الطلب + بيانات Conversions API
-- =====================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_id UUID DEFAULT gen_random_uuid();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS attribution JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS capi_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_orders_campaign ON orders ((attribution->>'utm_campaign')) WHERE attribution IS NOT NULL;

-- =====================================================================
-- 5) حظر الأرقام
-- =====================================================================
CREATE TABLE IF NOT EXISTS blocked_phones (
  phone TEXT PRIMARY KEY,
  -- 'block' = ممنوع يطلب خالص، 'prepaid' = يطلب بفودافون كاش بس
  mode TEXT NOT NULL DEFAULT 'prepaid' CHECK (mode IN ('block', 'prepaid')),
  reason TEXT CHECK (reason IS NULL OR length(reason) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE blocked_phones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_blocked_phones" ON blocked_phones;
CREATE POLICY "admin_all_blocked_phones" ON blocked_phones FOR ALL
  TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));

-- =====================================================================
-- 6) السلات المتروكة
-- =====================================================================
CREATE TABLE IF NOT EXISTS checkout_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  customer_name TEXT,
  governorate TEXT,
  cart JSONB NOT NULL,
  subtotal_egp NUMERIC(10,2),
  attribution JSONB,
  client_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  recovered_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  contacted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_checkout_drafts_open_phone ON checkout_drafts(phone) WHERE recovered_order_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_checkout_drafts_created ON checkout_drafts(created_at DESC);
ALTER TABLE checkout_drafts ENABLE ROW LEVEL SECURITY;

-- الموظفين والمالك يشوفوا السلات المتروكة ويعلّموا إنهم كلموا العميلة
DROP POLICY IF EXISTS "staff_read_checkout_drafts" ON checkout_drafts;
CREATE POLICY "staff_read_checkout_drafts" ON checkout_drafts FOR SELECT
  TO authenticated USING ((select is_staff()));
DROP POLICY IF EXISTS "staff_update_checkout_drafts" ON checkout_drafts;
CREATE POLICY "staff_update_checkout_drafts" ON checkout_drafts FOR UPDATE
  TO authenticated USING ((select is_staff())) WITH CHECK ((select is_staff()));
DROP POLICY IF EXISTS "admin_delete_checkout_drafts" ON checkout_drafts;
CREATE POLICY "admin_delete_checkout_drafts" ON checkout_drafts FOR DELETE
  TO authenticated USING ((select is_admin()));

-- بيتنادى من صفحة الدفع لما العميلة تكتب رقمها. سلة واحدة مفتوحة لكل رقم
-- (بتتحدث)، وحد 30 سلة في الساعة لكل IP عشان محدش يملا الجدول.
CREATE OR REPLACE FUNCTION save_checkout_draft(
  p_phone TEXT,
  p_customer_name TEXT,
  p_governorate TEXT,
  p_cart JSONB,
  p_attribution JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_headers JSON := nullif(current_setting('request.headers', true), '')::JSON;
  v_ip TEXT;
  v_subtotal NUMERIC;
  v_cart JSONB;
BEGIN
  IF length(regexp_replace(v_phone, '[^0-9]', '', 'g')) NOT BETWEEN 10 AND 15 THEN
    RETURN;
  END IF;
  IF p_cart IS NULL OR jsonb_typeof(p_cart) <> 'array' OR jsonb_array_length(p_cart) = 0
     OR jsonb_array_length(p_cart) > 30 OR length(p_cart::TEXT) > 20000
     OR length(coalesce(p_attribution::TEXT, '')) > 3000 THEN
    RETURN;
  END IF;

  v_ip := nullif(left(coalesce(v_headers->>'cf-connecting-ip',
    trim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1))), 64), '');
  IF v_ip IS NOT NULL AND (SELECT count(*) FROM checkout_drafts d
      WHERE d.client_ip = v_ip AND d.updated_at > now() - interval '1 hour') >= 30 THEN
    RETURN;
  END IF;

  -- السلة بتتبني من الأسعار والأسماء الحقيقية (مش من المتصفح)، والمقاسات
  -- اللي مش موجودة بتتشال
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'variant_id', pv.id, 'product_id', p.id, 'title', p.title_ar, 'slug', p.slug,
           'size', pv.size, 'color', pv.color_ar,
           'quantity', least(greatest((e->>'quantity')::INT, 1), 20),
           'unit_price', coalesce(p.sale_price_egp, p.price_egp))), '[]'::JSONB),
         coalesce(sum(coalesce(p.sale_price_egp, p.price_egp) * least(greatest((e->>'quantity')::INT, 1), 20)), 0)
    INTO v_cart, v_subtotal
    FROM jsonb_array_elements(p_cart) e
    JOIN product_variants pv ON pv.id = (e->>'variant_id')::UUID
    JOIN products p ON p.id = pv.product_id AND p.status = 'active'
   WHERE (e->>'variant_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     AND (e->>'quantity') ~ '^[0-9]{1,3}$';
  IF jsonb_array_length(v_cart) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO checkout_drafts (phone, customer_name, governorate, cart, subtotal_egp, attribution, client_ip)
  VALUES (v_phone, left(trim(coalesce(p_customer_name, '')), 100), left(coalesce(p_governorate, ''), 100),
          v_cart, v_subtotal, p_attribution, v_ip)
  ON CONFLICT (phone) WHERE recovered_order_id IS NULL DO UPDATE
    SET customer_name = EXCLUDED.customer_name,
        governorate = EXCLUDED.governorate,
        cart = EXCLUDED.cart,
        subtotal_egp = EXCLUDED.subtotal_egp,
        attribution = coalesce(checkout_drafts.attribution, EXCLUDED.attribution),
        updated_at = now();
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
  -- variant_id أو quantity مش صالحين: نتجاهل بهدوء
  RETURN;
END;
$$;
REVOKE ALL ON FUNCTION save_checkout_draft(TEXT, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_checkout_draft(TEXT, TEXT, TEXT, JSONB, JSONB) TO anon, authenticated;

-- =====================================================================
-- place_order: + مصدر الطلب + حظر الأرقام + ربط السلة المتروكة + event_id
-- =====================================================================
DROP FUNCTION IF EXISTS place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB);
DROP FUNCTION IF EXISTS place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB, TEXT);

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
  p_discount_code TEXT DEFAULT NULL,
  p_attribution JSONB DEFAULT NULL
)
RETURNS TABLE (order_id UUID, order_number INT, total_amount_egp NUMERIC, event_id UUID)
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
  v_event_id UUID;
  v_block TEXT;
  v_attr JSONB;
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

  -- أرقام محظورة من لوحة التحكم (رفض استلام متكرر / طلبات وهمية)
  SELECT b.mode INTO v_block FROM blocked_phones b WHERE b.phone = v_phone;
  IF v_block = 'block' THEN
    RAISE EXCEPTION 'تعذر إتمام الطلب، برجاء التواصل معنا على واتساب';
  ELSIF v_block = 'prepaid' AND p_payment_method = 'COD' THEN
    RAISE EXCEPTION 'برجاء اختيار الدفع بفودافون كاش لإتمام الطلب، أو تواصلي معنا على واتساب';
  END IF;

  -- مصدر الطلب: مفاتيح معروفة بس، وكل قيمة نص قصير
  IF p_attribution IS NOT NULL AND jsonb_typeof(p_attribution) = 'object' THEN
    SELECT jsonb_object_agg(k, left(v, 300)) INTO v_attr
      FROM jsonb_each_text(p_attribution) AS t(k, v)
     WHERE k IN ('utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                 'fbclid', 'ttclid', 'gclid', 'landing_path', 'fbp', 'fbc');
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
    attribution, user_agent,
    client_ip, user_id, customer_name, customer_phone, whatsapp_phone, governorate, city_address,
    subtotal_egp, shipping_fee_egp, total_amount_egp, payment_method, order_status,
    allow_inspection, notes
  ) VALUES (
    v_attr, left(v_headers->>'user-agent', 400),
    v_ip, auth.uid(), trim(p_customer_name), v_phone, nullif(trim(coalesce(p_whatsapp_phone, '')), ''),
    p_governorate, trim(p_city_address), 0, v_shipping, 0, p_payment_method, 'pending',
    coalesce(p_allow_inspection, true), nullif(trim(coalesce(p_notes, '')), '')
  )
  RETURNING id, orders.order_number, orders.event_id INTO v_order_id, v_order_number, v_event_id;

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
      IF coalesce(v_variant.stock_quantity, 0) = 0 THEN
        RAISE EXCEPTION '% (% - مقاس %) نفد من المخزون', v_variant.title_ar, v_variant.color_ar, v_variant.size;
      END IF;
      RAISE EXCEPTION 'متاح % بس من % (% - مقاس %)', v_variant.stock_quantity, v_variant.title_ar, v_variant.color_ar, v_variant.size;
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

  -- السلة المتروكة بتاعة الرقم ده اتحولت لطلب
  UPDATE checkout_drafts d SET recovered_order_id = v_order_id, updated_at = now()
   WHERE d.phone = v_phone AND d.recovered_order_id IS NULL;

  RETURN QUERY SELECT v_order_id, v_order_number, v_subtotal - v_discount + v_shipping, v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB, TEXT, JSONB) TO anon, authenticated;


NOTIFY pgrst, 'reload schema';
