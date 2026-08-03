import { Sparkles, Eye, Truck } from 'lucide-react';

const PROPS = [
  {
    icon: Sparkles,
    title: "خامات تركية 100%",
    desc: "أقمشة فاخرة مستوردة من تركيا",
  },
  {
    icon: Eye,
    title: "معاينة قبل الدفع",
    desc: "افحصي طلبك قبل الاستلام",
  },
  {
    icon: Truck,
    title: "شحن سريع لكل المحافظات",
    desc: "توصيل خلال 2-4 أيام عمل",
  },
];

export function ValueProps() {
  return (
    <section className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {PROPS.map((prop) => (
            <div key={prop.title} className="flex items-center gap-4 justify-center sm:justify-start fade-up">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <prop.icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-arabic text-sm font-semibold text-foreground">{prop.title}</h3>
                <p className="font-arabic text-xs text-muted-foreground mt-0.5">{prop.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
