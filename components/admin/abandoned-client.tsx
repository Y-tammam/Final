"use client";

import { useState } from 'react';
import { MessageCircle, Check, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { priceEGP, timeAgoArabic } from '@/lib/format';
import { BRAND_CONFIG } from '@/lib/brand';
import type { CheckoutDraft } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function waLink(d: CheckoutDraft) {
  const digits = d.phone.replace(/[^0-9]/g, '');
  const intl = digits.startsWith('20') ? digits : '2' + digits.replace(/^0/, '');
  const items = d.cart.map((i) => `• ${i.title} (${i.color} - مقاس ${i.size})`).join('\n');
  const msg = `مرحباً ${d.customer_name || ''} 🤍\nمعاكي ${BRAND_CONFIG.nameArabic} - لاحظنا إنك اخترتي:\n${items}\nولسه الطلب مكملش. محتاجة مساعدة في المقاس أو عندك أي سؤال؟ نقدر نأكدلك الطلب من هنا على طول.`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
}

// العملاء اللي كتبوا رقمهم في صفحة الدفع وما كملوش الطلب (من 30 دقيقة أو
// أكتر). أفضل وقت للتواصل: خلال أول ساعتين.
export function AbandonedClient({ drafts }: { drafts: CheckoutDraft[] }) {
  const [list, setList] = useState(drafts);

  const markContacted = async (d: CheckoutDraft) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('checkout_drafts').update({ contacted_at: now }).eq('id', d.id);
    if (error) {
      toast.error('تعذر التحديث');
      return;
    }
    setList((prev) => prev.map((x) => (x.id === d.id ? { ...x, contacted_at: now } : x)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">السلات المتروكة</h1>
        <p className="font-arabic text-sm text-muted-foreground mt-1">
          عميلات كتبوا رقمهم في صفحة الدفع وما كملوش. رسالة واتساب خلال أول ساعتين بترجّع جزء كبير منهم.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-background border border-border rounded-sm py-16 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
          <p className="font-arabic text-muted-foreground">مفيش سلات متروكة دلوقتي</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((d) => (
            <li key={d.id} className={cn('bg-background border border-border rounded-sm p-4', d.contacted_at && 'opacity-60')}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-arabic text-sm font-semibold">
                    {d.customer_name || 'بدون اسم'} <span className="font-body text-muted-foreground font-normal" dir="ltr">{d.phone}</span>
                  </p>
                  <p className="font-arabic text-xs text-muted-foreground">
                    {d.governorate || '—'} • {timeAgoArabic(d.updated_at)}
                    {d.attribution?.utm_campaign && ` • حملة: ${d.attribution.utm_campaign}`}
                  </p>
                  <ul className="font-arabic text-xs text-foreground/80 pt-1 space-y-0.5">
                    {d.cart.map((i) => (
                      <li key={i.variant_id}>
                        {i.title} ({i.color} - {i.size}) × {i.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="font-arabic text-sm pt-1">{priceEGP(d.subtotal_egp)} ج.م</p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <a
                    href={waLink(d)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => !d.contacted_at && markContacted(d)}
                    className="font-arabic text-xs bg-[#25D366] text-white px-4 py-2 rounded-sm flex items-center justify-center gap-1.5 hover:opacity-90"
                  >
                    <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                    مراسلة
                  </a>
                  {d.contacted_at ? (
                    <span className="font-arabic text-[11px] text-muted-foreground flex items-center gap-1 justify-center">
                      <Check className="w-3.5 h-3.5" /> اتكلمت {timeAgoArabic(d.contacted_at)}
                    </span>
                  ) : (
                    <button onClick={() => markContacted(d)} className="font-arabic text-xs border border-border px-4 py-2 rounded-sm hover:border-foreground/40">
                      تم التواصل
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
