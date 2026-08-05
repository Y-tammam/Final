"use client";

import Link from 'next/link';
import { Instagram, Mail, Phone, MessageCircle } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';
import { BrandLogo } from '@/components/ui/brand-logo';

export function SiteFooter() {
  const waLink = `https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}`;

  return (
    <footer id="contact" className="bg-foreground text-background mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="mb-3">
              <BrandLogo className="h-10 w-auto" textClassName="text-3xl text-primary-foreground" />
            </div>
            <p className="font-arabic text-background/70 text-sm leading-relaxed max-w-xs">
              {BRAND_CONFIG.tagline}
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all duration-300" aria-label="واتساب">
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              </a>
              <a href={`https://instagram.com/${BRAND_CONFIG.contact.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all duration-300" aria-label="انستجرام">
                <Instagram className="w-4 h-4" strokeWidth={1.5} />
              </a>
              <a href={`mailto:${BRAND_CONFIG.contact.supportEmail}`} className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all duration-300" aria-label="بريد">
                <Mail className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-arabic text-sm font-bold tracking-wider text-accent mb-5 uppercase">روابط سريعة</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="font-arabic text-background/70 hover:text-background transition-colors text-sm">الرئيسية</Link></li>
              <li><Link href="/shop" className="font-arabic text-background/70 hover:text-background transition-colors text-sm">المتجر</Link></li>
              <li><Link href="/#about" className="font-arabic text-background/70 hover:text-background transition-colors text-sm">من نحن</Link></li>
              <li><Link href="/checkout" className="font-arabic text-background/70 hover:text-background transition-colors text-sm">إتمام الطلب</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-arabic text-sm font-bold tracking-wider text-accent mb-5 uppercase">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                <a href={`tel:${BRAND_CONFIG.contact.whatsapp}`} className="font-arabic text-background/70 hover:text-background transition-colors text-sm" dir="ltr">
                  {BRAND_CONFIG.contact.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                <a href={`mailto:${BRAND_CONFIG.contact.supportEmail}`} className="font-arabic text-background/70 hover:text-background transition-colors text-sm" dir="ltr">
                  {BRAND_CONFIG.contact.supportEmail}
                </a>
              </li>
              <li className="font-arabic text-background/70 text-sm leading-relaxed">
                الشحن لكل محافظات مصر • {BRAND_CONFIG.shipping.defaultDeliveryDays}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-arabic text-background/50 text-xs">
            © {new Date().getFullYear()} {BRAND_CONFIG.nameArabic}. جميع الحقوق محفوظة.
          </p>
          <p className="font-arabic text-background/50 text-xs">
            صنع بحب في مصر • خامات تركية فاخرة
          </p>
        </div>
      </div>
    </footer>
  );
}
