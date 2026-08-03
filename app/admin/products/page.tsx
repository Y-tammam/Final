import { getAllProductsAdmin, getCategoriesAdmin } from '@/lib/admin-data';
import { ProductsClient } from '@/components/admin/products-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getAllProductsAdmin(), getCategoriesAdmin()]);
  return (
    <AdminGuard>
      <ProductsClient initialProducts={products} categories={categories} />
    </AdminGuard>
  );
}
