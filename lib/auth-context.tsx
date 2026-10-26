"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, hasAuthCookie } from './supabase-lazy';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  // بتتأكد من كود التفعيل (6 أرقام) اللي بيوصل بالإيميل بعد إنشاء الحساب.
  // ملحوظة مهمة: لازم تغيّري إعدادات الإيميل في Supabase Dashboard عشان
  // الرسالة تبعت كود بدل رابط - شوفي التعليق فوق الدالة دي.
  verifySignupCode: (email: string, code: string) => Promise<{ error: string | null }>;
  // بتعيد إرسال كود التفعيل تاني (لو العميلة مستلمتش الإيميل أو الكود انتهى).
  resendSignupCode: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  // تحديث بيانات محدودة بس (الاسم، الموبايل، عنوان الشحن الافتراضي) - مش
  // الإيميل أو الباسورد. البيانات دي بتتحفظ في user_metadata وبتتستخدم
  // لملء فورم الشيك أوت تلقائياً في المرات الجاية.
  updateProfile: (data: {
    full_name?: string;
    phone?: string;
    whatsapp_phone?: string;
    governorate?: string;
    city_address?: string;
  }) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // بنحمّل Supabase ونسمع لتغييرات الدخول مرة واحدة بس، ولما نحتاجه:
  // - فوراً لو فيه كوكي جلسة (العميلة مسجلة دخول قبل كده)
  // - أو أول ما العميلة تدوس تسجيل دخول / حساب جديد
  // الزائرة الجديدة (معظم زوار الإعلانات) مبتحملش مكتبة Supabase خالص هنا.
  const listening = useRef(false);
  const ensureClient = useCallback(async () => {
    const supabase = await getSupabase();
    if (!listening.current) {
      listening.current = true;
      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      });
    }
    return supabase;
  }, []);

  useEffect(() => {
    let mounted = true;
    const start = () =>
      ensureClient().then((supabase) =>
        supabase.auth.getSession().then(({ data }) => {
          if (!mounted) return;
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setLoading(false);
        })
      );

    // صفحة تانية حمّلت Supabase (دخول الأدمن مثلاً) → نبدأ نسمع
    const onReady = () => start();
    window.addEventListener('supabase:ready', onReady);

    if (hasAuthCookie() || (window as unknown as { __supabaseReady?: boolean }).__supabaseReady) {
      start();
    } else {
      setLoading(false);
    }
    return () => {
      mounted = false;
      window.removeEventListener('supabase:ready', onReady);
    };
  }, [ensureClient]);

  const signIn = async (email: string, password: string) => {
    const supabase = await ensureClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const supabase = await ensureClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      // 🟢 تم إضافة إسناد الصلاحية التلقائي للزبون
      options: {
        data: {
          role: 'user',
        },
      },
    });
    return { error: error?.message ?? null };
  };

  /*
   * التحقق من الإيميل بكود بدل رابط
   * ==================================
   * Supabase بيبعت افتراضياً رابط تفعيل (Confirmation Link) بعد signUp،
   * مش كود. عشان يبعت كود 6 أرقام (Token) بدل الرابط، لازم تعدّلي قالب
   * الإيميل من Supabase Dashboard مرة واحدة بس:
   *   Authentication -> Email Templates -> Confirm signup
   *   امسحي {{ .ConfirmationURL }} من جوه الرابط <a href="...">
   *   وحطي بدالها {{ .Token }} في مكانه في نص الرسالة (يعني يبقى النص
   *   شكله مثلاً: "كود التفعيل بتاعك هو: {{ .Token }}").
   * بعد التعديل ده، signUp هيبعت كود، والدالة verifySignupCode تحت
   * هي اللي بتتأكد منه (type: 'signup').
   */
  const verifySignupCode = async (email: string, code: string) => {
    const supabase = await ensureClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    return { error: error?.message ?? null };
  };

  const resendSignupCode = async (email: string) => {
    const supabase = await ensureClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error: error?.message ?? null };
  };

  /*
   * التحقق عبر واتساب (لاحقاً)
   * ============================
   * Supabase مش بيبعت أكواد واتساب مباشرة - محتاجة تفعّلي مزوّد SMS/WhatsApp
   * (زي Twilio Verify) من Authentication -> Providers -> Phone في
   * Supabase Dashboard، وتختاري قناة الإرسال "whatsapp" بدل "sms" لو
   * المزوّد بيدعمها. بعدين التحقق بيبقى بنفس فكرة الإيميل بالظبط:
   *
   *   await supabase.auth.signInWithOtp({ phone, options: { channel: 'whatsapp' } });
   *   await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
   *
   * لما تجهزي حساب Twilio (أو أي مزوّد تاني)، قوليلي وهضيف الخطوتين دول
   * فعلياً في الكود (شاشة اختيار "تحقق بالإيميل / تحقق بالواتساب" في
   * AuthModal) - دلوقتي التحقق شغال بالإيميل بس.
   */

  const signOut = async () => {
    const supabase = await ensureClient();
    await supabase.auth.signOut();
  };

  // بنحدّث الاسم/الموبايل بس جوه user_metadata، من غير أي مساس بالإيميل أو
  // الباسورد أو أي صلاحيات - عشان كده الحقول اللي بتتبعت من الفورم محدودة
  // عمداً في مكان الاستخدام (صفحة الحساب).
  const updateProfile = async (data: {
    full_name?: string;
    phone?: string;
    whatsapp_phone?: string;
    governorate?: string;
    city_address?: string;
  }) => {
    const supabase = await ensureClient();
    const { error } = await supabase.auth.updateUser({ data });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, verifySignupCode, resendSignupCode, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
