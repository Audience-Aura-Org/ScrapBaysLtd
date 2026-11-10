import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TrackForm } from "@/components/forms/TrackForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Track Your Order or Enquiry",
  description: "Check the status of your Scrap Bays Limited order, quote request or scrap material offer using your reference number.",
  path: "/track-order/",
  noindex: true,
});

export default function TrackPage() {
  return (
    <>
      <PageHeader title="Track your order or enquiry" crumbs={[{ name: "Track order", path: "/track-order/" }]} intro="Enter the reference from your confirmation email (e.g. SBQ-261110-AB12C) and the email address you used." />
      <div className="container-x max-w-4xl py-8 md:py-10">
        <Suspense>
          <TrackForm />
        </Suspense>
      </div>
    </>
  );
}
