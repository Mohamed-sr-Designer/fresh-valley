# CRO & SEO

## CRO — what's built in

The brief asks to raise AOV without a discount-led experience. Implemented levers:

| Lever | Where | Mechanic |
|------|-------|----------|
| **Free-delivery threshold** | Cart drawer, cart page, checkout | Live "Add EGP X for complimentary delivery" + progress meter. Lifts AOV toward EGP 600 without a coupon. |
| **Bundles (Boxes)** | Home, Collection, PDP | 5 curated boxes with tiers (Petite/Signature/Grand) — higher ticket than singles. |
| **Hosting recommendation** | Every product page | Cross-sell to The Hosting Box ("Make it a table, not a plate"). |
| **Smart cross-sell** | PDP "Pairs beautifully with"; Cart "Complete your table" | Data-driven `pairings[]`; cart suggests best-sellers/hosting not already in cart. |
| **Upsell via weight** | PDP weight selector | 2 kg tier carries a gentle value factor (×0.95/kg) to nudge larger baskets. |
| **Related products** | PDP | Same-category continuation keeps sessions alive. |
| **Reorder shortcuts** | Account › Orders & Reorder | One-tap "Reorder" adds a whole past order to cart. |
| **Subscriptions** | Account › Subscriptions; box CTAs | Weekly/fortnightly recurring → predictable AOV/LTV. |
| **Seasonal suggestions** | Seasonal collection, Journal, Home | "What is best, right now" drives discovery without markdowns. |
| **Low-friction quick-add** | Every product card | Hover/tap "Add 1 kg · price"; toast + drawer keep momentum. |
| **Persistent state** | localStorage | Cart & wishlist survive reloads → fewer abandoned sessions. |
| **Trust reduction-of-risk** | Trust strip, PDP assurances, cart | Cold-chain, "we replace it", next-day slots — confidence over discounts. |

### Recommended next experiments (post-launch)
1. **Threshold tuning** — A/B EGP 600 vs 500 vs 750 against AOV and margin.
2. **Box tier anchoring** — default-select the middle tier (Signature) to lift it as the norm.
3. **"Complete the board"** — on cart, recommend a *complementary category* (cheese/nuts) when
   the cart is all fruit. (Requires catalogue expansion.)
4. **Post-purchase subscribe** — offer to turn the just-placed order into a weekly box on the
   confirmation screen.
5. **Wishlist → back-in-season email** — notify when a saved seasonal item returns.
6. **Slot scarcity (honest)** — show genuinely limited evening slots to encourage earlier ones.
7. **Gifting flow** — a gift message + scheduled delivery on boxes (high-AOV occasion buyer).

## SEO — architecture

- **Per-page** `<title>`, meta description, canonical, Open Graph, theme-color.
- **Structured data (JSON-LD):**
  - `Organization` (Home) with `areaServed`.
  - `Product` (PDP) — name, image, brand, `Offer` (EGP price, InStock), `AggregateRating`.
  - `AggregateOffer` (box PDP) — low/high price across tiers.
  - `Article` (article pages) — headline, author, publisher, section.
- **Crawl control:** `robots.txt` allows content, disallows cart/checkout/account/wishlist;
  `sitemap.xml` (60 URLs) auto-generated from the catalog (`_build/generate-sitemap.js`).
- **Semantic HTML** — one `<h1>` per page, ordered headings, `<nav>`/`<main>`/`<article>`,
  descriptive `alt` text, breadcrumb trails.
- **Performance** — product images optimised to ~150 KB each (1000 px JPEG, q86); `loading="lazy"`
  on below-fold images; `fetchpriority="high"` on hero; font `display=swap` + preconnect; no
  framework/runtime, ~one small CSS + two small JS files.
- **Category SEO** — `products.html?cat=…` landing states with unique H1 + intro copy per category.
- **Blog strategy** — Journal targets intent clusters: Hosting, Recipes, Seasonal, Produce
  Education, Behind the Quality. Each article has its own URL, schema, and internal links to
  related products (extend `article.body` with product links to build topical authority).

### Production SEO actions (important)
The current build renders header/footer and PDP/article bodies client-side for portability.
For best crawl/Core-Web-Vitals, **server-render or pre-render** (SSG/SSR) page content and
the JSON-LD at build time. The data layer (`data.js`) maps 1:1 to a headless commerce API —
see DEVELOPER-HANDOFF. Also: add real OG images per product, hreflang if Arabic is added,
and image `width/height` everywhere (already on product cards) to lock CLS.
