import Image from "next/image";
import Link from "next/link";
import type { ProductLite } from "@/lib/content";
import { PriceTag } from "./PriceTag";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product, categoryName, priority = false }: { product: ProductLite; categoryName?: string; priority?: boolean }) {
  const img = product.image;
  const [title, subtitle] = splitName(product.name);
  return (
    <article className="group card relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-steel-100">
        {img && (
          <Image
            src={img.src}
            alt={img.alt || title}
            fill
            sizes="(min-width:1280px) 300px, (min-width:768px) 33vw, (min-width:480px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        )}
        <div className="absolute top-2.5 right-2.5 z-10">
          <WishlistButton product={product} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        {categoryName && <p className="mb-1 text-xs font-semibold tracking-wider text-brand-700 uppercase">{categoryName}</p>}
        <h3 className="font-display text-lg leading-snug font-semibold text-steel-900">
          <Link href={`/product/${product.slug}/`} className="after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>
        {subtitle && <p className="mt-1 line-clamp-2 text-sm text-steel-500">{subtitle}</p>}
        <div className="mt-auto pt-3">
          <PriceTag price={product.price} currency={product.currency} unit={product.unit} />
        </div>
      </div>
    </article>
  );
}

/** "Copper Cathode – High-Purity …" -> ["Copper Cathode", "High-Purity …"] */
export function splitName(name: string): [string, string | undefined] {
  const m = name.match(/^(.{3,70}?)\s+[–—|:-]\s+(.+)$/);
  return m ? [m[1], m[2]] : [name, undefined];
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
