const router = require("express").Router();
const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

const clean = (s) => typeof s === "string" ? s.replace(/[<>]/g, "").slice(0, 300) : s;
const toApi = (r) => ({
  id: r.id, date: r.created_at, status: r.status, channel: r.channel, payment: r.payment,
  subtotal: r.subtotal, delivery: r.delivery, total: r.total, slot: r.slot, address: r.address,
  customer: { name: r.name, email: r.email, phone: r.phone, area: r.area },
  items: r.items || [],
});
const STATUSES = ["pending", "processing", "transit", "delivered", "cancelled", "refunded"];

// POST /api/orders  (public — storefront checkout). Totals recomputed server-side.
router.post("/", (req, res) => {
  const b = req.body || {};
  const c = b.customer || {};
  if (!c.email || !c.name) return res.status(400).json({ error: "Customer name and email are required" });
  if (!Array.isArray(b.items) || !b.items.length) return res.status(400).json({ error: "Order has no items" });

  let subtotal = 0; const items = [];
  for (const it of b.items) {
    const p = db.products.find((x) => x.slug === it.slug);
    if (!p || !p.active) continue;
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
    let price = p.price != null ? p.price : p.basePrice;
    if (p.kind === "box" && it.variant && p.data) {
      const tier = (p.data.tiers || []).find((t) => t.label === it.variant);
      if (tier) price = tier.price;
    }
    subtotal += price * qty;
    items.push({ slug: p.slug, kind: p.kind, name: p.name, variant: clean(it.variant) || "", price, qty, image: p.image, noPhoto: !!p.noPhoto });
  }
  if (!items.length) return res.status(400).json({ error: "None of the items are available" });

  const settings = db.site.get("settings") || {};
  const delivery = subtotal >= (settings.freeThreshold || 0) ? 0 : (settings.deliveryFee || 0);
  const id = "FV" + Math.floor(100000 + Math.random() * 899999);
  const order = {
    id, created_at: new Date().toISOString(),
    email: clean(c.email).toLowerCase(), name: clean(c.name), phone: clean(c.phone), area: clean(c.area),
    address: clean(b.address), slot: clean(b.slot), channel: "Website", payment: clean(b.payment) || "Card",
    status: "pending", subtotal, delivery, total: subtotal + delivery, items,
  };
  db.orders.insert(order);

  const email = order.email;
  if (!db.customers.find((x) => x.email === email))
    db.customers.insert({ id: db.customers.nextId(), name: order.name, email, phone: order.phone, area: order.area, status: "active", joined: order.created_at });
  else db.customers.update((x) => x.email === email, { name: order.name, phone: order.phone, area: order.area });

  res.status(201).json(toApi(order));
});

// Everything below is admin-only.
router.use(requireAuth, requireRole("super-admin"));

router.get("/", (req, res) => {
  let rows = db.orders.all().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const { status, channel, q } = req.query;
  if (status && status !== "all") rows = rows.filter((r) => r.status === status);
  if (channel && channel !== "all") rows = rows.filter((r) => r.channel === channel);
  if (q) { const qq = q.toLowerCase(); rows = rows.filter((r) => (r.id + r.name + r.email + r.area).toLowerCase().includes(qq)); }
  res.json(rows.map(toApi));
});

router.get("/:id", (req, res) => {
  const r = db.orders.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Order not found" });
  res.json(toApi(r));
});

router.patch("/:id", (req, res) => {
  const r = db.orders.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Order not found" });
  if (!STATUSES.includes((req.body || {}).status)) return res.status(400).json({ error: "Invalid status" });
  db.orders.update((x) => x.id === r.id, { status: req.body.status });
  res.json(toApi(db.orders.find((x) => x.id === r.id)));
});

module.exports = router;
