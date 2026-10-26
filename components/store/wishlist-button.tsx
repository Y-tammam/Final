"use client";

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { useWishlist, type SnapshotSource } from '@/lib/wishlist-context';
import { cn } from '@/lib/utils';

// زرار القلب: 'icon' للكروت (فوق الصورة)، و'full' لصفحة المنتج (زرار بعرض كامل بنص).
// الزرار ده بيتحط جوه <Link> في الكروت، فلازم نوقف الـ click عشان مايفتحش صفحة المنتج.
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

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:text-accent transition-colors duration-300',
        className
      )}
    >
      <Heart className={cn('w-4 h-4 transition-transform duration-300', saved && 'fill-current text-accent scale-110')} strokeWidth={1.5} />
    </button>
  );
}
