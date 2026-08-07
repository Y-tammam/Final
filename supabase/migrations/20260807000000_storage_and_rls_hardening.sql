/*
# إنشاء bucket الصور (store-images) + صلاحيات الرفع للأدمن فقط

## ليه الملف ده موجود
ده كان اللي ناقص وبيسبب مشكلة "لما بفعّل RLS مبقدرش ارفع أي داتا":
الكود في lib/image-upload.ts بيحاول يرفع الصور في bucket اسمه
"store-images"، لكن الـ bucket ده مكنش اتعمل خالص على قاعدة بياناتك
الحقيقية على Supabase - كان بس متوقع في التعليقات. رفع صورة لـ bucket
مش موجود (أو موجود بدون صلاحيات) بيرجع خطأ "Bucket not found" أو
"new row violates row-level security policy" لأي مستخدم، حتى الأدمن.

## اللي الملف ده بيعمله
1. بيعمل الـ bucket "store-images" لو مش موجود (public يعني أي حد يقدر
   يشوف الصور المرفوعة - ده طبيعي وضروري عشان صور المنتجات تظهر للزباين،
   بس الرفع/التعديل/الحذف مسموح للأدمن بس عن طريق is_admin()).
2. بيحط 4 سياسات RLS على storage.objects خاصة بالـ bucket ده بس:
   - قراءة عامة (SELECT) لأي حد، حتى لو مش مسجل دخول (عشان الصور تظهر
     في المتجر للزوار).
   - إضافة/تعديل/حذف (INSERT/UPDATE/DELETE) للأدمن بس (نفس دالة
     is_admin() المستخدمة في باقي الجداول).

## خطوة لازم تعمليها بعد تشغيل الملف ده
لو لسه معملتيش كده قبل كده: هاتي الـ User UID بتاع حساب الأدمن بتاعك من
Supabase Dashboard > Authentication > Users، وشغّلي في SQL Editor:

  insert into admin_users (user_id) values ('ضعي-الـ-UID-هنا')
  on conflict (user_id) do nothing;

من غير السطر ده، حسابك (حتى لو داخل بنجاح) مش هيقدر يرفع صور أو يضيف/يعدّل
منتجات أو فئات، لأن is_admin() هترجع false.

## آمن يتشغل أكتر من مرة
كل جملة هنا بتستخدم IF NOT EXISTS / DROP POLICY IF EXISTS، فتشغيل الملف
ده تاني (لو حصل بالغلط) مش هيكسر أي حاجة.
*/

-- ---------- إنشاء الـ bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-images', 'store-images', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- قراءة عامة لأي حد (الصور لازم تظهر للزباين والزوار) ----------
DROP POLICY IF EXISTS "public_read_store_images" ON storage.objects;
CREATE POLICY "public_read_store_images" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'store-images');

-- ---------- الرفع/التعديل/الحذف للأدمن بس ----------
DROP POLICY IF EXISTS "admin_insert_store_images" ON storage.objects;
CREATE POLICY "admin_insert_store_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'store-images' AND is_admin());

DROP POLICY IF EXISTS "admin_update_store_images" ON storage.objects;
CREATE POLICY "admin_update_store_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'store-images' AND is_admin())
  WITH CHECK (bucket_id = 'store-images' AND is_admin());

DROP POLICY IF EXISTS "admin_delete_store_images" ON storage.objects;
CREATE POLICY "admin_delete_store_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'store-images' AND is_admin());
