import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Admin pages run server-side and need the caller's authenticated session
// (the orders/products tables use authenticated-only SELECT policies).
// Forwarding the request cookies lets the SSR client act as the logged-in admin.
export async function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from a Server Component where cookies
            // are read-only — that's fine for our read-heavy admin pages.
          }
        },
      },
    }
  );
}
