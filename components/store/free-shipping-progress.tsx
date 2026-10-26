import { Truck } from 'lucide-react';
import { priceEGP } from '@/lib/format';

// شريط "فاضل X ج.م على الشحن المجاني" - بيشجع العميلة تزوّد قيمة الطلب.
export function FreeShippingProgress({ subtotal, threshold }: { subtotal: number; threshold: number | null }) {
  if (!threshold) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="space-y-2">
      <p className="font-arabic text-[13px] leading-[1.6] text-foreground/80 flex items-center gap-2">
        <Truck className="w-4 h-4 text-accent-text shrink-0" strokeWidth={1.5} aria-hidden="true" />
        {remaining > 0 ? (
          <span>
            فاضل <span className="font-semibold tabular-nums">{priceEGP(remaining)}</span> ج.م وتاخدي شحن مجاني
          </span>
        ) : (
          <span>مبروك! طلبك عليه شحن مجاني</span>
        )}
      </p>
      <div className="h-[2px] bg-border overflow-hidden" role="progressbar" aria-label="التقدم نحو الشحن المجاني" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
        <div className="h-full bg-accent transition-[width] duration-700 ease-luxury" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
