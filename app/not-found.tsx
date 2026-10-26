import Link from 'next/link';
import { StorefrontLayout } from '@/components/store/storefront-layout';

// صفحة 404 بالعربي جوه شكل المتجر (بدل صفحة Next الإنجليزي الافتراضية)
export default function NotFound() {
  return (
    <StorefrontLayout>
      <section className="max-w-xl mx-auto px-4 py-24 lg:py-32 text-center">
        <p className="font-body text-xs tracking-[0.3em] text-muted-foreground mb-4">404</p>
        <h1 className="font-display text-3xl sm:text-4xl font-medium leading-[1.3] mb-4">الصفحة دي مش موجودة</h1>
        <p className="font-arabic text-muted-foreground leading-relaxed mb-10">
          ممكن يكون المنتج خلص أو الرابط اتغير. اكتشفي التشكيلة الحالية.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="font-arabic bg-foreground text-primary-foreground px-8 py-3 hover:bg-foreground/85 transition-colors">
            تسوّقي التشكيلة
          </Link>
          <Link href="/" className="font-arabic border border-border px-8 py-3 hover:border-foreground transition-colors">
            الرئيسية
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
}
