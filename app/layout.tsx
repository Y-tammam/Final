import './globals.css';
import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans, Cairo } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/lib/cart-context';
import { AuthProvider } from '@/lib/auth-context';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://anaqa.eg'),
  title: 'أناقة | ملابس نسائية تركية فاخرة في مصر',
  description: 'أحدث صيحات الموضة والملابس التركية الفاخرة للنساء في مصر. عبايات، فساتين، وكاجوال بخامات تركية 100%. معاينة قبل الدفع وشحن سريع لكافة المحافظات.',
  keywords: ['ملابس تركية', 'عبايات', 'فساتين', 'موضة نسائية', 'مصر', 'أزياء فاخرة'],
  openGraph: {
    title: 'أناقة | ملابس نسائية تركية فاخرة في مصر',
    description: 'أحدث صيحات الموضة والملابس التركية الفاخرة للنساء في مصر',
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
