"use client";

import Link from 'next/link';
import { Instagram, Mail, Phone, MessageCircle } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';
import { BrandLogo } from '@/components/ui/brand-logo';

const LINK = 'font-arabic text-background/65 hover:text-background transition-colors text-sm leading-[1.6] inline-block py-1';
const HEADING = 'font-arabic text-sm font-semibold text-background mb-4';
const SOCIAL =
  'w-11 h-11 rounded-full border border-background/20 flex items-center justify-center text-background/80 hover:bg-background hover:text-foreground hover:border-background transition-colors duration-300';

export function SiteFooter() {
  const waLink = `https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}`;

  return (
    <footer id="contact" className="bg-foreground text-background mt-16 lg:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <BrandLogo className="h-14 w-auto invert mix-blend-screen" textClassName="text-3xl text-background" />
            </div>
            <p className="font-arabic text-background/65 text-sm leading-[1.75] max-w-xs">{BRAND_CONFIG.tagline}</p>
            <div className="flex items-center gap-2 mt-6">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={SOCIAL} aria-label="واتساب">
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              </a>
              <a
                href={`https://instagram.com/${BRAND_CONFIG.contact.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={SOCIAL}
                aria-label="انستجرام"
              >
                <Instagram className="w-4 h-4" strokeWidth={1.5} />
              </a>
              <a href={`mailto:${BRAND_CONFIG.contact.supportEmail}`} className={SOCIAL} aria-label="البريد الإلكتروني">
                <Mail className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className={HEADING}>روابط سريعة</h2>
            <ul className="space-y-1.5">
              <li><Link href="/" className={LINK}>الرئيسية</Link></li>
              <li><Link href="/shop" className={LINK}>المتجر</Link></li>
              <li><Link href="/#about" className={LINK}>من نحن</Link></li>
              <li><Link href="/wishlist" className={LINK}>المفضلة</Link></li>
            </ul>
          </nav>

          {/* Policies */}
          <nav aria-labelledby="footer-policies">
            <h2 id="footer-policies" className={HEADING}>السياسات</h2>
            <ul className="space-y-1.5">
              <li><Link href="/policies/shipping" className={LINK}>الشحن والتوصيل</Link></li>
              <li><Link href="/policies/exchange" className={LINK}>الاستبدال والاسترجاع</Link></li>
              <li><Link href="/policies/privacy" className={LINK}>سياسة الخصوصية</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h2 className={HEADING}>تواصل معنا</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-background/50 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <a href={`tel:${BRAND_CONFIG.contact.whatsapp}`} className={LINK} dir="ltr">
                  {BRAND_CONFIG.contact.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-background/50 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <a href={`mailto:${BRAND_CONFIG.contact.supportEmail}`} className={`${LINK} break-all`} dir="ltr">
                  {BRAND_CONFIG.contact.supportEmail}
                </a>
              </li>
              <li className="font-arabic text-background/65 text-sm leading-[1.75] pt-1">
                الشحن لكل محافظات مصر خلال {BRAND_CONFIG.shipping.defaultDeliveryDays}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/15 mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-arabic text-background/65 text-[13px]">
            © {new Date().getFullYear()} {BRAND_CONFIG.nameArabic}. جميع الحقوق محفوظة.
          </p>
          <p className="font-arabic text-background/65 text-[13px]">صُنع في مصر • خامات تركية</p>
        </div>
      </div>
    </footer>
  );
}
