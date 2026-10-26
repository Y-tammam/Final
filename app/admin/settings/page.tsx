import { getStorePages, getStoreSettings } from '@/lib/data';
import { SettingsClient } from '@/components/admin/settings-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const [settings, pages] = await Promise.all([getStoreSettings(), getStorePages()]);
  const order = ['shipping', 'exchange', 'privacy'];
  pages.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  return (
    <AdminGuard>
      <SettingsClient settings={settings} pages={pages} />
    </AdminGuard>
  );
}
