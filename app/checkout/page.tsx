import { StorefrontLayout } from '@/components/store/storefront-layout';
import { CheckoutForm } from '@/components/store/checkout-form';
import { getShippingRates, getStoreSettings } from '@/lib/data';

export const revalidate = 60;

export default async function CheckoutPage() {
  const [shippingRates, settings] = await Promise.all([getShippingRates(), getStoreSettings()]);
  return (
    <StorefrontLayout>
      <CheckoutForm shippingRates={shippingRates} freeShippingThreshold={settings.free_shipping_threshold_egp} />
    </StorefrontLayout>
  );
}
