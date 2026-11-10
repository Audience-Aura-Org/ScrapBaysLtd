import { PageHeader } from "@/components/PageHeader";
import { WishlistView } from "@/components/product/WishlistView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Wishlist", description: "Products you've saved on Scrap Bays Limited.", path: "/wishlist/", noindex: true });

export default function WishlistPage() {
  return (
    <>
      <PageHeader title="Wishlist" crumbs={[{ name: "Wishlist", path: "/wishlist/" }]} intro="Saved on this device. Add them to your quote list when you're ready." />
      <div className="container-x py-8 md:py-10">
        <WishlistView />
      </div>
    </>
  );
}
