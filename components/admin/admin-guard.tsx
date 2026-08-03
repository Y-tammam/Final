"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 1. لو مش مسجل دخول أصلًا
      if (!user) {
        router.replace('/admin/login');
        return;
      }

      // 2. 🔥 الفحص الحاسمي: التحقق هل الحساب أدمن أم عميل عادي؟
      const role = user.user_metadata?.role;

      if (role !== 'admin') {
        // لو عميل عادي حاول يكتب /admin، نطرده ونوجهه لصفحة الدخول
        toast.error('عذراً، هذا الحساب ليس لديه صلاحيات لوحة التحكم');
        if (signOut) signOut();
        router.replace('/admin/login');
      }
    }
  }, [loading, user, router, signOut]);

  // فحص هل هو أدمن فعلاً لعرض محتوى الصفحة
  const isAdmin = user?.user_metadata?.role === 'admin';

  if (loading || !user || !isAdmin) {
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
