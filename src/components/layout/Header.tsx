"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Heart, Mail, Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import { Logo } from "./Logo";
import { useShop } from "../state/ShopState";
import { site, telHref } from "@/lib/site";

type NavCat = { slug: string; name: string };

export function Header({ categories }: { categories: NavCat[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { cart, wishlist, ready } = useShop();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const links = [
    { href: "/shop/", label: "Shop" },
    { href: "/scrap-material-enquiry/", label: "Sell Your Scrap" },
    { href: "/about-us/", label: "About Us" },
    { href: "/blog/", label: "Blog" },
  ];
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const cartCount = ready ? cart.length : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-steel-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="hidden bg-steel-900 text-sm text-steel-200 md:block">
        <div className="container-x flex h-9 items-center justify-between">
          <p>B2B scrap materials trader · UK based, shipping worldwide</p>
          <div className="flex items-center gap-5">
            <a href={`mailto:${site.email}`} className="flex items-center gap-1.5 hover:text-white">
              <Mail className="size-3.5" aria-hidden /> {site.email}
            </a>
            <a href={telHref(site.phone)} className="flex items-center gap-1.5 hover:text-white">
              <Phone className="size-3.5" aria-hidden /> {site.phone}
            </a>
            <Link href="/track-order/" className="hover:text-white">
              Track order
            </Link>
          </div>
        </div>
      </div>

      <div className="container-x flex h-16 items-center gap-4 lg:h-[4.5rem]">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          <div className="group relative">
            <Link href="/shop/" className={`flex items-center gap-1 rounded-md px-3 py-2 font-medium hover:text-brand-700 ${isActive("/shop/") || pathname.startsWith("/product") ? "text-brand-700" : "text-steel-700"}`}>
              Products <ChevronDown className="size-4 transition-transform group-hover:rotate-180" aria-hidden />
            </Link>
            <div className="invisible absolute top-full left-0 w-64 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="card p-2 shadow-lg">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/product-category/${c.slug}/`} className="block rounded px-3 py-2 text-steel-700 hover:bg-brand-50 hover:text-brand-800">
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-steel-100 pt-1">
                  <Link href="/shop/" className="block rounded px-3 py-2 font-semibold text-brand-700 hover:bg-brand-50">
                    All products →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          {links.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-md px-3 py-2 font-medium hover:text-brand-700 ${isActive(l.href) ? "text-brand-700" : "text-steel-700"}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <form action="/shop/" role="search" className="relative mr-2 hidden xl:block">
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <input id="header-search" name="q" type="search" placeholder="Search materials…" className="field h-10 min-h-0 w-56 py-1.5 pl-9" />
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-500" aria-hidden />
          </form>
          <Link href="/shop/" className="grid size-11 place-items-center rounded-md text-steel-700 hover:bg-steel-100 xl:hidden" aria-label="Search products">
            <Search className="size-5" aria-hidden />
          </Link>
          <Link href="/wishlist/" className="relative grid size-11 place-items-center rounded-md text-steel-700 hover:bg-steel-100" aria-label={`Wishlist (${ready ? wishlist.length : 0})`}>
            <Heart className="size-5" aria-hidden />
            {ready && wishlist.length > 0 && <Badge n={wishlist.length} />}
          </Link>
          <Link href="/cart/" className="relative grid size-11 place-items-center rounded-md text-steel-700 hover:bg-steel-100" aria-label={`Quote list and cart (${cartCount} items)`}>
            <ShoppingCart className="size-5" aria-hidden />
            {cartCount > 0 && <Badge n={cartCount} />}
          </Link>
          <Link href="/cart/" className="btn-primary ml-2 hidden min-h-10 py-2 text-sm md:inline-flex">
            Request a quote
          </Link>
          <button type="button" className="grid size-11 place-items-center rounded-md text-steel-800 hover:bg-steel-100 lg:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>
            <Menu className="size-6" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div id="mobile-menu" className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-steel-900/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex h-16 items-center justify-between border-b border-steel-200 px-4">
            <span className="font-display text-lg font-bold">Menu</span>
            <button type="button" className="grid size-11 place-items-center rounded-md hover:bg-steel-100" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <X className="size-6" aria-hidden />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <form action="/shop/" role="search" className="relative mb-4">
              <label htmlFor="mobile-search" className="sr-only">
                Search products
              </label>
              <input id="mobile-search" name="q" type="search" placeholder="Search materials…" className="field pl-10" tabIndex={open ? 0 : -1} />
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-steel-500" aria-hidden />
            </form>
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} tabIndex={open ? 0 : -1} className={`flex min-h-12 items-center rounded-md px-3 text-lg font-semibold ${isActive(l.href) ? "bg-brand-50 text-brand-800" : "text-steel-800 hover:bg-steel-100"}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 mb-2 px-3 text-xs font-semibold tracking-wider text-steel-500 uppercase">Categories</p>
            <ul className="space-y-0.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/product-category/${c.slug}/`} tabIndex={open ? 0 : -1} className="flex min-h-11 items-center rounded-md px-3 text-steel-700 hover:bg-steel-100">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-0.5 border-t border-steel-200 pt-4">
              <li>
                <Link href="/track-order/" tabIndex={open ? 0 : -1} className="flex min-h-11 items-center rounded-md px-3 text-steel-700 hover:bg-steel-100">
                  Track an order
                </Link>
              </li>
              <li>
                <a href={`mailto:${site.email}`} tabIndex={open ? 0 : -1} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-steel-700 hover:bg-steel-100">
                  <Mail className="size-4" aria-hidden /> {site.email}
                </a>
              </li>
              <li>
                <a href={telHref(site.phone)} tabIndex={open ? 0 : -1} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-steel-700 hover:bg-steel-100">
                  <Phone className="size-4" aria-hidden /> {site.phone}
                </a>
              </li>
            </ul>
          </div>
          <div className="border-t border-steel-200 p-4">
            <Link href="/cart/" tabIndex={open ? 0 : -1} className="btn-primary w-full">
              View quote list ({cartCount})
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Badge({ n }: { n: number }) {
  return <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-signal-400 px-1 text-[0.7rem] leading-5 font-bold text-steel-900">{n}</span>;
}
