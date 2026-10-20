import { createClient } from '@supabase/supabase-js';

// عميل Supabase للبيانات العامة (المنتجات، الفئات، أسعار الشحن) من غير
// كوكيز. السبب: supabaseServer() بيقرا cookies()، وده بيجبر Next يبني كل
// صفحة من جديد مع كل زيارة ويعمل طلب لقاعدة البيانات كل مرة - فـ revalidate
// كانت بتتجاهل وزمن الاستجابة كان عالي (~1 ثانية). بالعميل ده الصفحات العامة
// بتتكاش (ISR) وبتتقدم من الـ CDN مباشرة، فلو جالك ضغط مفاجئ من الإعلانات
// قاعدة البيانات بتاخد طلب واحد كل فترة revalidate بدل طلب لكل زائر.
// البيانات دي متاحة للـ anon أصلاً بسياسات RLS، فمفيش أي صلاحيات زيادة.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
