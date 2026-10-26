"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, LogOut, Heart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/lib/wishlist-context';
import dynamic from 'next/dynamic';

// البحث ونافذة الدخول بيتحملوا لما العميلة تفتحهم بس (فيهم Supabase) -
// مش مع كل صفحة.
const SearchOverlay = dynamic(() => import('@/components/store/search-overlay').then((m) => m.SearchOverlay), { ssr: false });
const AuthModal = dynamic(() => import('@/components/ui/auth-modal').then((m) => m.AuthModal), { ssr: false });
import { BrandLogo } from '@/components/ui/brand-logo';
import { BRAND_CONFIG } from '@/lib/brand';
import { cn } from '@/lib/utils';

// كل أزرار الأيقونات 44px على الأقل (مساحة لمس مريحة على الموبايل)
const ICON_BTN =
  'w-11 h-11 inline-flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors duration-300';
const BADGE =
  'absolute top-1 left-1 bg-foreground text-background font-arabic text-[10px] leading-none min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center tabular-nums';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/shop', label: 'المتجر' },
  { href: '/#about', label: 'من نحن' },
  { href: '/#contact', label: 'تواصل معنا' },
];

export type Announcement = { text: string; link: string | null } | null;

// announcement: عرض بيتكتب من لوحة التحكم (الإعدادات > شريط الإعلانات).
// لو مفيش عرض، بيظهر النص الافتراضي.
export function SiteHeader({ announcement = null }: { announcement?: Announcement }) {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count: wishlistCount } = useWishlist();
  // useCallback عشان الـ effect بتاع الـ overlay (Esc وقفل السكرول) مايتعادش مع كل render
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // القائمة الجانبية على الموبايل: Esc بيقفلها، السكرول ورا بيتقفل، والـ focus
  // بيروح لزرار الإغلاق عشان مستخدمي الكيبورد وقارئ الشاشة
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', onKey);
    mobileCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <>
      {/* شريط الإعلان: رسالة واحدة واضحة - من غير tracking عشان الحروف العربية تفضل متوصلة */}
      <div className="bg-foreground text-background text-center text-[13px] leading-6 py-2 px-4 font-arabic">
        {announcement?.link ? (
          <Link href={announcement.link} className="underline-offset-4 hover:underline">
            {announcement.text}
          </Link>
        ) : (
          announcement?.text ?? 'معاينة قبل الدفع • شحن لكل المحافظات • الدفع عند الاستلام'
        )}
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-500 ease-luxury',
          scrolled ? 'glass border-border/70' : 'bg-background border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              'flex items-center justify-between transition-[height] duration-500 ease-luxury',
              scrolled ? 'h-14 lg:h-16' : 'h-16 lg:h-20'
            )}
          >
            {/* Mobile menu button */}
            <button
              type="button"
              className={cn(ICON_BTN, 'lg:hidden -mr-2.5')}
              onClick={() => setMobileOpen(true)}
              aria-label="القائمة"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center" aria-label={`${BRAND_CONFIG.nameArabic} - الرئيسية`}>
              <BrandLogo
                className={cn(
                  'w-auto mix-blend-multiply transition-[height] duration-500 ease-luxury',
                  scrolled ? 'h-10 lg:h-14' : 'h-14 lg:h-20'
                )}
                textClassName="text-3xl lg:text-4xl text-foreground leading-none"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-10" aria-label="القائمة الرئيسية">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative font-arabic text-[15px] text-foreground/80 hover:text-foreground transition-colors duration-300 group py-2"
                >
                  {link.label}
                  <span className="absolute bottom-0 right-0 left-0 h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-luxury origin-right" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center -ml-2.5">
              <button type="button" onClick={() => setSearchOpen(true)} className={ICON_BTN} aria-label="بحث">
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {user ? (
                <>
                  <Link href="/account" className={ICON_BTN} title="حسابي" aria-label="حسابي">
                    <User className="w-5 h-5" strokeWidth={1.5} />
                  </Link>
                  {/* على الموبايل مخفي عشان الهيدر مايزحمش - تسجيل الخروج موجود في القائمة الجانبية */}
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className={cn(ICON_BTN, 'hidden sm:inline-flex')}
                    title="تسجيل الخروج"
                    aria-label="تسجيل الخروج"
                  >
                    <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className={ICON_BTN}
                  aria-label="تسجيل الدخول"
                  title="تسجيل الدخول"
                >
                  <User className="w-5 h-5" strokeWidth={1.5} />
                </button>
              )}

              <Link
                href="/wishlist"
                className={cn(ICON_BTN, 'relative')}
                aria-label={wishlistCount > 0 ? `المفضلة (${wishlistCount})` : 'المفضلة'}
                title="المفضلة"
              >
                <Heart className="w-5 h-5" strokeWidth={1.5} />
                {wishlistCount > 0 && <span className={BADGE}>{wishlistCount}</span>}
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={cn(ICON_BTN, 'relative text-foreground')}
                aria-label={totalItems > 0 ? `سلة التسوق (${totalItems})` : 'سلة التسوق'}
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {totalItems > 0 && <span className={BADGE}>{totalItems}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 fade-in" onClick={closeMobile} aria-hidden="true" />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="القائمة"
            className="absolute top-0 right-0 bottom-0 w-80 max-w-[85%] bg-background flex flex-col overflow-y-auto overscroll-contain fade-in"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-border">
              <BrandLogo className="h-10 w-auto mix-blend-multiply" textClassName="text-2xl" />
              <button ref={mobileCloseRef} type="button" onClick={closeMobile} aria-label="إغلاق القائمة" className={cn(ICON_BTN, '-ml-2.5')}>
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex flex-col px-6 pt-4" aria-label="القائمة الرئيسية">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className="font-arabic text-lg text-foreground py-4 border-b border-border"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/wishlist" onClick={closeMobile} className="font-arabic text-lg text-foreground py-4 border-b border-border">
                المفضلة
              </Link>

              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={closeMobile}
                    className="font-arabic text-lg text-foreground py-4 border-b border-border flex items-center justify-between"
                  >
                    <span>حسابي وطلباتي</span>
                    <User className="w-5 h-5" strokeWidth={1.5} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      signOut();
                    }}
                    className="font-arabic text-base text-muted-foreground py-4 text-right flex items-center justify-between"
                  >
                    <span>تسجيل الخروج</span>
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    setAuthOpen(true);
                  }}
                  className="font-arabic text-lg text-foreground py-4 text-right flex items-center justify-between border-b border-border"
                >
                  <span>تسجيل الدخول / حساب جديد</span>
                  <User className="w-5 h-5" strokeWidth={1.5} />
                </button>
              )}
            </nav>
            <p className="mt-auto px-6 py-6 font-arabic text-sm text-muted-foreground">
              معاينة قبل الدفع • الدفع عند الاستلام
            </p>
          </div>
        </div>
      )}

      {/* شاشة البحث الكاملة */}
      {searchOpen && <SearchOverlay open={searchOpen} onClose={closeSearch} />}

      {/* Auth Modal Component */}
      {authOpen && <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
