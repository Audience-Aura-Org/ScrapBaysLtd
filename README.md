# Scrap Bays Limited — website

Standalone Next.js 15 storefront for **scrapbaysltd.com**, replacing the old WordPress / WooCommerce / Elementor site. All content (products, categories, pages, blog posts, images) lives in this repository; nothing talks to WordPress at runtime.

- **Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4 (+ Typography for blog posts), nodemailer, zod
- **Typeface:** Poppins everywhere (body and headings), via `next/font/google`. Headings use their own `font-heading` token in `src/app/globals.css`, so they can be switched independently.
- **80% zoom:** the whole site renders at `zoom: 0.8` (`--zoom` in `globals.css`). When adding UI, size anything with a real-pixel minimum as *target ÷ 0.8*: form inputs are 20px (16px on screen, so iOS doesn't zoom in), tap targets at least 56px / `min-h-14` (≈45px on screen).
- **Rendering:** every product, category, page and post is statically generated at build time. Only `/shop/` (search/filter/sort), the form APIs and `/admin/` render per request.
- **No database.** Orders and enquiries are saved as JSON files (see [Orders & enquiries](#orders--enquiries)).

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in SMTP_PASS etc.
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (forces `NODE_ENV=production`, see [Deployment](#deployment-hostinger)) |
| `npm start` | Production server (forces `NODE_ENV=production`, honours `PORT`) |
| `npm run mail:test` | Checks SMTP login and sends a test email (`npm run mail:test -- you@example.com`) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run import:wp` | Re-imports content from the old WordPress site (**overwrites** imported content — see below) |

Node.js 20.9 or newer (22 LTS recommended).

---

## Environment variables

All variables are documented in [`.env.example`](.env.example). Locally put them in `.env.local`; on Hostinger add them in hPanel.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public URL (canonicals, sitemap, emails). Default `https://scrapbaysltd.com`. *Build-time.* |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE` | Contact details shown on the site. *Build-time.* |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Titan Mail: `smtp.titan.email`, `465`, `true`, full mailbox address, mailbox password |
| `MAIL_FROM` | Sender. Titan only allows the authenticated mailbox, e.g. `"Scrap Bays Limited <info@scrapbaysltd.com>"` |
| `MAIL_TO` | Where new orders/enquiries are sent (comma-separated for several) |
| `MAIL_BCC` | Optional hidden copy of business notifications |
| `BANK_DETAILS` | Bank details printed in order confirmations (`\n` for new lines). Empty = omitted |
| `STORAGE_DIR` | Folder for saved orders/enquiries and uploaded photos. **On Hostinger, use a folder outside the app directory** |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Login for `/admin/orders/`. Admin is disabled (404) while the password is empty |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | Optional Search Console / Bing Webmaster verification codes. *Build-time.* |

*Build-time* variables are baked into the static pages, so rebuild/redeploy after changing them. If SMTP isn't configured, submissions are still saved and the email step is logged as "skipped".

---

## Editing content

Content is Markdown with a small front-matter header. Edit the file, commit, push to `main`, and Hostinger rebuilds the site.

### Products — `content/products/<slug>.md`

The file name/`slug` is the URL: `/product/<slug>/`.

```yaml
---
name: "Copper Ingots – Premium Quality High-Purity Copper Metal Ingots for Sale"
slug: "copper-ingots"
category: "metalingot"          # a slug from data/categories.json
price: null                     # null = "Request a quote"; a number = priced (can be ordered online)
currency: "USD"
unit: "tonnes"                  # tonnes | kg | units | m³ — price is per this unit
stock: "in_stock"               # in_stock | out_of_stock | on_request
shortDescription: "Optional one-paragraph summary shown next to the gallery"
images: [{"src":"/media/2025/10/copper-inqot.jpeg","alt":"Copper ingots","width":1200,"height":1078}]
specs: [["Purity","99.9%"],["Form","Ingot"]]   # "Technical specifications" table
tags: [{"slug":"copper-ingots","name":"Copper Ingots"}]
related: ["copper-cathode","copper-ore"]       # optional; otherwise same-category products
seoTitle: "Optional <title> (\" | Scrap Bays Limited\" is added automatically)"
seoDescription: "Optional meta description (otherwise generated from the text)"
featured: true                  # optional
order: 20                       # sort position in "Featured" order
---

Markdown description: ## headings, lists, **bold**, [links](/shop/), tables…
```

- The name text before " – " is used as the short title on cards; the rest becomes the subtitle.
- Put images in `public/media/<year>/<month>/` and reference them as `/media/...`. Include `width`/`height` when you know them.
- **To price a product**, set `price: 8500` (number, no currency symbol). It then shows the price, and customers whose cart contains only priced products can check out. Products without a price always go through a quote request.
- To remove a product, delete its file and add a redirect for its old URL in `next.config.ts`.

### Categories — `data/categories.json`

`slug` (URL: `/product-category/<slug>/`), `name`, `description` and `image`. Slugs are kept from the old site (`meralscrap`, `metalingot`, …) so old links keep working; change the `name`, not the slug.

### Homepage — `data/home.json`

Hero text and slides, the featured product rows (by category) and the four value blocks. Each slide has a `src` (the commissioned banner in `public/images/hero/`) and a `fallback` photo; the homepage uses `src` as soon as that file exists (rebuild after adding it).

### Images still to be produced — `IMAGE_BRIEFS.md`

Briefs (exact path, size and a ready-to-paste prompt) for the new homepage banners and for blog posts whose featured images are too small. Drop each generated file at its path and rebuild; nothing else needs changing.

### Pages — `content/pages/*.md` and `content/pages/imported/*.md`

URL is `/<slug>/`. `about-us.md` and the three policies (`privacy-policy.md`, `condition-of-use.md`, `refund_returns.md`) are hand-maintained; `imported/` holds the material landing pages carried over from WordPress. Front matter: `title`, `slug`, optional `seoTitle`, `seoDescription`, `updated`, and `kind: "policy"` for legal pages (shows "Last updated").

### Blog posts — `content/posts/<slug>.md`

URL is `/<slug>/` (same as WordPress). Front matter: `title`, `slug`, `date` (ISO, e.g. `"2026-11-10T09:00:00Z"`), optional `updated`, `excerpt`, `image` (`{"src","alt","width","height"}`), `seoTitle`, `seoDescription`, and:

- `category` — product-category slug the post is about (shown above the title, drives related posts and the CTA box);
- `product` — product slug for the CTA button (optional);
- `plannedImage` — path of a commissioned featured image (see `IMAGE_BRIEFS.md`); used automatically once the file exists, otherwise `image` is shown.

Posts are listed newest first, 10 per page. The post page adds reading time, share links, related posts and the CTA automatically. A short line directly under an image becomes its caption. Keep `category`/`product`/`plannedImage` in sync with `data/post-meta.json`, which the importer merges back in.

> A page and a post must not share a slug — both live at `/<slug>/`.

### Re-running the WordPress import

`npm run import:wp` re-fetches the old site (cached in `.wp-cache/`, `--refresh` to refetch) and **overwrites** `content/products/`, `content/posts/`, `content/pages/imported/`, `data/categories.json`, `data/legacy.json` and `data/legacy-hero.json`. Only do this while the old site is still the source of truth; afterwards, edit the files here instead. Hand-made fixes (category names, About page, removed pages) are encoded in the importer, but anything edited by hand after import will be lost.

---

## Orders & enquiries

There are three kinds of submission. Each gets a reference number and is saved, emailed to the business, and confirmed to the customer.

| Form | Where | Reference | Notes |
| --- | --- | --- | --- |
| **Quote request** | `/cart/` (the quote list) | `SBQ-YYMMDD-XXXXX` | Any products, quantity + unit per line, company/contact details |
| **Order** | `/checkout/` | `SBO-YYMMDD-XXXXX` | Only when every cart item has a price. Paid offline: bank transfer (pro-forma invoice) or invoice. No card processing. Prices are recalculated on the server from the content files |
| **Scrap material offer** | `/scrap-material-enquiry/` | `SBS-YYMMDD-XXXXX` | For people *selling* scrap: material, quantity, location, up to 5 photos (5 MB each), attached to the business email |

**Flow:** browser → `/api/enquiry|order|sell/` → validation (zod) → saved to `STORAGE_DIR/records/<ref>.json` (photos in `STORAGE_DIR/uploads/<ref>/`) → email to `MAIL_TO` (Reply-To is the customer) → confirmation email to the customer with a tracking link.

**Tracking:** customers enter their reference and email at `/track-order/`.

**Updating status:** open `/admin/orders/` (HTTP Basic auth with `ADMIN_USER` / `ADMIN_PASSWORD`), pick a status (Received → In review → Quote sent → Awaiting payment → Payment received → Processing → Shipped → Completed / Cancelled), add an optional note, and tick "Email customer" to notify them.

**Spam protection on every form:** server-side validation, a hidden honeypot field plus a minimum fill time (bots get a fake success and nothing is stored or sent), a same-origin check, and per-IP rate limiting (5 submissions per 10 minutes per form; 20 lookups for tracking). The rate limiter is in memory, which is fine for a single Node process.

The quote list/cart and the wishlist are stored in the visitor's browser (localStorage).

---

## SEO

- Titles `Page | Scrap Bays Limited`, meta descriptions (from front matter, or generated from the text), canonicals, Open Graph/Twitter tags. Default social image: `/og.png` (branded, generated at build); product and blog pages use their own photo.
- JSON-LD: Organization + LocalBusiness and WebSite + SearchAction on every page; Product (with `Offer` only when a price exists), BreadcrumbList, BlogPosting.
- `/sitemap.xml` (with images and lastmod), `/robots.txt`, `/manifest.webmanifest`, icons.
- `noindex,follow` on shop search/filter/sort/pagination URLs, blog page 2+, tag pages, cart, checkout, wishlist and tracking.
- Old URLs: every product, category, page and post keeps its WordPress URL (with trailing slash). Retired pages, `?page_id=`, `?p=`, `?product_cat=`, `?s=`, `/wp-content/uploads/...` and the old sitemap names are 301-redirected (`next.config.ts`, `src/middleware.ts`, `data/legacy.json`).

---

## Deployment (Hostinger)

Hostinger's Node.js hosting deploys from the GitHub `main` branch.

1. In hPanel → **Websites → Add website → Node.js app**, connect the GitHub repository and choose branch `main`.
2. Settings:
   - **Node version:** 22.x (20.9+ works)
   - **Install command:** `npm ci` (or `npm install`)
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Output directory / entry file:** leave at default (Next.js)
3. Add the environment variables from `.env.example`. At minimum: `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`, `STORAGE_DIR` (e.g. `/home/<your-user>/scrapbay-storage`, outside the app folder so deploys don't wipe it), `ADMIN_PASSWORD`, and `BANK_DETAILS` if you want them in order emails.
4. Deploy. After the first deploy, run `npm run mail:test` from the hPanel terminal/SSH (or submit a test enquiry) to confirm email works.
5. Point the domain at the app, then submit `https://scrapbaysltd.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

**Why `npm run build` / `npm start` go through `scripts/next-prod.mjs`:** Hostinger injects a non-production `NODE_ENV`. `next build` under a non-standard `NODE_ENV` fails while prerendering `/404` with `<Html> should not be imported outside of pages/_document`. The wrapper always runs Next with `NODE_ENV=production`, so don't change the build/start commands to call `next` directly. If a build fails, the wrapper retries once with a clean `.next`: a folder left by a failed or interrupted build can otherwise break the next build with `Invariant: no direct app page entry found for /_not-found`.

**Locally:** `npm run dev` and `npm run build`/`npm start` share the `.next` folder, so running the dev server replaces the production build. Stop one before using the other.

**Before switching DNS away from WordPress:** the old site is injecting third-party scripts (see the migration notes in `docs/MIGRATION.md`). Don't copy anything from the old server other than what's in this repo.
