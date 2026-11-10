import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { summarize } from "@/lib/markdown";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, n) => (
        <li key={p.slug} className="group card relative flex flex-col overflow-hidden">
          <div className="relative aspect-[16/10] bg-steel-100">
            {p.image && <Image src={p.image.src} alt={p.image.alt || ""} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" priority={n < 3} />}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <time dateTime={p.date} className="text-sm text-steel-500">
              {formatDate(p.date)}
            </time>
            <h2 className="mt-1 text-xl leading-snug font-semibold">
              <Link href={`/${p.slug}/`} className="after:absolute after:inset-0 group-hover:text-brand-700">
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 line-clamp-3 text-sm text-steel-600">{p.excerpt || summarize(p.body, 160)}</p>
            <span className="mt-auto pt-4 text-sm font-semibold text-brand-700">Read article →</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
