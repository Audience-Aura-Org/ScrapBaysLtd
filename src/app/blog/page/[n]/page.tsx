import { notFound, permanentRedirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PostList } from "@/components/blog/PostList";
import { Pagination } from "@/components/Pagination";
import { blogHref, blogPage, blogPageCount } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const dynamicParams = false;
// Always emit page 2 so the old /blog/page/2/ URL resolves even while there are few posts.
export const generateStaticParams = () => Array.from({ length: Math.max(2, blogPageCount()) - 1 }, (_, i) => ({ n: String(i + 2) }));

type Params = Promise<{ n: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const n = Number((await params).n);
  return buildMetadata({ title: `Blog — Page ${n}`, description: `Scrap Bays Limited blog, page ${n}.`, path: blogHref(n), noindex: true });
}

export default async function BlogPaged({ params }: { params: Params }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 2) notFound();
  if (n > blogPageCount()) permanentRedirect("/blog/");
  return (
    <>
      <PageHeader title={`Blog — page ${n}`} eyebrow="Insights" crumbs={[{ name: "Blog", path: "/blog/" }, { name: `Page ${n}`, path: blogHref(n) }]} />
      <div className="container-x py-10">
        <PostList posts={blogPage(n)} />
        <Pagination current={n} pages={blogPageCount()} href={blogHref} />
      </div>
    </>
  );
}
