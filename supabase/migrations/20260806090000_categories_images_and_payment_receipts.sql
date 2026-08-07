/*
# تحديث: صور الفئات + إيصالات فودافون كاش + التأكد من عمود user_id

## ليه الملف ده موجود
الموقع كان بيديكي خطأ "Could not find the 'user_id' column of 'orders' in the
schema cache" عند تأكيد الطلب. السبب مش في الكود - ملف الهجرة
(migration) اللي بيضيف عمود user_id كان موجود في مجلد supabase/migrations
بس **متعمل لهاش تشغيل فعلي جوه قاعدة البيانات بتاعتك على Supabase**.
ملفات الهجرة دي مجرد نص SQL محفوظ في الكود، ولازم حد يشغّلها فعلياً في
Supabase (SQL Editor أو Supabase CLI) عشان تتنفذ على قاعدة البيانات
الحقيقية. الكود مبيتزامنش تلقائي مع قاعدة البيانات.

## اللي المفروض تعمليه دلوقتي
1. افتحي Supabase Dashboard -> SQL Editor.
2. افتحي الملفات التلاتة القديمة بالترتيب وشغّليهم لو حاسة إنهم ما
   اتشغلوش قبل كده:
   - 20260802014931_create_store_schema.sql
   - 20260803220256_add_user_id_to_orders_for_accounts.sql
   - 20260804120000_secure_admin_rls.sql
   (الملفات دي كلها آمنة تتشغل أكتر من مرة، كل جملة فيها بتستخدم
   IF NOT EXISTS / DROP POLICY IF EXISTS، يعني مش هتكسر حاجة لو
   اتشغلت قبل كده فعلاً).
3. بعدين شغّلي الملف ده (اللي انتي فاتحاه دلوقتي).
4. أهم خطوة: بعد ما تشغّلي أي ملف SQL بيضيف أعمدة جديدة، لازم "تعمل
   Reload" لكاش الـ Schema بتاع الـ API عشان Supabase يعرف بالعمود
   الجديد فوراً. أسهل طريقة: من نفس صفحة SQL Editor شغّلي السطر:
     NOTIFY pgrst, 'reload schema';
   (موجود في آخر الملف ده تلقائي). أو من Project Settings -> API ->
   في الغالب هيتحدث لوحده خلال دقيقة أو اتنين.

## اللي بيضيفه الملف ده تحديدًا
1. categories.image_url  - عشان تقدري ترفعي/تغيّري صورة كل فئة من لوحة
   التحكم (بدل الصور الثابتة اللي كانت متبرمجة في الكود).
2. orders.payment_receipt_url - بيخزن صورة إيصال التحويل (base64) لما
   العميلة تختار "فودافون كاش" وترفع صورة التحويل بعد تأكيد الطلب.
3. تأكيد إن orders.user_id موجود فعلاً (IF NOT EXISTS - آمن حتى لو
   شغلتيه قبل كده ضمن الملف التاني).
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- إعادة تحميل كاش الـ schema فوراً بدل ما تستني تحديث تلقائي
NOTIFY pgrst, 'reload schema';
