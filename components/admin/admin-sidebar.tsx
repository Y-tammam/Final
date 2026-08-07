"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { BrandLogo } from '@/components/ui/brand-logo';
import { LayoutDashboard, Package, ShoppingCart, Truck, LogOut, Store, X, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV = [
  { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/categories', label: 'الفئات', icon: Layers },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/admin/shipping', label: 'الشحن', icon: Truck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-border">
        <Link href="/admin/dashboard" className="block" onClick={() => setMobileOpen(false)}>
          <BrandLogo className="h-9 w-auto" textClassName="text-2xl text-foreground" />
          <span className="font-arabic text-[10px] tracking-widest text-accent uppercase">Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-sm font-arabic text-sm transition-all',
                active ? 'bg-foreground text-primary-foreground' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-sm font-arabic text-sm text-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
        >
          <Store className="w-5 h-5" strokeWidth={1.5} />
          عرض المتجر
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-sm font-arabic text-sm text-destructive hover:bg-destructive/5 transition-all"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 w-10 h-10 bg-background rounded-sm shadow-md flex items-center justify-center"
        aria-label="القائمة"
      >
        <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-background border-l border-border flex-col shrink-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 max-w-[80%] bg-background shadow-2xl fade-up">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 left-4 p-1.5" aria-label="إغلاق">
              <X className="w-5 h-5" />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
