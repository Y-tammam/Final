"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // isAdmin: null = لسه بنتحقق، true/false = النتيجة الحقيقية من الداتابيز.
  // ملحوظة أمنية: بنعتمد على is_admin() (RPC بيقرا جدول admin_users
  // المقفول بـ RLS) بدل user.user_metadata?.role لأن الأخير قابل
  // للتعديل من المستخدم نفسه من المتصفح ومكنش بيحمي حاجة فعلياً.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (loading) return;

      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        router.replace('/admin/login');
        return;
      }

      const { data, error } = await supabase.rpc('is_admin');
      if (!active) return;

      const adminConfirmed = !error && data === true;
      setIsAdmin(adminConfirmed);
      setCheckingAdmin(false);

      if (!adminConfirmed) {
        toast.error('عذراً، هذا الحساب ليس لديه صلاحيات لوحة التحكم');
        if (signOut) await signOut();
        router.replace('/admin/login');
      }
    }

    checkAdmin();
    return () => {
      active = false;
    };
  }, [loading, user, router, signOut]);

  if (loading || checkingAdmin || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
