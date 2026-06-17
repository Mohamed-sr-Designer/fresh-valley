# Design System

All tokens live as CSS custom properties at the top of `assets/css/styles.css`.
Use the tokens — never hard-code a hex, size, or shadow.

## Color

| Token | Hex | Role |
|-------|-----|------|
| `--forest` | `#1A2A1D` | Primary brand green; dark sections, buttons, headings |
| `--forest-mid` | `#2D4630` | Secondary green |
| `--charcoal` | `#1C1814` | Warm near-black (box cards) |
| `--ink` | `#0E1410` | Deepest; image wells, darkest sections |
| `--cream` | `#F4ECD9` | Primary light / text on dark |
| `--bone` | `#ECE3CD` | Secondary light surface |
| `--paper` / `--paper-2` | `#F6F0E2` / `#EFE7D4` | Page bg + alternating band |
| `--brass` | `#B08A4A` | The single accent — CTAs, eyebrows, rules |
| `--brass-deep` | `#8E6C32` | Accent on light bg (AA-safe text) |
| `--pomegranate` | `#6B1F1C` | Seasonal punctuation + wishlist active only |
| `--text` / `--text-muted` / `--text-faint` | `#21251D` / `#5C6157` / `#868A7C` | Body text ramp |

**Usage law:** Forest + Cream/Bone do the structural work. Brass is a *seasoning*, never a
fill for large areas. Pomegranate appears only as seasonal accent and the active wishlist
heart. No blue, mint, neon, or pastel. No discount red.

### Contrast (WCAG)
- Body `--text` on `--paper` ≈ 11:1 (AAA).
- `--brass-deep` on `--paper` ≈ 4.6:1 (AA) — this is why links/eyebrows use *brass-deep* on
  light, while `--brass` (lighter) is reserved for dark backgrounds.
- Cream on Forest ≈ 11:1 (AAA).

## Typography

Two families, loaded from Google Fonts:

- **Display — Fraunces** (`--font-display`): opsz/wght variable serif. Warm, editorial.
  Headings, prices, pull-quotes, product names. Weights 300–600 + italic for accents.
- **UI — Hanken Grotesk** (`--font-sans`): humanist grotesque. Body, labels, buttons, forms.

### Fluid scale (`clamp`, mobile→desktop)
| Token | Min → Max | Used for |
|-------|-----------|----------|
| `--step--2` | 0.72→0.78rem | eyebrows, meta, badges |
| `--step--1` | 0.83→0.92rem | small UI, captions |
| `--step-0` | 0.97→1.06rem | body |
| `--step-1` | 1.18→1.42rem | lead, product names |
| `--step-2` | 1.48→2.0rem | H3 |
| `--step-3` | 1.9→2.95rem | H2, prices |
| `--step-4` | 2.4→4.2rem | H1, section titles |
| `--step-5` | 3.0→6.0rem | hero |
| `--step-6` | 3.6→8.5rem | display-XL hero |

Eyebrow/kicker = uppercase, `.22em` tracking, brass, with a short rule (magazine style).
Headings: `letter-spacing:-0.015em`, `line-height:1.04`.

## Spacing & layout

- Space tokens `--space-xs … --space-3xl`; sections use `--space-3xl` (≈5.5–11rem) for the
  "breathing room" the brief asks for.
- Containers: `--container` 1280 (default), `--container-wide` 1480, `--container-narrow` 760.
- Radius: `--radius-sm/–/–lg/–pill`. Cards 10px, panels 18px, buttons/pills full.
- Shadows are **soft and warm** (green-tinted, never neutral grey/black): `--shadow-sm/–/–lg`.

## Components (in `styles.css`)

Buttons (`.btn` + `--brass/–outline/–ghost-light/–light/–lg/–sm/–block`) ·
`.product-card` · `.box-card` · `.review-card` · `.article-card` · `.cat-tile` ·
`.badge` (export/organic/seasonal) · `.pill` + `.pill-group` (selectors) · `.qty` stepper ·
`.accordion` · `.spec-list` · `.nutri-table` · `.filter-bar` · `.drawer` (cart/nav) ·
`.toast` · `.search-overlay` · `.legal-layout`.

Reusable render helpers (JS, in `app.js`): `FV.productCardHTML`, `FV.boxCardHTML`,
`FV.reviewCardHTML`, `FV.articleCardHTML`.

## Motion

- `--ease` / `--ease-out` cubic-beziers; default `--dur .5s`.
- Scroll reveals: `[data-reveal]` + IntersectionObserver adds `.in` (fade + 28px rise).
  Stagger with `data-delay="1..4"`.
- Hover: image scale (cards 1.05 / tiles 1.06), button lift `translateY(-2px)`.
- **`prefers-reduced-motion`** fully honoured (animations/transitions collapse to ~0).

## Responsive behaviour

Mobile-first; key breakpoints:

| Width | Changes |
|-------|---------|
| ≤ 1100px | product grid 4 → 3; footer 5 → 3 col |
| ≤ 920px | PDP, story blocks, quality → single column |
| ≤ 860px | **nav → hamburger drawer**; grids → 2 col; header height 76→64; cart/checkout/account → single column |
| ≤ 640px | stats stack; quick-add + wishlist always visible (touch); newsletter stacks; hero scroll cue hidden |

Touch affordances: on ≤540px the card "Add" button and wishlist heart are always visible
(no hover dependency). Tap targets ≥ 42px. Drawers are full-height with momentum scroll.

See `docs/CRO-AND-SEO.md` and `docs/DEVELOPER-HANDOFF.md` for the rest.
