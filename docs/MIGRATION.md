# WordPress → Next.js migration notes (November 2026)

## Captured

| Type | Count | Source |
| --- | --- | --- |
| Products | 84 (all simple, all in stock, **none priced**) | WooCommerce Store API + `wp/v2/product` + each product page (related products, Rank Math title/description) |
| Product categories | 7 | Store API (`meralscrap`, `metalingot`, `electronicscrap`, `motorpartsscrap`, `plastic-scrap`, `woods`, `others`) |
| Product tags | 430 | `wp/v2/product_tag` (kept as `/product-tag/<slug>/`, noindex) |
| Technical spec tables | extracted from descriptions into `specs` | product descriptions |
| Material landing pages | 50 | `wp/v2/pages` → `content/pages/imported/` |
| About Us | 1 | old `/elementor-page-912/` → `/about-us/` |
| Blog posts | 11 | `wp/v2/posts` |
| Images | 99 files (31 MB) in `public/media/<year>/<month>/` | every image referenced by migrated content |

Not migrated: 235 media-library items that nothing on the new site uses (mostly stock furniture/office photos and 19 videos from a previous template), the WooCommerce cart/checkout/my-account pages (rebuilt), and resized image variants (`…-300x300.jpg`; the redirect from `/wp-content/uploads/` only covers original files).

## Security warning: the live WordPress site is compromised

Every response from scrapbaysltd.com, including JSON and XML sitemaps, starts with injected `<script>` tags loading from `bicea.org` and `afders.org`, placed before the document itself. This is typical of malware in a theme/plugin file or the database. The importer stripped it and sanitised all HTML; nothing from it is in this repo. Until DNS is switched, visitors to the old site are exposed. Clean or take down the WordPress install, and rotate the WordPress, hosting and email passwords.

## Fixed during migration (as requested)

- "Metal **Ignots**" → "Metal Ingots" (homepage heading).
- "**Acre Metals Ltd**" → "Scrap Bay Limited" (homepage value block).
- Stray "**Title:**" prefix removed from the Used Rails page title.
- Duplicate **Compressor Scraps** pages: `/compressor-scraps-2/` 301 → `/compressor-scraps/`.
- "**Copper Wire Scrap — Pillar Page SEO Setup**" (`/copper-wire-scrap/`) dropped: it was a draft written for another brand ("Millbury Copper Wire Scrap", with "Body Description" placeholders). 301 → `/product/copper-wire-scrap-99-99/`.
- Privacy Policy, Condition of Use, Refund & Returns: the old text belonged to another business ("Deskly", `deskly.audienceaura.org`). **Replaced with new B2B drafts. Have them reviewed by a solicitor.**
- Furniture-template leftovers `/edge-ai/`, `/smartdesk/`, `/office-chairs/`, `/workpod/` → 301 to the homepage. The empty `/others/` page → the Others category.
- The old "Scrap Material Enquiry" page was actually the WooCommerce cart (with an office-desk banner and the title "Scrap Material Enquiry**qz**"); it's now a real enquiry form.

## Also changed (minor, listed for transparency)

- Category display name "**Meral** Scrap" → "Metal Scrap" (slug `meralscrap` unchanged; the old menu already said "Metal scrap"). "Metal Ingot" → "Metal Ingots".
- The blog post `abs-scrap` was unreachable on the old site (a page with the same slug won), so the post moved to `/abs-scrap-acrylonitrile-butadiene-styrene/`.
- The About page's "Our Product Categories" block came through as empty headings; replaced with one sentence and a link to the shop.
- Homepage hero: the old slideshow images were 380–800 px wide and would blur at full width, so the hero now uses higher-resolution product photos (`data/home.json`; the old list is in `data/legacy-hero.json`).

## Odd things found and left as they are (please decide)

1. **Outbound links to other scrap dealers.** 83 of 84 product descriptions, plus many landing pages, link to external sites: 314 links to 229 domains, including competitors (jbscrap.com, recycleinme.com, chaspughscrapmetal.co.uk, scrapo.com…). 94 links carry ad or tracking parameters (`gclid`, `gad_source`, `srsltid`). Many internal links have the wrong anchor text, e.g. "HMS Scrap" linking to the copper cathode and copper ore products. This looks like an SEO link-insertion job gone wrong, or spam, and it sends visitors to competitors. Recommend removing these links.
2. **"Why Choose ?"** headings with the product name missing in 9 files, and sentences using a bold "**it**" where a keyword was blanked out.
3. **About Us** says "Founded in **2021**" and "With **over a decade** of experience". It also mentions "contributing to **Africa's** industrial and environmental progress" for a UK company.
4. **Typos:** "WWood Netherlands Supply" (`/wood-netherlands/`).
5. **Near-duplicate content:** `/ldpe-plastic-film-scrap/` vs `/ldpe-plastic-film-scrap-2/`; products `ac-fridge-compressor-scrap` vs `fridge-ac-compressor-scraps`.
6. **Location doorway pages** ("Ferrous Scrap London", "Wood Netherlands", "Metal Ingots Saudi Arabia", "Electronic Scrap Canada", "Automotive Scrap China", "Other Scrap USA") are near-template pages. Google may treat them as doorway pages.
7. **Currency** on the old shop was **USD** for a UK company. Kept as USD (no prices are set anyway).
8. **Caluanie Muelear Oxidize** is widely reported as a non-existent "metal crushing" chemical used in advance-fee scams. Kept at your request, but it can hurt trust with banks, payment providers and Google.
9. 25 products have no short description (the page falls back to the start of the description).
10. The favicon/logo file is named "ChatGPT-Image-Oct-28-2025…". Kept as the logo; consider a proper vector logo.
11. No registered address or company number is published. UK companies must show their registered number and office on their website.
