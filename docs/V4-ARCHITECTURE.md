# Fresh Valley architecture (v4 engine · v5 "Field & Herb" design)

> **v5 notes (Sept 2026).** Same engine, new design. Section types `marquee` and
> `testimonials` are retired (saved themes that list them render nothing); new types
> `statement`, `almanac` and `origins`. Hero settings: `almanac`, `eyebrow`, `title`
> (one line per row), `lede`, CTAs, `image`, `caption`, `peak`. Theme `version: 5` —
> page layouts saved before v5 are ignored so the redesign shows. Motion attributes now:
> `data-reveal`, `data-stagger`, `data-clip`, `data-split`, `data-parallax`, `data-count`,
> `data-strike` (cursor, magnetic, marquee, fan, float, rotate, story and hscroll pins are
> gone). New `FV` helpers: `MONTHS`, `seasonMonths(p)`, `inSeasonNow(p)`, `peakNow(n)`,
> `almanac()`, `originShort(o)`, `herbTile(p)`; smart collection `now`. Loading screen:
> static `.loader` markup + head script (`html.is-loading`), lifted by `app.js`
> (`fv:lifting` → `fv:loaded`). `data.reviews` is empty; products carry `latin`.

Static multi-page site (HTML + CSS + vanilla JS). No build step required; `_build/bake.js`
optionally pre-renders theme sections into the HTML for SEO. Motion: GSAP 3.15 + ScrollTrigger +
SplitText + Lenis (self-hosted in `assets/vendor/`). Fonts self-hosted: Fraunces (variable, SOFT/WONK
axes) for display, Plus Jakarta Sans ("Jakarta") for text.

## Brand (do not change)
Logo: `assets/img/logo.png` / `logo-cream.png` (+ `-sm` versions) and the re-vectorised
`logo.svg` (identical artwork, used as a CSS mask for the giant footer sign-off).
Palette sampled from the real logo + wrapping paper (tokens in `assets/css/styles.css`):

| token | hex | use |
|---|---|---|
| `--forest` | #19291C | logo ink, primary, dark bands |
| `--moss` | #2D4630 | "Mid Forest" ribbon |
| `--olive` | #AE9D57 | olive wordmark — THE accent |
| `--olive-lt` / `--olive-dk` | #CFC287 / #6E5F2E | accent on dark / accent text on light (AA) |
| `--sage` / `--sage-lt` | #8A8E57 / #DCDDC5 | secondary / soft band |
| `--kraft` | #E6DAC4 | wrapping paper band |
| `--paper` / `--card` | #F3EDE1 / #FFFDF8 | page / cards |
| `--charcoal` | #2A2622 | "Charcoal" ribbon |
| `--pom` | #7A2B21 | pomegranate — sale / alerts |

## Page anatomy
```html
<body data-page="KEY">
  <div id="fv-header"></div>              <!-- app.js mounts header + mobile menu -->
  <main id="main" data-fv-page="KEY"></main> <!-- theme pages: sections.js renders here -->
  <div id="fv-footer"></div>
  <script src="assets/js/data.js"></script>     <!-- window.FV_DATA catalog -->
  <script src="assets/js/content.js"></script>  <!-- window.FV_CONTENT (published overrides) -->
  <script src="assets/js/theme.js"></script>    <!-- window.FVTheme (section JSON + resolver) -->
  <script src="assets/js/app.js"></script>      <!-- window.FV engine + shell -->
  <script src="assets/js/sections.js"></script> <!-- window.FVSections renderers + schema -->
  <!-- page script (commerce pages) -->
  <script defer src="assets/vendor/gsap.min.js"></script> … lenis …
  <script defer src="assets/js/motion.js"></script>  <!-- window.FVMotion -->
</body>
```
The head carries an inline script that adds `html.m-on` (motion initial states) unless reduced
motion or `?fv_preview=1`, with a 3.5 s failsafe.

