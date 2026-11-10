# Frontend QA audit — November 2026

Production build (`npm run build && npm start`) tested in Chrome at 1440, 1024, 768 and 390 px.
Covered: home, shop (incl. filtered), all 7 categories, 5 products (priced/unpriced), tag page, blog index + page 2,
2 posts, About, 3 landing pages, enquiry, 3 policies, cart, checkout, tracking, wishlist, 3 kinds of 404.
Link crawl: 791 internal URLs (606 HTML/XML pages, sitemap entries and every image).
`next lint`, `eslint` and `tsc --noEmit`: clean. No hydration errors, no console errors (apart from the
expected 404 document response), no failed asset requests, no broken images, no horizontal scroll,
no placeholder/lorem text, no leftover WordPress shortcodes or raw HTML.

## Issues found (before fixes)

### High: broken behaviour a customer would hit
1. **Rate limiter counts invalid submissions.** A customer who makes 5 typos in 10 minutes is locked out of the
   quote/order/sell form ("Too many submissions") before ever submitting successfully.
2. **Shop filters get out of sync with back/forward.** After changing Category/Sort and pressing Back, the URL and
   results revert but the selects keep the newer values (uncontrolled inputs aren't reset).
3. **Server failures show no useful message.** If saving fails, the API returns an empty 500, so the form says only
   "Something went wrong" with no fallback contact. A slow SMTP server also blocks the response indefinitely
   (no timeouts).
4. **Product quantity accepts out-of-range values.** `99,999,999` can be added (the server then rejects the whole enquiry
   with an error key the form doesn't display); `-5` is silently turned into `5`; `0`/`abc` disable the button
   with no explanation. The cart quantity field also accepts 5,000,000.
5. **Wrong business name.** "Scrap Bay" / "Scrap Bay Limited" / "Scrap Bay LTD" / "Scrap Bays Ltd" on every page
   (logo, titles, footer, JSON-LD, emails, content). Should be **Scrap Bays Limited** (short: **Scrap Bays**).

### Medium: broken content or accessibility
6. **6 broken internal links** in imported content (slugs that never existed on the old site either):
   `/product/aluminium-ubc-scrap/`, `/product/beach-wood-logs/`, `/product/european-black-walnut/`,
   `/product/douglas-fir-wood-logs-copy/`, `/product/cpu-gold-processor/`, `/product/weee-scrap/`.
7. **Duplicate product images.** All 7 "multi-image" products list the same image twice (WooCommerce gallery
   repeated the featured image), so the gallery shows two identical thumbnails that do nothing.
8. **Esc doesn't close the mobile menu or the desktop Products dropdown**, and focus isn't moved into/out of the menu.
9. **No error boundary** (`app/error.tsx`): an unexpected render error would show Next's bare default page.
10. **Double-submit guard relies on re-render**: the submit button is disabled via state, so two very fast clicks
    can both fire before React re-renders. (Not reproduced in testing, but there's no hard guard.)

### Low: layout and polish
11. **768 px:** the top contact bar wraps into broken lines ("+44 7985 / 714297", "Track / order").
12. Shop form submits empty parameters (`/shop/?q=&category=&sort=name`), making noisy URLs.
13. Cart quantity inputs don't update live when the same cart is edited in another tab (they do after refresh).
14. Header cart label reads "(1 items)" for screen readers.
15. Malformed API requests get a technical message ("Invalid input: expected object, received null").

### Content (listed, not changed)
- Copper Ingots short description is run-on supplier text ("1)Factory supply directly; 2)Offer all kinds…").
- `/blog/page/9/` returns 404 (correct; the page doesn't exist).

## Status
See the bottom of this file after fixes.
