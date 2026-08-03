"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/lib/brand';
import { Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('الرجاء إدخال البريد وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error('بيانات الدخول غير صحيحة');
        return;
      }

      const userRole = data.user?.user_metadata?.role;

      if (userRole !== 'admin') {
        await supabase.auth.signOut();
        toast.error('عذراً، هذا الحساب ليس لديه صلاحيات لوحة التحكم');
        return;
      }

      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-semibold text-primary-foreground">{BRAND_CONFIG.nameArabic}</h1>
          <p className="font-arabic text-primary-foreground/60 mt-2">لوحة تحكم الإدارة</p>
        </div>

        <div className="bg-background rounded-sm p-8 shadow-2xl">
          <h2 className="font-arabic text-xl font-semibold mb-6">
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm pr-10 pl-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="admin@example.com"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm pr-10 pl-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-primary-foreground font-arabic py-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : 'دخول'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-2 font-arabic text-sm text-primary-foreground/60 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" />
            العودة للمتجر
          </Link>
        </div>
      </div>
    </div>
  );
}
