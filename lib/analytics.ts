// تتبع Meta Pixel (فيسبوك/انستجرام). من غير الـ Pixel، الإعلانات الممولة
// مش بتعرف مين اشترى فعلاً، فمش بتقدر تحسّن الاستهداف.
// التفعيل: حطي NEXT_PUBLIC_META_PIXEL_ID في متغيرات البيئة على Netlify.
// لو مش موجود، كل الدوال هنا مبتعملش أي حاجة.

type Fbq = (...args: unknown[]) => void;

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

export function track(event: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'AddToWishlist' | 'Search', params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq('track', event, { currency: 'EGP', ...params });
}
