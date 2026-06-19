const router = require("express").Router();
const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

router.use(requireAuth, requireRole("super-admin"));

const paid = (o) => o.status !== "cancelled" && o.status !== "refunded";

// GET /api/analytics/summary  → KPIs + series + breakdowns for the dashboard
router.get("/summary", (req, res) => {
  const orders = db.orders.all();
  const paidO = orders.filter(paid);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const since = (days) => { const d = new Date(today); d.setDate(d.getDate() - days); return d; };

  const sum = (a) => a.reduce((s, o) => s + o.total, 0);
  const inRange = (o, a, b) => { const t = new Date(o.created_at); return t >= a && t < b; };
  const cur = paidO.filter((o) => inRange(o, since(30), new Date(today.getTime() + 864e5)));
  const prev = paidO.filter((o) => inRange(o, since(60), since(30)));
  const grow = (a, b) => b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100;

  const series = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, value: paidO.filter((o) => (o.created_at || "").slice(0, 10) === key).reduce((s, o) => s + o.total, 0) });
  }

  const catOf = {}; db.products.all().forEach((p) => { catOf[p.slug] = p.category; });
  const prodMap = {}, catMap = {}, areaMap = {}, chMap = {};
  paidO.forEach((o) => {
    areaMap[o.area || "Other"] = (areaMap[o.area || "Other"] || 0) + o.total;
    chMap[o.channel || "Website"] = (chMap[o.channel || "Website"] || 0) + o.total;
    (o.items || []).forEach((it) => {
      const k = it.slug;
      if (!prodMap[k]) prodMap[k] = { slug: k, name: it.name, kind: it.kind, units: 0, revenue: 0 };
      prodMap[k].units += it.qty; prodMap[k].revenue += it.price * it.qty;
      const cat = it.kind === "box" ? "Boxes" : (catOf[it.slug] || "Other");
      catMap[cat] = (catMap[cat] || 0) + it.price * it.qty;
    });
  });
  const toArr = (m) => Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  res.json({
    kpis: {
      revenue: sum(paidO), revenue30: sum(cur), revenueGrow: grow(sum(cur), sum(prev)),
      orders: orders.length, orders30: cur.length, ordersGrow: grow(cur.length, prev.length),
      aov: paidO.length ? sum(paidO) / paidO.length : 0,
      customers: db.customers.count(),
      pendingOrders: orders.filter((o) => o.status === "pending" || o.status === "processing").length,
      units: paidO.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + i.qty, 0), 0),
    },
    series,
    topProducts: Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    byCategory: toArr(catMap), byArea: toArr(areaMap), byChannel: toArr(chMap),
  });
});

module.exports = router;
