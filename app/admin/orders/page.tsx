import { getAllOrders } from '@/lib/admin-data';
import { OrdersClient } from '@/components/admin/orders-client';
import { AdminGuard } from '@/components/admin/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  return (
    <AdminGuard>
      <OrdersClient orders={orders} />
    </AdminGuard>
  );
}