Commerce pages (products, product, cart, checkout, wishlist, account) render their own `<main>`
with page scripts; marketing pages (index, hosting, about, contact, journal, policies, terms) are
100% theme sections. `article.html` is a template reading `?slug=`.

## Motion data-attributes (motion.js)
`data-reveal[=fade|scale|left|right]`, `data-stagger` (children), `data-fan` (card deck),
`data-clip` (image wipe), `data-split[=words]` (masked lines), `data-parallax="8"`,
`data-count="1400" data-dec data-suffix`, `data-draw` (SVG line-art), `data-marquee[=right]
data-speed data-pause`, `data-magnetic`, `data-cursor="Drag"` (custom cursor label),
`data-strike` (strike-throughs), `data-float`, `data-rotate="a|b|c"` (rotating word),
`data-story` (pinned stacking cards), `data-hscroll` (pinned horizontal track).
Content injected after load: call `FV.observeReveals(root)` (→ `FVMotion.scan`).
`FVMotion.fly(el)` = fly-to-cart, `FVMotion.bump(el)`, `FVMotion.lenis`, `FVMotion.refresh()`.
Everything must stay visible and usable with reduced motion / no JS motion.

## window.FV (app.js) — public API
data, icon(name), payMark(k), payMarks, esc, money(n), weightOptions, weightLabel(g),
priceForWeight(p,g), cardPrice(p) → {value, per}, defaultVariant(p), img(slug), thumb(slug),
webp(url), imgSrc(ref), isCustomImg(ref), picture(ref, sizes, alt, {eager}), find(slug),
findBox(slug), byCategory(c), byCollection(c), stock(slug), soldOut(p), catalog,
cart {items,count,subtotal,add,setQty,remove,clear}, wish {items,has,toggle},
recent {list,push}, scarcityPct(slug), settings, orders {all,record}, clients {all,upsert},
discounts {all,find(code),value(d,subtotal,delivery)}, track(type,data), api {up,checkout},
receipt {open,download}, receiptDoc, quickAdd(slug, fromEl), addBox(slug, tier, {note}),
openCart(), openSearch(), toast(msg, sub, withCartLink), shipMeter(subtotal),
productCardHTML(p), boxCardHTML(b), reviewCardHTML(r), articleCardHTML(a, row), topLabel(p),
observeReveals(root), bindRail(rail, prev, next), cutoffText(), updateWishUI(), updateCartUI().
Events: `fv:ready` (shell mounted), `fv:cart`, `fv:wish`, `fv:motion`.
Delegated click contracts: `[data-add=slug]`, `[data-wish=slug]`, `[data-dec=key]`,
`[data-inc=key]`, `[data-rm=key]`, `[data-open-cart]`, forms `[data-newsletter]`.

