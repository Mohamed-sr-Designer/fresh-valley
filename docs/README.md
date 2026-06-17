# Fresh Valley — Website Experience

Premium produce brand experience. Export-grade fruit, vegetables and curated boxes,
positioned for modern hosting and lifestyle — **not** an online grocery store.

> "A warm, forested quiet luxury." Built for upper-class Egypt: New Cairo, Sheikh Zayed,
> October, Madinaty, Rehab. English, B1–B2, warm and human.

---

## Run it locally

The site is a static, framework-free build (HTML + CSS + vanilla JS). Any static
server works. The repo ships a zero-dependency Node server:

```bash
node _build/server.js 5500
# → http://localhost:5500
```

Or use the Claude Code preview config (`.claude/launch.json` → "fresh-valley").

To regenerate `sitemap.xml` after editing the catalog:

```bash
node _build/generate-sitemap.js
```

---

## What's in the box

| Deliverable (from brief)      | Where it lives |
|-------------------------------|----------------|
| Information Architecture      | `docs/INFORMATION-ARCHITECTURE.md` |
| User Flow Diagrams            | `docs/INFORMATION-ARCHITECTURE.md` (Mermaid) |
| Sitemap                       | `sitemap.xml` + IA doc |
| Wireframes                    | `docs/INFORMATION-ARCHITECTURE.md` (page blueprints) |
| **High-Fidelity UI**          | The built site itself (14 page templates) |
| Design System                 | `docs/DESIGN-SYSTEM.md` + `assets/css/styles.css` |
| Typography System             | `docs/DESIGN-SYSTEM.md` § Typography |
| Color System                  | `docs/DESIGN-SYSTEM.md` § Color |
| UX Copy                       | `docs/UX-COPY.md` |
| CRO Recommendations           | `docs/CRO-AND-SEO.md` |
| SEO                           | `docs/CRO-AND-SEO.md` + schema in pages |
| Mobile Experience / Responsive| `docs/DESIGN-SYSTEM.md` § Responsive |
| Developer Handoff             | `docs/DEVELOPER-HANDOFF.md` |

---

## File structure

```
fresh-valley/
├── index.html              Home (12 sections)
├── products.html           Collection — filter + sort
├── product.html            Product detail (?slug=) & Box detail (?box=)
├── hosting.html            The New Hosting Culture (brand story)
├── about.html              About + Behind the Quality (#quality)
├── journal.html            Blog index (filterable)
├── article.html            Article template (?slug=)
├── cart.html               Full cart
├── checkout.html           Apple-style checkout → confirmation
├── wishlist.html           Saved items
├── account.html            Dashboard (8 tabs)
├── contact.html            Contact + delivery areas + FAQ
├── policies.html           Company Policies
├── terms.html              Terms of Use
├── robots.txt · sitemap.xml
├── assets/
│   ├── css/styles.css      The whole design system
│   ├── js/data.js          Catalog (products, boxes, reviews, articles)
│   ├── js/app.js           Engine: shell, cart, wishlist, search, pricing, render helpers
│   └── img/                logo + 30 optimised product photos + favicon
├── _build/                 Local server + sitemap generator (not shipped to prod)
└── docs/                   This documentation
```

## Design intent in one paragraph

Light, warm **Cream/Bone** editorial canvas for breathing space, punctuated by full-bleed
**dark, cinematic produce photography** for hero and story moments. **Fraunces** (display
serif) carries the voice; **Hanken Grotesk** handles UI. A single **Brass** accent;
**Pomegranate** only as seasonal punctuation. No discount banners, no price explosions —
quiet luxury throughout.
