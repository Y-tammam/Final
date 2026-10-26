/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // كان unoptimized:true (يعني Next مبيعملش أي تحسين للصور) لأن كل الصور
  // كانت base64 مخزنة في قاعدة البيانات (مفيش رابط حقيقي Next يقدر يحسّنه).
  // دلوقتي الصور بترفع كملفات WebP حقيقية على Supabase Storage (شوفي
  // lib/image-upload.ts)، فبنفعّل تحسين Next: هو ده اللي بيعمل lazy loading
  // تلقائي لأي صورة مش فوق الشاشة مباشرة (أي <Image> من غير priority)،
  // وكمان بيولّد أحجام مختلفة (srcset) حسب حجم الشاشة عشان الموبايل ميحملش
  // نفس الصورة الكبيرة اللي بتظهر على الديسكتوب.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
      // صور الفئات الافتراضية في components/store/category-showcase.tsx
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
    // AVIF أصغر من WebP بحوالي 20-30% والمتصفح بياخد أول صيغة يدعمها.
    formats: ['image/avif', 'image/webp'],
    // الصور المرفوعة اسمها فريد (ومبتتغيرش)، فنخلي النسخ المحسّنة متكاشة
    // يوم كامل بدل 60 ثانية - أقل شغل على السيرفر وقت الزحمة.
    minimumCacheTTL: 86400,
  },
  poweredByHeader: false,
  // بيستورد الأيقونات/الدوال اللي بنستخدمها بس بدل المكتبة كلها
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  // هيدرز أمان لكل الصفحات: بتمنع تضمين الموقع في iframe على موقع تاني
  // (clickjacking)، وبتجبر HTTPS، وبتمنع المتصفح من تخمين نوع الملفات.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
        ],
      },
      {
        source: '/:file(logo\\.webp|logo\\.png|logo\\.jpeg)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },
};

module.exports = nextConfig;
