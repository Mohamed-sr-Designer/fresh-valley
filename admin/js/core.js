/* =====================================================================
   FRESH VALLEY Admin — core
   Storage + data layer (real + demo merged), auth & roles, formatting,
   date ranges & series, UI kit (toast, modal, confirm, save bar, menus,
   CSV), router, shell (top bar, sidebar, command palette, notifications).
   Views register with A.route(pattern, handler, {perm}).
   ===================================================================== */
window.A = (function () {
  "use strict";
  const FV = window.FV, D = FV.data, T = window.FVTheme, S = window.FVSections;
  const esc = FV.esc;

  /* ------------------------------------------------------------------ *
   * Storage
   * ------------------------------------------------------------------ */
  const K = {
    orders: "fv_orders", clients: "fv_clients", track: "fv_track", catalog: "fv_catalog", settings: "fv_admin_settings",
    messages: "fv_messages", files: "fv_files", users: "fv_admin_users", session: "fv_admin_session", gh: "fv_gh",
    demoOn: "fv_demo_on", dOrders: "fv_demo_orders", dClients: "fv_demo_clients", dTrack: "fv_demo_track", dMessages: "fv_demo_messages",
    range: "fv_admin_range", notes: "fv_admin_notes",
  };
  const get = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (_) { return fb; } };
  function set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { toast("Browser storage is full — clear demo data or old files in Settings → Data", "bad"); return false; }
  }
  const del = (k) => localStorage.removeItem(k);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ------------------------------------------------------------------ *
   * Icons (FV set + admin extras)
   * ------------------------------------------------------------------ */
  const sv = (d, w) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const XI = {
    tag: sv('<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-5.7 5.7a1.5 1.5 0 0 1-2.1 0Z"/><circle cx="8" cy="8" r="1.4"/>'),
    users: sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 19.5c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5"/><path d="M16 4.8a3.4 3.4 0 0 1 0 6.4M18.5 14.3c1.8.7 3 2.6 3 5.2"/>'),
    chart: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    megaphone: sv('<path d="M3.5 10v4a1 1 0 0 0 1 1h2l6 4.5V4.5l-6 4.5h-2a1 1 0 0 0-1 1Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
    percent: sv('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
    store: sv('<path d="M3.5 9 5 4.5h14L20.5 9"/><path d="M3.5 9a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0"/><path d="M5 11.5V20h14v-8.5M10 20v-5h4v5"/>'),
    inbox: sv('<path d="M3.5 13.5 6 5h12l2.5 8.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z"/><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5"/>'),
    image: sv('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 3-3 4 4"/>'),
    bell: sv('<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15Z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>'),
    ext: sv('<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M18 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H10"/>'),
    dots: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>',
    download: sv('<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M4.5 19.5h15"/>'),
    upload: sv('<path d="M12 15V4m-4.5 4.5L12 4l4.5 4.5M4.5 19.5h15"/>'),
    eye: sv('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: sv('<path d="M3 3l18 18M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    edit: sv('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>'),
    copy: sv('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
    chevR: sv('<path d="m9 6 6 6-6 6"/>'),
    chevD: sv('<path d="m6 9 6 6 6-6"/>'),
    back: sv('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    printer: sv('<path d="M7 9V4h10v5M7 17H4.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H17"/><rect x="7" y="14" width="10" height="6" rx="1"/>'),
    logout: sv('<path d="M15 4.5h3.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H15M10 16l-4-4 4-4M6 12h10"/>'),
    lock: sv('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    alert: sv('<path d="M12 4 2.5 20h19Z"/><path d="M12 10v4.5M12 17.5v.5"/>'),
    info: sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.3"/>'),
    refresh: sv('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9M19.5 4.5V9H15"/>'),
    globe: sv('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z"/>'),
    link: sv('<path d="M10 13a5 5 0 0 0 7.5.4l2-2a5 5 0 0 0-7-7l-1.2 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.4l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>'),
    palette: sv('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.7-.8 1.4-1.8-.4-1.2.4-2.2 1.6-2.2h1.8a3.7 3.7 0 0 0 3.7-3.7C20.5 7.3 16.7 3.5 12 3.5Z"/><circle cx="7.8" cy="11" r="1.1"/><circle cx="10.5" cy="7.4" r="1.1"/><circle cx="15" cy="7.8" r="1.1"/>'),
    doc: sv('<path d="M6 3.5h8l4.5 4.5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4.5M8.5 12.5h7M8.5 16h7"/>'),
    list: sv('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.5M4.5 12h.5M4.5 18h.5"/>'),
    boxes: sv('<path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/>'),
    stack: sv('<path d="m12 3.5 8.5 4.5L12 12.5 3.5 8Z"/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>'),
  };
  const icon = (n) => XI[n] || (FV.icon(n) || "").replace("<svg ", '<svg class="ic" ');

  /* ------------------------------------------------------------------ *
   * Formatting + dates
   * ------------------------------------------------------------------ */
  const money = (n) => FV.money(n);
  const num = (n) => Math.round(n || 0).toLocaleString("en-US");
  const pct = (n, d) => (isFinite(n) ? (n * 100).toFixed(d == null ? 1 : d) : "0") + "%";
  const DAY = 864e5;
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const fmtDate = (t, o) => new Date(t).toLocaleDateString("en-GB", o || { day: "numeric", month: "short", year: "numeric" });
  const fmtDay = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const fmtTime = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const fmtDT = (t) => fmtDate(t) + ", " + fmtTime(t);
  function ago(t) {
    const s = Math.round((Date.now() - new Date(t).getTime()) / 1000);
    if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + " min ago"; if (s < 86400) return Math.floor(s / 3600) + " h ago";
    if (s < 86400 * 7) return Math.floor(s / 86400) + " d ago"; return fmtDate(t);
  }
  const RANGES = [["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["90d", "Last 90 days"], ["365d", "Last 12 months"]];
  function range(key) {
    key = key || get(K.range, "30d");
    const now = Date.now(), today = startOfDay(now);
    let days = { today: 1, "7d": 7, "30d": 30, "90d": 90, "365d": 365 }[key] || 30;
    const to = today + DAY, from = to - days * DAY;
    return { key, days, from, to, prevFrom: from - days * DAY, prevTo: from, label: (RANGES.find((r) => r[0] === key) || [0, "Last 30 days"])[1] };
  }
  const inRange = (t, a, b) => { const x = new Date(t).getTime(); return x >= a && x < b; };
  function series(list, from, days, val, when) {
    const out = new Array(days).fill(0);
    list.forEach((x) => { const i = Math.floor((startOfDay(when(x)) - from) / DAY); if (i >= 0 && i < days) out[i] += val(x); });
    return out;
  }
  const labelsFor = (from, days) => Array.from({ length: days }, (_, i) => from + i * DAY);
  function delta(cur, prev) {
    if (!prev) return cur ? { cls: "up", txt: "New" } : { cls: "flat", txt: "—" };
    const d = (cur - prev) / prev;
    return { cls: Math.abs(d) < 0.005 ? "flat" : d > 0 ? "up" : "down", txt: (d > 0 ? "↑ " : d < 0 ? "↓ " : "") + Math.abs(d * 100).toFixed(1) + "%" };
  }

  /* ------------------------------------------------------------------ *
   * Data layer — real + demo (demo never touches real keys)
   * ------------------------------------------------------------------ */
  const STATUS = ["new", "confirmed", "packed", "out", "delivered"];
  const STATUS_LABEL = { new: "New", confirmed: "Confirmed", packed: "Packed", out: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded" };
  function normOrder(o, demo) {
    const st = o.status === "pending" ? "new" : o.status === "transit" ? "out" : (o.status || "new");
    return Object.assign({}, o, { demo: !!demo, status: st, items: o.items || [], total: +o.total || 0, subtotal: +o.subtotal || 0, delivery: +o.delivery || 0, discount: +o.discount || 0, customer: o.customer || {}, timeline: o.timeline || [] });
  }
  function payState(o) {
    if (o.status === "refunded") return "refunded";
    if (o.status === "cancelled") return "voided";
    if (o.paid) return "paid";
    if (/cash/i.test(o.payment || "")) return o.status === "delivered" ? "paid" : "pending";
    return "paid";
  }
  const data = {
    demoOn: () => !!get(K.demoOn, false),
    orders() {
      const real = get(K.orders, []).map((o) => normOrder(o, false));
      const demo = data.demoOn() ? get(K.dOrders, []).map((o) => normOrder(o, true)) : [];
      return real.concat(demo).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    order: (id) => data.orders().find((o) => o.id === id),
    saveOrder(o) {
      const key = o.demo ? K.dOrders : K.orders;
      const list = get(key, []);
      const clean = Object.assign({}, o); delete clean.demo;
      const i = list.findIndex((x) => x.id === o.id);
      if (i > -1) list[i] = clean; else list.unshift(clean);
      set(key, list);
    },
    removeOrder(o) { const key = o.demo ? K.dOrders : K.orders; set(key, get(key, []).filter((x) => x.id !== o.id)); },
    track() { return get(K.track, []).concat(data.demoOn() ? get(K.dTrack, []) : []); },
    messages() {
      const real = get(K.messages, []).map((m) => Object.assign({}, m, { demo: false }));
      const demo = data.demoOn() ? get(K.dMessages, []).map((m) => Object.assign({}, m, { demo: true })) : [];
      return real.concat(demo).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    saveMessage(m) { const key = m.demo ? K.dMessages : K.messages; const list = get(key, []); const i = list.findIndex((x) => x.id === m.id); const c = Object.assign({}, m); delete c.demo; if (i > -1) list[i] = c; set(key, list); },
    clientsRaw() {
      return get(K.clients, []).map((c) => Object.assign({}, c, { demo: false })).concat(data.demoOn() ? get(K.dClients, []).map((c) => Object.assign({}, c, { demo: true })) : []);
    },
    /* Customers = clients ∪ everyone who ordered, with order stats + RFM */
    customers() {
      const map = {};
      const key = (e) => String(e || "").trim().toLowerCase();
      data.clientsRaw().forEach((c) => { if (!c.email) return; map[key(c.email)] = Object.assign({ orders: [], spent: 0 }, c); });
      data.orders().forEach((o) => {
        const e = key(o.customer.email); if (!e) return;
        const c = map[e] || (map[e] = { id: "C" + e.replace(/[^a-z0-9]/g, "").slice(0, 8).toUpperCase(), email: o.customer.email, name: o.customer.name, phone: o.customer.phone, area: o.customer.area, joined: o.date, status: "active", demo: o.demo, orders: [], spent: 0 });
        c.orders.push(o);
        if (o.status !== "cancelled" && o.status !== "refunded") c.spent += o.total;
        c.name = c.name || o.customer.name; c.phone = c.phone || o.customer.phone; c.area = c.area || o.customer.area;
        if (new Date(o.date) < new Date(c.joined || o.date)) c.joined = o.date;
      });
      const now = Date.now();
      return Object.values(map).map((c) => {
        c.count = c.orders.length;
        c.last = c.orders.length ? c.orders.reduce((m, o) => Math.max(m, new Date(o.date).getTime()), 0) : 0;
        c.aov = c.count ? c.spent / c.count : 0;
        const r = c.last ? (now - c.last) / DAY : 999;
        c.segment = !c.count ? "Subscriber" : c.count >= 4 && r <= 30 ? "Champions" : c.count >= 3 && r <= 60 ? "Loyal" : c.count === 1 && r <= 14 ? "New" : c.count <= 2 && r <= 30 ? "Promising" : c.count >= 2 && r > 60 ? "At risk" : r > 90 || (c.count === 1 && r > 45) ? "Hibernating" : "Needs attention";
        return c;
      }).sort((a, b) => b.spent - a.spent);
    },
    upsertClient(c) {
      const key = c.demo ? K.dClients : K.clients;
      const list = get(key, []); const i = list.findIndex((x) => String(x.email).toLowerCase() === String(c.email).toLowerCase());
      const clean = { id: c.id, name: c.name, email: c.email, phone: c.phone || "", area: c.area || "", joined: c.joined || new Date().toISOString(), status: c.status || "active", marketing: !!c.marketing, tags: c.tags || [], note: c.note || "" };
      if (i > -1) list[i] = Object.assign(list[i], clean); else list.push(clean);
      set(key, list);
    },
  };

  /* Catalog overrides (fv_catalog) — also mirrored into the in-memory FV data */
  const cat = {
    get() { return Object.assign({ prices: {}, pmeta: {}, custom: [], categories: {}, boxes: {}, discounts: [] }, get(K.catalog, {}) || {}); },
    save(c) { c.updatedAt = Date.now(); return set(K.catalog, c); },
    update(fn) { const c = cat.get(); fn(c); return cat.save(c); },
    products: () => D.products,
    boxes: () => D.boxes,
    price: (p) => p.unit === "kg" ? p.pricePerKg : p.pricePerUnit,
    stockOf(p) { return p.stock == null || p.stock === "" ? null : +p.stock; },
    pimg(p) { if (!p) return ""; if (FV.isCustomImg(p.image)) return imgRef(p.image); return p.noPhoto ? "" : imgRef(p.slug); },
    bimg(b) { return b ? imgRef(b.image) : ""; },
    itemImg(it) { if (!it || it.noPhoto) return ""; return imgRef(it.image || it.slug); },
  };
  /* Resolve an image ref for use inside /admin/ */
  function imgRef(ref, small) {
    if (!ref) return "";
    if (/^(https?:|data:)/.test(ref)) return ref;
    if (ref.indexOf("assets/") === 0) return "../" + ref;
    if (ref.indexOf("banner:") === 0) return "../assets/img/banners/" + (small ? "sm/" : "") + ref.slice(7) + ".jpg";
    if (ref === "hero") return "../assets/img/hero/hero-800.jpg";
    if (ref.indexOf("art:") === 0) return "";
    return "../" + (small === false ? FV.img(ref) : FV.thumb(ref));
  }
  const settings = {
    get: () => Object.assign({}, FV.settings),
    save(s) { s.updatedAt = Date.now(); Object.assign(FV.settings, s); return set(K.settings, s); },
  };
  const theme = {
    get: () => clone(T.get()),
    save(t) { const saved = T.save(t); return saved; },
    savedAt: () => { const l = get(T.KEY, null); return l && l.updatedAt; },
  };

  /* ------------------------------------------------------------------ *
   * Auth + roles
   * ------------------------------------------------------------------ */
  const ROLE_LABEL = { owner: "Owner", manager: "Manager", staff: "Staff" };
  const PERMS = {
    owner: ["*"],
    manager: ["home", "orders", "products", "customers", "content", "analytics", "marketing", "store", "settings", "publish"],
    staff: ["home", "orders", "products", "customers", "content", "analytics", "store"],
  };
  const auth = {
    users() {
      let u = get(K.users, null);
      if (!Array.isArray(u) || !u.length) {
        u = [
          { id: "U1", name: "Mohamed Tarek", email: "admin@freshvalley.eg", password: "fresh-admin", role: "owner", created: new Date().toISOString() },
          { id: "U2", name: "Salma · Design & SEO", email: "designer@freshvalley.eg", password: "design123", role: "staff", created: new Date().toISOString() },
        ];
        set(K.users, u);
      }
      let changed = false;
      u.forEach((x) => { if (x.role === "super-admin") { x.role = "owner"; changed = true; } else if (x.role === "admin") { x.role = "manager"; changed = true; } else if (!PERMS[x.role]) { x.role = "staff"; changed = true; } });
      if (changed) set(K.users, u);
      return u;
    },
    session() { const s = get(K.session, null); if (!s || !s.id || Date.now() - (s.at || 0) > 7 * DAY) return null; return s; },
    login(email, pass) {
      const u = auth.users().find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === pass);
      if (!u) return null;
      const s = { id: u.id, name: u.name, email: u.email, role: u.role, at: Date.now() };
      set(K.session, s); return s;
    },
    logout() { del(K.session); location.hash = "#/login"; location.reload(); },
    can(perm) { const s = auth.session(); if (!s) return false; const p = PERMS[s.role] || []; return p.includes("*") || p.includes(perm); },
  };

  /* ------------------------------------------------------------------ *
   * UI kit
   * ------------------------------------------------------------------ */
  function toast(msg, type, action) {
    let host = document.querySelector(".toasts");
    if (!host) { host = document.createElement("div"); host.className = "toasts"; host.setAttribute("aria-live", "polite"); document.body.appendChild(host); }
    const t = document.createElement("div");
    t.className = "toast" + (type === "bad" ? " toast--bad" : "");
    t.setAttribute("role", "status");
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="ab ab--sm" type="button">${esc(action.label)}</button>` : ""}`;
    if (action) t.querySelector("button").addEventListener("click", () => { action.fn(); t.remove(); });
    host.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, action ? 6000 : 3200);
  }
  let modalStack = [];
  function modal(o) {
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    const id = "m" + Date.now();
    scrim.innerHTML = `<div class="modal${o.wide ? " modal--wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="${id}">
      <div class="modal__hd"><h2 id="${id}">${esc(o.title || "")}</h2><button class="ab ab--plain ab--icon" type="button" data-x aria-label="Close">${icon("close")}</button></div>
      <div class="modal__bd">${o.body || ""}</div>
      ${o.actions && o.actions.length ? `<div class="modal__ft">${o.actions.map((a, i) => `<button type="button" class="ab${a.primary ? " ab--primary" : a.critical ? " ab--critical" : ""}" data-a="${i}">${esc(a.label)}</button>`).join("")}</div>` : ""}
    </div>`;
    const prev = document.activeElement;
    document.body.appendChild(scrim);
    const close = () => { scrim.remove(); modalStack = modalStack.filter((m) => m !== api); if (prev && prev.focus) prev.focus(); };
    const api = { el: scrim.querySelector(".modal"), close };
    modalStack.push(api);
    scrim.addEventListener("click", (e) => { if (e.target === scrim) close(); });
    scrim.querySelector("[data-x]").addEventListener("click", close);
    (o.actions || []).forEach((a, i) => scrim.querySelector(`[data-a="${i}"]`).addEventListener("click", () => { const r = a.onClick ? a.onClick(api) : undefined; if (r !== false) close(); }));
    setTimeout(() => { const f = scrim.querySelector(".modal__bd input, .modal__bd select, .modal__bd textarea, .modal__ft .ab--primary, [data-x]"); f && f.focus(); }, 30);
    if (o.onOpen) o.onOpen(api);
    return api;
  }
  function confirmBox(title, text, o) {
    o = o || {};
    return new Promise((res) => {
      modal({ title, body: `<p class="muted">${esc(text)}</p>`, actions: [{ label: "Cancel", onClick: () => res(false) }, { label: o.ok || "Confirm", primary: !o.danger, critical: !!o.danger, onClick: () => res(true) }] });
    });
  }
  function prompt(title, label, value) {
    return new Promise((res) => {
      modal({ title, body: `<div class="fld"><label for="pIn">${esc(label)}</label><input class="in" id="pIn" value="${esc(value || "")}"></div>`,
        actions: [{ label: "Cancel", onClick: () => res(null) }, { label: "Save", primary: true, onClick: (m) => res(m.el.querySelector("#pIn").value) }] });
    });
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalStack.length) modalStack[modalStack.length - 1].close(); });

  /* Contextual save bar (Shopify-style) */
  const saveBar = (function () {
    let el = null, h = null;
    function ensure() {
      if (el) return;
      el = document.createElement("div"); el.className = "savebar"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Unsaved changes");
      el.innerHTML = `<div class="savebar__t">${icon("alert")}<span>Unsaved changes</span></div><div class="row"><button class="ab" type="button" data-sb="discard">Discard</button><button class="ab ab--olive" type="button" data-sb="save">Save</button></div>`;
      document.body.appendChild(el);
      el.querySelector('[data-sb="save"]').addEventListener("click", () => h && h.save());
      el.querySelector('[data-sb="discard"]').addEventListener("click", () => h && h.discard());
    }
    return {
      show(handlers) { ensure(); h = handlers; el.classList.add("show"); },
      hide() { if (el) el.classList.remove("show"); h = null; },
      dirty: () => !!(el && el.classList.contains("show")),
    };
  })();
  window.addEventListener("beforeunload", (e) => { if (saveBar.dirty()) { e.preventDefault(); e.returnValue = ""; } });

  function menu(anchor, items) {
    document.querySelectorAll(".menu-pop").forEach((m) => m.remove());
    const m = document.createElement("div"); m.className = "menu-pop"; m.setAttribute("role", "menu");
    m.innerHTML = items.filter(Boolean).map((it, i) => it.href ? `<a role="menuitem" href="${esc(it.href)}"${it.target ? ` target="${it.target}" rel="noopener"` : ""}>${it.icon ? icon(it.icon) : ""}${esc(it.label)}</a>` : `<button role="menuitem" type="button" data-i="${i}" class="${it.danger ? "crit" : ""}">${it.icon ? icon(it.icon) : ""}${esc(it.label)}</button>`).join("");
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 6) + "px";
    m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth + window.scrollX)) + "px";
    items.filter(Boolean).forEach((it, i) => { const b = m.querySelector(`[data-i="${i}"]`); if (b) b.addEventListener("click", () => { m.remove(); it.fn(); }); });
    setTimeout(() => document.addEventListener("click", function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("click", off); } }), 0);
    const f = m.querySelector("a, button"); f && f.focus();
    return m;
  }
  function csv(name, rows) {
    const q = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const text = rows.map((r) => r.map(q).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    toast("Exported " + name);
  }
  function download(name, text, type) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "application/json" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function statusBadge(st) {
    const map = { new: "info", confirmed: "warn", packed: "warn", out: "warn", delivered: "ok", cancelled: "bad", refunded: "bad" };
    return `<span class="bdg bdg--${map[st] || ""}">${esc(STATUS_LABEL[st] || st)}</span>`;
  }
  function payBadge(o) {
    const p = payState(o);
    return `<span class="bdg ${p === "paid" ? "bdg--ok" : p === "pending" ? "bdg--warn" : "bdg--bad"}">${p === "paid" ? "Paid" : p === "pending" ? "Payment pending" : p === "refunded" ? "Refunded" : "Voided"}</span>`;
  }
  const fulBadge = (o) => (o.fulfillment === "fulfilled" || o.status === "delivered") ? `<span class="bdg bdg--ok">Fulfilled</span>` : (o.status === "cancelled" || o.status === "refunded") ? `<span class="bdg">—</span>` : `<span class="bdg bdg--warn">Unfulfilled</span>`;
  const demoBadge = (x) => x && x.demo ? ` <span class="bdg bdg--demo" title="Demo data">Demo</span>` : "";
  function empty(title, text, action) {
    return `<div class="empty-st">${(S.ART.leaf || "").replace('class="art"', 'class="art"')}<h3>${esc(title)}</h3><p>${esc(text || "")}</p>${action || ""}</div>`;
  }
  function pageHead(title, o) {
    o = o || {};
    return `<div class="page__head"><div class="page__title">${o.back ? `<a class="page__back" href="${o.back}" aria-label="Back">${icon("back")}</a>` : ""}<h1>${esc(title)}</h1>${o.badges || ""}</div><div class="page__actions">${o.actions || ""}</div></div>${o.sub ? `<p class="page__sub">${o.sub}</p>` : ""}`;
  }
  const rangePicker = (cur) => `<select class="sel" data-range aria-label="Date range" style="width:auto">${RANGES.map(([k, l]) => `<option value="${k}"${k === cur ? " selected" : ""}>${l}</option>`).join("")}</select>`;
  function bindRange(root, onChange) {
    const s = root.querySelector("[data-range]");
    if (s) s.addEventListener("change", () => { set(K.range, s.value); onChange(s.value); });
  }
  function switchEl(id, on, label) { return `<button type="button" class="switch" role="switch" id="${id}" aria-checked="${!!on}"${label ? ` aria-label="${esc(label)}"` : ""}></button>`; }
  function bindSwitches(root) { root.querySelectorAll(".switch").forEach((s) => s.addEventListener("click", () => { s.setAttribute("aria-checked", s.getAttribute("aria-checked") !== "true"); s.dispatchEvent(new Event("change", { bubbles: true })); })); }

  /* ------------------------------------------------------------------ *
   * Router + shell
   * ------------------------------------------------------------------ */
  const routes = [];
  function route(pattern, handler, o) {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:([a-z]+)/gi, (m, k) => { keys.push(k); return "([^/]+)"; }) + "/?$");
    routes.push({ re, keys, handler, perm: (o && o.perm) || null, nav: (o && o.nav) || pattern });
  }
  const go = (path) => { location.hash = "#" + path; };
  const NAV = [
    { href: "/", label: "Home", icon: "home", perm: "home" },
    { href: "/orders", label: "Orders", icon: "bag", perm: "orders", badge: () => data.orders().filter((o) => o.status === "new").length },
    { href: "/products", label: "Products", icon: "tag", perm: "products", subs: [{ href: "/collections", label: "Collections" }, { href: "/inventory", label: "Inventory" }, { href: "/boxes", label: "Boxes" }] },
    { href: "/customers", label: "Customers", icon: "users", perm: "customers", subs: [{ href: "/subscribers", label: "Subscribers" }] },
    { label: "Content" },
    { href: "/inbox", label: "Inbox", icon: "inbox", perm: "content", badge: () => data.messages().filter((m) => m.status === "new").length },
    { href: "/files", label: "Files", icon: "image", perm: "content" },
    { label: "Growth" },
    { href: "/analytics", label: "Analytics", icon: "chart", perm: "analytics", subs: [{ href: "/reports", label: "Reports" }, { href: "/live", label: "Live view" }] },
    { href: "/discounts", label: "Discounts", icon: "percent", perm: "marketing" },
    { label: "Sales channels" },
    { href: "/online-store", label: "Online Store", icon: "store", perm: "store", subs: [{ href: "/online-store", label: "Themes" }, { href: "/navigation", label: "Navigation" }, { href: "/pages", label: "Pages" }, { href: "/preferences", label: "Preferences" }] },
  ];
  function shell() {
    const s = auth.session();
    const initials = s.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    document.body.innerHTML = `
      <a class="sr-only" href="#main">Skip to content</a>
      <header class="top">
        <div class="row" style="gap:.4rem"><button class="top__btn top__menu-btn" type="button" id="sideBtn" aria-label="Menu">${icon("menu")}</button>
          <a class="top__brand" href="#/"><img src="../assets/img/logo-cream-sm.png" srcset="../assets/img/logo-cream-sm.png 1x, ../assets/img/logo-cream.png 2x" alt="Fresh Valley"><span>Admin</span></a></div>
        <button class="top__search" type="button" id="cmdBtn">${icon("search")}<span class="t">Search orders, products, customers…</span><kbd>Ctrl K</kbd></button>
        <div class="top__right">
          <a class="top__btn" href="../index.html" target="_blank" rel="noopener" title="View store">${icon("store")}<span class="nm" style="font-weight:600">View store</span></a>
          <button class="top__btn" type="button" id="bellBtn" aria-label="Notifications">${icon("bell")}<span class="top__dot" id="bellDot" hidden></span></button>
          <button class="top__btn top__me" type="button" id="meBtn" aria-label="Account menu"><span class="av">${esc(initials)}</span><span class="nm">${esc(s.name.split(" ")[0])}</span></button>
        </div>
      </header>
      <nav class="side" id="side" aria-label="Admin"></nav>
      <main class="main" id="main" tabindex="-1"></main>`;
    renderSide();
    document.getElementById("sideBtn").addEventListener("click", () => document.body.classList.toggle("side-open"));
    document.getElementById("cmdBtn").addEventListener("click", palette);
    document.getElementById("bellBtn").addEventListener("click", (e) => bell(e.currentTarget));
    document.getElementById("meBtn").addEventListener("click", (e) => menu(e.currentTarget, [
      { label: s.name + " · " + ROLE_LABEL[s.role], icon: "user", fn: () => go("/settings/users") },
      { label: "Settings", icon: "gear", fn: () => go("/settings") },
      { label: "View store", icon: "ext", href: "../index.html", target: "_blank" },
      { label: "Log out", icon: "logout", danger: true, fn: auth.logout },
    ]));
    document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette(); } });
    updateBell();
  }
  function renderSide() {
    const side = document.getElementById("side"); if (!side) return;
    const path = (location.hash.slice(1) || "/").split("?")[0];
    const active = (href) => href === "/" ? path === "/" : path === href || path.indexOf(href + "/") === 0;
    side.innerHTML = NAV.map((n) => {
      if (!n.href) return `<div class="side__label">${esc(n.label)}</div>`;
      if (n.perm && !auth.can(n.perm)) return "";
      const cnt = n.badge ? n.badge() : 0;
      const open = active(n.href) || (n.subs || []).some((s) => active(s.href));
      return `<a href="#${n.href}"${active(n.href) && !(n.subs || []).some((s) => s.href !== n.href && active(s.href)) ? ' aria-current="page"' : ""}>${icon(n.icon)}${esc(n.label)}${cnt ? `<span class="badge-n">${cnt}</span>` : ""}</a>` +
        (open && n.subs ? n.subs.map((s) => `<a class="sub" href="#${s.href}"${active(s.href) && (s.href !== n.href || path === n.href) ? ' aria-current="page"' : ""}>${esc(s.label)}</a>`).join("") : "");
    }).join("") + `<div class="side__foot">${auth.can("settings") ? `<a href="#/settings"${active("/settings") ? ' aria-current="page"' : ""}>${icon("gear")}Settings</a>` : ""}<a href="theme.html">${icon("palette")}Customize theme</a></div>`;
  }
  function updateBell() {
    const n = data.orders().filter((o) => o.status === "new").length + data.messages().filter((m) => m.status === "new").length;
    const d = document.getElementById("bellDot"); if (d) d.hidden = !n;
  }
  function bell(anchor) {
    const items = [];
    data.orders().filter((o) => o.status === "new").slice(0, 5).forEach((o) => items.push({ label: `New order ${o.id} · ${money(o.total)}`, icon: "bag", fn: () => go("/orders/" + o.id) }));
    data.messages().filter((m) => m.status === "new").slice(0, 3).forEach((m) => items.push({ label: `Message from ${m.first || m.email}`, icon: "inbox", fn: () => go("/inbox/" + m.id) }));
    cat.products().filter((p) => { const s = cat.stockOf(p); return s != null && s <= 5; }).slice(0, 3).forEach((p) => items.push({ label: `Low stock · ${p.name}`, icon: "alert", fn: () => go("/inventory") }));
    if (!items.length) items.push({ label: "You're all caught up", icon: "check", fn: () => {} });
    menu(anchor, items);
  }

  /* Command palette */
  function palette() {
    const scrim = document.createElement("div");
    scrim.className = "scrim"; scrim.style.alignItems = "start";
    scrim.innerHTML = `<div class="palette" role="dialog" aria-modal="true" aria-label="Search"><div class="palette__in">${icon("search")}<input id="palIn" placeholder="Search orders, products, customers, pages…" autocomplete="off" aria-controls="palRes"></div><div class="palette__res" id="palRes" role="listbox"></div></div>`;
    document.body.appendChild(scrim);
    const input = scrim.querySelector("#palIn"), res = scrim.querySelector("#palRes");
    const close = () => scrim.remove();
    scrim.addEventListener("click", (e) => { if (e.target === scrim) close(); });
    const PAGES = [["Home", "/"], ["Orders", "/orders"], ["Create order", "/orders/new"], ["Products", "/products"], ["Add product", "/products/new"], ["Collections", "/collections"], ["Inventory", "/inventory"], ["Boxes", "/boxes"], ["Customers", "/customers"], ["Subscribers", "/subscribers"], ["Inbox", "/inbox"], ["Files", "/files"], ["Analytics", "/analytics"], ["Reports", "/reports"], ["Live view", "/live"], ["Discounts", "/discounts"], ["Online Store · Themes", "/online-store"], ["Navigation", "/navigation"], ["Pages", "/pages"], ["Preferences", "/preferences"], ["Settings", "/settings"], ["Users & permissions", "/settings/users"], ["Publishing", "/settings/publishing"], ["Data & demo", "/settings/data"]];
    let items = [], sel = 0;
    function build(q) {
      q = q.trim().toLowerCase();
      const m = (s) => String(s || "").toLowerCase().includes(q);
      const groups = [];
      groups.push(["Pages", PAGES.filter((p) => !q || m(p[0])).slice(0, q ? 6 : 8).map((p) => ({ label: p[0], hint: "", go: p[1] }))]);
      if (q) {
        groups.push(["Orders", data.orders().filter((o) => m(o.id) || m(o.customer.name) || m(o.customer.email)).slice(0, 5).map((o) => ({ label: o.id + " · " + (o.customer.name || ""), hint: money(o.total), go: "/orders/" + o.id }))]);
        groups.push(["Products", cat.products().filter((p) => m(p.name) || m(p.slug)).slice(0, 5).map((p) => ({ label: p.name, hint: money(cat.price(p)), go: "/products/" + p.slug }))]);
        groups.push(["Customers", data.customers().filter((c) => m(c.name) || m(c.email)).slice(0, 5).map((c) => ({ label: c.name || c.email, hint: c.email, go: "/customers/" + encodeURIComponent(c.email) }))]);
        groups.push(["Theme", ["index", "hosting", "about", "contact", "journal", "policies", "terms"].filter((k) => m(k) || m((T.page(k) || {}).title)).map((k) => ({ label: "Customize · " + ((T.page(k) || {}).title || k), hint: "", href: "theme.html?page=" + k }))]);
      }
      items = [];
      res.innerHTML = groups.filter((g) => g[1].length).map((g) => `<div class="palette__grp">${g[0]}</div>` + g[1].map((it) => { items.push(it); const i = items.length - 1; return `<button type="button" class="palette__item" role="option" data-i="${i}" aria-selected="${i === sel}">${esc(it.label)}<span class="faint">${esc(it.hint || "")}</span></button>`; }).join("")).join("") || `<p class="muted" style="padding:1rem">No results for “${esc(q)}”.</p>`;
      res.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => run(+b.dataset.i)));
    }
    function run(i) { const it = items[i]; if (!it) return; close(); if (it.href) location.href = it.href; else go(it.go); }
    input.addEventListener("input", () => { sel = 0; build(input.value); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); }
      else if (e.key === "Enter") { e.preventDefault(); run(sel); return; }
      else if (e.key === "Escape") { close(); return; }
      else return;
      res.querySelectorAll("[data-i]").forEach((b) => b.setAttribute("aria-selected", +b.dataset.i === sel));
      const cur = res.querySelector(`[data-i="${sel}"]`); cur && cur.scrollIntoView({ block: "nearest" });
    });
    build(""); input.focus();
  }

  let lastPath = null;
  function resolve() {
    const full = location.hash.slice(1) || "/";
    const [path, qs] = full.split("?");
    const q = new URLSearchParams(qs || "");
    const s = auth.session();
    if (!s && path !== "/login") { go("/login"); return; }
    if (path === "/login") { const r = routes.find((x) => x.re.test("/login")); if (s) { go("/"); return; } r.handler(document.body, {}, q); return; }
    if (saveBar.dirty() && lastPath && lastPath !== full) {
      if (!window.confirm("You have unsaved changes. Leave this page and discard them?")) { history.replaceState(null, "", "#" + lastPath); return; }
      saveBar.hide();
    }
    if (!document.getElementById("main")) shell();
    document.body.classList.remove("side-open");
    renderSide(); updateBell();
    const main = document.getElementById("main");
    const r = routes.find((x) => x.re.test(path));
    lastPath = full;
    window.scrollTo(0, 0);
    if (!r) { main.innerHTML = `<div class="page">${empty("Page not found", "That admin page doesn't exist.", `<a class="ab ab--primary" href="#/">Go home</a>`)}</div>`; return; }
    if (r.perm && !auth.can(r.perm)) { main.innerHTML = `<div class="page">${empty("You don't have access", "Ask the store owner to change your role in Settings → Users.", `<a class="ab" href="#/">Back to Home</a>`)}</div>`; return; }
    const m = path.match(r.re), params = {};
    r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    try { r.handler(main, params, q); }
    catch (e) { console.error(e); main.innerHTML = `<div class="page"><div class="hint-box hint-box--bad">${icon("alert")}<span>Something went wrong rendering this page: ${esc(e.message)}</span></div></div>`; }
    if (window.FVCharts) FVCharts.mount(main);
    main.focus({ preventScroll: true });
  }
  function start() {
    window.addEventListener("hashchange", resolve);
    resolve();
  }

  return {
    FV, D, T, S, K, esc, get, set, del, clone, icon, money, num, pct, DAY, startOfDay, fmtDate, fmtDay, fmtTime, fmtDT, ago, range, RANGES, inRange, series, labelsFor, delta,
    STATUS, STATUS_LABEL, payState, data, cat, imgRef, settings, theme, auth, ROLE_LABEL, toast, modal, confirm: confirmBox, prompt, saveBar, menu, csv, download,
    statusBadge, payBadge, fulBadge, demoBadge, empty, pageHead, rangePicker, bindRange, switchEl, bindSwitches, route, go, start, renderSide, updateBell,
  };
})();
