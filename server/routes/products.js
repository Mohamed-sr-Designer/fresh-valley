const router = require("express").Router();
const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

const toApi = (r) => ({
  slug: r.slug, name: r.name, category: r.category, kind: r.kind,
  basePrice: r.basePrice, price: r.price != null ? r.price : r.basePrice, priceOverride: r.price,
  unit: r.unit, stock: r.stock, active: !!r.active, featured: !!r.featured,
  image: r.image, noPhoto: !!r.noPhoto, data: r.data || null,
});
const slugify = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// GET /api/products  (public)
router.get("/", (req, res) => res.json(db.products.all().map(toApi)));

// POST /api/products  (super-admin) — create a product
router.post("/", requireAuth, requireRole("super-admin"), (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: "Product name is required" });
  let slug = b.slug || slugify(b.name);
  if (!slug) return res.status(400).json({ error: "Invalid name" });
  if (db.products.find((x) => x.slug === slug)) slug += "-" + String(Date.now()).slice(-4);
  const unit = b.unit || "kg";
  const row = {
    slug, name: b.name, category: b.category || "fruits", kind: b.kind || "product",
    basePrice: Math.max(0, +b.basePrice || +b.price || 0), unit, price: null,
    stock: Math.max(0, parseInt(b.stock, 10) || 0), active: true, featured: false,
    image: b.image || slug, noPhoto: !!b.noPhoto, data: b.data || null,
  };
  db.products.insert(row);
  res.status(201).json(toApi(row));
});

// PATCH /api/products/:slug  (admin) — price/stock/active/featured/name/category/unit
router.patch("/:slug", requireAuth, requireRole("super-admin", "admin"), (req, res) => {
  const p = db.products.find((x) => x.slug === req.params.slug);
  if (!p) return res.status(404).json({ error: "Product not found" });
  const b = req.body || {}; const patch = {};
  if ("price" in b) patch.price = (b.price === null || b.price === "") ? null : Math.max(0, +b.price || 0);
  if ("stock" in b && b.stock != null && b.stock !== "") patch.stock = Math.max(0, parseInt(b.stock, 10) || 0);
  if ("active" in b) patch.active = !!b.active;
  if ("featured" in b) patch.featured = !!b.featured;
  if (b.name != null) patch.name = String(b.name).slice(0, 120);
  if (b.category != null) patch.category = String(b.category).slice(0, 60);
  if (b.unit) patch.unit = b.unit;
  db.products.update((x) => x.slug === p.slug, patch);
  res.json(toApi(db.products.find((x) => x.slug === p.slug)));
});

// DELETE /api/products/:slug  (super-admin)
router.delete("/:slug", requireAuth, requireRole("super-admin"), (req, res) => {
  if (!db.products.find((x) => x.slug === req.params.slug)) return res.status(404).json({ error: "Product not found" });
  db.products.remove((x) => x.slug === req.params.slug);
  res.json({ ok: true });
});

module.exports = router;
