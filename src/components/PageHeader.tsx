import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "./JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-sm text-steel-500">
          {all.map((c, i) => (
            <li key={c.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
              {i === all.length - 1 ? (
                <span aria-current="page" className="line-clamp-1 text-steel-700">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="relative hover:text-brand-700 after:absolute after:-inset-x-3 after:-inset-y-5 after:content-['']">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all)} />
    </>
  );
}

/** Title band used by listing and content pages. Centred on phones, left-aligned from md up. */
export function PageHeader({ title, intro, crumbs, eyebrow }: { title: string; intro?: React.ReactNode; crumbs: Crumb[]; eyebrow?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-steel-200 bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-steel-100)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-steel-100)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
      <div className="container-x relative py-8 text-center md:py-12 md:text-left">
        <Breadcrumbs items={crumbs} className="mb-4 flex justify-center md:justify-start" />
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="mx-auto max-w-4xl text-[calc(2rem-2px)] font-bold sm:text-[calc(2.5rem-2px)] md:mx-0 lg:text-[calc(3rem-2px)]">{title}</h1>
        {intro && <div className="mx-auto mt-3 max-w-3xl text-lg text-steel-600 md:mx-0">{intro}</div>}
      </div>
    </section>
  );
}
