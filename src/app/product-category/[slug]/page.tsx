import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard, ProductGrid } from "@/components/product/ProductCard";
import { getCategories, getCategory, lite, productsInCategory } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => getCategories().map((c) => ({ slug: c.slug }));

type Params = Promise<{ slug: string }>;

const intro = (name: string, n: number, desc: string) =>
  desc || `Browse ${n} ${name.toLowerCase()} products supplied by Scrap Bays Limited to industrial buyers worldwide. Add items to your quote list for pricing, availability and shipping terms.`;

export async function generateMetadata({ params }: { params: Params }) {
  const c = getCategory((await params).slug);
  if (!c) return {};
  const products = productsInCategory(c.slug);
  return buildMetadata({
    title: `${c.name} for Sale`,
    description: intro(c.name, products.length, c.description).slice(0, 160),
    path: `/product-category/${c.slug}/`,
    image: c.image,
  });
}

export default async function CategoryPage({ params }: { params: Params }) {
  const c = getCategory((await params).slug);
  if (!c) notFound();
  const products = productsInCategory(c.slug);
  const others = getCategories().filter((x) => x.slug !== c.slug);
  return (
    <>
      <PageHeader title={c.name} eyebrow="Product category" crumbs={[{ name: "Shop", path: "/shop/" }, { name: c.name, path: `/product-category/${c.slug}/` }]} intro={intro(c.name, products.length, c.description)} />
      <div className="container-x py-5 md:py-10">
        <div className="mb-5 flex flex-col items-center justify-between gap-3 text-sm text-steel-600 sm:flex-row">
          <p>{products.length} products</p>
          <Link href={`/shop/?category=${c.slug}`} className="font-semibold text-brand-700 underline">
            Search &amp; sort this category
          </Link>
        </div>
        <ProductGrid>
          {products.map((p, n) => (
            <ProductCard key={p.slug} product={lite(p)} priority={n < 4} />
          ))}
        </ProductGrid>
        <section className="mt-14 text-center md:text-left">
          <h2 className="mb-4 text-2xl font-bold">Other categories</h2>
          <ul className="flex flex-wrap justify-center gap-2 md:justify-start">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/product-category/${o.slug}/`} className="inline-flex min-h-14 items-center rounded-full border border-steel-300 bg-white px-4 font-medium hover:border-brand-600 hover:text-brand-700">
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
