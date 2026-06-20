/* =====================================================================
   FRESH VALLEY — Application engine
   Shared across every page: shell (header/footer/drawers), cart &
   wishlist stores (localStorage), pricing, toasts, search, motion,
   and reusable render helpers.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.FV_DATA;

  /* ------------------------------------------------------------------ *
   * Admin overrides — shared localStorage contract with admin.js.
   * Applied here so every storefront page reflects the dashboard live:
   * prices, theme colours, currency, store rules, content & sections.
   * (Same browser only — swap for an API in production.)
   * ------------------------------------------------------------------ */
  const _AK = { orders: "fv_orders", clients: "fv_clients", theme: "fv_admin_theme", prices: "fv_admin_prices", pmeta: "fv_admin_pmeta", custom: "fv_admin_custom", content: "fv_admin_content", images: "fv_admin_images", settings: "fv_admin_settings" };
  function _ag(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch { return fb; } }
  function _as(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  const ADMIN = {
    settings: Object.assign({ storeName: "Fresh Valley", currency: "EGP", storeOpen: true, deliveryFee: 45, freeThreshold: 600, taxRate: 0 }, _ag(_AK.settings, {})),
    content: _ag(_AK.content, {}),
  };
  // 0) merge admin-added products into the catalog (same-browser; cross-device via API)
  (function () {
    const custom = _ag(_AK.custom, []);
    if (D && D.products && custom.length) custom.forEach((c) => { if (!D.products.some((p) => p.slug === c.slug)) D.products.push(c); });
  })();
  // 1) price overrides → mutate the catalog so every render uses new prices
  (function () {
    const p = _ag(_AK.prices, {});
    if (D && D.products) D.products.forEach((prod) => { if (p[prod.slug] != null) { if (prod.unit === "kg") prod.pricePerKg = +p[prod.slug]; else prod.pricePerUnit = +p[prod.slug]; } });
    if (D && D.boxes) D.boxes.forEach((b) => { if (p[b.slug] != null) { const min = Math.min(...b.tiers.map((t) => t.price)); const delta = +p[b.slug] - min; b.tiers.forEach((t) => t.price = Math.max(0, Math.round(t.price + delta))); } });
  })();
  // 2) hide products switched off in the admin
  (function () {
    const m = _ag(_AK.pmeta, {});
    if (D && D.products) D.products = D.products.filter((prod) => !(m[prod.slug] && m[prod.slug].active === false));
  })();
  // 3) theme tokens → apply to :root immediately (no flash of original palette)
  (function () {
    const t = _ag(_AK.theme, {}); const r = document.documentElement;
    Object.keys(t).forEach((k) => r.style.setProperty(k, t[k]));
  })();

  /* ------------------------------------------------------------------ *
   * Icons (inline SVG, 24px, currentColor)
   * ------------------------------------------------------------------ */
  const I = {
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-.8 11.2a1.6 1.6 0 0 1-1.6 1.5H8.4a1.6 1.6 0 0 1-1.6-1.5L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>',
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    star:'<svg viewBox="0 0 24 24"><path d="M12 2.5l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.3 6.3 20l1.2-6.4L2.8 9.2l6.4-.8L12 2.5z"/></svg>',
    leaf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-7 5-13 14-13 0 9-6 14-13 14"/><path d="M5 19c2-4 5-6 9-7"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    snow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M20 6 4 18"/></svg>',
    sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    facebook:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.3c0-.8.25-1.4 1.45-1.4H16V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H7.8V14h2.3v7z"/></svg>',
    tiktok:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3h2.6c.25 1.6 1.1 3 2.45 3.85.5.32 1.08.54 1.7.62v2.7c-1.5 0-2.9-.4-4.1-1.15v5.8a6 6 0 1 1-6-6c.3 0 .6.02.9.07v2.8a3.3 3.3 0 1 0 2.45 3.18z"/></svg>',
    leaf2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21c-4 0-7-3-7-8 0-6 6-9 13-9 0 8-3 13-8 14-2 .4-3-1-3-3 0-3 3-5 6-6"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9.4a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9.4a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></svg>',
  };

  /* ------------------------------------------------------------------ *
   * Payment brand marks (white card chips — work on light & dark)
   * ------------------------------------------------------------------ */
  const PAY = {
    visa: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Visa"><rect width="40" height="26" rx="4" fill="#fff"/><text x="20" y="17.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-style="italic" font-size="10.5" letter-spacing=".4" fill="#1434CB">VISA</text></svg>',
    mastercard: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Mastercard"><rect width="40" height="26" rx="4" fill="#fff"/><circle cx="16.5" cy="13" r="7" fill="#EB001B"/><circle cx="23.5" cy="13" r="7" fill="#F79E1B"/><path d="M20 7.7a7 7 0 0 1 0 10.6 7 7 0 0 1 0-10.6Z" fill="#FF5F00"/></svg>',
    apple: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Apple Pay"><rect width="40" height="26" rx="4" fill="#fff"/><g transform="translate(0.5,0)" fill="#000"><path d="M13.9 9.2c.4-.5.7-1.2.6-1.9-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.8.7.1 1.3-.3 1.7-.8Zm.6 1c-.9-.1-1.7.5-2.1.5-.4 0-1.1-.5-1.8-.5-.9 0-1.8.5-2.2 1.4-1 1.6-.3 4 .7 5.3.5.6 1 1.3 1.8 1.3.7 0 .9-.5 1.8-.5.8 0 1 .5 1.8.4.7 0 1.2-.6 1.7-1.3.5-.7.7-1.4.7-1.4s-1.3-.5-1.3-2c0-1.2 1-1.8 1.1-1.8-.6-.9-1.5-1-1.9-1Z"/><text x="18" y="17" font-family="Arial,Helvetica,sans-serif" font-weight="600" font-size="9.5">Pay</text></g></svg>',
    wallet: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Mobile wallet"><rect width="40" height="26" rx="4" fill="#fff"/><g fill="none" stroke="#1C3A29" stroke-width="1.5" stroke-linejoin="round"><rect x="10" y="8" width="20" height="11" rx="2"/><path d="M10 11h20"/></g><circle cx="25" cy="15" r="1.4" fill="#C89B5C"/></svg>',
  };
  const PAY_MARKS = PAY.visa + PAY.mastercard + PAY.apple + PAY.wallet;

  /* ------------------------------------------------------------------ *
   * Money + pricing
   * ------------------------------------------------------------------ */
  const money = (n) => ADMIN.settings.currency + " " + Math.round(n).toLocaleString("en-US");

  const weightOptions = [
    { g: 500,  label: "½ kg" },
    { g: 1000, label: "1 kg", default: true },
    { g: 2000, label: "2 kg" },
    { g: 3000, label: "3 kg" },
    { g: 4000, label: "4 kg" },
  ];
  const weightLabel = (grams) => grams === 500 ? "½ kg" : (grams / 1000) + " kg";

  function priceForWeight(product, grams) {
    const kg = grams / 1000;
    // gentle bulk value at larger sizes — rewards bigger baskets
    const factor = kg >= 4 ? 0.92 : kg >= 3 ? 0.94 : kg >= 2 ? 0.97 : 1;
    return Math.round(product.pricePerKg * kg * factor);
  }
  // Headline price shown on cards
  function cardPrice(p) {
    if (p.unit === "kg")    return { value: p.pricePerKg, per: "/ kg" };
    if (p.unit === "bunch") return { value: p.pricePerUnit, per: "/ bunch" };
    return { value: p.pricePerUnit, per: "each" };
  }
  function defaultVariant(p) {
    if (p.unit === "kg")    return { variant: "1 kg", grams: 1000, price: priceForWeight(p, 1000) };
    if (p.unit === "bunch") return { variant: "per bunch", price: p.pricePerUnit };
    return { variant: "each", price: p.pricePerUnit };
  }

  const FV = window.FV = {
    data: D, icon: (n) => I[n] || "", payMark: (k) => PAY[k] || "", payMarks: PAY_MARKS,
    money, weightOptions, weightLabel, priceForWeight, cardPrice, defaultVariant,
    img: (slug) => D.IMG + slug + ".jpg",
    thumb: (slug) => D.IMG + "sm/" + slug + ".jpg",
    // Resolve an image that may be a slug (catalog photo) OR a full URL/dataURL (admin-added)
    imgSrc: (s) => /^(https?:|data:|\/)/.test(s || "") ? s : D.IMG + s + ".jpg",
    isCustomImg: (s) => /^(https?:|data:|\/)/.test(s || ""),
    find: (slug) => D.products.find((p) => p.slug === slug),
    findBox: (slug) => D.boxes.find((b) => b.slug === slug),
    byCategory: (c) => D.products.filter((p) => p.category === c),
    byCollection: (c) => {
      // Smart collections — resolved from product data so new categories need no data churn
      if (c === "premium") return D.products.filter((p) => (p.pricePerKg >= 110 || p.pricePerUnit >= 130) && (p.rating || 0) >= 4.7);
      if (c === "organic") return D.products.filter((p) => (p.badges || []).includes("organic") || (p.collections || []).includes("organic-reserve"));
      return D.products.filter((p) => (p.collections || []).includes(c));
    },
  };

  /* ------------------------------------------------------------------ *
   * Stores (localStorage)
   * ------------------------------------------------------------------ */
  const store = {
    get(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };
  let cart = store.get("fv_cart", []);
  let wish = store.get("fv_wish", []);

  function saveCart() { store.set("fv_cart", cart); updateCartUI(); }
  function saveWish() { store.set("fv_wish", wish); updateWishUI(); }

  FV.cart = {
    items: () => cart,
    count: () => cart.reduce((s, i) => s + i.qty, 0),
    subtotal: () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    add(item) {
      const key = item.key;
      const ex = cart.find((i) => i.key === key);
      if (ex) ex.qty += item.qty || 1; else cart.push(Object.assign({ qty: 1 }, item));
      saveCart();
    },
    setQty(key, qty) {
      const it = cart.find((i) => i.key === key);
      if (!it) return;
      it.qty = Math.max(1, qty);
      saveCart();
    },
    remove(key) { cart = cart.filter((i) => i.key !== key); saveCart(); },
    clear() { cart = []; saveCart(); },
  };
  FV.wish = {
    items: () => wish,
    has: (slug) => wish.includes(slug),
    toggle(slug) {
      if (wish.includes(slug)) wish = wish.filter((s) => s !== slug);
      else wish.unshift(slug);
      saveWish();
      return wish.includes(slug);
    },
  };
  FV.recent = {
    list: () => store.get("fv_recent", []),
    push(slug) {
      let r = store.get("fv_recent", []).filter((s) => s !== slug);
      r.unshift(slug);
      store.set("fv_recent", r.slice(0, 10));
    },
  };
  // Deterministic 70–88% "claimed" figure per slug — stable, not fake-precise
  FV.scarcityPct = (slug) => {
    let h = 0; for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    return 70 + (h % 19);
  };

  /* Store rules + order/client capture (feeds the admin dashboard) */
  FV.settings = ADMIN.settings;
  // Strip angle brackets from customer-entered strings so they can never
  // become markup when the admin later renders them (stored-XSS defence).
  const _clean = (s) => typeof s === "string" ? s.replace(/[<>]/g, "").slice(0, 200) : s;
  FV.orders = {
    all: () => _ag(_AK.orders, []),
    record(order) {
      if (order && order.customer) { ["name", "email", "phone", "area", "id"].forEach((k) => order.customer[k] = _clean(order.customer[k])); }
      if (order) order.address = _clean(order.address);
      const o = _ag(_AK.orders, []); o.unshift(order); _as(_AK.orders, o); return order;
    },
  };
  FV.clients = {
    all: () => _ag(_AK.clients, []),
    upsert(c) {
      if (!c || !c.email) return;
      const name = _clean(c.name), phone = _clean(c.phone), area = _clean(c.area), email = _clean(c.email);
      const list = _ag(_AK.clients, []);
      let r = list.find((x) => x.email === email);
      if (r) { r.name = name || r.name; r.phone = phone || r.phone; r.area = area || r.area; }
      else list.push({ id: "C" + String(Date.now()).slice(-6), name: name || email.split("@")[0], email, phone: phone || "", area: area || "", joined: new Date().toISOString(), status: c.status || "active" });
      _as(_AK.clients, list);
    },
  };

  /* Optional live backend — auto-detected. Used by checkout to place real,
     cross-device orders. Falls back to the localStorage demo when offline. */
  FV.api = {
    base: (window.FV_CONFIG && window.FV_CONFIG.apiBase) || "/api",
    _up: null,
    async up() {
      if (FV.api._up != null) return FV.api._up;
      try {
        const c = new AbortController(); const t = setTimeout(() => c.abort(), 3000);
        const h = await fetch(FV.api.base + "/health", { cache: "no-store", signal: c.signal }).finally(() => clearTimeout(t));
        FV.api._up = h.ok;
      } catch { FV.api._up = false; }
      return FV.api._up;
    },
    async checkout(order) {
      const res = await fetch(FV.api.base + "/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
      if (!res.ok) { let e = {}; try { e = await res.json(); } catch {} throw new Error(e.error || ("HTTP " + res.status)); }
      return res.json();
    },
  };

  /* Designed, printable receipt for the customer (account & confirmation) */
  function receiptDoc(o, embedded) {
    const cur = ADMIN.settings.currency, store = ADMIN.settings.storeName;
    const m = (n) => cur + " " + Math.round(n || 0).toLocaleString("en-US");
    const date = new Date(o.date);
    const logoUrl = new URL("assets/img/logo-cream.png", location.href).href;
    const rows = o.items.map((it) => `<tr><td><div class="ri-n">${it.name}</div><div class="ri-v">${it.variant || ""}</div></td><td class="c">${it.qty}</td><td class="r b">${m(it.price * it.qty)}</td></tr>`).join("");
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receipt ${o.id} · ${store}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{font-family:"Hanken Grotesk",system-ui,sans-serif;background:#EDE7DA;color:#1B2620;padding:28px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rc{max-width:600px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px -30px rgba(10,26,17,.4)}
.h{background:#10261D;color:#F6F1E8;padding:24px 30px;display:flex;justify-content:space-between;align-items:flex-start}
.h .b{display:flex;flex-direction:column;gap:6px}.h .lg-img{height:28px;width:auto}
.h h1{font-family:"Fraunces",serif;font-size:20px}.h p{font-size:11px;color:#B7B3A4}.h .m{text-align:right}.h .lab{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#C89B5C;font-weight:700}.h .id{font-family:"Fraunces",serif;font-size:18px}.h .dt{font-size:12px;color:#B7B3A4}
.bd{padding:26px 30px}.pt{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding-bottom:20px;border-bottom:1px solid #E8E2D6}.pt .lab{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8B978D;font-weight:700;margin-bottom:4px}.pt strong{font-size:14px;display:block}.pt span{font-size:12px;color:#5C6B61;display:block;line-height:1.5}
table{width:100%;border-collapse:collapse;margin:20px 0}th{text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8B978D;font-weight:700;padding:0 0 10px;border-bottom:1px solid #E8E2D6}th.c,td.c{text-align:center}th.r,td.r{text-align:right}td{padding:11px 0;border-bottom:1px solid #F0EBE0;font-size:14px}.ri-n{font-weight:600}.ri-v{font-size:12px;color:#8B978D}td.b{font-weight:700}
.tot{margin-left:auto;width:240px;margin-top:16px}.tot .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px;color:#5C6B61}.tot .g{border-top:2px solid #10261D;margin-top:6px;padding-top:11px;font-family:"Fraunces",serif;font-size:19px;color:#10261D;font-weight:600}
.ft{text-align:center;padding:22px 30px 28px;border-top:1px solid #E8E2D6;color:#8B978D;font-size:12px}.ft .ty{font-family:"Fraunces",serif;font-size:16px;color:#10261D;margin-bottom:5px}
.ac{max-width:600px;margin:16px auto 0;display:flex;gap:10px;justify-content:center}.ac button{font:inherit;font-weight:600;font-size:14px;padding:11px 22px;border-radius:11px;border:none;cursor:pointer}.ac .p{background:#10261D;color:#fff}.ac .c{background:#fff;border:1px solid #E8E2D6;color:#1B2620}
@page{size:A5;margin:9mm}@media print{body{background:#fff;padding:0}.rc{box-shadow:none;border-radius:0;max-width:100%}.ac{display:none}.h{padding:18px 22px}.bd{padding:20px 22px}.ft{padding:16px 22px 18px}}</style></head><body>
<div class="rc"><div class="h"><div class="b"><img class="lg-img" src="${logoUrl}" alt="${store}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div style="display:none"><h1>${store}</h1></div><p>Export-grade produce · Cairo</p></div>
<div class="m"><div class="lab">Receipt</div><div class="id">${o.id}</div><div class="dt">${date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div></div></div>
<div class="bd"><div class="pt"><div><div class="lab">Billed to</div><strong>${o.customer.name}</strong><span>${o.customer.email}</span><span>${o.customer.phone || ""}</span></div>
<div><div class="lab">Deliver to</div><strong>${o.customer.area || ""}</strong><span>${o.address || ""}</span><span>${o.slot ? "Slot: " + o.slot : ""}</span></div></div>
<table><thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><div class="row"><span>Subtotal</span><span>${m(o.subtotal)}</span></div><div class="row"><span>Delivery</span><span>${o.delivery ? m(o.delivery) : "Free"}</span></div><div class="row g"><span>Total</span><span>${m(o.total)}</span></div></div></div>
<div class="ft"><div class="ty">Thank you for hosting with ${store}.</div><div>Payment: ${o.payment || "Prepaid"} · A confirmation of your order.</div></div></div>
${embedded ? "" : `<div class="ac"><button class="c" onclick="window.close()">Close</button><button class="p" onclick="window.print()">Print / Save as PDF</button></div>`}</body></html>`;
  }
  FV.receipt = {
    // In-page overlay + iframe (no pop-up blockers) with Print / Save-as-PDF + download
    open(o) {
      let ov = document.getElementById("fvRcOverlay"); if (ov) ov.remove();
      ov = document.createElement("div"); ov.id = "fvRcOverlay";
      ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(10,26,17,.6);display:flex;flex-direction:column;align-items:center;padding:20px;overflow:auto";
      ov.innerHTML = `<div style="width:100%;max-width:640px;display:flex;gap:.5rem;justify-content:flex-end;margin-bottom:10px">
          <button class="btn btn--sm" id="fvRcClose" style="--bg:#fff;--fg:var(--forest);--bd:#fff">Close</button>
          <button class="btn btn--brass btn--sm" id="fvRcPrint">Save as PDF</button></div>
        <iframe id="fvRcFrame" title="Receipt" style="width:100%;max-width:640px;height:80vh;border:0;border-radius:14px;background:#fff;box-shadow:0 30px 70px -30px rgba(0,0,0,.6)"></iframe>`;
      document.body.appendChild(ov);
      const f = ov.querySelector("#fvRcFrame"); f.srcdoc = receiptDoc(o, true);
      ov.querySelector("#fvRcPrint").onclick = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} };
      ov.querySelector("#fvRcClose").onclick = () => ov.remove();
      ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
    },
    download(o) { const b = new Blob([receiptDoc(o)], { type: "text/html;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "receipt-" + o.id + ".html"; document.body.appendChild(a); a.click(); a.remove(); },
  };

  /* Quick add a product (default variant) */
  FV.quickAdd = function (slug) {
    const p = FV.find(slug); if (!p) return;
    const dv = defaultVariant(p);
    FV.cart.add({
      key: slug + "|" + dv.variant, slug, type: "product",
      name: p.name, image: FV.isCustomImg(p.image) ? p.image : p.slug, noPhoto: !!p.noPhoto,
      variant: dv.variant, price: dv.price,
    });
    toast(`${p.name} added`, dv.variant);
    openCart();
  };
  FV.addBox = function (slug, tierLabel) {
    const b = FV.findBox(slug); if (!b) return;
    const tier = b.tiers.find((t) => t.label === tierLabel) || b.tiers[0];
    FV.cart.add({
      key: slug + "|" + tier.label, slug, type: "box",
      name: b.name, image: b.image, variant: tier.label, price: tier.price,
    });
    toast(`${b.name} added`, tier.label);
    openCart();
  };

  /* ------------------------------------------------------------------ *
   * Shell — announcement, header, footer, drawers, toast host
   * ------------------------------------------------------------------ */
  const NAV = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "hosting.html", label: "The Art of Hosting", key: "hosting" },
    { href: "products.html", label: "Products", key: "products" },
  ];

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }

  function buildHeader() {
    const page = document.body.dataset.page || "";
    const navHtml = NAV.map((n) => `<li><a href="${n.href}" ${n.key === page ? 'aria-current="page"' : ""}>${n.label}</a></li>`).join("");
    return `
    <header class="site-header" id="siteHeader">
      <div class="header-inner">
        <a class="brand" href="index.html" aria-label="Fresh Valley — home">
          <img class="logo logo--dark" src="assets/img/logo.png" alt="Fresh Valley" onerror="this.style.display='none';this.parentNode.querySelector('.brand-fallback').style.display='inline'">
          <img class="logo logo--light" src="assets/img/logo-cream.png" alt="" aria-hidden="true">
          <span class="brand-fallback" style="display:none">Fresh Valley</span>
        </a>
        <a class="h-greet" href="index.html" aria-label="Fresh Valley — home">
          <span class="h-avatar"><img src="assets/img/icon-192.png" alt=""></span>
          <span><span class="gl1">${greeting()}!</span><br><span class="gl2">Fresh Valley</span></span>
        </a>
        <nav class="main-nav" aria-label="Primary"><ul>${navHtml}</ul></nav>
        <div class="header-actions">
          <a class="icon-btn" href="account.html" aria-label="Account">${I.user}</a>
          <a class="icon-btn" href="wishlist.html" aria-label="Wishlist" id="wishLink">${I.heart}<span class="count" id="wishCount">0</span></a>
          <button class="icon-btn" id="cartBtn" aria-label="Cart">${I.bag}<span class="count" id="cartCount">0</span></button>
          <button class="icon-btn icon-btn--search" id="searchBtn" aria-label="Search">${I.search}</button>
          <a class="icon-btn icon-btn--admin" href="admin/login.html" aria-label="Admin console" title="Admin / Staff login">${I.gear}</a>
        </div>
      </div>
    </header>`;
  }

  function buildFooter() {
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-cta">
          <div class="inner">
            <div>
              <p class="eyebrow">The Fresh Valley Letter</p>
              <h2 data-fv="footer_news_title">Eat with the season.<br>Host a little better.</h2>
            </div>
            <div>
              <p class="muted" style="color:var(--on-dark-muted)">A quiet note each month — what is at its peak, a recipe worth keeping, and an idea for your next table. No noise.</p>
              <form class="newsletter-form" data-newsletter>
                <input class="input" type="email" required placeholder="Your email address" aria-label="Email address">
                <button class="btn btn--brass" type="submit">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
        <div class="footer-grid">
          <div class="footer-brand">
            <span class="brand-fallback" style="font-family:var(--font-display);font-size:1.6rem">Fresh Valley</span>
            <p data-fv="footer_blurb">Export-grade produce, curated for modern hosting and a quieter kind of luxury. Grown well, graded by hand, delivered with care.</p>
          </div>
          <div class="footer-col">
            <h5>Shop</h5>
            <a href="products.html">All Produce</a>
            <a href="products.html?cat=boxes">Boxes</a>
            <a href="products.html?cat=seasonal">Seasonal</a>
            <a href="products.html?cat=organic-reserve">Organic Reserve</a>
            <a href="products.html?collection=best-sellers">Best Sellers</a>
          </div>
          <div class="footer-col">
            <h5>The Brand</h5>
            <a href="about.html">About Us</a>
            <a href="hosting.html">The Art of Hosting</a>
            <a href="journal.html">Journal</a>
            <a href="about.html#quality">Behind the Quality</a>
          </div>
          <div class="footer-col">
            <h5>Care</h5>
            <a href="contact.html">Contact</a>
            <a href="policies.html">Company Policies</a>
            <a href="terms.html">Terms of Use</a>
            <a href="contact.html#areas">Delivery Areas</a>
          </div>
          <div class="footer-col">
            <h5>Account</h5>
            <a href="account.html">My Account</a>
            <a href="account.html#orders">Orders</a>
            <a href="wishlist.html">Wishlist</a>
            <a href="account.html#subscriptions">Subscriptions</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Fresh Valley. Cairo, Egypt. All rights reserved.</span>
          <div class="pay-row" aria-label="Accepted payment methods">${PAY_MARKS}</div>
          <div class="social-row">
            <a href="#" aria-label="Instagram">${I.instagram}</a>
            <a href="#" aria-label="Facebook">${I.facebook}</a>
            <a href="#" aria-label="TikTok">${I.tiktok}</a>
          </div>
        </div>
      </div>
    </footer>`;
  }

  function buildDrawers() {
    return `
    <div class="scrim" id="scrim"></div>

    <aside class="drawer drawer--left" id="navDrawer" aria-label="Menu" aria-hidden="true">
      <div class="drawer-head">
        <span class="brand-fallback" style="font-family:var(--font-display);font-size:1.4rem;color:var(--forest)">Fresh Valley</span>
        <button class="icon-btn" data-close aria-label="Close menu">${I.close}</button>
      </div>
      <div class="drawer-body">
        <nav class="mobile-nav" aria-label="Mobile">
          ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
          <a href="about.html">About</a>
          <a href="journal.html">Journal</a>
          <a href="contact.html">Contact</a>
        </nav>
      </div>
      <div class="drawer-foot">
        <a class="btn btn--block" href="products.html">Shop all produce ${I.arrow}</a>
      </div>
    </aside>

    <aside class="drawer" id="cartDrawer" aria-label="Cart" aria-hidden="true">
      <div class="drawer-head">
        <h3>Your Selection</h3>
        <button class="icon-btn" data-close aria-label="Close cart">${I.close}</button>
      </div>
      <div class="drawer-body" id="cartBody"></div>
      <div class="drawer-foot" id="cartFoot"></div>
    </aside>

    <div class="search-overlay" id="searchOverlay" aria-hidden="true">
      <div class="search-panel">
        <div class="search-bar">
          ${I.search}
          <input type="search" id="searchInput" placeholder="Search produce, boxes, herbs…" aria-label="Search" autocomplete="off">
          <button class="icon-btn" data-close aria-label="Close search">${I.close}</button>
        </div>
        <div class="search-results" id="searchResults"></div>
      </div>
    </div>

    <div class="toast-wrap" id="toastWrap" aria-live="polite"></div>

    <nav class="app-bar" aria-label="App navigation">
      <a href="index.html" data-ab="home">${I.home}<span>Home</span></a>
      <a href="products.html" data-ab="products">${I.grid}<span>Shop</span></a>
      <button id="abCart" class="ab-center" aria-label="Cart">${I.bag}<span class="ab-count" id="abCartCount">0</span></button>
      <a href="wishlist.html" data-ab="wishlist">${I.heart}<span>Saved</span></a>
      <a href="account.html" data-ab="account">${I.user}<span>Account</span></a>
    </nav>`;
  }

  /* ------------------------------------------------------------------ *
   * Drawer / overlay control
   * ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  let openPanel = null;

  function lockScroll(on) { document.body.classList.toggle("no-scroll", on); }
  function closeAll() {
    $("#scrim")?.classList.remove("open");
    $$(".drawer").forEach((d) => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
    $("#searchOverlay")?.classList.remove("open");
    lockScroll(false); openPanel = null;
  }
  function openCart() {
    renderCartDrawer();
    $("#scrim").classList.add("open");
    const d = $("#cartDrawer"); d.classList.add("open"); d.setAttribute("aria-hidden", "false");
    lockScroll(true); openPanel = "cart";
  }
  function openNav() {
    $("#scrim").classList.add("open");
    const d = $("#navDrawer"); d.classList.add("open"); d.setAttribute("aria-hidden", "false");
    lockScroll(true); openPanel = "nav";
  }
  function openSearch() {
    const o = $("#searchOverlay"); o.classList.add("open"); o.setAttribute("aria-hidden", "false");
    lockScroll(true); openPanel = "search";
    setTimeout(() => $("#searchInput").focus(), 60);
  }
  FV.openCart = openCart;

  /* ------------------------------------------------------------------ *
   * Cart UI
   * ------------------------------------------------------------------ */
  function lineImage(it) {
    if (it.noPhoto) return `<div class="c-media" style="display:grid;place-items:center;background:var(--forest);color:var(--brass)">${I.leaf2}</div>`;
    return `<div class="c-media"><img src="${FV.imgSrc(it.image)}" alt="" loading="lazy"></div>`;
  }
  function renderCartDrawer() {
    const body = $("#cartBody"), foot = $("#cartFoot");
    if (!cart.length) {
      body.innerHTML = `<div class="empty-state">${I.bag}<p style="margin-top:.5rem">Your selection is empty.</p><a class="btn btn--outline btn--sm mt-md" href="products.html" style="margin-top:1rem">Browse produce</a></div>`;
      foot.innerHTML = ""; return;
    }
    body.innerHTML = cart.map((it) => `
      <div class="cart-line">
        ${lineImage(it)}
        <div>
          <div class="c-name">${it.name}</div>
          <div class="c-var">${it.variant}</div>
          <div class="qty" style="margin-top:.5rem;transform:scale(.86);transform-origin:left">
            <button data-dec="${it.key}" aria-label="Decrease">${I.minus}</button>
            <input value="${it.qty}" readonly aria-label="Quantity">
            <button data-inc="${it.key}" aria-label="Increase">${I.plus}</button>
          </div>
          <button class="c-remove" data-rm="${it.key}">Remove</button>
        </div>
        <div class="c-price">${money(it.price * it.qty)}</div>
      </div>`).join("");

    const sub = FV.cart.subtotal();
    const freeAt = ADMIN.settings.freeThreshold, remain = Math.max(0, freeAt - sub);
    foot.innerHTML = `
      ${remain > 0
        ? `<p style="font-size:var(--step--2);color:var(--text-muted);margin-bottom:.6rem">Add <strong>${money(remain)}</strong> more for complimentary delivery.</p>`
        : `<p style="font-size:var(--step--2);color:var(--forest-mid);margin-bottom:.6rem">${I.check} You've earned complimentary delivery.</p>`}
      <div class="sum-row"><span class="muted">Subtotal</span><span>${money(sub)}</span></div>
      <div class="sum-row"><span class="muted">Delivery</span><span>${remain > 0 ? "Calculated at checkout" : "Free"}</span></div>
      <a class="btn btn--block btn--lg" href="checkout.html" style="margin-top:1rem">Checkout ${I.arrow}</a>
      <a class="btn btn--ghost-light btn--block btn--sm" href="cart.html" style="margin-top:.6rem;--fg:var(--forest);--bd:var(--line)">View full cart</a>`;
  }

  function updateCartUI() {
    const c = FV.cart.count();
    const el = $("#cartCount");
    if (el) { el.textContent = c; el.classList.toggle("show", c > 0); }
    const ab = $("#abCartCount");
    if (ab) { ab.textContent = c; ab.classList.toggle("show", c > 0); }
    if (openPanel === "cart") renderCartDrawer();
    document.dispatchEvent(new CustomEvent("fv:cart"));
  }
  function updateWishUI() {
    const c = wish.length;
    const el = $("#wishCount");
    if (el) { el.textContent = c; el.classList.toggle("show", c > 0); }
    $$(".wish-btn").forEach((b) => {
      const on = FV.wish.has(b.dataset.wish);
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on);
    });
    document.dispatchEvent(new CustomEvent("fv:wish"));
  }
  FV.updateWishUI = updateWishUI;

  /* ------------------------------------------------------------------ *
   * Toast
   * ------------------------------------------------------------------ */
  function toast(msg, sub) {
    const w = $("#toastWrap"); if (!w) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `${I.check}<span>${msg}${sub ? ` · <span style="opacity:.8">${sub}</span>` : ""} &nbsp;<a href="cart.html">View cart</a></span>`;
    w.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 500); }, 3400);
  }
  FV.toast = toast;

  /* ------------------------------------------------------------------ *
   * Search
   * ------------------------------------------------------------------ */
  function runSearch(q) {
    const res = $("#searchResults"); q = q.trim().toLowerCase();
    if (!q) { res.innerHTML = `<p class="search-hint">Try “strawberry”, “hosting box”, or “dates”.</p>`; return; }
    const ps = D.products.filter((p) => (p.name + " " + p.category + " " + p.short).toLowerCase().includes(q)).slice(0, 6);
    const bs = D.boxes.filter((b) => (b.name + " " + b.tagline).toLowerCase().includes(q)).slice(0, 3);
    if (!ps.length && !bs.length) { res.innerHTML = `<p class="search-hint">No matches for “${q}”. Try another word.</p>`; return; }
    res.innerHTML = [
      ...ps.map((p) => `<a class="search-row" href="product.html?slug=${p.slug}"><img src="${p.noPhoto ? "" : FV.img(p.slug)}" alt="" onerror="this.style.visibility='hidden'"><span><strong>${p.name}</strong><em>${p.category} · ${FV.money(FV.cardPrice(p).value)} ${FV.cardPrice(p).per}</em></span></a>`),
      ...bs.map((b) => `<a class="search-row" href="product.html?box=${b.slug}"><img src="${FV.img(b.image)}" alt=""><span><strong>${b.name}</strong><em>box · from ${FV.money(b.tiers[0].price)}</em></span></a>`),
    ].join("");
  }

  /* ------------------------------------------------------------------ *
   * Reusable render helpers
   * ------------------------------------------------------------------ */
  function qualityBadge(p) {
    if ((p.badges || []).includes("export")) return `<span class="badge badge--export">Export-Grade</span>`;
    if ((p.badges || []).includes("organic")) return `<span class="badge badge--organic">Organic</span>`;
    return "";
  }
  function popTag(p) {
    if ((p.collections || []).includes("best-sellers")) return `<span class="badge badge--pop">${I.star} Bestseller</span>`;
    if ((p.badges || []).includes("seasonal")) return `<span class="badge badge--seasonal">In season</span>`;
    return "";
  }
  const cardTags = (p) => `<div class="card-tags">${qualityBadge(p)}${popTag(p)}</div>`;
  const ratingRow = (p) => `<span class="p-rating">${I.star} ${p.rating.toFixed(1)} <span class="rc">(${p.reviews})</span></span>`;

  function cardMedia(p) {
    if (p.noPhoto) {
      return `<div class="media media--herb"><div class="herb-art">${I.leaf2}<span>${p.name}</span></div>
        ${cardTags(p)}
        <button class="wish-btn" data-wish="${p.slug}" aria-label="Save ${p.name}" aria-pressed="false">${I.heart}</button></div>`;
    }
    const imgTag = FV.isCustomImg(p.image)
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy" width="540" height="540">`
      : `<img src="${FV.thumb(p.slug)}" srcset="${FV.thumb(p.slug)} 540w, ${FV.img(p.slug)} 1000w" sizes="(max-width:640px) 48vw, (max-width:1100px) 30vw, 22vw" alt="${p.name}" loading="lazy" width="540" height="540">`;
    return `<div class="media">
        ${imgTag}
        ${cardTags(p)}
        <button class="wish-btn" data-wish="${p.slug}" aria-label="Save ${p.name}" aria-pressed="false">${I.heart}</button>
      </div>`;
  }
  FV.productCardHTML = function (p) {
    const cp = FV.cardPrice(p);
    return `<article class="product-card" data-reveal>
      ${cardMedia(p)}
      <div class="info">
        <div class="p-toprow"><span class="p-origin">${p.origin}</span>${ratingRow(p)}</div>
        <h3 class="p-name"><a href="product.html?slug=${p.slug}">${p.name}</a></h3>
        <div class="p-buy">
          <span class="p-price">${FV.money(cp.value)} <span class="per">${cp.per}</span></span>
          <button class="p-add" data-add="${p.slug}" aria-label="Add ${p.name} to cart">${I.plus}</button>
        </div>
      </div>
    </article>`;
  };
  FV.boxCardHTML = function (b) {
    const from = Math.min(...b.tiers.map((t) => t.price));
    const tag = b.slug === "hosting-box" ? "Most gifted" : ((b.collections || []).includes("best-sellers") ? "Bestseller" : ((b.collections || []).includes("seasonal") ? "Limited" : ""));
    return `<article class="box-card" data-reveal>
      <a class="media" href="product.html?box=${b.slug}">
        <img src="${FV.thumb(b.image)}" srcset="${FV.thumb(b.image)} 540w, ${FV.img(b.image)} 1000w" sizes="(max-width:860px) 90vw, 32vw" alt="${b.name}" loading="lazy" width="540" height="405">
        ${tag ? `<span class="badge badge--pop b-tag">${I.star} ${tag}</span>` : ""}
      </a>
      <div class="b-body">
        <h3 class="b-name">${b.name}</h3>
        <p class="b-desc">${b.tagline}</p>
        <div class="b-foot">
          <div class="b-price"><span class="from">From</span>${FV.money(from)}</div>
          <a class="btn btn--brass btn--sm" href="product.html?box=${b.slug}">Explore</a>
        </div>
      </div>
    </article>`;
  };
  FV.reviewCardHTML = function (r) {
    const initials = r.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    return `<article class="review-card" data-reveal>
      <div class="stars" aria-label="${r.stars} out of 5">${I.star.repeat(r.stars)}</div>
      <p class="quote">“${r.text}”</p>
      <div class="r-author">
        <div class="r-avatar">${initials}</div>
        <div><div class="r-name">${r.name}</div><div class="r-meta">${r.area} · ${r.tag}</div></div>
      </div>
    </article>`;
  };
  FV.articleCardHTML = function (a) {
    return `<article class="article-card" data-reveal>
      <a class="media" href="article.html?slug=${a.slug}"><img src="${FV.img(a.image)}" alt="${a.title}" loading="lazy"></a>
      <span class="a-cat">${a.category}</span>
      <h3><a class="stretch" href="article.html?slug=${a.slug}">${a.title}</a></h3>
      <p class="muted" style="font-size:var(--step--1)">${a.excerpt}</p>
      <span class="a-meta">${a.date} · ${a.read}</span>
    </article>`;
  };

  /* ------------------------------------------------------------------ *
   * Motion — reveal on scroll
   * ------------------------------------------------------------------ */
  function observeReveals(root = document) {
    const els = $$("[data-reveal]:not(.in)", root);
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }
  FV.observeReveals = observeReveals;

  /* Bind a horizontal product rail to prev/next buttons (scroll-snap slider) */
  FV.bindRail = function (rail, prev, next) {
    if (!rail || !prev || !next) return;
    const step = () => Math.max(rail.clientWidth * 0.85, 260);
    const update = () => {
      prev.disabled = rail.scrollLeft < 10;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 10;
    };
    prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  };

  /* Count-up numbers on scroll ([data-count] with optional data-dec/suffix/prefix) */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const suffix = el.dataset.suffix || "", prefix = el.dataset.prefix || "", dur = 1500, t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = target * e;
      el.textContent = prefix + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function observeCounts(root = document) {
    const els = $$("[data-count]:not(.counted)", root);
    if (!els.length || !("IntersectionObserver" in window)) { els.forEach(animateCount); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("counted"); animateCount(e.target); io.unobserve(e.target); }
    }), { threshold: 0.5 });
    els.forEach((e) => io.observe(e));
  }
  FV.observeCounts = observeCounts;

  /* Delivery-cutoff helper — "5h 12m" until the 6pm next-day cutoff */
  FV.cutoffText = function () {
    const now = new Date(), cut = new Date(now); cut.setHours(18, 0, 0, 0);
    if (now >= cut) cut.setDate(cut.getDate() + 1);
    const d = cut - now, h = Math.floor(d / 3.6e6), m = Math.floor((d % 3.6e6) / 6e4);
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  /* Splash — app-launch moment, once per session */
  function splash() {
    if (sessionStorage.getItem("fv_splash")) return;
    sessionStorage.setItem("fv_splash", "1");
    const el = document.createElement("div");
    el.id = "fvSplash";
    el.innerHTML = `<div class="sp-inner"><img src="assets/img/logo.png" alt="Fresh Valley"><span class="sp-bar"><i></i></span></div>`;
    document.body.appendChild(el);
    document.body.classList.add("no-scroll");
    const t0 = performance.now();
    const hide = () => {
      const wait = Math.max(0, 1000 - (performance.now() - t0));
      setTimeout(() => {
        el.classList.add("done");
        document.body.classList.remove("no-scroll");
        setTimeout(() => el.remove(), 650);
      }, wait);
    };
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });
  }

  /* Live social proof — subtle recent-order cards (bottom-left) */
  function startSocialProof() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const names = D.reviews.map((r) => ({ name: r.name.split(" ")[0], area: r.area }));
    const items = D.products.filter((p) => (p.collections || []).some((c) => c === "best-sellers" || c === "hosting"))
      .map((p) => p.name).concat(D.boxes.map((b) => b.name));
    const wrap = document.createElement("div"); wrap.className = "sp-feed"; document.body.appendChild(wrap);
    const pop = () => {
      const n = names[(Math.random() * names.length) | 0], it = items[(Math.random() * items.length) | 0], mins = ((Math.random() * 11) | 0) + 2;
      const el = document.createElement("div"); el.className = "sp-card";
      el.innerHTML = `<span class="sp-dot"></span><div class="sp-body"><strong>${n.name}</strong> in ${n.area}<br><span>ordered ${it} · ${mins} min ago</span></div>`;
      wrap.appendChild(el);
      requestAnimationFrame(() => el.classList.add("in"));
      setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 500); }, 5200);
    };
    (function loop() { setTimeout(() => { pop(); loop(); }, 11000 + Math.random() * 9000); })();
    setTimeout(pop, 8000);
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */
  function wire() {
    // header scroll state
    const header = $("#siteHeader");
    if (document.body.dataset.hero === "true") header.classList.add("transparent");
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

    // buttons
    $("#cartBtn")?.addEventListener("click", openCart);
    $("#abCart")?.addEventListener("click", openCart);
    // app-bar active tab
    const pg = document.body.dataset.page || "";
    $$(".app-bar [data-ab]").forEach((a) => a.setAttribute("aria-current", a.dataset.ab === pg));
    $("#menuBtn")?.addEventListener("click", openNav);
    $("#searchBtn")?.addEventListener("click", openSearch);
    $("#scrim")?.addEventListener("click", closeAll);
    $$("[data-close]").forEach((b) => b.addEventListener("click", closeAll));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

    // search input
    const si = $("#searchInput");
    si?.addEventListener("input", (e) => runSearch(e.target.value));
    runSearch("");

    // delegated clicks: add / wishlist / qty
    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add]");
      if (add) { e.preventDefault(); FV.quickAdd(add.dataset.add); return; }
      const w = e.target.closest("[data-wish]");
      if (w) { e.preventDefault(); const on = FV.wish.toggle(w.dataset.wish); if (on) toast("Saved to wishlist"); return; }
      const dec = e.target.closest("[data-dec]");
      if (dec) { const it = cart.find((i) => i.key === dec.dataset.dec); if (it) FV.cart.setQty(it.key, it.qty - 1); return; }
      const inc = e.target.closest("[data-inc]");
      if (inc) { const it = cart.find((i) => i.key === inc.dataset.inc); if (it) FV.cart.setQty(it.key, it.qty + 1); return; }
      const rm = e.target.closest("[data-rm]");
      if (rm) { FV.cart.remove(rm.dataset.rm); return; }
    });

    // newsletter
    $$("[data-newsletter]").forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault(); f.reset(); toast("Thank you — you're on the list.");
    }));

    updateCartUI(); updateWishUI(); observeReveals(); observeCounts();
    splash(); startSocialProof();
  }

  /* ------------------------------------------------------------------ *
   * Apply admin content — store name, hero copy, section toggles,
   * announcement bar & store-closed notice. Runs after the shell mounts.
   * ------------------------------------------------------------------ */
  function applyContent() {
    const c = ADMIN.content || {}, s = ADMIN.settings;

    // Store name across header, footer & title
    if (s.storeName && s.storeName !== "Fresh Valley") {
      $$(".brand-fallback").forEach((el) => el.textContent = s.storeName);
      const gl2 = $(".gl2"); if (gl2) gl2.textContent = s.storeName;
      document.title = document.title.replace(/Fresh Valley/g, s.storeName);
    }

    // Editable copy hooks: any [data-fv="key"] gets its text from content[key]
    $$("[data-fv]").forEach((el) => { const k = el.dataset.fv; if (c[k]) el.textContent = c[k]; });

    // Section visibility: [data-fv-section="key"] hidden when sec_key === false
    $$("[data-fv-section]").forEach((el) => { if (c["sec_" + el.dataset.fvSection] === false) el.style.display = "none"; });

    // Section order: reorder the [data-fv-section] blocks in place (keeps non-section siblings put)
    if (Array.isArray(c.sec_order) && c.sec_order.length) {
      const secs = $$("[data-fv-section]");
      if (secs.length) {
        const slots = secs.map((s) => { const ph = document.createComment("fv-slot"); s.parentNode.insertBefore(ph, s); return ph; });
        const byKey = {}; secs.forEach((s) => { byKey[s.dataset.fvSection] = s; });
        const ordered = c.sec_order.map((k) => byKey[k]).filter(Boolean).concat(secs.filter((s) => c.sec_order.indexOf(s.dataset.fvSection) < 0));
        slots.forEach((ph, i) => { if (ordered[i]) ph.parentNode.insertBefore(ordered[i], ph); ph.remove(); });
      }
    }

    // Banner image overrides: replace any /banners/<key>.<ext> img + [data-fv-img] hooks
    const imgs = _ag(_AK.images, {});
    if (Object.keys(imgs).length) {
      $$("img").forEach((img) => {
        const k = img.getAttribute("data-fv-img");
        if (k && imgs[k]) { img.src = imgs[k]; img.removeAttribute("srcset"); return; }
        const m = (img.getAttribute("src") || "").match(/\/banners\/([a-z0-9-]+)\.(?:jpe?g|png|webp)/i);
        if (m && imgs[m[1]]) { img.src = imgs[m[1]]; img.removeAttribute("srcset"); }
      });
    }

    // Store closed → full maintenance screen for customers (the /admin area is separate & still reachable)
    if (s.storeOpen === false) { showMaintenance(s); return; }

    // Announcement bar (header offset auto-measured). textContent — never innerHTML — to avoid injection.
    if (c.announce_on && c.announce_text) {
      const wrap = document.createElement("div"); wrap.id = "fvTopBars";
      wrap.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:200";
      const bar = document.createElement("div");
      bar.style.cssText = "background:var(--forest);color:var(--cream);text-align:center;font-size:var(--step--2);font-weight:500;padding:.5rem 1rem;line-height:1.3";
      bar.textContent = c.announce_text;
      wrap.appendChild(bar);
      document.body.appendChild(wrap);
      requestAnimationFrame(() => {
        const h = wrap.offsetHeight;
        const hdr = $("#siteHeader"); if (hdr) hdr.style.top = h + "px";
        document.body.style.paddingTop = h + "px";
      });
    }
  }

  /* Full-screen, on-brand maintenance screen when the store is switched off */
  function showMaintenance(s) {
    document.body.classList.add("no-scroll");
    const el = document.createElement("div");
    el.id = "fvMaintenance";
    el.style.cssText = "position:fixed;inset:0;z-index:9999;display:grid;place-items:center;text-align:center;padding:2rem;background:radial-gradient(130% 100% at 50% 0,var(--forest-mid),var(--ink));color:var(--cream)";
    el.innerHTML = `<div style="max-width:580px">
      <img src="assets/img/logo-cream.png" alt="${s.storeName}" style="height:62px;width:auto;margin:0 auto 2.2rem" onerror="this.style.display='none'">
      <p style="font-size:var(--step--1);letter-spacing:.2em;text-transform:uppercase;color:var(--brass);margin-bottom:1rem">We'll be right back</p>
      <h1 style="font-family:var(--font-display);font-size:var(--step-5);line-height:1.05;color:var(--cream);margin-bottom:1.2rem">We're tidying the shelves.</h1>
      <p style="font-size:var(--step-0);color:rgba(244,239,228,.82);max-width:46ch;margin:0 auto 2.2rem;line-height:1.6">${s.storeName} is briefly closed for maintenance. We're making everything fresher and will reopen very soon — thank you for your patience.</p>
      <a href="admin/login.html" style="font-size:var(--step--1);color:var(--brass);text-decoration:underline;text-underline-offset:3px">Staff sign in</a>
    </div>`;
    document.body.appendChild(el);
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    // Inject favicon + PWA app meta once (kept in one place rather than every page head)
    if (!document.querySelector('link[rel="icon"]')) {
      const add = (tag, attrs) => { const el = document.createElement(tag); Object.assign(el, attrs); document.head.appendChild(el); };
      add("link", { rel: "icon", type: "image/svg+xml", href: "assets/img/favicon.svg" });
      add("link", { rel: "manifest", href: "manifest.webmanifest" });
      add("link", { rel: "apple-touch-icon", href: "assets/img/icon-192.png" });
      const m1 = document.createElement("meta"); m1.name = "apple-mobile-web-app-capable"; m1.content = "yes"; document.head.appendChild(m1);
      const m2 = document.createElement("meta"); m2.name = "apple-mobile-web-app-status-bar-style"; m2.content = "black-translucent"; document.head.appendChild(m2);
      const m3 = document.createElement("meta"); m3.name = "mobile-web-app-capable"; m3.content = "yes"; document.head.appendChild(m3);
    }
    const head = document.getElementById("fv-header");
    const foot = document.getElementById("fv-footer");
    if (head) head.innerHTML = buildHeader();
    if (foot) foot.innerHTML = buildFooter();
    document.body.insertAdjacentHTML("beforeend", buildDrawers());
    wire();
    applyContent();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
