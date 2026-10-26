"use client";

import { usePathname } from 'next/navigation';
import { BRAND_CONFIG } from '@/lib/brand';

// زرار واتساب ثابت في كل الصفحات - واتساب هو قناة خدمة العملاء الأساسية في
// مصر والخليج. مخفي في صفحة المنتج (فيها شريط سفلي بزرار واتساب) والشيك أوت.
export function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname.startsWith('/product/') || pathname.startsWith('/checkout')) return null;

  const number = BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(`مرحباً ${BRAND_CONFIG.nameArabic}، عندي استفسار`);

  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصلي معنا على واتساب"
      className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex items-center justify-center hover:scale-105 transition-transform duration-300"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.56.93.95-3.47-.22-.36a9.41 9.41 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.43-9.45 9.43m8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.7l6.1-1.6a11.33 11.33 0 0 0 5.37 1.37h.01c6.26 0 11.36-5.1 11.37-11.37 0-3.03-1.18-5.89-3.33-8.03" />
      </svg>
    </a>
  );
}
