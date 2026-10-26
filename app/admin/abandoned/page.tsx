import { getCheckoutDraftsAdmin } from '@/lib/admin-data';
import { AbandonedClient } from '@/components/admin/abandoned-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminAbandonedPage() {
  const drafts = await getCheckoutDraftsAdmin();
  return (
    <AdminGuard>
      <AbandonedClient drafts={drafts} />
    </AdminGuard>
  );
}
