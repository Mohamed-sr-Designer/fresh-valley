# Design System — Second Edition

> The interface was rebuilt in 2026 in an **editorial quiet-luxury** register.
> The rules of engagement live in [`REDESIGN-2026.md`](REDESIGN-2026.md); this file
> is the token reference. Both describe the same system — brand palette and logo unchanged.

All tokens live as CSS custom properties at the top of `assets/css/styles.css`.
Use the tokens — never hard-code a hex, size, or shadow.

## Colour

| Token | Hex | Role |
|-------|-----|------|
| `--forest` | `#10261D` | Primary brand green — dark sections, primary buttons, headings |
| `--forest-mid` | `#1C3A29` | Button hover, secondary green |
| `--forest-soft` | `#2C4A37` | Tertiary green |
| `--ink` | `#0A1A11` | Deepest — image wells, scrims |
| `--cream` | `#F6F1E8` | Text on dark, light buttons |
| `--bone` | `#EFE9DC` | Secondary light surface |
| `--paper` / `--paper-2` | `#FCFAF6` / `#F7F3EA` | Page background + alternating band |
| `--surface` | `#FFFFFF` | Cards |
| `--surface-warm` | `#F4EFE4` | Image beds (what shows before a photo loads) |
| `--brass` | `#C89B5C` | The single accent — CTA fills, active rules, badges |
| `--brass-deep` | `#8B6129` | Accent as **text on light** — AA (4.5:1+) on paper, paper-2, bone and white |
| `--brass-soft` | `#DEC29A` | Accent as text on dark |
| `--pomegranate` | `#6B1F1C` | Seasonal punctuation + active wishlist heart only |
| `--text` / `--text-muted` / `--text-faint` | `#16211B` / `#55605A` / `#6E736C` | Body ramp — all three clear AA at 11px on paper |
| `--on-dark` / `--on-dark-muted` | `#F2EDE2` / `#A9B0A6` | Body ramp on forest |

### Hairlines
Separation is done with **lines, not shadows**.

| Token | Hex | Use |
|-------|-----|-----|
| `--line` | `#E2DACA` | The default rule — card borders, section dividers |
| `--line-soft` | `#EDE7DA` | Inner rules (list rows, card internals) |
| `--line-strong` | `#CFC5B0` | Outline buttons, hover borders |
| `--line-dark` | `rgba(246,241,232,.16)` | The same idea on forest |

## Typography

Self-hosted variable faces in `assets/fonts/` (latin subset, `font-display: swap`),
declared at the top of `styles.css`. **No Google Fonts request anywhere.**

- `--font-display` — **Fraunces** 300–600 + italic 300–500. All headings, pull-quotes,
  serif prices. Headings sit at weight 400 with `-0.018em` tracking.
- `--font-sans` — **Hanken Grotesk** 300–700. Body, labels, buttons, UI.

Fluid scale, `--step--2` → `--step-7`:

| Token | Range | Typical use |
|-------|-------|-------------|
| `--step--2` | 11–12px | Eyebrows, badges, meta, legal |
| `--step--1` | 13–14px | Buttons, small body, card meta |
| `--step-0` | 15–17px | Body |
| `--step-1` | 17–19px | Lead paragraphs, card names |
| `--step-2` | 20–24px | h3, box names |
| `--step-3` | 26–36px | Section titles |
| `--step-4` | 32–50px | h2, big statements |
| `--step-5` | 38–66px | h1 / page headers |
| `--step-6` | 46–86px | Hero display |
| `--step-7` | 51–106px | Reserved cinematic display |

`.eyebrow` is the label that opens every movement: 11px, 600, `.2em` tracking,
uppercase, `--brass-deep`, with a 26px leading rule (`.no-rule` removes it).

## Spacing & layout

- 8pt scale: `--s-1` (4px) → `--s-12` (128px). Legacy `--space-*` aliases still resolve.
- Section rhythm: `--section-y` (72–136px) and `--section-y-sm` (48–88px), applied by
  `.section` / `.section--tight`.
- Containers: `.container` 1280 / `.container-wide` 1560 / `.container-narrow` 700,
  gutter `--gutter` = `clamp(1.25rem, 5vw, 4rem)`.
- Radii: `--radius-sm` 2px, `--radius` 3px, `--radius-lg` 4px. `--radius-pill` is for
  true circles only (icon buttons, avatars, toggles).
- Elevation: `--shadow-sm` is deliberately `none`. `--shadow` / `--shadow-lg` exist only
  for genuine overlays — drawers, toasts, the search panel.

## Components (in `styles.css`)

| Class | Notes |
|-------|-------|
| `.btn` | Squared (2px), 1px border. Variants `--brass`, `--outline`, `--ghost-light`, `--light`; sizes `--lg` / `--sm` / `--block` |
| `.link-arrow` | Uppercase text link with a rule that redraws left-to-right on hover |
| `.product-card` | White surface, hairline border, 1:1 photo, serif name, circular outline "+" add button |
| `.box-card` | Same construction at 4:3 |
| `.cat-tile` | Full-bleed photo, bottom scrim, cream copy |
| `.review-card` | No box — a hairline top rule, serif quote, initial avatar |
| `.article-card` | 4:3 photo, brass category label, serif headline |
| `.badge` | 10px uppercase squared label. `--pop` brass, `--seasonal` pomegranate, `--organic` outlined |
| `.pill` | Squared uppercase filter chip; active = forest fill |
| `.rail` / `.rail-btn` | Scroll-snap slider + 44px circular controls |
| `.filter-bar`, `.page-header`, `.breadcrumb`, `.accordion`, `.spec-list`, `.legal-*`, `.empty-state`, `.qty`, `.sum-row`, `.cart-line`, `.drawer`, `.toast` | All rebuilt on the hairline system |

Cards and shell are rendered from `app.js` (`FV.productCardHTML`, `FV.boxCardHTML`,
`FV.reviewCardHTML`, `FV.articleCardHTML`) so a change lands on every page at once.

## Motion

One gesture. `[data-reveal]` fades and rises 18px over `.9s var(--ease-out)`;
`[data-stagger]` cascades children; `data-delay="1..4"` offsets siblings. Hover is a
colour change, a border change, or a 1.04 image scale — nothing else. Everything is
neutralised under `prefers-reduced-motion`.

Removed for good: glassmorphism, decorative gradients, brass glow, specular sweeps,
3D card tilt, ken-burns, marquee testimonial walls, "someone just ordered" popups,
splash screens and the cursor aura.

## Responsive behaviour

| Breakpoint | What changes |
|------------|--------------|
| ≤1100px | Product grid 4→3, box grid 3→2, footer 5→3 columns |
| ≤860px | `--header-h` 78→64, primary nav becomes the menu drawer, bottom app bar appears, product grid →2, `.hide-mobile` hides |
| ≤640px | Rails go to 68vw cards, touch targets grow to 42–44px, wishlist heart is always visible |
| ≤540px | Footer 2 columns, tighter grid gutters |

Images: every raster asset ships a sibling `.webp` served through `<picture>` with the
JPEG as fallback. Product photos come in 540px (`FV.thumb`) and 1000px (`FV.img`); the
hero has four landscape widths plus a dedicated portrait crop for phones.
