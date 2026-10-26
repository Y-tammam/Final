"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { META_PIXEL_ID } from '@/lib/analytics';

// كود Meta Pixel الرسمي، بيتحمل بعد ما الصفحة تخلص (lazyOnload) عشان
// ميأثرش على سرعة الموقع. PageView بيتبعت مع كل تنقل بين الصفحات.
export function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    // أول PageView بيتبعت من كود التحميل نفسه
    if (first.current) {
      first.current = false;
      return;
    }
    (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.('track', 'PageView');
  }, [pathname]);

  if (!/^\d{5,20}$/.test(META_PIXEL_ID)) return null;

  return (
    <Script id="meta-pixel" strategy="lazyOnload">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}
