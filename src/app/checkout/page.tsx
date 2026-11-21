import { PageHeader } from "@/components/PageHeader";
import { CheckoutView } from "@/components/forms/CheckoutView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Checkout", description: "Place your order with Scrap Bays Limited. Payment by bank transfer or invoice.", path: "/checkout/", noindex: true });

export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="Checkout" crumbs={[{ name: "Quote list", path: "/cart/" }, { name: "Checkout", path: "/checkout/" }]} intro="Orders are paid offline by bank transfer or invoice — no card details needed." />
      <div className="container-x py-5 md:py-10">
        <CheckoutView />
      </div>
    </>
  );
}
