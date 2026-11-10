import type { Metadata } from "next";
import { absUrl, site } from "./site";
import type { Img, Post, Product } from "./content";

type MetaInput = {
  title: string;
  description: string;
  path: string;
  image?: Img | null;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Use the title as-is instead of the "%s | Scrap Bay Limited" template. */
  absoluteTitle?: boolean;
};

export function buildMetadata(m: MetaInput): Metadata {
  const fullTitle = m.absoluteTitle ? m.title : `${m.title} | ${site.name}`;
  // Without an explicit image, Next's file-based opengraph-image route supplies the branded card.
  const images = m.image ? [{ url: absUrl(m.image.src), width: m.image.width, height: m.image.height, alt: m.image.alt || m.title }] : undefined;
  return {
    title: m.absoluteTitle ? { absolute: m.title } : m.title,
    description: m.description,
    alternates: { canonical: m.path },
    robots: m.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: m.type || "website",
      url: m.path,
      siteName: site.name,
      title: fullTitle,
      description: m.description,
      locale: "en_GB",
      ...(images ? { images } : {}),
      ...(m.type === "article" ? { publishedTime: m.publishedTime, modifiedTime: m.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: m.description, ...(images ? { images: images.map((i) => i.url) } : {}) },
  };
}

// ------------------------------------------------------------------ JSON-LD
const ORG_ID = `${site.url}/#organization`;

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  "@id": ORG_ID,
  name: site.name,
  legalName: site.legalName,
  url: site.url + "/",
  logo: absUrl(site.logo),
  image: absUrl(site.logo),
  email: site.email,
  telephone: site.phone,
  description: site.description,
  address: { "@type": "PostalAddress", addressCountry: site.country },
  areaServed: "Worldwide",
  contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email: site.email, telephone: site.phone, availableLanguage: ["English"] }],
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  name: site.name,
  url: site.url + "/",
  publisher: { "@id": ORG_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${site.url}/shop/?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absUrl(it.path) })),
});

export function productLd(p: Product, description: string, categoryName?: string) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absUrl(`/product/${p.slug}/`)}#product`,
    name: p.name,
    description,
    url: absUrl(`/product/${p.slug}/`),
    image: p.images.map((i) => absUrl(i.src)),
    category: categoryName,
    brand: { "@type": "Brand", name: site.name },
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.specs.length ? { additionalProperty: p.specs.map(([name, value]) => ({ "@type": "PropertyValue", name, value })) } : {}),
  };
  // Only emit an Offer when there is a real price; quote-only products have none.
  if (p.price != null)
    ld.offers = {
      "@type": "Offer",
      url: absUrl(`/product/${p.slug}/`),
      price: p.price,
      priceCurrency: p.currency,
      availability: p.stock === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: { "@id": ORG_ID },
      eligibleQuantity: { "@type": "QuantitativeValue", unitText: p.unit },
    };
  return ld;
}

export const blogPostingLd = (p: Post, description: string) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: p.title,
  description,
  datePublished: p.date,
  dateModified: p.updated || p.date,
  url: absUrl(`/${p.slug}/`),
  mainEntityOfPage: absUrl(`/${p.slug}/`),
  ...(p.image ? { image: [absUrl(p.image.src)] } : {}),
  author: { "@id": ORG_ID, "@type": "Organization", name: site.name },
  publisher: { "@id": ORG_ID, "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: absUrl(site.logo) } },
});
