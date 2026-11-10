import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard, ProductGrid } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/product/ShopFilters";
import { Pagination } from "@/components/Pagination";
import { getCategories, getCategory, getProducts, lite } from "@/lib/content";
import { paginate, searchProducts } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v || "").trim().slice(0, 100);

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Object.keys(sp).length > 0;
  const cat = getCategory(one(sp.category));
  return buildMetadata({
    title: cat ? `Shop ${cat.name}` : one(sp.q) ? `Search results for “${one(sp.q)}”` : "Shop — All Scrap Materials",
    description: `Browse ${getProducts().length} scrap materials from Scrap Bay Limited: metal scrap, metal ingots, electronic scrap, motor parts scrap, plastic scrap, timber logs and more. Request a quote online.`,
    path: "/shop/",
    // Search, sort, filter and paginated variants: keep out of the index but let crawlers follow links.
    noindex: filtered,
  });
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const category = getCategory(one(sp.category)) ? one(sp.category) : "";
  const sort = one(sp.sort);
  const page = Number(one(sp.page)) || 1;
  const categories = getCategories();
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const results = searchProducts({ q, category, sort });
  const { items, pages, current } = paginate(results, page);
  const qs = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (sort) p.set("sort", sort);
    if (n > 1) p.set("page", String(n));
    const s = p.toString();
    return `/shop/${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Shop"
        eyebrow="All products"
        crumbs={[{ name: "Shop", path: "/shop/" }]}
        intro="Prices for most materials depend on grade, volume and destination. Add products to your quote list and send one enquiry for everything."
      />
      <div className="container-x py-8 md:py-10">
        <div className="card mb-6 p-4 sm:p-5">
          <ShopFilters q={q} category={category} sort={sort} categories={categories.map(({ slug, name }) => ({ slug, name }))} />
        </div>
        <ul className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Categories">
          <li>
            <Link href="/shop/" className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap ${!category ? "border-brand-700 bg-brand-700 text-white" : "border-steel-300 bg-white hover:border-brand-600"}`}>
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/shop/?category=${c.slug}`}
                className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap ${category === c.slug ? "border-brand-700 bg-brand-700 text-white" : "border-steel-300 bg-white hover:border-brand-600"}`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mb-4 text-sm text-steel-600" aria-live="polite">
          {results.length} {results.length === 1 ? "product" : "products"}
          {q && (
            <>
              {" "}
              matching “<strong>{q}</strong>”
            </>
          )}
          {category && <> in {catName[category]}</>}
          {(q || category || sort) && (
            <>
              {" · "}
              <Link href="/shop/" className="font-semibold text-brand-700 underline">
                Clear filters
              </Link>
            </>
          )}
        </p>
        {items.length ? (
          <ProductGrid>
            {items.map((p, n) => (
              <ProductCard key={p.slug} product={lite(p)} categoryName={catName[p.category]} priority={n < 4} />
            ))}
          </ProductGrid>
        ) : (
          <div className="card p-10 text-center">
            <h2 className="text-2xl font-bold">No products found</h2>
            <p className="mt-2 text-steel-600">Try a different search, or tell us what you need — we source many materials on request.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/shop/" className="btn-outline">
                Show all products
              </Link>
              <Link href="/scrap-material-enquiry/" className="btn-primary">
                Send an enquiry
              </Link>
            </div>
          </div>
        )}
        <Pagination current={current} pages={pages} href={qs} />
      </div>
    </>
  );
}
