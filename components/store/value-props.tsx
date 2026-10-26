import { Sparkles, Eye, Truck } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';

const PROPS = [
  {
    icon: Eye,
    title: "معاينة قبل الدفع",
    desc: "افحصي طلبك مع المندوب قبل ما تدفعي",
  },
  {
    icon: Truck,
    title: "شحن لكل المحافظات",
    desc: `توصيل خلال ${BRAND_CONFIG.shipping.defaultDeliveryDays}`,
  },
  {
    icon: Sparkles,
    title: "خامات تركية",
    desc: "أقمشة مستوردة مختارة بعناية",
  },
];

// شريط هادي واحد بخطوط رفيعة - مش "كروت" - بيفكّر بالضمانات بين قسمين منتجات
export function ValueProps() {
  return (
    <section aria-label={`لماذا ${BRAND_CONFIG.nameArabic}`} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-3 border-y border-border divide-x divide-x-reverse divide-border">
        {PROPS.map((prop) => (
          <li key={prop.title} className="flex flex-col items-center text-center gap-2 py-6 sm:py-8 px-2">
            <prop.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.25} aria-hidden="true" />
            <h3 className="font-arabic text-[13px] sm:text-sm font-medium text-foreground leading-[1.5]">{prop.title}</h3>
            <p className="hidden sm:block font-arabic text-sm text-muted-foreground leading-[1.6]">{prop.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
