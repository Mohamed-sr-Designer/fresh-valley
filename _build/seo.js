/* =====================================================================
   FRESH VALLEY — SEO + GEO build
   Writes one managed block (<!--seo--> … <!--/seo-->) into every page head:
   canonical, Open Graph + Twitter cards, hreflang, local geo signals and
   JSON-LD (Organization, WebSite, GroceryStore with service areas and
   hours, BreadcrumbList, FAQPage, ItemList / CollectionPage). Also writes
   llms.txt (a plain-language brief for AI answer engines), robots.txt that
   welcomes search + AI crawlers, and the 1200×630 share image.
   Usage: node _build/seo.js   (sharp needed for og image)
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const SITE = "https://freshvalley.eg/";
global.window = {}; global.location = { search: "" }; global.localStorage = { getItem: () => null }; global.sessionStorage = { getItem: () => null };
eval(fs.readFileSync(path.join(ROOT, "assets/js/data.js"), "utf8"));
eval(fs.readFileSync(path.join(ROOT, "assets/js/theme.js"), "utf8"));
const D = window.FV_DATA, T = window.FVTheme.defaults(), S = T.settings;
const OG = SITE + "assets/img/og.jpg";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const ORG = {
  "@type": "Organization", "@id": SITE + "#org", name: "Fresh Valley", url: SITE,
  logo: SITE + "assets/img/logo.png", image: OG, email: S.contact.email, telephone: S.contact.phone,
  description: "Fresh Valley is a premium produce company in Cairo, Egypt: export-grade fruit, vegetables, herbs and curated hosting boxes, graded by hand and delivered next-day.",
  sameAs: Object.values(S.social),
};
const STORE = {
  "@type": ["GroceryStore", "LocalBusiness"], "@id": SITE + "#store", name: "Fresh Valley", url: SITE, image: OG, logo: SITE + "assets/img/logo.png",
  telephone: S.contact.phone, email: S.contact.email, priceRange: "EGP 20 – EGP 1,450", currenciesAccepted: "EGP",
  paymentAccepted: "Credit card, Debit card, Apple Pay, Mobile wallet, Cash on delivery",
  address: { "@type": "PostalAddress", addressLocality: "Cairo", addressRegion: "Cairo Governorate", addressCountry: "EG" },
  geo: { "@type": "GeoCoordinates", latitude: 30.0444, longitude: 31.2357 },
  areaServed: S.areas.map((a) => ({ "@type": "City", name: a + ", Egypt" })),
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], opens: "09:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "13:00", closes: "21:00" },
  ],
  hasOfferCatalog: { "@type": "OfferCatalog", name: "Fresh produce and hosting boxes", itemListElement: ["Fruits", "Vegetables", "Herbs", "Hosting boxes"].map((n) => ({ "@type": "OfferCatalog", name: n })) },
  parentOrganization: { "@id": SITE + "#org" },
};
const WEBSITE = { "@type": "WebSite", "@id": SITE + "#web", url: SITE, name: "Fresh Valley", inLanguage: "en-EG", publisher: { "@id": SITE + "#org" },
  potentialAction: { "@type": "SearchAction", target: SITE + "products.html?q={search_term_string}", "query-input": "required name=search_term_string" } };
const crumbs = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + u })) });

const faq = (T.pages.contact.sections.find((s) => s.type === "faq") || { blocks: [] }).blocks.map((b) => ({ "@type": "Question", name: b.settings.q, acceptedAnswer: { "@type": "Answer", text: b.settings.a } }));
const productList = (ps) => ({ "@type": "ItemList", itemListElement: ps.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + "product.html?slug=" + p.slug, name: p.name })) });

const PAGES = {
  index: { path: "", type: "website", ld: [ORG, WEBSITE, STORE, productList(D.products.slice(0, 12))] },
  products: { path: "products.html", type: "website", ld: [ORG, { "@type": "CollectionPage", name: "Shop fresh produce", url: SITE + "products.html", isPartOf: { "@id": SITE + "#web" } }, crumbs([["Home", ""], ["Shop", "products.html"]]), productList(D.products)] },
  hosting: { path: "hosting.html", type: "website", ld: [ORG, crumbs([["Home", ""], ["The Art of Hosting", "hosting.html"]]), { "@type": "ItemList", name: "Hosting boxes", itemListElement: D.boxes.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + "product.html?box=" + b.slug, name: b.name })) }] },
  about: { path: "about.html", type: "website", ld: [ORG, STORE, crumbs([["Home", ""], ["About", "about.html"]])] },
  contact: { path: "contact.html", type: "website", ld: [ORG, STORE, crumbs([["Home", ""], ["Contact", "contact.html"]]), { "@type": "FAQPage", mainEntity: faq }] },
  journal: { path: "journal.html", type: "website", ld: [ORG, crumbs([["Home", ""], ["Journal", "journal.html"]]), { "@type": "Blog", name: "The Fresh Valley Journal", url: SITE + "journal.html", blogPost: D.articles.map((a) => ({ "@type": "BlogPosting", headline: a.title, url: SITE + "article.html?slug=" + a.slug, image: SITE + "assets/img/products/" + a.image + ".jpg" })) }] },
  policies: { path: "policies.html", type: "website", ld: [ORG, crumbs([["Home", ""], ["Company policies", "policies.html"]])] },
  terms: { path: "terms.html", type: "website", ld: [ORG, crumbs([["Home", ""], ["Terms of use", "terms.html"]])] },
  product: { path: null, type: "product", ld: [ORG] },
  article: { path: null, type: "article", ld: [ORG] },
  cart: { path: null, noindex: true }, checkout: { path: null, noindex: true }, wishlist: { path: null, noindex: true }, account: { path: null, noindex: true }, "404": { path: null, noindex: true },
};

for (const [key, cfg] of Object.entries(PAGES)) {
  const file = path.join(ROOT, key + ".html");
  let html = fs.readFileSync(file, "utf8");
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "Fresh Valley";
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || ORG.description;
  // remove the hand-written tags the block now owns
  html = html.replace(/\n?\s*<!--seo-->[\s\S]*?<!--\/seo-->/, "")
    .replace(/\n\s*<link rel="canonical"[^>]*>/g, "").replace(/\n\s*<meta property="og:[^>]*>/g, "").replace(/\n\s*<meta name="twitter:[^>]*>/g, "");
  const url = cfg.path != null ? SITE + cfg.path : null;
  const tags = [];
  if (cfg.noindex) tags.push('<meta name="robots" content="noindex, follow">');
  else {
    tags.push('<meta name="robots" content="index, follow, max-image-preview:large">');
    if (url) tags.push(`<link rel="canonical" href="${url}">`, `<link rel="alternate" hreflang="en-EG" href="${url}">`, `<link rel="alternate" hreflang="x-default" href="${url}">`);
    tags.push(`<meta property="og:site_name" content="Fresh Valley">`, `<meta property="og:locale" content="en_EG">`, `<meta property="og:type" content="${cfg.type}">`,
      `<meta property="og:title" content="${esc(title)}">`, `<meta property="og:description" content="${esc(desc)}">`, `<meta property="og:image" content="${OG}">`,
      `<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`, url ? `<meta property="og:url" content="${url}">` : "",
      `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${esc(title)}">`, `<meta name="twitter:description" content="${esc(desc)}">`, `<meta name="twitter:image" content="${OG}">`,
      `<meta name="geo.region" content="EG-C">`, `<meta name="geo.placename" content="Cairo">`, `<meta name="geo.position" content="30.0444;31.2357">`, `<meta name="ICBM" content="30.0444, 31.2357">`);
    if (cfg.ld && cfg.ld.length) tags.push(`<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": cfg.ld })}</script>`);
  }
  html = html.replace(/\n\s*<meta name="robots"[^>]*>/g, "");
  const block = "\n  <!--seo-->\n  " + tags.filter(Boolean).join("\n  ") + "\n  <!--/seo-->";
  html = html.replace(/(<meta name="description"[^>]*>|<title>[^<]*<\/title>)(?![\s\S]*<meta name="description")/, (m) => m + block);
  if (!html.includes("<!--seo-->")) html = html.replace("</title>", "</title>" + block);
  fs.writeFileSync(file, html);
  console.log("seo", key.padEnd(9), cfg.noindex ? "noindex" : (cfg.ld || []).length + " ld");
}

/* llms.txt — the brief AI answer engines read */
const fruit = D.products.filter((p) => p.category === "fruits"), veg = D.products.filter((p) => p.category === "vegetables"), herbs = D.products.filter((p) => p.category === "herbs");
const line = (p) => `- ${p.name} — ${p.origin}; ${/all year/i.test(p.season) ? "all year" : "in season " + p.season}; EGP ${p.unit === "kg" ? p.pricePerKg + " per kg" : p.pricePerUnit + (p.unit === "bunch" ? " per bunch" : " each")} — ${SITE}product.html?slug=${p.slug}`;
const llms = `# Fresh Valley

> Fresh Valley is a premium produce company in Cairo, Egypt. It sells export-grade fruit, vegetables and fresh herbs, chosen and graded by hand, plus curated hosting boxes that are arranged and wrapped as gifts. Orders placed before 6pm are delivered the next day across New Cairo, Sheikh Zayed, 6th of October, Madinaty and Rehab.

## Key facts
- Website: ${SITE}
- Location: Cairo, Egypt (delivery only — no walk-in shop)
- Delivery areas: ${S.areas.join(", ")}
- Delivery: next-day slots (9–12, 12–3, 3–6, 6–9); complimentary over EGP 600, otherwise EGP 45
- Quality promise: anything not perfect is replaced or refunded if reported within 24 hours
- Payment: Visa, Mastercard, Apple Pay, mobile wallets, cash on delivery
- Accounts: guest checkout available; signed-in customers get instant restock and new-arrival alerts
- Contact: ${S.contact.email} · ${S.contact.phone} · WhatsApp +${S.contact.whatsapp}
- Hours: ${S.contact.hours}

## Hosting boxes
${D.boxes.map((b) => `- ${b.name} — ${b.tagline} From EGP ${Math.min(...b.tiers.map((t) => t.price))}. ${SITE}product.html?box=${b.slug}`).join("\n")}

## Fruit
${fruit.map(line).join("\n")}

## Vegetables
${veg.map(line).join("\n")}

## Herbs
${herbs.map(line).join("\n")}

## Pages
- [Shop](${SITE}products.html): every product, filterable by fruit, vegetables, herbs and boxes
- [The Art of Hosting](${SITE}hosting.html): why a box of the season makes a better gift
- [About](${SITE}about.html): how produce is selected, graded and kept cold
- [Contact & delivery areas](${SITE}contact.html)
- [Company policies](${SITE}policies.html): freshness guarantee, delivery, returns, payment, privacy
- [Journal](${SITE}journal.html): recipes, hosting ideas and produce education
`;
fs.writeFileSync(path.join(ROOT, "llms.txt"), llms);

fs.writeFileSync(path.join(ROOT, "robots.txt"), `# Search engines and AI answer engines are welcome on the public store.
User-agent: *
Allow: /
Disallow: /cart.html
Disallow: /checkout.html
Disallow: /account.html
Disallow: /wishlist.html
Disallow: /admin/

User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${SITE}sitemap.xml
`);

try {
  const sharp = require("sharp");
  sharp(path.join(ROOT, "assets/img/hero/hero-2400.jpg")).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(ROOT, "assets/img/og.jpg")).then(() => console.log("og.jpg written"));
} catch (e) { console.log("sharp not available — og.jpg skipped"); }
console.log("llms.txt + robots.txt written");
