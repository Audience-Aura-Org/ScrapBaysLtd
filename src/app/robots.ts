import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Filtered/search/paginated pages carry noindex,follow instead of being blocked here,
        // so crawlers can still see the noindex and follow product links.
        disallow: ["/api/", "/admin/", "/cart/", "/checkout/", "/wishlist/", "/track-order/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
