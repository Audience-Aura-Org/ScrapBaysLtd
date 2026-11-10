import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <section className="container-x py-20 text-center md:py-28">
      <p className="font-display text-7xl font-bold text-brand-700">404</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">This page has been recycled</h1>
      <p className="mx-auto mt-3 max-w-lg text-steel-600">We couldn&apos;t find what you were looking for. It may have moved when we rebuilt our website.</p>
      <form action="/shop/" role="search" className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
        <label htmlFor="nf-q" className="sr-only">
          Search products
        </label>
        <input id="nf-q" name="q" type="search" placeholder="Search materials…" className="field" />
        <button className="btn-primary">Search</button>
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-outline">
          Home
        </Link>
        <Link href="/shop/" className="btn-outline">
          All products
        </Link>
        <Link href="/scrap-material-enquiry/" className="btn-outline">
          Sell your scrap
        </Link>
      </div>
    </section>
  );
}
