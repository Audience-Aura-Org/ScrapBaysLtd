import { PageHeader } from "@/components/PageHeader";
import { PostList } from "@/components/blog/PostList";
import { Pagination } from "@/components/Pagination";
import { blogHref, blogPage, blogPageCount } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog — Scrap Materials, Recycling & Trading Guides",
  description: "Guides and market notes from Scrap Bays Limited on scrap metal, electronic scrap, plastics, rubber, precious metals and recyclable materials.",
  path: "/blog/",
});

export default function BlogIndex() {
  return (
    <>
      <PageHeader title="Blog" eyebrow="Insights" crumbs={[{ name: "Blog", path: "/blog/" }]} intro="Material guides, grades and recycling notes from our trading team." />
      <div className="container-x py-6 md:py-10">
        <PostList posts={blogPage(1)} />
        <Pagination current={1} pages={blogPageCount()} href={blogHref} />
      </div>
    </>
  );
}
