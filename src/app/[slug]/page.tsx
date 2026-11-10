import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BlogPost } from "@/components/blog/BlogPost";
import { getPage, getPages, getPost, getPosts, pageSummary } from "@/lib/content";
import { dropDuplicateTitle, renderMarkdown } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";
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
  return <BlogPost post={post} />;
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
