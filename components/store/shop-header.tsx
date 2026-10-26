export function ShopHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-secondary/40 py-10 lg:py-16 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-medium leading-[1.3]">{title}</h1>
        <p className="font-arabic text-muted-foreground mt-3 max-w-md mx-auto">{subtitle}</p>
      </div>
    </div>
  );
}
