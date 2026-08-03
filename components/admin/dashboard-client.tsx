"use client";

import { TrendingUp, ShoppingCart, Clock, AlertTriangle, ArrowUpLeft } from 'lucide-react';
import Link from 'next/link';
import { priceEGP, formatDateTimeArabic, timeAgoArabic } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/brand';
import type { Order } from '@/lib/types';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStock: { id: string; product_id: string; size: string; color_ar: string; stock_quantity: number; sku: string | null; product?: { title_ar: string } }[];
  topProducts: { title: string; qty: number }[];
  dailyRevenue: { date: string; label: string; revenue: number; orders: number }[];
  recentOrders: Order[];
};

const statusBadge = (status: string) => {
  const s = ORDER_STATUS[status as keyof typeof ORDER_STATUS];
  const colorMap: Record<string, string> = {
    warning: 'bg-warning/15 text-warning',
    success: 'bg-success/15 text-success',
    destructive: 'bg-destructive/15 text-destructive',
    blue: 'bg-blue-100 text-blue-700',
  };
  return { label: s?.label ?? status, cls: colorMap[s?.color ?? ''] ?? 'bg-muted text-muted-foreground' };
};

export function DashboardClient({ stats }: { stats: Stats }) {
  const metricCards = [
    {
      label: 'إجمالي الإيرادات',
      value: `${priceEGP(stats.totalRevenue)} ج.م`,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'إجمالي الطلبات',
      value: String(stats.totalOrders),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'طلبات قيد الانتظار',
      value: String(stats.pendingOrders),
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'تنبيهات المخزون',
      value: String(stats.lowStock.length),
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">لوحة التحكم</h1>
        <p className="font-arabic text-sm text-muted-foreground mt-1">نظرة عامة على أداء المتجر</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <div key={m.label} className="bg-background border border-border rounded-sm p-5">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-3', m.bg)}>
              <m.icon className={cn('w-5 h-5', m.color)} strokeWidth={1.5} />
            </div>
            <p className="font-arabic text-xs text-muted-foreground">{m.label}</p>
            <p className="font-body text-xl sm:text-2xl font-semibold mt-1 num-rtl">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="bg-background border border-border rounded-sm p-5">
          <h2 className="font-arabic text-base font-semibold mb-4">الإيرادات (آخر 7 أيام)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.dailyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'Cairo' }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v)}`} />
              <Tooltip
                contentStyle={{ borderRadius: 4, border: '1px solid hsl(var(--border))', fontFamily: 'Cairo', fontSize: 12 }}
                formatter={(v: number) => [`${priceEGP(v)} ج.م`, 'الإيرادات']}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-background border border-border rounded-sm p-5">
          <h2 className="font-arabic text-base font-semibold mb-4">المنتجات الأكثر مبيعاً</h2>
          {stats.topProducts.length === 0 ? (
            <p className="font-arabic text-sm text-muted-foreground py-12 text-center">لا توجد مبيعات بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 10, fontFamily: 'Cairo' }} stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip contentStyle={{ borderRadius: 4, border: '1px solid hsl(var(--border))', fontFamily: 'Cairo', fontSize: 12 }} formatter={(v: number) => [`${v} قطعة`, 'المبيعات']} />
                <Bar dataKey="qty" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-background border border-border rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-arabic text-base font-semibold">أحدث الطلبات</h2>
            <Link href="/admin/orders" className="font-arabic text-xs text-accent hover:underline flex items-center gap-1">
              عرض الكل
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="font-arabic text-sm text-muted-foreground py-8 text-center">لا توجد طلبات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right">
                    <th className="font-arabic font-medium text-muted-foreground py-2 px-2">#</th>
                    <th className="font-arabic font-medium text-muted-foreground py-2 px-2">العميل</th>
                    <th className="font-arabic font-medium text-muted-foreground py-2 px-2 hidden sm:table-cell">المحافظة</th>
                    <th className="font-arabic font-medium text-muted-foreground py-2 px-2">الإجمالي</th>
                    <th className="font-arabic font-medium text-muted-foreground py-2 px-2">الحالة</th>
                    <th className="font-arabic font-medium text-muted-foreground py-2 px-2 hidden sm:table-cell">الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => {
                    const badge = statusBadge(order.order_status);
                    return (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="font-body py-3 px-2 num-rtl text-foreground/70">#{order.order_number}</td>
                        <td className="font-arabic py-3 px-2">{order.customer_name}</td>
                        <td className="font-arabic py-3 px-2 hidden sm:table-cell text-muted-foreground">{order.governorate}</td>
                        <td className="font-body py-3 px-2 num-rtl font-medium">{priceEGP(order.total_amount_egp)}</td>
                        <td className="py-3 px-2">
                          <span className={cn('font-arabic text-[11px] px-2 py-0.5 rounded-full', badge.cls)}>{badge.label}</span>
                        </td>
                        <td className="font-arabic py-3 px-2 hidden sm:table-cell text-xs text-muted-foreground">{timeAgoArabic(order.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-background border border-border rounded-sm p-5">
          <h2 className="font-arabic text-base font-semibold mb-4">تنبيهات المخزون</h2>
          {stats.lowStock.length === 0 ? (
            <p className="font-arabic text-sm text-muted-foreground py-8 text-center">المخزون بحالة جيدة</p>
          ) : (
            <ul className="space-y-3">
              {stats.lowStock.slice(0, 6).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-arabic text-foreground/80 truncate">{v.product?.title_ar ?? 'منتج'}</p>
                    <p className="font-arabic text-xs text-muted-foreground">{v.color_ar} • مقاس {v.size}</p>
                  </div>
                  <span className={cn('font-body text-xs font-bold px-2 py-0.5 rounded-full shrink-0', v.stock_quantity === 0 ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning')}>
                    {v.stock_quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/products" className="font-arabic text-xs text-accent hover:underline block mt-4">
            إدارة المخزون
          </Link>
        </div>
      </div>
    </div>
  );
}
