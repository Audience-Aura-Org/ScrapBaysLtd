import Link from "next/link";

export function Pagination({ current, pages, href }: { current: number; pages: number; href: (page: number) => string }) {
  if (pages < 2) return null;
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {current > 1 && (
        <Link href={href(current - 1)} rel="prev" className="btn-outline min-h-14 px-4">
          ← Previous
        </Link>
      )}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === current ? "page" : undefined}
          className={`grid size-14 place-items-center rounded-md border font-semibold ${n === current ? "border-brand-700 bg-brand-700 text-white" : "border-steel-300 bg-white hover:border-brand-600"}`}
        >
          {n}
        </Link>
      ))}
      {current < pages && (
        <Link href={href(current + 1)} rel="next" className="btn-outline min-h-14 px-4">
          Next →
        </Link>
      )}
    </nav>
  );
}
