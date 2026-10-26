"use client";

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { useWishlist, type SnapshotSource } from '@/lib/wishlist-context';
import { cn } from '@/lib/utils';

// زرار القلب: 'icon' للكروت (فوق الصورة)، و'full' لصفحة المنتج (زرار بعرض كامل بنص).
// في الكروت الزرار بقى جنب الـ <Link> مش جواه، بس بنوقف الـ click برضه احتياطي.
export function WishlistButton({
  product,
  className,
  variant = 'icon',
}: {
  product: SnapshotSource;
  className?: string;
  variant?: 'icon' | 'full';
}) {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(product);
    if (added) {
      toast.success('تمت الإضافة للمفضلة');
      track('AddToWishlist', { content_ids: [product.id], value: product.sale_price_egp ?? product.price_egp });
    }
  };

  const label = saved ? 'إزالة من المفضلة' : 'إضافة للمفضلة';

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={saved}
        className={cn(
          'w-full flex items-center justify-center gap-2 border border-foreground py-3.5 font-arabic text-sm transition-colors duration-300',
          saved ? 'bg-foreground text-primary-foreground' : 'bg-transparent text-foreground hover:bg-foreground hover:text-primary-foreground',
          className
        )}
      >
        <Heart className={cn('w-4 h-4', saved && 'fill-current')} strokeWidth={1.5} />
        {saved ? 'في المفضلة' : 'أضيفي للمفضلة'}
      </button>
    );
  }

  // مساحة اللمس 44px، والدايرة الظاهرة أصغر عشان متغطيش على الصورة
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={cn('w-11 h-11 flex items-center justify-center text-foreground group/wish', className)}
    >
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-background/90 transition-colors duration-300 group-hover/wish:bg-background">
        <Heart
          className={cn('w-4 h-4 transition-[color,fill,transform] duration-300', saved && 'fill-current text-accent scale-110')}
          strokeWidth={1.5}
        />
      </span>
    </button>
  );
}
