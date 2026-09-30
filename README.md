<div align="center">

# Fresh Valley

### Export-grade produce · The Art of Hosting · Cairo

**v4 “Market Day”** — a fully branded, motion-rich storefront with a Shopify-style CMS.

</div>

---

## What's here

| | |
|---|---|
| **Storefront** | 15 pages: Home, Collection, Product & Box pages, The Art of Hosting, About, Journal + Article, Basket, Checkout, Wishlist, Account, Contact, Policies, Terms, 404 |
| **Brand system** | The real palette sampled from the logo and wrapping paper — forest ink `#19291C`, olive wordmark `#AE9D57`, kraft `#E6DAC4`, Mid Forest & Charcoal ribbons — Fraunces Soft (echoing the logo's “Valley”) + Plus Jakarta Sans, botanical line-art from the packaging, the logo re-vectorised (identical artwork) for the giant footer sign-off |
| **Motion** | GSAP + ScrollTrigger + SplitText + Lenis smooth scroll: masked headline reveals, rotating hero word, floating produce orbs, crossed marquee ribbons, pinned stacking “ritual” cards, horizontal scroll story, count-ups, self-drawing line-art, fly-to-basket, custom cursor, magnetic buttons, page view-transitions. All of it switches off for reduced-motion users |
| **CMS (admin/)** | Shopify-style back office: dashboard & analytics, orders, products, boxes, collections, inventory, customers (RFM segments), discounts, subscribers, inbox, reports, live view, files, navigation, preferences, users & roles, publishing, demo data |
| **Theme editor** | `admin/theme.html` — Online Store 2.0-style: add / reorder / hide sections and blocks, edit every text and image with a live preview (desktop, tablet, mobile), undo/redo, save, publish |

## Run it locally

```bash
node _build/server.js 5517
```

Open <http://localhost:5517> for the store and <http://localhost:5517/admin/> for the admin.

**Demo admin accounts** — owner `admin@freshvalley.eg` / `fresh-admin` · staff `designer@freshvalley.eg` / `design123`.
The first owner sign-in loads 90 days of demo activity (Settings → Data & demo to turn it off).

## How content flows

```
assets/js/data.js      catalog (products, boxes, reviews, journal)
assets/js/theme.js     theme defaults — every marketing page as sections + settings
assets/js/content.js   published overrides (written by the admin's Publish button)
          ↓
assets/js/app.js       engine: catalog overrides, cart, orders, discounts, shell, cards
assets/js/sections.js  section renderers + the schema the theme editor uses
assets/js/motion.js    motion layer (data-attribute driven)
```

* Edits made in the admin are saved in the browser immediately (the store in that browser
  updates at once).
* **Publish** (Settings → Publishing, or the Publish button in the theme editor) writes
  `assets/js/content.js` — plus any uploaded images to `assets/img/uploads/` — to the GitHub
  repository with a fine-grained token (Contents: read & write). GitHub Pages refreshes in
  about a minute and every visitor sees the change. No token? Download `content.js` from the
  admin and commit it.
* The optional Node server in `server/` (Express + JWT) adds real, cross-device orders; the
  storefront detects it automatically.

## Docs

* [`docs/V4-ARCHITECTURE.md`](docs/V4-ARCHITECTURE.md) — page anatomy, JS APIs, storage contract, theme model, preview protocol
* [`docs/ADMIN.md`](docs/ADMIN.md) — the CMS, screen by screen
* [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — tokens and components

## Principles kept

Logo, brand colours and company unchanged · only the existing photography is used (no new or
generated images) · every v3 feature kept (weights & bulk pricing, boxes & tiers, wishlist,
recently viewed, receipts, reorder, addresses, demo/live checkout) · accessible (skip link,
focus states, labelled controls, focus-trapped dialogs, reduced-motion support) · no build
step, no frameworks.
