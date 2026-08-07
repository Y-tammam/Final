"use client";

import { useState } from 'react';
import { X, Loader2, Mail, Lock, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp, verifySignupCode, resendSignupCode } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // بعد إنشاء الحساب بننقل العميلة لشاشة إدخال كود التفعيل (6 أرقام) بدل
  // ما نستنى تدوس على رابط في الإيميل.
  const [verificationSent, setVerificationSent] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setVerificationSent(false);
    setCode('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.toLowerCase().includes('email not confirmed')) {
          toast.error('برجاء تفعيل الحساب أولاً بكود التفعيل المرسل إلى بريدك الإلكتروني', {
            duration: 5000,
          });
        } else {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
      } else {
        toast.success('تم تسجيل الدخول بنجاح');
        handleClose();
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error);
      } else {
        setVerificationSent(true);
      }
    }

    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) {
      toast.error('اكتبي كود التفعيل المكوّن من 6 أرقام');
      return;
    }
    setVerifying(true);
    const { error } = await verifySignupCode(email, code.trim());
    setVerifying(false);
    if (error) {
      toast.error('الكود غير صحيح أو منتهي، تأكدي منه أو اطلبي كود جديد');
      return;
    }
    toast.success('تم تفعيل حسابك بنجاح');
    handleClose();
  };

  const handleResendCode = async () => {
    setResending(true);
    const { error } = await resendSignupCode(email);
    setResending(false);
    if (error) {
      toast.error('تعذر إعادة إرسال الكود، حاولي بعد قليل');
      return;
    }
    toast.success('تم إرسال كود جديد إلى بريدك الإلكتروني');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* خلفية معتمدة */}
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-background rounded-sm shadow-2xl max-w-md w-full p-6 sm:p-8 z-10 border border-border">
        <button onClick={handleClose} className="absolute top-4 left-4 p-1.5 hover:bg-muted rounded-sm text-muted-foreground">
          <X className="w-5 h-5" />
        </button>

        {verificationSent ? (
          /* شاشة إدخال كود التفعيل (6 أرقام) بعد إنشاء الحساب */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold">تم إنشاء الحساب بنجاح!</h2>
            <p className="font-arabic text-sm text-muted-foreground leading-relaxed">
              أرسلنا كود التفعيل إلى بريدك الإلكتروني: <br />
              <strong className="text-foreground dir-ltr inline-block my-1">{email}</strong>
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-3 text-right">
              <div>
                <label className="font-arabic text-xs text-muted-foreground block mb-1">كود التفعيل</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="------"
                  maxLength={6}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2.5 font-body text-lg tracking-[0.5em] text-center focus:outline-none focus:ring-1 focus:ring-ring"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={verifying || code.length < 6}
                className="w-full bg-foreground text-primary-foreground font-arabic py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد الكود
              </button>
            </form>

            <div className="bg-muted p-3.5 rounded-sm text-xs font-arabic text-muted-foreground text-right flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>تفقدي مجلد الرسائل غير المرغوب فيها (Spam/Junk) لو لم تجدي الكود.</span>
            </div>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="w-full font-arabic text-xs text-accent hover:underline disabled:opacity-60"
            >
              {resending ? 'جاري إعادة الإرسال...' : 'إعادة إرسال الكود'}
            </button>
            <button
              onClick={() => {
                setVerificationSent(false);
                setCode('');
                setMode('login');
              }}
              className="w-full border border-border font-arabic py-2.5 rounded-sm hover:bg-secondary transition-all text-sm"
            >
              الذهاب لتسجيل الدخول
            </button>
          </div>
        ) : (
          /* نموذج تسجيل الدخول / إنشاء حساب */
          <>
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-semibold">
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
              </h2>
              <p className="font-arabic text-xs text-muted-foreground mt-1">
                {mode === 'login' ? 'مرحباً بك! ادخلي بريدك وكلمة المرور' : 'أنشئي حسابك لمتابعة طلباتك بسهولة'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-arabic text-xs text-muted-foreground block mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full bg-background border border-border rounded-sm pr-9 pl-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="font-arabic text-xs text-muted-foreground block mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-border rounded-sm pr-9 pl-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-primary-foreground font-arabic py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
              </button>
            </form>

            <div className="mt-5 text-center pt-4 border-t border-border">
              <p className="font-arabic text-xs text-muted-foreground">
                {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-accent hover:underline font-medium"
                >
                  {mode === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
