import { getShippingRatesAdmin } from '@/lib/admin-data';
import { getStoreSettings } from '@/lib/data';
import { ShippingClient } from '@/components/admin/shipping-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminShippingPage() {
  const [rates, settings] = await Promise.all([getShippingRatesAdmin(), getStoreSettings()]);
  return (
    <AdminGuard>
      <ShippingClient rates={rates} freeShippingThreshold={settings.free_shipping_threshold_egp} />
    </AdminGuard>
  );
}
