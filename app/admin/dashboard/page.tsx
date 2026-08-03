import { getDashboardStats } from '@/lib/admin-data';
import { DashboardClient } from '@/components/admin/dashboard-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return (
    <AdminGuard>
      <DashboardClient stats={stats} />
    </AdminGuard>
  );
}
