// Generates sitemap.xml from the catalog + static pages.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
global.window = {};
eval(fs.readFileSync(path.join(ROOT, "assets/js/data.js"), "utf8"));
const D = global.window.FV_DATA;

const BASE = "https://freshvalley.eg/";
const today = new Date().toISOString().slice(0, 10);

const urls = [];
const add = (loc, pri, freq) => urls.push({ loc, pri, freq });

// Static
add("index.html", "1.0", "daily");
add("products.html", "0.9", "daily");
add("hosting.html", "0.8", "monthly");
add("about.html", "0.6", "monthly");
add("journal.html", "0.7", "weekly");
add("contact.html", "0.5", "yearly");
add("policies.html", "0.3", "yearly");
add("terms.html", "0.3", "yearly");

// Category landing
["fruits", "vegetables", "herbs", "boxes", "seasonal", "organic-reserve"].forEach(c =>
  add("products.html?cat=" + c, "0.8", "weekly"));

// Products
D.products.forEach(p => add("product.html?slug=" + p.slug, "0.7", "weekly"));
// Boxes
D.boxes.forEach(b => add("product.html?box=" + b.slug, "0.7", "weekly"));
// Articles
D.articles.forEach(a => add("article.html?slug=" + a.slug, "0.6", "monthly"));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE}${u.loc.replace(/&/g, "&amp;")}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
console.log("sitemap.xml written with " + urls.length + " URLs");
