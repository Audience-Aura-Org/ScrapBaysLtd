import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Globe2, Mail, ShieldCheck, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/PageHeader";
import { Gallery } from "@/components/product/Gallery";
import { AddToCart } from "@/components/product/AddToCart";
import { PriceTag } from "@/components/product/PriceTag";
import { ProductCard, ProductGrid, splitName } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { getCategory, getProduct, getProducts, lite, productSummary, relatedProducts } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { buildMetadata, productLd } from "@/lib/seo";
import { STOCK_LABEL } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => getProducts().map((p) => ({ slug: p.slug }));

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return buildMetadata({
    title: p.seoTitle || splitName(p.name)[0],
    description: productSummary(p),
    path: `/product/${p.slug}/`,
    image: p.images[0], // product photo as the social card
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const cat = getCategory(p.category);
  const related = relatedProducts(p, 4);
  const summary = productSummary(p);
  const [title, subtitle] = splitName(p.name);

  return (
    <>
      <div className="container-x pt-6">
        <Breadcrumbs
          items={[
            { name: "Shop", path: "/shop/" },
            ...(cat ? [{ name: cat.name, path: `/product-category/${cat.slug}/` }] : []),
            { name: title, path: `/product/${p.slug}/` },
          ]}
        />
      </div>

      <section className="container-x grid gap-8 py-6 md:py-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={p.images} name={p.name} />
        <div>
          {/* Title block centred on phones; price, form and details stay left-aligned. */}
          <div className="text-center md:text-left">
            {cat && (
              <Link href={`/product-category/${cat.slug}/`} className="eyebrow hover:underline">
                {cat.name}
              </Link>
            )}
            <h1 className="mt-2 text-3xl leading-tight font-bold sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-lg text-steel-600">{subtitle}</p>}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-steel-200 py-4">
            <PriceTag price={p.price} currency={p.currency} unit={p.unit} size="lg" />
            <span className="text-sm text-steel-600">
              <span className={`mr-1.5 inline-block size-2 rounded-full ${p.stock === "out_of_stock" ? "bg-red-500" : "bg-brand-500"}`} aria-hidden />
              {STOCK_LABEL[p.stock]}
            </span>
          </div>
          <p className="mt-5 leading-relaxed text-steel-700">{p.shortDescription || summary}</p>
          <div className="mt-6">
            <AddToCart product={lite(p)} />
          </div>
          <ul className="mt-8 grid gap-3 text-sm text-steel-700 sm:grid-cols-2">
            <li className="flex gap-2.5">
              <ShieldCheck className="size-5 shrink-0 text-brand-600" aria-hidden /> Inspected &amp; verified before shipment
            </li>
            <li className="flex gap-2.5">
              <Globe2 className="size-5 shrink-0 text-brand-600" aria-hidden /> Worldwide shipping, bulk or containerised
            </li>
            <li className="flex gap-2.5">
              <FileText className="size-5 shrink-0 text-brand-600" aria-hidden /> Specs &amp; grade confirmed in your quote
            </li>
            <li className="flex gap-2.5">
              <Truck className="size-5 shrink-0 text-brand-600" aria-hidden /> Payment by bank transfer or invoice
            </li>
          </ul>
          <p className="mt-6 text-sm text-steel-600">
            Questions about this material?{" "}
            <a href={`mailto:${site.email}?subject=${encodeURIComponent(`Enquiry: ${title}`)}`} className="inline-flex items-center gap-1 font-semibold text-brand-700 underline">
              <Mail className="size-4" aria-hidden /> Email our trading team
            </a>
          </p>
        </div>
      </section>

      <section className="container-x grid gap-10 py-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <h2 className="mb-4 text-2xl font-bold">Product description</h2>
          <div className="prose-site" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          {p.specs.length > 0 && (
            <div className="card overflow-hidden">
              <h2 className="bg-steel-900 px-4 py-3 text-lg font-semibold text-white">Technical specifications</h2>
              <dl className="divide-y divide-steel-200 text-sm">
                {p.specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[42%_1fr] gap-3 px-4 py-2.5">
                    <dt className="font-medium text-steel-600">{k}</dt>
                    <dd className="text-steel-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {p.tags.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold tracking-wider text-steel-500 uppercase">Tags</h2>
              <ul className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/product-tag/${t.slug}/`} className="inline-flex min-h-9 items-center rounded-full bg-steel-100 px-3 text-sm text-steel-700 hover:bg-brand-50 hover:text-brand-800">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {related.length > 0 && (
        <section className="border-t border-steel-200 bg-white py-12">
          <div className="container-x">
            <h2 className="mb-6 text-center text-3xl font-bold md:text-left">Related products</h2>
            <ProductGrid>
              {related.map((r) => (
                <ProductCard key={r.slug} product={lite(r)} />
              ))}
            </ProductGrid>
          </div>
        </section>
      )}
      <JsonLd data={productLd(p, summary, cat?.name)} />
    </>
  );
}
