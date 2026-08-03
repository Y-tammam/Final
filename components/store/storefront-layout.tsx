import { SiteHeader } from '@/components/store/site-header';
import { SiteFooter } from '@/components/store/site-footer';
import { CartDrawer } from '@/components/store/cart-drawer';

export function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <CartDrawer />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
