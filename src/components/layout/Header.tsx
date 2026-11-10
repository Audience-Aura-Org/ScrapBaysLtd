"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Mail, Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import { Logo } from "./Logo";
import { useShop } from "../state/ShopState";
import { site, telHref } from "@/lib/site";

type NavCat = { slug: string; name: string };

export function Header({ categories }: { categories: NavCat[] }) {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const pathname = usePathname();
  const { cart, wishlist, ready } = useShop();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const productsLink = useRef<HTMLAnchorElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    setOpen(false);
    setDropdown(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    // Move focus into the drawer when it opens and back to the menu button when it closes.
    if (open) closeButton.current?.focus();
    else if (wasOpen.current) menuButton.current?.focus();
    wasOpen.current = open;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
    <>
    <header className="sticky top-0 z-40 border-b border-steel-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="hidden bg-steel-900 text-sm text-steel-200 md:block">
        <div className="container-x flex h-9 items-center justify-between">
          <p className="hidden truncate lg:block">B2B scrap materials trader · UK based, shipping worldwide</p>
          <div className="ml-auto flex items-center gap-5 whitespace-nowrap">
            <a href={`mailto:${site.email}`} className="relative flex items-center gap-1.5 hover:text-white after:absolute after:-inset-x-2 after:-inset-y-5 after:content-['']">
              <Mail className="size-3.5" aria-hidden /> {site.email}
            </a>
            <a href={telHref(site.phone)} className="relative flex items-center gap-1.5 hover:text-white after:absolute after:-inset-x-2 after:-inset-y-5 after:content-['']">
              <Phone className="size-3.5" aria-hidden /> {site.phone}
            </a>
            <Link href="/track-order/" className="relative hover:text-white after:absolute after:-inset-x-2 after:-inset-y-5 after:content-['']">
              Track order
            </Link>
          </div>
        </div>
      </div>

      <div className="container-x flex h-16 items-center gap-4 lg:h-[4.5rem]">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setDropdown(true)}
            onMouseLeave={() => setDropdown(false)}
            onFocus={() => setDropdown(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropdown(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && dropdown) {
                setDropdown(false);
                productsLink.current?.focus();
                e.stopPropagation();
              }
            }}
          >
            <Link
              ref={productsLink}
              href="/shop/"
              aria-expanded={dropdown}
              aria-controls="products-menu"
              className={`flex items-center gap-1 rounded-md px-3 py-4 font-medium hover:text-brand-700 ${isActive("/shop/") || pathname.startsWith("/product") ? "text-brand-700" : "text-steel-700"}`}
              // Re-focusing the link after Esc must not immediately re-open the menu.
              onFocus={(e) => {
                if (e.relatedTarget && e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) e.stopPropagation();
              }}
            >
              Products <ChevronDown className={`size-4 transition-transform ${dropdown ? "rotate-180" : ""}`} aria-hidden />
            </Link>
            <div id="products-menu" className={`absolute top-full left-0 w-64 pt-2 transition ${dropdown ? "visible opacity-100" : "invisible opacity-0"}`}>
              <ul className="card p-2 shadow-lg">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/product-category/${c.slug}/`} className="block rounded px-3 py-4 text-steel-700 hover:bg-brand-50 hover:text-brand-800">
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-steel-100 pt-1">
                  <Link href="/shop/" className="block rounded px-3 py-4 font-semibold text-brand-700 hover:bg-brand-50">
                    All products →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          {links.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-md px-3 py-4 font-medium hover:text-brand-700 ${isActive(l.href) ? "text-brand-700" : "text-steel-700"}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <form action="/shop/" role="search" className="relative mr-2 hidden xl:block">
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <input id="header-search" name="q" type="search" placeholder="Search materials…" className="field h-14 min-h-0 w-64 py-1.5 pl-10" />
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-500" aria-hidden />
          </form>
          <Link href="/shop/" className="grid size-14 place-items-center rounded-md text-steel-700 hover:bg-steel-100 xl:hidden" aria-label="Search products">
            <Search className="size-5" aria-hidden />
          </Link>
          <Link href="/wishlist/" className="relative grid size-14 place-items-center rounded-md text-steel-700 hover:bg-steel-100" aria-label={`Wishlist (${ready ? wishlist.length : 0})`}>
            <Heart className="size-5" aria-hidden />
            {ready && wishlist.length > 0 && <Badge n={wishlist.length} />}
          </Link>
          <Link href="/cart/" className="relative grid size-14 place-items-center rounded-md text-steel-700 hover:bg-steel-100" aria-label={`Quote list and cart (${cartCount} ${cartCount === 1 ? "item" : "items"})`}>
            <ShoppingCart className="size-5" aria-hidden />
            {cartCount > 0 && <Badge n={cartCount} />}
          </Link>
          <Link href="/cart/" className="btn-primary ml-2 hidden min-h-14 py-2 text-sm md:inline-flex">
            Request a quote
          </Link>
          <button ref={menuButton} type="button" className="grid size-14 place-items-center rounded-md text-steel-800 hover:bg-steel-100 lg:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>
            <Menu className="size-6" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>
    </header>

      {/* Mobile drawer: kept outside <header>, whose backdrop-filter would otherwise become
          the containing block for this fixed element and widen the page on phones. */}
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
            <button ref={closeButton} type="button" className="grid size-14 place-items-center rounded-md hover:bg-steel-100" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
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
                  <Link href={l.href} tabIndex={open ? 0 : -1} className={`flex min-h-14 items-center rounded-md px-3 text-lg font-semibold ${isActive(l.href) ? "bg-brand-50 text-brand-800" : "text-steel-800 hover:bg-steel-100"}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 mb-2 px-3 text-xs font-semibold tracking-wider text-steel-500 uppercase">Categories</p>
            <ul className="space-y-0.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/product-category/${c.slug}/`} tabIndex={open ? 0 : -1} className="flex min-h-14 items-center rounded-md px-3 text-steel-700 hover:bg-steel-100">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-0.5 border-t border-steel-200 pt-4">
              <li>
                <Link href="/track-order/" tabIndex={open ? 0 : -1} className="flex min-h-14 items-center rounded-md px-3 text-steel-700 hover:bg-steel-100">
                  Track an order
                </Link>
              </li>
              <li>
                <a href={`mailto:${site.email}`} tabIndex={open ? 0 : -1} className="flex min-h-14 items-center gap-2 rounded-md px-3 text-steel-700 hover:bg-steel-100">
                  <Mail className="size-4" aria-hidden /> {site.email}
                </a>
              </li>
              <li>
                <a href={telHref(site.phone)} tabIndex={open ? 0 : -1} className="flex min-h-14 items-center gap-2 rounded-md px-3 text-steel-700 hover:bg-steel-100">
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
    </>
  );
}

function Badge({ n }: { n: number }) {
  return <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-signal-400 px-1 text-[0.7rem] leading-5 font-bold text-steel-900">{n}</span>;
}
