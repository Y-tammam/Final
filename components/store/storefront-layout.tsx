import { SiteHeader } from '@/components/store/site-header';
import { SiteFooter } from '@/components/store/site-footer';
import { CartDrawer } from '@/components/store/cart-drawer';
import { WhatsAppButton } from '@/components/store/whatsapp-button';
import { MetaPixel } from '@/components/store/meta-pixel';
import { getStoreSettings } from '@/lib/data';

export async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <>
      <SiteHeader />
      <CartDrawer freeShippingThreshold={settings.free_shipping_threshold_egp} />
      <main>{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      <MetaPixel />
    </>
  );
}
