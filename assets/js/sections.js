/* =====================================================================
   FRESH VALLEY — Section renderers + schema (the theme engine)
   Pure string renderers: the storefront renders pages from FVTheme, the
   admin theme editor builds its forms from SCHEMA and previews drafts,
   and _build/bake.js pre-renders the defaults into the HTML for SEO.
   ===================================================================== */
window.FVSections = (function () {
  "use strict";
  const FV = window.FV, T = window.FVTheme, D = FV.data;
  const esc = FV.esc, I = FV.icon;
  const list = (s, sep) => String(s || "").split(sep || "|").map((x) => x.trim()).filter(Boolean);

  /* ------------------------------------------------------------------ *
   * Botanical line-art — echoes the pressed-leaf wrapping paper
   * ------------------------------------------------------------------ */
  function citrusPaths() {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      d += `M${(100 + 10 * c).toFixed(1)} ${(100 + 10 * s).toFixed(1)}L${(100 + 64 * c).toFixed(1)} ${(100 + 64 * s).toFixed(1)}`;
    }
    return `<circle cx="100" cy="100" r="84"/><circle cx="100" cy="100" r="72"/><circle cx="100" cy="100" r="8"/><path d="${d}"/>`;
  }
  const P = {
    sprig: '<path d="M100 255C98 190 104 120 96 10"/><path d="M99 222c-18-4-34-16-42-32 16-1 32 8 42 24"/><path d="M100 196c17-5 31-18 38-35-16 0-30 11-38 27"/><path d="M99 168c-19-3-35-15-44-31 17-2 33 7 43 23"/><path d="M100 140c17-5 31-18 38-35-16 0-30 11-38 27"/><path d="M98 112c-18-3-33-14-41-29 16-2 31 6 40 21"/><path d="M99 86c15-5 27-16 33-31-14 1-26 10-33 24"/><path d="M97 60c-15-3-27-12-34-25 13-1 26 6 33 18"/><path d="M97 36c12-4 21-12 26-24-11 1-20 8-26 18"/>',
    leaf: '<path d="M30 175C45 95 105 40 178 26c-6 76-58 138-148 149Z"/><path d="M30 175C75 125 120 80 178 26"/><path d="M62 142c4-18 3-34-2-48M86 118c7-18 8-37 4-54M110 95c9-15 12-32 11-48M134 72c9-12 14-25 15-39"/><path d="M62 142c17 1 33-3 47-11M86 118c19 1 36-4 51-13M110 95c16 0 31-5 44-13M134 72c12-1 23-5 33-12"/><path d="M30 175l-16 16"/>',
    fig: '<path d="M100 40c-4 14-2 24 4 30"/><path d="M104 70c30 6 52 40 50 78-2 30-26 46-54 46s-52-16-54-46c-2-38 20-72 50-78 3-1 5-1 8 0Z"/><path d="M100 78c-6 30-8 70 0 110"/><path d="M104 58c10-12 28-16 44-10-8 14-26 20-44 10Z"/><path d="M70 150c8 10 20 16 30 16"/>',
    tomato: '<path d="M100 64c-40 0-72 26-72 64s32 60 72 60 72-22 72-60-32-64-72-64Z"/><path d="M100 70 90 52l-20 6 12-14-14-12 20 0 10-16 6 18 20-6-12 16 16 10-20 2Z"/><path d="M100 50V26"/><path d="M58 112c4-14 14-24 28-28"/>',
    strawberry: '<path d="M100 186C66 160 44 128 46 96c2-24 22-36 54-36s52 12 54 36c2 32-20 64-54 90Z"/><path d="M100 62c-10-14-26-18-40-14 8 10 22 16 40 14Zm0 0c10-14 26-18 40-14-8 10-22 16-40 14Zm0 0V36"/><path d="M78 96l2 5M100 92v5M122 96l-2 5M70 122l2 5M92 118l1 5M114 118l-1 5M130 122l-2 5M84 146l2 5M108 146l-1 5M98 168v4"/>',
    herbs: '<path d="M100 250c-2-50-18-110-54-190"/><path d="M100 250c2-60 4-120 2-200"/><path d="M100 250c4-50 22-110 56-176"/><path d="M62 104c-18-2-30-12-36-26 16-1 28 8 36 22M54 86c10-12 12-26 8-40-12 8-14 22-10 36M74 140c-16 2-30-6-38-18 14-4 28 2 38 14"/><path d="M101 90c-14-6-22-18-22-32 14 4 22 16 22 30M103 128c14-6 22-18 22-32-14 4-22 16-22 30M102 60c10-8 14-20 12-32-10 6-14 18-12 30"/><path d="M140 108c16-4 26-16 28-30-14 2-24 12-28 26M130 140c16 0 30-8 36-22-14-2-28 6-36 20M148 80c-4-14 0-28 10-36 4 12 0 26-8 36"/><path d="M82 226c12 6 26 6 38 0M84 238c12 5 24 5 36 0"/>',
  };
  /* Herb specimens (drawn in app.js) replace the old corner line-art. Legacy
     art keys saved in older themes map onto a herb. */
  const HERBS = ["mint", "basil", "coriander", "rosemary", "dill"];
  const LEGACY_ART = { sprig: "rosemary", leaf: "basil", citrus: "mint", herbs: "coriander", bouquet: "dill", fig: "sprout", tomato: "sprout", strawberry: "sprout" };
  const herbKind = (v) => (HERBS.includes(v) || v === "sprout" ? v : LEGACY_ART[v] || "");
  const trio = () => `<svg class="art herb herb--trio" viewBox="0 0 440 210" aria-hidden="true"><g transform="translate(0 14) scale(.95)"><g class="herb__sway">${FV.herbPaths("mint")}</g></g><g transform="translate(138 0) scale(1.02)"><g class="herb__sway" style="--sw:5.2s">${FV.herbPaths("dill")}</g></g><g transform="translate(280 16) scale(.94)"><g class="herb__sway" style="--sw:4.4s">${FV.herbPaths("basil")}</g></g></svg>`;
  const ART = {
    sprig: FV.herbSVG("rosemary"), leaf: FV.herbSVG("basil"), citrus: FV.herbSVG("mint"), fig: FV.herbSVG("sprout"),
    tomato: FV.herbSVG("sprout"), strawberry: FV.herbSVG("sprout"), herbs: trio(), bouquet: FV.herbSVG("dill"),
    mint: FV.herbSVG("mint"), basil: FV.herbSVG("basil"), coriander: FV.herbSVG("coriander"), rosemary: FV.herbSVG("rosemary"), dill: FV.herbSVG("dill"), sprout: FV.herbSVG("sprout"),
    // legacy line-art kept for older saved content (empty states etc.)
    oldSprig: `<svg class="art" viewBox="0 0 200 260" aria-hidden="true">${P.sprig}</svg>`,
    oldLeaf: `<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${P.leaf}</svg>`,
  };
  void citrusPaths;

  /* ------------------------------------------------------------------ *
   * Egypt, the Nile and the growing regions (equirectangular, lon/lat)
   * ------------------------------------------------------------------ */
  const GEO = (function () {
    const X0 = 24.6, Y0 = 31.95, KX = 37.4, KY = 42;
    const pr = (ll) => [+((ll[0] - X0) * KX).toFixed(1), +((Y0 - ll[1]) * KY).toFixed(1)];
    const poly = (pts) => pts.map(pr).map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join("");
    const curve = (pts) => { // smooth line through points
      const P = pts.map(pr); let d = `M${P[0][0]} ${P[0][1]}`;
      for (let i = 0; i < P.length - 1; i++) { const a = P[i - 1] || P[i], b = P[i], c = P[i + 1], e = P[i + 2] || c; d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0]} ${c[1]}`; }
      return d;
    };
    const LAND = [[25.15, 31.57], [25.92, 31.61], [27.23, 31.35], [28.95, 30.83], [29.92, 31.2], [30.07, 31.32], [30.37, 31.47], [31.05, 31.58], [31.85, 31.52], [32.3, 31.27], [33.1, 31.15], [33.8, 31.13], [34.22, 31.3], [34.9, 29.49], [34.67, 29.03], [34.52, 28.5], [34.25, 27.73], [33.6, 28.24], [33.1, 29.05], [32.55, 29.97], [32.35, 29.6], [32.65, 29.1], [33.1, 28.35], [33.8, 27.25], [33.93, 26.75], [34.28, 26.1], [34.9, 25.07], [35.47, 23.95], [35.6, 23.13], [36.6, 22.2], [36.88, 22.0], [25.0, 22.0], [25.0, 31.0]];
    const NILE = [[31.4, 22.0], [31.62, 22.55], [32.2, 23.3], [32.9, 24.09], [32.93, 24.47], [32.87, 24.98], [32.55, 25.29], [32.64, 25.69], [32.73, 26.16], [32.24, 26.05], [31.7, 26.56], [31.18, 27.18], [30.75, 28.1], [30.95, 28.6], [31.1, 29.07], [31.23, 30.04]];
    const ROSETTA = [[31.23, 30.04], [31.02, 30.32], [30.78, 30.7], [30.55, 31.02], [30.37, 31.47]];
    const DAMIETTA = [[31.23, 30.04], [31.3, 30.42], [31.45, 30.82], [31.64, 31.2], [31.85, 31.52]];
    const REGIONS = [
      { name: "Nubaria", ll: [29.95, 30.55], note: "Reclaimed desert west of the Delta — clean, even vegetables." },
      { name: "Beheira", ll: [30.45, 30.88], note: "The western Delta — citrus, stone fruit and sweet basil." },
      { name: "Qalyubia", ll: [31.18, 30.46], note: "Just north of Cairo — strawberries and the tenderest herbs." },
      { name: "Sharqia", ll: [31.75, 30.7], note: "The eastern Delta — melons in the heat of summer." },
      { name: "Ismailia", ll: [32.27, 30.6], note: "Canal-side orchards — Egypt's famous mango." },
      { name: "Minya", ll: [30.75, 28.1], note: "Middle Egypt — early grapes and firm garlic." },
      { name: "Qena", ll: [32.73, 26.16], note: "Upper Egypt, where the Nile bends — bananas." },
      { name: "Siwa", ll: [25.52, 29.2], note: "The western oasis — Medjool dates, sun-dried slowly." },
    ];
    return { pr, land: poly(LAND) + "Z", nile: curve(NILE), rosetta: curve(ROSETTA), damietta: curve(DAMIETTA), regions: REGIONS, cairo: pr([31.24, 30.04]) };
  })();
  const regionOf = (p) => { const o = FV.originShort(p.origin).toLowerCase(); return GEO.regions.find((r) => r.name.toLowerCase() === o) || null; };
  function mapSVG(opt) {
    opt = opt || {};
    const pins = GEO.regions.map((r, i) => {
      const [x, y] = GEO.pr(r.ll), act = opt.active === r.name;
      return `<g class="map__pin${act ? " is-on" : ""}" data-region="${esc(r.name)}" transform="translate(${x} ${y})"><circle class="map__pulse" r="13"/><circle class="map__dot" r="6.5"/><text class="map__num" y="2.6">${i + 1}</text><text class="map__label" x="${r.ll[0] < 30.3 ? -12 : 12}" y="4" text-anchor="${r.ll[0] < 30.3 ? "end" : "start"}">${esc(r.name)}</text></g>`;
    }).join("");
    const [cx, cy] = GEO.cairo;
    return `<svg class="map" viewBox="0 -26 470 456" role="img" aria-label="${esc(opt.label || "Map of Egypt: the Nile and the regions where our produce is grown")}">
      <text class="map__sea" x="104" y="-8">Mediterranean Sea</text>
      <text class="map__sea" x="392" y="236" transform="rotate(58 392 236)">Red Sea</text>
      <path class="map__land" d="${GEO.land}"/>
      <g class="map__river" data-draw><path d="${GEO.nile}"/><path d="${GEO.rosetta}"/><path d="${GEO.damietta}"/></g>
      <text class="map__nile-lab" x="${GEO.pr([31.95, 27.2])[0]}" y="${GEO.pr([31.95, 27.2])[1]}">The Nile</text>
      <g class="map__cairo" transform="translate(${cx} ${cy})"><rect x="-4.5" y="-4.5" width="9" height="9" rx="1.5" transform="rotate(45)"/><text x="10" y="14">Cairo · graded here</text></g>
      <g class="map__pins">${pins}</g>
    </svg>`;
  }

  /* The month that is "now" — sections render it for the bake, and
     behave() re-applies it in the visitor's browser. */
  function seasonNow(month) {
    const m = month == null ? new Date().getMonth() : month;
    const peak = D.products.filter((p) => !FV.isYearRound(p) && FV.inSeason(p, m));
    const last = peak.filter((p) => !FV.inSeason(p, (m + 1) % 12));
    const next = D.products.filter((p) => !FV.isYearRound(p) && !FV.inSeason(p, m) && FV.inSeason(p, (m + 1) % 12));
    return { m, peak, last, next };
  }
  const nameList = (ps) => ps.map((p) => `<a href="product.html?slug=${p.slug}">${esc(p.name)}</a>`).reduce((s, a, i, arr) => s + (i ? (i === arr.length - 1 ? " and " : ", ") : "") + a, "");
  function harvestNote(month) {
    const n = seasonNow(month), mon = FV.MONTHS_LONG[n.m];
    if (n.peak.length) return `<span class="harvest-ic" aria-hidden="true">${I("leaf")}</span><span><b>${mon} in the valley:</b> ${nameList(n.peak.slice(0, 3))} ${n.peak.length > 1 ? "are" : "is"} at ${n.last.length === n.peak.length ? "the end of the season — last weeks" : "their peak"}.</span>`;
    if (n.next.length) return `<span class="harvest-ic" aria-hidden="true">${I("leaf")}</span><span><b>${mon} in the valley:</b> between harvests — ${nameList(n.next.slice(0, 2))} arrive${n.next.length > 1 ? "" : "s"} next month.</span>`;
    return `<span class="harvest-ic" aria-hidden="true">${I("leaf")}</span><span><b>${mon} in the valley:</b> the all-year staples are at their best.</span>`;
  }
  const MARK = '<svg class="mq-mark" viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M5 35C5 16 17 5 35 5c0 19-11 30-30 30Z"/><path d="M5 35 22 18" stroke="var(--mq-bg, #19291C)" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>';
  const SWASH = '<svg viewBox="0 0 200 22" preserveAspectRatio="none" aria-hidden="true" data-draw><path d="M4 15C52 6 118 4 196 9"/><path d="M40 19c40-5 84-6 128-3"/></svg>';

  /* ------------------------------------------------------------------ *
   * Text + images
   * ------------------------------------------------------------------ */
  function md(s) {
    return esc(s).replace(/\*([^*]+)\*/g, '<em class="i">$1</em>').replace(/~([^~]+)~/g, (m, w) => `<span class="swash">${w}${SWASH}</span>`).replace(/\n/g, "<br>");
  }
  function paras(s, cls) {
    return String(s || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => {
      const lines = p.split("\n");
      if (lines.every((l) => /^\s*-\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${linkify(md(l.replace(/^\s*-\s+/, "")))}</li>`).join("")}</ul>`;
      return `<p${cls ? ` class="${cls}"` : ""}>${linkify(md(p))}</p>`;
    }).join("");
  }
  function linkify(h) {
    return h.replace(/([a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,})/gi, '<a href="mailto:$1">$1</a>')
      .replace(/\b(contact page)\b/gi, '<a href="contact.html">$1</a>')
      .replace(/\b(Terms of Use)\b(?![^<]*<\/a>)/g, '<a href="terms.html">$1</a>');
  }
  const BANNERS = ["delivery-van", "door-delivery", "home-delivery", "juice-bottles", "packaging", "staff-shirt"];
  function img(ref, o) {
    o = o || {};
    const alt = esc(o.alt || ""), load = o.eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"', attrs = o.attrs || "";
    if (!ref) return "";
    if (ref === "hero-portrait") {
      return `<picture><source type="image/webp" srcset="assets/img/hero/hero-portrait-700.webp 700w, assets/img/hero/hero-portrait-1000.webp 1000w" sizes="${o.sizes || "(max-width: 960px) 92vw, 42vw"}"><img src="assets/img/hero/hero-portrait-1000.jpg" srcset="assets/img/hero/hero-portrait-700.jpg 700w, assets/img/hero/hero-portrait-1000.jpg 1000w" sizes="${o.sizes || "(max-width: 960px) 92vw, 42vw"}" alt="${alt}" ${load} decoding="async" width="1000" height="1333" ${attrs}></picture>`;
    }
    if (ref === "hero") {
      return `<picture><source media="(max-width: 700px)" type="image/webp" srcset="assets/img/hero/hero-portrait-700.webp 700w, assets/img/hero/hero-portrait-1000.webp 1000w" sizes="100vw"><source media="(max-width: 700px)" srcset="assets/img/hero/hero-portrait-700.jpg 700w, assets/img/hero/hero-portrait-1000.jpg 1000w" sizes="100vw"><source type="image/webp" srcset="assets/img/hero/hero-800.webp 800w, assets/img/hero/hero-1200.webp 1200w, assets/img/hero/hero-1800.webp 1800w, assets/img/hero/hero-2400.webp 2400w" sizes="${o.sizes || "100vw"}"><img src="assets/img/hero/hero-1800.jpg" srcset="assets/img/hero/hero-800.jpg 800w, assets/img/hero/hero-1200.jpg 1200w, assets/img/hero/hero-1800.jpg 1800w, assets/img/hero/hero-2400.jpg 2400w" sizes="${o.sizes || "100vw"}" alt="${alt}" ${load} decoding="async" width="2400" height="982" ${attrs}></picture>`;
    }
    if (ref.indexOf("banner:") === 0) {
      const k = ref.slice(7).replace(/[^a-z0-9-]/gi, "");
      return `<picture><source type="image/webp" srcset="assets/img/banners/sm/${k}.webp 540w, assets/img/banners/${k}.webp 1500w" sizes="${o.sizes || "(max-width: 960px) 100vw, 60vw"}"><img src="assets/img/banners/${k}.jpg" srcset="assets/img/banners/sm/${k}.jpg 540w, assets/img/banners/${k}.jpg 1500w" sizes="${o.sizes || "(max-width: 960px) 100vw, 60vw"}" alt="${alt}" ${load} decoding="async" width="1500" height="779" ${attrs}></picture>`;
    }
    if (ref.indexOf("art:") === 0) return ART[ref.slice(4)] || ART.sprig;
    if (FV.isCustomImg(ref)) return `<img src="${esc(ref)}" alt="${alt}" ${load} decoding="async" ${attrs}>`;
    return `<picture><source type="image/webp" srcset="${FV.webp(FV.thumb(ref))} 540w, ${FV.webp(FV.img(ref))} 1000w" sizes="${o.sizes || "(max-width: 960px) 90vw, 40vw"}"><img src="${FV.thumb(ref)}" srcset="${FV.thumb(ref)} 540w, ${FV.img(ref)} 1000w" sizes="${o.sizes || "(max-width: 960px) 90vw, 40vw"}" alt="${alt}" ${load} decoding="async" width="1000" height="1000" ${attrs}></picture>`;
  }

  /* ------------------------------------------------------------------ *
   * Shared bits
   * ------------------------------------------------------------------ */
  const band = (b) => "band--" + (b || "paper");
  const attrs = (s, extra) => `id="${esc(s.id)}" data-section-id="${esc(s.id)}" data-section-type="${esc(s.type)}"${extra ? " " + extra : ""}`;
  const eyebrow = (t) => t ? `<p class="eyebrow">${md(t)}</p>` : "";
  function btn(label, link, cls, magnetic) {
    if (!label) return "";
    return `<a class="btn ${cls || ""}" href="${esc(link || "#")}"${magnetic ? " data-magnetic" : ""}>${esc(label)}<span class="btn__ic">${I("arrow")}</span></a>`;
  }
  const btnDark = (st, dark) => btn(st.cta_label, st.cta_link, dark ? "btn--olive" : "", true) + btn(st.cta2_label, st.cta2_link, dark ? "btn--ghost-light" : "btn--ghost");
  function head(st, opt) {
    opt = opt || {};
    const cta = st.cta_label && !opt.noCta ? `<a class="link-u" href="${esc(st.cta_link || "#")}">${esc(st.cta_label)} ${I("arrow")}</a>` : "";
    const side = opt.side || cta;
    return `<div class="head${opt.center ? " head--center" : ""}">
      <div class="head__main">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text && !opt.noText ? `<p class="lede">${md(st.text)}</p>` : ""}</div>
      ${side ? `<div class="head__actions">${side}</div>` : ""}
    </div>`;
  }
  function productsFor(key, limit) {
    let ps;
    if (!key || key === "all") ps = D.products.slice();
    else if (["fruits", "vegetables", "herbs"].includes(key)) ps = FV.byCategory(key);
    else ps = FV.byCollection(key);
    if (key === "best-sellers" && ps.length < (limit || 12)) ps = ps.concat(FV.byCollection("essentials").filter((p) => !ps.includes(p)));
    return limit ? ps.slice(0, limit) : ps;
  }
  function countFor(key) {
    if (!key) return 0;
    if (key === "boxes") return D.boxes.length;
    if (["fruits", "vegetables", "herbs"].includes(key)) return FV.byCategory(key).length;
    return FV.byCollection(key).length;
  }
  // a valley horizon on top of a band (dark bands only)
  const horizon = (st, v) => st.horizon === false ? "" : `<div class="horizon" aria-hidden="true">${FV.hills(v || "b")}</div>`;

  /* ------------------------------------------------------------------ *
   * Renderers
   * ------------------------------------------------------------------ */
  const R = {};
  const CTX = { page: null };

  /* Hero — morning in the valley: the photograph fills the whole screen,
     the headline sits over it, herbs grow at the edges and the hills of the
     valley run across its foot into the ribbon below. */
  R.hero = (s, st) => {
    const words = list(st.words);
    const orbs = list(st.orbs, ",").slice(0, 3);
    const chips = list(st.chips);
    const chipIc = ["shield", "snow", "truck", "leaf"];
    const herbs = list(st.herbs, ",").map(herbKind).filter(Boolean).slice(0, 2);
    return `<section class="s s-hero" ${attrs(s)}>
      <div class="hero__bg">${img(st.image || "hero", { eager: true, alt: st.image_alt, sizes: "100vw" })}</div>
      <div class="hero__shade" aria-hidden="true"></div>
      <div class="wrap wrap--wide hero__inner">
        <div class="hero__head">
          ${st.badge ? `<a class="hero__badge" href="${esc(st.badge_link || "products.html")}"><span class="hero__sprout" aria-hidden="true">${FV.herbSVG("sprout")}</span>${md(st.badge)}${I("arrow")}</a>` : ""}
          <h1 class="hero__title">
            <span class="hero__orbs" aria-hidden="true">${orbs.map((o, i) => `<span class="orb" data-depth="${[0.9, 0.5, 0.7][i]}"><span class="orb__px"><span class="orb__in" data-float="${[12, 16, 10][i]}">${img(o, { sizes: "130px", attrs: 'fetchpriority="low"' })}</span></span></span>`).join("")}</span>
            <span class="line" style="--i:0"><span class="line__in">${md(st.line1)}</span></span>
            <span class="line" style="--i:1"><span class="line__in">${md(st.line2)}</span></span>
            <span class="line" style="--i:2"><span class="line__in">${md(st.line3)}${words.length ? ` <em class="i rot" data-rotate="${esc(words.join("|"))}"><span class="rot__w">${esc(words[0])}</span></em>.` : ""}</span></span>
          </h1>
        </div>
        <div class="hero__side">
          ${st.lede ? `<p class="lede">${md(st.lede)}</p>` : ""}
          <div class="hero__cta">${btn(st.cta1_label, st.cta1_link, "btn--olive btn--lg", true)}${btn(st.cta2_label, st.cta2_link, "btn--ghost-light btn--lg")}</div>
          ${st.harvest_note === false ? "" : `<p class="hero__harvest" data-harvest-note>${harvestNote()}</p>`}
        </div>
      </div>
      ${chips.length ? `<div class="hero__caption">${chips.map((c, i) => `<span class="chip chip--glass">${I(chipIc[i % 4])}${esc(c)}</span>`).join("")}</div>` : ""}
      ${herbs.map((h, i) => `<span class="hero__herb hero__herb--${i ? "r" : "l"}" aria-hidden="true">${FV.herbSVG(h)}</span>`).join("")}
      <div class="hero__hills" aria-hidden="true">${FV.hills("a")}</div>
    </section>`;
  };

  R.marquee = (s, st) => {
    const items = list(st.items);
    const unit = `<div class="marquee__item">${items.map((t) => `<span>${esc(t)}</span>${MARK}`).join("")}</div>`;
    const sp = +st.speed || 1;
    if (st.style === "cross") {
      return `<section class="s-marquee s-marquee--cross" ${attrs(s)}>
        <div class="marquee marquee--olive" data-marquee="right" data-speed="${sp * 0.8}" aria-hidden="true"><div class="marquee__track">${unit}</div></div>
        <div class="marquee marquee--brand" data-marquee data-speed="${sp}"><div class="marquee__track">${unit}</div></div>
      </section>`;
    }
    return `<section class="s-marquee" ${attrs(s)}><div class="marquee marquee--${st.style === "olive" ? "olive" : "brand"}" data-marquee data-speed="${sp}"><div class="marquee__track">${unit}</div></div></section>`;
  };

  R.categories = (s, st, blocks) => {
    const tiles = blocks.map((b) => {
      const t = b.settings || {}, n = countFor(t.count), isArt = String(t.image || "").indexOf("art:") === 0;
      return `<a class="ctile${isArt ? " ctile--art" : ""}" href="${esc(t.link || "products.html")}" data-cursor="Explore">
        ${isArt ? `<span class="ctile__art" data-draw>${img(t.image)}</span>` : img(t.image, { sizes: "(max-width: 960px) 92vw, 45vw", alt: "" })}
        ${n ? `<span class="ctile__top"><span class="ctile__count">${n} ${t.count === "boxes" ? "boxes" : "items"}</span></span>` : ""}
        <span class="ctile__body"><span><h3>${md(t.title)}</h3>${t.text ? `<p>${md(t.text)}</p>` : ""}</span><span class="ctile__go" aria-hidden="true">${I("arrowUR")}</span></span>
      </a>`;
    }).join("");
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st)}<div class="bento" data-stagger>${tiles}</div></div></section>`;
  };

  R.product_rail = (s, st) => {
    const ps = productsFor(st.collection, +st.limit || 12);
    const nav = `<div class="rail-nav"><button class="rail-btn" data-rail-prev aria-label="Previous">${I("arrowL")}</button><button class="rail-btn" data-rail-next aria-label="Next">${I("arrow")}</button></div>`;
    const cta = st.cta_label ? `<a class="link-u" href="${esc(st.cta_link || "products.html")}">${esc(st.cta_label)} ${I("arrow")}</a>` : "";
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">
      ${head(st, { side: cta + nav })}
      <div class="rail-wrap"><div class="rail" data-cursor="Drag">${ps.map(FV.productCardHTML).join("")}</div><div class="rail-progress" aria-hidden="true"><i></i></div></div>
    </div></section>`;
  };

  R.story = (s, st, blocks) => {
    return `<section class="s sec s-story band--dark" ${attrs(s, "data-story")}>${horizon(st, "b")}<div class="wrap wrap--wide"><div class="story">
      <div class="story__copy">
        ${eyebrow(st.eyebrow)}
        <h2 data-split>${md(st.title)}</h2>
        ${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}
        <div class="row">${btnDark(st, true)}</div>
        <div class="story__progress" aria-hidden="true">${blocks.map(() => "<i></i>").join("")}</div>
      </div>
      <div class="story__steps">${blocks.map((b, i) => { const t = b.settings || {}; return `<article class="step" data-reveal><div class="step__img">${img(t.image, { sizes: "(max-width: 960px) 92vw, 48vw", alt: "" })}</div><div class="step__body"><span class="step__n">${String(i + 1).padStart(2, "0")}</span><h3>${md(t.title)}</h3><p>${md(t.text)}</p></div></article>`; }).join("")}</div>
    </div></div></section>`;
  };

  R.boxes = (s, st) => {
    const slugs = list(st.boxes, ",");
    const bx = (slugs.length ? slugs.map(FV.findBox).filter(Boolean) : D.boxes);
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st)}<div class="deck${bx.length === 5 ? " deck--5" : bx.length === 3 ? " deck--3" : ""}" data-fan>${bx.map(FV.boxCardHTML).join("")}</div></div></section>`;
  };

  R.stats = (s, st, blocks) => {
    const items = blocks.map((b) => {
      const t = b.settings || {}, v = parseFloat(t.value), dec = +t.decimals || 0;
      const shown = isNaN(v) ? esc(t.value) : (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + esc(t.suffix || "");
      return `<div class="stat" data-reveal><span class="stat__n"${isNaN(v) ? "" : ` data-count="${v}" data-dec="${dec}" data-suffix="${esc(t.suffix || "")}"`}>${shown}</span><span class="stat__l">${md(t.label)}</span></div>`;
    }).join("");
    const dark = (st.band || "dark") === "dark";
    return `<section class="s sec ${band(st.band || "dark")}" ${attrs(s)}>${dark ? horizon(st, "c") : ""}<div class="wrap wrap--wide">${head(st, { noCta: true })}<div class="stats">${items}</div></div></section>`;
  };

  R.image_text = (s, st) => {
    const items = list(st.list).map((l) => { const [a, b] = l.split(/\s+—\s+/); return `<li>${I("check")}<span>${b ? `<strong>${md(a)}</strong> — ${md(b)}` : md(a)}</span></li>`; }).join("");
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide"><div class="it${st.flip ? " it--flip" : ""}">
      <div class="it__media" data-clip data-parallax-root>${img(st.image, { sizes: "(max-width: 960px) 92vw, 46vw", alt: "", attrs: 'data-parallax="6"' })}${st.chip ? `<span class="chip chip--glass">${I("leaf")}${esc(st.chip)}</span>` : ""}</div>
      <div class="it__copy">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${paras(st.text, "lede")}${items ? `<ul class="it__list" data-stagger>${items}</ul>` : ""}${st.cta_label ? `<div class="row">${btn(st.cta_label, st.cta_link, st.band === "dark" ? "btn--olive" : "")}</div>` : ""}</div>
    </div></div></section>`;
  };

  /* Harvest calendar — the farmer's planting chart: every seasonal crop on
     twelve months, with today marked. */
  R.harvest = (s, st) => {
    const rows = D.products.filter((p) => !FV.isYearRound(p)).sort((a, b) => FV.seasonMonths(a.season)[0] - FV.seasonMonths(b.season)[0]);
    const staples = D.products.filter((p) => FV.isYearRound(p));
    const now = new Date().getMonth();
    const thumb = (p) => p.noPhoto ? `<span class="hc__img media--herb">${FV.herbSVG(p.slug)}</span>` : `<span class="hc__img">${img(FV.isCustomImg(p.image) ? p.image : p.slug, { sizes: "48px", alt: "" })}</span>`;
    const row = (p, r) => {
      const ms = FV.seasonMonths(p.season), on = (i) => ms.includes(i);
      const cells = FV.MONTHS.map((_, i) => `<span class="hc__c${on(i) ? " on" : ""}${on(i) && !on((i + 11) % 12) ? " s" : ""}${on(i) && !on((i + 1) % 12) ? " e" : ""}${i === now ? " is-now" : ""}" data-m="${i}" style="--m:${i}"></span>`).join("");
      return `<li class="hc__row" data-fly-root data-months="${ms.join(",")}" style="--r:${r}">
        <a class="hc__lab" href="product.html?slug=${p.slug}">${thumb(p)}<span><strong>${esc(p.name)}</strong><small>${esc(FV.originShort(p.origin))} · ${esc(FV.seasonLabel(p))}</small></span></a>
        ${cells}
        <span class="hc__end"><span class="hc__status" data-status></span>${FV.soldOut(p) ? "" : `<button class="hc__add" type="button" data-add="${p.slug}" aria-label="Add ${esc(p.name)} to basket">${I("plus")}</button>`}</span>
        <span class="sr-only">In season ${esc(p.season)}.</span>
      </li>`;
    };
    return `<section class="s sec ${band(st.band)} s-harvest" ${attrs(s, "data-harvest")}><div class="wrap wrap--wide">
      <div class="harvest__top">${head(st, { noCta: true })}
        <div class="harvest__now" data-reveal><span class="harvest__month" data-harvest-month>${FV.MONTHS_LONG[now]}</span><p data-harvest-note>${harvestNote(now)}</p></div>
      </div>
      <div class="hc" data-reveal>
        <div class="hc__row hc__row--head" aria-hidden="true"><span class="hc__lab">The crop</span>${FV.MONTHS.map((m, i) => `<span class="hc__m${i === now ? " is-now" : ""}" data-m="${i}"><b>${m.charAt(0)}</b><i>${m.slice(1)}</i></span>`).join("")}<span class="hc__end"></span></div>
        <ul class="hc__rows" aria-label="Seasonal produce by month">${rows.map(row).join("")}</ul>
      </div>
      ${st.staples !== false && staples.length ? `<div class="harvest__staples"><p><b>Graded every week, all year:</b></p><div class="harvest__chips">${staples.map((p) => `<a class="chip" href="product.html?slug=${p.slug}">${esc(p.name)}</a>`).join("")}</div></div>` : ""}
      ${st.cta_label ? `<div class="row" style="margin-top:1.6rem">${btn(st.cta_label, st.cta_link, "btn--ghost")}</div>` : ""}
    </div></section>`;
  };

  /* Origins — the Nile valley on a map; every crop pinned to where it grows */
  R.origins = (s, st) => {
    const by = GEO.regions.map((r) => ({ r, ps: D.products.filter((p) => { const g = regionOf(p); return g && g.name === r.name; }) })).filter((x) => x.ps.length);
    const abroad = D.products.filter((p) => !regionOf(p) && !/egypt/i.test(p.origin || ""));
    const first = by.slice().sort((a, b) => b.ps.length - a.ps.length)[0];
    const active = first ? first.r.name : "";
    const item = ({ r, ps }) => `<li><button class="og__item${r.name === active ? " is-on" : ""}" type="button" data-region="${esc(r.name)}" aria-pressed="${r.name === active}">
        <span class="og__n">${GEO.regions.indexOf(r) + 1}</span>
        <span class="og__txt"><strong>${esc(r.name)}</strong><small>${esc(r.note)}</small><span class="og__crops">${ps.map((p) => esc(p.name)).join(" · ")}</span></span>
      </button></li>`;
    return `<section class="s sec ${band(st.band)} s-origins" ${attrs(s, "data-origins")}><div class="wrap wrap--wide">
      ${head(st, { noCta: true })}
      <div class="og">
        <div class="og__map" data-reveal="scale">${mapSVG({ active })}</div>
        <div class="og__side">
          <ul class="og__list" data-stagger>${by.map(item).join("")}</ul>
          ${abroad.length ? `<p class="og__abroad">${I("leaf")}<span>A few things Egypt can't grow well — ${abroad.map((p) => esc(p.name.toLowerCase())).join(", ")} — come from select growers abroad, and are graded here in Cairo like everything else.</span></p>` : ""}
          ${st.cta_label ? `<div class="row">${btn(st.cta_label, st.cta_link, "btn--ghost")}</div>` : ""}
        </div>
      </div>
    </div></section>`;
  };

  /* Herb garden — the five herbs, each drawn as itself, cut to order */
  R.herbs = (s, st) => {
    const hs = D.products.filter((p) => p.category === "herbs");
    const card = (p) => {
      const info = FV.herbInfo(p.slug) || {}, cp = FV.cardPrice(p), sold = FV.soldOut(p);
      const pic = p.noPhoto ? FV.herbSVG(p.slug) : img(FV.isCustomImg(p.image) ? p.image : p.slug, { sizes: "260px", alt: "" });
      return `<article class="herb-card${p.noPhoto ? "" : " herb-card--photo"}">
        <div class="herb-card__glass">${pic}</div>
        <div class="herb-card__label">
          ${info.latin ? `<span class="herb-card__latin">${esc(info.latin)}</span>` : ""}
          <h3><a href="product.html?slug=${p.slug}">${esc(p.name)}</a></h3>
          <p>${esc(FV.originShort(p.origin))}${info.note ? " · " + esc(info.note) : ""}</p>
          <div class="herb-card__buy"><span><b>${FV.money(cp.value)}</b> <small>${cp.per}</small></span>${sold ? `<span class="chip chip--forest">Sold out</span>` : `<button class="herb-card__add" type="button" data-add="${p.slug}" aria-label="Add ${esc(p.name)} to basket">${I("plus")}</button>`}</div>
        </div>
      </article>`;
    };
    return `<section class="s sec ${band(st.band)} s-herbs" ${attrs(s)}><div class="wrap wrap--wide">
      ${head(st)}
      <div class="herbs" data-stagger>${hs.map(card).join("")}</div>
    </div></section>`;
  };

  R.banner = (s, st) => `<section class="s sec s-banner" ${attrs(s)}><div class="wrap wrap--wide"><div class="banner" data-parallax-root>
      ${img(st.image, { sizes: "(max-width: 960px) 100vw, 92vw", alt: "", attrs: 'data-parallax="7"' })}
      <div class="banner__body">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}<div class="row">${btnDark(st, true)}</div></div>
    </div></div></section>`;

  R.journal = (s, st) => {
    const arts = D.articles.slice(0, +st.limit || D.articles.length);
    if (st.layout === "magazine") {
      const cats = Array.from(new Set(D.articles.map((a) => a.category)));
      const f = arts[0];
      return `<section class="s sec band--paper" ${attrs(s)}><div class="wrap wrap--wide">
        <article class="feature-post" data-reveal><a class="feature-post__media" href="article.html?slug=${f.slug}" data-cursor="Read" data-clip>${img(f.image, { sizes: "(max-width: 960px) 92vw, 60vw", alt: "" })}</a>
          <div class="feature-post__body"><span class="chip chip--olive">${esc(f.category)}</span><h2><a href="article.html?slug=${f.slug}">${esc(f.title)}</a></h2><p class="lede">${esc(f.excerpt)}</p><span class="acard__meta">${esc(f.author)} · ${esc(f.date)} · ${esc(f.read)}</span>${btn("Read the story", "article.html?slug=" + f.slug)}</div></article>
        <div class="head" style="margin-top:clamp(3rem,6vw,6rem)"><div class="head__main">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2></div>
          <div class="tabs" role="tablist" aria-label="Filter the journal" data-jtabs><button role="tab" aria-selected="true" data-cat="all">All</button>${cats.map((c) => `<button role="tab" aria-selected="false" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}<span class="tabs__ink" aria-hidden="true"></span></div></div>
        <div class="jlist" data-jlist>${arts.slice(1).map((a) => FV.articleCardHTML(a, true).replace('class="acard acard--row"', `class="acard acard--row" data-cat="${esc(a.category)}"`)).join("")}</div>
      </div></section>`;
    }
    return `<section class="s sec band--paper" ${attrs(s)}><div class="wrap wrap--wide">${head(st)}<div class="grid g-3 jgrid">${arts.map((a) => FV.articleCardHTML(a)).join("")}</div></div></section>`;
  };

  R.page_head = (s, st) => {
    const crumbTitle = (CTX.page && CTX.page.title) || String(st.title || "").replace(/[*~]/g, "");
    const kind = herbKind(st.art), info = FV.herbInfo(kind);
    return `<section class="s s-page-head${st.compact ? " s-page-head--compact" : ""}${kind ? " has-specimen" : ""}" ${attrs(s)}>
      <div class="wrap wrap--wide">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">${esc(crumbTitle)}</span></nav>
        <div class="page-head">
          <div>${eyebrow(st.eyebrow)}<h1 class="ph-title">${md(st.title)}</h1></div>
          <div class="page-head__side">${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}${st.cta_label || st.cta2_label ? `<div class="row">${btn(st.cta_label, st.cta_link, "", true)}${btn(st.cta2_label, st.cta2_link, "btn--ghost")}</div>` : ""}</div>
          ${kind ? `<figure class="specimen" aria-hidden="true"><span class="specimen__art" data-draw>${FV.herbSVG(kind)}</span>${info ? `<figcaption><i>${esc(info.latin)}</i><span>${esc(kind)}</span></figcaption>` : ""}</figure>` : ""}
        </div>
        ${st.image ? `<figure class="page-head__media" data-parallax-root>${img(st.image, { eager: true, sizes: "100vw", alt: "", attrs: 'data-parallax="8"' })}${st.caption ? `<figcaption class="chip chip--glass">${esc(st.caption)}</figcaption>` : ""}</figure>` : ""}
      </div>
    </section>`;
  };

  R.seasons = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">
      <div class="head head--split"><div class="head__main">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2></div>${st.text ? `<p class="head__side">${md(st.text)}</p>` : ""}</div>
      <div class="seasons" data-stagger>${blocks.map((b) => { const t = b.settings || {}; return `<figure class="season">${img(t.image, { sizes: "(max-width: 960px) 46vw, 24vw", alt: "" })}<figcaption><small>${esc(t.label)}</small><h3>${md(t.title)}</h3>${t.text ? `<p>${md(t.text)}</p>` : ""}</figcaption></figure>`; }).join("")}</div>
    </div></section>`;

  R.hscroll = (s, st, blocks) => `<section class="s s-hscroll ${band(st.band || "dark")}" ${attrs(s, "data-hscroll")}>${(st.band || "dark") === "dark" ? horizon(st, "a") : ""}
      <div class="wrap wrap--wide">${head(st, { noCta: true })}</div>
      <div class="hs__viewport" data-cursor="Scroll"><div class="hs__track">${blocks.map((b, i) => { const t = b.settings || {}; return `<article class="hs__card"><div class="hs__img">${img(t.image, { sizes: "(max-width: 960px) 80vw, 34vw", alt: "" })}</div><div class="hs__body"><span class="hs__n">${String(i + 1).padStart(2, "0")}</span><h3>${md(t.title)}</h3><p>${md(t.text)}</p></div></article>`; }).join("")}<div class="hs__end" aria-hidden="true">${FV.herbSVG("basil")}<span>…and they remember.</span></div></div></div>
    </section>`;

  R.gallery = (s, st, blocks) => {
    const nav = `<div class="rail-nav"><button class="rail-btn" data-rail-prev aria-label="Previous">${I("arrowL")}</button><button class="rail-btn" data-rail-next aria-label="Next">${I("arrow")}</button></div>`;
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { side: nav })}
      <div class="rail-wrap gallery"><div class="rail rail--wide" data-cursor="Drag">${blocks.map((b) => { const t = b.settings || {}; return `<a class="moment" href="${esc(t.link || "products.html?cat=boxes")}" data-reveal>${img(t.image, { sizes: "(max-width: 640px) 84vw, 30vw", alt: "" })}<span class="moment__cap"><small>Moment</small><strong>${md(t.title)}</strong><span>${md(t.text)}</span></span></a>`; }).join("")}</div><div class="rail-progress" aria-hidden="true"><i></i></div></div>
      ${st.cta_label ? `<div class="row" style="margin-top:1.4rem">${btn(st.cta_label, st.cta_link, "btn--ghost")}</div>` : ""}
    </div></section>`;
  };

  R.compare = (s, st) => {
    const col = (title, items, isNew) => `<div class="compare__col compare__col--${isNew ? "new" : "old"}" data-reveal><h3>${md(title)}</h3><ul>${list(items).map((i) => `<li>${isNew ? I("check") : I("x")}<span>${md(i)}</span></li>`).join("")}</ul></div>`;
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { noCta: true })}<div class="compare">${col(st.old_title, st.old_items)}${col(st.new_title, st.new_items, true)}</div></div></section>`;
  };

  R.quote = (s, st) => `<section class="s s-quote" ${attrs(s)}>
      ${st.image ? `<div class="s-quote__bg" data-parallax-root>${img(st.image, { sizes: "100vw", alt: "", attrs: 'data-parallax="10"' })}</div>` : ""}
      <div class="wrap wrap--narrow"><blockquote data-split="words">${md(st.quote)}</blockquote>${st.cite ? `<cite>${esc(st.cite)}</cite>` : ""}</div>
    </section>`;

  R.cta = (s, st) => {
    const olive = st.style === "olive", kind = herbKind(st.art);
    return `<section class="s sec" ${attrs(s)}><div class="wrap wrap--wide"><div class="cta-block${olive ? " cta-block--olive" : ""}">
      <div>${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}${st.cta_label || st.cta2_label ? `<div class="row" style="margin-top:1.6rem">${btn(st.cta_label, st.cta_link, olive ? "" : "btn--olive", true)}${btn(st.cta2_label, st.cta2_link, olive ? "btn--ghost" : "btn--ghost-light")}</div>` : ""}</div>
      ${kind ? `<div class="cta-block__art" data-draw>${FV.herbSVG(kind)}</div>` : ""}
    </div></div></section>`;
  };

  R.steps = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { noCta: true })}
      <ol class="steps" data-stagger>${blocks.map((b, i) => { const t = b.settings || {}; return `<li class="steps__item"><span class="steps__n">${String(i + 1).padStart(2, "0")}</span><h3>${md(t.title)}</h3><p>${md(t.text)}</p></li>`; }).join("")}</ol>
    </div></section>`;

  R.features = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { noCta: true })}
      <div class="features" style="--cols:${Math.min(4, Math.max(2, +st.cols || 3))}" data-stagger>${blocks.map((b, i) => { const t = b.settings || {}; return `<div class="feature">${st.numbered ? `<span class="feature__n">${String(i + 1).padStart(2, "0")}</span>` : `<span class="feature__ic">${I(t.icon || "leaf")}</span>`}<h3>${md(t.title)}</h3><p>${md(t.text)}</p></div>`; }).join("")}</div>
    </div></section>`;

  R.areas = (s, st) => {
    const areas = (T.settings().areas || []);
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide"><div class="areas">
      <div class="stack">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}
        <div class="area-list" data-stagger>${areas.map((a) => `<span>${I("pin")}${esc(a)}</span>`).join("")}</div>${st.note ? `<p class="muted small">${md(st.note)}</p>` : ""}</div>
      ${st.image ? `<div class="areas__media" data-clip>${img(st.image, { sizes: "(max-width: 960px) 92vw, 52vw", alt: "" })}<span class="areas__stamp">${I("truck")}<span><strong>Next-day</strong> order before 6pm</span></span></div>` : ""}
    </div></div></section>`;
  };

  R.contact = (s, st) => {
    const c = T.settings().contact || {}, soc = T.settings().social || {};
    const subjects = list(st.subjects);
    const info = [
      c.whatsapp || c.phone ? ["whatsapp", "WhatsApp & phone", `${c.phone ? `<a href="tel:${esc(String(c.phone).replace(/\s/g, ""))}">${esc(c.phone)}</a>` : ""}${c.whatsapp ? ` · <a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">Chat on WhatsApp</a>` : ""}<br>Fastest for anything about a live order.`] : null,
      c.email ? ["mail", "Email", `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>For everything else.`] : null,
      c.hours ? ["clock", "Hours", esc(c.hours)] : null,
      ["instagram", "Follow along", `Seasonal notes and hosting ideas${soc.instagram ? ` — <a href="${esc(soc.instagram)}" target="_blank" rel="noopener">@freshvalley.eg</a>` : ""}`],
    ].filter(Boolean);
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide"><div class="contact">
      <form class="contact__form" data-contact-form novalidate>
        <div class="full">${eyebrow(st.eyebrow)}<h2 class="h3" data-split>${md(st.title)}</h2></div>
        <div class="field"><label for="cf-first">First name</label><input class="input" id="cf-first" name="first" required autocomplete="given-name"></div>
        <div class="field"><label for="cf-last">Last name</label><input class="input" id="cf-last" name="last" autocomplete="family-name"></div>
        <div class="field"><label for="cf-email">Email</label><input class="input" id="cf-email" name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label for="cf-phone">Phone</label><input class="input" id="cf-phone" name="phone" type="tel" autocomplete="tel"></div>
        <div class="field full"><label for="cf-subject">Subject</label><select class="select" id="cf-subject" name="subject">${subjects.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join("")}</select></div>
        <div class="field full"><label for="cf-msg">Message</label><textarea class="textarea" id="cf-msg" name="message" required></textarea></div>
        <div class="full row" style="justify-content:space-between"><p class="muted small">${md(st.note)}</p><button class="btn" type="submit" data-magnetic>Send message<span class="btn__ic">${I("arrow")}</span></button></div>
      </form>
      <div class="contact__info" data-stagger>${info.map(([ic, h, p]) => `<div class="info-card"><span class="info-card__ic">${I(ic)}</span><div><strong>${h}</strong><span>${p}</span></div></div>`).join("")}</div>
    </div></div></section>`;
  };

  R.faq = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide"><div class="faq">
      <div class="faq__head">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}</div>
      <div class="acc">${blocks.map((b, i) => { const t = b.settings || {}; return `<details${i === 0 ? " open" : ""}><summary>${md(t.q)}<span class="pm" aria-hidden="true"></span></summary><div class="acc__panel">${paras(t.a)}</div></details>`; }).join("")}</div>
    </div></div></section>`;

  R.legal = (s, st, blocks) => {
    const slug = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<section class="s sec band--paper" ${attrs(s)}><div class="wrap wrap--wide"><div class="legal">
      <nav class="legal__toc" aria-label="On this page"><p>On this page</p>${blocks.map((b) => `<a href="#${slug(b.settings.title)}">${esc(b.settings.title)}</a>`).join("")}</nav>
      <div class="legal__body">${st.updated ? `<p class="legal__updated">${esc(st.updated)}</p>` : ""}${blocks.map((b) => `<section id="${slug(b.settings.title)}"><h2>${esc(b.settings.title)}</h2>${paras(b.settings.body)}</section>`).join("")}</div>
    </div></div></section>`;
  };

  /* ------------------------------------------------------------------ *
   * Schema — drives the admin theme editor forms
   * ------------------------------------------------------------------ */
  const F = (id, type, label, extra) => Object.assign({ id, type, label }, extra || {});
  const BAND = F("band", "select", "Background", { options: [["paper", "Paper"], ["kraft", "Kraft"], ["sage", "Sage"], ["dark", "Forest"], ["olive", "Olive"]] });
  const HEAD = [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading", { info: "*word* = olive italic · ~word~ = hand-drawn underline" }), F("text", "textarea", "Text")];
  const CTA = [F("cta_label", "text", "Button label"), F("cta_link", "link", "Button link")];
  const CTA2 = [F("cta2_label", "text", "Second button label"), F("cta2_link", "link", "Second button link")];
  const ARTS = [["", "None"], ["mint", "Mint"], ["basil", "Basil"], ["coriander", "Coriander"], ["rosemary", "Rosemary"], ["dill", "Dill"], ["sprout", "Sprout"]];
  const HORIZON = F("horizon", "toggle", "Valley hills on top", { info: "Shown on the Forest background" });
  const COLL = [["best-sellers", "Best sellers"], ["seasonal", "Seasonal"], ["essentials", "Essentials"], ["hosting", "Hosting"], ["organic-reserve", "Organic Reserve"], ["premium", "Premium (smart)"], ["organic", "Organic (smart)"], ["fruits", "Fruits"], ["vegetables", "Vegetables"], ["herbs", "Herbs"], ["all", "Everything"]];
  const SCHEMA = {
    hero: { name: "Hero", icon: "sparkle", limit: 1, settings: [F("badge", "text", "Badge"), F("badge_link", "link", "Badge link"), F("line1", "text", "Headline · line 1"), F("line2", "text", "Headline · line 2", { info: "~word~ draws the olive underline" }), F("line3", "text", "Headline · line 3"), F("words", "text", "Rotating words", { info: "Separate with |" }), F("lede", "textarea", "Intro"), F("cta1_label", "text", "Button label"), F("cta1_link", "link", "Button link"), F("cta2_label", "text", "Second button label"), F("cta2_link", "link", "Second button link"), F("harvest_note", "toggle", "Show this month's harvest", { info: "Updates itself every month from the product seasons" }), F("image", "image", "Full-screen image"), F("image_alt", "text", "Image description"), F("orbs", "products", "Floating produce", { max: 3 }), F("herbs", "text", "Herbs at the foot of the photo", { info: "Two of: mint, basil, coriander, rosemary, dill — comma separated" }), F("chips", "text", "Image chips", { info: "Separate with |" })] },
    marquee: { name: "Scrolling words", icon: "sparkle", settings: [F("items", "list", "Words"), F("style", "select", "Style", { options: [["cross", "Crossed ribbons"], ["forest", "Forest ribbon"], ["olive", "Olive ribbon"]] }), F("speed", "range", "Speed", { min: 0.3, max: 3, step: 0.1 })] },
    categories: { name: "Category bento", icon: "grid", settings: [...HEAD, ...CTA, BAND], blocks: { tile: { name: "Tile", settings: [F("title", "text", "Title"), F("text", "text", "Text"), F("image", "image", "Image", { info: "art:herbs draws a botanical tile" }), F("link", "link", "Link"), F("count", "select", "Show product count of", { options: [["", "—"], ["fruits", "Fruits"], ["vegetables", "Vegetables"], ["herbs", "Herbs"], ["boxes", "Boxes"], ["seasonal", "Seasonal"], ["organic-reserve", "Organic Reserve"]] })] } }, max_blocks: 6 },
    product_rail: { name: "Product carousel", icon: "bag", settings: [...HEAD, F("collection", "select", "Collection", { options: COLL }), F("limit", "range", "Products shown", { min: 4, max: 20, step: 1 }), ...CTA, BAND] },
    story: { name: "Pinned story", icon: "sparkle", settings: [...HEAD, ...CTA, ...CTA2, HORIZON], blocks: { step: { name: "Card", settings: [F("title", "text", "Title"), F("text", "textarea", "Text"), F("image", "image", "Image")] } }, max_blocks: 5 },
    boxes: { name: "Boxes", icon: "box", settings: [...HEAD, F("boxes", "boxes", "Boxes"), ...CTA, BAND] },
    stats: { name: "Numbers", icon: "check", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), BAND, HORIZON], blocks: { stat: { name: "Number", settings: [F("value", "text", "Value"), F("decimals", "range", "Decimals", { min: 0, max: 2, step: 1 }), F("suffix", "text", "Suffix"), F("label", "text", "Label")] } }, max_blocks: 4 },
    image_text: { name: "Image with text", icon: "leaf", settings: [...HEAD, F("list", "list", "Checklist", { info: "One per line · Title — text" }), F("image", "image", "Image"), F("chip", "text", "Image label"), ...CTA, F("flip", "toggle", "Image on the right"), BAND] },
    harvest: { name: "Harvest calendar", icon: "calendar", limit: 1, settings: [...HEAD, F("staples", "toggle", "List the all-year staples"), ...CTA, BAND] },
    origins: { name: "Origins map", icon: "pin", limit: 1, settings: [...HEAD, ...CTA, BAND] },
    herbs: { name: "Herb garden", icon: "leaf", limit: 1, settings: [...HEAD, ...CTA, BAND] },
    banner: { name: "Image banner", icon: "truck", settings: [...HEAD, F("image", "image", "Image"), ...CTA, ...CTA2] },
    journal: { name: "Journal posts", icon: "leaf", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), F("limit", "range", "Posts (0 = all)", { min: 0, max: 12, step: 1 }), F("layout", "select", "Layout", { options: [["grid", "Three cards"], ["magazine", "Feature + list"]] }), ...CTA] },
    page_head: { name: "Page header", icon: "home", settings: [...HEAD, ...CTA, ...CTA2, F("image", "image", "Image"), F("caption", "text", "Image caption"), F("art", "select", "Herb specimen", { options: ARTS }), F("compact", "toggle", "Compact")] },
    seasons: { name: "Four seasons", icon: "sparkle", settings: [...HEAD, BAND], blocks: { season: { name: "Season", settings: [F("image", "image", "Image"), F("label", "text", "Label"), F("title", "text", "Title"), F("text", "text", "Text")] } }, max_blocks: 4 },
    hscroll: { name: "Horizontal scroll", icon: "arrow", settings: [...HEAD, BAND, HORIZON], blocks: { card: { name: "Card", settings: [F("title", "text", "Title"), F("text", "text", "Text"), F("image", "image", "Image")] } }, max_blocks: 8 },
    gallery: { name: "Moments carousel", icon: "gift", settings: [...HEAD, ...CTA, BAND], blocks: { moment: { name: "Moment", settings: [F("image", "image", "Image"), F("title", "text", "Title"), F("text", "text", "Text"), F("link", "link", "Link")] } } },
    compare: { name: "Comparison", icon: "check", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), F("old_title", "text", "Left title"), F("old_items", "list", "Left items"), F("new_title", "text", "Right title"), F("new_items", "list", "Right items"), BAND] },
    quote: { name: "Big quote", icon: "sparkle", settings: [F("quote", "textarea", "Quote"), F("cite", "text", "Attribution"), F("image", "image", "Background image")] },
    cta: { name: "Call to action", icon: "arrow", settings: [...HEAD, ...CTA, ...CTA2, F("style", "select", "Style", { options: [["forest", "Forest"], ["olive", "Olive"]] }), F("art", "select", "Herb", { options: ARTS })] },
    steps: { name: "Numbered steps", icon: "check", settings: [...HEAD, BAND], blocks: { step: { name: "Step", settings: [F("title", "text", "Title"), F("text", "textarea", "Text")] } }, max_blocks: 6 },
    features: { name: "Feature cards", icon: "shield", settings: [...HEAD, F("cols", "range", "Columns", { min: 2, max: 4, step: 1 }), F("numbered", "toggle", "Numbers instead of icons"), BAND], blocks: { feature: { name: "Card", settings: [F("icon", "icon", "Icon"), F("title", "text", "Title"), F("text", "textarea", "Text")] } } },
    areas: { name: "Delivery areas", icon: "pin", settings: [...HEAD, F("note", "text", "Note"), F("image", "image", "Image"), BAND] },
    contact: { name: "Contact form", icon: "mail", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), F("subjects", "list", "Subjects"), F("note", "text", "Note"), BAND] },
    faq: { name: "FAQ", icon: "plus", settings: [...HEAD, BAND], blocks: { qa: { name: "Question", settings: [F("q", "text", "Question"), F("a", "textarea", "Answer")] } } },
    legal: { name: "Policy text", icon: "shield", only: ["policies", "terms"], settings: [F("updated", "text", "Updated line")], blocks: { clause: { name: "Clause", settings: [F("title", "text", "Title"), F("body", "textarea", "Body", { info: "Blank line = new paragraph · start lines with - for bullets" })] } } },
  };
  // Presets reuse the default section of that type (found by type, so the
  // default page lists can change without breaking "Add section").
  const byType = (page, type) => { const s = (T.defaults().pages[page].sections || []).find((x) => x.type === type); return s ? { settings: s.settings, blocks: s.blocks } : { settings: {} }; };
  const PRESETS = {
    hero: () => byType("index", "hero"),
    marquee: () => ({ settings: { items: "Export-grade|Hand-graded|Next-day across Cairo", style: "forest", speed: 1 } }),
    categories: () => byType("index", "categories"),
    product_rail: () => ({ settings: { eyebrow: "Hand-picked", title: "New *arrivals*", text: "", collection: "best-sellers", limit: 10, cta_label: "Shop all", cta_link: "products.html", band: "paper" } }),
    story: () => byType("index", "story"),
    boxes: () => ({ settings: { eyebrow: "Curated", title: "Our *boxes*", text: "", boxes: "hosting-box,premium-fruit-box,family-box", cta_label: "All boxes", cta_link: "products.html?cat=boxes", band: "kraft" } }),
    stats: () => byType("index", "stats"),
    image_text: () => ({ settings: { eyebrow: "Our story", title: "A heading with an *accent*", text: "Tell the story in a sentence or two.", list: "", image: "banner:packaging", chip: "", cta_label: "", cta_link: "", flip: false, band: "paper" } }),
    harvest: () => byType("index", "harvest"),
    origins: () => byType("index", "origins"),
    herbs: () => byType("index", "herbs"),
    banner: () => ({ settings: { eyebrow: "Next-day delivery", title: "A banner *headline*", text: "Short supporting line.", image: "banner:door-delivery", cta_label: "Shop now", cta_link: "products.html", cta2_label: "", cta2_link: "" } }),
    journal: () => ({ settings: { eyebrow: "The Journal", title: "Notes on eating *well*", limit: 3, layout: "grid", cta_label: "All entries", cta_link: "journal.html" } }),
    page_head: () => ({ settings: { eyebrow: "Eyebrow", title: "Page *title*", text: "", art: "rosemary" } }),
    seasons: () => byType("hosting", "seasons"),
    hscroll: () => byType("hosting", "hscroll"),
    gallery: () => byType("hosting", "gallery"),
    compare: () => byType("hosting", "compare"),
    quote: () => byType("hosting", "quote"),
    cta: () => byType("hosting", "cta"),
    steps: () => byType("about", "steps"),
    features: () => byType("about", "features"),
    areas: () => byType("about", "areas"),
    contact: () => byType("contact", "contact"),
    faq: () => byType("contact", "faq"),
    legal: () => ({ settings: { updated: "Last updated: " + new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }) }, blocks: [{ type: "clause", settings: { title: "New clause", body: "Write the clause here." } }] }),
  };

  /* ------------------------------------------------------------------ *
   * Page rendering + behaviours
   * ------------------------------------------------------------------ */
  function renderSection(s) {
    const fn = R[s.type];
    if (!fn || s.disabled) return "";
    try { return fn(s, s.settings || {}, s.blocks || []); } catch (e) { console.error("[FV] section " + s.id, e); return ""; }
  }
  function renderPageHTML(key) {
    const pg = T.page(key);
    CTX.page = pg;
    return pg ? pg.sections.map(renderSection).join("\n") : "";
  }
  const BOUND = new WeakSet();
  /* Signature of everything a page render depends on — baked HTML is kept
     only while it still matches (any CMS edit changes it → live re-render). */
  function signature(key) {
    const str = JSON.stringify([T.page(key), T.settings(), FV.catalog, FV.settings.currency]);
    let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36) + str.length.toString(36);
  }
  /* Hero orbs sit in the gaps the headline leaves: measure lines 1–2 (in em)
     and hide orbs that wouldn't fit beside a longer, owner-edited headline. */
  function placeOrbs(root) {
    Array.from(root.querySelectorAll(".hero__title")).forEach((t) => {
      const measure = () => {
        const fs = parseFloat(getComputedStyle(t).fontSize) || 1, lines = t.querySelectorAll(".line__in");
        const w = (i) => lines[i] ? lines[i].getBoundingClientRect().width / fs : 0;
        const l1 = w(0), l2 = w(1), avail = t.clientWidth / fs;
        t.style.setProperty("--l1", l1.toFixed(2)); t.style.setProperty("--l2", l2.toFixed(2));
        t.classList.toggle("orbs-tight", Math.max(l1, l2) + 2.1 > avail);
        t.classList.toggle("orbs-none", Math.min(l1 + 1.4, l2 + 1.2) > avail);
      };
      measure();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
      if (!BOUND.has(t)) { BOUND.add(t); window.addEventListener("resize", measure, { passive: true }); }
    });
  }
  /* Month-dependent bits are re-applied in the visitor's browser (the baked
     HTML carries the month it was baked in). */
  function applyMonth(root) {
    const now = new Date().getMonth();
    Array.from(root.querySelectorAll(".pcard__tag[data-months]")).forEach((el) => { const ms = el.dataset.months.split(",").map(Number), lab = el.querySelector("span"); if (!lab) return; let k = 0; while (k < 12 && !ms.includes((now + k) % 12)) k++; lab.textContent = k === 0 ? "In season" : "Back in " + FV.MONTHS[(now + k) % 12]; el.classList.toggle("is-off", k > 0); });
    Array.from(root.querySelectorAll("[data-harvest-note]")).forEach((el) => { const h = harvestNote(now); if (el.innerHTML !== h) el.innerHTML = h; });
    Array.from(root.querySelectorAll("[data-harvest-month]")).forEach((el) => { el.textContent = FV.MONTHS_LONG[now]; });
    Array.from(root.querySelectorAll("[data-harvest]")).forEach((sec) => {
      sec.querySelectorAll("[data-m]").forEach((c) => c.classList.toggle("is-now", +c.dataset.m === now));
      sec.querySelectorAll(".hc__row[data-months]").forEach((r) => {
        const ms = r.dataset.months.split(",").map(Number), st = r.querySelector("[data-status]");
        const on = ms.includes(now), last = on && !ms.includes((now + 1) % 12);
        let txt;
        if (on) txt = last ? "Last weeks" : "In season";
        else { let k = 1; while (k < 12 && !ms.includes((now + k) % 12)) k++; txt = "From " + FV.MONTHS[(now + k) % 12]; }
        r.classList.toggle("is-on", on); r.classList.toggle("is-last", last);
        if (st) st.textContent = txt;
      });
    });
  }
  /* Origins: the list and the pins light each other up */
  function bindOrigins(root) {
    Array.from(root.querySelectorAll("[data-origins]")).forEach((sec) => {
      if (BOUND.has(sec)) return; BOUND.add(sec);
      const set = (name) => {
        sec.querySelectorAll(".og__item").forEach((b) => { const on = b.dataset.region === name; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
        sec.querySelectorAll(".map__pin").forEach((p) => p.classList.toggle("is-on", p.dataset.region === name));
      };
      sec.querySelectorAll(".og__item").forEach((b) => { b.addEventListener("click", () => set(b.dataset.region)); b.addEventListener("mouseenter", () => set(b.dataset.region)); b.addEventListener("focus", () => set(b.dataset.region)); });
      sec.querySelectorAll(".map__pin").forEach((p) => p.addEventListener("mouseenter", () => set(p.dataset.region)));
    });
  }
  function growCharts(root) {
    Array.from(root.querySelectorAll(".hc")).forEach((hc) => {
      if (BOUND.has(hc)) return; BOUND.add(hc);
      if (!("IntersectionObserver" in window)) { hc.classList.add("is-grown"); return; }
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { hc.classList.add("is-grown"); io.disconnect(); } }), { threshold: 0.18 });
      io.observe(hc);
    });
  }
  function behave(root) {
    root = root || document;
    placeOrbs(root);
    growCharts(root);
    applyMonth(root);
    bindOrigins(root);
    // rails with prev/next
    Array.from(root.querySelectorAll("[data-section-id]")).forEach((sec) => {
      const rail = sec.querySelector(".rail"), p = sec.querySelector("[data-rail-prev]"), n = sec.querySelector("[data-rail-next]");
      if (rail && p && n && !BOUND.has(rail)) { BOUND.add(rail); FV.bindRail(rail, p, n); }
    });
    // journal filter tabs
    Array.from(root.querySelectorAll("[data-jtabs]")).forEach((tabs) => {
      if (BOUND.has(tabs)) return; BOUND.add(tabs);
      const listEl = tabs.closest("section").querySelector("[data-jlist]"), ink = tabs.querySelector(".tabs__ink");
      const move = () => { const a = tabs.querySelector('[aria-selected="true"]'); if (a && ink) { ink.style.width = a.offsetWidth + "px"; ink.style.transform = "translateX(" + a.offsetLeft + "px)"; } };
      tabs.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
        tabs.querySelectorAll("[data-cat]").forEach((x) => x.setAttribute("aria-selected", x === b));
        move();
        listEl.querySelectorAll("[data-cat]").forEach((a) => { a.hidden = !(b.dataset.cat === "all" || a.dataset.cat === b.dataset.cat); });
        if (window.FVMotion) window.FVMotion.refresh();
      }));
      requestAnimationFrame(move);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(move);
      window.addEventListener("resize", move);
    });
    // contact form → admin inbox
    Array.from(root.querySelectorAll("[data-contact-form]")).forEach((f) => {
      if (BOUND.has(f)) return; BOUND.add(f);
      const topic = new URLSearchParams(location.search).get("topic");
      if (topic) { const sel = f.querySelector("select"); Array.from(sel.options).forEach((o) => { if (o.value.toLowerCase().indexOf(topic.toLowerCase()) === 0) sel.value = o.value; }); }
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;
        f.querySelectorAll("[required]").forEach((i) => { const bad = !i.value.trim() || (i.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)); i.setAttribute("aria-invalid", bad); if (bad && ok) { i.focus(); ok = false; } });
        if (!ok) { FV.toast("Please complete the highlighted fields"); return; }
        const d = Object.fromEntries(new FormData(f).entries());
        try { const box = JSON.parse(localStorage.getItem("fv_messages") || "[]"); box.unshift(Object.assign({ id: "M" + Date.now().toString(36).toUpperCase(), date: new Date().toISOString(), status: "new" }, Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v).replace(/[<>]/g, "").slice(0, 2000)])))); localStorage.setItem("fv_messages", JSON.stringify(box.slice(0, 500))); } catch (_) {}
        FV.track("contact", {});
        f.reset();
        FV.toast("Thank you — we'll be in touch", "Usually within one working day");
      });
    });
    // legal: highlight the clause in view
    Array.from(root.querySelectorAll(".legal")).forEach((lg) => {
      const links = Array.from(lg.querySelectorAll(".legal__toc a"));
      if (!("IntersectionObserver" in window) || !links.length) return;
      const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) links.forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-30% 0px -60% 0px" });
      lg.querySelectorAll(".legal__body section").forEach((s) => io.observe(s));
    });
  }
  function renderInto(main, key) {
    main.innerHTML = renderPageHTML(key);
    behave(main);
  }

  /* Boot: render the page's sections unless baked HTML is already current */
  const main = document.querySelector("main[data-fv-page]");
  const KEY = main && main.dataset.fvPage;
  if (main && KEY) {
    const fresh = main.dataset.sig && main.dataset.sig === signature(KEY) && main.querySelector("[data-section-id]") && !/[?&](fv_preview|bake)=1/.test(location.search);
    if (fresh) behave(main);
    else renderInto(main, KEY);
    const pg = T.page(KEY);
    if (pg && pg.seo_title) document.title = pg.seo_title;
  }

  /* ------------------------------------------------------------------ *
   * Theme-editor preview protocol (same-origin iframe only)
   * ------------------------------------------------------------------ */
  const IS_PREVIEW = /[?&]fv_preview=1/.test(location.search) && window.parent !== window;
  if (IS_PREVIEW) {
    document.documentElement.classList.add("fv-preview");
    const post = (m) => { try { window.parent.postMessage(m, location.origin); } catch (_) {} };
    const mark = (id) => {
      document.querySelectorAll(".fv-sel").forEach((x) => x.classList.remove("fv-sel"));
      const el = id && document.querySelector('[data-section-id="' + CSS.escape(id) + '"]');
      if (el) el.classList.add("fv-sel");
      return el;
    };
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin) return;
      const m = e.data || {};
      if (m.type === "fv:draft" && main && KEY) {
        const y = window.scrollY;
        T.setDraft(m.theme);
        if (window.FVMotion) window.FVMotion.kill();
        renderInto(main, KEY);
        if (window.FVMotion) window.FVMotion.scan(main);
        window.scrollTo(0, y);
        if (m.select) mark(m.select);
      }
      if (m.type === "fv:select") { const el = mark(m.id); if (el && m.scroll) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    document.addEventListener("click", (e) => {
      const sec = e.target.closest && e.target.closest("[data-section-id]");
      const a = e.target.closest && e.target.closest("a[href]");
      if (a && !a.getAttribute("href").startsWith("#")) {
        const href = a.getAttribute("href");
        if (/^(https?:|mailto:|tel:)/.test(href) || /admin\//.test(href)) { e.preventDefault(); return; }
        e.preventDefault();
        post({ type: "fv:navigate", href });
        return;
      }
      if (sec) { e.preventDefault(); mark(sec.dataset.sectionId); post({ type: "fv:clicked", id: sec.dataset.sectionId }); }
    }, true);
    document.addEventListener("submit", (e) => e.preventDefault(), true);
    post({ type: "fv:ready", page: KEY || (document.body && document.body.dataset.page) || "" });
  }

  return { render: renderSection, renderPageHTML, renderInto, behave, signature, schema: SCHEMA, presets: PRESETS, ART, img, md, list, mapSVG, regionOf, harvestNote };
})();
