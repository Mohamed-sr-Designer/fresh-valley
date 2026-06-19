const router = require("express").Router();
const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

const toApi = (r) => ({
  slug: r.slug, name: r.name, category: r.category, kind: r.kind,
  basePrice: r.basePrice, price: r.price != null ? r.price : r.basePrice, priceOverride: r.price,
  unit: r.unit, stock: r.stock, active: !!r.active, featured: !!r.featured,
  image: r.image, noPhoto: !!r.noPhoto, data: r.data || null,
});

// GET /api/products  (public) — full catalog with effective prices & stock
router.get("/", (req, res) => res.json(db.products.all().map(toApi)));

// PATCH /api/products/:slug  (admin) — { price?, stock?, active?, featured? }
router.patch("/:slug", requireAuth, requireRole("super-admin", "admin"), (req, res) => {
  const p = db.products.find((x) => x.slug === req.params.slug);
  if (!p) return res.status(404).json({ error: "Product not found" });
  const b = req.body || {};
  const patch = {};
  if ("price" in b) patch.price = (b.price === null || b.price === "") ? null : Math.max(0, +b.price || 0);
  if ("stock" in b) patch.stock = Math.max(0, parseInt(b.stock, 10) || 0);
  if ("active" in b) patch.active = !!b.active;
  if ("featured" in b) patch.featured = !!b.featured;
  db.products.update((x) => x.slug === p.slug, patch);
  res.json(toApi(db.products.find((x) => x.slug === p.slug)));
});

module.exports = router;
