// تحميل عميل Supabase (حوالي 45KB مضغوط) عند الحاجة بس، بدل ما يتحمل مع
// كل صفحة في المتجر. الزائرة اللي مش مسجلة دخول ومبتعملش حاجة تحتاج قاعدة
// البيانات مبتحملوش خالص.
import type { SupabaseClient } from '@supabase/supabase-js';

let promise: Promise<SupabaseClient> | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  if (!promise) promise = import('./supabase').then((m) => m.supabase as unknown as SupabaseClient);
  return promise;
}

/** فيه جلسة دخول محفوظة؟ (@supabase/ssr بيحفظها في كوكي sb-<project>-auth-token) */
export function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/.test(document.cookie);
}
