import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StorefrontLayout } from '@/components/store/storefront-layout';
import { getStorePage } from '@/lib/data';
import { BRAND_CONFIG } from '@/lib/brand';

// صفحات السياسات (الشحن / الاستبدال / الخصوصية) - المحتوى بيتكتب من لوحة
// التحكم (الإعدادات والسياسات). ميتا وجوجل ميرشانت بيطلبوها للموافقة على
// الإعلانات.
export const revalidate = 300;

const SLUGS = ['shipping', 'exchange', 'privacy'] as const;

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStorePage(slug);
  if (!page) return {};
  return { title: page.title_ar, alternates: { canonical: `/policies/${slug}` } };
}

export default async function PolicyPage({ params }: PageProps) {
  const { slug } = await params;
  if (!(SLUGS as readonly string[]).includes(slug)) notFound();
  const page = await getStorePage(slug);
  if (!page) notFound();

  const waLink = `https://wa.me/${BRAND_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}`;
  const paragraphs = page.body_ar.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <StorefrontLayout>
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <h1 className="font-display text-3xl sm:text-4xl font-medium leading-[1.3] mb-10">{page.title_ar}</h1>
        {paragraphs.length > 0 ? (
          <div className="font-arabic text-base leading-[1.9] text-foreground/85 space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        ) : (
          <p className="font-arabic text-base leading-[1.9] text-foreground/85">
            لمعرفة التفاصيل تواصلي معنا على{' '}
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">واتساب</a>.
          </p>
        )}
      </article>
    </StorefrontLayout>
  );
}
