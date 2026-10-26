import { Truck } from 'lucide-react';
import { priceEGP } from '@/lib/format';

// شريط "فاضل X ج.م على الشحن المجاني" - بيشجع العميلة تزوّد قيمة الطلب.
export function FreeShippingProgress({ subtotal, threshold }: { subtotal: number; threshold: number | null }) {
  if (!threshold) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs text-foreground/80 flex items-center gap-2">
        <Truck className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
        {remaining > 0 ? (
          <span>
            فاضل <span className="font-body font-semibold num-rtl">{priceEGP(remaining)}</span> ج.م وتاخدي شحن مجاني
          </span>
        ) : (
          <span>مبروك! طلبك عليه شحن مجاني</span>
        )}
      </p>
      <div className="h-[3px] bg-border rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all duration-700 ease-luxury" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
