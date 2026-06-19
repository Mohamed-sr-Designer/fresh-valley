const router = require("express").Router();
const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

router.use(requireAuth, requireRole("super-admin"));

const clean = (s) => typeof s === "string" ? s.replace(/[<>]/g, "").slice(0, 200) : s;

// GET /api/customers — merges registered customers with order activity
router.get("/", (req, res) => {
  const byEmail = {};
  db.customers.all().forEach((c) => { byEmail[c.email] = { id: c.id, name: c.name, email: c.email, phone: c.phone, area: c.area, status: c.status, joined: c.joined, orders: 0, spent: 0, last: null }; });
  db.orders.all().forEach((o) => {
    if (!o.email) return;
    const c = byEmail[o.email] || (byEmail[o.email] = { name: o.name || o.email, email: o.email, phone: o.phone, area: o.area, status: "active", joined: o.created_at, orders: 0, spent: 0, last: null });
    if (o.status !== "cancelled" && o.status !== "refunded") { c.spent += o.total; c.orders += 1; }
    if (!c.last || new Date(o.created_at) > new Date(c.last)) c.last = o.created_at;
  });
  const list = Object.values(byEmail);
  list.forEach((c) => { if (c.spent >= 4000 && c.status !== "vip") c.status = "vip"; });
  list.sort((a, b) => b.spent - a.spent);
  res.json(list);
});

// PATCH /api/customers/:id  { name?, phone?, area?, status? }
router.patch("/:id", (req, res) => {
  const c = db.customers.find((x) => String(x.id) === String(req.params.id));
  if (!c) return res.status(404).json({ error: "Customer not found" });
  const b = req.body || {};
  const validStatus = ["active", "vip", "pending", "lead"];
  db.customers.update((x) => x.id === c.id, {
    name: clean(b.name) || c.name,
    phone: b.phone !== undefined ? clean(b.phone) : c.phone,
    area: b.area !== undefined ? clean(b.area) : c.area,
    status: validStatus.includes(b.status) ? b.status : c.status,
  });
  res.json(db.customers.find((x) => x.id === c.id));
});

module.exports = router;
