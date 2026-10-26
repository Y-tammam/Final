import Image from 'next/image';
import { BRAND_CONFIG } from '@/lib/brand';
import { Check } from 'lucide-react';

const FEATURES = [
  "خامات مستوردة من تركيا بشهادات جودة",
  "تصاميم حصرية لا تجدينها في مكان آخر",
  "إمكانية المعاينة قبل الدفع مع مندوب الشحن",
  "شحن سريع لكل محافظات مصر",
];

export function AboutSection() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted order-2 lg:order-1">
          <Image
            src="https://images.pexels.com/photos/8217882/pexels-photo-8217882.jpeg?auto=compress&cs=tinysrgb&w=1000"
            alt="امرأة ترتدي إطلالة أنيقة بخامة تركية فاخرة"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.3] mb-6">
            فخامة تركية بأناقة مصرية
          </h2>
          <p className="font-arabic text-foreground/75 leading-[1.85] text-base mb-10 max-w-[34rem]">
            في {BRAND_CONFIG.nameArabic} نؤمن أن الأناقة الحقيقية تبدأ من الخامة. نختار لكِ بعناية أرقى القطع
            من تركيا — عبايات، فساتين، وإطلالات كاجوال — لنقدم لكِ تجربة تسوق فاخرة تليق بكِ.
            نوصلك طلبك لباب بيتك في أي محافظة بمصر، مع إمكانية المعاينة قبل الدفع لراحتك التامة.
          </p>

          <ul className="border-t border-border">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 py-4 border-b border-border">
                <Check className="w-4 h-4 text-accent-text shrink-0 mt-1" strokeWidth={1.5} aria-hidden="true" />
                <span className="font-arabic text-foreground/85 text-[15px]">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
