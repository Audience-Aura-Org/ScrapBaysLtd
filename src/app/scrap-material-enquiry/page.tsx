import Link from "next/link";
import { ClipboardList, Mail, Phone, Ship } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SellForm } from "@/components/forms/SellForm";
import { getCategories } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { site, telHref } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Scrap Material Enquiry — Sell Your Scrap",
  description: "Selling scrap metal, e-scrap, plastics, rubber or timber? Send Scrap Bay Limited the material type, quantity, location and photos and get an offer from our trading team.",
  path: "/scrap-material-enquiry/",
});

const MATERIALS = ["HMS 1&2 scrap", "Used rails", "Cast iron scrap", "Copper wire scrap", "Insulated copper cable", "Brass honey scrap", "Aluminium UBC scrap", "Aluminium extrusion scrap", "Lead battery scrap", "Radiator scrap", "Electric motor scrap", "Compressor scrap", "Motherboard / PCB scrap", "Ceramic CPU scrap", "RAM scrap", "Mobile phone scrap", "LDPE film scrap", "HDPE regrind", "PET bottle flakes", "PVC profile scrap", "Tyre scrap", "Rubber scrap", "Timber logs"];

export default function SellPage() {
  return (
    <>
      <PageHeader
        title="Scrap Material Enquiry"
        eyebrow="Sell your scrap"
        crumbs={[{ name: "Scrap Material Enquiry", path: "/scrap-material-enquiry/" }]}
        intro="Have scrap or recyclable material to sell? Tell us what it is, how much and where it is — add photos if you can — and our trading team will come back with an offer."
      />
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="card p-5 sm:p-8">
          <SellForm materials={MATERIALS} />
        </div>
        <aside className="space-y-6 text-center lg:text-left">
          <div className="card p-6">
            <h2 className="text-xl font-bold">How it works</h2>
            <ol className="mt-4 space-y-4 text-left text-sm text-steel-700">
              <li className="flex gap-3">
                <ClipboardList className="size-5 shrink-0 text-brand-600" aria-hidden /> Send the material details and photos.
              </li>
              <li className="flex gap-3">
                <Mail className="size-5 shrink-0 text-brand-600" aria-hidden /> We review and reply with questions or an offer, usually within two working days.
              </li>
              <li className="flex gap-3">
                <Ship className="size-5 shrink-0 text-brand-600" aria-hidden /> We agree grade, price, inspection and collection or shipping terms.
              </li>
            </ol>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold">Prefer to talk?</h2>
            <p className="mt-3 space-y-1 text-sm">
              <a href={`mailto:${site.email}`} className="flex min-h-10 items-center justify-center gap-2 font-semibold text-brand-700 lg:justify-start">
                <Mail className="size-4" aria-hidden /> {site.email}
              </a>
              <a href={telHref(site.phone)} className="flex min-h-10 items-center justify-center gap-2 font-semibold text-brand-700 lg:justify-start">
                <Phone className="size-4" aria-hidden /> {site.phone}
              </a>
            </p>
          </div>
          <p className="text-sm text-steel-600">
            Looking to <strong>buy</strong> material instead?{" "}
            <Link href="/shop/" className="font-semibold text-brand-700 underline">
              Browse our {getCategories().length} categories
            </Link>
            .
          </p>
        </aside>
      </div>
    </>
  );
}
