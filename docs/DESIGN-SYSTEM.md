# Design System — v4 “Market Day”

Premium, but warm and lively: the brand's own packaging (forest ink on kraft, the olive
wordmark, Mid Forest & Charcoal ribbons, pressed-leaf line-art) turned into an interface.
Everything lives in `assets/css/styles.css` (tokens + components + sections + motion
states) and `assets/css/shop.css` (commerce pages).

## Colour (sampled from the logo and wrapping paper)

| Token | Hex | Role |
|---|---|---|
| `--forest` | `#19291C` | Logo ink · primary buttons · dark bands · footer |
| `--forest-2` / `--moss` | `#223A29` / `#2D4630` | Raised dark surfaces · “Mid Forest” ribbon |
| `--olive` | `#AE9D57` | The olive wordmark — accent fills, arrow chips, underlines |
| `--olive-lt` | `#CFC287` | Accent on dark backgrounds |
| `--olive-dk` | `#6E5F2E` | Accent **text** on light backgrounds (AA contrast) |
| `--sage` / `--sage-lt` | `#8A8E57` / `#DCDDC5` | Secondary · soft bands and icon tiles |
| `--kraft` | `#E6DAC4` | Wrapping-paper band |
| `--paper` / `--card` | `#F3EDE1` / `#FFFDF8` | Page · cards |
| `--charcoal` | `#2A2622` | “Charcoal” ribbon |
| `--pom` | `#7A2B21` | Pomegranate — sale, alerts, low stock |

## Type

* **Fraunces** (variable, `SOFT 100`, optical sizes) for display — its soft, bold serif
  echoes “Valley” in the logo. Italic (`WONK 1`) in olive for the one accented word:
  `*word*` in any CMS text field.
* **Plus Jakarta Sans** (“Jakarta”) for everything else.
* Scale tokens: `--t-xs … --t-mega` (fluid `clamp()`); hero headline up to 9.2rem.

## Shape, depth, space

Radii `--r-xs 10 · --r-sm 14 · --r 22 · --r-lg 32 · --r-xl 44 · --pill`; warm forest-tinted
shadows `--sh-1/2/3`; section rhythm `--sec` / `--sec-sm`; `--gutter` fluid side padding;
`.wrap` (1320) / `.wrap--wide` (1560) / `.wrap--narrow` (760).

## Components

Buttons `.btn` (+ `--olive --ghost --light --ghost-light --sm --lg --block --noic`) with a
colour wipe and the round arrow chip `.btn__ic` · `.link-u` · `.chip` (`--olive --forest
--pom --glass --soft`) · `.icon-btn` + `.badge-count` · fields `.field .input .select
.textarea .check .qty .seg` · cards `.pcard` (product), `.bcard` (box), `.rcard` (review),
`.acard` (+ `--row`, article), `.ctile` (category), `.feature`, `.stat`, `.sticker`
(rotating ring), `.orb` (produce orb) · `.rail` + `.rail-progress` · `.acc` accordion ·
`.crumbs` · `.marquee` (`--brand --olive`, crossed ribbons) · `.drawer`, `.search`,
`.menu`, `.toast`, `.tabbar` (mobile) · botanical `.art` SVGs from `FVSections.ART`
(sprig, leaf, citrus, fig, tomato, strawberry, herbs, bouquet).

## Bands

`.band--paper | --kraft | --sage | --dark | --olive | --charcoal` — any section can switch
band from the theme editor ("Background").

## Motion

Driven by data attributes (see `docs/V4-ARCHITECTURE.md`): reveals, staggers, clip wipes,
masked line splits, parallax, count-ups, self-drawing line-art, marquees that react to
scroll speed, magnetic buttons, custom cursor labels, pinned stories, horizontal scroll,
fly-to-basket, cross-document view transitions. Easing `--e-out` (expo-like) and
`--e-spring`. With `prefers-reduced-motion` everything is visible and still.
