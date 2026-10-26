"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { priceEGP } from '@/lib/format';

type SearchResult = {
  id: string;
  slug: string;
  title_ar: string;
  images: string[];
  price_egp: number;
  sale_price_egp: number | null;
};

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

// مهم جداً: الكلمة اللي الزبونة بتكتبها بتتحط جوه فلتر .or() بتاع PostgREST
// كنص خام، فلو فيها فاصلة أو أقواس ممكن "تكسر" الفلتر أو تضيف شروط من عندها.
// عشان كده بنشيل , ( ) " \ * (رموز ليها معنى في صيغة الفلتر)، وبنعمل escape
// لـ % و _ عشان يتدوّر عليهم كحروف عادية مش wildcards.
function sanitizeTerm(term: string): string {
  return term
    .replace(/[,()"\\*]/g, ' ')
    .replace(/[%_]/g, (c) => `\\${c}`)
    .replace(/\s+/g, ' ')
    .trim();
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // رقم آخر طلب: لو رد طلب قديم وصل بعد طلب أحدث بنتجاهله
  const requestId = useRef(0);

  // Esc للإغلاق + قفل سكرول الصفحة اللي ورا + focus على خانة البحث
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  // البحث بعد ما الزبونة تبطل كتابة 250ms (debounce) عشان مانبعتش طلب مع كل حرف
  useEffect(() => {
    const term = sanitizeTerm(query);
    if (term.length < MIN_CHARS) {
      requestId.current++;
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const t = window.setTimeout(async () => {
      const pattern = `%${term}%`;
      const { data, error } = await supabase
        .from('products')
        .select('id, slug, title_ar, images, price_egp, sale_price_egp')
        .eq('status', 'active')
        .or(`title_ar.ilike.${pattern},title_en.ilike.${pattern},description_ar.ilike.${pattern}`)
        .limit(12);
      if (id !== requestId.current) return;
      setResults(error ? [] : ((data ?? []) as SearchResult[]));
      setLoading(false);
      setSearched(true);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  if (!open) return null;

  const showHint = sanitizeTerm(query).length < MIN_CHARS;

  return (
    <div className="fixed inset-0 z-[70] bg-background fade-in overflow-y-auto" role="dialog" aria-modal="true" aria-label="بحث">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <div className="flex items-center justify-end">
          <button onClick={onClose} className="p-2 -ml-2 text-foreground/80 hover:text-foreground transition-colors" aria-label="إغلاق البحث">
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-6 sm:mt-10 flex items-center gap-3 border-b border-foreground pb-3">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحثي عن فستان، عباية، طقم..."
            className="flex-1 bg-transparent outline-none font-arabic text-lg sm:text-2xl placeholder:text-muted-foreground/70"
            aria-label="كلمة البحث"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" strokeWidth={1.5} />}
        </div>

        {showHint && (
          <div className="mt-10 text-center">
            <p className="font-arabic text-sm text-muted-foreground">اكتب اسم المنتج</p>
            <Link
              href="/shop"
              onClick={onClose}
              className="inline-block mt-6 font-arabic text-sm text-foreground border-b border-foreground/30 hover:border-foreground pb-0.5 transition-colors"
            >
              تصفحي المتجر كله
            </Link>
          </div>
        )}

        {!showHint && searched && !loading && results.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-arabic text-base text-foreground">مفيش نتائج لـ &quot;{query.trim()}&quot;</p>
            <p className="font-arabic text-sm text-muted-foreground mt-2">جربي كلمة تانية أو تصفحي المتجر</p>
            <Link
              href="/shop"
              onClick={onClose}
              className="inline-block mt-6 bg-foreground text-primary-foreground font-arabic text-sm px-8 py-3"
            >
              المتجر
            </Link>
          </div>
        )}

        {!showHint && results.length > 0 && (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
            {results.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} onClick={onClose} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {p.images?.[0] && (
                    <Image
                      src={p.images[0]}
                      alt={p.title_ar}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover transition-transform [transition-duration:1200ms] ease-luxury group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <p className="font-arabic text-sm text-foreground mt-3 line-clamp-1">{p.title_ar}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-body text-sm text-foreground num-rtl">
                    {priceEGP(p.sale_price_egp ?? p.price_egp)} ج.م
                  </span>
                  {p.sale_price_egp != null && p.sale_price_egp < p.price_egp && (
                    <span className="font-body text-xs text-muted-foreground line-through num-rtl">
                      {priceEGP(p.price_egp)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
