"use client";

import { useState } from 'react';
import { Save, Loader2, Truck, Plus, Trash2 } from 'lucide-react';
import { priceEGP } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Rate = {
  id: string;
  governorate_ar: string;
  cost_egp: number;
  estimated_days: string;
};

export function ShippingClient({ rates }: { rates: Rate[] }) {
  const [list, setList] = useState(rates);
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRate, setNewRate] = useState({ governorate_ar: '', cost_egp: '', estimated_days: '2-3 أيام' });

  const updateField = (id: string, key: keyof Rate, value: string | number) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const saveRate = async (rate: Rate) => {
    setSaving(rate.id);
    const { error } = await supabase
      .from('shipping_rates')
      .update({ cost_egp: rate.cost_egp, estimated_days: rate.estimated_days })
      .eq('id', rate.id);
    setSaving(null);
    if (error) {
      toast.error('تعذر حفظ التعديلات');
      return;
    }
    toast.success(`تم تحديث شحن ${rate.governorate_ar}`);
  };

  const deleteRate = async (id: string, name: string) => {
    if (!confirm(`حذف شحن ${name}؟`)) return;
    const { error } = await supabase.from('shipping_rates').delete().eq('id', id);
    if (error) {
      toast.error('تعذر الحذف');
      return;
    }
    setList((prev) => prev.filter((r) => r.id !== id));
    toast.success('تم الحذف');
  };

  const handleAdd = async () => {
    if (!newRate.governorate_ar.trim() || !newRate.cost_egp) {
      toast.error('الرجاء إدخال المحافظة والسعر');
      return;
    }
    setAdding(true);
    const { data, error } = await supabase
      .from('shipping_rates')
      .insert({
        governorate_ar: newRate.governorate_ar.trim(),
        cost_egp: parseFloat(newRate.cost_egp),
        estimated_days: newRate.estimated_days.trim(),
      })
      .select()
      .single();
    setAdding(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'هذه المحافظة موجودة' : 'تعذر الإضافة');
      return;
    }
    setList((prev) => [...prev, data as Rate].sort((a, b) => a.governorate_ar.localeCompare(b.governorate_ar, 'ar')));
    setNewRate({ governorate_ar: '', cost_egp: '', estimated_days: '2-3 أيام' });
    toast.success('تمت إضافة المحافظة');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">إعدادات الشحن</h1>
          <p className="font-arabic text-sm text-muted-foreground mt-1">تحكم في تكلفة الشحن لكل محافظة</p>
        </div>
      </div>

      {/* Add new */}
      <div className="bg-background border border-border rounded-sm p-5">
        <h2 className="font-arabic text-sm font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-accent" strokeWidth={1.5} />
          إضافة محافظة جديدة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={newRate.governorate_ar}
            onChange={(e) => setNewRate((p) => ({ ...p, governorate_ar: e.target.value }))}
            placeholder="اسم المحافظة"
            className="bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="number"
            value={newRate.cost_egp}
            onChange={(e) => setNewRate((p) => ({ ...p, cost_egp: e.target.value }))}
            placeholder="التكلفة (ج.م)"
            className="bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring num-rtl"
            dir="ltr"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newRate.estimated_days}
              onChange={(e) => setNewRate((p) => ({ ...p, estimated_days: e.target.value }))}
              placeholder="مدة التوصيل"
              className="flex-1 bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="font-arabic bg-foreground text-primary-foreground px-4 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة
            </button>
          </div>
        </div>
      </div>

      {/* Rates list */}
      <div className="bg-background border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-right border-b border-border">
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">المحافظة</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">التكلفة (ج.م)</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">مدة التوصيل</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((rate) => (
                <tr key={rate.id} className="border-b border-border/50">
                  <td className="font-arabic py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                      {rate.governorate_ar}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={rate.cost_egp}
                      onChange={(e) => updateField(rate.id, 'cost_egp', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-background border border-border rounded-sm px-2 py-1.5 font-body text-sm num-rtl"
                      dir="ltr"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={rate.estimated_days}
                      onChange={(e) => updateField(rate.id, 'estimated_days', e.target.value)}
                      className="w-32 bg-background border border-border rounded-sm px-2 py-1.5 font-arabic text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveRate(rate)}
                        disabled={saving === rate.id}
                        className="font-arabic text-xs bg-foreground text-primary-foreground px-3 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {saving === rate.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        حفظ
                      </button>
                      <button
                        onClick={() => deleteRate(rate.id, rate.governorate_ar)}
                        className="p-1.5 hover:bg-destructive/10 rounded-sm transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div className="py-16 text-center">
            <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="font-arabic text-muted-foreground">لا توجد محافظات. أضيفي محافظة جديدة بالأعلى.</p>
          </div>
        )}
      </div>

      <div className="bg-secondary/30 rounded-sm p-4 flex items-center gap-3">
        <Truck className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
        <p className="font-arabic text-sm text-muted-foreground">
          تُظهر هذه التكاليف للعميل تلقائياً عند اختيار المحافظة في صفحة إتمام الطلب.
        </p>
      </div>
    </div>
  );
}
