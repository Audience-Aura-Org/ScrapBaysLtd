#!/usr/bin/env node
/**
 * One-off importer: captures the old WordPress/WooCommerce site into repo content.
 *
 *   node scripts/import-wordpress.mjs            # fetch (cached in .wp-cache/) + write content
 *   node scripts/import-wordpress.mjs --refresh  # ignore the cache and refetch
 *
 * WARNING: re-running OVERWRITES content/products, content/posts, content/pages (imported
 * pages only), data/categories.json and data/legacy.json. Hand-edits made after the
 * import will be lost. The site itself never talks to WordPress at runtime.
 *
 * Everything fetched is treated as untrusted: the live site currently injects third-party
 * <script> tags into every response, so all HTML is sanitised before conversion.
 */
import fs from "node:fs";
import path from "node:path";
import sanitizeHtml from "sanitize-html";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const BASE = "https://scrapbaysltd.com";
// Mistyped product URLs in the old content -> real products (shared with the 301s in next.config.ts).
const LINK_FIXES = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/link-fixes.json"), "utf8"));
const ROOT = process.cwd();
const CACHE = path.join(ROOT, ".wp-cache");
const REFRESH = process.argv.includes("--refresh");
const UA = "ScrapBay-SiteMigration/1.0";
fs.mkdirSync(CACHE, { recursive: true });

