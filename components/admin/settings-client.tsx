"use client";

import { useState } from 'react';
import { Save, Loader2, Megaphone, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { StorePage, StoreSettings } from '@/lib/types';
import { toast } from 'sonner';

const inputCls =
  'w-full bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring';

// التغييرات بتظهر في المتجر خلال 5 دقايق بالكتير (الصفحات متكاشة)
export function SettingsClient({ settings, pages }: { settings: StoreSettings; pages: StorePage[] }) {
  const [text, setText] = useState(settings.announcement_text ?? '');
  const [link, setLink] = useState(settings.announcement_link ?? '');
  const [endsAt, setEndsAt] = useState(settings.announcement_ends_at ? settings.announcement_ends_at.slice(0, 10) : '');
  const [savingBar, setSavingBar] = useState(false);

  const [pageList, setPageList] = useState(pages);
  const [savingPage, setSavingPage] = useState<string | null>(null);

  const saveAnnouncement = async () => {
    const cleanLink = link.trim();
    if (cleanLink && !/^\/[A-Za-z0-9/_?=&%.#-]*$/.test(cleanLink)) {
      toast.error('الرابط لازم يكون صفحة جوه الموقع ويبدأ بـ / (مثلاً /shop/abayas)');
      return;
    }
    setSavingBar(true);
    const { error } = await supabase
      .from('store_settings')
      .update({
        announcement_text: text.trim() || null,
        announcement_link: cleanLink || null,
        announcement_ends_at: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true);
    setSavingBar(false);
    if (error) {
      toast.error('تعذر الحفظ');
      return;
    }
    toast.success('تم الحفظ - هيظهر في الموقع خلال دقايق');
  };

  const savePage = async (page: StorePage) => {
    setSavingPage(page.slug);
    const { error } = await supabase
      .from('store_pages')
      .update({ title_ar: page.title_ar.trim(), body_ar: page.body_ar, updated_at: new Date().toISOString() })
      .eq('slug', page.slug);
    setSavingPage(null);
    if (error) {
      toast.error('تعذر الحفظ');
      return;
    }
    toast.success(`تم حفظ ${page.title_ar}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">إعدادات المتجر</h1>
        <p className="font-arabic text-sm text-muted-foreground mt-1">شريط الإعلانات وصفحات السياسات</p>
      </div>

      <div className="bg-background border border-border rounded-sm p-5 space-y-4">
        <h2 className="font-arabic text-sm font-semibold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-accent" strokeWidth={1.5} />
          شريط الإعلانات أعلى الموقع
        </h2>
        <p className="font-arabic text-xs text-muted-foreground">
          خليه نفس العرض اللي في الإعلان الممول (مثلاً «خصم 15% بكود EID15 لحد آخر الأسبوع»). لو فاضي بيظهر النص الافتراضي.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="sm:col-span-3 space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">النص ({text.length}/200)</span>
            <input value={text} maxLength={200} onChange={(e) => setText(e.target.value)} className={inputCls} />
          </label>
          <label className="sm:col-span-2 space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">رابط عند الضغط - اختياري (صفحة جوه الموقع)</span>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/shop" dir="ltr" className={inputCls} />
          </label>
          <label className="space-y-1">
            <span className="font-arabic text-xs text-muted-foreground">يختفي بعد - اختياري</span>
            <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
          </label>
        </div>
        <button
          onClick={saveAnnouncement}
          disabled={savingBar}
          className="font-arabic bg-foreground text-primary-foreground px-6 py-2 rounded-sm text-sm hover:bg-foreground/85 transition-colors flex items-center gap-1.5 disabled:opacity-60"
        >
          {savingBar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      {pageList.map((page, idx) => (
        <div key={page.slug} className="bg-background border border-border rounded-sm p-5 space-y-3">
          <h2 className="font-arabic text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" strokeWidth={1.5} />
            {page.title_ar}
            <a href={`/policies/${page.slug}`} target="_blank" rel="noopener noreferrer" className="font-arabic text-xs text-muted-foreground underline mr-auto">
              عرض الصفحة
            </a>
          </h2>
          <input
            value={page.title_ar}
            maxLength={120}
            onChange={(e) => setPageList((prev) => prev.map((p, i) => (i === idx ? { ...p, title_ar: e.target.value } : p)))}
            className={inputCls}
          />
          <textarea
            value={page.body_ar}
            maxLength={20000}
            rows={8}
            placeholder="اكتبي السياسة هنا. كل سطر فاضي بيعمل فقرة جديدة."
            onChange={(e) => setPageList((prev) => prev.map((p, i) => (i === idx ? { ...p, body_ar: e.target.value } : p)))}
            className={`${inputCls} leading-relaxed`}
          />
          <button
            onClick={() => savePage(page)}
            disabled={savingPage === page.slug}
            className="font-arabic bg-foreground text-primary-foreground px-6 py-2 rounded-sm text-sm hover:bg-foreground/85 transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {savingPage === page.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ
          </button>
        </div>
      ))}
    </div>
  );
}
