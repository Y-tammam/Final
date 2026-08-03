"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { User, Package, LogOut, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { priceEGP } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/brand';
import { cn } from '@/lib/utils';

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchUserOrders() {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else if (data) {
        setOrders(data);
      }
      setLoadingOrders(false);
    }

    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 font-arabic">
      <div className="bg-card border border-border p-6 sm:p-8 rounded-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">{user.user_metadata?.full_name || 'حسابي'}</h1>
            <p className="text-sm text-muted-foreground dir-ltr text-right">{user.email}</p>
          </div>
        </div>

        <button
          onClick={async () => {
            await signOut();
            router.push('/');
          }}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-sm text-sm hover:bg-destructive hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          طلباتي السابقة
        </h2>

        {loadingOrders ? (
          <div className="text-center py-12 border border-dashed border-border rounded-sm">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent mb-2" />
            <p className="text-xs text-muted-foreground">جاري تحميل طلباتك...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-sm bg-card/50">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="font-semibold text-lg mb-1">لا توجد طلبات سابقة حتى الآن</h3>
            <p className="text-xs text-muted-foreground mb-6">استكشفي أحدث مجموعاتنا وتسوقي الآن</p>
            <Link
              href="/shop"
              className="inline-block bg-foreground text-primary-foreground text-sm px-6 py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all"
            >
              تصفحي المتجر
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.order_status as keyof typeof ORDER_STATUS];
              return (
                <div key={order.id} className="border border-border bg-card p-5 rounded-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-3 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="font-bold num-rtl">#{order.order_number}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG') : '—'}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full font-medium',
                        status?.color === 'success' && 'bg-success/15 text-success',
                        status?.color === 'warning' && 'bg-warning/15 text-warning',
                        status?.color === 'blue' && 'bg-blue-100 text-blue-700',
                        status?.color === 'destructive' && 'bg-destructive/15 text-destructive'
                      )}
                    >
                      {status?.label ?? order.order_status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">إجمالي المبلغ:</span>
                    <span className="font-bold text-accent num-rtl">{priceEGP(order.total_amount_egp ?? 0)} ج.م</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
