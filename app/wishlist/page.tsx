import type { Metadata } from 'next';
import { StorefrontLayout } from '@/components/store/storefront-layout';
import { WishlistContent } from '@/components/store/wishlist-content';

// الصفحة نفسها server component عشان نقدر نصدّر metadata، والمحتوى client
// لأنه بيقرا من localStorage
export const metadata: Metadata = { title: 'المفضلة' };

export default function WishlistPage() {
  return (
    <StorefrontLayout>
      <div className="bg-secondary/40 py-10 lg:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-medium leading-[1.3]">المفضلة</h1>
        </div>
      </div>
      <WishlistContent />
    </StorefrontLayout>
  );
}