// ---------------------------------------------------------------- fetching
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchText(url) {
  const key = url.replace(/^https?:\/\//, "").replace(/[^a-z0-9._-]+/gi, "_").slice(0, 180);
  const file = path.join(CACHE, key);
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      const text = await res.text();
      if (!res.ok) { if (res.status === 404) return null; throw new Error(`HTTP ${res.status}`); }
      fs.writeFileSync(file, text);
      await sleep(250);
      return text;
    } catch (e) {
      console.warn(`  retry ${attempt} ${url}: ${e.message}`);
      await sleep(1500 * attempt);
    }
  }
  return null;
}
/** The live site prepends injected <script> tags even to JSON. Cut to the first JSON line. */
async function fetchJson(url) {
  const t = await fetchText(url);
  if (!t) return null;
  const i = t.search(/^[[{]/m);
  return JSON.parse(t.slice(i));
}
async function fetchAll(endpoint) {
  const out = [];
  for (let page = 1; page < 20; page++) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const batch = await fetchJson(`${BASE}/wp-json/${endpoint}${sep}per_page=100&page=${page}`);
    // Out-of-range pages return an error object rather than an array. Don't stop on a short
    // page: WordPress can return <100 items when some are filtered (e.g. private media).
    if (!Array.isArray(batch) || !batch.length) break;
    out.push(...batch);
  }
  return out;
}

// ---------------------------------------------------------------- helpers
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©", reg: "®", trade: "™" };
const decode = (s = "") =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
const plain = (html = "") => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
/** The business name is "Scrap Bays Limited"; the old site mixed "Scrap Bay", "Scrap Bay LTD" and "Scrap Bays Ltd". */
const brandName = (s) => s.replace(/Scrap Bays Ltd\b/g, "Scrap Bays Limited").replace(/Scrap Bay LTD/g, "Scrap Bays Limited").replace(/Scrap Bay(?!s)/g, "Scrap Bays");
const writeFile = (p, data) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, p.endsWith(".md") ? brandName(data) : data);
};
function frontmatter(obj) {
  // JSON is valid YAML, so every value is emitted as JSON for safety.
  const lines = Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join("\n")}\n---\n`;
}

// ---------------------------------------------------------------- media
const media = await fetchAll("wp/v2/media");
const mediaById = new Map(media.map((m) => [m.id, m]));
const mediaByPath = new Map();
for (const m of media) {
  const p = (m.source_url.match(/\/wp-content\/uploads\/(.+)$/) || [])[1];
  if (p) mediaByPath.set(decodeURI(p), m);
}
const downloads = new Map(); // uploads-relative path -> absolute source url
/** Map any uploads URL (live, staging or relative; resized or not) to /media/<y>/<m>/<file>. */
function mediaUrl(url) {
  if (!url) return null;
  const m = url.match(/\/wp-content\/uploads\/([^?#"')\s]+)/);
  if (!m) return null;
  let rel = decodeURI(m[1]);
  const original = rel.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, "$1").replace(/-scaled(\.[a-z0-9]+)$/i, "$1");
  if (original !== rel && mediaByPath.has(original)) rel = original;
  downloads.set(rel, `${BASE}/wp-content/uploads/${encodeURI(rel)}`);
  return `/media/${rel}`;
}
function imageInfo(id, fallbackUrl, alt) {
  const m = mediaById.get(id);
  const src = mediaUrl(m?.source_url || fallbackUrl);
  if (!src) return null;
  return {
    src,
    alt: decode(alt || m?.alt_text || plain(m?.title?.rendered || "")),
    width: m?.media_details?.width || undefined,
    height: m?.media_details?.height || undefined,
  };
}

// ---------------------------------------------------------------- HTML -> Markdown
const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "_" });
td.use(gfm);
td.keep([]);
const legacyIds = { page: {}, post: {}, product: {} }; // filled below, used for ?page_id= links in content

function rewriteLink(href) {
  if (!href) return href;
  try {
    const u = new URL(href, BASE);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "scrapbaysltd.com" || host.endsWith("hostingersite.com") || host === "deskly.audienceaura.org") {
      if (u.pathname.startsWith("/wp-content/uploads/")) return mediaUrl(u.href);
      const pid = u.searchParams.get("page_id") || u.searchParams.get("p");
      if (pid && (legacyIds.page[pid] || legacyIds.post[pid] || legacyIds.product[pid]))
        return legacyIds.page[pid] || legacyIds.post[pid] || legacyIds.product[pid];
      if (u.searchParams.get("product_cat")) return `/product-category/${u.searchParams.get("product_cat")}/`;
      const slug = u.pathname.replace(/^\/|\/$/g, "");
      if (PAGE_HANDLING[slug]) return PAGE_HANDLING[slug] + (u.hash || ""); // retired page -> its redirect target
      if (LINK_FIXES[u.pathname]) return LINK_FIXES[u.pathname] + (u.hash || ""); // mistyped product links
      return u.pathname + (u.search || "") + (u.hash || "");
    }
    return u.href;
  } catch { return href; }
}

function cleanHtml(html) {
  const clean = sanitizeHtml(html, {
    allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "ul", "ol", "li", "strong", "b", "em", "i", "a", "img", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption", "code", "pre", "sup", "sub"],
    allowedAttributes: { a: ["href", "title"], img: ["src", "alt", "width", "height"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    exclusiveFilter: (frame) => frame.tag === "a" && !frame.text.trim() && !frame.mediaChildren?.length,
    transformTags: {
      a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, href: rewriteLink(attribs.href) } }),
      img: (tag, attribs) => {
        const src = attribs["data-src"] || attribs.src;
        return { tagName: "img", attribs: { ...attribs, src: mediaUrl(src) || src } };
      },
      h1: "h2", // the page template owns the single <h1>
    },
  });
  return clean;
}
function toMarkdown(html) {
  return td.turndown(cleanHtml(html)).replace(/\n{3,}/g, "\n\n").replace(/[ \t]+$/gm, "").trim() + "\n";
}

/** Pull a "Technical Specifications" style 2-column table out of a description. */
function extractSpecs(html) {
  const re = /(<h[1-6][^>]*>[^<]*specification[^<]*<\/h[1-6]>\s*)?<table[\s\S]*?<\/table>/i;
  const m = html.match(re);
  if (!m) return { specs: [], html };
  const rows = [...m[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => plain(c[1])));
  const specs = rows.filter((r) => r.length === 2 && r[0] && !/^specification$/i.test(r[0]) && !/^(parameter|property)$/i.test(r[0]));
  if (specs.length < 2) return { specs: [], html };
  return { specs, html: html.replace(m[0], "") };
}

/** Rank Math meta + related products from the rendered HTML page. */
function parsePage(html) {
  if (!html) return {};
  const head = html.slice(0, html.indexOf("</head>"));
  const meta = (n) => decode((head.match(new RegExp(`<meta[^>]+(?:name|property)="${n}"[^>]+content="([^"]*)"`, "i")) || [])[1] || "");
  const related = [];
  const relIdx = html.search(/<section[^>]+class="[^"]*related products/i);
  if (relIdx > -1) {
    const sec = html.slice(relIdx, html.indexOf("</section>", relIdx));
    for (const m of sec.matchAll(/href="https:\/\/scrapbaysltd\.com\/product\/([^/"]+)\/"/g)) if (!related.includes(m[1])) related.push(m[1]);
  }
  return { title: decode((head.match(/<title>([^<]*)<\/title>/) || [])[1] || ""), description: meta("description"), related };
}

