import { StorefrontLayout } from '@/components/store/storefront-layout';
import { CheckoutForm } from '@/components/store/checkout-form';
import { getShippingRates } from '@/lib/data';

export const revalidate = 60;

export default async function CheckoutPage() {
  const shippingRates = await getShippingRates();
  return (
    <StorefrontLayout>
      <CheckoutForm shippingRates={shippingRates} />
    </StorefrontLayout>
  );
}
