"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Truck, Eye, MessageCircle, Loader2, CheckCircle2, ArrowLeft,
  Upload, Copy, Check, SkipForward, Camera, ChevronDown,
} from 'lucide-react';
import { useCart, describeStockChanges } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { priceEGP } from '@/lib/format';
import { BRAND_CONFIG, PAYMENT_METHODS, DISABLED_PAYMENT_METHODS } from '@/lib/brand';
import type { ShippingRate } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AuthModal } from '@/components/ui/auth-modal';
import { receiptFileToCompressedDataURL } from '@/lib/image-upload';
import { FreeShippingProgress } from '@/components/store/free-shipping-progress';
import { track } from '@/lib/analytics';

type Step = 'form' | 'vodafone-receipt' | 'success';

export function CheckoutForm({
  shippingRates,
  freeShippingThreshold,
}: {
  shippingRates: ShippingRate[];
  freeShippingThreshold: number | null;
}) {
  const { items, subtotal, clearCart, refreshStock } = useCart();
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
  const baseShippingFee = selectedRate?.cost_egp ?? 0;

  // أول ما صفحة الدفع تفتح: نظبط السلة على المخزون الحقيقي
  useEffect(() => {
    refreshStock().then((changes) => {
      if (changes.length > 0) toast.warning(describeStockChanges(changes), { duration: 8000 });
    });
  }, [refreshStock]);

  // مرة واحدة لما العميلة تفتح صفحة الدفع وفي سلتها منتجات
  const initiatedRef = useRef(false);
  useEffect(() => {
    if (initiatedRef.current || items.length === 0) return;
    initiatedRef.current = true;
    track('InitiateCheckout', {
      content_ids: items.map((i) => i.product.id),
      num_items: items.reduce((n, i) => n + i.quantity, 0),
      value: subtotal,
    });
  }, [items, subtotal]);

  // كود الخصم: preview_discount بيرجع قيمة الخصم للعرض بس، والحساب
  // الحقيقي بيحصل تاني جوه place_order على السيرفر.
  const [discountInput, setDiscountInput] = useState('');
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // لو السلة اتغيرت بعد تطبيق الكود، الخصم بيتلغي عشان يتحسب تاني صح
  useEffect(() => {
    setDiscount(null);
  }, [subtotal]);

  const applyDiscount = async () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    setApplyingDiscount(true);
    const { data, error } = await supabase.rpc('preview_discount', {
      p_code: code,
      p_subtotal: subtotal,
      p_phone: form.customer_phone.trim() || null,
    });
    setApplyingDiscount(false);
    if (error) {
      setDiscount(null);
      toast.error(error.message);
      return;
    }
    setDiscount({ code, amount: Number(data) });
    toast.success('تم تطبيق كود الخصم');
  };

  const discountAmount = discount?.amount ?? 0;
  // نفس قاعدة place_order: الشحن مجاني لو المنتجات بعد الخصم وصلت الحد
  const freeShipping = !!freeShippingThreshold && subtotal - discountAmount >= freeShippingThreshold;
  const shippingFee = freeShipping ? 0 : baseShippingFee;
  const total = subtotal - discountAmount + shippingFee;

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    // أول ما العميلة تعدّل الحقل، رسالة الخطأ بتاعته بتختفي
    setErrors((prev) => (key in prev ? { ...prev, [key]: undefined } : prev));
  };

  // أخطاء الحقول بتظهر تحت كل حقل (مش toast)، وأول حقل غلط بياخد الـ focus.
  // نفس قواعد التحقق القديمة بالظبط.
  type FieldKey = 'customer_name' | 'customer_phone' | 'governorate' | 'city_address';
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>>({});

  const validateFields = (): Partial<Record<FieldKey, string>> => {
    const errs: Partial<Record<FieldKey, string>> = {};
    if (!form.customer_name.trim()) errs.customer_name = 'اكتبي اسمك';
    if (!form.customer_phone.trim() || form.customer_phone.replace(/[^0-9]/g, '').length < 10)
      errs.customer_phone = 'اكتبي رقم موبايل صحيح';
    if (!form.governorate) errs.governorate = 'اختاري المحافظة';
    if (!form.city_address.trim()) errs.city_address = 'اكتبي العنوان بالتفصيل';
    return errs;
  };

  const validate = (): string | null => {
    if (items.length === 0) return 'سلتك فارغة';
    if (DISABLED_PAYMENT_METHODS.includes(form.payment_method as keyof typeof PAYMENT_METHODS))
      return 'طريقة الدفع دي غير متاحة حالياً، برجاء اختيار طريقة أخرى';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validateFields();
    setErrors(fieldErrors);
    const fieldOrder: FieldKey[] = ['customer_name', 'customer_phone', 'governorate', 'city_address'];
    const firstInvalid = fieldOrder.find((k) => fieldErrors[k]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      // الطلب بيتسجل من خلال دالة place_order في قاعدة البيانات: بنبعت
      // المنتجات والكميات بس، والأسعار والشحن والإجمالي بيتحسبوا على السيرفر
      // من الأسعار الحقيقية (مش من المتصفح) - شوفي
      // supabase/migrations/20261020000000_secure_checkout_rpc.sql
      const { data: placed, error: orderError } = await supabase
        .rpc('place_order', {
          p_customer_name: form.customer_name.trim(),
          p_customer_phone: form.customer_phone.trim(),
          p_whatsapp_phone: form.whatsapp_phone.trim() || null,
          p_governorate: form.governorate,
          p_city_address: form.city_address.trim(),
          p_notes: form.notes.trim() || null,
          p_payment_method: form.payment_method,
          p_allow_inspection: form.allow_inspection,
          p_items: items.map((item) => ({ variant_id: item.variant.id, quantity: item.quantity })),
          p_discount_code: discount?.code ?? null,
        })
        .single<{ order_id: string; order_number: number; total_amount_egp: number }>();

      if (orderError || !placed) {
        // لو المشكلة في المخزون (حد سبقها على آخر قطعة)، بنظبط السلة تلقائي
        // عشان تقدر تكمل باللي متاح
        if (/(متوفر|متاح|المخزون)/.test(orderError?.message ?? '')) {
          const changes = await refreshStock();
          if (changes.length > 0) {
            toast.error(`${orderError.message}\n${describeStockChanges(changes)}\nراجعي السلة وأكدي الطلب تاني.`, { duration: 9000 });
            return;
          }
        }
        throw new Error(orderError?.message ?? 'تعذر إنشاء الطلب');
      }
      const order = { id: placed.order_id, order_number: placed.order_number };
      const orderTotal = Number(placed.total_amount_egp);
      track('Purchase', {
        content_ids: items.map((i) => i.product.id),
        content_type: 'product',
        num_items: items.reduce((n, i) => n + i.quantity, 0),
        value: orderTotal,
      });

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
        setPendingOrder({ id: order.id, orderNumber: order.order_number, total: orderTotal });
        setStep('vodafone-receipt');
      } else {
        setSuccess({ orderNumber: order.order_number, total: orderTotal });
        setStep('success');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ، حاولي مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // بنضغط صورة الإيصال لـ WebP قبل التخزين (مش base64 خام) عشان تفضل صغيرة
  // - شوفي receiptFileToCompressedDataURL في lib/image-upload.ts.
  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await receiptFileToCompressedDataURL(file);
      setReceiptPreview(compressed);
    } catch (err) {
      toast.error('تعذرت قراءة الصورة، جرّبي صورة تانية');
    }
  };

  const handleUploadReceipt = async () => {
    if (!pendingOrder) return;
    if (!receiptPreview) {
      toast.error('برجاء اختيار صورة الإيصال أولاً');
      return;
    }
    setUploadingReceipt(true);
    const { error } = await supabase.rpc('attach_order_receipt', {
      p_order_id: pendingOrder.id,
      p_receipt: receiptPreview,
    });
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
            <MessageCircle className="w-8 h-8 text-accent-text" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium leading-[1.3] mb-2">تم تسجيل طلبك #{pendingOrder.orderNumber}</h1>
          <p className="font-arabic text-muted-foreground leading-relaxed">
            خطوة أخيرة: حوّلي المبلغ عبر فودافون كاش وارفعي صورة الإيصال هنا لتأكيد الدفع بسرعة
          </p>
        </div>

        <div className="bg-secondary/50 rounded-sm p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-arabic text-sm text-muted-foreground">المبلغ المطلوب تحويله</span>
            <span className="font-arabic text-xl font-semibold tabular-nums">{priceEGP(pendingOrder.total)} ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="font-arabic text-sm text-muted-foreground">رقم فودافون كاش</span>
            <button
              type="button"
              onClick={copyVodafoneNumber}
              className="flex items-center gap-2 font-body text-lg font-semibold num-rtl bg-background border border-border px-3 py-1.5 rounded-sm hover:border-foreground transition-colors"
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
            2. اضغطي على «التقاط صورة» وصوّري رسالة التأكيد (الإيصال)، أو ارفعي سكرين شوت منها.<br />
            3. اضغطي «رفع الإيصال وتأكيد الطلب».
          </p>
        </div>

        <div className="space-y-3">
          <span className="font-arabic text-sm text-foreground/80 block mb-2">صورة إيصال التحويل</span>
          <div className="border-2 border-dashed border-border rounded-sm p-6 text-center">
            {receiptPreview ? (
              <div className="relative w-full max-w-[220px] mx-auto aspect-[3/4] overflow-hidden rounded-sm mb-4">
                <img src={receiptPreview} alt="إيصال التحويل" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground mb-4">
                <Upload className="w-8 h-8" strokeWidth={1.5} />
                <span className="font-arabic text-sm">التقطي صورة للإيصال أو ارفعيها من الجهاز</span>
              </div>
            )}
            {/* اختيار صريح بين الكاميرا (capture) واختيار صورة محفوظة من الجهاز */}
            <div className="flex gap-2 justify-center">
              <label className="cursor-pointer bg-foreground text-primary-foreground font-arabic text-sm px-4 py-2.5 rounded-sm hover:bg-foreground/85 transition-colors flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                التقاط صورة
                <input type="file" accept="image/*" capture="environment" onChange={handleReceiptFile} className="hidden" />
              </label>
              <label className="cursor-pointer border border-border font-arabic text-sm px-4 py-2.5 rounded-sm hover:bg-secondary transition-colors flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                اختيار من الجهاز
                <input type="file" accept="image/*" onChange={handleReceiptFile} className="hidden" />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUploadReceipt}
            disabled={uploadingReceipt || !receiptPreview}
            className="w-full bg-foreground text-primary-foreground font-arabic py-3.5 rounded-sm hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
        <h1 className="font-display text-3xl sm:text-4xl font-medium leading-[1.3] mb-3">تم استلام طلبك بنجاح</h1>
        <p className="font-arabic text-muted-foreground mb-8 leading-relaxed">
          شكراً لكِ! سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب وتفاصيل الشحن.
        </p>

        <div className="bg-secondary/50 rounded-sm p-6 mb-8 text-right">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="font-arabic text-sm text-muted-foreground">رقم الطلب</span>
            <span className="font-body font-semibold tabular-nums num-rtl">#{success.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="font-arabic text-sm text-muted-foreground">إجمالي المبلغ</span>
            <span className="font-arabic font-semibold tabular-nums">{priceEGP(success.total)} ج.م</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-arabic text-sm text-muted-foreground">طريقة الدفع</span>
            <span className="font-arabic text-sm font-medium">
              {PAYMENT_METHODS[form.payment_method as keyof typeof PAYMENT_METHODS] ?? form.payment_method}
            </span>
          </div>
        </div>

        {/* تأكيد سريع من العميلة على واتساب - بيقلل الطلبات اللي بتترفض عند الاستلام */}
        <a
          href={`https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            `أهلاً ${BRAND_CONFIG.nameArabic}، أنا ${form.customer_name.trim()} وبأكد طلبي رقم #${success.orderNumber} بإجمالي ${priceEGP(success.total)} ج.م`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex mx-auto mb-4 bg-[#25D366] text-white font-arabic px-8 py-3 hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
          أكدي طلبك على واتساب (أسرع في الشحن)
        </a>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="font-arabic bg-foreground text-primary-foreground px-8 py-3 rounded-sm hover:bg-foreground/85 transition-colors">
            متابعة التسوق
          </Link>
          <Link href="/" className="font-arabic border border-border px-8 py-3 rounded-sm hover:border-foreground transition-colors">
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
        <h1 className="font-display text-3xl font-medium leading-[1.3] mb-4">سلتك فارغة</h1>
        <p className="font-arabic text-muted-foreground mb-8">أضيفي بعض المنتجات قبل إتمام الطلب</p>
        <Link href="/shop" className="font-arabic inline-flex items-center gap-2 bg-foreground text-primary-foreground px-8 py-3 rounded-sm hover:bg-foreground/85 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          تصفحي المتجر
        </Link>
      </div>
    );
  }

  const fieldClass = (invalid?: boolean) =>
    cn(
      'w-full bg-background border px-4 py-3 font-arabic text-base leading-6 transition-colors focus:border-foreground focus-visible:outline-none',
      invalid ? 'border-destructive' : 'border-border'
    );
  const errorId = (key: FieldKey) => `${key}-error`;
  const fieldA11y = (key: FieldKey) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? errorId(key) : undefined,
  });
  const fieldError = (name: FieldKey) =>
    errors[name] ? (
      <p id={errorId(name)} className="font-arabic text-[13px] text-destructive mt-1.5">
        {errors[name]}
      </p>
    ) : null;

  const lineItems = (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.variant.id} className="flex gap-3">
          <div className="relative w-16 h-[85px] shrink-0 overflow-hidden bg-muted">
            {item.product.images[0] && (
              <Image src={item.product.images[0]} alt={item.product.title_ar} fill sizes="64px" className="object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-arabic text-sm font-medium leading-[1.6] line-clamp-1">{item.product.title_ar}</h3>
            <p className="font-arabic text-[13px] text-muted-foreground">
              {item.variant.color_ar} • {item.variant.size} • ×{item.quantity.toLocaleString('ar-EG')}
            </p>
            <p className="font-arabic text-sm font-medium mt-1 tabular-nums">
              {priceEGP((item.product.sale_price_egp ?? item.product.price_egp) * item.quantity)} ج.م
            </p>
          </div>
        </li>
      ))}
    </ul>
  );

  const isCOD = form.payment_method === 'COD';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-medium leading-[1.3] mb-2">إتمام الطلب</h1>
      <p className="font-arabic text-muted-foreground">اكتبي بياناتك، وهنوصّل طلبك لباب البيت</p>

      {/* تسجيل الدخول - اختياري، الطلب كـ زائرة شغال عادي. لينك واحد بدل بانر كامل */}
      {!authLoading && !user && (
        <p className="font-arabic text-sm text-foreground/75 mt-3">
          عندكِ حساب؟{' '}
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-[text-decoration-color]"
          >
            سجّلي دخولك
          </button>{' '}
          وبياناتك هتتملى لوحدها
        </p>
      )}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ملخص الطلب على الموبايل - مقفول افتراضياً فوق الفورم */}
      <details className="lg:hidden group mt-6 border-y border-border">
        <summary className="flex items-center justify-between gap-3 py-4 min-h-[44px] cursor-pointer list-none [&::-webkit-details-marker]:hidden font-arabic text-[15px]">
          <span className="flex items-center gap-2">
            <span className="group-open:hidden">عرض ملخص الطلب</span>
            <span className="hidden group-open:inline">إخفاء ملخص الطلب</span>
            <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span className="font-semibold tabular-nums">{priceEGP(total)} ج.م</span>
        </summary>
        <div className="pb-5">{lineItems}</div>
      </details>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12 mt-6 lg:mt-8">
        {/* Form fields */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contact */}
          <fieldset className="border border-border p-5 sm:p-6">
            <legend className="sr-only">بيانات التواصل</legend>
            <h2 className="font-arabic text-lg font-semibold mb-5 flex items-center gap-3" aria-hidden="true">
              <span className="w-7 h-7 rounded-full border border-foreground flex items-center justify-center text-sm">١</span>
              بيانات التواصل
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="customer_name" className="font-arabic text-sm text-foreground/80 block mb-1.5">الاسم بالكامل</label>
                <input
                  id="customer_name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  ref={(el) => {
                    fieldRefs.current.customer_name = el;
                  }}
                  value={form.customer_name}
                  onChange={(e) => update('customer_name', e.target.value)}
                  className={fieldClass(!!errors.customer_name)}
                  placeholder="مثال: منى أحمد…"
                  {...fieldA11y('customer_name')}
                />
                {fieldError('customer_name')}
              </div>
              <div>
                <label htmlFor="customer_phone" className="font-arabic text-sm text-foreground/80 block mb-1.5">رقم الموبايل</label>
                <input
                  id="customer_phone"
                  name="tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  ref={(el) => {
                    fieldRefs.current.customer_phone = el;
                  }}
                  value={form.customer_phone}
                  onChange={(e) => update('customer_phone', e.target.value)}
                  className={cn(fieldClass(!!errors.customer_phone), 'num-rtl text-right')}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  {...fieldA11y('customer_phone')}
                />
                {fieldError('customer_phone')}
              </div>
              <div>
                <label htmlFor="whatsapp_phone" className="font-arabic text-sm text-foreground/80 block mb-1.5">
                  واتساب <span className="text-muted-foreground">(لو مختلف)</span>
                </label>
                <input
                  id="whatsapp_phone"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.whatsapp_phone}
                  onChange={(e) => update('whatsapp_phone', e.target.value)}
                  className={cn(fieldClass(), 'num-rtl text-right')}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>
          </fieldset>

          {/* Shipping address */}
          <fieldset className="border border-border p-5 sm:p-6">
            <legend className="sr-only">عنوان الشحن</legend>
            <h2 className="font-arabic text-lg font-semibold mb-5 flex items-center gap-3" aria-hidden="true">
              <span className="w-7 h-7 rounded-full border border-foreground flex items-center justify-center text-sm">٢</span>
              عنوان الشحن
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="governorate" className="font-arabic text-sm text-foreground/80 block mb-1.5">المحافظة</label>
                <select
                  id="governorate"
                  name="governorate"
                  autoComplete="address-level1"
                  ref={(el) => {
                    fieldRefs.current.governorate = el;
                  }}
                  value={form.governorate}
                  onChange={(e) => update('governorate', e.target.value)}
                  className={fieldClass(!!errors.governorate)}
                  {...fieldA11y('governorate')}
                >
                  <option value="">اختاري المحافظة</option>
                  {shippingRates.map((r) => (
                    <option key={r.id} value={r.governorate_ar}>
                      {r.governorate_ar} — {priceEGP(r.cost_egp)} ج.م ({r.estimated_days})
                    </option>
                  ))}
                </select>
                {fieldError('governorate')}
              </div>
              <div>
                <label htmlFor="city_address" className="font-arabic text-sm text-foreground/80 block mb-1.5">العنوان بالتفصيل</label>
                <textarea
                  id="city_address"
                  name="street-address"
                  autoComplete="street-address"
                  ref={(el) => {
                    fieldRefs.current.city_address = el;
                  }}
                  value={form.city_address}
                  onChange={(e) => update('city_address', e.target.value)}
                  rows={3}
                  className={cn(fieldClass(!!errors.city_address), 'resize-none')}
                  placeholder="المدينة، الشارع، رقم العمارة، الشقة، علامة مميزة…"
                  {...fieldA11y('city_address')}
                />
                {fieldError('city_address')}
              </div>
              <div>
                <label htmlFor="order_notes" className="font-arabic text-sm text-foreground/80 block mb-1.5">
                  ملاحظات <span className="text-muted-foreground">(اختياري)</span>
                </label>
                <textarea
                  id="order_notes"
                  name="notes"
                  autoComplete="off"
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={2}
                  className={cn(fieldClass(), 'resize-none')}
                  placeholder="أي تعليمات خاصة بالتوصيل…"
                />
              </div>
              {user && (
                <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="accent-foreground w-4 h-4"
                  />
                  <span className="font-arabic text-sm">احفظي بياناتي دي لطلباتي القادمة</span>
                </label>
              )}
            </div>
          </fieldset>

          {/* Payment + inspection */}
          <fieldset className="border border-border p-5 sm:p-6">
            <legend className="sr-only">طريقة الدفع</legend>
            <h2 className="font-arabic text-lg font-semibold mb-5 flex items-center gap-3" aria-hidden="true">
              <span className="w-7 h-7 rounded-full border border-foreground flex items-center justify-center text-sm">٣</span>
              طريقة الدفع
            </h2>
            <div className="space-y-3">
              {(Object.keys(PAYMENT_METHODS) as (keyof typeof PAYMENT_METHODS)[]).map((method) => {
                const isDisabled = DISABLED_PAYMENT_METHODS.includes(method);
                return (
                  <label
                    key={method}
                    className={cn(
                      'flex items-center justify-between gap-3 p-4 border transition-colors',
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : cn(
                            'cursor-pointer',
                            form.payment_method === method ? 'border-foreground' : 'border-border hover:border-foreground/30'
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
                        className="accent-foreground w-4 h-4"
                      />
                      <span className="font-arabic text-[15px]">{PAYMENT_METHODS[method]}</span>
                    </div>
                    {isDisabled ? (
                      <span className="font-arabic text-[13px] text-muted-foreground">قريباً</span>
                    ) : method === 'COD' ? (
                      <span className="font-arabic text-[13px] text-accent-text">الأكثر اختياراً</span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            {form.payment_method === 'Vodafone Cash' && (
              <p className="mt-4 font-arabic text-sm text-foreground/80 leading-[1.75] border-r-2 border-accent pr-3">
                بعد تأكيد الطلب هيظهرلك رقم فودافون كاش وهتقدري ترفعي صورة إيصال التحويل مباشرة.
              </p>
            )}

            <label className="flex items-center gap-3 mt-5 pt-5 border-t border-border cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={form.allow_inspection}
                onChange={(e) => update('allow_inspection', e.target.checked)}
                className="accent-foreground w-4 h-4"
              />
              <span className="font-arabic text-[15px]">
                أرغب في <strong className="font-semibold">المعاينة قبل الدفع</strong> مع مندوب الشحن
              </span>
            </label>
          </fieldset>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="lg:border lg:border-border lg:p-6 lg:sticky lg:top-24">
            <h2 className="hidden lg:block font-arabic text-lg font-semibold mb-5">ملخص الطلب</h2>

            <div className="hidden lg:block mb-5 max-h-72 overflow-y-auto overscroll-contain">{lineItems}</div>

            <div className="space-y-2.5 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-arabic text-sm text-foreground/75">المجموع الفرعي</span>
                <span className="font-arabic text-sm tabular-nums">{priceEGP(subtotal)} ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-arabic text-sm text-foreground/75">الشحن</span>
                <span className="font-arabic text-sm tabular-nums">
                  {freeShipping ? 'مجاني' : form.governorate ? `${priceEGP(shippingFee)} ج.م` : 'اختاري المحافظة'}
                </span>
              </div>
              {selectedRate && (
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-arabic">
                  <Truck className="w-3.5 h-3.5 text-accent-text" strokeWidth={1.5} aria-hidden="true" />
                  {selectedRate.estimated_days}
                </div>
              )}
            </div>

            {freeShippingThreshold ? (
              <div className="py-4 border-t border-border">
                <FreeShippingProgress subtotal={subtotal - discountAmount} threshold={freeShippingThreshold} />
              </div>
            ) : null}

            <div className="py-4 border-t border-border">
              {discount ? (
                <div className="flex items-center justify-between">
                  <span className="font-arabic text-sm text-success flex items-center gap-2">
                    خصم <span className="font-body tracking-wider" dir="ltr">{discount.code}</span>
                    <button type="button" onClick={() => setDiscount(null)} className="text-[13px] text-muted-foreground underline py-2">
                      إلغاء
                    </button>
                  </span>
                  <span className="font-arabic text-sm text-success tabular-nums">-{priceEGP(discount.amount)} ج.م</span>
                </div>
              ) : !showDiscount ? (
                <button
                  type="button"
                  onClick={() => setShowDiscount(true)}
                  className="font-arabic text-sm text-foreground/80 underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-[text-decoration-color] py-1"
                  aria-expanded={false}
                  aria-controls="discount-code"
                >
                  عندكِ كود خصم؟
                </button>
              ) : (
                <div className="flex gap-2">
                  <label htmlFor="discount-code" className="sr-only">كود الخصم</label>
                  <input
                    id="discount-code"
                    name="discount-code"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    autoFocus
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyDiscount();
                      }
                    }}
                    placeholder="كود الخصم"
                    maxLength={30}
                    className="flex-1 min-w-0 bg-background border border-border px-3 py-3 font-arabic text-base leading-6 focus:border-foreground focus-visible:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={applyingDiscount || !discountInput.trim()}
                    className="font-arabic text-sm border border-foreground px-5 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground flex items-center gap-1.5"
                  >
                    {applyingDiscount && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    تطبيق
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between py-4 border-t border-border">
              <span className="font-arabic text-base font-semibold">الإجمالي</span>
              <span className="font-arabic text-xl font-semibold tabular-nums">{priceEGP(total)} ج.م</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-foreground text-background font-arabic text-[15px] hover:bg-foreground/85 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  جاري التأكيد…
                </>
              ) : (
                'تأكيد الطلب'
              )}
            </button>

            <p className="font-arabic text-[13px] text-foreground/75 text-center mt-3 leading-[1.6]">
              {isCOD
                ? form.allow_inspection
                  ? 'لن تدفعي شيئاً الآن — الدفع عند الاستلام بعد المعاينة'
                  : 'لن تدفعي شيئاً الآن — الدفع عند الاستلام'
                : form.payment_method === 'Vodafone Cash'
                  ? 'بعد التأكيد هيظهرلك رقم فودافون كاش لتحويل المبلغ ورفع الإيصال'
                  : null}
            </p>

            <div className="flex flex-col gap-2.5 mt-5 pt-5 border-t border-border">
              <div className="flex items-center gap-2 text-[13px] font-arabic text-foreground/75">
                <Eye className="w-4 h-4 text-accent-text shrink-0" strokeWidth={1.5} aria-hidden="true" />
                إمكانية المعاينة قبل الدفع
              </div>
              <a
                href={`https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] font-arabic text-foreground/75 hover:text-foreground transition-colors py-1"
              >
                <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                عندك سؤال؟ كلّمينا على واتساب
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
