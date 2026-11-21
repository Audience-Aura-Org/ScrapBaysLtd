import { PageHeader } from "@/components/PageHeader";
import { CartView } from "@/components/forms/CartView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Quote List & Cart",
  description: "Review the products in your quote list and send one enquiry to Scrap Bays Limited.",
  path: "/cart/",
  noindex: true,
});

export default function CartPage() {
  return (
    <>
      <PageHeader title="Quote list" crumbs={[{ name: "Quote list", path: "/cart/" }]} intro="Adjust quantities, then send one enquiry for everything below." />
      <div className="container-x py-5 md:py-10">
        <CartView />
      </div>
    </>
  );
}
