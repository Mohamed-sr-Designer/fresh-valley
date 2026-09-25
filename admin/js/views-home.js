/* =====================================================================
   FRESH VALLEY Admin — Login, Home, Analytics, Reports, Live view
   ===================================================================== */
(function () {
  "use strict";
  const { esc, icon, money, num, pct, DAY, range, inRange, series, labelsFor, delta, data, cat, fmtDay, fmtDate, fmtTime, ago } = A;
  const C = window.FVCharts;
  const valid = (o) => o.status !== "cancelled" && o.status !== "refunded";

  /* ------------------------------------------------------------------ *
   * Metrics engine
   * ------------------------------------------------------------------ */
  function metrics(rg) {
    const orders = data.orders(), track = data.track();
    const hourly = rg.days === 1;
    const B = hourly ? 3600e3 : DAY, N = hourly ? 24 : rg.days;
    const cur = orders.filter((o) => inRange(o.date, rg.from, rg.to));
    const prev = orders.filter((o) => inRange(o.date, rg.prevFrom, rg.prevTo));
    const bucket = (list, from, val) => { const out = new Array(N).fill(0); list.forEach((x) => { const i = Math.floor((new Date(x.date || x.t).getTime() - from) / B); if (i >= 0 && i < N) out[i] += val(x); }); return out; };
    const sessBucket = (from, to) => { const sets = Array.from({ length: N }, () => new Set()); track.forEach((e) => { if (e.type !== "page_view" || e.t < from || e.t >= to) return; const i = Math.floor((e.t - from) / B); if (i >= 0 && i < N) sets[i].add(e.sid); }); return sets.map((s) => s.size); };
    const sum = (a) => a.reduce((s, x) => s + x, 0);
    const salesS = bucket(cur.filter(valid), rg.from, (o) => o.total), salesP = bucket(prev.filter(valid), rg.prevFrom, (o) => o.total);
    const ordersS = bucket(cur, rg.from, () => 1), ordersP = bucket(prev, rg.prevFrom, () => 1);
    const sessS = sessBucket(rg.from, rg.to), sessP = sessBucket(rg.prevFrom, rg.prevTo);
    const sales = sum(salesS), salesPrev = sum(salesP), nOrders = cur.length, nPrev = prev.length;
    const sess = sum(sessS), sessPrev = sum(sessP);
    const aovS = salesS.map((v, i) => ordersS[i] ? v / ordersS[i] : 0);
    const convS = sessS.map((v, i) => v ? ordersS[i] / v : 0);
    // returning customers among those who ordered in range
    const firstOrder = {};
    orders.slice().reverse().forEach((o) => { const e = String(o.customer.email || "").toLowerCase(); if (e && !firstOrder[e]) firstOrder[e] = new Date(o.date).getTime(); });
    const retRate = (list, from) => { const em = new Set(list.map((o) => String(o.customer.email || "").toLowerCase()).filter(Boolean)); if (!em.size) return 0; let r = 0; em.forEach((e) => { if (firstOrder[e] < from) r++; }); return r / em.size; };
    const labels = hourly ? Array.from({ length: 24 }, (_, i) => rg.from + i * 3600e3) : labelsFor(rg.from, rg.days);
    return {
      rg, cur, prev, labels, hourly, salesS, salesP, ordersS, ordersP, sessS, sessP, aovS, convS,
      sales, salesPrev, nOrders, nPrev, aov: nOrders ? sales / Math.max(1, cur.filter(valid).length) : 0, aovPrev: nPrev ? salesPrev / Math.max(1, prev.filter(valid).length) : 0,
      sess, sessPrev, conv: sess ? nOrders / sess : 0, convPrev: sessPrev ? nPrev / sessPrev : 0,
      ret: retRate(cur, rg.from), retPrev: retRate(prev, rg.prevFrom),
      track: track.filter((e) => e.t >= rg.from && e.t < rg.to),
    };
  }
  A.metrics = metrics;
  const fx = (m) => (t) => m.hourly ? new Date(t).getHours() + ":00" : fmtDay(t);
  function kpi(label, value, d, spark, color, tip) {
    return `<div class="card kpi" title="${esc(tip || "")}"><span class="kpi__l">${esc(label)}</span><span class="kpi__v">${value}</span><span class="kpi__d ${d.cls}">${d.txt} <span class="faint" style="font-weight:600">vs previous</span></span>${C.slot("spark", { values: spark, color })}</div>`;
  }
  function kpis(m) {
    return `<div class="kpis">
      ${kpi("Total sales", money(m.sales), delta(m.sales, m.salesPrev), m.salesS, "#19291C", "Order totals excluding cancelled and refunded orders")}
      ${kpi("Orders", num(m.nOrders), delta(m.nOrders, m.nPrev), m.ordersS, "#AE9D57")}
      ${kpi("Average order value", money(m.aov), delta(m.aov, m.aovPrev), m.aovS, "#8A8E57")}
      ${kpi("Sessions", num(m.sess), delta(m.sess, m.sessPrev), m.sessS, "#2D4630", "Unique visits to the storefront")}
      ${kpi("Conversion rate", pct(m.conv, 2), delta(m.conv, m.convPrev), m.convS, "#7A2B21", "Orders ÷ sessions")}
      ${kpi("Returning customer rate", pct(m.ret, 1), delta(m.ret, m.retPrev), m.ordersS, "#6E5F2E", "Share of customers in this period who had ordered before")}
    </div>`;
  }
  function salesCard(m, title) {
    return `<div class="card"><div class="card__hd"><div><h2>${esc(title || "Total sales over time")}</h2><div class="kpi__v" style="font-size:22px">${money(m.sales)} <span class="kpi__d ${delta(m.sales, m.salesPrev).cls}" style="font-family:var(--sans);font-size:12px">${delta(m.sales, m.salesPrev).txt}</span></div></div>
      <div class="legend" style="flex-direction:row;gap:1rem;font-size:12px"><span><i style="background:#19291C"></i>${esc(m.rg.label)}</span><span><i style="background:#BDB8AB"></i>Previous period</span></div></div>
      <div class="card__bd">${C.slot("area", { values: m.salesS, prev: m.salesP, labels: m.labels, fmt: money, fmtX: fx(m), fmtTip: (t) => m.hourly ? fmtDate(t, { weekday: "short", day: "numeric", month: "short" }) + " " + new Date(t).getHours() + ":00" : fmtDate(t, { weekday: "short", day: "numeric", month: "short" }), names: ["Sales", "Previous"], label: "Sales over time" })}</div></div>`;
  }
  function topProducts(m, n) {
    const agg = {};
    m.cur.filter(valid).forEach((o) => o.items.forEach((it) => { const k = it.slug; agg[k] = agg[k] || { slug: k, name: it.name, type: it.type, units: 0, rev: 0, image: it.image, noPhoto: it.noPhoto }; agg[k].units += it.qty || 1; agg[k].rev += (it.price || 0) * (it.qty || 1); }));
    return Object.values(agg).sort((a, b) => b.rev - a.rev).slice(0, n || 6);
  }
  A.topProducts = topProducts;
  function groupSum(list, key, val) { const g = {}; list.forEach((x) => { const k = key(x) || "—"; g[k] = (g[k] || 0) + val(x); }); return Object.entries(g).sort((a, b) => b[1] - a[1]); }
  A.groupSum = groupSum;
  function bars(rows, fmt) {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return rows.length ? rows.map(([k, v]) => `<div class="bar-row"><span class="nowrap" style="overflow:hidden;text-overflow:ellipsis">${esc(k)}</span><span class="bar-row__bar"><i style="width:${(v / max) * 100}%"></i></span><b class="num">${(fmt || num)(v)}</b></div>`).join("") : `<p class="muted small">No data in this period.</p>`;
  }
  A.bars = bars;
  function donut(rows, center, sub, fmt) {
    const P = C.PALETTE, total = rows.reduce((s, r) => s + r[1], 0) || 1;
    return `<div class="donut-wrap">${C.slot("donut", { parts: rows.map((r, i) => ({ label: r[0], value: r[1], color: P[i % P.length] })), center, sub, size: 150 })}
      <div class="legend">${rows.map((r, i) => `<span><i style="background:${P[i % P.length]}"></i>${esc(r[0])}<b>${(fmt || num)(r[1])} <span class="faint">${Math.round((r[1] / total) * 100)}%</span></b></span>`).join("")}</div></div>`;
  }
  A.donut = donut;
  function sessionsBy(m, field) {
    const g = {};
    m.track.forEach((e) => { if (e.type !== "page_view") return; const k = e[field] || "direct"; (g[k] = g[k] || new Set()).add(e.sid); });
    return Object.entries(g).map(([k, s]) => [k.charAt(0).toUpperCase() + k.slice(1), s.size]).sort((a, b) => b[1] - a[1]);
  }
  A.sessionsBy = sessionsBy;
  function funnel(m) {
    const by = (type) => new Set(m.track.filter((e) => e.type === type).map((e) => e.sid)).size;
    const steps = [["Sessions", by("page_view")], ["Added to basket", by("add_to_cart")], ["Reached checkout", by("checkout_start")], ["Purchased", Math.max(by("purchase"), 0)]];
    const top = steps[0][1] || 1;
    return `<div class="funnel">${steps.map(([l, v], i) => `<div class="funnel__step"><span><b>${esc(l)}</b><br><span class="faint small">${i ? pct(v / (steps[i - 1][1] || 1), 1) + " of previous" : "Storefront visits"}</span></span><span class="funnel__bar"><i style="width:${Math.max(3, (v / top) * 100)}%">${num(v)}</i></span><span class="num r">${pct(v / top, 2)}</span></div>`).join("")}</div>`;
  }
  A.funnel = funnel;
  function liveCount(mins) { const t = Date.now() - (mins || 5) * 60e3; return new Set(data.track().filter((e) => e.t >= t).map((e) => e.sid)).size; }

  /* ------------------------------------------------------------------ *
   * Login
   * ------------------------------------------------------------------ */
  A.route("/login", (root) => {
    document.body.innerHTML = `<div class="login">
      <div class="login__art">
        <img class="logo" src="../assets/img/logo-cream.png" alt="Fresh Valley" width="86" height="56">
        <div><h1>Your store, <em>in season</em>.</h1><p>Orders, products, customers, analytics and the theme — everything that runs Fresh Valley, in one quiet place.</p></div>
        <p class="small" style="opacity:.6">© ${new Date().getFullYear()} Fresh Valley · Admin</p>
        <svg class="sprig" viewBox="0 0 200 260" aria-hidden="true">${(A.S.ART.sprig.match(/<path[^>]*>/g) || []).join("")}</svg>
      </div>
      <div class="login__form"><form class="login__card" id="lf" novalidate>
        <h2>Sign in</h2><p class="muted">Welcome back — sign in to manage the store.</p>
        <div class="fld"><label for="le">Email</label><input class="in" id="le" type="email" autocomplete="username" required></div>
        <div class="fld"><label for="lp">Password</label><input class="in" id="lp" type="password" autocomplete="current-password" required></div>
        <p class="small" id="lerr" role="alert" style="color:var(--bad);min-height:1.2em"></p>
        <button class="ab ab--primary" type="submit">Sign in</button>
        <div class="demo-creds">Demo access — owner: <button type="button" data-u="admin@freshvalley.eg|fresh-admin">admin@freshvalley.eg · fresh-admin</button><br>Staff: <button type="button" data-u="designer@freshvalley.eg|design123">designer@freshvalley.eg · design123</button></div>
        <a class="link small" href="../index.html">← Back to the store</a>
      </form></div></div>`;
    A.auth.users();
    const f = document.getElementById("lf");
    f.querySelectorAll("[data-u]").forEach((b) => b.addEventListener("click", () => { const [e, p] = b.dataset.u.split("|"); f.le.value = e; f.lp.value = p; f.lp.focus(); }));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const s = A.auth.login(f.le.value, f.lp.value);
      if (!s) { document.getElementById("lerr").textContent = "That email and password don't match an admin account."; f.lp.setAttribute("aria-invalid", "true"); return; }
      if (s.role === "owner" && !data.demoOn() && A.get(A.K.orders, []).length < 5 && !A.get("fv_demo_seen", false)) { window.ADemo && ADemo.generate(); A.set("fv_demo_seen", true); }
      location.hash = "#/"; location.reload();
    });
    f.le.focus();
  });

  /* ------------------------------------------------------------------ *
   * Home
   * ------------------------------------------------------------------ */
  A.route("/", (root) => {
    const rg = range(), m = metrics(rg), s = A.auth.session();
    const h = new Date().getHours(), hello = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    const orders = data.orders(), msgs = data.messages();
    const todo = [
      [orders.filter((o) => ["new", "confirmed", "packed"].includes(o.status)).length, "orders to fulfil", "bag", "#/orders?tab=unfulfilled"],
      [orders.filter((o) => o.status === "new").length, "new orders to confirm", "check", "#/orders?tab=open"],
      [cat.products().filter((p) => { const x = cat.stockOf(p); return x != null && x <= (A.settings.get().lowStock || 5); }).length, "products low on stock", "alert", "#/inventory"],
      [msgs.filter((x) => x.status === "new").length, "unread messages", "inbox", "#/inbox"],
      [cat.products().filter((p) => p.status === "draft").length, "draft products", "edit", "#/products?tab=draft"],
    ].filter((t) => t[0] > 0);
    const tp = topProducts(m, 6);
    root.innerHTML = `<div class="page">
      ${A.pageHead(hello + ", " + s.name.split(" ")[0], { actions: A.rangePicker(rg.key) + `<a class="ab" href="../index.html" target="_blank" rel="noopener">${icon("ext")}View store</a>` })}
      ${data.demoOn() ? `<div class="hint-box">${icon("sparkle")}<span>You're looking at <b>demo data</b> mixed with any real orders — so every screen looks alive. Turn it off anytime in <a class="link" href="#/settings/data">Settings → Data</a>.</span></div>` : ""}
      ${kpis(m)}
      <div class="cols">
        ${salesCard(m)}
        <div class="card"><div class="card__hd"><h2>Things to do</h2></div><div class="card__bd" style="padding:8px 0 4px">
          ${todo.length ? todo.map(([n, l, ic, href]) => `<a class="todo" href="${href}"><span class="todo__ic">${icon(ic)}</span><span><b>${num(n)}</b> ${esc(l)}</span><span class="chev">${icon("chevR")}</span></a>`).join("") : `<div class="empty-st" style="padding:24px">${icon("check")}<p>All caught up.</p></div>`}
        </div>
        <div class="card__bd"><div class="row row--between"><span class="row"><span class="live-dot"></span><b>${liveCount(5)}</b> visitors right now</span><a class="link small" href="#/live">Live view</a></div></div></div>
      </div>
      <div class="grid-3">
        <div class="card"><div class="card__hd"><h2>Top products</h2><a class="link small" href="#/reports/sales-by-product">Report</a></div><div class="card__bd" style="padding:6px 0 8px">
          ${tp.length ? tp.map((p) => { const src = p.noPhoto ? "" : A.imgRef(p.image || p.slug); return `<a class="li" href="#/${p.type === "box" ? "boxes" : "products"}/${esc(p.slug)}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : `<span class="thumb-art" style="width:36px;height:36px;border-radius:8px;display:grid;place-items:center;background:var(--forest);color:var(--olive-lt)">${icon("leaf2")}</span>`}<span class="li__main"><span class="li__t">${esc(p.name)}</span><span class="li__s">${num(p.units)} sold</span></span><b class="num">${money(p.rev)}</b></a>`; }).join("") : `<p class="muted small" style="padding:10px 18px">No sales in this period.</p>`}
        </div></div>
        <div class="card"><div class="card__hd"><h2>Sales by area</h2></div><div class="card__bd">${bars(groupSum(m.cur.filter(valid), (o) => o.customer.area, (o) => o.total), money)}</div></div>
        <div class="card"><div class="card__hd"><h2>Sessions by source</h2></div><div class="card__bd">${donut(sessionsBy(m, "src"), num(m.sess), "sessions")}</div></div>
      </div>
      <div class="cols">
        <div class="card card--flush"><div class="card__hd" style="padding-bottom:12px"><h2>Recent orders</h2><a class="link small" href="#/orders">View all</a></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th class="r">Total</th><th>Status</th></tr></thead><tbody>
          ${orders.slice(0, 7).map((o) => `<tr class="is-link" data-href="#/orders/${esc(o.id)}"><td class="strong">${esc(o.id)}${A.demoBadge(o)}</td><td class="nowrap">${ago(o.date)}</td><td>${esc(o.customer.name || "—")}</td><td class="r num">${money(o.total)}</td><td>${A.statusBadge(o.status)}</td></tr>`).join("") || `<tr><td colspan="5">${A.empty("No orders yet", "Orders placed on the storefront appear here instantly.")}</td></tr>`}
          </tbody></table></div></div>
        <div class="card"><div class="card__hd"><h2>Sessions by device</h2></div><div class="card__bd">${donut(sessionsBy(m, "dev"), pct(m.conv, 1), "conversion")}</div></div>
      </div>
    </div>`;
    A.bindRange(root, () => A.go("/"));
    root.querySelectorAll("tr[data-href]").forEach((tr) => tr.addEventListener("click", () => { location.hash = tr.dataset.href; }));
  }, { perm: "home" });

  /* ------------------------------------------------------------------ *
   * Analytics overview
   * ------------------------------------------------------------------ */
  A.route("/analytics", (root) => {
    const rg = range(), m = metrics(rg);
    root.innerHTML = `<div class="page">
      ${A.pageHead("Analytics", { actions: A.rangePicker(rg.key) + `<a class="ab" href="#/reports">${icon("list")}All reports</a><a class="ab" href="#/live"><span class="live-dot"></span>Live view</a>` })}
      ${kpis(m)}
      <div class="cols--even cols">${salesCard(m)}
        <div class="card"><div class="card__hd"><h2>Sessions over time</h2></div><div class="card__bd">${C.slot("area", { values: m.sessS, prev: m.sessP, labels: m.labels, fmt: num, fmtX: fx(m), names: ["Sessions", "Previous"], color: "#2D4630", label: "Sessions over time" })}</div></div></div>
      <div class="card"><div class="card__hd"><h2>Conversion funnel</h2><a class="link small" href="#/reports/conversion-funnel">Report</a></div><div class="card__bd">${funnel(m)}</div></div>
      <div class="grid-3">
        <div class="card"><div class="card__hd"><h2>Sessions by source</h2></div><div class="card__bd">${donut(sessionsBy(m, "src"), num(m.sess), "sessions")}</div></div>
        <div class="card"><div class="card__hd"><h2>Sessions by device</h2></div><div class="card__bd">${donut(sessionsBy(m, "dev"), num(m.sess), "sessions")}</div></div>
        <div class="card"><div class="card__hd"><h2>Sales by payment</h2></div><div class="card__bd">${bars(groupSum(m.cur.filter(valid), (o) => o.payment, (o) => o.total), money)}</div></div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card__hd"><h2>Top landing pages</h2></div><div class="card__bd">${bars(sessionsBy(m, "page").slice(0, 7))}</div></div>
        <div class="card"><div class="card__hd"><h2>Orders by status</h2></div><div class="card__bd">${bars(groupSum(m.cur, (o) => A.STATUS_LABEL[o.status], () => 1))}</div></div>
      </div>
    </div>`;
    A.bindRange(root, () => A.go("/analytics"));
  }, { perm: "analytics" });

  /* ------------------------------------------------------------------ *
   * Reports library
   * ------------------------------------------------------------------ */
  const REPORTS = [
    ["sales-over-time", "Sales over time", "Gross, discounts, delivery and net sales by day.", "Sales"],
    ["sales-by-product", "Sales by product", "Units and revenue for every product and box.", "Sales"],
    ["sales-by-category", "Sales by category", "Fruits, vegetables, herbs and boxes.", "Sales"],
    ["sales-by-area", "Sales by delivery area", "Where your revenue comes from.", "Sales"],
    ["sales-by-payment", "Sales by payment method", "Card, cash on delivery, wallets and Apple Pay.", "Sales"],
    ["orders-by-status", "Orders by status", "Pipeline from new to delivered.", "Orders"],
    ["aov-over-time", "Average order value over time", "How basket size moves day to day.", "Orders"],
    ["new-vs-returning", "New vs returning customers", "First orders against repeat business.", "Customers"],
    ["sessions-over-time", "Sessions over time", "Storefront visits by day.", "Behaviour"],
    ["sessions-by-source", "Sessions by source", "Direct, search, social and referral — with conversion.", "Behaviour"],
    ["sessions-by-device", "Sessions by device", "Mobile, desktop and tablet — with conversion.", "Behaviour"],
    ["conversion-funnel", "Conversion funnel", "Sessions → basket → checkout → purchase.", "Behaviour"],
  ];
  A.route("/reports", (root) => {
    const groups = {};
    REPORTS.forEach((r) => (groups[r[3]] = groups[r[3]] || []).push(r));
    root.innerHTML = `<div class="page">${A.pageHead("Reports", { back: "#/analytics" })}
      ${Object.keys(groups).map((g) => `<div class="card"><div class="card__hd"><h2>${esc(g)}</h2></div><div class="card__bd" style="padding:6px 0 8px">${groups[g].map((r) => `<a class="li" href="#/reports/${r[0]}"><span class="todo__ic">${icon("chart")}</span><span class="li__main"><span class="li__t">${esc(r[1])}</span><span class="li__s">${esc(r[2])}</span></span>${icon("chevR")}</a>`).join("")}</div></div>`).join("")}</div>`;
  }, { perm: "analytics" });

  A.route("/reports/:id", (root, p) => {
    const def = REPORTS.find((r) => r[0] === p.id);
    if (!def) { A.go("/reports"); return; }
    const rg = range(), m = metrics(rg);
    let chart = "", head = [], rows = [];
    const byDay = (fn) => m.labels.map((t, i) => [m.hourly ? new Date(t).getHours() + ":00" : fmtDate(t), ...fn(i, t)]);
    switch (p.id) {
      case "sales-over-time": {
        chart = C.slot("area", { values: m.salesS, prev: m.salesP, labels: m.labels, fmt: money, fmtX: fx(m), names: ["Sales", "Previous"] });
        head = ["Date", "Orders", "Gross sales", "Discounts", "Delivery", "Net sales"];
        const inB = (i, t) => m.cur.filter((o) => { const x = new Date(o.date).getTime(); const B = m.hourly ? 3600e3 : DAY; return x >= t && x < t + B && valid(o); });
        rows = byDay((i, t) => { const l = inB(i, t), g = l.reduce((s, o) => s + o.subtotal, 0), d = l.reduce((s, o) => s + o.discount, 0), dl = l.reduce((s, o) => s + o.delivery, 0); return [l.length, g, d, dl, g - d + dl]; }).reverse();
        rows = rows.map((r) => [r[0], r[1], money(r[2]), r[3] ? "− " + money(r[3]) : "—", money(r[4]), money(r[5])]);
        break;
      }
      case "sales-by-product": {
        const tp = topProducts(m, 200);
        chart = bars(tp.slice(0, 10).map((x) => [x.name, x.rev]), money);
        head = ["Product", "Type", "Units", "Revenue", "Share"];
        const tot = tp.reduce((s, x) => s + x.rev, 0) || 1;
        rows = tp.map((x) => [x.name, x.type === "box" ? "Box" : "Produce", x.units, money(x.rev), pct(x.rev / tot, 1)]);
        break;
      }
      case "sales-by-category": {
        const g = {};
        m.cur.filter(valid).forEach((o) => o.items.forEach((it) => { const pr = A.FV.find(it.slug); const k = it.type === "box" ? "Boxes" : pr ? pr.category.charAt(0).toUpperCase() + pr.category.slice(1) : "Other"; g[k] = g[k] || [0, 0]; g[k][0] += it.qty || 1; g[k][1] += (it.price || 0) * (it.qty || 1); }));
        const list = Object.entries(g).sort((a, b) => b[1][1] - a[1][1]);
        chart = donut(list.map(([k, v]) => [k, v[1]]), money(list.reduce((s, x) => s + x[1][1], 0)), "item revenue", money);
        head = ["Category", "Units", "Revenue"]; rows = list.map(([k, v]) => [k, v[0], money(v[1])]);
        break;
      }
      case "sales-by-area": case "sales-by-payment": {
        const key = p.id === "sales-by-area" ? (o) => o.customer.area : (o) => o.payment;
        const g = groupSum(m.cur.filter(valid), key, (o) => o.total), cnt = groupSum(m.cur.filter(valid), key, () => 1);
        chart = bars(g, money);
        head = [p.id === "sales-by-area" ? "Area" : "Payment method", "Orders", "Sales", "Average order"];
        rows = g.map(([k, v]) => { const c = (cnt.find((x) => x[0] === k) || [0, 0])[1]; return [k, c, money(v), money(c ? v / c : 0)]; });
        break;
      }
      case "orders-by-status": {
        const g = groupSum(m.cur, (o) => A.STATUS_LABEL[o.status], () => 1);
        chart = donut(g, num(m.nOrders), "orders");
        head = ["Status", "Orders", "Share"]; rows = g.map(([k, v]) => [k, v, pct(v / (m.nOrders || 1), 1)]);
        break;
      }
      case "aov-over-time": {
        chart = C.slot("area", { values: m.aovS, labels: m.labels, fmt: money, fmtX: fx(m), names: ["Average order"], color: "#8A8E57" });
        head = ["Date", "Orders", "Average order value"]; rows = byDay((i) => [m.ordersS[i], money(m.aovS[i])]).reverse();
        break;
      }
      case "new-vs-returning": {
        const all = data.orders(), first = {};
        all.slice().reverse().forEach((o) => { const e = String(o.customer.email || "").toLowerCase(); if (e && !first[e]) first[e] = o.id; });
        let nw = 0, ret = 0, nwS = 0, retS = 0;
        m.cur.filter(valid).forEach((o) => { const e = String(o.customer.email || "").toLowerCase(); if (first[e] === o.id) { nw++; nwS += o.total; } else { ret++; retS += o.total; } });
        chart = donut([["New customers", nw], ["Returning customers", ret]], pct(ret / ((nw + ret) || 1), 0), "returning");
        head = ["Customer type", "Orders", "Sales", "Average order"]; rows = [["New", nw, money(nwS), money(nw ? nwS / nw : 0)], ["Returning", ret, money(retS), money(ret ? retS / ret : 0)]];
        break;
      }
      case "sessions-over-time": {
        chart = C.slot("area", { values: m.sessS, prev: m.sessP, labels: m.labels, fmt: num, fmtX: fx(m), names: ["Sessions", "Previous"], color: "#2D4630" });
        head = ["Date", "Sessions", "Orders", "Conversion"]; rows = byDay((i) => [m.sessS[i], m.ordersS[i], pct(m.convS[i], 2)]).reverse();
        break;
      }
      case "sessions-by-source": case "sessions-by-device": {
        const field = p.id === "sessions-by-source" ? "src" : "dev";
        const list = sessionsBy(m, field);
        const buyers = {}; m.track.filter((e) => e.type === "purchase").forEach((e) => { const k = (e[field] || "direct"); buyers[k] = (buyers[k] || 0) + 1; });
        chart = donut(list, num(m.sess), "sessions");
        head = [field === "src" ? "Source" : "Device", "Sessions", "Orders", "Conversion"];
        rows = list.map(([k, v]) => { const b = buyers[k.toLowerCase()] || 0; return [k, v, b, pct(v ? b / v : 0, 2)]; });
        break;
      }
      case "conversion-funnel": {
        chart = funnel(m);
        const by = (type) => new Set(m.track.filter((e) => e.type === type).map((e) => e.sid)).size;
        head = ["Step", "Sessions", "Rate"]; const s0 = by("page_view") || 1;
        rows = [["Sessions", by("page_view"), "100%"], ["Added to basket", by("add_to_cart"), pct(by("add_to_cart") / s0, 2)], ["Reached checkout", by("checkout_start"), pct(by("checkout_start") / s0, 2)], ["Purchased", by("purchase"), pct(by("purchase") / s0, 2)]];
        break;
      }
    }
    root.innerHTML = `<div class="page">${A.pageHead(def[1], { back: "#/reports", actions: A.rangePicker(rg.key) + `<button class="ab" type="button" id="exp">${icon("download")}Export CSV</button>` })}
      <p class="page__sub">${esc(def[2])} · ${esc(rg.label)}</p>
      <div class="card"><div class="card__bd">${chart}</div></div>
      <div class="card card--flush"><div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h, i) => `<th${i ? ' class="r"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="r num"' : ' class="strong"'}>${esc(c)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${head.length}"><p class="muted" style="padding:14px">No data in this period.</p></td></tr>`}</tbody></table></div></div>
    </div>`;
    A.bindRange(root, () => A.go("/reports/" + p.id));
    root.querySelector("#exp").addEventListener("click", () => A.csv(p.id + "-" + rg.key + ".csv", [head].concat(rows)));
  }, { perm: "analytics" });

  /* ------------------------------------------------------------------ *
   * Live view
   * ------------------------------------------------------------------ */
  let liveTimer = null;
  A.route("/live", (root) => {
    clearInterval(liveTimer);
    const draw = () => {
      if (!document.body.contains(root) || location.hash !== "#/live") { clearInterval(liveTimer); return; }
      const now = Date.now(), tr = data.track();
      const recent = tr.filter((e) => e.t >= now - 30 * 60e3).sort((a, b) => b.t - a.t);
      const today = A.startOfDay(now);
      const todays = data.orders().filter((o) => new Date(o.date).getTime() >= today);
      const sessToday = new Set(tr.filter((e) => e.t >= today && e.type === "page_view").map((e) => e.sid)).size;
      const pages = {}; tr.filter((e) => e.t >= now - 5 * 60e3).forEach((e) => { pages[e.page || "index"] = (pages[e.page || "index"] || 0) + 1; });
      const LBL = { page_view: "Viewing", add_to_cart: "Added to basket", checkout_start: "Started checkout", purchase: "Placed an order", wishlist: "Saved to wishlist", newsletter: "Joined the letter", contact: "Sent a message" };
      root.innerHTML = `<div class="page">${A.pageHead("Live view", { back: "#/analytics", actions: `<span class="row small muted"><span class="live-dot"></span>Updates every 10 seconds</span>` })}
        <div class="kpis">
          <div class="card kpi"><span class="kpi__l">Visitors right now</span><span class="kpi__v">${num(liveCount(5))}</span><span class="faint small">active in the last 5 minutes</span></div>
          <div class="card kpi"><span class="kpi__l">Sessions today</span><span class="kpi__v">${num(sessToday)}</span><span class="faint small">since midnight</span></div>
          <div class="card kpi"><span class="kpi__l">Orders today</span><span class="kpi__v">${num(todays.length)}</span><span class="faint small">${money(todays.filter(valid).reduce((s, o) => s + o.total, 0))} in sales</span></div>
        </div>
        <div class="cols">
          <div class="card card--flush"><div class="card__hd" style="padding-bottom:12px"><h2>Activity · last 30 minutes</h2></div>
            ${recent.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Time</th><th>Event</th><th>Page</th><th>Device</th><th>Source</th></tr></thead><tbody>${recent.slice(0, 40).map((e) => `<tr><td class="nowrap">${fmtTime(e.t)}</td><td class="strong">${esc(LBL[e.type] || e.type)}${e.total ? " · " + money(e.total) : ""}</td><td>${esc(e.page || "")}</td><td>${esc(e.dev || "")}</td><td>${esc(e.src || "")}</td></tr>`).join("")}</tbody></table></div>` : A.empty("Quiet right now", "Open the storefront in another tab — your visit will appear here.")}
          </div>
          <div class="card"><div class="card__hd"><h2>Pages being viewed</h2></div><div class="card__bd">${bars(Object.entries(pages).sort((a, b) => b[1] - a[1]))}</div></div>
        </div></div>`;
    };
    draw();
    liveTimer = setInterval(draw, 10000);
  }, { perm: "analytics" });
})();
