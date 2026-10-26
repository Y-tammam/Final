import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/lib/types';

const CATEGORY_IMAGES: Record<string, string> = {
  abayas: "https://images.pexels.com/photos/13838842/pexels-photo-13838842.jpeg?auto=compress&cs=tinysrgb&w=900",
  dresses: "https://images.pexels.com/photos/37607882/pexels-photo-37607882.jpeg?auto=compress&cs=tinysrgb&w=900",
  casual: "https://images.pexels.com/photos/18885255/pexels-photo-18885255.jpeg?auto=compress&cs=tinysrgb&w=900",
};

// على الموبايل: شريط أفقي بيتسحب (snap) - كل فئة ٨٠٪ من العرض عشان يبان إن فيه
// اللي بعدها. على الديسكتوب: ٣ أعمدة. counts لسه بتيجي في الـ props بس مش
// بنعرضها - "٣ منتج" بتقلل من إحساس الفخامة.
export function CategoryShowcase({ categories }: { categories: Category[]; counts: Record<string, number> }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-16 lg:py-28" aria-labelledby="categories-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="categories-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.3] mb-10 lg:mb-14">
          تسوقي حسب الفئة
        </h2>

        <ul className="-mx-4 px-4 sm:mx-0 sm:px-0 flex md:grid md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-px-4 overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const img = cat.image_url || CATEGORY_IMAGES[cat.slug];
            return (
              <li key={cat.id} className="shrink-0 w-[80%] sm:w-[45%] md:w-auto snap-start">
                <Link
                  href={`/shop/${encodeURIComponent(cat.slug)}`}
                  className="group relative block aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-foreground"
                >
                  {img && (
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 80vw, 33vw"
                      className="object-cover transition-transform duration-1000 ease-luxury motion-safe:group-hover:scale-[1.03]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                    <h3 className="font-display text-2xl sm:text-3xl font-medium leading-[1.3] text-primary-foreground">
                      {cat.name_ar}
                    </h3>
                    <span className="mt-2 inline-block font-arabic text-sm text-primary-foreground/85 border-b border-primary-foreground/40 pb-0.5 group-hover:border-primary-foreground transition-colors duration-300">
                      اكتشفي التشكيلة
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
