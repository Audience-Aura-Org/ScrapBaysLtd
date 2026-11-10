import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { site, telHref } from "@/lib/site";
import { getCategories } from "@/lib/content";

export function Footer() {
  const cats = getCategories();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 bg-steel-900 text-steel-300">
      <div className="container-x grid gap-10 py-14 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col items-center sm:items-start">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            UK-based trader of scrap metal, metal ingots, electronic, plastic and motor-parts scrap and timber, supplying industrial buyers worldwide.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <a href={`mailto:${site.email}`} className="flex min-h-14 items-center justify-center gap-2 hover:text-white sm:justify-start">
              <Mail className="size-4 text-brand-400" aria-hidden /> {site.email}
            </a>
            <a href={telHref(site.phone)} className="flex min-h-14 items-center justify-center gap-2 hover:text-white sm:justify-start">
              <Phone className="size-4 text-brand-400" aria-hidden /> {site.phone}
            </a>
          </div>
        </div>
        <FooterCol title="Products" links={[...cats.map((c) => ({ href: `/product-category/${c.slug}/`, label: c.name })), { href: "/shop/", label: "All products" }]} />
        <FooterCol
          title="Company"
          links={[
            { href: "/about-us/", label: "About Us" },
            { href: "/scrap-material-enquiry/", label: "Sell Your Scrap" },
            { href: "/cart/", label: "Request a Quote" },
            { href: "/track-order/", label: "Track an Order" },
            { href: "/blog/", label: "Blog" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: "/privacy-policy/", label: "Privacy Policy" },
            { href: "/condition-of-use/", label: "Conditions of Use" },
            { href: "/refund_returns/", label: "Refund & Returns Policy" },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-center text-xs text-steel-500 sm:flex-row sm:text-left">
          <p>© {year} {site.legalName}. All rights reserved.</p>
          <p>Scrap metal · Ingots · E-scrap · Plastics · Timber</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-base font-semibold tracking-wider text-white uppercase">{title}</h2>
      <ul className="space-y-1 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-14 min-w-14 items-center hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
