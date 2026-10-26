import './globals.css';
import type { Metadata } from 'next';
import { Playfair_Display, Cairo, El_Messiri } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { AuthProvider } from '@/lib/auth-context';
import { BRAND_CONFIG } from '@/lib/brand';
import { SITE_URL } from '@/lib/site';

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

// خط عناوين عربي راقي (Variable - ملف واحد). Playfair بيغطي الحروف
// الإنجليزية في العناوين، و El Messiri بيغطي العربي بدل ما يقع على خط
// النظام العادي.
const messiri = El_Messiri({
  subsets: ['arabic'],
  variable: '--font-messiri',
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
  // الدومين بييجي من NEXT_PUBLIC_SITE_URL (lib/site.ts) عشان روابط الصور
  // والمعاينة (Open Graph) تشتغل صح لما حد يشارك رابط الموقع.
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${BRAND_CONFIG.nameArabic}` },
  description: BRAND_CONFIG.tagline,
  keywords: ['ملابس تركية', 'عبايات', 'فساتين', 'موضة نسائية', 'مصر', 'أزياء فاخرة', BRAND_CONFIG.nameArabic],
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_TITLE,
    description: BRAND_CONFIG.tagline,
    type: 'website',
    locale: 'ar_EG',
    siteName: BRAND_CONFIG.nameArabic,
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: BRAND_CONFIG.tagline },
  // توثيق Google Search Console: حطي الكود في NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

// بيانات المتجر لجوجل (اسم البراند واللوجو وطرق التواصل)
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'OnlineStore',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND_CONFIG.nameArabic,
      alternateName: BRAND_CONFIG.name,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: BRAND_CONFIG.tagline,
      sameAs: [`https://instagram.com/${BRAND_CONFIG.contact.instagram.replace('@', '')}`],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: BRAND_CONFIG.contact.whatsapp,
        contactType: 'customer service',
        areaServed: 'EG',
        availableLanguage: ['ar'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND_CONFIG.nameArabic,
      inLanguage: 'ar',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD).replace(/</g, '\\u003c') }}
        />
      </head>
      <body className={`${playfair.variable} ${messiri.variable} ${cairo.variable} font-arabic bg-background text-foreground antialiased`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
