<div align="center">

# Fresh Valley

### Premium produce for better hosting

Export-grade fruits, vegetables and curated produce boxes — a premium **brand experience**,
not an online grocery store. Built for upper-class Egypt: New Cairo, Sheikh Zayed, October,
Madinaty & Rehab.

</div>

---

## ✦ Overview

A framework-free, production-grade storefront with a quiet-luxury aesthetic — warm forested
palette, glassmorphism, generous negative space, an app-like mobile shell, and a fully
shoppable hero. **The Art of Hosting** is the brand's signature edge: arrive at a gathering
with a hand-graded box of produce instead of the usual cola or sweets.

- **14 pages** — Home, Products, Product/Box detail, The Art of Hosting, About, Journal +
  Article, Cart, Checkout, Wishlist, Account, Contact, Policies, Terms.
- **One design system** (`assets/css/styles.css`), **one catalog** (`assets/js/data.js`),
  **one engine** (`assets/js/app.js`) — cart, wishlist, search, sliders, glass UI, PWA shell.
- **Installable PWA** with a glass bottom tab bar, splash screen, and offline-ready manifest.
- **SEO-ready** — per-page meta, JSON-LD (Organization / Product / Article), sitemap, robots.

## ✦ Run locally

Static site — any server works. A zero-dependency Node server ships in the repo:

```bash
node _build/server.js 5500   # → http://localhost:5500
```

Regenerate the sitemap after editing the catalog:

```bash
node _build/generate-sitemap.js
```

## ✦ Structure

```
index.html · products.html · product.html · hosting.html · about.html
journal.html · article.html · cart.html · checkout.html · wishlist.html
account.html · contact.html · policies.html · terms.html
assets/  css · js · img (products, thumbnails, banners, icons, logo)
docs/    design system · IA & user flows · UX copy · CRO/SEO · dev handoff
_build/  local server + sitemap generator
```

Full documentation lives in [`/docs`](docs/).

---

<div align="center">
<sub>© Fresh Valley — Cairo, Egypt. Design & build by Mohamed Tarek.</sub>
</div>
