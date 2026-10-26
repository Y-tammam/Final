// رابط الموقع الأساسي: بيستخدم في metadataBase والـ sitemap وبيانات جوجل.
// حطي NEXT_PUBLIC_SITE_URL على Netlify بالدومين الحقيقي (من غير / في الآخر).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://soraia.eg').replace(/\/$/, '');
