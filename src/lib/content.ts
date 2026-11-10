import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import categoriesJson from "../../data/categories.json";
import { summarize } from "./markdown";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

export type Img = { src: string; alt: string; width?: number; height?: number };
export type Tag = { slug: string; name: string };
export type StockStatus = "in_stock" | "out_of_stock" | "on_request";

export type Product = {
  name: string;
  slug: string;
  category: string;
  price: number | null;
  currency: string;
  unit: string;
  stock: StockStatus;
  sku?: string;
  shortDescription?: string;
  images: Img[];
  specs: [string, string][];
  tags: Tag[];
  related?: string[];
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  order: number;
  date?: string;
  updated?: string;
  body: string;
};

export type Category = { slug: string; name: string; legacyName?: string; description: string; image: Img | null };

export type Page = {
  title: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  date?: string;
  updated?: string;
  body: string;
  kind: "page" | "policy";
};

export type Post = {
  title: string;
  slug: string;
  legacySlug?: string;
  date: string;
  updated?: string;
  excerpt?: string;
  image?: Img;
  seoTitle?: string;
  seoDescription?: string;
  /** Product category the post is about (drives the CTA box and related posts). */
  category?: string;
  /** Product the post is about, if any. */
  product?: string;
  /** Commissioned replacement featured image (see IMAGE_BRIEFS.md); used once the file exists. */
  plannedImage?: string;
  body: string;
};

function readDir<T>(dir: string, map: (data: Record<string, unknown>, body: string, file: string) => T): T[] {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(full, f), "utf8"));
      return map(data, content, f);
    });
}

const slugOf = (data: Record<string, unknown>, file: string) => String(data.slug || file.replace(/\.md$/, ""));

export const getProducts = cache((): Product[] =>
  readDir("products", (d, body, f) => ({
    ...(d as Omit<Product, "body">),
    slug: slugOf(d, f),
    price: typeof d.price === "number" ? d.price : null,
    currency: String(d.currency || "USD"),
    unit: String(d.unit || "tonnes"),
    stock: (d.stock as StockStatus) || "in_stock",
    // De-duplicate: WooCommerce often repeated the featured image in the gallery.
    images: ((d.images as Img[]) || []).filter((img, i, all) => all.findIndex((x) => x.src === img.src) === i),
    specs: (d.specs as [string, string][]) || [],
    tags: (d.tags as Tag[]) || [],
    order: typeof d.order === "number" ? d.order : 999,
    body,
  })).sort((a, b) => a.order - b.order),
);

export const getProduct = (slug: string) => getProducts().find((p) => p.slug === slug);

export const getCategories = (): Category[] => categoriesJson as Category[];
export const getCategory = (slug: string) => getCategories().find((c) => c.slug === slug);
export const productsInCategory = (slug: string) => getProducts().filter((p) => p.category === slug);

export const getTags = cache((): (Tag & { count: number })[] => {
  const map = new Map<string, Tag & { count: number }>();
  for (const p of getProducts())
    for (const t of p.tags) {
      const e = map.get(t.slug);
      if (e) e.count++;
      else map.set(t.slug, { ...t, count: 1 });
    }
  return [...map.values()];
});

export function relatedProducts(p: Product, n = 4): Product[] {
  const all = getProducts();
  const picked: Product[] = [];
  for (const s of p.related || []) {
    const r = all.find((x) => x.slug === s);
    if (r && r.slug !== p.slug) picked.push(r);
  }
  for (const r of all) {
    if (picked.length >= n) break;
    if (r.slug !== p.slug && r.category === p.category && !picked.includes(r)) picked.push(r);
  }
  return picked.slice(0, n);
}

export const getPages = cache((): Page[] => [
  ...readDir("pages", (d, body, f) => ({ ...(d as Omit<Page, "body" | "kind">), slug: slugOf(d, f), body, kind: (d.kind as Page["kind"]) || "page" })),
  ...readDir("pages/imported", (d, body, f) => ({ ...(d as Omit<Page, "body" | "kind">), slug: slugOf(d, f), body, kind: "page" as const })),
]);
export const getPage = (slug: string) => getPages().find((p) => p.slug === slug);

export const getPosts = cache((): Post[] =>
  readDir("posts", (d, body, f) => {
    const post = { ...(d as Omit<Post, "body">), slug: slugOf(d, f), date: String(d.date), body };
    // Swap in the commissioned featured image as soon as the file has been added to public/.
    if (post.plannedImage && fs.existsSync(path.join(ROOT, "public", post.plannedImage)))
      post.image = { src: post.plannedImage, alt: post.image?.alt || post.title, width: 1200, height: 630 };
    return post;
  }).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
);

/** Words in a Markdown body, and reading time at ~200 words per minute (minimum 1). */
export const wordCount = (md: string) => md.replace(/!\[[^\]]*\]\([^)]*\)|\]\([^)]*\)|[#*_`>|-]/g, " ").split(/\s+/).filter(Boolean).length;
export const readingMinutes = (md: string) => Math.max(1, Math.round(wordCount(md) / 200));

/** Posts in the same category first, then the most recent others. */
export function relatedPosts(post: Post, n = 3): Post[] {
  const others = getPosts().filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => post.category && p.category === post.category);
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, n);
}
export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export const productSummary = (p: Product) => p.seoDescription || p.shortDescription || summarize(p.body);
export const pageSummary = (p: Page | Post) => p.seoDescription || ("excerpt" in p && p.excerpt) || summarize(p.body);

/** Fields that are safe and small enough to ship to the browser (cart, wishlist, shop). */
export type ProductLite = Pick<Product, "slug" | "name" | "category" | "price" | "currency" | "unit" | "stock"> & { image?: Img };
export const lite = (p: Product): ProductLite => ({
  slug: p.slug,
  name: p.name,
  category: p.category,
  price: p.price,
  currency: p.currency,
  unit: p.unit,
  stock: p.stock,
  image: p.images[0],
});
