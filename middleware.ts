import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // هام: لازم نستدعي getUser() عشان الـ session تتجدد تلقائيًا (refresh)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // استثناء صفحة تسجيل الدخول
  if (pathname === '/admin/login') {
    return response;
  }

  // فحص المسارات اللي بتبدأ بـ /admin فقط
  if (pathname.startsWith('/admin')) {
    // 1) المستخدم مش مسجل دخول
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2) الدور الحقيقي من جدول admin_users (get_my_role) مش من
    // user_metadata (قابل للتعديل من المستخدم نفسه). الحماية الفعلية للبيانات
    // في سياسات RLS، والفحص هنا للتوجيه (UX) بس.
    const { data: role, error } = await supabase.rpc('get_my_role');

    if (error || !role) {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }

    // الموظف (staff) صلاحيته على الطلبات بس
    if (role === 'staff' && !pathname.startsWith('/admin/orders')) {
      return NextResponse.redirect(new URL('/admin/orders', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
