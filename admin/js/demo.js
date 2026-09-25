/* =====================================================================
   FRESH VALLEY Admin — demo data
   90 days of plausible activity built from the real catalog, areas and
   delivery slots: ~220 orders with repeat buyers, ~180 customers,
   ~6,000 tracked sessions with a consistent funnel, a few inbox
   messages. Stored ONLY in fv_demo_* keys; real data is never touched.
   ===================================================================== */
window.ADemo = (function () {
  "use strict";
  const { FV, D, K, get, set, del } = A;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const FIRST = ["Nour", "Yasmine", "Omar", "Mariam", "Hana", "Karim", "Salma", "Tarek", "Dina", "Ahmed", "Farida", "Sherif", "Laila", "Mostafa", "Rana", "Ziad", "Habiba", "Amr", "Nadia", "Hossam", "Aya", "Khaled", "Mona", "Sara", "Tamer", "Reem", "Youssef", "Malak", "Seif", "Jana", "Adam", "Lina", "Hassan", "Nada", "Mahmoud", "Rawan", "Ali", "Menna", "Yehia", "Heba"];
  const LAST = ["El-Din", "Fahmy", "Sherif", "Adel", "Mostafa", "Naguib", "Ezzat", "Hassan", "Saleh", "Lotfy", "Kamal", "Abdel-Aziz", "Younis", "Galal", "Sobhy", "Mansour", "Roshdy", "Fathy", "Wahba", "Darwish", "Soliman", "Reda", "El-Gohary", "Fouad", "Halim", "Barakat", "Said", "Tawfik", "Zaki", "Shawky"];
  const AREAS = [["New Cairo", 0.34], ["Sheikh Zayed", 0.26], ["October", 0.15], ["Madinaty", 0.14], ["Rehab", 0.11]];
  const PAY = [["Card", 0.45], ["Cash on delivery", 0.3], ["Mobile wallet", 0.15], ["Apple Pay", 0.1]];
  const SRC = [["social", 0.32], ["direct", 0.33], ["search", 0.27], ["referral", 0.08]];
  const DEV = [["mobile", 0.66], ["desktop", 0.28], ["tablet", 0.06]];
  const PAGES = [["index", 0.4], ["products", 0.25], ["product", 0.2], ["hosting", 0.08], ["journal", 0.04], ["about", 0.03]];
  const STREETS = ["Villa 12, South Lake", "Building 4, Beverly Hills", "Apt 7, Mivida", "Villa 3, Allegria", "Building 18, B6", "Apt 21, Dream Land", "Villa 9, Katameya Heights", "Building 2, Gate 13", "Apt 5, Zed Towers", "Villa 30, Palm Hills"];
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function wpick(r, pairs) { const x = r(); let acc = 0; for (const [v, w] of pairs) { acc += w; if (x < acc) return v; } return pairs[pairs.length - 1][0]; }

  function generate() {
    const r = rng(20260925);
    const DAY = 864e5, DAYS = 90, now = Date.now();
    const slots = (FV.settings.slots && FV.settings.slots.length) ? FV.settings.slots : ["Morning · 9–12", "Midday · 12–3", "Afternoon · 3–6", "Evening · 6–9"];
    // customers with a long-tail purchase propensity (repeat buyers)
    const customers = [];
    const used = new Set();
    for (let i = 0; i < 150; i++) {
      const f = pick(r, FIRST), l = pick(r, LAST);
      let email = (f + "." + l).toLowerCase().replace(/[^a-z.]/g, "") + "@" + pick(r, ["gmail.com", "hotmail.com", "outlook.com", "icloud.com", "yahoo.com"]);
      while (used.has(email)) email = email.replace("@", Math.floor(r() * 90 + 10) + "@");
      used.add(email);
      customers.push({ id: "D" + (1000 + i), name: f + " " + l, email, phone: "+20 1" + pick(r, ["0", "1", "2", "5"]) + " " + Math.floor(r() * 9000 + 1000) + " " + Math.floor(r() * 9000 + 1000), area: wpick(r, AREAS), w: Math.pow(r(), 2.4) + 0.02, first: null });
    }
    const totalW = customers.reduce((s, c) => s + c.w, 0);
    const pickCustomer = () => { let x = r() * totalW; for (const c of customers) { x -= c.w; if (x <= 0) return c; } return customers[0]; };
    const prods = D.products.filter((p) => p.status === "active" || !p.status);
    const pw = prods.map((p) => [p, ((p.collections || []).includes("best-sellers") ? 3.2 : (p.collections || []).includes("essentials") ? 2 : 1) * (p.category === "herbs" ? 0.7 : 1)]);
    const pwSum = pw.reduce((s, x) => s + x[1], 0);
    const pickProduct = () => { let x = r() * pwSum; for (const [p, w] of pw) { x -= w; if (x <= 0) return p; } return prods[0]; };
    const boxes = D.boxes.slice();
    const orders = [], ids = new Set(), events = [];
    let sidN = 0;
    const sid = () => "d" + (++sidN).toString(36);
    const WEEKDAY = [1.0, 0.85, 0.85, 0.95, 1.35, 1.3, 1.1]; // Sun..Sat — Thu/Fri peaks
    for (let d = DAYS - 1; d >= 0; d--) {
      const dayStart = new Date(now - d * DAY); dayStart.setHours(0, 0, 0, 0);
      const trend = 0.72 + 0.56 * (DAYS - d) / DAYS;
      const lambda = 2.45 * trend * WEEKDAY[dayStart.getDay()];
      let n = Math.max(0, Math.round(lambda + (r() - 0.5) * 2.2));
      const maxHour = d === 0 ? new Date().getHours() : 23;
      if (d === 0) n = Math.min(n, Math.max(1, Math.round(maxHour / 7)));
      for (let k = 0; k < n; k++) {
        const hour = Math.min(maxHour, 9 + Math.floor(Math.pow(r(), 0.8) * 14));
        const t = dayStart.getTime() + hour * 3600e3 + Math.floor(r() * 3600e3);
        if (t > now) continue;
        const c = pickCustomer();
        const items = [];
        const isBox = r() < (dayStart.getDay() === 4 || dayStart.getDay() === 5 ? 0.38 : 0.22);
        if (isBox) {
          const b = wpick(r, boxes.map((x) => [x, x.slug === "hosting-box" ? 0.42 : x.slug === "family-box" ? 0.24 : 0.34 / (boxes.length - 2)]));
          const tier = b.tiers[Math.min(b.tiers.length - 1, wpick(r, [[0, 0.5], [1, 0.35], [2, 0.15]]))];
          const rib = r() < 0.6 ? "Mid Forest" : "Charcoal";
          items.push({ slug: b.slug, type: "box", name: b.name, variant: tier.label + " · " + rib + " ribbon", price: tier.price, qty: 1, image: b.image });
        }
        const lines = isBox ? Math.floor(r() * 2) : 1 + Math.floor(r() * r() * 5);
        for (let j = 0; j < lines; j++) {
          const p = pickProduct();
          if (items.some((x) => x.slug === p.slug)) continue;
          let variant, price, qty = r() < 0.85 ? 1 : 2;
          if (p.unit === "kg") { const g = wpick(r, [[1000, 0.55], [500, 0.15], [2000, 0.2], [3000, 0.07], [4000, 0.03]]); variant = FV.weightLabel(g); price = FV.priceForWeight(p, g); }
          else { variant = p.unit === "bunch" ? "per bunch" : "each"; price = p.pricePerUnit; qty = 1 + Math.floor(r() * 2); }
          items.push({ slug: p.slug, type: "product", name: p.name, variant, price, qty, image: p.slug, noPhoto: !!p.noPhoto });
        }
        if (!items.length) continue;
        const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
        const delivery = subtotal >= FV.settings.freeThreshold ? 0 : FV.settings.deliveryFee;
        let code = "", discount = 0;
        if (!c.first && r() < 0.3) { code = "WELCOME10"; discount = Math.round(subtotal * 0.1); }
        else if (isBox && r() < 0.12) { code = "HOSTING15"; discount = Math.round(subtotal * 0.15); }
        const age = (now - t) / DAY;
        let status;
        if (age > 3) status = wpick(r, [["delivered", 0.92], ["cancelled", 0.05], ["refunded", 0.03]]);
        else if (age > 1.5) status = wpick(r, [["out", 0.3], ["delivered", 0.7]]);
        else if (age > 0.7) status = wpick(r, [["confirmed", 0.3], ["packed", 0.3], ["out", 0.4]]);
        else status = wpick(r, [["new", 0.55], ["confirmed", 0.3], ["packed", 0.15]]);
        let id; do { id = "FV" + Math.floor(150000 + r() * 849999); } while (ids.has(id)); ids.add(id);
        const payment = wpick(r, PAY), src = wpick(r, SRC), dev = wpick(r, DEV);
        const slotDay = new Date(t + DAY);
        const timeline = [{ t, msg: "Order placed on the website" }];
        const steps = { confirmed: "Order confirmed", packed: "Graded & packed", out: "Out for delivery", delivered: "Delivered" };
        const seq = ["confirmed", "packed", "out", "delivered"];
        const upto = status === "cancelled" || status === "refunded" ? 1 : Math.max(0, seq.indexOf(status) + 1);
        seq.slice(0, upto).forEach((s, i) => timeline.push({ t: Math.min(now, t + [0.3, 14, 18, 21][i] * 3600e3 + r() * 3600e3), msg: steps[s] }));
        if (status === "cancelled") timeline.push({ t: t + 2 * 3600e3, msg: "Order cancelled by customer" });
        if (status === "refunded") timeline.push({ t: t + 30 * 3600e3, msg: "Refunded — quality issue reported" });
        orders.push({
          id, date: new Date(t).toISOString(), customer: { name: c.name, email: c.email, phone: c.phone, area: c.area },
          address: pick(r, STREETS) + ", " + c.area, slot: slotDay.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + ", " + pick(r, slots),
          items, subtotal, discount, code, delivery, total: subtotal + delivery - discount, payment, status,
          fulfillment: status === "delivered" ? "fulfilled" : "unfulfilled", source: src, channel: "Website", timeline,
        });
        if (!c.first) c.first = t;
        // the purchasing session
        const s = sid();
        events.push({ t: t - 9 * 60e3, type: "page_view", sid: s, dev, src, page: wpick(r, PAGES), pv: 2 + Math.floor(r() * 6) });
        events.push({ t: t - 6 * 60e3, type: "add_to_cart", sid: s, dev, src, page: "product" });
        events.push({ t: t - 3 * 60e3, type: "checkout_start", sid: s, dev, src, page: "checkout" });
        events.push({ t, type: "purchase", sid: s, dev, src, page: "checkout", id, total: subtotal + delivery - discount });
      }
      // browsing sessions that didn't buy (≈3.4% conversion overall)
      const browse = Math.round((n / 0.034 - n) * (0.85 + r() * 0.3));
      for (let k = 0; k < browse; k++) {
        const t = dayStart.getTime() + (7 + Math.floor(Math.pow(r(), 0.7) * 16)) * 3600e3 + Math.floor(r() * 3600e3);
        if (t > now) continue;
        const s = sid(), dev = wpick(r, DEV), src = wpick(r, SRC);
        events.push({ t, type: "page_view", sid: s, dev, src, page: wpick(r, PAGES), pv: 1 + Math.floor(r() * r() * 7) });
        if (r() < 0.095) {
          events.push({ t: t + 120e3, type: "add_to_cart", sid: s, dev, src, page: "product" });
          if (r() < 0.42) events.push({ t: t + 300e3, type: "checkout_start", sid: s, dev, src, page: "checkout" });
        }
      }
    }
    // a couple of live visitors right now
    for (let i = 0; i < 4; i++) events.push({ t: now - Math.floor(r() * 240e3), type: "page_view", sid: sid(), dev: wpick(r, DEV), src: wpick(r, SRC), page: wpick(r, PAGES), pv: 1 });
    // clients: everyone who ordered + subscribers who haven't yet
    const clients = customers.filter((c) => c.first).map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, area: c.area, joined: new Date(c.first - Math.floor(r() * 20) * DAY).toISOString(), status: "active", marketing: r() < 0.62 }));
    customers.filter((c) => !c.first).slice(0, 36).forEach((c) => clients.push({ id: c.id, name: c.name, email: c.email, phone: "", area: c.area, joined: new Date(now - Math.floor(r() * 80) * DAY).toISOString(), status: "subscriber", marketing: true }));
    const msgs = [
      { first: "Nadia", last: "Wahba", email: "nadia.wahba@gmail.com", phone: "+20 100 555 2211", subject: "Hosting & events", message: "Hello! I'm hosting 30 guests for my daughter's engagement next Thursday. Could you prepare three Grand hosting boxes with extra dates and deliver them before 5pm?", status: "new", h: 3 },
      { first: "Youssef", last: "Halim", email: "y.halim@halimgroup.com", phone: "+20 122 410 8890", subject: "Corporate & events", message: "We'd like 40 Organic Reserve boxes as client gifts before the end of the quarter, each with a printed card. Can you share corporate pricing and lead times?", status: "new", h: 20 },
      { first: "Mona", last: "Reda", email: "mona.reda@hotmail.com", phone: "", subject: "A product question", message: "Are your Medjool dates from Siwa this season? My mother only eats the soft ones — I'd love to know before ordering 3 kg.", status: "read", h: 50 },
      { first: "Tamer", last: "Fouad", email: "tamer.fouad@outlook.com", phone: "+20 111 777 0042", subject: "An order", message: "My order arrived perfectly — just a note that the courier was early and very polite. Could I move my next delivery to the evening slot?", status: "read", h: 80 },
      { first: "Rana", last: "Sobhy", email: "rana.sobhy@gmail.com", phone: "", subject: "Wholesale & partnerships", message: "I run a small café in Madinaty and I'm looking for a weekly supply of strawberries, mint and lemons. Do you work with cafés?", status: "archived", h: 140 },
    ].map((m, i) => Object.assign({ id: "DM" + (100 + i), date: new Date(now - m.h * 3600e3).toISOString() }, m));
    msgs.forEach((m) => delete m.h);
    events.sort((a, b) => a.t - b.t);
    const ok = set(K.dOrders, orders) && set(K.dClients, clients) && set(K.dTrack, events) && set(K.dMessages, msgs);
    if (ok) set(K.demoOn, true);
    return { orders: orders.length, clients: clients.length, events: events.length, ok };
  }
  function clear() { [K.dOrders, K.dClients, K.dTrack, K.dMessages].forEach(del); set(K.demoOn, false); }
  const has = () => !!(get(K.dOrders, null) || []).length;
  return { generate, clear, has };
})();
