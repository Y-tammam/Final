import type { Metadata } from 'next';

// صفحة الحساب client component، فالـ metadata هنا (مش للأرشفة في جوجل)
export const metadata: Metadata = { title: 'حسابي', robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
