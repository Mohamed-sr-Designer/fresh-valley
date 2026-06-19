/* =====================================================================
   FRESH VALLEY — Admin engine + data store
   ---------------------------------------------------------------------
   The storefront is a static site (no backend). This file turns
   localStorage into a working "database" so the Super Admin dashboard
   can read & control everything: orders, clients, products, prices,
   theme, content and settings. The public storefront (app.js) reads the
   SAME keys, so admin edits show up live on the site (this browser).

   Production note: to make edits global for ALL visitors you swap the
   FVStore read/write methods for real API calls — the rest of the
   dashboard UI stays exactly the same. See /docs/DEVELOPER-HANDOFF.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.FV_DATA;

  /* ------------------------------------------------------------------ *
   * localStorage keys — shared contract with the storefront (app.js)
   * ------------------------------------------------------------------ */
  const K = {
    orders:   "fv_orders",
    clients:  "fv_clients",
    theme:    "fv_admin_theme",
    prices:   "fv_admin_prices",
    pmeta:    "fv_admin_pmeta",     // per-product { active, stock, featured }
    content:  "fv_admin_content",
    images:   "fv_admin_images",    // banner/image src overrides { key: url }
    settings: "fv_admin_settings",
    session:  "fv_admin_session",
    users:    "fv_admin_users",     // [{ id, name, email, password, role }]
    seeded:   "fv_admin_seeded",
  };

  /* ------------------------------------------------------------------ *
   * Roles — which dashboard pages each role may see
   * ------------------------------------------------------------------ */
  const ROLES = {
    "super-admin": { label: "Super Admin", pages: ["dashboard", "orders", "customers", "analytics", "products", "content", "appearance", "images", "users", "settings"] },
    "admin":       { label: "Admin · Design & SEO", pages: ["products", "appearance", "images", "content"] },
  };

  const store = {
    get(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.warn("Storage write failed for " + k, e); try { window.ADMIN && ADMIN.toast && ADMIN.toast("Couldn't save — storage is full. Try a smaller image."); } catch (_) {} return false; } },
  };

  // Safety net — never leave a blank white admin screen. If an uncaught error
  // fires before the shell (or login) mounts, show a recovery panel instead.
  window.addEventListener("error", function () {
    setTimeout(function () {
      if (document.querySelector(".ad-sidebar") || document.querySelector(".ad-login") || document.getElementById("adFatal")) return;
      var d = document.createElement("div"); d.id = "adFatal";
      d.style.cssText = "max-width:460px;margin:14vh auto;padding:2rem;font-family:system-ui,sans-serif;text-align:center;color:#1B2620";
      d.innerHTML = '<h2 style="font-family:Georgia,serif;margin:0 0 .5rem;font-size:1.5rem">Something hiccupped</h2>'
        + '<p style="color:#5C6B61;margin:0 0 1.3rem;font-size:.92rem">The console hit an unexpected error. Reload, or reset the demo data if it keeps happening.</p>'
        + '<div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap">'
        + '<button onclick="location.reload()" style="font:inherit;padding:.6rem 1.1rem;border:1px solid #E8E2D6;border-radius:10px;background:#fff;cursor:pointer">Reload</button>'
        + '<button onclick="try{[\'fv_orders\',\'fv_clients\',\'fv_admin_seeded\'].forEach(function(k){localStorage.removeItem(k)})}catch(e){};location.reload()" style="font:inherit;padding:.6rem 1.1rem;border:0;border-radius:10px;background:#16361F;color:#fff;cursor:pointer">Reset demo data</button>'
        + '<a href="login.html" style="font:inherit;padding:.6rem 1.1rem;border:1px solid #E8E2D6;border-radius:10px;background:#fff;cursor:pointer;text-decoration:none;color:inherit">Sign in again</a>'
        + '</div>';
      (document.body || document.documentElement).appendChild(d);
    }, 80);
  });

  /* ------------------------------------------------------------------ *
   * Deterministic PRNG — so seeded demo data is identical every load
   * ------------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------ *
   * Settings (with defaults) + money formatting
   * ------------------------------------------------------------------ */
  const SETTINGS_DEFAULT = {
    storeName: "Fresh Valley",
    currency: "EGP",
    storeOpen: true,
    deliveryFee: 45,
    freeThreshold: 600,
    taxRate: 0,
    lowStockAt: 120,
    adminEmail: "admin@freshvalley.eg",
    adminPass: "fresh-admin",
  };
  function settings() { return Object.assign({}, SETTINGS_DEFAULT, store.get(K.settings, {})); }
  function saveSettings(s) { store.set(K.settings, Object.assign({}, settings(), s)); }

  function money(n) {
    const s = settings();
    return s.currency + " " + Math.round(n || 0).toLocaleString("en-US");
  }
  function num(n, d) { return (+n || 0).toLocaleString("en-US", { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }); }
  function pct(n) { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%"; }

  /* ------------------------------------------------------------------ *
   * Catalog helpers (read-through admin price/meta overrides)
   * ------------------------------------------------------------------ */
  const allItems = () => [
    ...D.products.map((p) => ({ ...p, kind: "product" })),
    ...D.boxes.map((b) => ({ ...b, kind: "box", category: "boxes" })),
  ];
  const findItem = (slug) => allItems().find((p) => p.slug === slug);

  function basePrice(item) {
    if (item.kind === "box") return Math.min(...item.tiers.map((t) => t.price));
    if (item.unit === "kg") return item.pricePerKg;
    return item.pricePerUnit;
  }
  function priceUnit(item) {
    if (item.kind === "box") return "from";
    if (item.unit === "kg") return "/ kg";
    if (item.unit === "bunch") return "/ bunch";
    return "each";
  }
  function effectivePrice(item) {
    const o = store.get(K.prices, {})[item.slug];
    return o != null ? o : basePrice(item);
  }
  function pmeta(slug) {
    const m = store.get(K.pmeta, {})[slug] || {};
    return Object.assign({ active: true, stock: defaultStock(slug), featured: false }, m);
  }
  // Stable pseudo-stock per slug so the demo looks alive before any edits
  function defaultStock(slug) {
    let h = 0; for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    return 80 + (h % 920);
  }

  /* ------------------------------------------------------------------ *
   * SEED — generate realistic demo orders & clients (once)
   * ------------------------------------------------------------------ */
  const NAMES = [
    "Nour El-Din", "Yasmine Fahmy", "Omar Sherif", "Mariam Adel", "Hana Mostafa",
    "Karim Naguib", "Salma Ezzat", "Tarek Hassan", "Dina Saleh", "Ahmed Lotfy",
    "Farida Kamal", "Sherif Abdel-Aziz", "Laila Younis", "Mostafa Galal", "Rana Sobhy",
    "Ziad Mansour", "Habiba Roshdy", "Amr Fathy", "Nadia Wahba", "Hossam Darwish",
    "Aya Soliman", "Khaled Mansour", "Mona Reda", "Sara El-Gohary", "Tamer Fouad",
    "Reem Adel", "Youssef Halim", "Malak Nabil", "Adham Refaat", "Jana Hammad",
    "Seif Ramadan", "Nada Lotfy", "Bassel Okasha", "Lina Fawzy", "Marwan Helmy",
  ];
  const AREAS = ["New Cairo", "Sheikh Zayed", "October", "Madinaty", "Rehab"];
  const CHANNELS = ["Website", "Mobile App", "WhatsApp", "Phone"];
  const PAYMENTS = ["Credit card", "Debit card", "Apple Pay", "Mobile wallet"];
  const TIMES = ["9–12", "12–3", "3–6", "6–9"];

  const emailFor = (name) => name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + "@gmail.com";
  const phoneFor = (rnd) => "+20 1" + ((rnd() * 4) | 0) + " " + String(((rnd() * 9000) | 0) + 1000) + " " + String(((rnd() * 9000) | 0) + 1000);

  function seedIfEmpty(force) {
    if (!force && store.get(K.seeded, false) && store.get(K.orders, []).length) return;

    const rnd = mulberry32(20260618);
    const pickable = [
      ...D.products.filter((p) => Math.random < 2), // all products
    ];
    const boxes = D.boxes;
    const today = new Date(); today.setHours(12, 0, 0, 0);

    // build a stable customer pool with join dates
    const pool = NAMES.map((name, i) => {
      const r = mulberry32(1000 + i);
      const joinAgo = 5 + Math.floor(r() * 320);
      const joined = new Date(today); joined.setDate(joined.getDate() - joinAgo);
      return {
        id: "C" + String(1001 + i),
        name, email: emailFor(name),
        phone: phoneFor(r),
        area: AREAS[(r() * AREAS.length) | 0],
        joined: joined.toISOString(),
        status: "active",
      };
    });

    const orders = [];
    const ORDER_COUNT = 78;
    for (let i = 0; i < ORDER_COUNT; i++) {
      // recency-weighted: square the random so most orders are recent
      const daysAgo = Math.floor(Math.pow(rnd(), 1.7) * 92);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(8 + ((rnd() * 12) | 0), (rnd() * 60) | 0, 0, 0);

      const cust = pool[(rnd() * pool.length) | 0];
      const lineCount = 1 + ((rnd() * 4) | 0);
      const items = [];
      let subtotal = 0;
      const includeBox = rnd() < 0.28;
      if (includeBox) {
        const b = boxes[(rnd() * boxes.length) | 0];
        const tier = b.tiers[(rnd() * b.tiers.length) | 0];
        const qty = 1;
        items.push({ slug: b.slug, kind: "box", name: b.name, variant: tier.label, price: tier.price, qty, image: b.image });
        subtotal += tier.price * qty;
      }
      for (let j = 0; j < lineCount; j++) {
        const p = D.products[(rnd() * D.products.length) | 0];
        const qty = 1 + ((rnd() * 3) | 0);
        const price = window.FV ? FV.defaultVariant(p).price : (p.pricePerKg || p.pricePerUnit);
        const variant = p.unit === "kg" ? "1 kg" : (p.unit === "bunch" ? "per bunch" : "each");
        items.push({ slug: p.slug, kind: "product", name: p.name, variant, price, qty, image: p.slug, noPhoto: !!p.noPhoto });
        subtotal += price * qty;
      }
      const delivery = subtotal >= SETTINGS_DEFAULT.freeThreshold ? 0 : SETTINGS_DEFAULT.deliveryFee;
      const total = subtotal + delivery;

      // status depends on age
      let status;
      const sr = rnd();
      if (daysAgo <= 0) status = sr < 0.5 ? "pending" : "processing";
      else if (daysAgo === 1) status = sr < 0.35 ? "processing" : "transit";
      else if (daysAgo <= 3) status = sr < 0.25 ? "transit" : "delivered";
      else status = sr < 0.04 ? "cancelled" : (sr < 0.07 ? "refunded" : "delivered");

      const slotDay = new Date(date); slotDay.setDate(slotDay.getDate() + 1);
      orders.push({
        id: "FV" + String(100000 + i * 137 + ((rnd() * 90) | 0)),
        date: date.toISOString(),
        customer: { name: cust.name, email: cust.email, phone: cust.phone, area: cust.area, id: cust.id },
        items, subtotal, delivery, total, status,
        payment: PAYMENTS[(rnd() * PAYMENTS.length) | 0],
        channel: CHANNELS[(rnd() * CHANNELS.length) | 0],
        slot: slotDay.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }) + ", " + TIMES[(rnd() * TIMES.length) | 0],
        address: "Villa " + (((rnd() * 80) | 0) + 1) + ", " + cust.area,
      });
    }
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    // a few "pending" clients who registered but never ordered, + leads
    const extras = [];
    for (let i = 0; i < 7; i++) {
      const r = mulberry32(7000 + i);
      const name = ["Omar Tag", "Salwa Nabil", "Rami Kassem", "Dalia Sobhi", "Hany Wagdy", "Nourhan Adel", "Kareem Saad"][i];
      const joinAgo = Math.floor(r() * 40);
      const joined = new Date(today); joined.setDate(joined.getDate() - joinAgo);
      extras.push({ id: "C" + String(2001 + i), name, email: emailFor(name), phone: phoneFor(r), area: AREAS[(r() * AREAS.length) | 0], joined: joined.toISOString(), status: i < 5 ? "pending" : "lead" });
    }

    store.set(K.orders, orders);
    store.set(K.clients, pool.concat(extras));
    store.set(K.seeded, true);
  }

  /* ------------------------------------------------------------------ *
   * Derived client list (merge registered clients with order activity)
   * ------------------------------------------------------------------ */
  function clients() {
    const regs = store.get(K.clients, []);
    const orders = store.get(K.orders, []);
    const byEmail = {};
    regs.forEach((c) => { if (c && c.email) byEmail[c.email] = Object.assign({ orders: 0, spent: 0, last: null }, c); });
    orders.forEach((o) => {
      if (!o || !o.customer || !o.customer.email) return;   // skip malformed orders
      const e = o.customer.email;
      if (!byEmail[e]) byEmail[e] = { id: o.customer.id || "C" + (Math.random() * 9000 | 0), name: o.customer.name, email: e, phone: o.customer.phone, area: o.customer.area, joined: o.date, status: "active", orders: 0, spent: 0, last: null };
      const c = byEmail[e];
      if (o.status !== "cancelled" && o.status !== "refunded") { c.spent += o.total; c.orders += 1; }
      if (!c.last || new Date(o.date) > new Date(c.last)) c.last = o.date;
      if (c.orders > 0 && c.status !== "vip") c.status = "active";
    });
    const list = Object.values(byEmail);
    list.forEach((c) => { if (c.spent >= 4000) c.status = "vip"; });
    list.sort((a, b) => b.spent - a.spent);
    return list;
  }

  /* ------------------------------------------------------------------ *
   * Analytics roll-ups
   * ------------------------------------------------------------------ */
  function paid(o) { return o && o.status !== "cancelled" && o.status !== "refunded"; }

  function revenueByDay(days) {
    const orders = store.get(K.orders, []).filter(paid);
    const out = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sum = orders.filter((o) => o.date.slice(0, 10) === key).reduce((s, o) => s + o.total, 0);
      out.push({ date: d, label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value: sum });
    }
    return out;
  }
  function ordersByDay(days) {
    const orders = store.get(K.orders, []);
    const out = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: d, label: d.toLocaleDateString("en-GB", { weekday: "short" }), value: orders.filter((o) => o.date.slice(0, 10) === key).length });
    }
    return out;
  }
  function topProducts(limit) {
    const orders = store.get(K.orders, []).filter(paid);
    const map = {};
    orders.forEach((o) => (o.items || []).forEach((it) => {
      const k = it.slug;
      if (!map[k]) map[k] = { slug: k, name: it.name, kind: it.kind, image: it.image, noPhoto: it.noPhoto, units: 0, revenue: 0 };
      map[k].units += it.qty; map[k].revenue += it.price * it.qty;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, limit || 999);
  }
  function revenueByCategory() {
    const orders = store.get(K.orders, []).filter(paid);
    const map = {};
    orders.forEach((o) => (o.items || []).forEach((it) => {
      const item = findItem(it.slug);
      const cat = it.kind === "box" ? "Boxes" : (item ? cap(item.category) : "Other");
      map[cat] = (map[cat] || 0) + it.price * it.qty;
    }));
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }
  function revenueByArea() {
    const orders = store.get(K.orders, []).filter(paid);
    const map = {};
    orders.forEach((o) => { map[o.customer.area] = (map[o.customer.area] || 0) + o.total; });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }
  function revenueByChannel() {
    const orders = store.get(K.orders, []).filter(paid);
    const map = {};
    orders.forEach((o) => { map[o.channel] = (map[o.channel] || 0) + o.total; });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }

  function kpis() {
    const orders = store.get(K.orders, []);
    const paidO = orders.filter(paid);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d30 = new Date(today); d30.setDate(d30.getDate() - 30);
    const d60 = new Date(today); d60.setDate(d60.getDate() - 60);
    const inRange = (o, a, b) => { const t = new Date(o.date); return t >= a && t < b; };
    const cur = paidO.filter((o) => inRange(o, d30, new Date(today.getTime() + 864e5)));
    const prev = paidO.filter((o) => inRange(o, d60, d30));
    const sum = (arr) => arr.reduce((s, o) => s + o.total, 0);
    const grow = (a, b) => b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100;

    const revCur = sum(cur), revPrev = sum(prev);
    const cl = clients();
    return {
      revenue: sum(paidO),
      revenue30: revCur, revenueGrow: grow(revCur, revPrev),
      orders: orders.length,
      orders30: cur.length, ordersGrow: grow(cur.length, prev.length),
      aov: paidO.length ? sum(paidO) / paidO.length : 0,
      aov30: cur.length ? revCur / cur.length : 0, aovGrow: grow(cur.length ? revCur / cur.length : 0, prev.length ? revPrev / prev.length : 0),
      clients: cl.length,
      activeClients: cl.filter((c) => c.status === "active" || c.status === "vip").length,
      pendingClients: cl.filter((c) => c.status === "pending").length,
      pendingOrders: orders.filter((o) => o.status === "pending" || o.status === "processing").length,
      units: paidO.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0),
    };
  }

  function cap(s) { return (s || "").replace(/(^|[-\s])\w/g, (m) => m.toUpperCase()).replace(/-/g, " "); }

  /* ------------------------------------------------------------------ *
   * SVG chart helpers (zero-dependency)
   * ------------------------------------------------------------------ */
  function lineChart(data, opts) {
    opts = opts || {};
    const W = opts.w || 760, H = opts.h || 240, pad = { t: 16, r: 12, b: 26, l: 12 };
    const vals = data.map((d) => d.value);
    const max = Math.max(1, ...vals) * 1.18;
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const x = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = (v) => pad.t + ih - (v / max) * ih;
    let dPath = "", aPath = "";
    data.forEach((d, i) => {
      const px = x(i), py = y(d.value);
      if (i === 0) { dPath = `M${px},${py}`; aPath = `M${px},${pad.t + ih} L${px},${py}`; }
      else {
        const ppx = x(i - 1), ppy = y(data[i - 1].value), cx = (ppx + px) / 2;
        dPath += ` C${cx},${ppy} ${cx},${py} ${px},${py}`;
        aPath += ` C${cx},${ppy} ${cx},${py} ${px},${py}`;
      }
    });
    aPath += ` L${x(data.length - 1)},${pad.t + ih} Z`;
    const grid = [0, .25, .5, .75, 1].map((g) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${pad.t + ih * g}" y2="${pad.t + ih * g}" class="ch-grid"/>`).join("");
    const labelEvery = Math.ceil(data.length / 7);
    const labels = data.map((d, i) => i % labelEvery === 0 || i === data.length - 1 ? `<text x="${x(i)}" y="${H - 6}" class="ch-xlbl" text-anchor="middle">${d.label}</text>` : "").join("");
    const dots = data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.value)}" r="3.2" class="ch-dot" data-v="${d.value}" data-l="${d.label}"/>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="chart chart--line" preserveAspectRatio="none">
      <defs><linearGradient id="lg-area" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" class="ch-fill-0"/><stop offset="1" class="ch-fill-1"/></linearGradient></defs>
      ${grid}<path d="${aPath}" class="ch-area"/><path d="${dPath}" class="ch-line"/>${dots}${labels}</svg>`;
  }

  function barChart(data, opts) {
    opts = opts || {};
    const W = opts.w || 420, H = opts.h || 220, pad = { t: 14, r: 6, b: 24, l: 6 };
    const max = Math.max(1, ...data.map((d) => d.value)) * 1.15;
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const bw = (iw / data.length) * 0.55, gap = (iw / data.length);
    const peak = data.reduce((m, d, i) => d.value > data[m].value ? i : m, 0);
    const bars = data.map((d, i) => {
      const h = (d.value / max) * ih, bx = pad.l + i * gap + (gap - bw) / 2, by = pad.t + ih - h;
      return `<rect x="${bx}" y="${by}" width="${bw}" height="${Math.max(2, h)}" rx="5" class="ch-bar ${i === peak ? "is-peak" : ""}" data-v="${d.value}" data-l="${d.label}"/>
        ${i === peak ? `<text x="${bx + bw / 2}" y="${by - 6}" class="ch-barval" text-anchor="middle">${d.value}</text>` : ""}
        <text x="${bx + bw / 2}" y="${H - 7}" class="ch-xlbl" text-anchor="middle">${d.label}</text>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="chart chart--bar">${bars}</svg>`;
  }

  function donut(segments, opts) {
    opts = opts || {};
    const S = opts.size || 180, r = S / 2, ir = r * 0.62, cx = r, cy = r;
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    let a0 = -Math.PI / 2;
    const palette = opts.colors || ["var(--ad-accent)", "var(--ad-forest)", "var(--ad-brass)", "#7BA98C", "#C99F6A", "#9DB7A6", "#D9C4A0"];
    const arcs = segments.map((d, i) => {
      const frac = d.value / total, a1 = a0 + frac * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const xi0 = cx + ir * Math.cos(a1), yi0 = cy + ir * Math.sin(a1);
      const xi1 = cx + ir * Math.cos(a0), yi1 = cy + ir * Math.sin(a0);
      const path = `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi0},${yi0} A${ir},${ir} 0 ${large} 0 ${xi1},${yi1} Z`;
      a0 = a1;
      return `<path d="${path}" fill="${palette[i % palette.length]}" class="ch-seg" data-l="${d.label}" data-v="${d.value}"/>`;
    }).join("");
    return `<svg viewBox="0 0 ${S} ${S}" class="chart chart--donut" style="--n:${segments.length}">${arcs}
      ${opts.center ? `<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="ch-cnum">${opts.center}</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" class="ch-clbl">${opts.centerLabel || ""}</text>` : ""}</svg>`;
  }

  function sparkline(vals, opts) {
    opts = opts || {};
    const W = opts.w || 110, H = opts.h || 34, max = Math.max(1, ...vals), min = Math.min(...vals);
    const rng = max - min || 1;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - 3 - ((v - min) / rng) * (H - 6)}`);
    const up = vals[vals.length - 1] >= vals[0];
    return `<svg viewBox="0 0 ${W} ${H}" class="spark ${up ? "up" : "down"}" preserveAspectRatio="none"><polyline points="${pts.join(" ")}" fill="none"/></svg>`;
  }

  function hbars(data, opts) {
    opts = opts || {};
    const max = Math.max(1, ...data.map((d) => d.value));
    return `<div class="hbars">` + data.map((d) => `
      <div class="hbar">
        <div class="hbar-top"><span class="hbar-l">${d.label}</span><span class="hbar-v">${opts.money ? money(d.value) : num(d.value)}</span></div>
        <div class="hbar-track"><i style="width:${(d.value / max) * 100}%"></i></div>
      </div>`).join("") + `</div>`;
  }

  /* ------------------------------------------------------------------ *
   * Status pill helper
   * ------------------------------------------------------------------ */
  const STATUS = {
    delivered: ["Delivered", "ok"], transit: ["In transit", "info"], processing: ["Processing", "warn"],
    pending: ["Pending", "muted"], cancelled: ["Cancelled", "bad"], refunded: ["Refunded", "bad"],
    active: ["Active", "ok"], vip: ["VIP", "gold"], lead: ["Lead", "muted"],
  };
  function pill(status) { const s = STATUS[status] || [cap(status), "muted"]; return `<span class="pill pill--${s[1]}">${s[0]}</span>`; }

  /* ------------------------------------------------------------------ *
   * Icons
   * ------------------------------------------------------------------ */
  const I = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-.8 11.2a1.6 1.6 0 0 1-1.6 1.5H8.4a1.6 1.6 0 0 1-1.6-1.5L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 7 8.5-4 8.5 4-8.5 4z"/><path d="M3.5 7v10l8.5 4 8.5-4V7"/><path d="M12 11v10"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5"/><path d="M16 5.2a3 3 0 0 1 0 5.8M21 20c0-2.6-1.6-4.6-4-5.2"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16v-4M12.5 16V8M17 16v-6"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M8 13h8M8 17h6"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c2.5 0 4-1.5 4-4 0-1.5-1-2.5-2.5-2.5S2 16 2 17.5c0 .8-.5 1.5-1 1.5"/><path d="M14.5 6.5 18 3l3 3-3.5 3.5M14.5 6.5 7 14m7.5-7.5L17 9 9.5 16.5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9.4a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9.4a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19.5h16"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21c-4 0-7-3-7-8 0-6 6-9 13-9 0 8-3 13-8 14-2 .4-3-1-3-3 0-3 3-5 6-6"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 12h9m0 0-3-3m3 3-3 3M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v6M18 9v6"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.8L20 8H6"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12a1 1 0 0 1-1 .9H7.7a1 1 0 0 1-1-.9L6 7"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 19.5h16"/></svg>',
  };

  /* ------------------------------------------------------------------ *
   * Shell — sidebar + topbar (injected into every admin page)
   * ------------------------------------------------------------------ */
  const NAV = [
    { group: "Analytics", items: [
      { href: "index.html", label: "Dashboard", icon: "grid", key: "dashboard" },
      { href: "orders.html", label: "Orders", icon: "bag", key: "orders", badge: "pendingOrders" },
      { href: "customers.html", label: "Customers", icon: "users", key: "customers" },
      { href: "analytics.html", label: "Analytics", icon: "chart", key: "analytics" },
    ] },
    { group: "Catalog", items: [
      { href: "products.html", label: "Products", icon: "box", key: "products" },
    ] },
    { group: "Storefront control", items: [
      { href: "content.html", label: "Content", icon: "doc", key: "content" },
      { href: "appearance.html", label: "Appearance", icon: "brush", key: "appearance" },
      { href: "images.html", label: "Images", icon: "image", key: "images" },
    ] },
    { group: "Administration", items: [
      { href: "users.html", label: "Team & Users", icon: "shield", key: "users" },
      { href: "settings.html", label: "Settings", icon: "gear", key: "settings" },
    ] },
  ];

  function buildShell(active) {
    const k = kpis();
    const s = settings();
    const role = currentRole() || "super-admin";
    const allowed = (ROLES[role] || ROLES["super-admin"]).pages;
    const sess = session() || {};
    const navHtml = NAV.map((g) => {
      const items = g.items.filter((n) => allowed.indexOf(n.key) >= 0);
      if (!items.length) return "";
      return `<p class="nav-group">${g.group}</p>` + items.map((n) => {
        const badge = n.badge && k[n.badge] ? `<span class="nav-badge">${k[n.badge]}</span>` : "";
        return `<a href="${n.href}" class="nav-item ${n.key === active ? "is-active" : ""}">${I[n.icon]}<span>${n.label}</span>${badge}</a>`;
      }).join("");
    }).join("");
    const name = sess.name || "Admin";
    const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const roleLabel = (ROLES[role] || {}).label || "Admin";
    const canSettings = allowed.indexOf("settings") >= 0;
    return `
    <aside class="ad-sidebar" id="adSidebar">
      <div class="ad-brand">
        <a href="../index.html" title="Back to storefront" style="display:flex"><img class="ad-brand-logo" src="../assets/img/logo.png" alt="Fresh Valley"></a>
        <span class="ad-brand-tag">${role === "super-admin" ? "Console" : "Design & SEO"}</span>
        <button class="ad-side-close" id="adSideClose" aria-label="Close menu">${I.close}</button>
      </div>
      <nav class="ad-nav">${navHtml}</nav>
      <a class="ad-store-link" href="../index.html" target="_blank" rel="noopener">${I.eye}<span>View storefront</span>${I.arrow}</a>
    </aside>
    <div class="ad-scrim" id="adScrim"></div>
    <div class="ad-main">
      <header class="ad-topbar">
        <button class="ad-burger" id="adBurger" aria-label="Menu">${I.grid}</button>
        <div class="ad-search"><span class="ad-search-i">${I.search}</span><input type="search" id="adSearch" placeholder="Search orders, customers, products…" autocomplete="off"><div class="ad-search-res" id="adSearchRes"></div></div>
        <div class="ad-top-actions">
          <button class="ad-store-state ${s.storeOpen ? "on" : "off"}" id="adStoreToggle" title="Click to ${s.storeOpen ? "close" : "open"} the store"><i></i>${s.storeOpen ? "Store open" : "Store closed"}<span class="ad-store-sw" aria-hidden="true"></span></button>
          <button class="ad-icon-btn" id="adBell" aria-label="Alerts">${I.bell}<span class="dot"></span></button>
          <div class="ad-user" id="adUser">
            <span class="ad-ava">${initials}</span>
            <span class="ad-user-txt"><strong>${name}</strong><em>${roleLabel}</em></span>
            ${I.down}
            <div class="ad-user-menu">
              ${canSettings ? `<a href="settings.html">${I.gear} Settings</a>` : ""}
              <a href="../index.html" target="_blank">${I.eye} View store</a>
              <button id="adLogout">${I.logout} Sign out</button>
            </div>
          </div>
        </div>
      </header>
      <main class="ad-content" id="adContent"></main>
    </div>`;
  }

  function mountShell(active) {
    document.body.classList.add("ad-body");
    const root = document.getElementById("adRoot") || document.body;
    root.insertAdjacentHTML("afterbegin", buildShell(active));
    wireShell();
    return document.getElementById("adContent");
  }

  function wireShell() {
    const sb = document.getElementById("adSidebar"), scrim = document.getElementById("adScrim");
    const open = (o) => { sb.classList.toggle("open", o); scrim.classList.toggle("show", o); };
    document.getElementById("adBurger")?.addEventListener("click", () => open(true));
    document.getElementById("adSideClose")?.addEventListener("click", () => open(false));
    scrim?.addEventListener("click", () => open(false));
    document.getElementById("adLogout")?.addEventListener("click", () => { localStorage.removeItem(K.session); location.href = "login.html"; });
    document.getElementById("adStoreToggle")?.addEventListener("click", () => {
      const s = settings(); const next = !s.storeOpen; saveSettings({ storeOpen: next });
      toast(next ? "Store is now <b>open</b>" : "Store is now <b>closed</b> · maintenance page is live");
      setTimeout(() => location.reload(), 700);
    });

    // Notifications panel
    const bell = document.getElementById("adBell");
    bell?.addEventListener("click", (e) => {
      e.stopPropagation();
      let p = document.getElementById("adNotif");
      if (p) { p.remove(); return; }
      const orders = store.get(K.orders, []);
      const pending = orders.filter((o) => o.status === "pending" || o.status === "processing");
      const low = allItems().filter((x) => x.kind !== "box").filter((x) => { const m = pmeta(x.slug); return m.active && m.stock <= settings().lowStockAt; });
      const rows = [];
      pending.slice(0, 6).forEach((o) => rows.push(`<a class="nf-row" href="orders.html?id=${o.id}"><span class="nf-ic" style="background:var(--ad-warn-bg);color:var(--ad-warn)">${I.bag}</span><span class="nf-tx"><strong>${o.id} · ${o.customer.name}</strong><em>${money(o.total)} · ${cap(o.status)} · ${timeAgo(o.date)}</em></span></a>`));
      low.slice(0, 5).forEach((x) => rows.push(`<a class="nf-row" href="products.html?q=${encodeURIComponent(x.name)}"><span class="nf-ic" style="background:var(--ad-bad-bg);color:var(--ad-bad)">${I.box}</span><span class="nf-tx"><strong>Low stock · ${x.name}</strong><em>${num(pmeta(x.slug).stock)} left</em></span></a>`));
      p = document.createElement("div"); p.id = "adNotif"; p.className = "ad-notif";
      p.innerHTML = `<div class="nf-head"><strong>Notifications</strong><span>${rows.length} alerts</span></div>
        <div class="nf-body">${rows.length ? rows.join("") : `<div class="nf-empty">${I.bell}<p>All caught up — nothing needs you right now.</p></div>`}</div>`;
      document.querySelector(".ad-topbar").appendChild(p);
      requestAnimationFrame(() => p.classList.add("open"));
    });
    document.addEventListener("click", (e) => { const p = document.getElementById("adNotif"); if (p && !e.target.closest("#adNotif") && !e.target.closest("#adBell")) p.remove(); });
    document.getElementById("adUser")?.addEventListener("click", (e) => { e.currentTarget.classList.toggle("open"); });
    // global search
    const si = document.getElementById("adSearch"), res = document.getElementById("adSearchRes");
    si?.addEventListener("input", () => {
      const q = si.value.trim().toLowerCase();
      if (!q) { res.classList.remove("show"); res.innerHTML = ""; return; }
      const ords = store.get(K.orders, []).filter((o) => (o.id + o.customer.name).toLowerCase().includes(q)).slice(0, 4);
      const custs = clients().filter((c) => (c.name + c.email).toLowerCase().includes(q)).slice(0, 4);
      const prods = allItems().filter((p) => p.name.toLowerCase().includes(q)).slice(0, 4);
      let h = "";
      if (ords.length) h += `<p class="sr-h">Orders</p>` + ords.map((o) => `<a href="orders.html?id=${o.id}" class="sr-row">${I.bag}<span>${o.id} · ${o.customer.name}</span><em>${money(o.total)}</em></a>`).join("");
      if (custs.length) h += `<p class="sr-h">Customers</p>` + custs.map((c) => `<a href="customers.html?id=${encodeURIComponent(c.email)}" class="sr-row">${I.users}<span>${c.name}</span><em>${c.email}</em></a>`).join("");
      if (prods.length) h += `<p class="sr-h">Products</p>` + prods.map((p) => `<a href="products.html?q=${encodeURIComponent(p.name)}" class="sr-row">${I.box}<span>${p.name}</span><em>${money(effectivePrice(p))}</em></a>`).join("");
      res.innerHTML = h || `<p class="sr-empty">No matches for “${q}”.</p>`;
      res.classList.add("show");
    });
    document.addEventListener("click", (e) => { if (!e.target.closest(".ad-search")) res?.classList.remove("show"); if (!e.target.closest("#adUser")) document.getElementById("adUser")?.classList.remove("open"); });
  }

  /* ------------------------------------------------------------------ *
   * Users + auth gate (role-aware)
   * ------------------------------------------------------------------ */
  function seedUsers() {
    let u = store.get(K.users, []);
    if (!u || !u.length) {
      const s = settings();
      u = [
        { id: "U1", name: "Mohamed Tarek", email: s.adminEmail || "admin@freshvalley.eg", password: s.adminPass || "fresh-admin", role: "super-admin", created: new Date().toISOString() },
        { id: "U2", name: "Salma · Design & SEO", email: "designer@freshvalley.eg", password: "design123", role: "admin", created: new Date().toISOString() },
      ];
      store.set(K.users, u);
    }
    return u;
  }
  const users = () => seedUsers();
  function addUser(u) {
    const list = seedUsers();
    if (list.some((x) => x.email.toLowerCase() === (u.email || "").toLowerCase())) return false;
    list.push({ id: "U" + String(Date.now()).slice(-6), name: u.name, email: u.email, password: u.password, role: u.role || "admin", created: new Date().toISOString() });
    store.set(K.users, list); return true;
  }
  function removeUser(id) { store.set(K.users, seedUsers().filter((x) => x.id !== id)); }
  function updateUser(id, patch) { const list = seedUsers(); const x = list.find((u) => u.id === id); if (x) Object.assign(x, patch); store.set(K.users, list); }
  function authUser(email, password) {
    const u = seedUsers().find((x) => x.email.toLowerCase() === (email || "").toLowerCase() && x.password === password);
    if (u) return u;
    const s = settings(); // always-available owner fallback so you can't lock yourself out
    if ((email || "").toLowerCase() === (s.adminEmail || "").toLowerCase() && password === s.adminPass) return { id: "U1", name: "Mohamed Tarek", email: s.adminEmail, role: "super-admin" };
    return null;
  }
  const session = () => store.get(K.session, null);
  const currentRole = () => { const s = session(); return s ? (s.role || "super-admin") : null; };
  // page key → actual file (the dashboard key lives in index.html, not dashboard.html)
  const PAGE_FILE = { dashboard: "index.html", orders: "orders.html", customers: "customers.html", analytics: "analytics.html", products: "products.html", content: "content.html", appearance: "appearance.html", images: "images.html", users: "users.html", settings: "settings.html" };
  const pageFile = (key) => PAGE_FILE[key] || "index.html";
  const roleHome = (role) => pageFile((ROLES[role] || ROLES["super-admin"]).pages[0]);

  function requireAuth(pageKey) {
    const sess = store.get(K.session, null);
    if (!sess || !sess.t || (Date.now() - sess.t > 1000 * 60 * 60 * 24 * 7)) {
      location.href = "login.html"; return false;
    }
    const role = sess.role || "super-admin";
    const allowed = (ROLES[role] || ROLES["super-admin"]).pages;
    if (pageKey && allowed.indexOf(pageKey) < 0) { location.href = roleHome(role); return false; }
    return true;
  }

  /* ------------------------------------------------------------------ *
   * Page header helper
   * ------------------------------------------------------------------ */
  function pageHead(title, sub, actions) {
    return `<div class="ad-page-head">
      <div><h1 class="ad-h1">${title}</h1>${sub ? `<p class="ad-sub">${sub}</p>` : ""}</div>
      ${actions ? `<div class="ad-head-actions">${actions}</div>` : ""}
    </div>`;
  }

  /* ------------------------------------------------------------------ *
   * KPI card helper
   * ------------------------------------------------------------------ */
  function kpiCard(o) {
    const grow = o.grow;
    const trend = grow == null ? "" : `<span class="kpi-trend ${grow >= 0 ? "up" : "down"}">${grow >= 0 ? I.up : I.down}${pct(grow)}</span>`;
    return `<div class="kpi">
      <div class="kpi-top"><span class="kpi-ico ${o.tone || ""}">${I[o.icon]}</span>${o.spark || ""}</div>
      <div class="kpi-val">${o.value}</div>
      <div class="kpi-row"><span class="kpi-lbl">${o.label}</span>${trend}</div>
    </div>`;
  }

  /* ------------------------------------------------------------------ *
   * CSV export + print receipt
   * ------------------------------------------------------------------ */
  function toCSV(rows) {
    return rows.map((r) => r.map((c) => {
      const s = c == null ? "" : String(c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")).join("\n");
  }
  function downloadCSV(filename, rows) {
    const blob = new Blob(["﻿" + toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ------------------------------------------------------------------ *
   * Designed, printable receipt (brand-styled standalone HTML)
   * ------------------------------------------------------------------ */
  function receiptDoc(o, autoprint, embedded) {
    const s = settings();
    const cur = s.currency;
    const m = (n) => cur + " " + Math.round(n || 0).toLocaleString("en-US");
    const date = new Date(o.date);
    const statusColors = { delivered: "#2F9E5B", transit: "#3478C7", processing: "#C9881E", pending: "#8B978D", cancelled: "#C0492F", refunded: "#C0492F" };
    const sc = statusColors[o.status] || "#8B978D";
    const rows = o.items.map((it) => `<tr>
      <td><div class="ri-n">${it.name}</div><div class="ri-v">${it.variant || ""}</div></td>
      <td class="c">${it.qty}</td>
      <td class="r">${m(it.price)}</td>
      <td class="r b">${m(it.price * it.qty)}</td></tr>`).join("");
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt ${o.id} · ${s.storeName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0} body{font-family:"Hanken Grotesk",system-ui,sans-serif;background:#EDE7DA;color:#1B2620;padding:28px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rc{max-width:640px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px -30px rgba(10,26,17,.4)}
  .rc-head{background:#10261D;color:#F6F1E8;padding:26px 32px;display:flex;justify-content:space-between;align-items:flex-start}
  .rc-brand{display:flex;align-items:center;gap:11px}
  .rc-logo{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.1);display:grid;place-items:center;color:#C89B5C}
  .rc-logo svg{width:23px;height:23px}
  .rc-brand h1{font-family:"Fraunces",serif;font-size:21px;font-weight:600}
  .rc-brand p{font-size:11px;color:#B7B3A4;letter-spacing:.04em}
  .rc-head .rc-meta{text-align:right}
  .rc-head .rc-meta .lab{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#C89B5C;font-weight:700}
  .rc-head .rc-meta .id{font-family:"Fraunces",serif;font-size:20px}
  .rc-head .rc-meta .dt{font-size:12px;color:#B7B3A4;margin-top:2px}
  .rc-status{display:inline-block;margin-top:8px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${sc};color:#fff}
  .rc-body{padding:28px 32px}
  .rc-parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding-bottom:22px;border-bottom:1px solid #E8E2D6}
  .rc-parties .lab{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8B978D;font-weight:700;margin-bottom:5px}
  .rc-parties strong{font-size:15px;display:block}
  .rc-parties span{font-size:13px;color:#5C6B61;display:block;line-height:1.5}
  table{width:100%;border-collapse:collapse;margin:22px 0}
  th{text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8B978D;font-weight:700;padding:0 0 10px;border-bottom:1px solid #E8E2D6}
  th.c,td.c{text-align:center} th.r,td.r{text-align:right}
  td{padding:12px 0;border-bottom:1px solid #F0EBE0;font-size:14px;vertical-align:top}
  .ri-n{font-weight:600} .ri-v{font-size:12px;color:#8B978D;margin-top:1px} td.b{font-weight:700}
  .rc-tot{margin-left:auto;width:260px;margin-top:18px}
  .rc-tot .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#5C6B61}
  .rc-tot .row.grand{border-top:2px solid #10261D;margin-top:6px;padding-top:12px;font-family:"Fraunces",serif;font-size:20px;color:#10261D;font-weight:600}
  .rc-pay{margin-top:24px;padding:16px 20px;background:#FBF9F4;border:1px solid #E8E2D6;border-radius:12px;display:flex;justify-content:space-between;font-size:13px}
  .rc-pay .lab{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8B978D;font-weight:700}
  .rc-pay strong{font-size:14px}
  .rc-foot{text-align:center;padding:24px 32px 30px;border-top:1px solid #E8E2D6;color:#8B978D;font-size:12px}
  .rc-foot .ty{font-family:"Fraunces",serif;font-size:16px;color:#10261D;margin-bottom:6px}
  .rc-actions{max-width:640px;margin:18px auto 0;display:flex;gap:10px;justify-content:center}
  .rc-actions button{font:inherit;font-weight:600;font-size:14px;padding:11px 22px;border-radius:11px;border:none;cursor:pointer}
  .rc-actions .p{background:#10261D;color:#fff} .rc-actions .c{background:#fff;border:1px solid #E8E2D6;color:#1B2620}
  @media print{ body{background:#fff;padding:0} .rc{box-shadow:none;border-radius:0} .rc-actions{display:none} }
</style></head><body>
  <div class="rc">
    <div class="rc-head">
      <div class="rc-brand">
        <span class="rc-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21c-4 0-7-3-7-8 0-6 6-9 13-9 0 8-3 13-8 14-2 .4-3-1-3-3 0-3 3-5 6-6"/></svg></span>
        <div><h1>${s.storeName}</h1><p>Export-grade produce · Cairo, Egypt</p></div>
      </div>
      <div class="rc-meta"><div class="lab">Receipt</div><div class="id">${o.id}</div>
        <div class="dt">${date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
        <span class="rc-status">${(STATUS[o.status] || [cap(o.status)])[0]}</span></div>
    </div>
    <div class="rc-body">
      <div class="rc-parties">
        <div><div class="lab">Billed to</div><strong>${o.customer.name}</strong><span>${o.customer.email}</span><span>${o.customer.phone || ""}</span></div>
        <div><div class="lab">Deliver to</div><strong>${o.customer.area || ""}</strong><span>${o.address || ""}</span><span>${o.slot ? "Slot: " + o.slot : ""}</span></div>
      </div>
      <table><thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="rc-tot">
        <div class="row"><span>Subtotal</span><span>${m(o.subtotal)}</span></div>
        <div class="row"><span>Delivery</span><span>${o.delivery ? m(o.delivery) : "Free"}</span></div>
        <div class="row grand"><span>Total</span><span>${m(o.total)}</span></div>
      </div>
      <div class="rc-pay"><div><div class="lab">Payment</div><strong>${o.payment || "Prepaid"}</strong></div>
        <div style="text-align:right"><div class="lab">Channel</div><strong>${o.channel || "Website"}</strong></div></div>
    </div>
    <div class="rc-foot"><div class="ty">Thank you for hosting with ${s.storeName}.</div>
      <div>This is a confirmation of your order. Questions? Reply to your order email anytime.</div></div>
  </div>
  ${embedded ? "" : `<div class="rc-actions"><button class="c" onclick="window.close()">Close</button><button class="p" onclick="window.print()">Print / Save as PDF</button></div>`}
  ${autoprint ? "<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>" : ""}
</body></html>`;
  }

  // In-page receipt viewer — renders into a visible iframe (no pop-ups), with
  // Print/Save-as-PDF + download. Reliable everywhere, unlike window.open.
  function openReceipt(o, autoprint) {
    let ov = document.getElementById("rcOverlay"); if (ov) ov.remove();
    ov = document.createElement("div"); ov.id = "rcOverlay";
    ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(10,26,17,.55);display:flex;flex-direction:column;align-items:center;padding:22px;overflow:auto";
    ov.innerHTML = `
      <div style="width:100%;max-width:680px;display:flex;gap:.5rem;justify-content:flex-end;margin-bottom:12px">
        <button class="btn btn--ghost btn--sm" id="rcClose" style="background:#fff">${I.close} Close</button>
        <button class="btn btn--ghost btn--sm" id="rcDl" style="background:#fff">${I.download} .html</button>
        <button class="btn btn--primary btn--sm" id="rcPrint">${I.download} Save as PDF</button>
      </div>
      <iframe id="rcFrame" title="Receipt" style="width:100%;max-width:680px;height:80vh;border:0;border-radius:14px;background:#fff;box-shadow:0 30px 70px -30px rgba(0,0,0,.6)"></iframe>`;
    document.body.appendChild(ov);
    const f = ov.querySelector("#rcFrame");
    f.srcdoc = receiptDoc(o, false, true);
    const doPrint = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} };
    ov.querySelector("#rcPrint").onclick = doPrint;
    ov.querySelector("#rcDl").onclick = () => downloadReceiptHTML(o);
    ov.querySelector("#rcClose").onclick = () => ov.remove();
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
    if (autoprint) f.addEventListener("load", () => setTimeout(doPrint, 500), { once: true });
  }
  function downloadReceiptHTML(o) {
    const blob = new Blob([receiptDoc(o, false)], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "receipt-" + o.id + ".html";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function toast(msg) {
    let w = document.getElementById("adToast");
    if (!w) { w = document.createElement("div"); w.id = "adToast"; w.className = "ad-toast-wrap"; document.body.appendChild(w); }
    const t = document.createElement("div"); t.className = "ad-toast"; t.innerHTML = msg;
    w.appendChild(t); requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 350); }, 2600);
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime(), m = Math.floor(diff / 6e4);
    if (m < 1) return "just now"; if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24); if (d < 30) return d + "d ago";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  /* ------------------------------------------------------------------ *
   * Public API
   * ------------------------------------------------------------------ */
  window.ADMIN = {
    K, store, I, settings, saveSettings,
    money, num, pct, cap, timeAgo, fmtDate, fmtDateTime,
    seedIfEmpty,
    // data
    orders: () => store.get(K.orders, []),
    saveOrders: (o) => store.set(K.orders, o),
    updateOrder: (id, patch) => { const o = store.get(K.orders, []); const i = o.findIndex((x) => x.id === id); if (i > -1) { Object.assign(o[i], patch); store.set(K.orders, o); } return o[i]; },
    clients, rawClients: () => store.get(K.clients, []), saveClients: (c) => store.set(K.clients, c),
    allItems, findItem, basePrice, effectivePrice, priceUnit, pmeta,
    setPrice: (slug, val) => { const p = store.get(K.prices, {}); if (val == null || val === "") delete p[slug]; else p[slug] = +val; store.set(K.prices, p); },
    setPmeta: (slug, patch) => { const m = store.get(K.pmeta, {}); m[slug] = Object.assign({}, m[slug], patch); store.set(K.pmeta, m); },
    prices: () => store.get(K.prices, {}),
    theme: () => store.get(K.theme, {}), setTheme: (t) => store.set(K.theme, t),
    content: () => store.get(K.content, {}), setContent: (c) => store.set(K.content, Object.assign({}, store.get(K.content, {}), c)),
    images: () => store.get(K.images, {}),
    setImage: (key, url) => { const m = store.get(K.images, {}); if (url == null || url === "") delete m[key]; else m[key] = url; store.set(K.images, m); },
    // users / auth
    ROLES, users, addUser, removeUser, updateUser, authUser, session, currentRole, seedUsers, roleHome,
    // analytics
    kpis, revenueByDay, ordersByDay, topProducts, revenueByCategory, revenueByArea, revenueByChannel, paid,
    // charts
    lineChart, barChart, donut, sparkline, hbars,
    // ui
    pill, kpiCard, pageHead, mountShell, requireAuth, toast, downloadCSV, toCSV,
    receiptDoc, openReceipt, downloadReceiptHTML,
    resetData: () => { [K.orders, K.clients, K.seeded].forEach((k) => localStorage.removeItem(k)); seedIfEmpty(true); },
  };

  // Auto-seed as soon as the engine loads (admin context only)
  if (D) { seedIfEmpty(); seedUsers(); }
})();
