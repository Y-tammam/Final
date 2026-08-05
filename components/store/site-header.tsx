"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, User, LogOut } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/ui/auth-modal';
import { BrandLogo } from '@/components/ui/brand-logo';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/shop', label: 'المتجر' },
  { href: '/#about', label: 'من نحن' },
  { href: '/#contact', label: 'تواصل معنا' },
];

export function SiteHeader() {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-foreground text-primary-foreground text-center text-xs sm:text-sm py-2 px-4 font-arabic">
        <span className="tracking-wide">شحن سريع لكل المحافظات • معاينة قبل الدفع • خامات تركية 100%</span>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500 ease-luxury',
          scrolled ? 'glass shadow-[0_8px_30px_rgb(0,0,0,0.06)]' : 'bg-background'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 -mr-2 text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="القائمة"
            >
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            </button>

            {/* Logo */}
<Link href="/" className="flex flex-col items-center lg:items-start lg:flex-row lg:gap-4 group">
  {/* كبّرنا الـ height هنا لـ h-14 على الموبايل و h-20 على الشاشات الكبيرة */}
  <BrandLogo 
    className="h-14 lg:h-20 w-auto transition-transform duration-300 group-hover:scale-105" 
    textClassName="text-3xl lg:text-4xl tracking-tight text-foreground leading-none" 
  />
  
  <span className="hidden lg:block text-[11px] tracking-[0.35em] uppercase text-accent font-body mt-2">
    Turkish Luxury
  </span>
</Link>


            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative font-arabic text-sm text-foreground/80 hover:text-foreground transition-colors duration-300 group py-2"
                >
                  {link.label}
                  <span className="absolute bottom-0 right-0 left-0 h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-luxury origin-right" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="p-2.5 text-foreground/80 hover:text-foreground transition-colors hidden sm:block"
                aria-label="بحث"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {/* 👤 زرار الحساب وتسجيل الدخول */}
              {user ? (
                <div className="flex items-center gap-1">
                  <Link
                    href="/account"
                    className="p-2.5 text-foreground/80 hover:text-accent transition-colors"
                    title="حسابي"
                    aria-label="حسابي"
                  >
                    <User className="w-5 h-5" strokeWidth={1.5} />
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="p-2.5 text-foreground/80 hover:text-destructive transition-colors"
                    title="تسجيل الخروج"
                    aria-label="تسجيل الخروج"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="p-2.5 text-foreground/80 hover:text-accent transition-colors"
                  aria-label="تسجيل الدخول"
                  title="تسجيل الدخول"
                >
                  <User className="w-5 h-5" strokeWidth={1.5} />
                </button>
              )}

              {/* 🛒 السلة */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2.5 text-foreground hover:text-accent transition-colors duration-300"
                aria-label="سلة التسوق"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center scale-in">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 max-w-[80%] bg-background shadow-2xl p-6 fade-up">
            <div className="flex items-center justify-between mb-8">
              <BrandLogo className="h-8 w-auto" textClassName="text-2xl" />
              <button onClick={() => setMobileOpen(false)} aria-label="إغلاق">
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-arabic text-lg text-foreground/80 hover:text-accent transition-colors py-3 border-b border-border"
                >
                  {link.label}
                </Link>
              ))}

              {/* إضافة خيار تسجيل الدخول أو حسابي في القائمة الموبيل برضه */}
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="font-arabic text-lg text-foreground/80 hover:text-accent transition-colors py-3 border-b border-border flex items-center justify-between"
                  >
                    <span>حسابي وطلباتي</span>
                    <User className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="font-arabic text-lg text-destructive transition-colors py-3 text-right flex items-center justify-between"
                  >
                    <span>تسجيل الخروج</span>
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthOpen(true);
                  }}
                  className="font-arabic text-lg text-accent transition-colors py-3 text-right flex items-center justify-between border-b border-border"
                >
                  <span>تسجيل الدخول / حساب جديد</span>
                  <User className="w-5 h-5" />
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Auth Modal Component */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
