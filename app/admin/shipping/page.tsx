import { getShippingRatesAdmin } from '@/lib/admin-data';
import { ShippingClient } from '@/components/admin/shipping-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminShippingPage() {
  const rates = await getShippingRatesAdmin();
  return (
    <AdminGuard>
      <ShippingClient rates={rates} />
    </AdminGuard>
  );
}
