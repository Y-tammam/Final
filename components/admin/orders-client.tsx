"use client";

import { useState, useMemo } from 'react';
import { Search, MessageCircle, Printer, X, Phone, MapPin, Clock, CreditCard, Package, Eye } from 'lucide-react';
import type { Order } from '@/lib/types';
import { priceEGP, formatDateTimeArabic, timeAgoArabic } from '@/lib/format';
import { ORDER_STATUS, PAYMENT_METHODS, BRAND_CONFIG } from '@/lib/brand';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'قيد الانتظار' },
  { key: 'confirmed', label: 'تم التأكيد' },
  { key: 'shipped', label: 'جاري الشحن' },
  { key: 'delivered', label: 'تم التسليم' },
  { key: 'cancelled', label: 'ملغي' },
];

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export function OrdersClient({ orders }: { orders: Order[] }) {
  const [list, setList] = useState(orders);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    let result = filter === 'all' ? list : list.filter((o) => o.order_status === filter);
    if (search.trim()) {
      const q = search.trim();
      result = result.filter(
        (o) => o.customer_name.includes(q) || o.customer_phone.includes(q) || String(o.order_number).includes(q)
      );
    }
    return result;
  }, [list, filter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: list.length };
    for (const o of list) {
      counts[o.order_status] = (counts[o.order_status] ?? 0) + 1;
    }
    return counts;
  }, [list]);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
    if (error) {
      toast.error('تعذر تحديث الحالة');
      return;
    }
    setList((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
    if (selected?.id === orderId) {
      setSelected((prev) => (prev ? { ...prev, order_status: status } : prev));
    }
    toast.success('تم تحديث حالة الطلب');
  };

  const badgeCls = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-warning/15 text-warning',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-blue-100 text-blue-700',
      delivered: 'bg-success/15 text-success',
      cancelled: 'bg-destructive/15 text-destructive',
    };
    return map[status] ?? 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">إدارة الطلبات</h1>
        <p className="font-arabic text-sm text-muted-foreground mt-1">{list.length} طلب إجمالي</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'font-arabic text-sm px-4 py-2 rounded-full border transition-all flex items-center gap-2',
              filter === tab.key ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border text-foreground/70 hover:border-accent'
            )}
          >
            {tab.label}
            {statusCounts[tab.key] !== undefined && (
              <span className={cn('text-xs px-1.5 rounded-full', filter === tab.key ? 'bg-primary-foreground/20' : 'bg-muted')}>{statusCounts[tab.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث برقم الطلب أو الاسم أو الهاتف..."
          className="w-full bg-background border border-border rounded-sm pr-10 pl-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Orders table */}
      <div className="bg-background border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-right border-b border-border">
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">#</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">العميل</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3 hidden md:table-cell">الهاتف</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3 hidden lg:table-cell">المحافظة</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">الإجمالي</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">الحالة</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3 hidden sm:table-cell">الوقت</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/20 cursor-pointer" onClick={() => setSelected(order)}>
                  <td className="font-body py-3 px-3 num-rtl text-foreground/70">#{order.order_number}</td>
                  <td className="font-arabic py-3 px-3">{order.customer_name}</td>
                  <td className="font-body py-3 px-3 hidden md:table-cell num-rtl text-muted-foreground" dir="ltr">{order.customer_phone}</td>
                  <td className="font-arabic py-3 px-3 hidden lg:table-cell text-muted-foreground">{order.governorate}</td>
                  <td className="font-body py-3 px-3 num-rtl font-medium">{priceEGP(order.total_amount_egp)}</td>
                  <td className="py-3 px-3">
                    <span className={cn('font-arabic text-[11px] px-2.5 py-0.5 rounded-full', badgeCls(order.order_status))}>
                      {ORDER_STATUS[order.order_status as keyof typeof ORDER_STATUS]?.label ?? order.order_status}
                    </span>
                  </td>
                  <td className="font-arabic py-3 px-3 hidden sm:table-cell text-xs text-muted-foreground">{timeAgoArabic(order.created_at)}</td>
                  <td className="py-3 px-3">
                    <Eye className="w-4 h-4 text-foreground/50" strokeWidth={1.5} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="font-arabic text-muted-foreground">لا توجد طلبات في هذه الحالة</p>
          </div>
        )}
      </div>

      {/* Order detail drawer */}
      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
          badgeCls={badgeCls}
        />
      )}
    </div>
  );
}

