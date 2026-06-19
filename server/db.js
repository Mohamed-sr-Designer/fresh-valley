/* =====================================================================
   Database — pure-JS JSON store (see store.js). Creates collections and
   seeds them from the catalog (data.js) + .env. Swap store.js for a SQL
   adapter to scale; the routes only use the small helper surface.
   ===================================================================== */
require("dotenv").config();
const path = require("path");
const bcrypt = require("bcryptjs");
const { createStore } = require("./store");
const { loadCatalog } = require("./catalog");

const DB_FILE = process.env.DB_FILE || "./data/fresh-valley.json";
const dbPath = path.isAbsolute(DB_FILE) ? DB_FILE : path.join(__dirname, DB_FILE.replace(/\.db$/, ".json"));
const db = createStore(dbPath);

const DEFAULT_SETTINGS = {
  storeName: "Fresh Valley", currency: "EGP", storeOpen: true,
  deliveryFee: 45, freeThreshold: 600, taxRate: 0, lowStockAt: 120,
};

function defaultStock(slug) {
  let h = 0; for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return 80 + (h % 920);
}

function seedProducts() {
  if (db.products.count() > 0) return 0;
  const D = loadCatalog();
  D.products.forEach((p) => {
    const base = p.unit === "kg" ? p.pricePerKg : p.pricePerUnit;
    db.products.insert({ slug: p.slug, name: p.name, category: p.category, kind: "product",
      basePrice: base || 0, unit: p.unit || "each", price: null, stock: defaultStock(p.slug),
      active: true, featured: false, image: p.slug, noPhoto: !!p.noPhoto, data: p });
  });
  (D.boxes || []).forEach((b) => {
    const from = Math.min(...b.tiers.map((t) => t.price));
    db.products.insert({ slug: b.slug, name: b.name, category: "boxes", kind: "box",
      basePrice: from, unit: "box", price: null, stock: 999, active: true, featured: false,
      image: b.image, noPhoto: false, data: b });
  });
  return db.products.count();
}

function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@freshvalley.eg").toLowerCase();
  if (db.users.find((u) => u.email === email)) return false;
  db.users.insert({ id: db.users.nextId(), name: process.env.SEED_ADMIN_NAME || "Mohamed Tarek",
    email, password: bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || "fresh-admin", 12),
    role: "super-admin", created_at: new Date().toISOString() });
  return true;
}

function seedSite() {
  if (db.site.get("settings") === undefined) db.site.set("settings", DEFAULT_SETTINGS);
  if (db.site.get("content") === undefined) db.site.set("content", {});
  if (db.site.get("theme") === undefined) db.site.set("theme", {});
  if (db.site.get("images") === undefined) db.site.set("images", {});
}

function seedDemo() {
  if (db.orders.count() > 0) return 0;
  const products = db.products.where((p) => p.kind === "product");
  const boxes = db.products.where((p) => p.kind === "box");
  const NAMES = ["Nour El-Din","Yasmine Fahmy","Omar Sherif","Mariam Adel","Hana Mostafa","Karim Naguib","Salma Ezzat","Tarek Hassan","Dina Saleh","Ahmed Lotfy","Farida Kamal","Laila Younis","Rana Sobhy","Ziad Mansour","Amr Fathy","Aya Soliman","Mona Reda","Sara El-Gohary","Reem Adel","Youssef Halim"];
  const AREAS = ["New Cairo","Sheikh Zayed","October","Madinaty","Rehab"];
  const CHANNELS = ["Website","Mobile App","WhatsApp","Phone"];
  const PAYMENTS = ["Credit card","Debit card","Apple Pay","Mobile wallet"];
  const emailFor = (n) => n.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + "@gmail.com";
  let s = 20260618; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const pick = (a) => a[(rnd() * a.length) | 0];
  const seenC = {};

  for (let i = 0; i < 70; i++) {
    const daysAgo = Math.floor(Math.pow(rnd(), 1.7) * 90);
    const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(8 + ((rnd() * 12) | 0), (rnd() * 60) | 0, 0, 0);
    const name = pick(NAMES), email = emailFor(name), area = pick(AREAS);
    const phone = "+20 1" + ((rnd() * 4) | 0) + " " + (1000 + ((rnd() * 8999) | 0)) + " " + (1000 + ((rnd() * 8999) | 0));
    const items = []; let subtotal = 0;
    if (rnd() < 0.28 && boxes.length) { const b = pick(boxes); const t = pick(b.data.tiers); items.push({ slug: b.slug, kind: "box", name: b.name, variant: t.label, price: t.price, qty: 1, image: b.image }); subtotal += t.price; }
    const n = 1 + ((rnd() * 4) | 0);
    for (let j = 0; j < n; j++) { const p = pick(products); const qty = 1 + ((rnd() * 3) | 0); const price = Math.round(p.basePrice); const variant = p.unit === "kg" ? "1 kg" : (p.unit === "bunch" ? "per bunch" : "each"); items.push({ slug: p.slug, kind: "product", name: p.name, variant, price, qty, image: p.image, noPhoto: !!p.noPhoto }); subtotal += price * qty; }
    const delivery = subtotal >= DEFAULT_SETTINGS.freeThreshold ? 0 : DEFAULT_SETTINGS.deliveryFee;
    let status; const sr = rnd();
    if (daysAgo <= 0) status = sr < 0.5 ? "pending" : "processing";
    else if (daysAgo <= 2) status = sr < 0.4 ? "transit" : "delivered";
    else status = sr < 0.05 ? "cancelled" : "delivered";
    db.orders.insert({ id: "FV" + (100000 + i * 137 + ((rnd() * 90) | 0)), created_at: d.toISOString(),
      email, name, phone, area, address: "Villa " + (((rnd() * 80) | 0) + 1) + ", " + area,
      slot: "Next day", channel: pick(CHANNELS), payment: pick(PAYMENTS), status,
      subtotal, delivery, total: subtotal + delivery, items });
    if (!seenC[email]) {
      const joined = new Date(d); joined.setDate(joined.getDate() - (5 + ((rnd() * 200) | 0)));
      db.customers.insert({ id: db.customers.nextId(), name, email, phone, area, status: "active", joined: joined.toISOString() });
      seenC[email] = true;
    }
  }
  return db.orders.count();
}

function seedAll({ demo } = {}) {
  const p = seedProducts();
  const a = seedAdmin();
  seedSite();
  const runDemo = demo === undefined ? (process.env.SEED_DEMO !== "false") : demo;
  const o = runDemo ? seedDemo() : 0;
  db.flush();
  return { products: p, adminCreated: a, demoOrders: o };
}

/* CLI:  node db.js --seed   |   node db.js --reset */
if (require.main === module) {
  if (process.argv.includes("--reset")) {
    ["users", "products", "customers", "orders"].forEach((k) => db.remove ? null : null);
    db._data.users = []; db._data.products = []; db._data.customers = []; db._data.orders = []; db._data.site = {}; db._data.seq = {};
    db.flush(); console.log("Store reset.");
  }
  console.log("Seed complete:", seedAll({ demo: process.env.SEED_DEMO !== "false" }));
  process.exit(0);
}

module.exports = { db, seedAll, DEFAULT_SETTINGS };
