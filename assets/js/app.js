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
    menu: sv('<path d="M4 8h16M10 16h10"/>', 1.9),
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
    bell: sv('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>', 1.6),
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

  /* Seasons + origins — the farm facts every product carries */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function seasonMonths(s) {
    const all = MONTHS.map((_, i) => i);
    if (!s || /all\s*year/i.test(s)) return all;
    const m = String(s).match(/([A-Za-z]{3})[A-Za-z]*\s*[–—-]\s*([A-Za-z]{3})/);
    if (!m) return all;
    const a = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase()), b = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
    if (a < 0 || b < 0) return all;
    const out = [];
    for (let i = a, g = 0; g < 12; i = (i + 1) % 12, g++) { out.push(i); if (i === b) break; }
    return out;
  }
  const originShort = (o) => { const s = String(o || "").replace(/,\s*Egypt$/i, "").replace(/^Select\s+/i, "").replace(/\s+Oasis$/i, ""); return s.charAt(0).toUpperCase() + s.slice(1); };
  const isYearRound = (p) => seasonMonths(p && p.season).length === 12;

  /* ------------------------------------------------------------------ *
   * Herb drawings — each herb is drawn as itself (the herbs have no
   * photography): mint's serrated pairs, basil's cupped leaves and flower
   * spike, coriander's scalloped leaflets, rosemary's needles, dill's
   * threads and umbel. Generated once, line-art in the brand's hand.
   * ------------------------------------------------------------------ */
  const HERB = (function () {
    const f = (n) => Math.round(n * 10) / 10;
    const rad = (a) => (a * Math.PI) / 180;
    function smooth(pts) { // Catmull-Rom → cubic Bézier through the points
      let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
      }
      return d;
    }
    // a leaf from (x,y) at angle a (deg, 0 = right, -90 = up), length L, width W, widest at p
    function leaf(x, y, a, L, W, o) {
      o = o || {};
      const p = o.p || 0.4, pa = 2 * p, pb = 2 * (1 - p), mx = Math.pow(p, pa) * Math.pow(1 - p, pb);
      const ca = Math.cos(rad(a)), sa = Math.sin(rad(a));
      const at = (t, s, k) => { const w = (Math.pow(t, pa) * Math.pow(1 - t, pb)) / mx * (W / 2) * (k || 1); return [x + t * L * ca - s * w * sa, y + t * L * sa + s * w * ca]; };
      let d;
      if (o.teeth) { // serrated edge (mint)
        const n = o.teeth * 2, side = (s) => { const r = []; for (let i = 0; i <= n; i++) { const t = i / n; r.push(at(t, s, t > 0.12 && t < 0.96 && i % 2 ? 1.16 : 0.94)); } return r; };
        const up = side(1), dn = side(-1).reverse();
        d = "M" + up.concat(dn.slice(1)).map((q) => f(q[0]) + " " + f(q[1])).join("L") + "Z";
      } else {
        const up = [], dn = [];
        for (let i = 0; i <= 6; i++) { const t = i / 6; up.push(at(t, 1)); dn.push(at(t, -1)); }
        d = smooth(up.concat(dn.reverse().slice(1))) + "Z";
      }
      const tip = at(0.86, 0);
      let rib = `M${f(x)} ${f(y)}L${f(tip[0])} ${f(tip[1])}`;
      if (o.veins) [0.3, 0.52, 0.72].forEach((t) => { const m = at(t, 0), e1 = at(t + 0.16, 1, 0.8), e2 = at(t + 0.16, -1, 0.8); rib += `M${f(m[0])} ${f(m[1])}L${f(e1[0])} ${f(e1[1])}M${f(m[0])} ${f(m[1])}L${f(e2[0])} ${f(e2[1])}`; });
      return `<path class="lf" d="${d}"/><path d="${rib}"/>`;
    }
    // quadratic stem helpers
    const q = (P0, C, P2) => ({ P0, C, P2, d: `M${P0[0]} ${P0[1]}Q${C[0]} ${C[1]} ${P2[0]} ${P2[1]}` });
    const on = (s, t) => [(1 - t) * (1 - t) * s.P0[0] + 2 * (1 - t) * t * s.C[0] + t * t * s.P2[0], (1 - t) * (1 - t) * s.P0[1] + 2 * (1 - t) * t * s.C[1] + t * t * s.P2[1]];
    const dir = (s, t) => { const dx = 2 * (1 - t) * (s.C[0] - s.P0[0]) + 2 * t * (s.P2[0] - s.C[0]), dy = 2 * (1 - t) * (s.C[1] - s.P0[1]) + 2 * t * (s.P2[1] - s.C[1]); return (Math.atan2(dy, dx) * 180) / Math.PI; };
    function fan(x, y, a, r, lobes) { // scalloped leaflet (coriander)
      const n = lobes || 3, span = 110, pts = [];
      for (let i = 0; i <= n; i++) { const ang = rad(a - span / 2 + (span * i) / n); pts.push([x + r * Math.cos(ang), y + r * Math.sin(ang)]); }
      let d = `M${f(x)} ${f(y)}L${f(pts[0][0])} ${f(pts[0][1])}`, v = "";
      for (let i = 0; i < n; i++) { const mid = rad(a - span / 2 + (span * (i + 0.5)) / n); d += `Q${f(x + r * 1.42 * Math.cos(mid))} ${f(y + r * 1.42 * Math.sin(mid))} ${f(pts[i + 1][0])} ${f(pts[i + 1][1])}`; v += `M${f(x)} ${f(y)}L${f(x + r * 0.95 * Math.cos(mid))} ${f(y + r * 0.95 * Math.sin(mid))}`; }
      return `<path class="lf" d="${d}Z"/><path d="${v}"/>`;
    }
    const dot = (x, y, r) => `<circle class="dt" cx="${f(x)}" cy="${f(y)}" r="${r || 1.5}"/>`;

    const draw = {
      mint() {
        const s = q([80, 198], [74, 120], [82, 34]);
        let g = `<path d="${s.d}"/>`;
        [[0.16, 44, 0], [0.34, 40, 1], [0.5, 34, 0], [0.64, 28, 1], [0.77, 21, 0], [0.87, 15, 1]].forEach(([t, L, alt]) => {
          const [x, y] = on(s, t), up = alt ? 28 : 12;
          g += leaf(x, y, -180 + up, L, L * 0.56, { p: 0.36, teeth: 7 }) + leaf(x, y, -up, L, L * 0.56, { p: 0.36, teeth: 7 });
        });
        const [tx, ty] = on(s, 1);
        g += leaf(tx, ty, -118, 12, 7, { p: 0.4, teeth: 4 }) + leaf(tx, ty, -62, 12, 7, { p: 0.4, teeth: 4 }) + leaf(tx, ty, -90, 10, 6, { p: 0.4 });
        return g;
      },
      basil() {
        const s = q([80, 198], [86, 132], [80, 62]);
        let g = `<path d="${s.d}"/><path d="M80 62L80 16"/>`;
        [[0.2, 48, 168], [0.42, 43, 152], [0.62, 35, 140], [0.8, 25, 126]].forEach(([t, L, a]) => {
          const [x, y] = on(s, t);
          g += leaf(x, y, -a, L, L * 0.64, { p: 0.44, veins: true }) + leaf(x, y, -180 + a, L, L * 0.64, { p: 0.44, veins: true });
        });
        [54, 45, 36, 28, 21].forEach((y, i) => { const w = 8 - i; g += leaf(80, y, -160, w, w * 0.7, { p: 0.5 }) + leaf(80, y, -20, w, w * 0.7, { p: 0.5 }) + dot(80 - w * 0.9, y - 2.5, 1.2) + dot(80 + w * 0.9, y - 2.5, 1.2); });
        g += dot(80, 14, 1.6);
        return g;
      },
      coriander() {
        const st = [q([80, 198], [58, 150], [36, 122]), q([80, 198], [72, 128], [60, 70]), q([80, 198], [94, 124], [106, 58]), q([80, 198], [106, 160], [128, 132])];
        let g = st.map((s) => `<path d="${s.d}"/>`).join("");
        [st[0], st[3]].forEach((s) => {
          const [x, y] = on(s, 1), a = dir(s, 1);
          g += fan(x, y, a - 38, 15, 3) + fan(x, y, a, 18, 3) + fan(x, y, a + 38, 15, 3);
          const [mx, my] = on(s, 0.62), ma = dir(s, 0.62);
          g += fan(mx, my, ma - 70, 11, 3) + fan(mx, my, ma + 70, 11, 3);
        });
        [st[1], st[2]].forEach((s, k) => {
          [0.55, 0.72, 0.86].forEach((t, i) => {
            const [x, y] = on(s, t), a = dir(s, t), side = (i + k) % 2 ? 1 : -1, b = a + side * 48, L = 16 - i * 3;
            const ex = x + L * Math.cos(rad(b)), ey = y + L * Math.sin(rad(b));
            g += `<path d="M${f(x)} ${f(y)}L${f(ex)} ${f(ey)}M${f(ex)} ${f(ey)}l${f(6 * Math.cos(rad(b - 30)))} ${f(6 * Math.sin(rad(b - 30)))}M${f(ex)} ${f(ey)}l${f(6 * Math.cos(rad(b + 30)))} ${f(6 * Math.sin(rad(b + 30)))}"/>`;
          });
        });
        const [ux, uy] = on(st[2], 1);
        for (let i = 0; i < 5; i++) { const a = rad(-150 + i * 30), ex = ux + 13 * Math.cos(a), ey = uy + 13 * Math.sin(a) - 2; g += `<path d="M${f(ux)} ${f(uy)}L${f(ex)} ${f(ey)}"/>` + dot(ex, ey, 1.8); }
        return g;
      },
      rosemary() {
        const main = { P0: [78, 198], C: [88, 112], P2: [82, 22] }, b1 = q([83, 124], [62, 96], [46, 52]), b2 = q([85, 98], [106, 76], [118, 40]);
        main.d = `M78 198Q88 112 82 22`;
        let g = `<path class="wd" d="${main.d}"/><path class="wd" d="${b1.d}"/><path class="wd" d="${b2.d}"/>`;
        [[main, 0.08, 0.98, 15], [b1, 0.12, 0.98, 10], [b2, 0.12, 0.98, 9]].forEach(([s, t0, t1, n]) => {
          for (let i = 0; i < n; i++) {
            const t = t0 + ((t1 - t0) * i) / (n - 1), [x, y] = on(s, t), a = dir(s, t), L = 14 - t * 5, side = i % 2 ? 1 : -1;
            g += leaf(x, y, a + side * 48, L, 3.4, { p: 0.5 });
          }
        });
        return g;
      },
      dill() {
        const s = q([80, 198], [84, 118], [80, 40]);
        let g = `<path d="${s.d}"/>`;
        [[0.3, -1, 46], [0.44, 1, 44], [0.58, -1, 38], [0.7, 1, 30]].forEach(([t, side, L]) => {
          const [x, y] = on(s, t), br = q([f(x), f(y)], [f(x + side * L * 0.6), f(y - 6)], [f(x + side * L), f(y - L * 0.62)]);
          g += `<path d="${br.d}"/>`;
          for (let i = 1; i <= 6; i++) {
            const u = i / 6.4, [bx, by] = on(br, u), a = dir(br, u), l = 11 - i;
            [-1, 1].forEach((k) => { const ang = rad(a + k * 42), ex = bx + l * Math.cos(ang), ey = by + l * Math.sin(ang); g += `<path d="M${f(bx)} ${f(by)}Q${f(bx + l * 0.5 * Math.cos(ang) + k)} ${f(by + l * 0.5 * Math.sin(ang) - 1.5)} ${f(ex)} ${f(ey)}"/>`; });
          }
        });
        const [ux, uy] = on(s, 1);
        for (let i = 0; i < 9; i++) {
          const a = rad(-164 + i * 18.5), L = 26 + 5 * Math.sin((i / 8) * Math.PI), ex = ux + L * Math.cos(a), ey = uy + L * Math.sin(a) * 0.9;
          g += `<path d="M${f(ux)} ${f(uy)}Q${f(ux + L * 0.55 * Math.cos(a))} ${f(uy + L * 0.62 * Math.sin(a))} ${f(ex)} ${f(ey)}"/>`;
          for (let j = 0; j < 4; j++) { const b = rad(-150 + j * 40), fx = ex + 5 * Math.cos(b), fy = ey + 5 * Math.sin(b); g += `<path d="M${f(ex)} ${f(ey)}L${f(fx)} ${f(fy)}"/>` + dot(fx, fy, 1.2); }
        }
        return g;
      },
      sprout() {
        return `<path d="M80 198Q80 150 80 118"/>` + leaf(80, 124, -152, 46, 26, { p: 0.46, veins: true }) + leaf(80, 118, -30, 54, 30, { p: 0.46, veins: true });
      },
    };
    const cache = {};
    return (kind) => (cache[kind] || (cache[kind] = draw[kind] ? draw[kind]() : draw.sprout()));
  })();
  const HERB_INFO = {
    mint: { latin: "Mentha spicata", note: "Serrated, cool, bright" },
    basil: { latin: "Ocimum basilicum", note: "Sweet, clove-warm" },
    coriander: { latin: "Coriandrum sativum", note: "Citrus-green, fresh-cut" },
    rosemary: { latin: "Salvia rosmarinus", note: "Resinous, woody" },
    dill: { latin: "Anethum graveolens", note: "Feathery, anise-soft" },
  };
  // an <svg> herb; `kind` = herb slug, anything else draws a young sprout
  const herbSVG = (kind, cls) => `<svg class="art herb ${cls || ""}" viewBox="0 0 160 200" aria-hidden="true" data-herb="${esc(kind)}"><g class="herb__sway">${HERB(kind)}</g></svg>`;

  const FV = (window.FV = {
    data: D, icon: (n) => I[n] || "", payMark: (k) => PAY[k] || "", payMarks: PAY_MARKS, esc,
    money, weightOptions, weightLabel, priceForWeight, cardPrice, defaultVariant,
    img: (slug) => D.IMG + slug + ".jpg",
    thumb: (slug) => D.IMG + "sm/" + slug + ".jpg",
    webp: (u) => u.replace(/\.jpe?g$/i, ".webp"),
    imgSrc: (s) => isCustomImg(s) ? s : D.IMG + s + ".jpg",
    isCustomImg,
    MONTHS, MONTHS_LONG, seasonMonths, originShort, isYearRound,
    inSeason: (p, m) => seasonMonths(p && p.season).includes(m == null ? new Date().getMonth() : m),
    herbSVG, herbPaths: HERB, herbInfo: (slug) => HERB_INFO[slug] || null,
    find: (slug) => D.products.find((p) => p.slug === slug),
    findBox: (slug) => D.boxes.find((b) => b.slug === slug),
    byCategory: (c) => D.products.filter((p) => p.category === c),
    byCollection: (c) => {
      if (c === "premium") return D.products.filter((p) => (p.pricePerKg >= 110 || p.pricePerUnit >= 130) && (p.rating || 0) >= 4.7);
      if (c === "organic") return D.products.filter((p) => (p.badges || []).includes("organic") || (p.collections || []).includes("organic-reserve"));
      return D.products.filter((p) => (p.collections || []).includes(c));
    },
    catalog: CATALOG,
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
  /* ------------------------------------------------------------------ *
   * Stock alerts — guests can buy freely; signed-in customers are told the
   * moment something they wait for (or saved) is back, or something new
   * arrives: an on-site note, the browser notification if allowed, and an
   * inbox in their account. Re-checked whenever the store's catalogue
   * changes (another tab, the admin) and on every visit.
   * ------------------------------------------------------------------ */
  const userNow = () => _ag("fv_user", null);
  function stockFrom(cat, slug) {
    const m = cat && ((cat.pmeta && cat.pmeta[slug]) || (cat.boxes && cat.boxes[slug]));
    if (m && m.status && m.status !== "active") return false;
    if (m && m.stock != null && m.stock !== "") return +m.stock > 0;
    const p = (D.products || []).find((x) => x.slug === slug) || (D.boxes || []).find((x) => x.slug === slug);
    return !(p && p.stock != null && p.stock !== "" && +p.stock <= 0);
  }
  FV.alerts = {
    list: () => _ag("fv_alerts", []),
    has: (slug) => _ag("fv_alerts", []).includes(slug),
    add(slug) { const a = _ag("fv_alerts", []); if (!a.includes(slug)) a.unshift(slug); _as("fv_alerts", a); const seen = _ag("fv_stock_seen", {}); seen[slug] = stockFrom(newest(PUB.catalog, _ag(K.catalog, null)), slug); _as("fv_stock_seen", seen); },
    remove(slug) { _as("fv_alerts", _ag("fv_alerts", []).filter((s) => s !== slug)); },
    inbox: () => _ag("fv_notices", []),
    unread: () => _ag("fv_notices", []).filter((n) => !n.read).length,
    markRead() { _as("fv_notices", _ag("fv_notices", []).map((n) => Object.assign(n, { read: true }))); },
    enable() {
      if (!("Notification" in window)) { toast("Alerts are on", "You'll see them here on the site"); return Promise.resolve("unsupported"); }
      return Notification.requestPermission().then((r) => { toast(r === "granted" ? "Instant alerts are on" : "Alerts will appear on the site", r === "granted" ? "We'll tell you the moment it's back" : "Browser notifications were not allowed"); return r; });
    },
  };
  function notice(n) {
    const box = _ag("fv_notices", []); box.unshift(Object.assign({ id: "N" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), read: false }, n)); _as("fv_notices", box.slice(0, 60));
    try { if ("Notification" in window && Notification.permission === "granted") { const x = new Notification(n.title, { body: n.body, icon: "assets/img/icon-192.png", tag: n.slug }); x.onclick = () => { window.focus(); location.href = n.href; }; } } catch (_) {}
    toast(n.title, n.body);
    document.dispatchEvent(new CustomEvent("fv:notice"));
  }
  FV.checkStock = function () {
    if (ADMIN_MODE || !userNow()) return;
    const cat = newest(PUB.catalog, _ag(K.catalog, null)) || {};
    const seen = _ag("fv_stock_seen", {});
    const watch = Array.from(new Set(_ag("fv_alerts", []).concat(_ag("fv_wish", []))));
    watch.forEach((slug) => {
      const now = stockFrom(cat, slug), p = FV.find(slug) || FV.findBox(slug);
      if (seen[slug] === false && now && p) notice({ slug, kind: "restock", title: p.name + " is back", body: "Freshly in stock — while this week's allocation lasts.", href: (FV.findBox(slug) ? "product.html?box=" : "product.html?slug=") + slug });
      seen[slug] = now;
    });
    _as("fv_stock_seen", seen);
    const known = _ag("fv_known_products", null), all = D.products.map((p) => p.slug).concat((cat.custom || []).map((c) => c.slug)).filter((v, i, a) => a.indexOf(v) === i);
    if (known) all.filter((s) => !known.includes(s)).forEach((slug) => { const p = FV.find(slug) || (cat.custom || []).find((c) => c.slug === slug); if (p) notice({ slug, kind: "new", title: "New in: " + p.name, body: "Just arrived at Fresh Valley.", href: "product.html?slug=" + slug }); });
    _as("fv_known_products", all);
  };
  addEventListener("storage", (e) => { if (e.key === K.catalog || e.key === "fv_user") FV.checkStock(); });

  /* Per-page SEO for pages rendered from data (product, article):
     canonical, Open Graph / Twitter and a breadcrumb trail. */
  FV.SITE = (window.FV_CONFIG && window.FV_CONFIG.site) || "https://freshvalley.eg/";
  FV.seoPage = function (o) {
    const head = document.head, abs = (u) => /^https?:/.test(u) ? u : FV.SITE + String(u || "").replace(/^\//, "");
    const set = (sel, make, attr, val) => { let el = head.querySelector(sel); if (!el) { el = make(); head.appendChild(el); } el.setAttribute(attr, val); };
    const meta = (key, val, prop) => set(`meta[${prop ? "property" : "name"}="${key}"]`, () => { const m = document.createElement("meta"); m.setAttribute(prop ? "property" : "name", key); return m; }, "content", val);
    if (o.path) set('link[rel="canonical"]', () => { const l = document.createElement("link"); l.rel = "canonical"; return l; }, "href", abs(o.path));
    const img = o.image ? abs(o.image) : FV.SITE + "assets/img/og.jpg";
    [["og:title", o.title], ["og:description", o.desc], ["og:image", img], ["og:type", o.type || "website"], ["og:url", o.path ? abs(o.path) : location.href]].forEach(([k, v]) => v && meta(k, v, true));
    [["twitter:card", "summary_large_image"], ["twitter:title", o.title], ["twitter:description", o.desc], ["twitter:image", img]].forEach(([k, v]) => v && meta(k, v));
    if (o.crumbs) { const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: o.crumbs.map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: abs(u) })) }); head.appendChild(s); }
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
        <nav class="nav" aria-label="Primary"><ul>${nav}</ul><span class="nav__hover" aria-hidden="true"></span><span class="nav__pill" aria-hidden="true"></span></nav>
        <div class="hdr__actions">
          <button class="icon-btn" id="searchBtn" aria-label="Search" aria-haspopup="dialog">${I.search}</button>
          <a class="icon-btn hide-sm" href="account.html" aria-label="Account" id="acctLink">${I.user}<span class="badge-count" id="acctCount" data-n="0" aria-hidden="true"></span></a>
          <a class="icon-btn hide-sm" href="wishlist.html" aria-label="Wishlist" id="wishLink">${I.heart}<span class="badge-count" id="wishCount" data-n="0" aria-hidden="true"></span></a>
          <button class="icon-btn" id="cartBtn" aria-label="Cart" aria-haspopup="dialog">${I.bag}<span class="badge-count" id="cartCount" data-n="0" aria-hidden="true"></span></button>
          <button class="icon-btn hdr__menu" id="menuBtn" aria-label="Open menu" aria-controls="menu" aria-expanded="false">${I.menu}</button>
        </div>
      </div>
    </header>`;
  }


  /* The valley — layered hills (the "Valley" in the name). Scenery, used
     at a few horizons only: the hero, dark bands and the footer. */
  const HILLS = {
    a: ["M0 160V80C120 54 250 36 400 48C560 60 650 94 820 90C990 86 1100 40 1260 42C1350 43 1410 58 1440 66V160Z",
        "M0 160V106C150 84 300 72 460 88C640 106 760 126 930 114C1110 101 1240 80 1440 98V160Z",
        "M0 160V134C200 120 380 114 560 126C760 139 900 148 1100 138C1260 130 1360 124 1440 128V160Z"],
    b: ["M0 160V86C170 52 330 40 520 62C700 83 820 104 1000 88C1180 72 1320 48 1440 56V160Z",
        "M0 160V120C180 100 360 96 560 110C760 124 900 130 1100 118C1260 109 1360 102 1440 106V160Z"],
    c: ["M0 160V70C140 88 300 104 470 92C650 79 760 44 950 46C1130 48 1250 76 1440 70V160Z",
        "M0 160V116C200 128 400 132 600 120C790 108 920 94 1110 102C1260 108 1370 118 1440 114V160Z"],
  };
  const hills = (v, cls) => `<svg class="hills ${cls || ""}" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true" focusable="false">${(HILLS[v] || HILLS.a).map((d, i, a) => `<path class="h${a.length - i}" d="${d}"/>`).join("")}</svg>`;
  FV.hills = hills;

  function buildMenu() {
    const extra = [
      { label: "My account", href: "account.html" }, { label: "Contact", href: "contact.html" },
    ];
    const s = TS.social || {}, c = TS.contact || {};
    return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true" inert data-lenis-prevent>
      <img class="menu__logo" src="assets/img/logo-cream-sm.png" srcset="assets/img/logo-cream-sm.png 1x, assets/img/logo-cream.png 2x" alt="" width="58" height="38">
      <button class="icon-btn menu__close" data-close aria-label="Close menu">${I.close}</button>
      <nav aria-label="Menu"><a href="index.html"><small>00</small>Home</a>${NAV.map((n, i) => `<a href="${esc(n.href)}"><small>${String(i + 1).padStart(2, "0")}</small>${esc(n.label)}</a>`).join("")}</nav>
      <div class="menu__sub">${extra.map((e) => `<a href="${e.href}">${e.label}</a>`).join("")}</div>
      ${window.FVSections && FVSections.harvestNote ? `<p class="menu__harvest" data-harvest-note>${FVSections.harvestNote()}</p>` : ""}
      <div class="menu__foot">
        <div>${c.whatsapp ? `<a class="btn btn--olive btn--sm" href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp us<span class="btn__ic">${I.whatsapp}</span></a>` : ""}</div>
        <div class="ftr__social">${s.instagram ? `<a href="${esc(s.instagram)}" aria-label="Instagram" target="_blank" rel="noopener">${I.instagram}</a>` : ""}${s.facebook ? `<a href="${esc(s.facebook)}" aria-label="Facebook" target="_blank" rel="noopener">${I.facebook}</a>` : ""}${s.tiktok ? `<a href="${esc(s.tiktok)}" aria-label="TikTok" target="_blank" rel="noopener">${I.tiktok}</a>` : ""}</div>
      </div>
    </div>`;
  }

  function buildFooter() {
    const f = TS.footer || {}, s = TS.social || {}, c = TS.contact || {};
    const cols = (f.columns || []).map((col) => `<div class="ftr__col"><h3>${esc(col.title)}</h3>${(col.links || []).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("")}</div>`).join("");
    return `<footer class="ftr" id="siteFooter">
      <div class="ftr__horizon" aria-hidden="true">${hills("c")}</div>
      <div class="wrap wrap--wide">
        <div class="ftr__top">
          <h2 class="ftr__title" data-split>${md(f.title || "Eat with the season.")}</h2>
          <div class="ftr__order">
            <p class="eyebrow">Next-day across Cairo</p>
            <p class="ftr__cut">Order within <b data-cutoff>${FV.cutoffText ? FV.cutoffText() : ""}</b> and it arrives tomorrow — cold, graded, ready for the table.</p>
            ${f.note ? `<p class="ftr__note">${esc(f.note)}</p>` : ""}
            <div class="row"><a class="btn btn--olive btn--sm" href="products.html">Shop the market<span class="btn__ic">${I.arrow}</span></a>${c.whatsapp ? `<a class="btn btn--ghost-light btn--sm" href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp us<span class="btn__ic">${I.whatsapp}</span></a>` : ""}</div>
          </div>
        </div>
        <div class="ftr__cols">
          <div class="ftr__brand">
            <img src="assets/img/logo-cream-sm.png" srcset="assets/img/logo-cream-sm.png 1x, assets/img/logo-cream.png 2x" alt="${esc(SETTINGS.storeName)}" width="86" height="56" loading="lazy">
            <p>${esc(f.blurb || "")}</p>
            <div class="ftr__contact">${c.phone ? `<a href="tel:${esc(c.phone.replace(/\s/g, ""))}">${I.phone}<span>${esc(c.phone)}</span></a>` : ""}${c.email ? `<a href="mailto:${esc(c.email)}">${I.mail}<span>${esc(c.email)}</span></a>` : ""}</div>
          </div>
          ${cols}
        </div>
        <div class="ftr__bottom">
          <span>© ${new Date().getFullYear()} ${esc(SETTINGS.storeName)} · ${esc(c.city || "Cairo, Egypt")}</span>
          <div class="pay-row" aria-label="Accepted payment methods">${PAY_MARKS}${PAY.cod}</div>
          <div class="ftr__social">${s.instagram ? `<a href="${esc(s.instagram)}" aria-label="Instagram" target="_blank" rel="noopener">${I.instagram}</a>` : ""}${s.facebook ? `<a href="${esc(s.facebook)}" aria-label="Facebook" target="_blank" rel="noopener">${I.facebook}</a>` : ""}${s.tiktok ? `<a href="${esc(s.tiktok)}" aria-label="TikTok" target="_blank" rel="noopener">${I.tiktok}</a>` : ""}</div>
          <a class="admin-link" href="admin/index.html">${I.gear} Store admin</a>
        </div>
      </div>
      <div class="ftr__mega" aria-hidden="true"><div class="ftr__mega-logo" data-parallax="-12"></div></div>
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
    <div class="toasts" id="toastWrap" aria-live="polite" aria-atomic="false"></div>
    <nav class="tabbar" aria-label="Quick navigation">
      <a href="index.html" data-tab="index" aria-label="Home">${I.home}</a>
      <a href="products.html" data-tab="products" aria-label="Shop">${I.grid}</a>
      <button id="tabSearch" aria-label="Search">${I.search}</button>
      <a href="wishlist.html" data-tab="wishlist" aria-label="Wishlist">${I.heart}</a>
      <button id="tabCart" aria-label="Cart">${I.bag}<span class="badge-count" id="tabCartCount" data-n="0" aria-hidden="true"></span></button>
    </nav>`;
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
    if (it.noPhoto) return `<div class="cline__img media--herb">${herbSVG(it.slug)}</div>`;
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
      body.innerHTML = `<div class="empty"><div class="empty__art">${herbSVG("sprout")}</div><h3>Your basket is empty.</h3><p>The season is waiting — start with a best seller.</p><a class="btn btn--sm" href="products.html" style="margin-top:1.2rem">Browse the market<span class="btn__ic">${I.arrow}</span></a></div>`;
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
    ["#cartCount", "#tabCartCount"].forEach((s) => { const el = $(s); if (el) { el.dataset.n = c; el.classList.toggle("show", c > 0); if (lastCount != null && c > lastCount && window.FVMotion) window.FVMotion.bump(el); } });
    lastCount = c;
    $("#cartBtn") && $("#cartBtn").setAttribute("aria-label", label);
    $("#tabCart") && $("#tabCart").setAttribute("aria-label", label);
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
      ...ps.map((p) => `<a class="search__row" href="product.html?slug=${p.slug}">${p.noPhoto ? `<span class="search__herb media--herb">${herbSVG(p.slug)}</span>` : `<img src="${isCustomImg(p.image) ? p.image : FV.thumb(p.slug)}" alt="" loading="lazy">`}<span><strong>${esc(p.name)}</strong><em>${esc(originShort(p.origin))} · ${money(cardPrice(p).value)} ${cardPrice(p).per}</em></span></a>`),
      ...bs.map((b) => `<a class="search__row" href="product.html?box=${b.slug}"><img src="${FV.thumb(b.image)}" alt="" loading="lazy"><span><strong>${esc(b.name)}</strong><em>Box · from ${money(Math.min(...b.tiers.map((t) => t.price)))}</em></span></a>`),
      ...as.map((a) => `<a class="search__row" href="article.html?slug=${a.slug}"><img src="${FV.thumb(a.image)}" alt="" loading="lazy"><span><strong>${esc(a.title)}</strong><em>Journal · ${esc(a.read)}</em></span></a>`),
    ].join("") + `<a class="search__all" href="products.html?q=${encodeURIComponent(q)}">See all results for “${esc(q)}” ${I.arrow}</a>`;
  }

  /* ------------------------------------------------------------------ *
   * Card renderers (shared by sections + pages)
   * ------------------------------------------------------------------ */
  function topLabel(p) {
    const b = p.badges || [], c = p.collections || [];
    if (b.includes("export")) return "Export-grade";
    if (b.includes("organic")) return "Organic";
    if (c.includes("best-sellers")) return "Bestseller";
    if (b.includes("seasonal")) return "In season";
    return p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : "Fresh Valley";
  }
  FV.topLabel = topLabel;
  function flag(p) {
    if (FV.soldOut(p)) return `<span class="chip chip--forest pcard__tag">Sold out</span>`;
    if (p.compareAt && +p.compareAt > cardPrice(p).value) return `<span class="chip chip--pom pcard__tag">−${Math.round((1 - cardPrice(p).value / +p.compareAt) * 100)}%</span>`;
    if (!isYearRound(p) && seasonMonths(p.season).includes(new Date().getMonth())) return `<span class="chip chip--glass pcard__tag" data-months="${seasonMonths(p.season).join(",")}">${I.leaf}<span>In season</span></span>`;
    if ((p.collections || []).includes("best-sellers")) return `<span class="chip chip--glass pcard__tag">${I.leaf} Bestseller</span>`;
    return "";
  }
  const seasonLabel = (p) => isYearRound(p) ? "All year" : String(p.season || "").replace(/\s*[–—-]\s*/, "–");
  FV.seasonLabel = seasonLabel;
  FV.picture = function (slug, sizes, alt, opt) {
    opt = opt || {};
    if (isCustomImg(slug)) return `<img src="${esc(slug)}" alt="${esc(alt || "")}" loading="${opt.eager ? "eager" : "lazy"}" decoding="async">`;
    return `<picture><source type="image/webp" srcset="${FV.webp(FV.thumb(slug))} 432w, ${FV.webp(FV.img(slug))} 800w" sizes="${sizes}"><img src="${FV.thumb(slug)}" srcset="${FV.thumb(slug)} 432w, ${FV.img(slug)} 800w" sizes="${sizes}" alt="${esc(alt || "")}" loading="${opt.eager ? "eager" : "lazy"}" decoding="async" width="432" height="540"></picture>`;
  };
  /* Product card — a produce tag: photo (or the herb, drawn), a tear-off
     line, then where it grew and when it is in season. */
  FV.productCardHTML = function (p) {
    const cp = cardPrice(p), sold = FV.soldOut(p);
    const wishB = `<button class="pcard__wish" data-wish="${p.slug}" aria-label="Save ${esc(p.name)}" aria-pressed="false">${I.heart}</button>`;
    const addB = sold ? "" : `<button class="pcard__add" data-add="${p.slug}" aria-label="Add ${esc(p.name)} to basket">${I.plus}</button>`;
    const media = p.noPhoto
      ? `<div class="pcard__media media--herb">${herbSVG(p.slug)}${flag(p)}${wishB}${addB}</div>`
      : `<div class="pcard__media">${FV.picture(isCustomImg(p.image) ? p.image : p.slug, "(max-width:640px) 46vw, (max-width:1180px) 30vw, 300px", p.name)}${flag(p)}${wishB}${addB}</div>`;
    const cmp = p.compareAt && +p.compareAt > cp.value ? ` <s class="was">${money(+p.compareAt)}</s>` : "";
    return `<article class="pcard${sold ? " pcard--sold" : ""}" data-reveal>
      ${media}
      <div class="pcard__body">
        <div class="pcard__meta"><span class="pcard__origin">${I.pin}${esc(originShort(p.origin))}</span><span class="pcard__season">${esc(seasonLabel(p))}</span></div>
        <h3 class="pcard__name"><a href="product.html?slug=${p.slug}">${esc(p.name)}</a></h3>
        <div class="pcard__price">${money(cp.value)} <small>${cp.per}</small>${cmp}</div>
      </div>
    </article>`;
  };
  FV.boxCardHTML = function (b) {
    const from = Math.min(...b.tiers.map((t) => t.price));
    const tag = b.slug === "hosting-box" ? "Most gifted" : ((b.collections || []).includes("best-sellers") ? "Bestseller" : ((b.collections || []).includes("seasonal") ? "Limited" : ((b.collections || []).includes("organic-reserve") ? "Reserve" : "")));
    return `<article class="bcard" data-reveal>
      <div class="bcard__media">${FV.picture(b.image, "(max-width:640px) 92vw, (max-width:1180px) 46vw, 320px", b.name)}${tag ? `<span class="chip chip--olive bcard__tag">${b.slug === "hosting-box" ? I.gift : I.leaf} ${tag}</span>` : ""}</div>
      <div class="bcard__body">
        <h3 class="bcard__name"><a href="product.html?box=${b.slug}">${esc(b.name)}</a></h3>
        <p class="bcard__tagline">${esc(b.tagline)}</p>
        <div class="bcard__foot">
          <div class="bcard__price"><small>From</small>${money(from)}</div>
          <span class="bcard__go" aria-hidden="true">${I.arrowUR}</span>
        </div>
      </div>
    </article>`;
  };
  FV.articleCardHTML = function (a, row) {
    const media = `<div class="acard__media" data-clip>${FV.picture(a.image, row ? "(max-width:960px) 92vw, 460px" : "(max-width:960px) 92vw, 420px", "")}<span class="chip chip--glass">${esc(a.category)}</span></div>`;
    return `<article class="acard${row ? " acard--row" : ""}" data-reveal>
      ${media}
      <div class="acard__body">
        <span class="acard__meta">${esc(a.date)} · ${esc(a.read)}</span>
        <h3><a href="article.html?slug=${a.slug}">${esc(a.title)}</a></h3>
        <p>${esc(a.excerpt)}</p>
      </div>
    </article>`;
  };

  /* ------------------------------------------------------------------ *
   * Motion bridges (v3 API names kept)
   * ------------------------------------------------------------------ */
  /* Quiet reveal — one soft fade-up as things scroll into view. No
     libraries; content that arrives later is picked up automatically. */
  const RV_SEL = "[data-reveal], [data-stagger], [data-fan], [data-clip], [data-split]";
  let rvIO = null;
  FV.reveal = function (root) {
    root = root || document;
    const els = Array.from(root.querySelectorAll ? root.querySelectorAll(RV_SEL) : []);
    if (root.matches && root.matches(RV_SEL)) els.push(root);
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((e) => e.classList.add("is-in")); return; }
    if (!rvIO) rvIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); rvIO.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    els.forEach((e) => { if (!e.classList.contains("is-in")) rvIO.observe(e); });
  };
  FV.observeReveals = FV.reveal;
  FV.observeCounts = FV.reveal;
  if ("MutationObserver" in window) new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) FV.reveal(n); }))).observe(document.documentElement, { childList: true, subtree: true });
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
  function navIndicator() {
    const nav = $(".nav"); if (!nav) return;
    const pill = $(".nav__pill", nav), hov = $(".nav__hover", nav);
    const place = (el, a) => { el.style.width = a.offsetWidth + "px"; el.style.transform = "translateX(" + a.offsetLeft + "px)"; el.style.opacity = 1; };
    const cur = $("a[aria-current]", nav);
    const set = () => { if (cur) place(pill, cur); };
    set();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(set);
    window.addEventListener("resize", set);
    $$("a", nav).forEach((a) => a.addEventListener("pointerenter", () => { if (a !== cur) place(hov, a); else hov.style.opacity = 0; }));
    nav.addEventListener("pointerleave", () => { hov.style.opacity = 0; });
  }
  function wire() {
    const header = $("#siteHeader");
    const ann = $(".announce");
    let lastY = window.scrollY, annH = ann ? ann.offsetHeight : 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (header) {
        header.classList.toggle("is-top", y < 12);
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
    navIndicator();

    $("#cartBtn") && $("#cartBtn").addEventListener("click", openCart);
    $("#tabCart") && $("#tabCart").addEventListener("click", openCart);
    $("#menuBtn") && $("#menuBtn").addEventListener("click", openMenu);
    $("#searchBtn") && $("#searchBtn").addEventListener("click", openSearch);
    $("#tabSearch") && $("#tabSearch").addEventListener("click", openSearch);
    $("#scrim") && $("#scrim").addEventListener("click", closeAll);
    $("#searchOverlay") && $("#searchOverlay").addEventListener("click", (e) => { if (e.target.id === "searchOverlay") closeAll(); });
    $$("[data-close]").forEach((b) => b.addEventListener("click", closeAll));
    $$("#menu a").forEach((a) => a.addEventListener("click", () => { hide($("#menu")); lockScroll(false); openPanel = null; }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openPanel) closeAll(); trap(e); if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !openPanel && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName)) { e.preventDefault(); openSearch(); } });
    const pg = page();
    $$(".tabbar [data-tab]").forEach((a) => { if (a.dataset.tab === pg) a.setAttribute("aria-current", "page"); });

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
   * Arrival — the first page of a visit opens with a sunrise over the
   * valley (markup in each page, styles.css › "Arrival"). It leaves once
   * the page is ready and the sun is up; the hero intro then plays.
   * ------------------------------------------------------------------ */
  function arrive() {
    const h = document.documentElement, L = document.getElementById("fvLoader");
    const drop = () => { const el = document.getElementById("fvLoader"); if (el) el.remove(); };
    if (!h.classList.contains("fv-intro")) { drop(); return; }
    if (!L || h.classList.contains("fv-go")) { h.classList.add("fv-go"); setTimeout(drop, 900); return; }
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 450))]) : Promise.resolve();
    fonts.then(() => setTimeout(() => { h.classList.add("fv-go"); setTimeout(drop, 1000); }, Math.max(0, 1250 - performance.now())));
  }
  addEventListener("pageshow", (e) => { if (e.persisted) { document.documentElement.classList.add("fv-go"); const el = document.getElementById("fvLoader"); if (el) el.remove(); } });

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    if (ADMIN_MODE || !document.getElementById("fv-header")) {
      FV.booted = true;
      arrive();
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
    const cut = () => $$("[data-cutoff]").forEach((el) => { el.textContent = FV.cutoffText(); });
    cut(); setInterval(cut, 30000);
    FV.reveal(document);
    const bell = () => { const n = FV.alerts.unread(), el = $("#acctCount"); if (el) { el.dataset.n = n; el.classList.toggle("show", n > 0); } const a = $("#acctLink"); if (a) a.setAttribute("aria-label", n ? "Account, " + n + " new alert" + (n > 1 ? "s" : "") : "Account"); };
    document.addEventListener("fv:notice", bell);
    FV.checkStock(); bell();
    FV.booted = true;
    arrive();
    document.dispatchEvent(new CustomEvent("fv:ready"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
