// مصدر الزيارة (الإعلان اللي جابها): بنحفظ UTM و fbclid/ttclid/gclid من أول
// زيارة لمدة 30 يوم (first-touch)، وبيتبعتوا مع الطلب. كده تقدري تعرفي من
// لوحة التحكم كل حملة جابت كام طلب اتسلّم فعلاً - مش بس اللي Ads Manager
// بيعدّه (اللي بيحسب الطلبات حتى لو اترفضت عند الاستلام).

const KEY = 'soraia_attr:v1';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid'] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number] | 'landing_path', string>>;

export function captureAttribution() {
  try {
    const url = new URL(window.location.href);
    const found: Attribution = {};
    for (const p of PARAMS) {
      const v = url.searchParams.get(p);
      if (v) found[p] = v.slice(0, 200);
    }
    const existing = readStored();
    // زيارة جاية من إعلان جديد بتسجل نفسها، غير كده بنسيب أول مصدر
    if (Object.keys(found).length === 0 && existing) return;
    if (Object.keys(found).length === 0 && document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.host === window.location.host) return;
      found.utm_source = ref.host.slice(0, 200);
      found.utm_medium = 'referral';
    }
    found.landing_path = (url.pathname + url.search).slice(0, 300);
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: found }));
  } catch {
    /* private mode */
  }
}

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (Date.now() - at > TTL_MS) return null;
    return data as Attribution;
  } catch {
    return null;
  }
}

function cookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** بيانات الطلب للتتبع: مصدر الزيارة + كوكيز Meta (_fbp/_fbc) لـ Conversions API */
export function getAttributionForOrder(): Attribution & { fbp?: string; fbc?: string } {
  const data = readStored() ?? {};
  let fbc = cookie('_fbc');
  if (!fbc && data.fbclid) fbc = `fb.1.${Date.now()}.${data.fbclid}`;
  return { ...data, fbp: cookie('_fbp'), fbc };
}