function OrderDrawer({
  order,
  onClose,
  onStatusChange,
  badgeCls,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  badgeCls: (s: string) => string;
}) {
  const phone = order.whatsapp_phone || order.customer_phone;
  const waNumber = phone.replace(/[^0-9]/g, '');
  const waMessage = `مرحباً ${order.customer_name}،\nبخصوص طلبك رقم #${order.order_number} من ${BRAND_CONFIG.nameArabic}.\nالحالة الحالية: ${ORDER_STATUS[order.order_status as keyof typeof ORDER_STATUS]?.label}`;
  const waLink = `https://wa.me/${waNumber.startsWith('20') ? waNumber : '2' + waNumber.replace(/^0/, '')}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="absolute top-0 left-0 bottom-0 w-full max-w-lg bg-background shadow-2xl flex flex-col fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-semibold">طلب #{order.order_number}</h2>
            <p className="font-arabic text-xs text-muted-foreground mt-0.5">{formatDateTimeArabic(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-sm" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status */}
          <div>
            <p className="font-arabic text-sm text-muted-foreground mb-2">حالة الطلب</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(order.id, status)}
                  className={cn(
                    'font-arabic text-xs px-3 py-1.5 rounded-full border transition-all',
                    order.order_status === status ? cn('border-transparent', badgeCls(status)) : 'border-border text-foreground/60 hover:border-foreground/40'
                  )}
                >
                  {ORDER_STATUS[status as keyof typeof ORDER_STATUS]?.label ?? status}
                </button>
              ))}
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-secondary/30 rounded-sm p-4 space-y-3">
            <h3 className="font-arabic text-sm font-semibold">معلومات العميل</h3>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="font-arabic text-sm">{order.customer_name}</p>
                <p className="font-body text-sm text-muted-foreground num-rtl" dir="ltr">{order.customer_phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="font-arabic text-sm">{order.governorate}</p>
                <p className="font-arabic text-sm text-muted-foreground">{order.city_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
              <p className="font-arabic text-sm">{PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS] ?? order.payment_method}</p>
            </div>
            {order.payment_method === 'Vodafone Cash' && (
              <div className="pt-1">
                <p className="font-arabic text-xs text-muted-foreground mb-2">إيصال التحويل:</p>
                {order.payment_receipt_url ? (
                  <a href={order.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="block w-28">
                    <img src={order.payment_receipt_url} alt="إيصال التحويل" className="w-28 rounded-sm border border-border object-cover" />
                  </a>
                ) : (
                  <p className="font-arabic text-xs text-warning bg-warning/10 rounded-sm px-2.5 py-1.5 inline-block">
                    لسه معلاش صورة إيصال
                  </p>
                )}
              </div>
            )}
            {order.allow_inspection && (
              <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-sm px-3 py-2">
                <Eye className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span className="font-arabic text-xs">العميل طلب المعاينة قبل الدفع</span>
              </div>
            )}
            {order.notes && (
              <div className="bg-background rounded-sm p-3 border border-border">
                <p className="font-arabic text-xs text-muted-foreground mb-1">ملاحظات:</p>
                <p className="font-arabic text-sm">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="font-arabic text-sm font-semibold mb-3">المنتجات</h3>
            <ul className="space-y-3">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-arabic text-foreground truncate">{item.product?.title_ar ?? 'منتج'}</p>
                    <p className="font-arabic text-xs text-muted-foreground">
                      {item.variant?.color_ar ?? ''} {item.variant && `• مقاس ${item.variant.size}`} • ×{item.quantity}
                    </p>
                  </div>
                  <span className="font-body num-rtl font-medium shrink-0">{priceEGP(item.unit_price_egp * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-arabic text-sm text-muted-foreground">المجموع الفرعي</span>
              <span className="font-body text-sm num-rtl">{priceEGP(order.subtotal_egp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-arabic text-sm text-muted-foreground">الشحن</span>
              <span className="font-body text-sm num-rtl">{priceEGP(order.shipping_fee_egp)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="font-arabic text-base font-semibold">الإجمالي</span>
              <span className="font-body text-lg font-semibold num-rtl">{priceEGP(order.total_amount_egp)} ج.م</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border px-6 py-4 flex gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-success/10 text-success font-arabic py-3 rounded-sm hover:bg-success/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
            مراسلة واتساب
          </a>
          <button
            onClick={() => printReceipt(order)}
            className="flex-1 bg-foreground text-primary-foreground font-arabic py-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Printer className="w-5 h-5" strokeWidth={1.5} />
            طباعة الإيصال
          </button>
        </div>
      </div>
    </div>
  );
}

function printReceipt(order: Order) {
  const itemsHtml = (order.order_items ?? [])
    .map(
      (item) => `
      <tr>
        <td>${item.product?.title_ar ?? 'منتج'}</td>
        <td style="text-align:center">${item.variant ? item.variant.color_ar + ' / ' + item.variant.size : '—'}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:left">${priceEGP(item.unit_price_egp * item.quantity)} ج.م</td>
      </tr>`
    )
    .join('');

  const html = `
  <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <title>إيصال طلب #${order.order_number}</title>
  <style>
    * { font-family: 'Cairo', 'Arial', sans-serif; box-sizing: border-box; }
    body { padding: 24px; max-width: 600px; margin: 0 auto; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; margin: 0; }
    .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
    .order-num { font-size: 18px; font-weight: bold; margin: 16px 0; }
    .info { background: #f5f3f0; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; }
    .info p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    th { background: #1a1a1a; color: #D4AF37; padding: 8px; text-align: right; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    .totals { margin-top: 16px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand { font-size: 18px; font-weight: bold; border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 8px; }
    .notice { background: #fff8e1; border: 1px solid #D4AF37; padding: 10px; border-radius: 4px; text-align: center; margin-top: 16px; font-size: 13px; font-weight: bold; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
    @media print { body { padding: 0; } }
  </style></head><body>
    <div class="header">
      <h1>${BRAND_CONFIG.nameArabic}</h1>
      <p>${BRAND_CONFIG.tagline}</p>
    </div>
    <div class="order-num">إيصال طلب رقم #${order.order_number}</div>
    <div class="info">
      <p><strong>العميل:</strong> ${order.customer_name}</p>
      <p><strong>الهاتف:</strong> ${order.customer_phone}</p>
      <p><strong>المحافظة:</strong> ${order.governorate}</p>
      <p><strong>العنوان:</strong> ${order.city_address}</p>
      <p><strong>طريقة الدفع:</strong> ${PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS] ?? order.payment_method}</p>
      <p><strong>التاريخ:</strong> ${formatDateTimeArabic(order.created_at)}</p>
    </div>
    <table>
      <thead><tr><th>المنتج</th><th>المقاس / اللون</th><th>الكمية</th><th>السعر</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="totals">
      <div><span>المجموع الفرعي</span><span>${priceEGP(order.subtotal_egp)} ج.م</span></div>
      <div><span>الشحن</span><span>${priceEGP(order.shipping_fee_egp)} ج.م</span></div>
      <div class="grand"><span>الإجمالي</span><span>${priceEGP(order.total_amount_egp)} ج.م</span></div>
    </div>
    ${order.allow_inspection ? '<div class="notice">مسموح بالمعاينة قبل الاستلام</div>' : ''}
    <div class="footer">
      ${BRAND_CONFIG.nameArabic} • ${BRAND_CONFIG.contact.whatsapp} • ${BRAND_CONFIG.contact.supportEmail}
    </div>
  </body></html>`;

  const printWin = window.open('', '_blank');
  if (!printWin) {
    toast.error('الرجاء السماح بالنوافذ المنبثقة للطباعة');
    return;
  }
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 500);
}
