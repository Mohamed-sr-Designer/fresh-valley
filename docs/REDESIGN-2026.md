> **Historical — superseded by v4 “Market Day” (September 2026).** See [V4-ARCHITECTURE.md](V4-ARCHITECTURE.md), [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) and [ADMIN.md](ADMIN.md).

# Fresh Valley — Second Edition design brief

The storefront has been re-skinned from "shiny ecommerce" to **editorial quiet luxury**.
Brand identity is unchanged: same logo, same palette (forest / cream / brass / pomegranate),
same copy wherever it still reads well.

> **Audit pass (Aug 2026).** A later art-direction pass layered on the Master Audit's
> elevation items *on top of* this contract — the palette and copy stayed fixed (the audit's
> sampled hexes and its "terracotta" accent were deliberately NOT adopted; "don't change the
> brand colours" wins). What that pass added, all reusable and already in the shared files:
> - **Photo-forward product cards** — borderless, 4:5 crop, the quality label as an eyebrow
>   caption *above* the frame (`FV.productCardHTML` → `topLabel(p)`), the `+` add button
>   surfacing on the photo on hover (always visible on touch).
> - **Section-header variants** so no two consecutive sections read the same: `.section-head`
>   (default), `.section-head--center`, `.section-head--xl` (oversized, no link),
>   `.section-head--split` (`.sh-main` + `.sh-support`).
> - **Quote-forward testimonials** (`.review-card` — oversized gold `"`, stars below the name)
>   and **horizontal journal rows** (`FV.articleCardHTML(a, true)` → `.article-card--row`).
> - **Herb placeholder** upgraded to a dark tungsten treatment marked `data-placeholder="true"`
>   (`.media.media--herb`) — never a flat swatch, still no real image needed.
> - **CTA hierarchy**: at most one `.btn--brass` (gold) per page — the single commerce action.
>   Everything else is `.btn` (dark), `.btn--outline`, or a `.link-arrow`.
> - **Signature interactions** (`.strike-line` self-drawing strike, `.avail` scarcity meter that
>   fills + counts up on scroll-in, `.filter-tabs`/`.filter-ink` underline filters, footer +
>   newsletter underline draws) and one **magnetic** pass on gold CTAs (`magneticLayer()` —
>   fine-pointer + motion-OK only). Direction-aware header hide/reveal on scroll.
> - The hero is still one held photograph; it now settles in behind a staggered text reveal.
> Every one of these has a `prefers-reduced-motion` fallback.

This document is the contract every page follows. `assets/css/styles.css` implements it;
page-specific layout lives in a `<style>` block in that page's `<head>`.

---

## 1. The look, in one line

> Hairlines instead of shadows. Ink instead of glass. Air instead of ornament.

**Do**
- Hairline borders (`1px solid var(--line)`) to separate things.
- Generous vertical rhythm (`.section` = `--section-y`, `.section--tight` = `--section-y-sm`).
- Big serif display headings (Fraunces, weight 400) against small, letter-spaced sans labels.
- Full-bleed or edge-aligned photography, `object-fit: cover`, subtle 1.04 scale on hover.
- One dark anchor per page at most (footer is already dark).

**Never**
- Multi-stop decorative gradients, glassmorphism, `backdrop-filter` panels, brass "glow".
- Drop shadows on cards (`--shadow-sm` is deliberately `none`). Shadows are for overlays only.
- Border radius above 4px, except true circles (icon buttons, avatars).
- Specular sweeps, 3D tilt, ken-burns, marquee walls of testimonials, floating "someone
  just ordered" popups, splash screens, cursor auras. All of these have been removed.
- Emoji, cartoon icons, or badge bubbles. Badges are small squared uppercase labels.

## 2. Tokens (use them — never hard-code)

| Purpose | Token |
|---|---|
| Page surface | `--paper`, alternating band `--paper-2`, cards `--surface` |
| Dark | `--forest`, `--forest-mid`, `--ink` |
| Accent | `--brass` (fills), `--brass-deep` (text on light), `--brass-soft` (text on dark) |
| Ink | `--text`, `--text-muted`, `--text-faint`, `--on-dark`, `--on-dark-muted` |
| Lines | `--line`, `--line-soft`, `--line-strong`, `--line-dark` (on dark) |
| Type scale | `--step--2` … `--step-7` |
| Space | `--s-1` … `--s-12` (8pt), section rhythm `--section-y`, `--section-y-sm` |
| Radius | `--radius-sm: 2px`, `--radius: 3px`, `--radius-lg: 4px`, circles `--radius-pill` |
| Motion | `--ease`, `--ease-out`, `--ease-luxe`; durations .3–.9s |

Container: `.container` (1280) / `.container-wide` (1560) / `.container-narrow` (700),
gutter `--gutter` = `clamp(1.25rem, 5vw, 4rem)`.

## 3. Components already restyled — reuse, don't reinvent

`.btn` (+ `--brass`, `--outline`, `--ghost-light`, `--light`, `--lg`, `--sm`, `--block`),
`.link-arrow`, `.eyebrow`, `.section-head`, `.split-head`, `.badge`, `.product-card`,
`.box-card`, `.cat-tile`, `.review-card`, `.article-card`, `.feature`, `.trust-strip`,
`.pill`, `.qty`, `.input/.select/.textarea/.field`, `.accordion`, `.spec-list`,
`.filter-bar`, `.page-header`, `.breadcrumb`, `.legal-layout`, `.nutri-table`,
`.rail` / `.rail-btn`, `.drawer`, `.toast`, `.empty-state`, `.sum-row`, `.cart-line`.

Render helpers in `app.js` (already updated): `FV.productCardHTML`, `FV.boxCardHTML`,
`FV.reviewCardHTML`, `FV.articleCardHTML`, `FV.icon(name)`, `FV.money`, `FV.bindRail`.

## 4. Page anatomy

1. `.page-header` — eyebrow, `h1` (`--step-5`), one supporting line, hairline bottom border.
   Its top padding already clears the fixed header (`--header-h`).
2. Content sections separated by `--section-y`; alternate `--paper` / `--paper-2` sparingly.
3. Section headings always use `.section-head` (eyebrow + title) or `.split-head`
   (title left, action right, hairline under).
4. Close with a real next step (CTA band, related products, or contact).

## 5. Motion

One gesture only: `[data-reveal]` (fade + 18px rise, `.9s var(--ease-out)`) and
`[data-stagger]` for children. `data-delay="1..4"` staggers siblings. Call
`FV.observeReveals()` after injecting markup. Hover = colour change, 1px border change,
or a 1.04 image scale. Nothing else. Everything is disabled under
`prefers-reduced-motion`.

## 6. Accessibility floor

- One `<h1>` per page; heading levels never skip.
- Every control has an accessible name; icon-only buttons need `aria-label`.
- Text on photography always sits on a scrim dark enough for 4.5:1.
- `:focus-visible` is styled globally — don't remove outlines.
- Decorative images get `alt=""`; meaningful ones get a real description.
- Interactive targets ≥ 44px on touch.

## 7. Performance

- Product photos: `assets/img/products/sm/<slug>.jpg` (540px) with a `srcset` up to the
  1000px original. `FV.thumb(slug)` / `FV.img(slug)`.
- Hero art: `assets/img/hero/hero-{800,1200,1800,2400}.jpg` (landscape) and
  `hero-portrait-{700,1000}.jpg` (mobile crop).
- Everything below the fold is `loading="lazy"` with explicit `width`/`height`.
- Every raster asset ships a sibling `.webp`; serve it through `<picture>` with the JPEG as
  the fallback — `FV.webp(url)` derives the path. Any `<picture>` needs
  `display:block; width:100%; height:100%` wherever its `<img>` was sized to a frame.
- Type is **self-hosted** in `assets/fonts/` (latin subset, variable, `font-display: swap`)
  and declared at the top of `styles.css`. There is no Google Fonts request anywhere — do
  not reintroduce one. Preload `hanken-grotesk.woff2` and `fraunces.woff2` in every page head.
- No new webfonts, no new libraries. The site ships zero dependencies.

## 8. Contracts you must not break

- `data-fv="key"` — admin-editable copy (text is replaced wholesale by `admin.js`).
- `data-fv-section="key"` — admin show/hide + reorder.
- `data-fv-img="key"` and `assets/img/banners/<key>.jpg` — admin image swaps.
- `data-add`, `data-wish`, `data-dec`, `data-inc`, `data-rm` — delegated cart/wishlist hooks.
- `body[data-page]` — drives nav + app-bar active state.
- `#fv-header` / `#fv-footer` — the shell mounts here; never hand-write header/footer.
- localStorage keys (`fv_cart`, `fv_wish`, `fv_orders`, `fv_admin_*`, …) stay as they are.
