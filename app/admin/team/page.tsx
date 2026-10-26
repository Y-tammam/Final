import { TeamClient } from '@/components/admin/team-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export default function AdminTeamPage() {
  return (
    <AdminGuard>
      <TeamClient />
    </AdminGuard>
  );
}
