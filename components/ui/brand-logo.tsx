"use client";

import { useState } from 'react';
import { BRAND_CONFIG } from '@/lib/brand';
import { cn } from '@/lib/utils';

// مكوّن اللوجو: بيحاول يعرض صورة اللوجو من public/logo.png (أو الامتداد
// المحدد في BRAND_CONFIG.logoUrl). لو الملف مش موجود أو حصل خطأ في
// تحميله، بيرجع تلقائيًا يعرض اسم المتجر بالنص - عشان كده الاستخدام آمن
// حتى قبل ما يتم رفع لوجو فعلي.
export function BrandLogo({ className, textClassName }: { className?: string; textClassName?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !BRAND_CONFIG.logoUrl) {
    return <span className={cn('font-display font-semibold', textClassName)}>{BRAND_CONFIG.nameArabic}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_CONFIG.logoUrl}
      alt={BRAND_CONFIG.nameArabic}
      className={cn('object-contain', className)}
      onError={() => setFailed(true)}
    />
  );
}
