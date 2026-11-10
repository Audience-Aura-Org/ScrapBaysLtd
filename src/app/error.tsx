"use client";

import Link from "next/link";
import { useEffect } from "react";
import { site, telHref } from "@/lib/site";

/** Shown if a page throws while rendering. Details stay in the server/browser logs. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container-x py-20 text-center md:py-28">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Sorry, this page didn&apos;t load properly</h1>
      <p className="mx-auto mt-3 max-w-lg text-steel-600">
        Please try again. If it keeps happening, contact us at{" "}
        <a href={`mailto:${site.email}`} className="font-semibold text-brand-700 underline">
          {site.email}
        </a>{" "}
        or{" "}
        <a href={telHref(site.phone)} className="font-semibold text-brand-700 underline">
          {site.phone}
        </a>
        .
      </p>
      {error.digest && <p className="mt-2 text-xs text-steel-500">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Home
        </Link>
      </div>
    </section>
  );
}
