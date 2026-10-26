import { SiteHeader } from '@/components/store/site-header';
import { SiteFooter } from '@/components/store/site-footer';
import { CartDrawer } from '@/components/store/cart-drawer';
import { WhatsAppButton } from '@/components/store/whatsapp-button';
import { MetaPixel } from '@/components/store/meta-pixel';
import { AttributionCapture } from '@/components/store/attribution-capture';
import { getStoreSettings } from '@/lib/data';

export async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:bg-foreground focus:text-background focus:px-5 focus:py-3 font-arabic text-sm"
      >
        تخطي إلى المحتوى
      </a>
      <SiteHeader />
      <CartDrawer freeShippingThreshold={settings.free_shipping_threshold_egp} />
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      <MetaPixel />
      <AttributionCapture />
    </>
  );
}