## Storage contract (localStorage unless noted) — shared with the admin
| key | shape |
|---|---|
| `fv_cart` | `[{key, slug, type:'product'|'box', name, image, noPhoto, variant, price, qty, note?}]` |
| `fv_wish` / `fv_recent` | `[slug]` |
| `fv_user` | `{name, email, phone, area?, address?}` (storefront account, demo auth) |
| `fv_orders` | `[{id, date ISO, customer:{name,email,phone,area}, address, slot, items:[{slug,type,name,variant,price,qty,image}], subtotal, discount, code, delivery, total, payment, status:'new'|'confirmed'|'packed'|'out'|'delivered'|'cancelled'|'refunded', fulfillment:'unfulfilled'|'fulfilled', source, note?, timeline?:[{t,msg}]}]` |
| `fv_clients` | `[{id, name, email, phone, area, joined, status, marketing, tags?, note?}]` |
| `fv_catalog` | `{updatedAt, prices:{slug:n}, pmeta:{slug:{status:'active'|'draft'|'archived', name, short, desc, origin, season, badges[], collections[], image, compareAt, stock, category, featured, cost, sku, seo:{title,description}}}, custom:[product], categories:{slug:{name, blurb}}, boxes:{slug:{name,tagline,desc,image,includes[],stock}}, discounts:[{code, type:'percent'|'fixed'|'shipping', value, min, active, expires, limit, used, note}]}` |
| `fv_admin_settings` | `{updatedAt, storeName, currency, storeOpen, deliveryFee, freeThreshold, taxRate, cutoffHour, codEnabled, slots[]}` |
| `fv_theme` | full theme JSON (same shape as `FVTheme.defaults()`), `updatedAt` ms |
| `fv_theme_draft` | **sessionStorage** — theme editor working copy read by `?fv_preview=1` pages |
| `fv_track` | `[{t, type:'page_view'|'add_to_cart'|'wishlist'|'checkout_start'|'purchase'|'newsletter'|'contact', page, sid, dev, src, …}]` (max 4000) |
| `fv_messages` | `[{id, date, status:'new'|'read'|'archived', first, last, email, phone, subject, message}]` |
| `fv_files` | `[{id, name, type, size, data (dataURL), date}]` admin media library |
| `fv_admin_images` | `{bannerKey: url}` legacy banner overrides |
| `fv_admin_users` / `fv_admin_session` | admin users `[{id,name,email,password,role}]` / `{id, at}` |
| `fv_gh` | `{owner, repo, branch, token}` publish target (token never leaves this browser except to api.github.com) |

Precedence: storefront uses the NEWEST (`updatedAt`) of published `FV_CONTENT.{theme,catalog,settings}`
and this browser's local copies. `assets/js/content.js` is what "Publish" writes:
`window.FV_CONTENT = {updatedAt, theme, catalog, settings};`

## Theme model (theme.js / sections.js)
`theme = {version, updatedAt, settings:{store_name, tagline, announcement:{enabled,text,link,link_label}, nav:[{label,href}], footer:{title,newsletter_text,blurb,columns:[{title,links:[{label,href}]}]}, social:{instagram,facebook,tiktok}, contact:{phone,whatsapp,email,hours,city}, areas:[], colors:{'--token':'#hex'}}, pages:{index|hosting|about|contact|journal|policies|terms: {title, seo_title?, sections:[{id, type, disabled?, settings:{}, blocks:[{type, settings:{}}]}]}}}`
Section types + field schema: `FVSections.schema` (hero, marquee, categories, product_rail, story,
boxes, stats, image_text, testimonials, banner, journal, page_head, strike_list, seasons, hscroll,
gallery, compare, quote, cta, steps, features, areas, contact, faq, legal). Field types: text,
textarea, link, image, select(options), toggle, range(min,max,step), list (pipe-separated, edit one
per line), products (comma slugs), boxes (comma slugs), icon (FV.icon names).
New section defaults: `FVSections.presets[type]()`.
Inline markup in text: `*italic olive*`, `~hand-drawn underline~`, newline → `<br>`.
Image refs: product slug · `banner:<name>` (delivery-van, door-delivery, home-delivery,
juice-bottles, packaging, staff-shirt) · `hero` · `art:<sprig|leaf|citrus|fig|tomato|strawberry|herbs|bouquet>` · URL/dataURL.

## Theme-editor preview protocol
1. Admin writes the draft to `sessionStorage.fv_theme_draft`, loads `<page>.html?fv_preview=1` in a
   same-origin iframe (header/footer are then built from the draft).
2. Page posts `{type:'fv:ready', page}` to the parent.
3. Admin posts `{type:'fv:draft', theme, select?}` for live section edits (main re-renders, no reload);
   reload the iframe when global `settings` change.
4. Admin posts `{type:'fv:select', id, scroll:true}` to highlight/scroll to a section.
5. Page posts `{type:'fv:clicked', id}` when a section is clicked and `{type:'fv:navigate', href}`
   when a link is clicked (admin decides whether to switch page).
All messages are same-origin only (`location.origin`).
