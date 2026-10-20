import './globals.css';
import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans, Cairo } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/lib/cart-context';
import { AuthProvider } from '@/lib/auth-context';
import { BRAND_CONFIG } from '@/lib/brand';

// الخطوط التلاتة "Variable fonts": من غير ما نحدد weight بيتحمل ملف واحد
// لكل خط بيغطي كل الأوزان، بدل ملف منفصل لكل وزن (كانوا 15 ملف خط بيتحملوا
// قبل ما الصفحة تظهر). Cairo هو الخط الأساسي فبيتعمله preload، والباقيين
// بيتحملوا عادي عشان ميزاحموش صورة الهيرو.
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: false,
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

// اسم الموقع اللي بيظهر في تاب المتصفح ونتائج البحث ومعاينة الروابط (WhatsApp/Facebook)
// بييجي دلوقتي من BRAND_CONFIG بدل ما يكون مكتوب يدوي، عشان يتغير مكان واحد بس
// (lib/brand.ts) وينعكس هنا تلقائي - مفيش داعي لتعديل الملف ده تاني لو الاسم اتغير.
const SITE_TITLE = `${BRAND_CONFIG.nameArabic} | ${BRAND_CONFIG.tagline}`;

export const metadata: Metadata = {
  // ⚠️ لازم تغيّري الدومين ده لدومينك الحقيقي (اللي هتربطيه بـ Netlify) عشان
  // روابط الصور والمعاينة (Open Graph) تشتغل صح لما حد يشارك رابط الموقع.
  metadataBase: new URL('https://soraia.eg'),
  title: { default: SITE_TITLE, template: `%s | ${BRAND_CONFIG.nameArabic}` },
  description: BRAND_CONFIG.tagline,
  keywords: ['ملابس تركية', 'عبايات', 'فساتين', 'موضة نسائية', 'مصر', 'أزياء فاخرة', BRAND_CONFIG.nameArabic],
  openGraph: {
    title: SITE_TITLE,
    description: BRAND_CONFIG.tagline,
    type: 'website',
    locale: 'ar_EG',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${playfair.variable} ${jakarta.variable} ${cairo.variable} font-arabic bg-background text-foreground antialiased`}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
