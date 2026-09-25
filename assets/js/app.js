/* =====================================================================
   FRESH VALLEY — Application engine v4
   Shared by every storefront page: catalog overrides from the admin,
   pricing, cart / wishlist / recent stores, order + client capture,
   analytics events, the shell (announcement, header, menu, search, cart
   drawer, tab bar, footer), toasts and the reusable card renderers.
   Public API: window.FV (unchanged names from v3, extended).
   ===================================================================== */
(function () {
  "use strict";
  const D = window.FV_DATA;
  const THEME = window.FVTheme;
  const PUB = window.FV_CONTENT || {};
  // The admin loads this engine for pricing/cards/receipts: it keeps draft
  // products visible and never mounts the storefront shell or tracks visits.
  const ADMIN_MODE = !!window.FV_ADMIN;

  /* ------------------------------------------------------------------ *
   * Storage contract (shared with the admin)
   * ------------------------------------------------------------------ */
  const K = {
    orders: "fv_orders", clients: "fv_clients", catalog: "fv_catalog", settings: "fv_admin_settings",
    images: "fv_admin_images", discounts: "fv_admin_discounts", track: "fv_track",
    // v3 keys — still honoured so older edits are not lost
    prices: "fv_admin_prices", pmeta: "fv_admin_pmeta", custom: "fv_admin_custom",
  };
  function _ag(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (_) { return fb; } }
  function _as(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  const newest = (a, b) => (!a ? b : !b ? a : ((a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b));

  const SETTINGS = Object.assign(
    { storeName: "Fresh Valley", currency: "EGP", storeOpen: true, deliveryFee: 45, freeThreshold: 600, taxRate: 0, cutoffHour: 18, codEnabled: true, slots: ["Morning · 9–12", "Midday · 12–3", "Afternoon · 3–6", "Evening · 6–9"] },
    newest(PUB.settings, _ag(K.settings, null)) || {}
  );

  /* Catalog overrides: newest of (published, this browser) + legacy keys */
  const CATALOG = (function () {
    const local = _ag(K.catalog, null);
    const legacy = { prices: _ag(K.prices, {}), pmeta: _ag(K.pmeta, {}), custom: _ag(K.custom, []) };
    const base = newest(PUB.catalog, local) || {};
    return {
      prices: Object.assign({}, legacy.prices, base.prices || {}),
      pmeta: Object.assign({}, legacy.pmeta, base.pmeta || {}),
      custom: (base.custom || []).concat(legacy.custom.filter((c) => !(base.custom || []).some((b) => b.slug === c.slug))),
      categories: base.categories || {},
      discounts: base.discounts || _ag(K.discounts, []),
      boxes: base.boxes || {},
    };
  })();
  (function applyCatalog() {
    if (!D) return;
    CATALOG.custom.forEach((c) => { if (c && c.slug && !D.products.some((p) => p.slug === c.slug)) D.products.push(c); });
    D.products.forEach((p) => {
      const pr = CATALOG.prices[p.slug];
      if (pr != null && pr !== "") { if (p.unit === "kg") p.pricePerKg = +pr; else p.pricePerUnit = +pr; }
      const m = CATALOG.pmeta[p.slug];
      if (m) ["name", "short", "desc", "origin", "season", "badges", "collections", "image", "compareAt", "stock", "storage", "featured", "category"].forEach((f) => { if (m[f] !== undefined && m[f] !== "") p[f] = m[f]; });
      if (p.image && /^(https?:|data:|\/|assets\/)/.test(p.image)) p.noPhoto = false;
    });
    D.products.forEach((p) => { const m = CATALOG.pmeta[p.slug]; p.status = m && (m.status || (m.active === false ? "draft" : "")) || "active"; });
    if (!ADMIN_MODE) D.products = D.products.filter((p) => p.status === "active");
    D.boxes.forEach((b) => {
      const pr = CATALOG.prices[b.slug];
      if (pr != null && pr !== "") { const min = Math.min(...b.tiers.map((t) => t.price)); const d = +pr - min; b.tiers.forEach((t) => { t.price = Math.max(0, Math.round(t.price + d)); }); }
      const m = CATALOG.boxes[b.slug] || CATALOG.pmeta[b.slug];
      if (m) ["name", "tagline", "desc", "image", "includes", "stock", "tiers"].forEach((f) => { if (m[f] !== undefined && m[f] !== "" && !(f === "tiers" && !(Array.isArray(m.tiers) && m.tiers.length))) b[f] = m[f]; });
    });
    D.boxes.forEach((b) => { const m = CATALOG.boxes[b.slug] || CATALOG.pmeta[b.slug]; b.status = m && (m.status || (m.active === false ? "draft" : "")) || "active"; });
    if (!ADMIN_MODE) D.boxes = D.boxes.filter((b) => b.status === "active");
    D.categories.forEach((c) => { const m = CATALOG.categories[c.slug]; if (m) Object.assign(c, m); });
  })();
  (function applyColors() {
    const c = (THEME && THEME.settings().colors) || {};
    Object.keys(c).forEach((k) => { if (/^--[a-z0-9-]+$/i.test(k) && c[k]) document.documentElement.style.setProperty(k, c[k]); });
  })();

  /* ------------------------------------------------------------------ *
   * Icons (inline SVG, 24px, currentColor)
   * ------------------------------------------------------------------ */
  const sv = (d, w) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const I = {
    search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 20.5c0-3.6 3.6-6.2 8-6.2s8 2.6 8 6.2"/>'),
    heart: sv('<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/>'),
    bag: sv('<path d="M5.5 8.5h13l-1 11.2a1.8 1.8 0 0 1-1.8 1.6H8.3a1.8 1.8 0 0 1-1.8-1.6l-1-11.2Z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>'),
    menu: sv('<path d="M4 9h16M8 15h12"/>', 1.4),
    home: sv('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>'),
    grid: sv('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
    close: sv('<path d="m6 6 12 12M18 6 6 18"/>'),
    check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 2),
    arrow: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    arrowUR: sv('<path d="M7 17 17 7M8 7h9v9"/>'),
    arrowL: sv('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    minus: sv('<path d="M5 12h14"/>'),
    plus: sv('<path d="M12 5v14M5 12h14"/>'),
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 2.8z"/></svg>',
    leaf: sv('<path d="M5 19c0-7.5 5.2-13 14-13 0 9-6 14-13.5 14"/><path d="M5 19c2.2-4 5.4-6.3 9.5-7.3"/>', 1.5),
    leaf2: sv('<path d="M11 21c-4 0-7-3-7-8 0-6 6-9 13-9 0 8-3 13-8 14-2 .4-3-1-3-3 0-3 3-5 6-6"/>', 1.4),
    truck: sv('<path d="M2.5 7h11v9h-11zM13.5 10h4l3 3.2V16h-7z"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>', 1.5),
    shield: sv('<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/>', 1.5),
    snow: sv('<path d="M12 2.5v19M4 7l16 10M20 7 4 17"/>', 1.5),
    sparkle: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', 1.5),
    pin: sv('<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>', 1.5),
    phone: sv('<path d="M5 4h3.5l1.8 4.3-2.2 1.4a11 11 0 0 0 6.2 6.2l1.4-2.2L20 15.5V19a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/>', 1.5),
    mail: sv('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>', 1.5),
    clock: sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 1.5),
    gift: sv('<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M12 9v11.5M3.5 13h17M12 9S10.5 4 8 4.5 7 9 12 9Zm0 0s1.5-5 4-4.5S17 9 12 9Z"/>', 1.5),
    box: sv('<path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/>', 1.5),
    calendar: sv('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', 1.5),
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2.5a9.43 9.43 0 0 0-8.13 14.23L2.6 21.5l4.9-1.28A9.43 9.43 0 1 0 12.04 2.5Zm0 17.2a7.8 7.8 0 0 1-3.98-1.09l-.28-.17-2.9.76.77-2.83-.19-.29a7.78 7.78 0 1 1 6.58 3.62Zm4.27-5.83c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.91-.13.16-.27.18-.5.06a6.37 6.37 0 0 1-1.88-1.16 7.05 7.05 0 0 1-1.3-1.62c-.14-.23 0-.36.1-.47.11-.11.24-.27.35-.41.12-.14.16-.23.24-.39.08-.16.04-.29-.02-.41-.06-.12-.52-1.26-.72-1.72-.19-.45-.38-.39-.52-.4h-.45a.86.86 0 0 0-.62.3 2.6 2.6 0 0 0-.82 1.93 4.52 4.52 0 0 0 .95 2.4 10.36 10.36 0 0 0 3.97 3.5c.55.24.99.39 1.32.5.56.17 1.06.15 1.46.09.45-.07 1.38-.56 1.57-1.1.2-.55.2-1.02.14-1.12-.06-.1-.21-.16-.44-.28Z"/></svg>',
    instagram: sv('<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>', 1.5),
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.3c0-.8.25-1.4 1.45-1.4H16V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H7.8V14h2.3v7z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 3h2.6c.25 1.6 1.1 3 2.45 3.85.5.32 1.08.54 1.7.62v2.7c-1.5 0-2.9-.4-4.1-1.15v5.8a6 6 0 1 1-6-6c.3 0 .6.02.9.07v2.8a3.3 3.3 0 1 0 2.45 3.18z"/></svg>',
    gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9.4a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9.4a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>', 1.5),
    trash: sv('<path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>', 1.5),
    filter: sv('<path d="M4 6h16M7 12h10M10 18h4"/>'),
    x: sv('<path d="m7 7 10 10M17 7 7 17"/>'),
  };

  /* Payment brand marks (white chips — work on light & dark) */
  const PAY = {
    visa: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Visa"><rect width="40" height="26" rx="4" fill="#fff"/><text x="20" y="17.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-style="italic" font-size="10.5" letter-spacing=".4" fill="#1434CB">VISA</text></svg>',
    mastercard: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Mastercard"><rect width="40" height="26" rx="4" fill="#fff"/><circle cx="16.5" cy="13" r="7" fill="#EB001B"/><circle cx="23.5" cy="13" r="7" fill="#F79E1B"/><path d="M20 7.7a7 7 0 0 1 0 10.6 7 7 0 0 1 0-10.6Z" fill="#FF5F00"/></svg>',
    apple: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Apple Pay"><rect width="40" height="26" rx="4" fill="#fff"/><g transform="translate(0.5,0)" fill="#000"><path d="M13.9 9.2c.4-.5.7-1.2.6-1.9-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.8.7.1 1.3-.3 1.7-.8Zm.6 1c-.9-.1-1.7.5-2.1.5-.4 0-1.1-.5-1.8-.5-.9 0-1.8.5-2.2 1.4-1 1.6-.3 4 .7 5.3.5.6 1 1.3 1.8 1.3.7 0 .9-.5 1.8-.5.8 0 1 .5 1.8.4.7 0 1.2-.6 1.7-1.3.5-.7.7-1.4.7-1.4s-1.3-.5-1.3-2c0-1.2 1-1.8 1.1-1.8-.6-.9-1.5-1-1.9-1Z"/><text x="18" y="17" font-family="Arial,Helvetica,sans-serif" font-weight="600" font-size="9.5">Pay</text></g></svg>',
    wallet: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Mobile wallet"><rect width="40" height="26" rx="4" fill="#fff"/><g fill="none" stroke="#19291C" stroke-width="1.5" stroke-linejoin="round"><rect x="10" y="8" width="20" height="11" rx="2"/><path d="M10 11h20"/></g><circle cx="25" cy="15" r="1.4" fill="#AE9D57"/></svg>',
    cod: '<svg viewBox="0 0 40 26" class="pay-mark" role="img" aria-label="Cash on delivery"><rect width="40" height="26" rx="4" fill="#fff"/><rect x="9" y="8" width="22" height="10" rx="2" fill="none" stroke="#19291C" stroke-width="1.4"/><circle cx="20" cy="13" r="2.4" fill="none" stroke="#AE9D57" stroke-width="1.4"/></svg>',
  };
  const PAY_MARKS = PAY.visa + PAY.mastercard + PAY.apple + PAY.wallet;

  /* ------------------------------------------------------------------ *
   * Helpers, money + pricing
   * ------------------------------------------------------------------ */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => SETTINGS.currency + " " + Math.round(n || 0).toLocaleString("en-US");
  const weightOptions = [
    { g: 500, label: "½ kg" },
    { g: 1000, label: "1 kg", default: true },
    { g: 2000, label: "2 kg" },
    { g: 3000, label: "3 kg" },
    { g: 4000, label: "4 kg" },
  ];
  const weightLabel = (grams) => grams === 500 ? "½ kg" : (grams / 1000) + " kg";
  function priceForWeight(product, grams) {
    const kg = grams / 1000;
    const factor = kg >= 4 ? 0.92 : kg >= 3 ? 0.94 : kg >= 2 ? 0.97 : 1; // gentle value on bigger baskets
    return Math.round(product.pricePerKg * kg * factor);
  }
  function cardPrice(p) {
    if (p.unit === "kg") return { value: p.pricePerKg, per: "/ kg" };
    if (p.unit === "bunch") return { value: p.pricePerUnit, per: "/ bunch" };
    return { value: p.pricePerUnit, per: "each" };
  }
  function defaultVariant(p) {
    if (p.unit === "kg") return { variant: "1 kg", grams: 1000, price: priceForWeight(p, 1000) };
    if (p.unit === "bunch") return { variant: "per bunch", price: p.pricePerUnit };
    return { variant: "each", price: p.pricePerUnit };
  }
  const isCustomImg = (s) => /^(https?:|data:|\/|assets\/)/.test(s || "");

  /* ------------------------------------------------------------------ *
   * Seasons — "Dec – Mar" → 12 months, the almanac, what's at peak now
   * ------------------------------------------------------------------ */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function seasonMonths(p) {
    const s = String((p && p.season) || "").trim();
    if (!s || /all\s*year/i.test(s)) return { all: true, m: MONTHS.map(() => true) };
    const found = (s.match(/[A-Za-z]{3}/g) || []).map((x) => MONTHS.findIndex((m) => m.toLowerCase() === x.toLowerCase())).filter((i) => i > -1);
    if (!found.length) return { all: true, m: MONTHS.map(() => true) };
    const a = found[0], b = found.length > 1 ? found[found.length - 1] : a, m = MONTHS.map(() => false);
    for (let i = a; ; i = (i + 1) % 12) { m[i] = true; if (i === b) break; }
    return { all: false, m };
  }
  const inSeasonNow = (p) => { const s = seasonMonths(p); return !s.all && s.m[new Date().getMonth()]; };
  function peakNow(n) {
    const mo = new Date().getMonth(), out = [];
    const push = (arr) => arr.forEach((p) => { if (out.length < n && !out.includes(p) && seasonMonths(p).m[mo]) out.push(p); });
    push(D.products.filter(inSeasonNow));
    push(D.products.filter((p) => (p.collections || []).includes("seasonal")));
    push(D.products.filter((p) => (p.collections || []).includes("best-sellers")));
    return out;
  }
  function almanac(d) {
    d = d || new Date();
    const start = new Date(d.getFullYear(), 0, 1), week = Math.ceil(((d - start) / 864e5 + start.getDay() + 1) / 7);
    const mo = d.getMonth();
    const season = [11, 0, 1].includes(mo) ? "winter" : mo <= 4 ? "spring" : mo <= 7 ? "summer" : "autumn";
    const startMo = { winter: 11, spring: 2, summer: 5, autumn: 8 }[season];
    const pos = (mo - startMo + 12) % 12;
    return { week, month: MONTHS_LONG[mo], season, phase: ["Early", "Mid", "Late"][pos] + " " + season, text: "Week " + week + " · " + ["Early", "Mid", "Late"][pos] + " " + season + " in the valley" };
  }
  const originShort = (o) => String(o || "").replace(/,\s*Egypt$/i, "");

  const FV = (window.FV = {
    data: D, icon: (n) => I[n] || "", payMark: (k) => PAY[k] || "", payMarks: PAY_MARKS, esc,
    money, weightOptions, weightLabel, priceForWeight, cardPrice, defaultVariant,
    img: (slug) => D.IMG + slug + ".jpg",
    thumb: (slug) => D.IMG + "sm/" + slug + ".jpg",
    webp: (u) => u.replace(/\.jpe?g$/i, ".webp"),
    imgSrc: (s) => isCustomImg(s) ? s : D.IMG + s + ".jpg",
    isCustomImg,
    find: (slug) => D.products.find((p) => p.slug === slug),
    findBox: (slug) => D.boxes.find((b) => b.slug === slug),
    byCategory: (c) => D.products.filter((p) => p.category === c),
    byCollection: (c) => {
      if (c === "premium") return D.products.filter((p) => p.pricePerKg >= 110 || p.pricePerUnit >= 130);
      if (c === "now") return peakNow(24);
      if (c === "organic") return D.products.filter((p) => (p.badges || []).includes("organic") || (p.collections || []).includes("organic-reserve"));
      return D.products.filter((p) => (p.collections || []).includes(c));
    },
    catalog: CATALOG,
    MONTHS, seasonMonths, inSeasonNow, peakNow, almanac, originShort,
  });
  FV.stock = (slug) => { const p = FV.find(slug) || FV.findBox(slug); return p && p.stock != null && p.stock !== "" ? +p.stock : null; };
  FV.soldOut = (p) => !!p && p.stock != null && p.stock !== "" && +p.stock <= 0;

  /* ------------------------------------------------------------------ *
   * Stores
   * ------------------------------------------------------------------ */
  let cart = _ag("fv_cart", []);
  let wish = _ag("fv_wish", []);
  function saveCart() { _as("fv_cart", cart); updateCartUI(); }
  function saveWish() { _as("fv_wish", wish); updateWishUI(); }

  FV.cart = {
    items: () => cart,
    count: () => cart.reduce((s, i) => s + i.qty, 0),
    subtotal: () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    add(item) {
      const ex = cart.find((i) => i.key === item.key);
      if (ex) ex.qty += item.qty || 1; else cart.push(Object.assign({ qty: 1 }, item));
      track("add_to_cart", { slug: item.slug, price: item.price, qty: item.qty || 1 });
      saveCart();
    },
    setQty(key, qty) { const it = cart.find((i) => i.key === key); if (!it) return; it.qty = Math.max(1, qty); saveCart(); },
    remove(key) { cart = cart.filter((i) => i.key !== key); saveCart(); },
    clear() { cart = []; saveCart(); },
  };
  FV.wish = {
    items: () => wish,
    has: (slug) => wish.includes(slug),
    toggle(slug) {
      if (wish.includes(slug)) wish = wish.filter((s) => s !== slug); else { wish.unshift(slug); track("wishlist", { slug }); }
      saveWish();
      return wish.includes(slug);
    },
  };
  FV.recent = {
    list: () => _ag("fv_recent", []),
    push(slug) { const r = _ag("fv_recent", []).filter((s) => s !== slug); r.unshift(slug); _as("fv_recent", r.slice(0, 10)); },
  };
  FV.scarcityPct = (slug) => { let h = 0; for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0; return 70 + (h % 19); };

  FV.settings = SETTINGS;
  const _clean = (s) => typeof s === "string" ? s.replace(/[<>]/g, "").slice(0, 200) : s;
  FV.orders = {
    all: () => _ag(K.orders, []),
    record(order) {
      if (order && order.customer) ["name", "email", "phone", "area", "id"].forEach((k) => { order.customer[k] = _clean(order.customer[k]); });
      if (order) { order.address = _clean(order.address); order.status = order.status || "new"; order.fulfillment = order.fulfillment || "unfulfilled"; order.source = order.source || sourceOf(); }
      const o = _ag(K.orders, []); o.unshift(order); _as(K.orders, o);
      track("purchase", { id: order.id, total: order.total, items: (order.items || []).length });
      return order;
    },
  };
  FV.clients = {
    all: () => _ag(K.clients, []),
    upsert(c) {
      if (!c || !c.email) return;
      const name = _clean(c.name), phone = _clean(c.phone), area = _clean(c.area), email = _clean(c.email);
      const list = _ag(K.clients, []);
      const r = list.find((x) => x.email === email);
      if (r) { r.name = name || r.name; r.phone = phone || r.phone; r.area = area || r.area; }
      else list.push({ id: "C" + String(Date.now()).slice(-6), name: name || email.split("@")[0], email, phone: phone || "", area: area || "", joined: new Date().toISOString(), status: c.status || "active", marketing: !!c.marketing });
      _as(K.clients, list);
    },
  };
  /* Discount codes (managed in the admin) */
  FV.discounts = {
    all: () => (CATALOG.discounts || []),
    find(code) {
      code = String(code || "").trim().toUpperCase();
      const d = (CATALOG.discounts || []).find((x) => String(x.code).toUpperCase() === code);
      if (!d || d.active === false) return null;
      if (d.expires && new Date(d.expires) < new Date()) return null;
      return d;
    },
    value(d, subtotal, delivery) {
      if (!d) return 0;
      if (d.min && subtotal < +d.min) return 0;
      if (d.type === "percent") return Math.round(subtotal * (+d.value || 0) / 100);
      if (d.type === "fixed") return Math.min(subtotal, +d.value || 0);
      if (d.type === "shipping") return delivery || 0;
      return 0;
    },
  };

  /* ------------------------------------------------------------------ *
   * Analytics events (same-browser demo; the admin reads fv_track)
   * ------------------------------------------------------------------ */
  function sid() {
    try { let s = sessionStorage.getItem("fv_sid"); if (!s) { s = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("fv_sid", s); } return s; } catch (_) { return "x"; }
  }
  function sourceOf() {
    const u = new URLSearchParams(location.search).get("utm_source");
    if (u) return u.toLowerCase();
    const r = document.referrer;
    if (!r || r.indexOf(location.host) > -1) return "direct";
    if (/google|bing|duckduckgo|yahoo/.test(r)) return "search";
    if (/instagram|facebook|tiktok|t\.co|twitter|x\.com|snapchat|pinterest/.test(r)) return "social";
    return "referral";
  }
  function track(type, data) {
    if (/[?&]fv_preview=1/.test(location.search)) return;
    try {
      const list = _ag(K.track, []);
      list.push(Object.assign({ t: Date.now(), type, page: document.body ? document.body.dataset.page || "" : "", sid: sid(), dev: innerWidth < 768 ? "mobile" : innerWidth < 1100 ? "tablet" : "desktop", src: sessionStorage.getItem("fv_src") || sourceOf() }, data || {}));
      if (list.length > 4000) list.splice(0, list.length - 4000);
      _as(K.track, list);
    } catch (_) {}
  }
  FV.track = track;

  /* Optional live backend — auto-detected; checkout falls back to the demo */
  FV.api = {
    base: (window.FV_CONFIG && window.FV_CONFIG.apiBase) || "/api",
    _up: null,
    async up() {
      if (FV.api._up != null) return FV.api._up;
      // Only probe when a backend announced itself (server/index.js sets the
      // fv_api cookie) — static hosts like GitHub Pages skip the 404 entirely.
      if (!(window.FV_CONFIG && window.FV_CONFIG.apiBase) && document.cookie.indexOf("fv_api=1") < 0) { FV.api._up = false; return false; }
      try {
        const c = new AbortController(); const t = setTimeout(() => c.abort(), 3000);
        const h = await fetch(FV.api.base + "/health", { cache: "no-store", signal: c.signal }).finally(() => clearTimeout(t));
        FV.api._up = h.ok;
      } catch (_) { FV.api._up = false; }
      return FV.api._up;
    },
    async checkout(order) {
      const res = await fetch(FV.api.base + "/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
      if (!res.ok) { let e = {}; try { e = await res.json(); } catch (_) {} throw new Error(e.error || ("HTTP " + res.status)); }
      return res.json();
    },
  };

  /* ------------------------------------------------------------------ *
   * Receipt — designed, printable, on brand
   * ------------------------------------------------------------------ */
  function receiptDoc(o, embedded) {
    const cur = SETTINGS.currency, store = esc(SETTINGS.storeName);
    const m = (n) => cur + " " + Math.round(n || 0).toLocaleString("en-US");
    const date = new Date(o.date);
    const base = new URL(".", location.href).href;
    const rows = (o.items || []).map((it) => `<tr><td><div class="n">${esc(it.name)}</div><div class="v">${esc(it.variant || "")}</div></td><td class="c">${it.qty}</td><td class="r b">${m(it.price * it.qty)}</td></tr>`).join("");
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${base}"><title>Receipt ${esc(o.id)} · ${store}</title>
<style>@font-face{font-family:F;src:url(assets/fonts/fraunces-v4s.woff2) format("woff2");font-weight:300 900}@font-face{font-family:J;src:url(assets/fonts/jakarta-s.woff2) format("woff2");font-weight:300 800}
*{box-sizing:border-box;margin:0}body{font-family:J,system-ui,sans-serif;background:#E6DAC4;color:#211F1B;padding:28px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rc{max-width:600px;margin:0 auto;background:#FFFDF8;border-radius:26px;overflow:hidden;box-shadow:0 30px 70px -34px rgba(25,41,28,.5)}
.h{background:#19291C;color:#F3EDE1;padding:26px 30px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.h img{height:44px;width:auto}.h p{font-size:11px;color:rgba(243,237,225,.7);margin-top:8px}.h .m{text-align:right}.lab{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#CFC287;font-weight:800}.h .id{font-family:F,serif;font-variation-settings:"SOFT" 100;font-size:22px;font-weight:700}.h .dt{font-size:12px;color:rgba(243,237,225,.7)}
.bd{padding:26px 30px}.pt{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding-bottom:20px;border-bottom:1px dashed rgba(25,41,28,.22)}.pt .lab{color:#6E5F2E;margin-bottom:5px}.pt strong{font-size:14px;display:block}.pt span{font-size:12px;color:#57514A;display:block;line-height:1.55}
table{width:100%;border-collapse:collapse;margin:20px 0}th{text-align:left;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#6C6558;font-weight:800;padding:0 0 10px;border-bottom:1px solid rgba(25,41,28,.14)}th.c,td.c{text-align:center}th.r,td.r{text-align:right}td{padding:11px 0;border-bottom:1px solid rgba(25,41,28,.08);font-size:14px}.n{font-weight:700}.v{font-size:12px;color:#6C6558}td.b{font-weight:800}
.tot{margin-left:auto;width:250px}.tot .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px;color:#57514A}.tot .g{border-top:2px solid #19291C;margin-top:6px;padding-top:11px;font-family:F,serif;font-variation-settings:"SOFT" 100;font-size:21px;color:#19291C;font-weight:750}
.ft{text-align:center;padding:22px 30px 28px;border-top:1px solid rgba(25,41,28,.1);color:#6C6558;font-size:12px}.ft .ty{font-family:F,serif;font-variation-settings:"SOFT" 100;font-size:18px;color:#19291C;font-weight:650;margin-bottom:5px}
.ac{max-width:600px;margin:16px auto 0;display:flex;gap:10px;justify-content:center}.ac button{font:inherit;font-weight:700;font-size:14px;padding:12px 24px;border-radius:99px;border:none;cursor:pointer}.ac .p{background:#19291C;color:#F3EDE1}.ac .c{background:#FFFDF8;color:#19291C}
@page{size:A5;margin:9mm}@media print{body{background:#fff;padding:0}.rc{box-shadow:none;border-radius:0;max-width:100%}.ac{display:none}}</style></head><body>
<div class="rc"><div class="h"><div><img src="assets/img/logo-cream.png" alt="${store}"><p>Export-grade produce · Cairo</p></div>
<div class="m"><div class="lab">Receipt</div><div class="id">${esc(o.id)}</div><div class="dt">${date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div></div></div>
<div class="bd"><div class="pt"><div><div class="lab">Billed to</div><strong>${esc(o.customer.name)}</strong><span>${esc(o.customer.email)}</span><span>${esc(o.customer.phone || "")}</span></div>
<div><div class="lab">Deliver to</div><strong>${esc(o.customer.area || "")}</strong><span>${esc(o.address || "")}</span><span>${o.slot ? "Slot: " + esc(o.slot) : ""}</span></div></div>
<table><thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><div class="row"><span>Subtotal</span><span>${m(o.subtotal)}</span></div>${o.discount ? `<div class="row"><span>Discount${o.code ? " · " + esc(o.code) : ""}</span><span>− ${m(o.discount)}</span></div>` : ""}<div class="row"><span>Delivery</span><span>${o.delivery ? m(o.delivery) : "Free"}</span></div><div class="row g"><span>Total</span><span>${m(o.total)}</span></div></div></div>
<div class="ft"><div class="ty">Thank you for hosting with ${store}.</div><div>Payment: ${esc(o.payment || "Prepaid")} · A confirmation of your order.</div></div></div>
${embedded ? "" : `<div class="ac"><button class="c" onclick="window.close()">Close</button><button class="p" onclick="window.print()">Print / Save as PDF</button></div>`}</body></html>`;
  }
  FV.receiptDoc = receiptDoc;
  FV.receipt = {
    open(o) {
      let ov = document.getElementById("fvRcOverlay"); if (ov) ov.remove();
      ov = document.createElement("div"); ov.id = "fvRcOverlay"; ov.className = "rc-overlay";
      ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Receipt " + o.id); ov.setAttribute("data-lenis-prevent", "");
      ov.innerHTML = `<div class="rc-overlay__bar"><button class="btn btn--light btn--sm btn--noic" id="fvRcClose">Close</button><button class="btn btn--olive btn--sm" id="fvRcPrint">Save as PDF<span class="btn__ic">${I.arrow}</span></button></div>
        <iframe id="fvRcFrame" title="Receipt"></iframe>`;
      document.body.appendChild(ov);
      const f = ov.querySelector("#fvRcFrame"); f.srcdoc = receiptDoc(o, true);
      ov.querySelector("#fvRcPrint").onclick = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (_) {} };
      ov.querySelector("#fvRcClose").onclick = () => ov.remove();
      ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
      ov.querySelector("#fvRcClose").focus();
    },
    download(o) { const b = new Blob([receiptDoc(o)], { type: "text/html;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "receipt-" + o.id + ".html"; document.body.appendChild(a); a.click(); a.remove(); },
  };

  /* ------------------------------------------------------------------ *
   * Adding to the basket
   * ------------------------------------------------------------------ */
  FV.quickAdd = function (slug, fromEl) {
    const p = FV.find(slug); if (!p) return;
    if (FV.soldOut(p)) { toast(p.name + " is sold out", "Back soon — save it to your wishlist"); return; }
    const dv = defaultVariant(p);
    FV.cart.add({ key: slug + "|" + dv.variant, slug, type: "product", name: p.name, image: isCustomImg(p.image) ? p.image : p.slug, noPhoto: !!p.noPhoto, variant: dv.variant, price: dv.price });
    if (fromEl && window.FVMotion) window.FVMotion.fly(fromEl);
    toast(p.name + " added", dv.variant, true);
    if (fromEl && fromEl.classList) { fromEl.classList.add("added"); setTimeout(() => fromEl.classList.remove("added"), 1400); }
  };
  FV.addBox = function (slug, tierLabel, opts) {
    const b = FV.findBox(slug); if (!b) return;
    const tier = b.tiers.find((t) => t.label === tierLabel) || b.tiers[0];
    FV.cart.add({ key: slug + "|" + tier.label + (opts && opts.note ? "|" + opts.note.slice(0, 20) : ""), slug, type: "box", name: b.name, image: b.image, variant: tier.label + (opts && opts.note ? " · with card" : ""), note: opts && opts.note, price: tier.price });
    toast(b.name + " added", tier.label, true);
    openCart();
  };

  /* ------------------------------------------------------------------ *
   * Shell
   * ------------------------------------------------------------------ */
  const TS = (THEME && THEME.settings()) || {};
  const NAV = TS.nav || [{ label: "Shop", href: "products.html" }];
  const page = () => (document.body && document.body.dataset.page) || "";
  const pageFile = () => (location.pathname.split("/").pop() || "index.html");
  function isCurrent(href) {
    const [file, qs] = href.split("?");
    if (file !== pageFile() && !(file === "index.html" && pageFile() === "")) return false;
    const cur = new URLSearchParams(location.search), want = new URLSearchParams(qs || "");
    if (!qs) return !cur.get("cat") || file !== "products.html" || (cur.get("cat") !== "boxes");
    for (const [k, v] of want) if (cur.get(k) !== v) return false;
    return true;
  }
  const md = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em class="i">$1</em>').replace(/\n/g, "<br>");

  function buildHeader() {
    const nav = NAV.map((n) => `<li><a href="${esc(n.href)}"${isCurrent(n.href) ? ' aria-current="page"' : ""}>${esc(n.label)}</a></li>`).join("");
    return `<a class="skip-link" href="#main">Skip to content</a>
    <header class="hdr is-top" id="siteHeader">
      <div class="hdr__bar">
        <a class="hdr__logo" href="index.html" aria-label="${esc(SETTINGS.storeName)} — home">
          <img src="assets/img/logo-sm.png" srcset="assets/img/logo-sm.png 1x, assets/img/logo.png 2x" alt="${esc(SETTINGS.storeName)}" width="61" height="40">
        </a>
        <nav class="nav" aria-label="Primary"><ul>${nav}</ul></nav>
        <div class="hdr__actions">
          <button class="icon-btn" id="searchBtn" aria-label="Search" aria-haspopup="dialog">${I.search}</button>
          <a class="icon-btn hide-sm" href="account.html" aria-label="Account">${I.user}</a>
          <a class="icon-btn hide-sm" href="wishlist.html" aria-label="Wishlist" id="wishLink">${I.heart}<span class="badge-count" id="wishCount" data-n="0" aria-hidden="true"></span></a>
          <button class="icon-btn" id="cartBtn" aria-label="Cart" aria-haspopup="dialog">${I.bag}<span class="badge-count" id="cartCount" data-n="0" aria-hidden="true"></span></button>
          <button class="icon-btn hdr__menu" id="menuBtn" aria-label="Open menu" aria-controls="menu" aria-expanded="false">${I.menu}</button>
        </div>
      </div>
    </header>`;
  }

  function socialLinks() {
    const s = TS.social || {};
    return `${s.instagram ? `<a href="${esc(s.instagram)}" aria-label="Instagram" target="_blank" rel="noopener">${I.instagram}</a>` : ""}${s.facebook ? `<a href="${esc(s.facebook)}" aria-label="Facebook" target="_blank" rel="noopener">${I.facebook}</a>` : ""}${s.tiktok ? `<a href="${esc(s.tiktok)}" aria-label="TikTok" target="_blank" rel="noopener">${I.tiktok}</a>` : ""}`;
  }

  function buildMenu() {
    const extra = [
      { label: "My account", href: "account.html" }, { label: "Wishlist", href: "wishlist.html" }, { label: "Contact", href: "contact.html" }, { label: "Delivery areas", href: "contact.html#areas" },
    ];
    const c = TS.contact || {}, al = almanac();
    return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true" inert data-lenis-prevent>
      <div class="menu__scrim" data-close></div>
      <div class="menu__panel">
        <div class="menu__top">
          <span class="menu__almanac">${esc(al.text)}</span>
          <button class="icon-btn menu__close" data-close aria-label="Close menu">${I.close}</button>
        </div>
        <nav class="menu__nav" aria-label="Menu"><a href="index.html"${pageFile() === "index.html" || pageFile() === "" ? ' aria-current="page"' : ""}><small>01</small>Home</a>${NAV.map((n, i) => `<a href="${esc(n.href)}"${isCurrent(n.href) ? ' aria-current="page"' : ""}><small>${String(i + 2).padStart(2, "0")}</small>${esc(n.label)}</a>`).join("")}</nav>
        <div class="menu__sub">${extra.map((e) => `<a href="${e.href}">${e.label}</a>`).join("")}</div>
        <div class="menu__foot">
          ${c.whatsapp ? `<a class="link-u" href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">${I.whatsapp}WhatsApp us</a>` : ""}
          <div class="social">${socialLinks()}</div>
        </div>
      </div>
    </div>`;
  }

  function buildFooter() {
    const f = TS.footer || {}, c = TS.contact || {};
    const cols = (f.columns || []).map((col) => `<div class="ftr__col"><h3>${esc(col.title)}</h3>${(col.links || []).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("")}</div>`).join("");
    return `<footer class="ftr" id="siteFooter">
      <div class="wrap wrap--wide">
        <div class="ftr__top">
          <h2 class="ftr__title" data-split>${md(f.title || "From the valley, *with care.*")}</h2>
          <div class="ftr__intro">
            <p>${esc(f.blurb || "")}</p>
            <div class="ftr__contact">${c.phone ? `<a href="tel:${esc(c.phone.replace(/\s/g, ""))}">${esc(c.phone)}</a>` : ""}${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""}${c.hours ? `<span>${esc(c.hours)}</span>` : ""}</div>
          </div>
        </div>
        <div class="ftr__cols">
          <div class="ftr__brand">
            <img src="assets/img/logo-cream-sm.png" srcset="assets/img/logo-cream-sm.png 1x, assets/img/logo-cream.png 2x" alt="${esc(SETTINGS.storeName)}" width="86" height="56" loading="lazy">
            <p class="ftr__almanac">${esc(almanac().text)}</p>
          </div>
          ${cols}
        </div>
        <div class="ftr__bottom">
          <span>© ${new Date().getFullYear()} ${esc(SETTINGS.storeName)} · ${esc(c.city || "Cairo, Egypt")}</span>
          <div class="pay-row" aria-label="Accepted payment methods">${PAY_MARKS}${PAY.cod}</div>
          <div class="social">${socialLinks()}</div>
          <a class="admin-link" href="admin/index.html">Store admin</a>
        </div>
      </div>
    </footer>`;
  }

  function buildOverlays() {
    const popular = ["Strawberries", "Mango", "Dates", "Hosting box", "Grapes", "Herbs"];
    return `<div class="scrim" id="scrim"></div>
    <aside class="drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-labelledby="cartTitle" aria-hidden="true" inert>
      <div class="drawer__head"><h3 id="cartTitle">Your basket</h3><button class="icon-btn" data-close aria-label="Close basket">${I.close}</button></div>
      <div class="drawer__body" id="cartBody" data-lenis-prevent></div>
      <div class="drawer__foot" id="cartFoot"></div>
    </aside>
    <div class="search" id="searchOverlay" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true" inert>
      <div class="search__panel">
        <div class="search__bar">${I.search}<input type="search" id="searchInput" placeholder="Search fruit, vegetables, boxes…" aria-label="Search the store" autocomplete="off"><button class="icon-btn" data-close aria-label="Close search">${I.close}</button></div>
        <div class="search__res" id="searchResults" data-lenis-prevent></div>
        <div class="search__chips" id="searchChips">${popular.map((p) => `<button class="chip" type="button" data-q="${p}">${p}</button>`).join("")}</div>
      </div>
    </div>
    <div class="toasts" id="toastWrap" aria-live="polite" aria-atomic="false"></div>`;
  }

  /* ------------------------------------------------------------------ *
   * Panels (menu / search / cart) — focus-trapped, scroll-locked
   * ------------------------------------------------------------------ */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  let openPanel = null, lastTrigger = null;
  function lockScroll(on) {
    document.body.classList.toggle("no-scroll", on);
    const L = window.FVMotion && window.FVMotion.lenis;
    if (L) { if (on) L.stop(); else L.start(); }
  }
  function show(el) { el.classList.add("open"); el.setAttribute("aria-hidden", "false"); el.removeAttribute("inert"); }
  function hide(el) { if (!el) return; el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); el.setAttribute("inert", ""); }
  function closeAll() {
    $("#scrim") && $("#scrim").classList.remove("open");
    hide($("#cartDrawer")); hide($("#searchOverlay")); hide($("#menu"));
    $("#menuBtn") && $("#menuBtn").setAttribute("aria-expanded", "false");
    lockScroll(false);
    if (openPanel && lastTrigger && lastTrigger.focus) { try { lastTrigger.focus({ preventScroll: true }); } catch (_) {} }
    openPanel = null; lastTrigger = null;
  }
  function openCart() {
    if (openPanel) closeAll();
    renderCartDrawer();
    lastTrigger = document.activeElement;
    $("#scrim").classList.add("open"); show($("#cartDrawer"));
    lockScroll(true); openPanel = "cart";
    setTimeout(() => { const b = $("#cartDrawer [data-close]"); b && b.focus(); }, 80);
  }
  function openMenu() {
    if (openPanel) closeAll();
    lastTrigger = document.activeElement;
    show($("#menu")); $("#menuBtn").setAttribute("aria-expanded", "true");
    lockScroll(true); openPanel = "menu";
    setTimeout(() => { const a = $("#menu nav a"); a && a.focus(); }, 120);
  }
  function openSearch() {
    if (openPanel) closeAll();
    lastTrigger = document.activeElement;
    show($("#searchOverlay")); lockScroll(true); openPanel = "search";
    setTimeout(() => $("#searchInput").focus(), 80);
  }
  function trap(e) {
    if (e.key !== "Tab" || !openPanel) return;
    const root = openPanel === "cart" ? $("#cartDrawer") : openPanel === "menu" ? $("#menu") : $("#searchOverlay");
    const f = $$("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])", root).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  FV.openCart = openCart;
  FV.openSearch = openSearch;

  /* ------------------------------------------------------------------ *
   * Basket UI
   * ------------------------------------------------------------------ */
  function lineImage(it) {
    if (it.noPhoto) return `<div class="cline__img media--herb" style="display:grid;place-items:center">${I.leaf2}</div>`;
    return `<div class="cline__img"><img src="${FV.imgSrc(it.image)}" alt="" loading="lazy" width="76" height="76"></div>`;
  }
  function shipMeter(sub) {
    const freeAt = SETTINGS.freeThreshold, remain = Math.max(0, freeAt - sub), pct = Math.min(100, (sub / freeAt) * 100);
    return `<div class="ship-meter"><p>${remain > 0 ? `Add <strong>${money(remain)}</strong> more for complimentary delivery.` : `<strong>You've earned complimentary delivery.</strong>`}</p><div class="ship-meter__bar"><i style="width:${pct}%"></i></div></div>`;
  }
  FV.shipMeter = shipMeter;
  function renderCartDrawer() {
    const body = $("#cartBody"), foot = $("#cartFoot");
    if (!body) return;
    $("#cartTitle").innerHTML = `Your basket${cart.length ? ` <small class="muted">(${FV.cart.count()})</small>` : ""}`;
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><p class="eyebrow">Your basket</p><h3>Nothing picked <em class="i">yet</em>.</h3><p>The season is waiting — start with what is at its peak.</p><a class="btn btn--sm" href="products.html" style="margin-top:1.4rem">Shop the harvest<span class="btn__ic">${I.arrow}</span></a></div>`;
      foot.innerHTML = ""; return;
    }
    body.innerHTML = shipMeter(FV.cart.subtotal()) + cart.map((it) => `
      <div class="cline">
        ${lineImage(it)}
        <div>
          <div class="cline__name">${esc(it.name)}</div>
          <div class="cline__var">${esc(it.variant)}</div>
          <div class="qty"><button data-dec="${esc(it.key)}" aria-label="Decrease ${esc(it.name)}">${I.minus}</button><input value="${it.qty}" readonly aria-label="Quantity"><button data-inc="${esc(it.key)}" aria-label="Increase ${esc(it.name)}">${I.plus}</button></div>
          <button class="cline__rm" data-rm="${esc(it.key)}">Remove</button>
        </div>
        <div class="cline__price">${money(it.price * it.qty)}</div>
      </div>`).join("");
    const sub = FV.cart.subtotal();
    foot.innerHTML = `
      <div class="sum-row"><span>Subtotal</span><strong>${money(sub)}</strong></div>
      <div class="sum-row"><span>Delivery</span><span>${sub >= SETTINGS.freeThreshold ? "Free" : "From " + money(SETTINGS.deliveryFee)}</span></div>
      <a class="btn btn--block btn--lg" href="checkout.html" style="margin-top:1rem">Checkout · ${money(sub)}<span class="btn__ic">${I.arrow}</span></a>
      <a class="link-u" href="cart.html" style="margin:.9rem auto 0;display:flex;width:fit-content">View full basket</a>`;
  }
  let lastCount = null;
  function updateCartUI() {
    const c = FV.cart.count();
    const label = c ? `Cart, ${c} item${c > 1 ? "s" : ""}` : "Cart, empty";
    ["#cartCount"].forEach((s) => { const el = $(s); if (el) { el.dataset.n = c; el.classList.toggle("show", c > 0); if (lastCount != null && c > lastCount && window.FVMotion) window.FVMotion.bump(el); } });
    lastCount = c;
    $("#cartBtn") && $("#cartBtn").setAttribute("aria-label", label);
    if (openPanel === "cart") renderCartDrawer();
    document.dispatchEvent(new CustomEvent("fv:cart"));
  }
  function updateWishUI() {
    const c = wish.length, el = $("#wishCount");
    if (el) { el.dataset.n = c; el.classList.toggle("show", c > 0); }
    $("#wishLink") && $("#wishLink").setAttribute("aria-label", c ? `Wishlist, ${c} saved` : "Wishlist, empty");
    $$("[data-wish]").forEach((b) => { const on = FV.wish.has(b.dataset.wish); b.classList.toggle("active", on); b.setAttribute("aria-pressed", on); });
    document.dispatchEvent(new CustomEvent("fv:wish"));
  }
  FV.updateWishUI = updateWishUI;
  FV.updateCartUI = updateCartUI;

  /* ------------------------------------------------------------------ *
   * Toast
   * ------------------------------------------------------------------ */
  function toast(msg, sub, withCart) {
    const w = $("#toastWrap"); if (!w) return;
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status");
    t.innerHTML = `<span class="toast__ic">${I.check}</span><span>${esc(msg)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>${withCart ? `<a href="cart.html" data-open-cart>View basket</a>` : ""}`;
    w.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("show")));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 500); }, 3600);
    while (w.children.length > 3) w.firstElementChild.remove();
  }
  FV.toast = toast;

  /* ------------------------------------------------------------------ *
   * Search
   * ------------------------------------------------------------------ */
  function runSearch(q) {
    const res = $("#searchResults"); if (!res) return;
    q = q.trim().toLowerCase();
    $("#searchChips").hidden = !!q;
    if (!q) { res.innerHTML = `<p class="search__hint">Popular right now</p>`; return; }
    const hit = (s) => s.toLowerCase().includes(q) || q.split(/\s+/).every((w) => s.toLowerCase().includes(w));
    const ps = D.products.filter((p) => hit(p.name + " " + p.category + " " + (p.short || "") + " " + (p.origin || ""))).slice(0, 6);
    const bs = D.boxes.filter((b) => hit(b.name + " " + b.tagline + " box")).slice(0, 3);
    const as = D.articles.filter((a) => hit(a.title + " " + a.category)).slice(0, 2);
    if (!ps.length && !bs.length && !as.length) { res.innerHTML = `<p class="search__hint">No matches for “${esc(q)}”. Try “mango”, “box” or “herbs”.</p>`; return; }
    res.innerHTML = [
      ...ps.map((p) => `<a class="search__row" href="product.html?slug=${p.slug}">${p.noPhoto ? `<span class="media--herb" style="width:54px;height:54px;border-radius:12px;display:grid;place-items:center">${I.leaf2}</span>` : `<img src="${isCustomImg(p.image) ? p.image : FV.thumb(p.slug)}" alt="" loading="lazy">`}<span><strong>${esc(p.name)}</strong><em>${esc(p.category)} · ${money(cardPrice(p).value)} ${cardPrice(p).per}</em></span></a>`),
      ...bs.map((b) => `<a class="search__row" href="product.html?box=${b.slug}"><img src="${FV.thumb(b.image)}" alt="" loading="lazy"><span><strong>${esc(b.name)}</strong><em>Box · from ${money(Math.min(...b.tiers.map((t) => t.price)))}</em></span></a>`),
      ...as.map((a) => `<a class="search__row" href="article.html?slug=${a.slug}"><img src="${FV.thumb(a.image)}" alt="" loading="lazy"><span><strong>${esc(a.title)}</strong><em>Field notes · ${esc(a.read)}</em></span></a>`),
    ].join("") + `<a class="search__all" href="products.html?q=${encodeURIComponent(q)}">See all results for “${esc(q)}” ${I.arrow}</a>`;
  }

  /* ------------------------------------------------------------------ *
   * Card renderers (shared by sections + pages)
   * ------------------------------------------------------------------ */
  function topLabel(p) {
    const b = p.badges || [], c = p.collections || [];
    if (inSeasonNow(p)) return "In season";
    if (b.includes("organic")) return "Organic";
    if (b.includes("export")) return "Export-grade";
    if (c.includes("best-sellers")) return "House favourite";
    return p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : "Fresh Valley";
  }
  FV.topLabel = topLabel;
  function flag(p) {
    if (FV.soldOut(p)) return `<span class="tag tag--dark pcard__tag">Sold out</span>`;
    if (p.compareAt && +p.compareAt > cardPrice(p).value) return `<span class="tag tag--pom pcard__tag">−${Math.round((1 - cardPrice(p).value / +p.compareAt) * 100)}%</span>`;
    if (inSeasonNow(p)) return `<span class="tag pcard__tag">In season</span>`;
    return "";
  }
  FV.picture = function (slug, sizes, alt, opt) {
    opt = opt || {};
    if (isCustomImg(slug)) return `<img src="${esc(slug)}" alt="${esc(alt || "")}" loading="${opt.eager ? "eager" : "lazy"}" decoding="async">`;
    return `<picture><source type="image/webp" srcset="${FV.webp(FV.thumb(slug))} 540w, ${FV.webp(FV.img(slug))} 1000w" sizes="${sizes}"><img src="${FV.thumb(slug)}" srcset="${FV.thumb(slug)} 540w, ${FV.img(slug)} 1000w" sizes="${sizes}" alt="${esc(alt || "")}" loading="${opt.eager ? "eager" : "lazy"}" decoding="async" width="540" height="540"></picture>`;
  };
  /* Produce without a photograph (cut herbs) gets a typographic field label */
  function herbTile(p) {
    return `<span class="herb-tile" aria-hidden="true"><span class="herb-tile__latin">${esc(p.latin || p.name)}</span><span class="herb-tile__note">${p.unit === "bunch" ? "Cut the morning it leaves" : esc(originShort(p.origin))}</span></span>`;
  }
  FV.herbTile = herbTile;
  FV.productCardHTML = function (p) {
    const cp = cardPrice(p), sold = FV.soldOut(p);
    const wishB = `<button class="pcard__wish" data-wish="${p.slug}" aria-label="Save ${esc(p.name)}" aria-pressed="false">${I.heart}</button>`;
    const media = p.noPhoto
      ? `<div class="pcard__media media--herb">${herbTile(p)}${flag(p)}${wishB}</div>`
      : `<div class="pcard__media">${FV.picture(isCustomImg(p.image) ? p.image : p.slug, "(max-width:640px) 46vw, (max-width:1180px) 30vw, 320px", p.name)}${flag(p)}${wishB}</div>`;
    const cmp = p.compareAt && +p.compareAt > cp.value ? ` <s class="was">${money(+p.compareAt)}</s>` : "";
    const season = String(p.season || "").replace(/\s*–\s*/, "–");
    return `<article class="pcard${sold ? " pcard--sold" : ""}" data-reveal>
      ${media}
      <div class="pcard__body">
        <div class="pcard__row">
          <h3 class="pcard__name"><a href="product.html?slug=${p.slug}">${esc(p.name)}</a></h3>
          <span class="pcard__price">${money(cp.value)} <small>${cp.per}</small>${cmp}</span>
        </div>
        ${p.latin ? `<p class="pcard__latin">${esc(p.latin)}</p>` : ""}
        <div class="pcard__foot">
          <span class="pcard__origin">${esc(originShort(p.origin))}${season ? ` · ${esc(season)}` : ""}</span>
          ${sold ? "" : `<button class="pcard__add" data-add="${p.slug}" aria-label="Add ${esc(p.name)} to basket"><span>Add</span>${I.plus}</button>`}
        </div>
      </div>
    </article>`;
  };
  FV.boxCardHTML = function (b) {
    const from = Math.min(...b.tiers.map((t) => t.price));
    const tag = b.slug === "hosting-box" ? "Most gifted" : ((b.collections || []).includes("seasonal") ? "This month" : ((b.collections || []).includes("organic-reserve") ? "Reserve" : ""));
    return `<article class="bcard" data-reveal>
      <div class="bcard__media">${FV.picture(b.image, "(max-width:640px) 92vw, (max-width:1180px) 46vw, 360px", b.name)}${tag ? `<span class="tag bcard__tag">${tag}</span>` : ""}</div>
      <div class="bcard__body">
        <h3 class="bcard__name"><a href="product.html?box=${b.slug}">${esc(b.name)}</a></h3>
        <p class="bcard__tagline">${esc(b.tagline)}</p>
        <div class="bcard__foot">
          <span class="bcard__price"><small>From</small> ${money(from)}</span>
          <span class="bcard__go" aria-hidden="true">View box ${I.arrow}</span>
        </div>
      </div>
    </article>`;
  };
  FV.articleCardHTML = function (a, row) {
    const media = `<div class="acard__media" data-clip>${FV.picture(a.image, row ? "(max-width:960px) 92vw, 460px" : "(max-width:960px) 92vw, 440px", "")}</div>`;
    return `<article class="acard${row ? " acard--row" : ""}" data-reveal>
      ${media}
      <div class="acard__body">
        <span class="acard__meta">${esc(a.category)} · ${esc(a.read)}</span>
        <h3><a href="article.html?slug=${a.slug}">${esc(a.title)}</a></h3>
        <p>${esc(a.excerpt)}</p>
      </div>
    </article>`;
  };

  /* ------------------------------------------------------------------ *
   * Motion bridges (v3 API names kept)
   * ------------------------------------------------------------------ */
  FV.observeReveals = function (root) { if (window.FVMotion && window.FVMotion.ready) window.FVMotion.scan(root || document); };
  FV.observeCounts = FV.observeReveals;
  FV.motionLayer = function () {};
  FV.bindRail = function (rail, prev, next) {
    if (!rail || !prev || !next) return;
    const step = () => Math.max(rail.clientWidth * 0.8, 260);
    const update = () => { prev.disabled = rail.scrollLeft < 10; next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 10; };
    prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  };
  FV.cutoffText = function () {
    const now = new Date(), cut = new Date(now); cut.setHours(SETTINGS.cutoffHour || 18, 0, 0, 0);
    if (now >= cut) cut.setDate(cut.getDate() + 1);
    const d = cut - now, h = Math.floor(d / 3.6e6), m = Math.floor((d % 3.6e6) / 6e4);
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */
  function wire() {
    const header = $("#siteHeader");
    const ann = $(".announce");
    let lastY = window.scrollY, annH = ann ? ann.offsetHeight : 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (header) {
        header.classList.toggle("is-top", y < 12);
        document.documentElement.classList.toggle("is-scrolled", y > 12);
        if (ann) header.style.top = Math.max(0, annH - y) + "px";
        if (openPanel) header.classList.remove("is-hidden");
        else if (y > 260 && y > lastY + 6) header.classList.add("is-hidden");
        else if (y < lastY - 6 || y <= 260) header.classList.remove("is-hidden");
      }
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { annH = ann ? ann.offsetHeight : 0; onScroll(); });

    $("#cartBtn") && $("#cartBtn").addEventListener("click", openCart);
    $("#menuBtn") && $("#menuBtn").addEventListener("click", openMenu);
    $("#searchBtn") && $("#searchBtn").addEventListener("click", openSearch);
    $("#scrim") && $("#scrim").addEventListener("click", closeAll);
    $("#searchOverlay") && $("#searchOverlay").addEventListener("click", (e) => { if (e.target.id === "searchOverlay") closeAll(); });
    $$("[data-close]").forEach((b) => b.addEventListener("click", closeAll));
    $$("#menu a").forEach((a) => a.addEventListener("click", () => { hide($("#menu")); lockScroll(false); openPanel = null; }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openPanel) closeAll(); trap(e); if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !openPanel && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName)) { e.preventDefault(); openSearch(); } });

    const si = $("#searchInput");
    si && si.addEventListener("input", (e) => runSearch(e.target.value));
    si && si.addEventListener("keydown", (e) => { if (e.key === "Enter" && si.value.trim()) location.href = "products.html?q=" + encodeURIComponent(si.value.trim()); });
    $$("#searchChips [data-q]").forEach((b) => b.addEventListener("click", () => { si.value = b.dataset.q; runSearch(b.dataset.q); si.focus(); }));
    runSearch("");

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t.closest) return;
      const add = t.closest("[data-add]");
      if (add) { e.preventDefault(); FV.quickAdd(add.dataset.add, add); return; }
      const w = t.closest("[data-wish]");
      if (w) { e.preventDefault(); const on = FV.wish.toggle(w.dataset.wish); toast(on ? "Saved to your wishlist" : "Removed from your wishlist"); return; }
      const oc = t.closest("[data-open-cart]");
      if (oc && !document.body.dataset.page.match(/cart|checkout/)) { e.preventDefault(); openCart(); return; }
      const dec = t.closest("[data-dec]");
      if (dec) { const it = cart.find((i) => i.key === dec.dataset.dec); if (it) { if (it.qty <= 1) FV.cart.remove(it.key); else FV.cart.setQty(it.key, it.qty - 1); } return; }
      const inc = t.closest("[data-inc]");
      if (inc) { const it = cart.find((i) => i.key === inc.dataset.inc); if (it) FV.cart.setQty(it.key, it.qty + 1); return; }
      const rm = t.closest("[data-rm]");
      if (rm) { FV.cart.remove(rm.dataset.rm); return; }
    });

    $$("[data-newsletter]").forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = f.querySelector("input[type=email]");
      if (inp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) { inp.setAttribute("aria-invalid", "true"); inp.focus(); toast("Please enter a valid email"); return; }
      if (inp) { inp.removeAttribute("aria-invalid"); FV.clients.upsert({ email: inp.value, marketing: true, status: "subscriber" }); track("newsletter", {}); }
      f.reset(); toast("You're on the list", "One quiet note, once a month");
    }));

    updateCartUI(); updateWishUI();
  }

  /* ------------------------------------------------------------------ *
   * Store-level content: announcement, closed store, image overrides
   * ------------------------------------------------------------------ */
  function applyContent() {
    const imgs = _ag(K.images, {});
    if (Object.keys(imgs).length) {
      const swap = (img, url) => { const pic = img.parentElement; if (pic && pic.tagName === "PICTURE") pic.querySelectorAll("source").forEach((s) => s.remove()); img.src = url; img.removeAttribute("srcset"); img.removeAttribute("sizes"); };
      $$("img").forEach((img) => {
        const k = img.getAttribute("data-fv-img");
        if (k && imgs[k]) { swap(img, imgs[k]); return; }
        const m = (img.getAttribute("src") || "").match(/\/banners\/(?:sm\/)?([a-z0-9-]+)\.(?:jpe?g|png|webp)/i);
        if (m && imgs[m[1]]) swap(img, imgs[m[1]]);
      });
    }
    if (SETTINGS.storeOpen === false && !/[?&]fv_preview=1/.test(location.search)) { showMaintenance(); return; }
    const a = TS.announcement;
    let bar = document.querySelector(".announce"); // may be pre-rendered into the page
    if (a && a.enabled && a.text) {
      if (!bar) { bar = document.createElement("div"); bar.className = "announce"; document.body.insertBefore(bar, document.body.firstChild); }
      const html = `<span>${esc(a.text)}</span>${a.link ? ` <a href="${esc(a.link)}">${esc(a.link_label || "Shop now")}</a>` : ""}`;
      if (bar.innerHTML !== html) bar.innerHTML = html;
      document.body.classList.add("has-announce");
    } else if (bar) bar.remove();
  }
  function showMaintenance() {
    document.body.classList.add("no-scroll");
    const el = document.createElement("div");
    el.className = "maint";
    el.innerHTML = `<div><img src="assets/img/logo-cream.png" alt="${esc(SETTINGS.storeName)}" width="120" height="78"><p class="eyebrow">We'll be right back</p><h1>We're tidying the shelves.</h1><p>${esc(SETTINGS.storeName)} is briefly closed while we restock the season. Thank you for your patience.</p><a href="admin/index.html">Staff sign in</a></div>`;
    document.body.appendChild(el);
  }

  /* ------------------------------------------------------------------ *
   * "First light" — the loading screen (first visit of a session only).
   * The head script adds html.is-loading and the markup is static in each
   * page, so it paints on the first frame. It lifts once fonts and the
   * hero image are ready — never sooner than 1.7s (the logo needs its
   * moment), never later than 3.2s.
   * ------------------------------------------------------------------ */
  function liftLoader() {
    const h = document.documentElement;
    const done = () => document.dispatchEvent(new CustomEvent("fv:loaded"));
    if (!h.classList.contains("is-loading")) { done(); return; }
    let gone = false;
    const lift = () => {
      if (gone) return; gone = true;
      h.classList.add("is-lifting");
      document.dispatchEvent(new CustomEvent("fv:lifting"));
      setTimeout(() => { h.classList.remove("is-loading", "is-lifting"); done(); }, 1250);
    };
    const now = () => (window.performance && performance.now ? performance.now() : 0);
    const heroImg = document.querySelector(".s-hero img, .page-head__media img, main img");
    const waits = [document.fonts && document.fonts.ready, heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : null].filter(Boolean);
    Promise.all(waits).catch(() => {}).then(() => setTimeout(lift, Math.max(0, 1700 - now())));
    setTimeout(lift, Math.max(0, 3200 - now()));
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    if (ADMIN_MODE || !document.getElementById("fv-header")) {
      FV.booted = true;
      document.dispatchEvent(new CustomEvent("fv:ready"));
      return;
    }
    if (!document.querySelector('link[rel="icon"]')) {
      const add = (tag, attrs) => { const el = document.createElement(tag); Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k])); document.head.appendChild(el); };
      add("link", { rel: "icon", type: "image/svg+xml", href: "assets/img/favicon.svg" });
      add("link", { rel: "manifest", href: "manifest.webmanifest" });
      add("link", { rel: "apple-touch-icon", href: "assets/img/icon-192.png" });
      add("meta", { name: "mobile-web-app-capable", content: "yes" });
    }
    const mainEl = document.querySelector("main");
    if (mainEl) { if (!mainEl.id) mainEl.id = "main"; mainEl.setAttribute("tabindex", "-1"); }
    const head = document.getElementById("fv-header"), foot = document.getElementById("fv-footer");
    if (head) head.innerHTML = buildHeader() + buildMenu();
    const skip = head && head.querySelector(".skip-link");
    if (skip && mainEl) skip.setAttribute("href", "#" + mainEl.id);
    if (foot) foot.innerHTML = buildFooter();
    document.body.insertAdjacentHTML("beforeend", buildOverlays());
    applyContent();
    wire();
    try { if (!sessionStorage.getItem("fv_src")) sessionStorage.setItem("fv_src", sourceOf()); } catch (_) {}
    track("page_view", { path: pageFile() + location.search });
    FV.booted = true;
    document.dispatchEvent(new CustomEvent("fv:ready"));
    liftLoader();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
