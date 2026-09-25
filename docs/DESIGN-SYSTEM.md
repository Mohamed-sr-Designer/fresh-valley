# Design System — v5 “Field & Herb”

A walk through the valley at first light. Calm, spacious and unmistakably ours: the
forest ink of the logo on linen and herb-mist grounds, olive as low morning sun,
Fraunces Light for a quiet literary voice. Space instead of ornament, hairlines instead
of shadows, one signature shape — the greenhouse arch. **No patterns, no textures,
no marquees, no reviews.** Everything lives in `assets/css/styles.css` (tokens,
components, sections, motion states) and `assets/css/shop.css` (commerce pages).

## Colour

Brand tokens are unchanged (sampled from the logo and wrapping paper). v5 adds a
field palette derived from the brand greens for the grounds.

| Token | Hex | Role |
|---|---|---|
| `--forest` | `#19291C` | Logo ink · type · primary buttons · dark bands · footer |
| `--moss` | `#2D4630` | Button hover · “Mid Forest” ribbon |
| `--olive` / `--olive-lt` / `--olive-dk` | `#AE9D57` / `#CFC287` / `#6E5F2E` | Morning sun — italic accents, labels, the almanac “now” column |
| `--sage` / `--sage-lt` | `#8A8E57` / `#DCDDC5` | Harvest-calendar bars · selection |
| `--paper` | `#F4F2EA` | **Linen** — the page |
| `--mist` / `--mist-2` | `#E5E8DA` / `#D8DDC9` | **Herb mist** — calm bands, image placeholders, herb labels |
| `--leaf` | `#3F5B42` | A living green for small positive states |
| `--card` | `#FAF9F4` | Panels and inputs |
| `--pom` | `#7A2B21` | Sale · errors only |

Bands: `band--paper` (linen), `band--mist`, `band--kraft` (a warmer linen), `band--dark`
(forest). Legacy `sage` / `olive` bands map to mist.

## Type

* **Fraunces** at weights 200–350 with `SOFT 100` and automatic optical sizing — large
  sizes pick the delicate high-opsz cut. Headlines are never bold.
* The one accent: `*word*` in any CMS text → light italic in olive (`.i`).
* **Plus Jakarta Sans** 400 for text; 500 uppercase with wide tracking (`.eyebrow`,
  `.label`) for field-tag labels, buttons and meta.
* Scale: `--t-mega` (hero, up to 8.6rem) · `--t-h1` · `--t-h2` · `--t-h3`.

## Shape, depth, space

Near-square radii (`--r-xs 2` … `--r-xl 8`), hairlines `--line` / `--line-2`; shadows
only on floating layers (drawer, search, toasts). The **arch**
(`border-radius: 50% 50% … / 37.5% 37.5% …`) is reserved for the hero photo, the hosting
story photo and the loading screen’s lifting curve. Section rhythm `--sec`
(up to 12.5rem), fluid `--gutter` (up to 5rem), `.wrap--wide` 1520px.

## Signature components

* **Field label product card** (`.pcard`) — 4:5 still life, name + price, botanical name in
  italic (`p.latin`), origin · season, a quiet `Add +`. No stars, no ratings.
* **Herb label** (`.media--herb`, `FV.herbTile`) — typographic tile for produce without
  photography (cut herbs).
* **Valley Almanac** (`almanac` section) — a harvest calendar; the current month is shaded
  and crops at their peak are drawn in forest.
* **Provenance** (`origins` section) — the eight Egyptian growing regions, what grows there,
  and roughly how far from Cairo.
* **Harvest window** (product page) — that product’s line of the almanac.
* **The almanac line** — “Week 39 · Early autumn in the valley”, live in the hero, menu,
  footer and loading screen (`FV.almanac()`).

## Header

Logo left · navigation centred · actions right. On phones: logo left, and search ·
basket · **menu on the far right**; the menu opens as a linen sheet from the right,
where the button lives. Transparent at the top, linen with a hairline once scrolled.

## Motion

Slow and soft (`--e-out`): lines rise from masks, blocks fade up, images unveil and settle,
gentle parallax, count-ups, Lenis smooth scrolling. Removed in v5: custom cursor,
magnetic buttons, marquees, fan-ins, floating orbs, pinned stacks, spinning stickers.
With `prefers-reduced-motion` everything is visible and still.

**First light** — the loading screen on the first visit of a session: the valley at night,
the logo fills with light from below like a sunrise, an olive horizon draws, the almanac
line appears, and the dark lifts away with a soft hill curve as the hero rises in. Never
shorter than 1.7s, never longer than 3.2s; skipped for reduced motion, the theme editor and
every later page in the session (those get a quiet cross-fade).