// ---------------------------------------------------------------- categories
console.log("Fetching categories…");
const storeCats = await fetchJson(`${BASE}/wp-json/wc/store/v1/products/categories?per_page=100`);
const wpCats = await fetchAll("wp/v2/product_cat");
// Display-name fixes: "Meral Scrap" typo (the old menu already said "Metal scrap"), and the
// homepage's "Metal Ignots" heading. Slugs are kept unchanged so URLs keep working.
const CAT_NAME_FIX = { meralscrap: "Metal Scrap", metalingot: "Metal Ingots" };
const CAT_ORDER = ["meralscrap", "metalingot", "electronicscrap", "motorpartsscrap", "plastic-scrap", "woods", "others"];

// ---------------------------------------------------------------- products
console.log("Fetching products…");
const storeProducts = await fetchAll("wc/store/v1/products");
const wpProducts = await fetchAll("wp/v2/product");
const productTags = await fetchAll("wp/v2/product_tag");
const tagById = new Map(productTags.map((t) => [t.id, { slug: t.slug, name: decode(t.name) }]));
for (const p of wpProducts) legacyIds.product[p.id] = `/product/${p.slug}/`;

// ---------------------------------------------------------------- pages & posts
console.log("Fetching pages and posts…");
const pages = await fetchAll("wp/v2/pages");
const posts = await fetchAll("wp/v2/posts");
for (const p of pages) legacyIds.page[p.id] = p.slug === "home" ? "/" : `/${p.slug}/`;
for (const p of posts) legacyIds.post[p.id] = `/${p.slug}/`;

// Pages we rebuild by hand or retire. Value = redirect target (null = rebuilt at same URL).
const PAGE_HANDLING = {
  home: null, shop: null, blog: null, checkout: null,
  "scrap-material-enquiry": null, // rebuilt as a standalone enquiry form (old page was the cart)
  "privacy-policy": null, "condition-of-use": null, refund_returns: null, // redrafted (were another company's template)
  "my-account": "/track-order/",
  others: "/product-category/others/", // empty page
  "elementor-page-912": "/about-us/", // the old About Us page
  "compressor-scraps-2": "/compressor-scraps/", // exact duplicate
  "copper-wire-scrap": "/product/copper-wire-scrap-99-99/", // "Pillar Page SEO Setup" draft (Millbury brand copy)
  "edge-ai": "/", workpod: "/", "office-chairs": "/", smartdesk: "/", // leftovers from a furniture template
};
// Post slug that is shadowed by a page with the same slug on the old site (the page won).
const POST_SLUG_FIX = { "abs-scrap": "abs-scrap-acrylonitrile-butadiene-styrene" };

const htmlCache = {};
async function pageHtml(url) { return (htmlCache[url] ??= await fetchText(url)); }

