// قراءة بسيطة من Supabase (PostgREST) بـ fetch عادي - من غير ما نحمّل مكتبة
// supabase-js كلها في المتصفح. للقراءات العامة بس (نفس صلاحيات anon و RLS).
export async function restSelect<T>(table: string, query: string): Promise<T[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}
