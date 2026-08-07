"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { User, Package, LogOut, Loader2, Calendar, ChevronDown, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';
import { priceEGP } from '@/lib/format';
import { ORDER_STATUS, EGYPT_GOVERNORATES } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// بنولّد رقم مرجعي غير متسلسل لعرضه على العميل بدل order_number التسلسلي.
// السبب: order_number رقم متتابع (1، 2، 3...) وبيكشف حجم مبيعات المتجر
// لأي حد يشوفه، وممكن يتخمن أرقام طلبات تانية. الرقم ده مبني من الـ id
// (UUID) بتاع الطلب نفسه فمينفعش حد يخمنه، ومحتاج مايكونش لازم نغيّر
// أي حاجة في قاعدة البيانات - order_number لسه موجود وبيستخدمه الأدمن
// داخليًا للتتبع.
function displayOrderRef(orderId: string) {
  return orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export default function AccountPage() {
  const { user, loading: authLoading, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // تعديل معلومات الحساب - الاسم ورقم الموبايل وعنوان الشحن الافتراضي
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [cityAddress, setCityAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name ?? '');
      setPhone(user.user_metadata?.phone ?? '');
      setWhatsappPhone(user.user_metadata?.whatsapp_phone ?? '');
      setGovernorate(user.user_metadata?.governorate ?? '');
      setCityAddress(user.user_metadata?.city_address ?? '');
    }
  }, [user]);

  useEffect(() => {
    async function fetchUserOrders() {
      if (!user) return;
      // جلب الطلبات مع تفاصيلها (المنتجات والمقاسات والألوان) - مفلترة
      // تلقائيًا على طلبات هذا المستخدم بس عن طريق .eq('user_id', ...)،
      // ومحمية كمان على مستوى قاعدة البيانات بسياسة RLS
      // "customer_read_own_orders" فحتى لو حصل خطأ في الكود الأمامي،
      // السيرفر مش هيرجّع غير طلبات صاحب الحساب المسجل دخوله.
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items:order_items(*, product:products(title_ar, images), variant:product_variants(size, color_ar))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else if (data) {
        setOrders(data);
      }
      setLoadingOrders(false);
    }

    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      whatsapp_phone: whatsappPhone.trim(),
      governorate,
      city_address: cityAddress.trim(),
    });
    setSavingProfile(false);
    if (error) {
      toast.error('تعذر حفظ التعديلات');
      return;
    }
    toast.success('تم تحديث بياناتك بنجاح');
    setEditingProfile(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 font-arabic">
      <div className="bg-card border border-border p-6 sm:p-8 rounded-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">{user.user_metadata?.full_name || 'حسابي'}</h1>
              <p className="text-sm text-muted-foreground dir-ltr text-right">{user.email}</p>
              {user.user_metadata?.phone && (
                <p className="text-sm text-muted-foreground dir-ltr text-right">{user.user_metadata.phone}</p>
              )}
              {user.user_metadata?.governorate && (
                <p className="text-sm text-muted-foreground text-right">
                  {user.user_metadata.governorate}
                  {user.user_metadata?.city_address ? ` — ${user.user_metadata.city_address}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-sm text-sm hover:bg-secondary transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                تعديل البيانات
              </button>
            )}
            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-sm text-sm hover:bg-destructive hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* تعديل الاسم، الموبايل، الواتساب، وعنوان الشحن الافتراضي - مش
            الإيميل ولا الباسورد. العنوان ده هو اللي بيتملى تلقائي في فورم
            الشيك أوت في كل مرة، فمش محتاجة تكتبيه من الأول كل مرة تطلبي. */}
        {editingProfile && (
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-foreground/80 block mb-1.5">الاسم بالكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-foreground/80 block mb-1.5">رقم الموبايل</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-foreground/80 block mb-1.5">واتساب (اختياري)</label>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                dir="ltr"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-foreground/80 block mb-1.5">المحافظة</label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">اختاري المحافظة</option>
                {EGYPT_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-foreground/80 block mb-1.5">العنوان بالتفصيل</label>
              <textarea
                value={cityAddress}
                onChange={(e) => setCityAddress(e.target.value)}
                rows={2}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="المدينة، الشارع، رقم العمارة، الشقة..."
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 bg-foreground text-primary-foreground px-5 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-60"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                حفظ
              </button>
              <button
                onClick={() => {
                  setEditingProfile(false);
                  setFullName(user.user_metadata?.full_name ?? '');
                  setPhone(user.user_metadata?.phone ?? '');
                  setWhatsappPhone(user.user_metadata?.whatsapp_phone ?? '');
                  setGovernorate(user.user_metadata?.governorate ?? '');
                  setCityAddress(user.user_metadata?.city_address ?? '');
                }}
                className="inline-flex items-center gap-2 border border-border px-5 py-2 rounded-sm text-sm hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>


      <div>
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          طلباتي السابقة
        </h2>

        {loadingOrders ? (
          <div className="text-center py-12 border border-dashed border-border rounded-sm">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent mb-2" />
            <p className="text-xs text-muted-foreground">جاري تحميل طلباتك...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-sm bg-card/50">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="font-semibold text-lg mb-1">لا توجد طلبات سابقة حتى الآن</h3>
            <p className="text-xs text-muted-foreground mb-6">استكشفي أحدث مجموعاتنا وتسوقي الآن</p>
            <Link
              href="/shop"
              className="inline-block bg-foreground text-primary-foreground text-sm px-6 py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all"
            >
              تصفحي المتجر
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.order_status as keyof typeof ORDER_STATUS];
              const isOpen = expandedOrder === order.id;
              return (
                <div key={order.id} className="border border-border bg-card p-5 rounded-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-3 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="font-bold num-rtl" dir="ltr">#{displayOrderRef(order.id)}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG') : '—'}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full font-medium',
                        status?.color === 'success' && 'bg-success/15 text-success',
                        status?.color === 'warning' && 'bg-warning/15 text-warning',
                        status?.color === 'blue' && 'bg-blue-100 text-blue-700',
                        status?.color === 'destructive' && 'bg-destructive/15 text-destructive'
                      )}
                    >
                      {status?.label ?? order.order_status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">إجمالي المبلغ:</span>
                    <span className="font-bold text-accent num-rtl">{priceEGP(order.total_amount_egp ?? 0)} ج.م</span>
                  </div>

                  <button
                    onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-accent hover:underline py-1.5"
                  >
                    {isOpen ? 'إخفاء تفاصيل الطلب' : 'عرض تفاصيل الطلب'}
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {(order.order_items ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">لا توجد عناصر لهذا الطلب</p>
                      ) : (
                        order.order_items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            <div className="relative w-12 h-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                              {item.product?.images?.[0] && (
                                <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{item.product?.title_ar ?? 'منتج غير متاح'}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.variant?.size ? `مقاس ${item.variant.size}` : ''}
                                {item.variant?.color_ar ? ` • ${item.variant.color_ar}` : ''}
                                {' • '}الكمية: {item.quantity}
                              </p>
                            </div>
                            <span className="font-medium num-rtl shrink-0">{priceEGP(item.unit_price_egp)} ج.م</span>
                          </div>
                        ))
                      )}
                      <div className="pt-2 border-t border-border/60 space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between"><span>عنوان التوصيل:</span><span className="text-foreground">{order.governorate} - {order.city_address}</span></div>
                        <div className="flex justify-between"><span>رسوم الشحن:</span><span className="text-foreground num-rtl">{priceEGP(order.shipping_fee_egp ?? 0)} ج.م</span></div>
                        <div className="flex justify-between"><span>طريقة الدفع:</span><span className="text-foreground">{order.payment_method}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
