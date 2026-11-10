import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { getCategories } from "@/lib/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShopStateProvider } from "@/components/state/ShopState";
import { JsonLd } from "@/components/JsonLd";
import { organizationLd, websiteLd } from "@/lib/seo";

// Site-wide typeface (body, UI and headings); exposed as --font-poppins, see globals.css.
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });

const verification: Metadata["verification"] = {};
if (process.env.GOOGLE_SITE_VERIFICATION) verification.google = process.env.GOOGLE_SITE_VERIFICATION;
if (process.env.BING_SITE_VERIFICATION) verification.other = { "msvalidate.01": process.env.BING_SITE_VERIFICATION };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Scrap Metal, Plastic & Electronic Scrap Supplier`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: site.name, locale: "en_GB", url: "/" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  verification,
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = getCategories().map(({ slug, name }) => ({ slug, name }));
  return (
    <html lang="en-GB" className={poppins.variable}>
      <body className="flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <ShopStateProvider>
          <Header categories={categories} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </ShopStateProvider>
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
      </body>
    </html>
  );
}
