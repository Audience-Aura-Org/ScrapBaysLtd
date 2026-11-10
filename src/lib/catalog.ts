import "server-only";
import { getProducts, type Product } from "./content";

export const PAGE_SIZE = 24;

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function searchProducts({ q = "", category = "", sort = "" }: { q?: string; category?: string; sort?: string }): Product[] {
  let list = getProducts();
  if (category) list = list.filter((p) => p.category === category);
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (terms.length) {
    const scored = list
      .map((p) => {
        const name = norm(p.name);
        const hay = `${name} ${norm(p.tags.map((t) => t.name).join(" "))} ${norm(p.shortDescription || "")} ${norm(p.specs.flat().join(" "))}`;
        if (!terms.every((t) => hay.includes(t))) return null;
        const score = terms.reduce((s, t) => s + (name.includes(t) ? 3 : 1), 0);
        return { p, score };
      })
      .filter((x): x is { p: Product; score: number } => !!x);
    list = (sort ? scored : scored.sort((a, b) => b.score - a.score)).map((x) => x.p);
  }
  const byPrice = (dir: 1 | -1) => (a: Product, b: Product) => {
    if (a.price == null && b.price == null) return a.order - b.order;
    if (a.price == null) return 1; // quote-only products always last
    if (b.price == null) return -1;
    return (a.price - b.price) * dir;
  };
  switch (sort) {
    case "name":
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return [...list].sort((a, b) => b.name.localeCompare(a.name));
    case "newest":
      return [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    case "price":
      return [...list].sort(byPrice(1));
    case "price-desc":
      return [...list].sort(byPrice(-1));
    default:
      return list;
  }
}

export function paginate<T>(items: T[], page: number) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page || 1), pages);
  return { items: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), pages, current };
}
