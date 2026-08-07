"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck, Truck, Eye, MessageCircle, Loader2, CheckCircle2, ArrowLeft,
  UserCircle2, Upload, Copy, Check, SkipForward,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { priceEGP } from '@/lib/format';
import { BRAND_CONFIG, PAYMENT_METHODS, DISABLED_PAYMENT_METHODS } from '@/lib/brand';
import type { ShippingRate } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AuthModal } from '@/components/ui/auth-modal';

type Step = 'form' | 'vodafone-receipt' | 'success';

export function CheckoutForm({ shippingRates }: { shippingRates: ShippingRate[] }) {
  const { items, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [authOpen, setAuthOpen] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    whatsapp_phone: '',
    governorate: '',
    city_address: '',
    notes: '',
    payment_method: 'COD',
    allow_inspection: true,
  });
  const [saveInfo, setSaveInfo] = useState(true);
  const [prefilled, setPrefilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: number; total: number } | null>(null);

  // بيانات الطلب اللي بيحتاجها ستيب رفع إيصال فودافون كاش
  const [pendingOrder, setPendingOrder] = useState<{ id: string; orderNumber: number; total: number } | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [copied, setCopied] = useState(false);

  // لما العميل يكون مسجّل دخول، بنملأ بياناته المحفوظة تلقائياً (اسم،
  // موبايل، واتساب، محافظة، عنوان) بدل ما تكتبهم من الأول في كل مرة.
  // ده بيحصل مرة واحدة بس عشان لو العميل عدّل حاجة في الفورم منسيبهاش.
  useEffect(() => {
    if (!prefilled && user) {
      const meta = user.user_metadata ?? {};
      setForm((f) => ({
        ...f,
        customer_name: meta.full_name || f.customer_name,
        customer_phone: meta.phone || f.customer_phone,
        whatsapp_phone: meta.whatsapp_phone || f.whatsapp_phone,
        governorate: meta.governorate || f.governorate,
        city_address: meta.city_address || f.city_address,
      }));
      setPrefilled(true);
    }
  }, [user, prefilled]);

  const selectedRate = useMemo(
    () => shippingRates.find((r) => r.governorate_ar === form.governorate),
    [shippingRates, form.governorate]
  );
  const shippingFee = selectedRate?.cost_egp ?? 0;
  const total = subtotal + shippingFee;

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = (): string | null => {
    if (items.length === 0) return 'سلتك فارغة';
    if (!form.customer_name.trim()) return 'الرجاء إدخال الاسم';
    if (!form.customer_phone.trim() || form.customer_phone.replace(/[^0-9]/g, '').length < 10)
      return 'الرجاء إدخال رقم هاتف صحيح';
    if (!form.governorate) return 'الرجاء اختيار المحافظة';
    if (!form.city_address.trim()) return 'الرجاء إدخال العنوان بالتفصيل';
    if (DISABLED_PAYMENT_METHODS.includes(form.payment_method as keyof typeof PAYMENT_METHODS))
      return 'طريقة الدفع دي غير متاحة حالياً، برجاء اختيار طريقة أخرى';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id ?? null,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim(),
          whatsapp_phone: form.whatsapp_phone.trim() || null,
          governorate: form.governorate,
          city_address: form.city_address.trim(),
          subtotal_egp: subtotal,
          shipping_fee_egp: shippingFee,
          total_amount_egp: total,
          payment_method: form.payment_method,
          order_status: 'pending',
          allow_inspection: form.allow_inspection,
          notes: form.notes.trim() || null,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message ?? 'تعذر إنشاء الطلب');
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant.id,
        quantity: item.quantity,
        unit_price_egp: item.product.sale_price_egp ?? item.product.price_egp,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // لو العميلة مسجلة دخول واختارت تحفظ بياناتها، بنحدّث الحساب
      // ببيانات الشحن دي عشان تتملى تلقائي في الطلب الجاي.
      if (user && saveInfo) {
        // ما بنستناش نتيجة الحفظ ده عشان ميعطلش رحلة تأكيد الطلب لو فشل
        supabase.auth.updateUser({
          data: {
            full_name: form.customer_name.trim(),
            phone: form.customer_phone.trim(),
            whatsapp_phone: form.whatsapp_phone.trim() || null,
            governorate: form.governorate,
            city_address: form.city_address.trim(),
          },
        });
      }

      clearCart();

      if (form.payment_method === 'Vodafone Cash') {
        setPendingOrder({ id: order.id, orderNumber: order.order_number, total });
        setStep('vodafone-receipt');
      } else {
        setSuccess({ orderNumber: order.order_number, total });
        setStep('success');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ، حاولي مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setReceiptPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadReceipt = async () => {
    if (!pendingOrder) return;
    if (!receiptPreview) {
      toast.error('برجاء اختيار صورة الإيصال أولاً');
      return;
    }
    setUploadingReceipt(true);
    const { error } = await supabase
      .from('orders')
      .update({ payment_receipt_url: receiptPreview })
      .eq('id', pendingOrder.id);
    setUploadingReceipt(false);
    if (error) {
      toast.error('تعذر رفع الإيصال، جرّبي تاني أو ابعتيه عبر واتساب');
      return;
    }
    toast.success('تم رفع الإيصال بنجاح');
    setSuccess({ orderNumber: pendingOrder.orderNumber, total: pendingOrder.total });
    setStep('success');
  };

  const handleSkipReceipt = () => {
    if (!pendingOrder) return;
    setSuccess({ orderNumber: pendingOrder.orderNumber, total: pendingOrder.total });
    setStep('success');
  };

  const copyVodafoneNumber = () => {
    navigator.clipboard.writeText(BRAND_CONFIG.vodafoneCash.number);
    setCopied(true);
    toast.success('تم نسخ الرقم');
    setTimeout(() => setCopied(false), 2000);
  };

  // شاشة رفع إيصال فودافون كاش
  if (step === 'vodafone-receipt' && pendingOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="w-8 h-8 text-accent" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">تم تسجيل طلبك #{pendingOrder.orderNumber}</h1>
          <p className="font-arabic text-muted-foreground leading-relaxed">
            خطوة أخيرة: حوّلي المبلغ عبر فودافون كاش وارفعي صورة الإيصال هنا لتأكيد الدفع بسرعة
          </p>
        </div>

        <div className="bg-secondary/50 rounded-sm p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-arabic text-sm text-muted-foreground">المبلغ المطلوب تحويله</span>
            <span className="font-body text-xl font-semibold num-rtl">{priceEGP(pendingOrder.total)} ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="font-arabic text-sm text-muted-foreground">رقم فودافون كاش</span>
            <button
              type="button"
              onClick={copyVodafoneNumber}
              className="flex items-center gap-2 font-body text-lg font-semibold num-rtl bg-background border border-border px-3 py-1.5 rounded-sm hover:border-accent transition-colors"
              dir="ltr"
            >
              {BRAND_CONFIG.vodafoneCash.number}
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-arabic text-sm text-muted-foreground">اسم صاحب الرقم</span>
            <span className="font-arabic text-sm">{BRAND_CONFIG.vodafoneCash.holderName}</span>
          </div>
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-sm p-4 mb-6">
          <p className="font-arabic text-sm leading-relaxed">
            1. حوّلي المبلغ من فودافون كاش بتاعك للرقم اللي فوق.<br />
            2. اضغطي على "التقاط صورة" وصوّري رسالة التأكيد (الإيصال)، أو ارفعي سكرين شوت منها.<br />
            3. اضغطي "رفع الإيصال وتأكيد الطلب".
          </p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="font-arabic text-sm text-foreground/80 block mb-2">صورة إيصال التحويل</span>
            <div className="border-2 border-dashed border-border rounded-sm p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
              {receiptPreview ? (
                <div className="relative w-full max-w-[220px] mx-auto aspect-[3/4] overflow-hidden rounded-sm">
                  <img src={receiptPreview} alt="إيصال التحويل" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-8 h-8" strokeWidth={1.5} />
                  <span className="font-arabic text-sm">اضغطي لاختيار صورة الإيصال من جهازك</span>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleReceiptFile} className="hidden" />
            </div>
          </label>

          <button
            type="button"
            onClick={handleUploadReceipt}
            disabled={uploadingReceipt || !receiptPreview}
            className="w-full bg-foreground text-primary-foreground font-arabic py-3.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploadingReceipt ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            رفع الإيصال وتأكيد الطلب
          </button>

          <button
            type="button"
            onClick={handleSkipReceipt}
            className="w-full font-arabic text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            تخطي الآن، وسأرسل الإيصال لاحقاً عبر واتساب
          </button>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === 'success' && success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 lg:py-28 text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 scale-in">
          <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">تم استلام طلبك بنجاح</h1>
        <p className="font-arabic text-muted-foreground mb-8 leading-relaxed">
          شكراً لكِ! سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب وتفاصيل الشحن.
        </p>

        <div className="bg-secondary/50 rounded-sm p-6 mb-8 text-right">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="font-arabic text-sm text-muted-foreground">رقم الطلب</span>
            <span className="font-body font-semibold num-rtl">#{success.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="font-arabic text-sm text-muted-foreground">إجمالي المبلغ</span>
            <span className="font-body font-semibold num-rtl">{priceEGP(success.total)} ج.م</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-arabic text-sm text-muted-foreground">طريقة الدفع</span>
            <span className="font-arabic text-sm font-medium">
              {PAYMENT_METHODS[form.payment_method as keyof typeof PAYMENT_METHODS] ?? form.payment_method}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="font-arabic bg-foreground text-primary-foreground px-8 py-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all">
            متابعة التسوق
          </Link>
          <Link href="/" className="font-arabic border border-border px-8 py-3 rounded-sm hover:border-foreground transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 lg:py-28 text-center">
        <h1 className="font-display text-3xl font-semibold mb-4">سلتك فارغة</h1>
        <p className="font-arabic text-muted-foreground mb-8">أضيفي بعض المنتجات قبل إتمام الطلب</p>
        <Link href="/shop" className="font-arabic inline-flex items-center gap-2 bg-foreground text-primary-foreground px-8 py-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all">
          <ArrowLeft className="w-4 h-4" />
          تصفحي المتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2">إتمام الطلب</h1>
      <p className="font-arabic text-muted-foreground mb-6">أدخلي بياناتك وستصلك قطعك المفضلة لباب البيت</p>

      {/* بانر تسجيل الدخول - اختياري، الطلب كـ زائر شغال عادي من غيره */}
      {!authLoading && !user && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-secondary/50 border border-border rounded-sm px-5 py-4 mb-8">
          <div className="flex items-center gap-3">
            <UserCircle2 className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
            <p className="font-arabic text-sm text-foreground/80">
              سجّلي دخولك لحفظ بياناتك وتتملى تلقائياً في طلباتك القادمة، أو أكملي كزائرة عادي
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="font-arabic text-sm text-accent hover:underline shrink-0"
          >
            تسجيل الدخول / إنشاء حساب
          </button>
        </div>
      )}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Form fields */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contact */}
          <div className="bg-background border border-border rounded-sm p-6">
            <h2 className="font-arabic text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-primary-foreground flex items-center justify-center text-sm">1</span>
              بيانات التواصل
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="font-arabic text-sm text-foreground/80 block mb-1.5">الاسم الكامل *</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => update('customer_name', e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="مثال: منى أحمد"
                />
              </div>
              <div>
                <label className="font-arabic text-sm text-foreground/80 block mb-1.5">رقم الهاتف *</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => update('customer_phone', e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring num-rtl"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="font-arabic text-sm text-foreground/80 block mb-1.5">واتساب (اختياري)</label>
                <input
                  type="tel"
                  value={form.whatsapp_phone}
                  onChange={(e) => update('whatsapp_phone', e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring num-rtl"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-background border border-border rounded-sm p-6">
            <h2 className="font-arabic text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-primary-foreground flex items-center justify-center text-sm">2</span>
              عنوان الشحن
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-arabic text-sm text-foreground/80 block mb-1.5">المحافظة *</label>
                <select
                  value={form.governorate}
                  onChange={(e) => update('governorate', e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">اختاري المحافظة</option>
                  {shippingRates.map((r) => (
                    <option key={r.id} value={r.governorate_ar}>
                      {r.governorate_ar} — {priceEGP(r.cost_egp)} ج.م ({r.estimated_days})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-arabic text-sm text-foreground/80 block mb-1.5">العنوان بالتفصيل *</label>
                <textarea
                  value={form.city_address}
                  onChange={(e) => update('city_address', e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border rounded-sm px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="المدينة، الشارع، رقم العمارة، الشقة، علامة مميزة..."
                />
              </div>
              <div>
                <label className="font-arabic text-sm text-foreground/80 block mb-1.5">ملاحظات (اختياري)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-sm px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="أي تعليمات خاصة بالتوصيل..."
                />
              </div>
              {user && (
                <label className="flex items-center gap-3 p-3 bg-secondary/40 rounded-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="accent-accent w-4 h-4"
                  />
                  <span className="font-arabic text-sm">احفظي بياناتي دي لطلباتي القادمة</span>
                </label>
              )}
            </div>
          </div>

          {/* Payment + inspection */}
          <div className="bg-background border border-border rounded-sm p-6">
            <h2 className="font-arabic text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-primary-foreground flex items-center justify-center text-sm">3</span>
              طريقة الدفع
            </h2>
            <div className="space-y-3">
              {(Object.keys(PAYMENT_METHODS) as (keyof typeof PAYMENT_METHODS)[]).map((method) => {
                const isDisabled = DISABLED_PAYMENT_METHODS.includes(method);
                return (
                  <label
                    key={method}
                    className={cn(
                      'flex items-center justify-between gap-3 p-4 border rounded-sm transition-all',
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : cn(
                            'cursor-pointer',
                            form.payment_method === method ? 'border-accent bg-accent/5' : 'border-border hover:border-foreground/30'
                          )
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={form.payment_method === method}
                        onChange={() => !isDisabled && update('payment_method', method)}
                        disabled={isDisabled}
                        className="accent-accent"
                      />
                      <span className="font-arabic text-sm">{PAYMENT_METHODS[method]}</span>
                    </div>
                    {isDisabled && (
                      <span className="font-arabic text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                        قريباً
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {form.payment_method === 'Vodafone Cash' && (
              <div className="mt-4 bg-accent/5 border border-accent/20 rounded-sm p-3.5">
                <p className="font-arabic text-xs text-foreground/80 leading-relaxed">
                  بعد تأكيد الطلب هيظهرلك رقم فودافون كاش وهتقدري ترفعي صورة إيصال التحويل مباشرة.
                </p>
              </div>
            )}

            <label className="flex items-center gap-3 mt-5 p-4 bg-secondary/40 rounded-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.allow_inspection}
                onChange={(e) => update('allow_inspection', e.target.checked)}
                className="accent-accent w-4 h-4"
              />
              <span className="font-arabic text-sm">
                أرغب في <strong className="text-accent">المعاينة قبل الدفع</strong> مع مندوب الشحن
              </span>
            </label>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-background border border-border rounded-sm p-6 lg:sticky lg:top-24">
            <h2 className="font-arabic text-lg font-semibold mb-5">ملخص الطلب</h2>

            <ul className="space-y-4 mb-5 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <li key={item.variant.id} className="flex gap-3">
                  <div className="relative w-16 h-20 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0]} alt={item.product.title_ar} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-arabic text-xs font-medium line-clamp-1">{item.product.title_ar}</h3>
                    <p className="font-arabic text-[11px] text-muted-foreground mt-0.5">
                      {item.variant.color_ar} • {item.variant.size} • ×{item.quantity}
                    </p>
                    <p className="font-body text-sm font-semibold mt-1 num-rtl">
                      {priceEGP((item.product.sale_price_egp ?? item.product.price_egp) * item.quantity)} ج.م
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-2.5 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-arabic text-sm text-muted-foreground">المجموع الفرعي</span>
                <span className="font-body text-sm num-rtl">{priceEGP(subtotal)} ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-arabic text-sm text-muted-foreground">الشحن</span>
                <span className="font-body text-sm num-rtl">
                  {form.governorate ? `${priceEGP(shippingFee)} ج.م` : 'اختاري المحافظة'}
                </span>
              </div>
              {selectedRate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-arabic">
                  <Truck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                  {selectedRate.estimated_days}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-4 border-t border-border">
              <span className="font-arabic text-base font-semibold">الإجمالي</span>
              <span className="font-body text-xl font-semibold num-rtl">{priceEGP(total)} ج.م</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-primary-foreground font-arabic py-4 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all duration-400 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التأكيد...
                </>
              ) : (
                'تأكيد الطلب'
              )}
            </button>

            <div className="flex flex-col gap-2.5 mt-5">
              <div className="flex items-center gap-2 text-xs font-arabic text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                طلبك آمن — دفع عند الاستلام
              </div>
              <div className="flex items-center gap-2 text-xs font-arabic text-muted-foreground">
                <Eye className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                إمكانية المعاينة قبل الدفع
              </div>
              <a
                href={`https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-arabic text-success"
              >
                <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                للاستفسار عبر واتساب
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
