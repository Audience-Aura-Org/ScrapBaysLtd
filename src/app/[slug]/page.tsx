import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, PageHeader } from "@/components/PageHeader";
import { JsonLd } from "@/components/JsonLd";
import { PostList } from "@/components/blog/PostList";
import { getPage, getPages, getPost, getPosts, pageSummary } from "@/lib/content";
import { dropDuplicateTitle, renderMarkdown } from "@/lib/markdown";
import { blogPostingLd, buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

/**
 * Root-level content, matching the old WordPress permalinks:
 *  - pages (About, policies, material landing pages) at /<slug>/
 *  - blog posts at /<slug>/
 */
export const dynamicParams = false;
export function generateStaticParams() {
  const slugs = new Set([...getPages().map((p) => p.slug), ...getPosts().map((p) => p.slug)]);
  return [...slugs].map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (page) return buildMetadata({ title: page.seoTitle || page.title, description: pageSummary(page), path: `/${slug}/` });
  const post = getPost(slug);
  if (post)
    return buildMetadata({
      title: post.seoTitle || post.title,
      description: pageSummary(post),
      path: `/${slug}/`,
      image: post.image,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated,
    });
  return {};
}

export default async function ContentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (page)
    return (
      <>
        <PageHeader title={page.title} crumbs={[{ name: page.title, path: `/${slug}/` }]} />
        <div className="container-x py-10 md:py-14">
          <div className="mx-auto max-w-3xl">
            {page.kind === "policy" && page.updated && <p className="mb-6 text-sm text-steel-500">Last updated {formatDate(page.updated)}</p>}
            <article className="prose-site" dangerouslySetInnerHTML={{ __html: renderMarkdown(dropDuplicateTitle(page.body, page.title)) }} />
            {page.kind !== "policy" && <EnquiryNudge />}
          </div>
        </div>
      </>
    );

  const post = getPost(slug);
  if (!post) notFound();
  const more = getPosts()
    .filter((p) => p.slug !== slug)
    .slice(0, 3);
  return (
    <>
      <article>
        <header className="border-b border-steel-200 bg-white">
          <div className="container-x py-8 text-center md:py-12">
            <Breadcrumbs items={[{ name: "Blog", path: "/blog/" }, { name: post.title, path: `/${slug}/` }]} className="mb-5 flex justify-center" />
            <time dateTime={post.date} className="text-sm font-semibold tracking-wider text-brand-700 uppercase">
              {formatDate(post.date)}
            </time>
            <h1 className="mx-auto mt-2 max-w-4xl text-[2rem] font-bold sm:text-[2.5rem] lg:text-[3rem]">{post.title}</h1>
          </div>
        </header>
        <div className="container-x py-10">
          <div className="mx-auto max-w-3xl">
            {post.image && (
              <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg bg-steel-100">
                <Image src={post.image.src} alt={post.image.alt || post.title} fill priority sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
              </div>
            )}
            <div className="prose-site" dangerouslySetInnerHTML={{ __html: renderMarkdown(dropDuplicateTitle(post.body, post.title)) }} />
            <EnquiryNudge />
          </div>
        </div>
      </article>
      {more.length > 0 && (
        <section className="border-t border-steel-200 bg-white py-12">
          <div className="container-x">
            <h2 className="mb-6 text-center text-2xl font-bold md:text-left">More from the blog</h2>
            <PostList posts={more} />
          </div>
        </section>
      )}
      <JsonLd data={blogPostingLd(post, pageSummary(post))} />
    </>
  );
}

function EnquiryNudge() {
  return (
    <aside className="mt-12 rounded-lg bg-brand-900 p-6 text-center text-white sm:p-8 md:text-left">
      <h2 className="text-2xl font-bold text-white">Looking for a quote?</h2>
      <p className="mt-2 text-brand-100">Tell us the material, grade, quantity and destination and our trading team will come back with pricing and availability.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row md:justify-start">
        <Link href="/shop/" className="btn-signal">
          Browse products <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/scrap-material-enquiry/" className="btn-ghost-light">
          Sell your scrap
        </Link>
      </div>
    </aside>
  );
}
