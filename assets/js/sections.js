/* =====================================================================
   FRESH VALLEY — Section renderers + schema (the theme engine) · v5
   Pure string renderers: the storefront renders pages from FVTheme, the
   admin theme editor builds its forms from SCHEMA and previews drafts,
   and _build/bake.js pre-renders the defaults into the HTML for SEO.
   v5 "Field & Herb": calm, spacious, typographic — no reviews, no
   marquees, no decorative patterns. Signature modules: the Valley
   Almanac (harvest calendar) and Provenance (where it grows).
   ===================================================================== */
window.FVSections = (function () {
  "use strict";
  const FV = window.FV, T = window.FVTheme, D = FV.data;
  const esc = FV.esc, I = FV.icon;
  const list = (s, sep) => String(s || "").split(sep || "|").map((x) => x.trim()).filter(Boolean);

  /* ------------------------------------------------------------------ *
   * Botanical line-art — kept for the admin theme editor only (v5 removed
   * all decorative line-art and patterns from the storefront)
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
  const ART = {
    sprig: `<svg class="art" viewBox="0 0 200 260" aria-hidden="true">${P.sprig}</svg>`,
    leaf: `<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${P.leaf}</svg>`,
    fig: `<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${P.fig}</svg>`,
    tomato: `<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${P.tomato}</svg>`,
    strawberry: `<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${P.strawberry}</svg>`,
    citrus: `<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${citrusPaths()}</svg>`,
    herbs: `<svg class="art" viewBox="0 0 200 260" aria-hidden="true">${P.herbs}</svg>`,
    bouquet: `<svg class="art" viewBox="0 0 420 400" aria-hidden="true"><g transform="translate(150 20) rotate(8 100 130)">${P.sprig}</g><g transform="translate(20 150) rotate(-10 100 100) scale(.95)">${P.leaf}</g><g transform="translate(236 176) scale(.9)">${P.fig}</g><g transform="translate(40 18) scale(.62)">${citrusPaths()}</g><g transform="translate(250 30) scale(.7)">${P.strawberry}</g></svg>`,
  };

  /* ------------------------------------------------------------------ *
   * Text + images
   * ------------------------------------------------------------------ */
  function md(s) {
    return esc(s).replace(/\*([^*]+)\*/g, '<em class="i">$1</em>').replace(/~([^~]+)~/g, '<em class="i">$1</em>').replace(/\n/g, "<br>");
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
    if (!ref || ref.indexOf("art:") === 0) return "";
    if (ref === "hero-portrait") {
      return `<picture><source type="image/webp" srcset="assets/img/hero/hero-portrait-700.webp 700w, assets/img/hero/hero-portrait-1000.webp 1000w" sizes="${o.sizes || "(max-width: 960px) 100vw, 42vw"}"><img src="assets/img/hero/hero-portrait-1000.jpg" srcset="assets/img/hero/hero-portrait-700.jpg 700w, assets/img/hero/hero-portrait-1000.jpg 1000w" sizes="${o.sizes || "(max-width: 960px) 100vw, 42vw"}" alt="${alt}" ${load} decoding="async" width="1000" height="1333" ${attrs}></picture>`;
    }
    if (ref === "hero") {
      return `<picture><source media="(max-width: 700px)" type="image/webp" srcset="assets/img/hero/hero-portrait-700.webp 700w, assets/img/hero/hero-portrait-1000.webp 1000w" sizes="100vw"><source media="(max-width: 700px)" srcset="assets/img/hero/hero-portrait-700.jpg 700w, assets/img/hero/hero-portrait-1000.jpg 1000w" sizes="100vw"><source type="image/webp" srcset="assets/img/hero/hero-800.webp 800w, assets/img/hero/hero-1200.webp 1200w, assets/img/hero/hero-1800.webp 1800w, assets/img/hero/hero-2400.webp 2400w" sizes="${o.sizes || "100vw"}"><img src="assets/img/hero/hero-1800.jpg" srcset="assets/img/hero/hero-800.jpg 800w, assets/img/hero/hero-1200.jpg 1200w, assets/img/hero/hero-1800.jpg 1800w, assets/img/hero/hero-2400.jpg 2400w" sizes="${o.sizes || "100vw"}" alt="${alt}" ${load} decoding="async" width="2400" height="982" ${attrs}></picture>`;
    }
    if (ref.indexOf("banner:") === 0) {
      const k = ref.slice(7).replace(/[^a-z0-9-]/gi, "");
      return `<picture><source type="image/webp" srcset="assets/img/banners/sm/${k}.webp 540w, assets/img/banners/${k}.webp 1500w" sizes="${o.sizes || "(max-width: 960px) 100vw, 60vw"}"><img src="assets/img/banners/${k}.jpg" srcset="assets/img/banners/sm/${k}.jpg 540w, assets/img/banners/${k}.jpg 1500w" sizes="${o.sizes || "(max-width: 960px) 100vw, 60vw"}" alt="${alt}" ${load} decoding="async" width="1500" height="779" ${attrs}></picture>`;
    }
    if (FV.isCustomImg(ref)) return `<img src="${esc(ref)}" alt="${alt}" ${load} decoding="async" ${attrs}>`;
    return `<picture><source type="image/webp" srcset="${FV.webp(FV.thumb(ref))} 540w, ${FV.webp(FV.img(ref))} 1000w" sizes="${o.sizes || "(max-width: 960px) 90vw, 40vw"}"><img src="${FV.thumb(ref)}" srcset="${FV.thumb(ref)} 540w, ${FV.img(ref)} 1000w" sizes="${o.sizes || "(max-width: 960px) 90vw, 40vw"}" alt="${alt}" ${load} decoding="async" width="1000" height="1000" ${attrs}></picture>`;
  }

  /* ------------------------------------------------------------------ *
   * Shared bits
   * ------------------------------------------------------------------ */
  const BANDS = ["paper", "mist", "kraft", "sage", "dark", "olive"];
  const band = (b) => "band--" + (BANDS.includes(b) ? (b === "olive" || b === "sage" ? "mist" : b) : "paper");
  const attrs = (s, extra) => `id="${esc(s.id)}" data-section-id="${esc(s.id)}" data-section-type="${esc(s.type)}"${extra ? " " + extra : ""}`;
  const eyebrow = (t) => t ? `<p class="eyebrow">${md(t)}</p>` : "";
  const two = (i) => String(i + 1).padStart(2, "0");
  function btn(label, link, cls) {
    if (!label) return "";
    return `<a class="btn ${cls || ""}" href="${esc(link || "#")}">${esc(label)}<span class="btn__ic">${I("arrow")}</span></a>`;
  }
  function tlink(label, link, cls) {
    if (!label) return "";
    return `<a class="link-u ${cls || ""}" href="${esc(link || "#")}">${esc(label)} ${I("arrow")}</a>`;
  }
  const ctas = (st, dark) => (st.cta_label || st.cta2_label) ? `<div class="row cta-row">${btn(st.cta_label, st.cta_link, dark ? "btn--light" : "")}${tlink(st.cta2_label, st.cta2_link)}</div>` : "";
  function head(st, opt) {
    opt = opt || {};
    const cta = st.cta_label && !opt.noCta ? tlink(st.cta_label, st.cta_link || "#") : "";
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
    if (key === "seasonal") ps = ps.slice().sort((a, b) => (FV.inSeasonNow(b) ? 1 : 0) - (FV.inSeasonNow(a) ? 1 : 0));
    return limit ? ps.slice(0, limit) : ps;
  }
  function countFor(key) {
    if (!key) return 0;
    if (key === "boxes") return D.boxes.length;
    if (["fruits", "vegetables", "herbs"].includes(key)) return FV.byCategory(key).length;
    return FV.byCollection(key).length;
  }
  const railNav = () => `<div class="rail-nav"><button class="rail-btn" data-rail-prev aria-label="Previous">${I("arrowL")}</button><button class="rail-btn" data-rail-next aria-label="Next">${I("arrow")}</button></div>`;
  /* The herb field label — a typographic tile for produce without photography */
  const herbsTile = () => `<span class="herb-tile herb-tile--list" aria-hidden="true">${FV.byCategory("herbs").slice(0, 5).map((p) => `<span>${esc(p.latin || p.name)}</span>`).join("")}</span>`;

  /* Egypt's growing regions — geography notes for the Provenance index */
  const REGIONS = {
    "Qalyubia": ["The Delta, just north of Cairo", 45],
    "Sharqia": ["The eastern Delta", 80],
    "Beheira": ["The western Delta", 160],
    "Nubaria": ["Reclaimed desert, west of the Delta", 110],
    "Ismailia": ["Orchards along the canal", 120],
    "Minya": ["Middle Egypt, on the Nile", 245],
    "Qena": ["Upper Egypt, in the Nile's bend", 620],
    "Siwa Oasis": ["The Western Desert", 800],
  };
  const REGION_ORDER = Object.keys(REGIONS);

  /* ------------------------------------------------------------------ *
   * Renderers
   * ------------------------------------------------------------------ */
  const R = {};
  const CTX = { page: null };

  R.hero = (s, st) => {
    const title = st.title || [st.line1, st.line2, st.line3].filter(Boolean).join("\n");
    const al = FV.almanac();
    const eb = st.almanac ? al.text : st.eyebrow;
    const peak = st.peak === false ? [] : FV.peakNow(3);
    const image = !st.image || st.image === "hero" ? "hero-portrait" : st.image;
    return `<section class="s s-hero" ${attrs(s)}>
      <div class="wrap wrap--wide hero">
        <div class="hero__copy">
          ${eb ? `<p class="eyebrow hero__eyebrow">${esc(eb)}</p>` : ""}
          <h1 class="hero__title">${String(title).split("\n").map((l, i) => `<span class="line" style="--i:${i}"><span class="line__in">${md(l)}</span></span>`).join("")}</h1>
          ${st.lede ? `<p class="lede hero__lede">${md(st.lede)}</p>` : ""}
          <div class="hero__cta">${btn(st.cta1_label, st.cta1_link, "btn--lg")}${tlink(st.cta2_label, st.cta2_link)}</div>
        </div>
        <div class="hero__side">
          <figure class="hero__media">${img(image, { eager: true, alt: st.image_alt, sizes: "(max-width: 960px) 92vw, 40vw" })}</figure>
          <div class="hero__notes">
            ${st.caption ? `<p class="hero__caption">${esc(st.caption)}</p>` : ""}
            ${peak.length ? `<div class="hero__peak"><p class="label">At its best this week</p><ul>${peak.map((p) => `<li><a href="product.html?slug=${p.slug}">${esc(p.name)}</a><small>${esc(FV.originShort(p.origin))}</small></li>`).join("")}</ul></div>` : ""}
          </div>
        </div>
      </div>
    </section>`;
  };

  R.statement = (s, st) => `<section class="s sec ${band(st.band)} s-statement" ${attrs(s)}><div class="wrap wrap--wide"><div class="statement">
      ${eyebrow(st.eyebrow)}
      <p class="statement__text" data-split>${md(st.text)}</p>
      ${st.sign || st.cta_label ? `<div class="statement__foot">${st.sign ? `<span class="statement__sign">${esc(st.sign)}</span>` : ""}${tlink(st.cta_label, st.cta_link)}</div>` : ""}
    </div></div></section>`;

  R.categories = (s, st, blocks) => {
    const tiles = blocks.map((b, i) => {
      const t = b.settings || {}, n = countFor(t.count), pic = img(t.image, { sizes: "(max-width: 640px) 92vw, (max-width: 960px) 46vw, 30vw", alt: "" });
      return `<a class="cat" href="${esc(t.link || "products.html")}">
        <span class="cat__media${pic ? "" : " media--herb"}">${pic || herbsTile()}</span>
        <span class="cat__body"><span class="cat__n">${two(i)}</span><span class="cat__t"><h3>${md(t.title)}</h3>${t.text ? `<span class="cat__d">${md(t.text)}</span>` : ""}</span>${n ? `<span class="cat__count">${n}</span>` : ""}</span>
      </a>`;
    }).join("");
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st)}<div class="cats" data-stagger>${tiles}</div></div></section>`;
  };

  R.product_rail = (s, st) => {
    const ps = productsFor(st.collection, +st.limit || 12);
    const cta = st.cta_label ? tlink(st.cta_label, st.cta_link || "products.html") : "";
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">
      ${head(st, { side: cta + railNav() })}
      <div class="rail-wrap"><div class="rail">${ps.map(FV.productCardHTML).join("")}</div><div class="rail-progress" aria-hidden="true"><i></i></div></div>
    </div></section>`;
  };

  R.almanac = (s, st) => {
    const mo = new Date().getMonth(), M = FV.MONTHS;
    const rel = (p) => { const m = FV.seasonMonths(p).m; if (m[mo]) return -1; for (let k = 1; k < 12; k++) if (m[(mo + k) % 12]) return k; return 12; };
    const rows = D.products.filter((p) => !FV.seasonMonths(p).all).sort((a, b) => rel(a) - rel(b)).slice(0, +st.limit || 10);
    const cells = (p) => { const m = FV.seasonMonths(p).m; return m.map((on, i) => `<td class="alm__c${on ? " is-on" : ""}${on && !m[(i + 11) % 12] ? " is-start" : ""}${on && !m[(i + 1) % 12] ? " is-end" : ""}${i === mo ? " is-now" : ""}"><span class="sr-only">${on ? "in season" : "—"}</span></td>`).join(""); };
    const al = FV.almanac();
    return `<section class="s sec ${band(st.band || "mist")} s-almanac" ${attrs(s)}><div class="wrap wrap--wide">
      ${head(st, { side: `<p class="alm__now"><span class="label">Now</span>${esc(al.month)} · week ${al.week}</p>` })}
      <div class="alm-wrap" data-reveal>
        <table class="alm">
          <caption class="sr-only">Harvest calendar — the months each crop is in season</caption>
          <thead><tr><th scope="col" class="alm__h">Crop · origin</th>${M.map((m, i) => `<th scope="col" class="alm__m${i === mo ? " is-now" : ""}"><span class="l">${m}</span><span class="s" aria-hidden="true">${m.charAt(0)}</span></th>`).join("")}</tr></thead>
          <tbody>${rows.map((p) => `<tr${FV.inSeasonNow(p) ? ' class="is-peak"' : ""}><th scope="row"><a href="product.html?slug=${p.slug}">${esc(p.name)}</a><small>${esc(FV.originShort(p.origin))}${FV.inSeasonNow(p) ? " · at its peak" : ""}</small></th>${cells(p)}</tr>`).join("")}</tbody>
        </table>
      </div>
      <p class="alm__note">Staples — apples, citrus, dates, vegetables and cut herbs — are graded and delivered all year.</p>
    </div></section>`;
  };

  R.origins = (s, st) => {
    const by = {};
    D.products.forEach((p) => { const r = FV.originShort(p.origin); if (REGIONS[r]) (by[r] = by[r] || []).push(p); });
    const regions = REGION_ORDER.filter((r) => by[r]);
    return `<section class="s sec ${band(st.band)} s-origins" ${attrs(s)}><div class="wrap wrap--wide">
      ${head(st, { noCta: true, side: `<p class="origins__sum"><b>${regions.length}</b> regions · <b>${regions.reduce((n, r) => n + by[r].length, 0)}</b> crops</p>` })}
      <ol class="origins" data-stagger>${regions.map((r, i) => { const ps = by[r]; return `<li class="origin">
        <span class="origin__n">${two(i)}</span>
        <div class="origin__place"><h3>${esc(r)}</h3><p>${esc(REGIONS[r][0])}</p></div>
        <p class="origin__crops">${ps.map((p) => `<a href="product.html?slug=${p.slug}">${esc(p.name)}</a>`).join(", ")}</p>
        <span class="origin__km">≈ ${REGIONS[r][1]} km<small>from Cairo</small></span>
      </li>`; }).join("")}</ol>
    </div></section>`;
  };

  R.story = (s, st, blocks) => {
    const struck = list(st.struck);
    const pic = st.image || (blocks.find((b) => b.settings && b.settings.image) || { settings: {} }).settings.image;
    return `<section class="s sec ${band(st.band)} s-story" ${attrs(s)}><div class="wrap wrap--wide"><div class="story">
      <figure class="story__media" data-clip>${img(pic, { sizes: "(max-width: 960px) 92vw, 46vw", alt: "" })}</figure>
      <div class="story__copy">
        ${eyebrow(st.eyebrow)}
        ${struck.length ? `<div class="story__struck" data-strike>${struck.map((t) => `<p>${esc(t)}.</p>`).join("")}</div>` : ""}
        <h2 data-split>${md(st.title)}</h2>
        ${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}
        ${blocks.length ? `<ol class="story__steps" data-stagger>${blocks.map((b, i) => { const t = b.settings || {}; return `<li><span class="n">${two(i)}</span><div><h3>${md(t.title)}</h3><p>${md(t.text)}</p></div></li>`; }).join("")}</ol>` : ""}
        ${ctas(st)}
      </div>
    </div></div></section>`;
  };

  R.boxes = (s, st) => {
    const slugs = list(st.boxes, ",");
    const bx = (slugs.length ? slugs.map(FV.findBox).filter(Boolean) : D.boxes);
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st)}<div class="deck deck--${Math.min(5, Math.max(2, bx.length))}" data-stagger>${bx.map(FV.boxCardHTML).join("")}</div></div></section>`;
  };

  R.stats = (s, st, blocks) => {
    const items = blocks.map((b) => {
      const t = b.settings || {}, v = parseFloat(t.value), dec = +t.decimals || 0;
      const shown = isNaN(v) ? esc(t.value) : (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + esc(t.suffix || "");
      return `<div class="stat"><span class="stat__n"${isNaN(v) ? "" : ` data-count="${v}" data-dec="${dec}" data-suffix="${esc(t.suffix || "")}"`}>${shown}</span><span class="stat__l">${md(t.label)}</span></div>`;
    }).join("");
    return `<section class="s sec ${band(st.band || "dark")} s-stats" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { noCta: true })}<div class="stats" data-stagger>${items}</div></div></section>`;
  };

  R.image_text = (s, st) => {
    const items = list(st.list).map((l, i) => { const [a, b] = l.split(/\s+—\s+/); return `<li><span class="n">${two(i)}</span><span>${b ? `<strong>${md(a)}</strong>${md(b)}` : md(a)}</span></li>`; }).join("");
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide"><div class="it${st.flip ? " it--flip" : ""}">
      <figure class="it__media"><span class="it__frame" data-clip>${img(st.image, { sizes: "(max-width: 960px) 92vw, 46vw", alt: "" })}</span>${st.chip ? `<figcaption>${esc(st.chip)}</figcaption>` : ""}</figure>
      <div class="it__copy">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${paras(st.text, "lede")}${items ? `<ol class="it__list" data-stagger>${items}</ol>` : ""}${st.cta_label ? `<div class="row cta-row">${btn(st.cta_label, st.cta_link, st.band === "dark" ? "btn--light" : "")}</div>` : ""}</div>
    </div></div></section>`;
  };

  R.banner = (s, st) => `<section class="s sec s-banner" ${attrs(s)}><div class="wrap wrap--wide"><div class="banner">
      <div class="banner__media" data-clip data-parallax-root>${img(st.image, { sizes: "(max-width: 960px) 100vw, 92vw", alt: "", attrs: 'data-parallax="5"' })}</div>
      <div class="banner__body">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}${ctas(st)}</div>
    </div></div></section>`;

  R.journal = (s, st) => {
    const arts = D.articles.slice(0, +st.limit || D.articles.length);
    if (st.layout === "magazine") {
      const cats = Array.from(new Set(D.articles.map((a) => a.category)));
      const f = arts[0];
      return `<section class="s sec band--paper" ${attrs(s)}><div class="wrap wrap--wide">
        <article class="feature-post" data-reveal><a class="feature-post__media" href="article.html?slug=${f.slug}" data-clip>${img(f.image, { sizes: "(max-width: 960px) 92vw, 58vw", alt: "" })}</a>
          <div class="feature-post__body"><p class="eyebrow">${esc(f.category)} · ${esc(f.read)}</p><h2><a href="article.html?slug=${f.slug}">${esc(f.title)}</a></h2><p class="lede">${esc(f.excerpt)}</p><span class="acard__meta">${esc(f.author)} · ${esc(f.date)}</span>${tlink("Read the note", "article.html?slug=" + f.slug)}</div></article>
        <div class="head head--tabs"><div class="head__main">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2></div>
          <div class="tabs" role="tablist" aria-label="Filter the notes" data-jtabs><button role="tab" aria-selected="true" data-cat="all">All</button>${cats.map((c) => `<button role="tab" aria-selected="false" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}<span class="tabs__ink" aria-hidden="true"></span></div></div>
        <div class="jlist" data-jlist>${arts.slice(1).map((a) => FV.articleCardHTML(a, true).replace('class="acard acard--row"', `class="acard acard--row" data-cat="${esc(a.category)}"`)).join("")}</div>
      </div></section>`;
    }
    return `<section class="s sec band--paper" ${attrs(s)}><div class="wrap wrap--wide">${head(st)}<div class="grid g-3 jgrid">${arts.map((a) => FV.articleCardHTML(a)).join("")}</div></div></section>`;
  };

  R.page_head = (s, st) => {
    const crumbTitle = (CTX.page && CTX.page.title) || String(st.title || "").replace(/[*~]/g, "");
    return `<section class="s s-page-head${st.compact ? " s-page-head--compact" : ""}" ${attrs(s)}>
      <div class="wrap wrap--wide">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">${esc(crumbTitle)}</span></nav>
        <div class="page-head">
          <div>${eyebrow(st.eyebrow)}<h1 class="ph-title">${md(st.title)}</h1></div>
          <div class="page-head__side">${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}${st.cta_label || st.cta2_label ? `<div class="row cta-row">${btn(st.cta_label, st.cta_link)}${tlink(st.cta2_label, st.cta2_link)}</div>` : ""}</div>
        </div>
        ${st.image ? `<figure class="page-head__media"><span class="page-head__frame" data-parallax-root>${img(st.image, { eager: true, sizes: "100vw", alt: "", attrs: 'data-parallax="6"' })}</span>${st.caption ? `<figcaption>${esc(st.caption)}</figcaption>` : ""}</figure>` : ""}
      </div>
    </section>`;
  };

  R.strike_list = (s, st) => {
    const items = list(st.items).map((l) => { const [a, b] = l.split(/\s+—\s+/); return `<li><span class="sl__t">${md(a)}</span>${b ? `<span class="sl__n">${md(b)}</span>` : ""}</li>`; }).join("");
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">
      <div class="head head--split"><div class="head__main">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2></div>${st.text ? `<p class="head__side">${md(st.text)}</p>` : ""}</div>
      <ul class="strike-list" data-strike>${items}</ul>
    </div></section>`;
  };

  R.seasons = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">
      <div class="head head--split"><div class="head__main">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2></div>${st.text ? `<p class="head__side">${md(st.text)}</p>` : ""}</div>
      <div class="seasons" data-stagger>${blocks.map((b) => { const t = b.settings || {}; return `<figure class="season"><span class="season__img">${img(t.image, { sizes: "(max-width: 960px) 46vw, 24vw", alt: "" })}</span><figcaption><span class="label">${esc(t.label)}</span><h3>${md(t.title)}</h3>${t.text ? `<p>${md(t.text)}</p>` : ""}</figcaption></figure>`; }).join("")}</div>
    </div></section>`;

  R.hscroll = (s, st, blocks) => `<section class="s sec s-ritual ${band(st.band || "dark")}" ${attrs(s)}>
      <div class="wrap wrap--wide">${head(st, { noCta: true, side: railNav() })}
      <div class="rail-wrap"><div class="rail rail--ritual">${blocks.map((b, i) => { const t = b.settings || {}; return `<article class="ritual"><div class="ritual__img">${img(t.image, { sizes: "(max-width: 960px) 78vw, 30vw", alt: "" })}</div><div class="ritual__body"><span class="ritual__n">${two(i)}</span><div><h3>${md(t.title)}</h3><p>${md(t.text)}</p></div></div></article>`; }).join("")}</div><div class="rail-progress" aria-hidden="true"><i></i></div></div>
      </div>
    </section>`;

  R.gallery = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { side: railNav() })}
      <div class="rail-wrap gallery"><div class="rail rail--wide">${blocks.map((b) => { const t = b.settings || {}; return `<a class="moment" href="${esc(t.link || "products.html?cat=boxes")}"><span class="moment__img">${img(t.image, { sizes: "(max-width: 640px) 80vw, 28vw", alt: "" })}</span><span class="moment__cap"><strong>${md(t.title)}</strong><span>${md(t.text)}</span></span></a>`; }).join("")}</div><div class="rail-progress" aria-hidden="true"><i></i></div></div>
      ${st.cta_label ? `<div class="row cta-row">${tlink(st.cta_label, st.cta_link)}</div>` : ""}
    </div></section>`;

  R.compare = (s, st) => {
    const col = (title, items, isNew) => `<div class="compare__col compare__col--${isNew ? "new" : "old"}" data-reveal><h3>${md(title)}</h3><ul>${list(items).map((i) => `<li>${isNew ? I("check") : I("minus")}<span>${md(i)}</span></li>`).join("")}</ul></div>`;
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { noCta: true })}<div class="compare">${col(st.old_title, st.old_items)}${col(st.new_title, st.new_items, true)}</div></div></section>`;
  };

  R.quote = (s, st) => `<section class="s s-quote" ${attrs(s)}>
      ${st.image ? `<div class="s-quote__bg" data-parallax-root>${img(st.image, { sizes: "100vw", alt: "", attrs: 'data-parallax="8"' })}</div>` : ""}
      <div class="wrap wrap--narrow"><blockquote data-split>${md(st.quote)}</blockquote>${st.cite ? `<cite>${esc(st.cite)}</cite>` : ""}</div>
    </section>`;

  R.cta = (s, st) => {
    const dark = st.style === "forest";
    return `<section class="s sec" ${attrs(s)}><div class="wrap wrap--wide"><div class="cta-block${dark ? " cta-block--dark" : ""}">
      ${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}${ctas(st, dark)}
    </div></div></section>`;
  };

  R.steps = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { noCta: true })}
      <ol class="steps" data-stagger>${blocks.map((b, i) => { const t = b.settings || {}; return `<li class="steps__item"><span class="steps__n">${two(i)}</span><h3>${md(t.title)}</h3><p>${md(t.text)}</p></li>`; }).join("")}</ol>
    </div></section>`;

  R.features = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide">${head(st, { noCta: true })}
      <div class="features" style="--cols:${Math.min(4, Math.max(2, +st.cols || 3))}" data-stagger>${blocks.map((b, i) => { const t = b.settings || {}; return `<div class="feature">${st.numbered ? `<span class="feature__n">${two(i)}</span>` : `<span class="feature__ic">${I(t.icon || "leaf")}</span>`}<h3>${md(t.title)}</h3><p>${md(t.text)}</p></div>`; }).join("")}</div>
    </div></section>`;

  R.areas = (s, st) => {
    const areas = (T.settings().areas || []);
    return `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide"><div class="areas">
      <div class="areas__copy">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}
        <ol class="area-list" data-stagger>${areas.map((a, i) => `<li><span class="n">${two(i)}</span>${esc(a)}<span class="area-list__t">Next-day</span></li>`).join("")}</ol>${st.note ? `<p class="muted small">${md(st.note)}</p>` : ""}</div>
      ${st.image ? `<figure class="areas__media"><span class="areas__frame" data-clip>${img(st.image, { sizes: "(max-width: 960px) 92vw, 50vw", alt: "" })}</span><figcaption>Order before 6pm · delivered next-day</figcaption></figure>` : ""}
    </div></div></section>`;
  };

  R.contact = (s, st) => {
    const c = T.settings().contact || {}, soc = T.settings().social || {};
    const subjects = list(st.subjects);
    const info = [
      c.whatsapp || c.phone ? ["WhatsApp & phone", `${c.phone ? `<a href="tel:${esc(String(c.phone).replace(/\s/g, ""))}">${esc(c.phone)}</a>` : ""}${c.whatsapp ? ` · <a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">Chat on WhatsApp</a>` : ""}<br>Fastest for anything about a live order.`] : null,
      c.email ? ["Email", `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>For everything else.`] : null,
      c.hours ? ["Hours", esc(c.hours)] : null,
      ["Follow along", `Seasonal notes and hosting ideas${soc.instagram ? ` — <a href="${esc(soc.instagram)}" target="_blank" rel="noopener">@freshvalley.eg</a>` : ""}`],
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
        <div class="full row contact__send"><p class="muted small">${md(st.note)}</p><button class="btn" type="submit">Send message<span class="btn__ic">${I("arrow")}</span></button></div>
      </form>
      <div class="contact__info" data-stagger>${info.map(([h, p]) => `<div class="info-card"><p class="label">${h}</p><span>${p}</span></div>`).join("")}</div>
    </div></div></section>`;
  };

  R.faq = (s, st, blocks) => `<section class="s sec ${band(st.band)}" ${attrs(s)}><div class="wrap wrap--wide"><div class="faq">
      <div class="faq__head">${eyebrow(st.eyebrow)}<h2 data-split>${md(st.title)}</h2>${st.text ? `<p class="lede">${md(st.text)}</p>` : ""}</div>
      <div class="acc">${blocks.map((b, i) => { const t = b.settings || {}; return `<details${i === 0 ? " open" : ""}><summary>${md(t.q)}<span class="pm" aria-hidden="true"></span></summary><div class="acc__panel">${paras(t.a)}</div></details>`; }).join("")}</div>
    </div></div></section>`;

  R.legal = (s, st, blocks) => {
    const slug = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<section class="s sec band--paper" ${attrs(s)}><div class="wrap wrap--wide"><div class="legal">
      <nav class="legal__toc" aria-label="On this page"><p class="label">On this page</p>${blocks.map((b) => `<a href="#${slug(b.settings.title)}">${esc(b.settings.title)}</a>`).join("")}</nav>
      <div class="legal__body">${st.updated ? `<p class="legal__updated">${esc(st.updated)}</p>` : ""}${blocks.map((b) => `<section id="${slug(b.settings.title)}"><h2>${esc(b.settings.title)}</h2>${paras(b.settings.body)}</section>`).join("")}</div>
    </div></div></section>`;
  };

  /* Retired in v5 — saved themes that still list them simply render nothing */
  R.marquee = () => "";
  R.testimonials = () => "";

  /* ------------------------------------------------------------------ *
   * Schema — drives the admin theme editor forms
   * ------------------------------------------------------------------ */
  const F = (id, type, label, extra) => Object.assign({ id, type, label }, extra || {});
  const BAND = F("band", "select", "Background", { options: [["paper", "Linen"], ["mist", "Herb mist"], ["kraft", "Kraft"], ["dark", "Forest"]] });
  const HEAD = [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading", { info: "*word* = light italic accent" }), F("text", "textarea", "Text")];
  const CTA = [F("cta_label", "text", "Button label"), F("cta_link", "link", "Button link")];
  const CTA2 = [F("cta2_label", "text", "Second link label"), F("cta2_link", "link", "Second link")];
  const COLL = [["now", "In season now (smart)"], ["seasonal", "Seasonal"], ["best-sellers", "House favourites"], ["essentials", "Essentials"], ["hosting", "Hosting"], ["organic-reserve", "Organic Reserve"], ["premium", "Premium (smart)"], ["organic", "Organic (smart)"], ["fruits", "Fruits"], ["vegetables", "Vegetables"], ["herbs", "Herbs"], ["all", "Everything"]];
  const SCHEMA = {
    hero: { name: "Hero", icon: "star", limit: 1, settings: [F("almanac", "toggle", "Show the live almanac line", { info: "e.g. “Week 39 · Early autumn in the valley”" }), F("eyebrow", "text", "Eyebrow (when the almanac is off)"), F("title", "textarea", "Headline", { info: "One line per row · *word* = italic accent" }), F("lede", "textarea", "Intro"), F("cta1_label", "text", "Button label"), F("cta1_link", "link", "Button link"), F("cta2_label", "text", "Second link label"), F("cta2_link", "link", "Second link"), F("image", "image", "Image"), F("image_alt", "text", "Image description"), F("caption", "text", "Image caption"), F("peak", "toggle", "List what's at its best this week")] },
    statement: { name: "Statement", icon: "leaf", settings: [F("eyebrow", "text", "Eyebrow"), F("text", "textarea", "Statement", { info: "*word* = italic accent" }), F("sign", "text", "Signed by"), ...CTA, BAND] },
    categories: { name: "Category index", icon: "grid", settings: [...HEAD, ...CTA, BAND], blocks: { tile: { name: "Tile", settings: [F("title", "text", "Title"), F("text", "text", "Text"), F("image", "image", "Image", { info: "Leave empty for the typographic herb label" }), F("link", "link", "Link"), F("count", "select", "Show product count of", { options: [["", "—"], ["fruits", "Fruits"], ["vegetables", "Vegetables"], ["herbs", "Herbs"], ["boxes", "Boxes"], ["seasonal", "Seasonal"], ["organic-reserve", "Organic Reserve"]] })] } }, max_blocks: 6 },
    product_rail: { name: "Product carousel", icon: "bag", settings: [...HEAD, F("collection", "select", "Collection", { options: COLL }), F("limit", "range", "Products shown", { min: 4, max: 20, step: 1 }), ...CTA, BAND] },
    almanac: { name: "Valley Almanac", icon: "calendar", settings: [...HEAD, F("limit", "range", "Crops shown", { min: 4, max: 16, step: 1 }), BAND] },
    origins: { name: "Provenance", icon: "pin", settings: [...HEAD, BAND] },
    story: { name: "Hosting story", icon: "gift", settings: [...HEAD, F("image", "image", "Image"), F("struck", "list", "Crossed-out gifts"), ...CTA, ...CTA2, BAND], blocks: { step: { name: "Step", settings: [F("title", "text", "Title"), F("text", "textarea", "Text")] } }, max_blocks: 5 },
    boxes: { name: "Boxes", icon: "box", settings: [...HEAD, F("boxes", "boxes", "Boxes"), ...CTA, BAND] },
    stats: { name: "Numbers", icon: "check", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), BAND], blocks: { stat: { name: "Number", settings: [F("value", "text", "Value"), F("decimals", "range", "Decimals", { min: 0, max: 2, step: 1 }), F("suffix", "text", "Suffix"), F("label", "text", "Label")] } }, max_blocks: 4 },
    image_text: { name: "Image with text", icon: "leaf", settings: [...HEAD, F("list", "list", "Numbered list", { info: "One per line · Title — text" }), F("image", "image", "Image"), F("chip", "text", "Image caption"), ...CTA, F("flip", "toggle", "Image on the right"), BAND] },
    banner: { name: "Image banner", icon: "truck", settings: [...HEAD, F("image", "image", "Image"), ...CTA, ...CTA2] },
    journal: { name: "Field notes", icon: "leaf", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), F("limit", "range", "Posts (0 = all)", { min: 0, max: 12, step: 1 }), F("layout", "select", "Layout", { options: [["grid", "Three cards"], ["magazine", "Feature + list"]] }), ...CTA] },
    page_head: { name: "Page header", icon: "home", settings: [...HEAD, ...CTA, ...CTA2, F("image", "image", "Image"), F("caption", "text", "Image caption"), F("compact", "toggle", "Compact")] },
    strike_list: { name: "Crossed-out list", icon: "x", settings: [...HEAD, F("items", "list", "Items", { info: "One per line · Item — note" }), BAND] },
    seasons: { name: "Four seasons", icon: "sparkle", settings: [...HEAD, BAND], blocks: { season: { name: "Season", settings: [F("image", "image", "Image"), F("label", "text", "Label"), F("title", "text", "Title"), F("text", "text", "Text")] } }, max_blocks: 4 },
    hscroll: { name: "Ritual steps", icon: "arrow", settings: [...HEAD, BAND], blocks: { card: { name: "Card", settings: [F("title", "text", "Title"), F("text", "text", "Text"), F("image", "image", "Image")] } }, max_blocks: 8 },
    gallery: { name: "Moments carousel", icon: "gift", settings: [...HEAD, ...CTA, BAND], blocks: { moment: { name: "Moment", settings: [F("image", "image", "Image"), F("title", "text", "Title"), F("text", "text", "Text"), F("link", "link", "Link")] } } },
    compare: { name: "Comparison", icon: "check", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), F("old_title", "text", "Left title"), F("old_items", "list", "Left items"), F("new_title", "text", "Right title"), F("new_items", "list", "Right items"), BAND] },
    quote: { name: "Big quote", icon: "sparkle", settings: [F("quote", "textarea", "Quote"), F("cite", "text", "Attribution"), F("image", "image", "Background image")] },
    cta: { name: "Call to action", icon: "arrow", settings: [...HEAD, ...CTA, ...CTA2, F("style", "select", "Style", { options: [["mist", "Herb mist"], ["forest", "Forest"]] })] },
    steps: { name: "Numbered steps", icon: "check", settings: [...HEAD, BAND], blocks: { step: { name: "Step", settings: [F("title", "text", "Title"), F("text", "textarea", "Text")] } }, max_blocks: 6 },
    features: { name: "Feature columns", icon: "shield", settings: [...HEAD, F("cols", "range", "Columns", { min: 2, max: 4, step: 1 }), F("numbered", "toggle", "Numbers instead of icons"), BAND], blocks: { feature: { name: "Column", settings: [F("icon", "icon", "Icon"), F("title", "text", "Title"), F("text", "textarea", "Text")] } } },
    areas: { name: "Delivery areas", icon: "pin", settings: [...HEAD, F("note", "text", "Note"), F("image", "image", "Image"), BAND] },
    contact: { name: "Contact form", icon: "mail", settings: [F("eyebrow", "text", "Eyebrow"), F("title", "text", "Heading"), F("subjects", "list", "Subjects"), F("note", "text", "Note"), BAND] },
    faq: { name: "FAQ", icon: "plus", settings: [...HEAD, BAND], blocks: { qa: { name: "Question", settings: [F("q", "text", "Question"), F("a", "textarea", "Answer")] } } },
    legal: { name: "Policy text", icon: "shield", only: ["policies", "terms"], settings: [F("updated", "text", "Updated line")], blocks: { clause: { name: "Clause", settings: [F("title", "text", "Title"), F("body", "textarea", "Body", { info: "Blank line = new paragraph · start lines with - for bullets" })] } } },
  };
  const sec = (page, id) => { const pg = T.defaults().pages[page]; return (pg && pg.sections.find((x) => x.id === id)) || { settings: {} }; };
  const PRESETS = {
    hero: () => sec("index", "hero"),
    statement: () => sec("index", "intro"),
    categories: () => sec("index", "categories"),
    product_rail: () => ({ settings: { eyebrow: "Hand-picked", title: "New to the *market*", text: "", collection: "now", limit: 10, cta_label: "Shop all", cta_link: "products.html", band: "paper" } }),
    almanac: () => sec("index", "almanac"),
    origins: () => sec("index", "origins"),
    story: () => sec("index", "story"),
    boxes: () => ({ settings: { eyebrow: "Curated", title: "Our *boxes*", text: "", boxes: "hosting-box,premium-fruit-box,family-box", cta_label: "All boxes", cta_link: "products.html?cat=boxes", band: "paper" } }),
    stats: () => sec("index", "facts"),
    image_text: () => ({ settings: { eyebrow: "Our story", title: "A heading with an *accent*", text: "Tell the story in a sentence or two.", list: "", image: "banner:delivery-van", chip: "", cta_label: "", cta_link: "", flip: false, band: "paper" } }),
    banner: () => ({ settings: { eyebrow: "Next-day delivery", title: "A banner *headline*", text: "Short supporting line.", image: "banner:door-delivery", cta_label: "Shop now", cta_link: "products.html", cta2_label: "", cta2_link: "" } }),
    journal: () => ({ settings: { eyebrow: "Field notes", title: "Notes from the *valley*", limit: 3, layout: "grid", cta_label: "All field notes", cta_link: "journal.html" } }),
    page_head: () => ({ settings: { eyebrow: "Eyebrow", title: "Page *title*", text: "" } }),
    strike_list: () => sec("hosting", "forgettable"),
    seasons: () => sec("hosting", "philosophy"),
    hscroll: () => sec("hosting", "ritual"),
    gallery: () => sec("hosting", "moments"),
    compare: () => sec("hosting", "difference"),
    quote: () => sec("hosting", "belief"),
    cta: () => sec("hosting", "begin"),
    steps: () => sec("about", "quality"),
    features: () => sec("about", "values"),
    areas: () => sec("about", "areas"),
    contact: () => sec("contact", "form"),
    faq: () => sec("contact", "faq"),
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
     only while it still matches (any CMS edit, or a new almanac week,
     changes it → live re-render). */
  function signature(key) {
    const str = JSON.stringify([T.page(key), T.settings(), FV.catalog, FV.settings.currency, FV.almanac().week]);
    let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36) + str.length.toString(36);
  }
  function behave(root) {
    root = root || document;
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

  return { render: renderSection, renderPageHTML, renderInto, behave, signature, schema: SCHEMA, presets: PRESETS, ART, img, md, list };
})();
