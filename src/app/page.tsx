import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, Handshake, Leaf, ShieldCheck, type LucideIcon } from "lucide-react";
import home from "../../data/home.json";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductCard, ProductGrid } from "@/components/product/ProductCard";
import { getCategories, getPosts, lite, productsInCategory } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/format";

export const metadata = buildMetadata({
  title: "Scrap Metal, Plastic Scrap, Electronic Scrap & Recyclable Materials Supplier | Scrap Bays Limited",
  absoluteTitle: true,
  description:
    "Scrap Bays Limited supplies ferrous & non-ferrous scrap metal, minerals and ingots, electronic scrap, plastic scrap, motor parts scrap and timber logs to buyers worldwide. Request a quote today.",
  path: "/",
});

/** Use the commissioned banner when its file exists in public/, otherwise the fallback photo. */
const heroSlides = home.hero.slides.map(({ src, fallback, ...rest }) => ({
  ...rest,
  src: fs.existsSync(path.join(process.cwd(), "public", src)) ? src : fallback,
}));

const ICONS: Record<string, LucideIcon> = { shield: ShieldCheck, globe: Globe2, handshake: Handshake, leaf: Leaf };

export default function HomePage() {
  const categories = getCategories();
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const posts = getPosts().slice(0, 3);

  return (
    <>
      <HeroSlider title={home.hero.title} text={home.hero.text} primary={home.hero.primary} secondary={home.hero.secondary} slides={heroSlides} />

      {/* Categories */}
      <section className="container-x py-16 md:py-20">
        <div className="mb-8 flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <p className="eyebrow">Categories</p>
            <h2 className="mt-1 text-3xl font-bold sm:text-4xl">What we trade</h2>
          </div>
          <Link href="/shop/" className="inline-flex min-h-14 items-center gap-1 font-semibold text-brand-700 hover:text-brand-900">
            Browse all products <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/product-category/${c.slug}/`} className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-steel-800">
                {c.image && <Image src={c.image.src} alt="" fill sizes="(min-width:1024px) 14vw, (min-width:768px) 25vw, 50vw" className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />}
                <span className="absolute inset-0 bg-gradient-to-t from-steel-900/90 via-steel-900/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-center md:text-left">
                  <span className="block font-heading text-base leading-tight font-semibold text-white sm:text-lg">{c.name}</span>
                  <span className="text-xs text-steel-200">{productsInCategory(c.slug).length} products</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured product rows */}
      {home.featuredSections.map((sec) => {
        const items = productsInCategory(sec.category).slice(0, sec.limit);
        if (!items.length) return null;
        return (
          <section key={sec.category} className="border-t border-steel-200 bg-white py-14 md:py-16">
            <div className="container-x">
              <div className="mb-8 flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
                <h2 className="text-3xl font-bold sm:text-4xl">{sec.title}</h2>
                <Link href={`/product-category/${sec.category}/`} className="inline-flex min-h-14 items-center gap-1 font-semibold text-brand-700 hover:text-brand-900">
                  View all {catName[sec.category]} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <ProductGrid>
                {items.map((p) => (
                  <ProductCard key={p.slug} product={lite(p)} />
                ))}
              </ProductGrid>
            </div>
          </section>
        );
      })}

      {/* Value blocks */}
      <section className="bg-steel-900 py-16 text-white md:py-20">
        <div className="container-x">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="eyebrow text-signal-400">Why Scrap Bays</p>
            <h2 className="mt-1 text-3xl font-bold text-white sm:text-4xl">Trusted supply, end to end</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {home.values.map((v) => {
              const Icon = ICONS[v.icon] || ShieldCheck;
              return (
                <li key={v.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center lg:text-left">
                  <span className="mx-auto mb-4 grid size-12 place-items-center rounded-md bg-brand-700 text-white lg:mx-0">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-xl font-semibold text-white">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-300">{v.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Enquiry CTA */}
      <section className="container-x py-16 md:py-20">
        <div className="grid gap-6 overflow-hidden rounded-xl bg-brand-900 p-8 text-center text-white md:grid-cols-[1.5fr_1fr] md:items-center md:p-12 md:text-left">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Buying or selling scrap?</h2>
            <p className="mt-3 max-w-xl text-brand-100 max-md:mx-auto">
              Add products to your quote list and send one enquiry for everything — or tell us about the material you want to sell. Our trading team replies with pricing, availability and shipping terms.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch lg:flex-row lg:justify-end">
            <Link href="/shop/" className="btn-signal">
              Request a quote
            </Link>
            <Link href="/scrap-material-enquiry/" className="btn-ghost-light">
              Sell your scrap
            </Link>
          </div>
        </div>
      </section>

      {/* Latest posts */}
      {posts.length > 0 && (
        <section className="border-t border-steel-200 bg-white py-14 md:py-16">
          <div className="container-x">
            <div className="mb-8 flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <h2 className="text-3xl font-bold sm:text-4xl">From the blog</h2>
              <Link href="/blog/" className="inline-flex min-h-14 items-center gap-1 font-semibold text-brand-700 hover:text-brand-900">
                All articles <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ul className="grid gap-5 md:grid-cols-3">
              {posts.map((p) => (
                <li key={p.slug} className="group card relative overflow-hidden">
                  {p.image && (
                    <div className="relative aspect-[16/9] bg-steel-100">
                      <Image src={p.image.src} alt={p.image.alt || ""} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <time dateTime={p.date} className="text-sm text-steel-500">
                      {formatDate(p.date)}
                    </time>
                    <h3 className="mt-1 text-xl leading-snug font-semibold">
                      <Link href={`/${p.slug}/`} className="after:absolute after:inset-0 group-hover:text-brand-700">
                        {p.title}
                      </Link>
                    </h3>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="container-x pt-14 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Scrap Metal, Plastic Scrap, Electronic Scrap &amp; Other Recyclable Materials Suppliers</h2>
        <p className="mx-auto mt-3 max-w-3xl text-steel-600">{site.description}</p>
      </section>
    </>
  );
}