// ---------------------------------------------------------------- write products
const contentDir = path.join(ROOT, "content");
for (const d of ["products", "posts", "pages/imported"]) {
  const dir = path.join(contentDir, d);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

const wpProdBySlug = new Map(wpProducts.map((p) => [p.slug, p]));
const unitFor = (slug, cat) =>
  /bullion|bar$|-bar-|gold|silver|indium/.test(slug) ? "kg"
    : /used-mobile-phone|fairly-used-tires/.test(slug) ? "units"
      : cat === "woods" ? "m³" : "tonnes";

const report = { products: 0, pages: 0, posts: 0, categories: 0, images: 0, notes: [] };
let order = 0;
for (const sp of storeProducts) {
  const wp = wpProdBySlug.get(sp.slug);
  const live = parsePage(await pageHtml(`${BASE}/product/${sp.slug}/`));
  const { specs, html } = extractSpecs(sp.description || wp?.content?.rendered || "");
  const minor = sp.prices?.currency_minor_unit ?? 2;
  const price = sp.prices?.price && sp.prices.price !== "0" ? Number(sp.prices.price) / 10 ** minor : null;
  const category = sp.categories?.[0]?.slug || "others";
  const fm = {
    name: decode(sp.name),
    slug: sp.slug,
    legacyId: sp.id,
    category,
    price,
    currency: sp.prices?.currency_code || "GBP",
    unit: unitFor(sp.slug, category),
    stock: sp.is_in_stock ? "in_stock" : "out_of_stock",
    sku: sp.sku || undefined,
    shortDescription: plain(sp.short_description) || undefined,
    // WooCommerce often repeats the featured image in the gallery: keep each file once.
    images: sp.images
      .map((im) => imageInfo(im.id, im.src, im.alt))
      .filter((img, i, all) => img && all.findIndex((x) => x?.src === img.src) === i),
    specs,
    tags: (wp?.product_tag || []).map((id) => tagById.get(id)).filter(Boolean),
    related: live.related?.length ? live.related : undefined,
    seoTitle: live.title ? live.title.replace(/\s*[-|–]\s*Scrap Bay LTD\s*$/i, "") : undefined,
    seoDescription: live.description || undefined,
    featured: ["woods", "metalingot"].includes(category) ? true : undefined,
    order: order++,
    date: wp?.date_gmt ? wp.date_gmt + "Z" : undefined,
    updated: wp?.modified_gmt ? wp.modified_gmt + "Z" : undefined,
  };
  writeFile(path.join(contentDir, "products", `${sp.slug}.md`), frontmatter(fm) + "\n" + toMarkdown(html));
  report.products++;
}

// ---------------------------------------------------------------- write categories
const firstImageByCat = {};
for (const sp of storeProducts) {
  const c = sp.categories?.[0]?.slug;
  if (c && !firstImageByCat[c] && sp.images[0]) firstImageByCat[c] = imageInfo(sp.images[0].id, sp.images[0].src, sp.images[0].alt);
}
const categories = storeCats
  .map((c) => {
    const wpc = wpCats.find((w) => w.id === c.id);
    return {
      slug: c.slug,
      name: CAT_NAME_FIX[c.slug] || decode(c.name),
      legacyName: decode(c.name),
      legacyId: c.id,
      description: plain(c.description || wpc?.description || ""),
      image: c.image ? imageInfo(c.image.id, c.image.src, c.image.alt) : firstImageByCat[c.slug] || null,
    };
  })
  .sort((a, b) => CAT_ORDER.indexOf(a.slug) - CAT_ORDER.indexOf(b.slug));
report.categories = categories.length;
writeFile(path.join(ROOT, "data", "categories.json"), JSON.stringify(categories, null, 2) + "\n");

// ---------------------------------------------------------------- write pages
const keptPages = [];
const about = pages.find((p) => p.slug === "elementor-page-912");
for (const p of pages) {
  if (p.status !== "publish") continue;
  if (p.slug in PAGE_HANDLING) continue;
  const live = parsePage(await pageHtml(p.link));
  let title = decode(p.title.rendered).replace(/^Title:\s*/i, ""); // stray "Title:" prefix (used-rails)
  writeFile(
    path.join(contentDir, "pages", "imported", `${p.slug}.md`),
    frontmatter({
      title,
      slug: p.slug,
      legacyId: p.id,
      seoTitle: live.title ? live.title.replace(/^Title:\s*/i, "").replace(/\s*[-|–]\s*Scrap Bay LTD\s*$/i, "") : undefined,
      seoDescription: live.description || undefined,
      date: p.date_gmt + "Z",
      updated: p.modified_gmt + "Z",
    }) + "\n" + toMarkdown(p.content.rendered),
  );
  keptPages.push(p.slug);
  report.pages++;
}
if (about) {
  writeFile(
    path.join(contentDir, "pages", "about-us.md"),
    frontmatter({ title: "About Us", slug: "about-us", legacyId: about.id, seoDescription: undefined, updated: about.modified_gmt + "Z" }) +
      "\n" +
      toMarkdown(about.content.rendered)
        // Elementor's bold paragraphs were used as headings.
        .replace(/^\*\*([^*\n]+)\*\*$/gm, "## $1")
        .replace(/^## About Us\n+/m, "")
        .replace(/^\* \* \*\n+/gm, "")
        .replace(/^## (Driving[^\n]*)$/m, "**$1**")
        // The category list came through as empty headings; link to the live list instead.
        .replace(/## Our Product Categories[\s\S]*?(?=## A Sustainable Future)/, "## Our Product Categories\n\nWe trade metal scrap, metal ingots, electronic scrap, motor parts scrap, plastic scrap, timber and other recyclable materials. [Browse all categories](/shop/).\n\n"),
  );
  report.pages++;
}

// ---------------------------------------------------------------- write posts
for (const p of posts) {
  if (p.status !== "publish") continue;
  const slug = POST_SLUG_FIX[p.slug] || p.slug;
  const live = parsePage(await pageHtml(p.link));
  const fm = {
    title: decode(p.title.rendered).trim(),
    slug,
    legacySlug: slug !== p.slug ? p.slug : undefined,
    legacyId: p.id,
    date: p.date_gmt + "Z",
    updated: p.modified_gmt + "Z",
    excerpt: plain(p.excerpt.rendered).replace(/\s*\[…\]$/, "…") || undefined,
    image: p.featured_media ? imageInfo(p.featured_media) : undefined,
    seoTitle: live.title ? live.title.replace(/\s*[-|–]\s*Scrap Bay LTD\s*$/i, "") : undefined,
    seoDescription: live.description || undefined,
  };
  writeFile(path.join(contentDir, "posts", `${slug}.md`), frontmatter(fm) + "\n" + toMarkdown(p.content.rendered));
  report.posts++;
}

// ---------------------------------------------------------------- homepage hero slideshow
const homeHtml = await pageHtml(`${BASE}/`);
const heroIds = [...decode(homeHtml || "").matchAll(/"id":(\d+),"url":"[^"]*wp-content[^"]*"/g)].map((m) => Number(m[1]));
const hero = [...new Set(heroIds)].map((id) => imageInfo(id)).filter(Boolean);
writeFile(path.join(ROOT, "data", "legacy-hero.json"), JSON.stringify(hero, null, 2) + "\n");

// ---------------------------------------------------------------- brand assets
const brand = mediaById.get(1121) || mediaById.get(1095);
const brandSrc = brand ? mediaUrl(brand.source_url) : null;

// ---------------------------------------------------------------- legacy URL map (redirects)
const legacy = {
  pageIds: Object.fromEntries(pages.map((p) => [p.id, p.slug in PAGE_HANDLING ? PAGE_HANDLING[p.slug] || legacyIds.page[p.id] : legacyIds.page[p.id]])),
  postIds: Object.fromEntries(posts.map((p) => [p.id, `/${POST_SLUG_FIX[p.slug] || p.slug}/`])),
  productIds: Object.fromEntries(wpProducts.map((p) => [p.id, `/product/${p.slug}/`])),
  categoryIds: Object.fromEntries(storeCats.map((c) => [c.id, `/product-category/${c.slug}/`])),
  redirects: Object.entries(PAGE_HANDLING).filter(([, to]) => to).map(([slug, to]) => ({ from: `/${slug}/`, to })),
  brandIcon: brandSrc,
};
writeFile(path.join(ROOT, "data", "legacy.json"), JSON.stringify(legacy, null, 2) + "\n");

// ---------------------------------------------------------------- download media
console.log(`Downloading ${downloads.size} media files…`);
const failed = [];
const queue = [...downloads.entries()];
async function worker() {
  while (queue.length) {
    const [rel, url] = queue.shift();
    const dest = path.join(ROOT, "public", "media", rel);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { report.images++; continue; }
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || !/^(image|video)\//.test(type)) throw new Error(`HTTP ${res.status} ${type}`);
      writeFile(dest, Buffer.from(await res.arrayBuffer()));
      report.images++;
    } catch (e) { failed.push(`${rel} (${e.message})`); }
  }
}
await Promise.all([1, 2, 3, 4].map(worker));

const unreferenced = media.filter((m) => {
  const p = (m.source_url.match(/\/wp-content\/uploads\/(.+)$/) || [])[1];
  return p && !downloads.has(decodeURI(p));
});
report.notes.push(`media library: ${media.length} items, ${downloads.size} referenced by migrated content, ${unreferenced.length} unreferenced (not downloaded)`);
report.notes.push(...failed.map((f) => `FAILED download: ${f}`));
writeFile(path.join(ROOT, "data", "import-report.json"), JSON.stringify({ ...report, keptPages, unreferenced: unreferenced.map((m) => m.source_url), generated: new Date().toISOString() }, null, 2) + "\n");
console.log(JSON.stringify({ ...report, notes: report.notes }, null, 2));
