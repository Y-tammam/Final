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
    <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm order-2 lg:order-1">
          <Image
            src="https://images.pexels.com/photos/8217882/pexels-photo-8217882.jpeg?auto=compress&cs=tinysrgb&w=1000"
            alt="luxury fashion"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="order-1 lg:order-2">
          <span className="font-body text-xs tracking-[0.3em] uppercase text-accent">Our Story</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold mt-2 mb-6">
            فخامة تركية بأناقة مصرية
          </h2>
          <p className="font-arabic text-muted-foreground leading-relaxed text-base mb-8">
            في {BRAND_CONFIG.nameArabic} نؤمن أن الأناقة الحقيقية تبدأ من الخامة. نختار لكِ بعناية أرقى القطع
            من تركيا — عبايات، فساتين، وإطلالات كاجوال — لنقدم لكِ تجربة تسوق فاخرة تليق بكِ.
            نوصلك طلبك لباب بيتك في أي محافظة بمصر، مع إمكانية المعاينة قبل الدفع لراحتك التامة.
          </p>

          <ul className="space-y-4 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                </span>
                <span className="font-arabic text-foreground/80 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
