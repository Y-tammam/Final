"use client";

import { useEffect, useState } from 'react';
import { Loader2, Trash2, UserPlus, Users, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Member = { user_id: string; email: string; role: 'owner' | 'staff'; created_at: string };

const ROLE_INFO = {
  owner: { label: 'مالك', desc: 'صلاحيات كاملة على كل حاجة' },
  staff: { label: 'موظف', desc: 'يشوف الطلبات ويغيّر حالتها بس' },
} as const;

// البيانات بتيجي من list_staff() / set_staff_member() / remove_staff_member()
// في قاعدة البيانات، ودول بيرفضوا أي طلب مش من المالك (is_admin()).
export function TeamClient() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'staff'>('staff');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.rpc('list_staff');
    if (error) toast.error('تعذر تحميل الفريق');
    setMembers((data ?? []) as Member[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setMember = async (targetEmail: string, targetRole: 'owner' | 'staff') => {
    const { error } = await supabase.rpc('set_staff_member', { p_email: targetEmail, p_role: targetRole });
    if (error) {
      toast.error(error.message);
      return false;
    }
    await load();
    return true;
  };

  const handleAdd = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('الرجاء إدخال إيميل صحيح');
      return;
    }
    if (role === 'owner' && !confirm('المالك له صلاحيات كاملة (منتجات، أسعار، أكواد خصم، فريق). متأكدة؟')) return;
    setSaving(true);
    const ok = await setMember(email, role);
    setSaving(false);
    if (ok) {
      setEmail('');
      toast.success('تمت الإضافة');
    }
  };

  const changeRole = async (m: Member) => {
    const next = m.role === 'owner' ? 'staff' : 'owner';
    if (!confirm(`تغيير ${m.email} إلى ${ROLE_INFO[next].label}؟`)) return;
    setBusy(m.user_id);
    await setMember(m.email, next);
    setBusy(null);
  };

  const remove = async (m: Member) => {
    if (!confirm(`شيل ${m.email} من لوحة التحكم؟`)) return;
    setBusy(m.user_id);
    const { error } = await supabase.rpc('remove_staff_member', { p_user_id: m.user_id });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id));
    toast.success('تم الحذف');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">الفريق والصلاحيات</h1>
        <p className="font-arabic text-sm text-muted-foreground mt-1">
          الموظف لازم يعمل حساب في الموقع الأول (من أيقونة الحساب) بنفس الإيميل، وبعدين تضيفيه هنا
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(ROLE_INFO) as (keyof typeof ROLE_INFO)[]).map((r) => (
          <div key={r} className="bg-background border border-border rounded-sm p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-arabic text-sm font-semibold">{ROLE_INFO[r].label}</p>
              <p className="font-arabic text-xs text-muted-foreground mt-0.5">{ROLE_INFO[r].desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-background border border-border rounded-sm p-5">
        <h2 className="font-arabic text-sm font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-accent" strokeWidth={1.5} />
          إضافة عضو
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            dir="ltr"
            className="flex-1 bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'owner' | 'staff')}
            className="bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="staff">موظف</option>
            <option value="owner">مالك</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="font-arabic bg-foreground text-primary-foreground px-6 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            إضافة
          </button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="font-arabic text-muted-foreground">لا يوجد أعضاء</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const isMe = m.user_id === user?.id;
              return (
                <li key={m.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-body text-sm truncate" dir="ltr">{m.email}</p>
                    <span
                      className={cn(
                        'inline-block mt-1 font-arabic text-[11px] px-2.5 py-0.5 rounded-full',
                        m.role === 'owner' ? 'bg-accent/15 text-accent-foreground' : 'bg-secondary text-foreground/70'
                      )}
                    >
                      {ROLE_INFO[m.role].label}{isMe && ' (أنتِ)'}
                    </span>
                  </div>
                  {!isMe && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeRole(m)}
                        disabled={busy === m.user_id}
                        className="font-arabic text-xs border border-border px-3 py-1.5 rounded-sm hover:border-foreground/40 transition-all disabled:opacity-60"
                      >
                        {m.role === 'owner' ? 'تحويل لموظف' : 'ترقية لمالك'}
                      </button>
                      <button onClick={() => remove(m)} disabled={busy === m.user_id} className="p-1.5 hover:bg-destructive/10 rounded-sm transition-colors" aria-label="حذف">
                        {busy === m.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} />}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
