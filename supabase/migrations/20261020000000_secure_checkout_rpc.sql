/*
# إصلاح أمني: الطلبات بتتسعّر على السيرفر + حماية من السبام

## المشاكل اللي بنقفلها
1. التلاعب بالأسعار: المتصفح كان بيبعت subtotal_egp و total_amount_egp و
   unit_price_egp بنفسه، وسياسة anon_insert_orders كانت WITH CHECK (true).
   أي حد يفتح Console يقدر يعمل طلب بـ 1 جنيه، أو يحط order_status = 'delivered'.
2. أي حد يقدر يضيف order_items على أي طلب (حتى طلبات ناس تانية) لو عرف الـ id.
3. رفع إيصال فودافون كاش كان update مباشر على orders - وده مكنش شغال أصلاً
   لأن مفيش سياسة UPDATE غير للأدمن (والضيف مكنش يقدر يقرا الطلب بعد إنشاءه).
4. منتجات الـ draft (status <> 'active') كانت مقروءة لأي حد.
5. مفيش أي حد لعدد الطلبات - بوت يقدر يغرق لوحة التحكم بآلاف الطلبات الوهمية.

## الحل
- place_order(): دالة واحدة بتاخد بيانات العميلة + (variant_id, quantity) بس،
  وبتحسب الأسعار والشحن من قاعدة البيانات، وبتتأكد إن المنتج active والمخزون
  كافي، وبتنقص المخزون، وبتسجل الطلب والعناصر في transaction واحدة.
  وفيها حد: 5 طلبات لكل رقم موبايل في الساعة.
- attach_order_receipt(): بتسمح بإرفاق إيصال مرة واحدة بس، لطلب فودافون كاش،
  خلال ساعتين من إنشاءه.
- شيلنا صلاحية الـ INSERT المباشر على orders / order_items من anon و authenticated
  (الأدمن بيعدّل من خلال سياسات is_admin() زي ما هو).

## التشغيل
شغّلي الملف ده في Supabase SQL Editor (آمن يتشغل أكتر من مرة)، وبعدين ارفعي
الكود الجديد (components/store/checkout-form.tsx بقى بيستخدم الدوال دي).
*/

-- ---------- منتجات الـ draft مش ظاهرة غير للأدمن ----------
DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (status = 'active' OR is_admin());

-- ---------- قفل الإدخال المباشر للطلبات ----------
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;

-- فهرس لحد الطلبات لكل رقم
CREATE INDEX IF NOT EXISTS idx_orders_phone_created ON orders(customer_phone, created_at DESC);

-- ---------- place_order ----------
CREATE OR REPLACE FUNCTION place_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_whatsapp_phone TEXT,
  p_governorate TEXT,
  p_city_address TEXT,
  p_notes TEXT,
  p_payment_method TEXT,
  p_allow_inspection BOOLEAN,
  p_items JSONB -- [{ "variant_id": uuid, "quantity": int }, ...]
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
  v_order_id UUID;
  v_order_number INT;
  v_item JSONB;
  v_qty INT;
  v_variant RECORD;
BEGIN
  -- التحقق من المدخلات
  IF length(trim(coalesce(p_customer_name, ''))) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'الرجاء إدخال الاسم';
  END IF;
  IF length(regexp_replace(v_phone, '[^0-9]', '', 'g')) NOT BETWEEN 10 AND 15 THEN
    RAISE EXCEPTION 'الرجاء إدخال رقم هاتف صحيح';
  END IF;
  IF length(trim(coalesce(p_city_address, ''))) NOT BETWEEN 5 AND 500 THEN
    RAISE EXCEPTION 'الرجاء إدخال العنوان بالتفصيل';
  END IF;
  IF length(coalesce(p_notes, '')) > 1000 OR length(coalesce(p_whatsapp_phone, '')) > 20 THEN
    RAISE EXCEPTION 'البيانات المدخلة طويلة جداً';
  END IF;
  -- Card موقوف حالياً (DISABLED_PAYMENT_METHODS في lib/brand.ts)
  IF p_payment_method NOT IN ('COD', 'Vodafone Cash') THEN
    RAISE EXCEPTION 'طريقة الدفع دي غير متاحة حالياً';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 30 THEN
    RAISE EXCEPTION 'سلتك فارغة';
  END IF;

  -- حد السبام: 5 طلبات لنفس الرقم في الساعة
  IF (SELECT count(*) FROM orders o
      WHERE o.customer_phone = v_phone AND o.created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'عدد كبير من الطلبات من نفس الرقم، برجاء المحاولة بعد قليل أو التواصل معنا على واتساب';
  END IF;

  SELECT s.cost_egp INTO v_shipping FROM shipping_rates s WHERE s.governorate_ar = p_governorate;
  IF v_shipping IS NULL THEN
    RAISE EXCEPTION 'الرجاء اختيار المحافظة';
  END IF;

  INSERT INTO orders (
    user_id, customer_name, customer_phone, whatsapp_phone, governorate, city_address,
    subtotal_egp, shipping_fee_egp, total_amount_egp, payment_method, order_status,
    allow_inspection, notes
  ) VALUES (
    auth.uid(), trim(p_customer_name), v_phone, nullif(trim(coalesce(p_whatsapp_phone, '')), ''),
    p_governorate, trim(p_city_address), 0, v_shipping, 0, p_payment_method, 'pending',
    coalesce(p_allow_inspection, true), nullif(trim(coalesce(p_notes, '')), '')
  )
  RETURNING id, orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'كمية غير صحيحة';
    END IF;

    -- FOR UPDATE: بيقفل الصف لحد ما الطلب يخلص، فطلبين في نفس اللحظة
    -- مايقدروش يشتروا آخر قطعة هما الاتنين.
    SELECT pv.id, pv.product_id, pv.stock_quantity,
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

    INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price_egp)
    VALUES (v_order_id, v_variant.product_id, v_variant.id, v_qty, v_variant.unit_price);

    v_subtotal := v_subtotal + v_variant.unit_price * v_qty;
  END LOOP;

  UPDATE orders
     SET subtotal_egp = v_subtotal, total_amount_egp = v_subtotal + v_shipping
   WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_order_number, v_subtotal + v_shipping;
END;
$$;

REVOKE ALL ON FUNCTION place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION place_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO anon, authenticated;

-- ---------- attach_order_receipt ----------
CREATE OR REPLACE FUNCTION attach_order_receipt(p_order_id UUID, p_receipt TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- الإيصال صورة WebP مضغوطة كـ data URL (receiptFileToCompressedDataURL)
  IF p_receipt IS NULL OR p_receipt NOT LIKE 'data:image/%' OR length(p_receipt) > 2000000 THEN
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

NOTIFY pgrst, 'reload schema';
