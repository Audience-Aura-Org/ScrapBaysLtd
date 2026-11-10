import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard, ProductGrid } from "@/components/product/ProductCard";
import { getCategories, getProducts, getTags, lite } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

// Old WooCommerce tag archives. Kept working, but thin, so they are noindex,follow and not in the sitemap.
export const dynamicParams = false;
export const generateStaticParams = () => getTags().map((t) => ({ slug: t.slug }));

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const tag = getTags().find((t) => t.slug === slug);
  if (!tag) return {};
  return buildMetadata({ title: `${tag.name} — Products`, description: `Scrap Bay Limited products tagged “${tag.name}”.`, path: `/product-tag/${tag.slug}/`, noindex: true });
}

export default async function TagPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tag = getTags().find((t) => t.slug === slug);
  if (!tag) notFound();
  const products = getProducts().filter((p) => p.tags.some((t) => t.slug === slug));
  const catName = Object.fromEntries(getCategories().map((c) => [c.slug, c.name]));
  return (
    <>
      <PageHeader title={tag.name} eyebrow="Product tag" crumbs={[{ name: "Shop", path: "/shop/" }, { name: tag.name, path: `/product-tag/${slug}/` }]} />
      <div className="container-x py-8 md:py-10">
        <ProductGrid>
          {products.map((p) => (
            <ProductCard key={p.slug} product={lite(p)} categoryName={catName[p.category]} />
          ))}
        </ProductGrid>
      </div>
    </>
  );
}
