import { getCategoriesAdmin } from '@/lib/admin-data';
import { CategoriesClient } from '@/components/admin/categories-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesAdmin();
  return (
    <AdminGuard>
      <CategoriesClient initialCategories={categories as any} />
    </AdminGuard>
  );
}
