import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Mail, PenLine } from "lucide-react";
import { Breadcrumbs } from "@/components/PageHeader";
import { JsonLd } from "@/components/JsonLd";
import { PostList } from "./PostList";
import { getCategory, getProduct, pageSummary, readingMinutes, relatedPosts, wordCount, type Post } from "@/lib/content";
import { dropDuplicateTitle, renderMarkdown } from "@/lib/markdown";
import { blogPostingLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { absUrl, site } from "@/lib/site";
import { splitName } from "@/components/product/ProductCard";

const DAY = 24 * 60 * 60 * 1000;

export function BlogPost({ post }: { post: Post }) {
  const url = absUrl(`/${post.slug}/`);
  const category = post.category ? getCategory(post.category) : undefined;
  const product = post.product ? getProduct(post.product) : undefined;
  const minutes = readingMinutes(post.body);
  const updated = post.updated && +new Date(post.updated) - +new Date(post.date) > DAY ? post.updated : undefined;
  // The featured image is shown in the header; don't repeat it in the body.
  const html = renderMarkdown(dropDuplicateTitle(post.body, post.title), { dropImage: post.image?.src });
  const related = relatedPosts(post, 3);

  return (
    <>
      <article>
        <header className="border-b border-steel-200 bg-white">
          {/* Title and meta centred on phones and up; the body below is left-aligned. */}
          <div className="container-x py-8 text-center md:py-12">
            <Breadcrumbs items={[{ name: "Blog", path: "/blog/" }, { name: post.title, path: `/${post.slug}/` }]} className="mb-5 flex justify-center" />
            {category && (
              <Link href={`/product-category/${category.slug}/`} className="eyebrow relative hover:underline after:absolute after:inset-x-0 after:-inset-y-5 after:content-['']">
                {category.name}
              </Link>
            )}
            <h1 className="mx-auto mt-2 max-w-4xl text-[calc(2rem-2px)] font-bold sm:text-[calc(2.5rem-2px)] lg:text-[calc(3rem-2px)]">{post.title}</h1>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-steel-600">
              <span>
                Published <time dateTime={post.date}>{formatDate(post.date)}</time>
              </span>
              {updated && (
                <span>
                  Updated <time dateTime={updated}>{formatDate(updated)}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden /> {minutes} min read
              </span>
              <span className="inline-flex items-center gap-1">
                <PenLine className="size-4" aria-hidden /> By {site.name}
              </span>
            </p>
          </div>
        </header>

        <div className="container-x py-10">
          <div className="mx-auto max-w-[85ch]">
            {post.image && (
              <figure className="mb-8">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-brand-900">
                  <Image src={post.image.src} alt={post.image.alt || post.title} fill priority sizes="(min-width:768px) 720px, 100vw" className="object-cover" />
                </div>
              </figure>
            )}
            <div className="prose prose-lg prose-blog max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

            <ShareLinks url={url} title={post.title} />

            <aside className="mt-10 rounded-lg bg-brand-900 p-6 text-center text-white sm:p-8 md:text-left">
              <h2 className="text-2xl font-bold text-white">{category ? `Buying or selling ${category.name.toLowerCase()}?` : "Looking for a quote?"}</h2>
              <p className="mt-2 text-brand-100">
                {product
                  ? `Request a quote for ${splitName(product.name)[0]} or browse our ${category?.name.toLowerCase() ?? "products"}. Selling material? Send us the details and photos.`
                  : "Tell us the material, grade, quantity and destination and our trading team will come back with pricing and availability."}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row md:justify-start">
                {product ? (
                  <Link href={`/product/${product.slug}/`} className="btn-signal">
                    View {splitName(product.name)[0]} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                ) : (
                  <Link href={category ? `/product-category/${category.slug}/` : "/shop/"} className="btn-signal">
                    Browse {category?.name ?? "products"} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
                {product && category && (
                  <Link href={`/product-category/${category.slug}/`} className="btn-ghost-light">
                    All {category.name}
                  </Link>
                )}
                <Link href="/scrap-material-enquiry/" className="btn-ghost-light">
                  Sell your scrap
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-steel-200 bg-white py-12">
          <div className="container-x">
            <h2 className="mb-6 text-center text-2xl font-bold md:text-left">Related articles</h2>
            <PostList posts={related} headingLevel={3} />
          </div>
        </section>
      )}
      <JsonLd data={blogPostingLd(post, pageSummary(post), { wordCount: wordCount(post.body), section: category?.name })} />
    </>
  );
}

function ShareLinks({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
  ];
  return (
    <div className="mt-10 flex flex-col items-center gap-3 border-t border-steel-200 pt-6 sm:flex-row sm:flex-wrap">
      <p className="text-sm font-semibold text-steel-700">Share this article</p>
      <ul className="flex flex-wrap justify-center gap-2">
        {links.map((l) => (
          <li key={l.name}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 min-w-14 items-center justify-center rounded-full border border-steel-300 bg-white px-4 text-sm font-medium hover:border-brand-600 hover:text-brand-700"
            >
              {l.name}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
        <li>
          <a href={`mailto:?subject=${t}&body=${u}`} className="inline-flex min-h-14 items-center gap-1.5 rounded-full border border-steel-300 bg-white px-4 text-sm font-medium hover:border-brand-600 hover:text-brand-700">
            <Mail className="size-4" aria-hidden /> Email
          </a>
        </li>
      </ul>
    </div>
  );
}
