import Image from "next/image";
import Link from "next/link";
import { readingMinutes, type Post } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { summarize } from "@/lib/markdown";

/** Blog cards: image, date + reading time, title, excerpt, read-more. Newest first (sorted by getPosts). */
export function PostList({ posts, headingLevel = 2 }: { posts: Post[]; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 3 ? "h3" : "h2";
  if (!posts.length)
    return (
      <div className="card p-10 text-center">
        <p className="text-xl font-semibold">No articles yet</p>
        <p className="mt-2 text-steel-600">Check back soon, or browse our materials in the meantime.</p>
        <Link href="/shop/" className="btn-primary mt-6">
          Browse products
        </Link>
      </div>
    );
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, n) => (
        <li key={p.slug} className="group card relative flex flex-col overflow-hidden">
          <div className="relative aspect-[16/10] bg-brand-900">
            {p.image && <Image src={p.image.src} alt={p.image.alt || p.title} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" priority={n < 3} />}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="text-sm text-steel-500">
              <time dateTime={p.date}>{formatDate(p.date)}</time> · {readingMinutes(p.body)} min read
            </p>
            <H className="mt-1 text-xl leading-snug font-semibold">
              <Link href={`/${p.slug}/`} className="after:absolute after:inset-0 group-hover:text-brand-700">
                {p.title}
              </Link>
            </H>
            <p className="mt-2 line-clamp-3 text-sm text-steel-600">{p.excerpt || summarize(p.body, 160)}</p>
            <span className="mt-auto pt-4 text-sm font-semibold text-brand-700" aria-hidden>
              Read article →
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
