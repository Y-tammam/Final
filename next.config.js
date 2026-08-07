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
    ],
    formats: ['image/webp'],
  },
};

module.exports = nextConfig;
