// رابط الموقع الأساسي: بيستخدم في metadataBase والـ canonical والـ sitemap
// وبيانات جوجل والكتالوج. الترتيب:
// 1. NEXT_PUBLIC_SITE_URL لو اتحطت (الأضمن - https://soraia.store)
// 2. VERCEL_PROJECT_PRODUCTION_URL: بيحطه Vercel تلقائي = الدومين الأساسي
//    للـ Production (من غير https://)
// 3. URL: نفس الفكرة على Netlify
// 4. الدومين الحالي كاحتياطي
// مهم: لو الرابط ده غلط، جوجل بيفتكر إن المنتجات تبع دومين تاني (canonical
// بيشاور عليه) فمبيأرشفهاش على دومينك.
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.URL) return process.env.URL;
  return 'https://soraia.store';
}

export const SITE_URL = resolveSiteUrl().replace(/\/$/, '');
