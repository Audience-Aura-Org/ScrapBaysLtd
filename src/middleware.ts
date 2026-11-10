import { NextResponse, type NextRequest } from "next/server";
import legacy from "../data/legacy.json";

/**
 * 1. Old WordPress query-string URLs (?page_id=, ?p=, ?product_cat=, ?product=, ?s=) -> 301 to clean URLs.
 *    Done here rather than in next.config so the old query string is dropped from the target.
 * 2. HTTP Basic auth for /admin and /api/admin (ADMIN_USER / ADMIN_PASSWORD). Admin is disabled if unset.
 */
export const config = {
  runtime: "nodejs",
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};

const ids = legacy as unknown as {
  pageIds: Record<string, string>;
  postIds: Record<string, string>;
  productIds: Record<string, string>;
  categoryIds: Record<string, string>;
};

function legacyTarget(sp: URLSearchParams): string | null {
  const get = (k: string) => sp.get(k)?.trim() || "";
  const pageId = get("page_id");
  if (pageId) return ids.pageIds[pageId] || "/";
  const p = get("p");
  if (p) return ids.postIds[p] || ids.productIds[p] || ids.pageIds[p] || "/";
  const cat = get("product_cat");
  if (cat) return `/product-category/${encodeURIComponent(cat)}/`;
  const product = get("product");
  if (product) return `/product/${encodeURIComponent(product)}/`;
  if (get("post_type") === "product") return get("s") ? `/shop/?q=${encodeURIComponent(get("s"))}` : "/shop/";
  if (get("s")) return `/shop/?q=${encodeURIComponent(get("s"))}`;
  if (get("cat")) return "/blog/";
  return null;
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Scrap Bays admin", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/") {
    if (!searchParams.size) return NextResponse.next();
    const target = legacyTarget(searchParams);
    if (target) return NextResponse.redirect(new URL(target, req.url), 301);
    return NextResponse.next();
  }

  // /admin, /api/admin
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASSWORD || "";
  if (!pass) return new NextResponse("Not found", { status: 404 });
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return unauthorized();
  const [u, ...rest] = Buffer.from(header.slice(6), "base64").toString("utf8").split(":");
  if (!safeEqual(u, user) || !safeEqual(rest.join(":"), pass)) return unauthorized();
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
