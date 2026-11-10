import type { MetadataRoute } from "next";
import { getCategories, getPages, getPosts, getProducts, productsInCategory } from "@/lib/content";
import { absUrl } from "@/lib/site";

const latest = (...dates: (string | undefined)[]) => {
  const valid = dates.filter(Boolean) as string[];
  return valid.length ? new Date(valid.sort().at(-1)!) : undefined;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getProducts();
  const posts = getPosts();
  const newestProduct = latest(...products.map((p) => p.updated));
  const newestPost = latest(...posts.map((p) => p.updated || p.date));

  return [
    { url: absUrl("/"), lastModified: latest(newestProduct?.toISOString(), newestPost?.toISOString()), changeFrequency: "weekly", priority: 1 },
    { url: absUrl("/shop/"), lastModified: newestProduct, changeFrequency: "weekly", priority: 0.9 },
    { url: absUrl("/scrap-material-enquiry/"), changeFrequency: "yearly", priority: 0.7 },
    { url: absUrl("/blog/"), lastModified: newestPost, changeFrequency: "weekly", priority: 0.6 },
    ...getCategories().map((c) => ({
      url: absUrl(`/product-category/${c.slug}/`),
      lastModified: latest(...productsInCategory(c.slug).map((p) => p.updated)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: c.image ? [absUrl(c.image.src)] : undefined,
    })),
    ...products.map((p) => ({
      url: absUrl(`/product/${p.slug}/`),
      lastModified: latest(p.updated, p.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: p.images.map((i) => absUrl(i.src)),
    })),
    ...getPages().map((p) => ({
      url: absUrl(`/${p.slug}/`),
      lastModified: latest(p.updated, p.date),
      changeFrequency: "monthly" as const,
      priority: p.kind === "policy" ? 0.2 : 0.6,
    })),
    ...posts.map((p) => ({
      url: absUrl(`/${p.slug}/`),
      lastModified: latest(p.updated, p.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
      images: p.image ? [absUrl(p.image.src)] : undefined,
    })),
  ];
}
