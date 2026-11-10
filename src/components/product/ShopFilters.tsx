"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

export const SORTS = [
  { value: "", label: "Featured" },
  { value: "name", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "newest", label: "Newest first" },
  { value: "price", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Plain GET form: works without JavaScript; selects auto-submit when JS is available. */
export function ShopFilters({ q, category, sort, categories, action = "/shop/" }: { q: string; category: string; sort: string; categories: { slug: string; name: string }[]; action?: string }) {
  const form = useRef<HTMLFormElement>(null);
  // Back/forward can restore this page from the browser cache with the controls still showing
  // what was picked before leaving; reset them to the values this URL was rendered with.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) form.current?.reset();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return (
    <form
      ref={form}
      action={action}
      role="search"
      autoComplete="off"
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
      onSubmit={(e) => {
        // Keep URLs clean: leave empty fields out of the query string.
        for (const el of Array.from(e.currentTarget.elements) as HTMLInputElement[]) {
          if (el.name && el.value.trim() === "") el.removeAttribute("name");
        }
      }}
    >
      <div className="relative">
        <label htmlFor="shop-q" className="field-label">
          Search
        </label>
        <input id="shop-q" name="q" type="search" defaultValue={q} placeholder="e.g. copper, HMS, teak…" className="field pl-10" />
        <Search className="pointer-events-none absolute bottom-3 left-3 size-5 text-steel-500" aria-hidden />
      </div>
      <div>
        <label htmlFor="shop-cat" className="field-label">
          Category
        </label>
        <select id="shop-cat" name="category" defaultValue={category} className="field sm:w-52" onChange={() => form.current?.requestSubmit()}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="shop-sort" className="field-label">
          Sort by
        </label>
        <select id="shop-sort" name="sort" defaultValue={sort} className="field sm:w-48" onChange={() => form.current?.requestSubmit()}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <noscript>
        <button className="btn-primary">Apply</button>
      </noscript>
    </form>
  );
}
