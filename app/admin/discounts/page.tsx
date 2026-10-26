import { getDiscountCodesAdmin } from '@/lib/admin-data';
import { DiscountsClient } from '@/components/admin/discounts-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminDiscountsPage() {
  const codes = await getDiscountCodesAdmin();
  return (
    <AdminGuard>
      <DiscountsClient codes={codes} />
    </AdminGuard>
  );
}
