// رابط الموقع الأساسي: بيستخدم في metadataBase والـ canonical والـ sitemap
// وبيانات جوجل والكتالوج. الترتيب:
// 1. NEXT_PUBLIC_SITE_URL لو اتحطت على Netlify (الأفضل - حطي الدومين الحقيقي)
// 2. URL: متغير بيحطه Netlify تلقائي = الدومين الأساسي المربوط بالموقع
// 3. احتياطي
// مهم: لو الرابط ده غلط، جوجل بيفتكر إن المنتجات تبع دومين تاني (canonical
// بيشاور عليه) فمبيأرشفهاش على دومينك.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || 'https://soraia.eg').replace(/\/$/, '');
