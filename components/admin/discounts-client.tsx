"use client";

import { useState } from 'react';
import { Plus, Loader2, Trash2, TicketPercent, Power } from 'lucide-react';
import { priceEGP } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { DiscountCode } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
  code: '',
  discount_type: 'percent' as 'percent' | 'fixed',
  value: '',
  min_order_egp: '',
  max_discount_egp: '',
  starts_at: '',
  expires_at: '',
  usage_limit: '',
  one_per_phone: false,
};

const inputCls =
  'bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full';

function codeStatus(c: DiscountCode): { label: string; cls: string } {
  const now = Date.now();
  if (!c.is_active) return { label: 'موقوف', cls: 'bg-muted text-muted-foreground' };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { label: 'منتهي', cls: 'bg-destructive/10 text-destructive' };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: 'لم يبدأ', cls: 'bg-blue-50 text-blue-700' };
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) return { label: 'مستنفد', cls: 'bg-destructive/10 text-destructive' };
  return { label: 'فعّال', cls: 'bg-emerald-50 text-emerald-700' };
}

function describe(c: DiscountCode) {
  const amount = c.discount_type === 'percent' ? `${c.value}%` : `${priceEGP(c.value)} ج.م`;
  const parts = [`خصم ${amount}`];
  if (c.max_discount_egp) parts.push(`بحد أقصى ${priceEGP(c.max_discount_egp)} ج.م`);
  if (c.min_order_egp > 0) parts.push(`لطلبات من ${priceEGP(c.min_order_egp)} ج.م`);
  if (c.one_per_phone) parts.push('مرة لكل رقم');
  return parts.join(' • ');
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export function DiscountsClient({ codes }: { codes: DiscountCode[] }) {
  const [list, setList] = useState(codes);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const update = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleAdd = async () => {
    const code = form.code.trim().toUpperCase();
    const value = parseFloat(form.value);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      toast.error('الكود لازم يكون من 3 لـ 30 حرف إنجليزي أو رقم (من غير مسافات)');
      return;
    }
    if (!value || value <= 0 || (form.discount_type === 'percent' && value > 100)) {
      toast.error('قيمة الخصم غير صحيحة');
      return;
    }
    setAdding(true);
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code,
        discount_type: form.discount_type,
        value,
        min_order_egp: parseFloat(form.min_order_egp) || 0,
        max_discount_egp: form.discount_type === 'percent' && form.max_discount_egp ? parseFloat(form.max_discount_egp) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        // تاريخ الانتهاء بيشمل اليوم كله
        expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
        one_per_phone: form.one_per_phone,
      })
      .select()
      .single();
    setAdding(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'الكود ده موجود قبل كده' : 'تعذر إضافة الكود');
      return;
    }
    setList((prev) => [data as DiscountCode, ...prev]);
    setForm(EMPTY_FORM);
    toast.success(`تم إنشاء الكود ${code}`);
  };

  const toggleActive = async (c: DiscountCode) => {
    setBusy(c.id);
    const { error } = await supabase.from('discount_codes').update({ is_active: !c.is_active }).eq('id', c.id);
    setBusy(null);
    if (error) {
      toast.error('تعذر التحديث');
      return;
    }
    setList((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)));
  };

  const remove = async (c: DiscountCode) => {
    if (!confirm(`حذف الكود ${c.code}؟ الطلبات القديمة اللي استخدمته مش هتتأثر.`)) return;
    setBusy(c.id);
    const { error } = await supabase.from('discount_codes').delete().eq('id', c.id);
    setBusy(null);
    if (error) {
      toast.error('تعذر الحذف');
      return;
    }
    setList((prev) => prev.filter((x) => x.id !== c.id));
    toast.success('تم الحذف');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">أكواد الخصم</h1>
        <p className="font-arabic text-sm text-muted-foreground mt-1">
          الخصم بيتحسب على قيمة المنتجات (من غير الشحن) وبيتأكد منه السيرفر وقت تأكيد الطلب
        </p>
      </div>

      {/* Add new */}
      <div className="bg-background border border-border rounded-sm p-5 space-y-4">
        <h2 className="font-arabic text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-accent" strokeWidth={1.5} />
          كود جديد
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">الكود</span>
            <input value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} placeholder="EID20" className={cn(inputCls, 'font-body tracking-wider')} dir="ltr" />
          </label>
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">نوع الخصم</span>
            <select value={form.discount_type} onChange={(e) => update('discount_type', e.target.value as 'percent' | 'fixed')} className={inputCls}>
              <option value="percent">نسبة مئوية %</option>
              <option value="fixed">مبلغ ثابت (ج.م)</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">{form.discount_type === 'percent' ? 'النسبة %' : 'المبلغ (ج.م)'}</span>
            <input type="number" min="0" value={form.value} onChange={(e) => update('value', e.target.value)} className={inputCls} dir="ltr" />
          </label>
          {form.discount_type === 'percent' && (
            <label className="space-y-1">
              <span className="font-arabic text-xs text-muted-foreground">أقصى خصم (ج.م) - اختياري</span>
              <input type="number" min="0" value={form.max_discount_egp} onChange={(e) => update('max_discount_egp', e.target.value)} className={inputCls} dir="ltr" />
            </label>
          )}
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">أقل قيمة للطلب (ج.م) - اختياري</span>
            <input type="number" min="0" value={form.min_order_egp} onChange={(e) => update('min_order_egp', e.target.value)} className={inputCls} dir="ltr" />
          </label>
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">أقصى عدد استخدامات - اختياري</span>
            <input type="number" min="1" value={form.usage_limit} onChange={(e) => update('usage_limit', e.target.value)} className={inputCls} dir="ltr" />
          </label>
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">يبدأ من - اختياري</span>
            <input type="date" value={form.starts_at} onChange={(e) => update('starts_at', e.target.value)} className={inputCls} />
          </label>
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">ينتهي في - اختياري</span>
            <input type="date" value={form.expires_at} onChange={(e) => update('expires_at', e.target.value)} className={inputCls} />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 font-arabic text-sm cursor-pointer">
            <input type="checkbox" checked={form.one_per_phone} onChange={(e) => update('one_per_phone', e.target.checked)} className="accent-[hsl(var(--accent))]" />
            مرة واحدة بس لكل رقم موبايل
          </label>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="font-arabic bg-foreground text-primary-foreground px-6 py-2.5 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إنشاء الكود
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-background border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-right border-b border-border">
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">الكود</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">التفاصيل</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">الاستخدام</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">الصلاحية</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">الحالة</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const status = codeStatus(c);
                return (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="py-3 px-4 font-body font-semibold tracking-wider" dir="ltr">{c.code}</td>
                    <td className="py-3 px-4 font-arabic text-xs text-muted-foreground min-w-[200px]">{describe(c)}</td>
                    <td className="py-3 px-4 font-body num-rtl whitespace-nowrap">
                      {c.used_count}{c.usage_limit !== null && ` / ${c.usage_limit}`}
                    </td>
                    <td className="py-3 px-4 font-arabic text-xs whitespace-nowrap">
                      {fmtDate(c.starts_at)} ← {fmtDate(c.expires_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('font-arabic text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap', status.cls)}>{status.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(c)}
                          disabled={busy === c.id}
                          className="font-arabic text-xs border border-border px-3 py-1.5 rounded-sm hover:border-foreground/40 transition-all flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
                        >
                          {busy === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                          {c.is_active ? 'إيقاف' : 'تفعيل'}
                        </button>
                        <button onClick={() => remove(c)} disabled={busy === c.id} className="p-1.5 hover:bg-destructive/10 rounded-sm transition-colors" aria-label="حذف">
                          <Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div className="py-16 text-center">
            <TicketPercent className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="font-arabic text-muted-foreground">لا توجد أكواد خصم. أنشئي أول كود من فوق.</p>
          </div>
        )}
      </div>
    </div>
  );
}
