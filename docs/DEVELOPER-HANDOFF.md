# Developer Handoff

## Stack

Framework-free static site: semantic HTML + one CSS design system + vanilla ES (no build
step, no dependencies). Chosen for portability, performance, and zero supply-chain risk. It
maps cleanly onto any modern stack (Next.js, Astro, Shopify Hydrogen) when productionised.

```
assets/css/styles.css   Design system + all component styles (tokenised)
assets/js/data.js        window.FV_DATA = { categories, products, boxes, reviews, articles, IMG }
assets/js/app.js         window.FV engine + shell injection + stores + render helpers
```

## The engine (`app.js`) — public API

```js
FV.money(n)                       // → "EGP 1,250"
FV.find(slug) / FV.findBox(slug)
FV.byCategory(cat) / FV.byCollection(coll)
FV.cardPrice(p)                   // headline price + unit ("/ kg", "each", "/ bunch")
FV.defaultVariant(p)              // default purchasable variant
FV.priceForWeight(p, grams)       // weight→price (2kg ×0.95 value factor)
FV.quickAdd(slug) / FV.addBox(slug, tierLabel)
FV.cart  { items, count, subtotal, add, setQty, remove, clear }
FV.wish  { items, has, toggle }
FV.toast(msg, sub) / FV.openCart()
FV.productCardHTML / boxCardHTML / reviewCardHTML / articleCardHTML
FV.observeReveals(root) / FV.updateWishUI()
FV.icon(name)                     // inline SVG string
```

### Page contract
Every page:
1. includes `data.js` then `app.js`;
2. has `<div id="fv-header"></div>` and `<div id="fv-footer"></div>` (shell injected on boot);
3. sets `<body data-page="…">` for active-nav state and `data-hero="true"` for a transparent
   overlay header (first `<main>` child slides up under it);
4. populates dynamic grids in a trailing inline `<script>`, then calls `FV.observeReveals()`
   and `FV.updateWishUI()` on the freshly injected nodes.

Page-specific layout CSS lives inline in each page `<head>`; the shared system stays in
`styles.css`. Cart/wishlist persist in `localStorage` (`fv_cart`, `fv_wish`) and broadcast
`fv:cart` / `fv:wish` DOM events that pages listen to for live re-render.

## Data model → API mapping

`data.js` is the single source of truth and is shaped to match a headless commerce backend.

```jsonc
// Product
{ "slug":"strawberry", "name":"Winter Strawberries", "category":"fruits",
  "unit":"kg",            // "kg" | "piece" | "bunch"
  "pricePerKg":120,       // or "pricePerUnit" for piece/bunch
  "origin":"Qalyubia, Egypt", "season":"Dec – Mar",
  "rating":4.9, "reviews":212,
  "badges":["export","seasonal"],
  "collections":["best-sellers","seasonal","essentials"],
  "short":"…", "desc":"…", "pairings":["green-grapes","…"],
  "storage":"…", "nutrition":{ "serving":"100 g","energy":"33 kcal", … },
  "noPhoto":true          // herbs → botanical card instead of a photo
}
// Box: { slug,name,image,tagline,desc, tiers:[{label,price,serves}], includes:[], badges, collections }
```

Replace `data.js` with `fetch()` calls to your commerce/CMS API returning these shapes; the
render helpers are pure functions of that data, so the UI needs no change. Image convention:
`assets/img/products/<slug>.jpg` (`FV.img(slug)`), square 1:1, dark cinematic style.

## Pricing logic (authoritative)

- **kg** items: `price = round(pricePerKg × grams/1000 × factor)`; `factor = 0.95` at 2 kg.
  Weight options: 250 g / 500 g / 1 kg (default) / 2 kg.
- **piece / bunch**: flat `pricePerUnit`; quantity stepper only.
- **box**: tier price; quantity stepper.
- Free delivery ≥ EGP 600; otherwise flat EGP 45 (added at checkout).

> Pricing currently runs client-side for the demo. **In production, compute and validate
> price, stock, and totals server-side** — never trust client values at order time.

## Assets pipeline

30 source photos (1080² PNG, Arabic filenames) were mapped to English slugs and
re-encoded to 1000 px JPEG q86 (~150 KB each, 4.7 MB total) via `_build/convert-assets.ps1`.
A cream logo (`logo-cream.png`) is generated for dark headers. Re-run that script if source
art changes. Favicon is `assets/img/favicon.svg` (injected by `app.js`).

## Known demo simplifications → production checklist

- [ ] **Server-render** page bodies + header/footer + JSON-LD (SEO/CWV). Today they're CSR for portability.
- [ ] **Real backend**: catalogue API, inventory/stock, server-side cart & pricing, order persistence.
- [ ] **Payments**: integrate a PCI-compliant provider (e.g. Paymob/Stripe) — the checkout card
      fields are a non-functional UI mock and intentionally collect/transmit nothing.
- [ ] **Auth**: account is a static mock; wire real sign-in, sessions, addresses, saved cards (tokenised at provider).
- [ ] **Forms**: newsletter/contact/checkout submit handlers are stubbed (toast only) — point at your ESP/CRM/order API.
- [ ] **Search**: client-side substring match over the catalogue → replace with a search service for scale.
- [ ] **i18n**: copy is English-only by design; structure supports adding Arabic + `hreflang` + RTL later.
- [ ] **Analytics & consent**: add product/commerce events and a privacy-first cookie banner (decline-by-default).

## Accessibility

Semantic landmarks, one H1/page, visible `:focus-visible` rings, `aria-current` on nav,
`aria-pressed` on toggles/pills, `aria-hidden` on closed drawers, `aria-live` toast region,
labelled icon buttons, keyboard `Esc` closes overlays, AA-contrast palette, full
`prefers-reduced-motion` support. Next: trap focus within open drawers and restore on close;
run an axe pass before launch (see `design:accessibility-review`).

## Performance notes

No framework/runtime; ~1 CSS + 2 JS files (small). Images optimised + lazy-loaded; hero
`fetchpriority=high`; fonts preconnected with `display=swap`; soft shadows over heavy
filters. Target: fast LCP on the hero image, near-zero CLS (image dimensions reserved).
