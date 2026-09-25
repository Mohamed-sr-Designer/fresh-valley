/* =====================================================================
   FRESH VALLEY Admin — Catalog: products, product editor, boxes,
   collections, inventory. Built-in products are edited through
   fv_catalog overrides; new products live in fv_catalog.custom.
   ===================================================================== */
(function () {
  "use strict";
  const { esc, icon, money, num, cat, data, fmtDate } = A;
  const FV = A.FV, D = A.D;
  const CATS = [["fruits", "Fruits"], ["vegetables", "Vegetables"], ["herbs", "Herbs"]];
  const COLLS = [["best-sellers", "Best sellers"], ["essentials", "Essentials"], ["hosting", "Hosting"], ["seasonal", "Seasonal"], ["organic-reserve", "Organic Reserve"]];
  const BADGES = [["export", "Export-grade"], ["organic", "Organic"], ["seasonal", "Seasonal"]];
  const STATUS_B = { active: "bdg--ok", draft: "bdg--info", archived: "" };
  const thumb = (p) => { const s = cat.pimg(p); return s ? `<img class="thumb" src="${esc(s)}" alt="" loading="lazy">` : `<span class="thumb-art">${icon("leaf2")}</span>`; };
  const isCustom = (slug) => cat.get().custom.some((c) => c.slug === slug);
  const lowAt = () => +(A.settings.get().lowStock || 5);
  function stockLabel(p) {
    const s = cat.stockOf(p);
    if (s == null) return `<span class="faint">Not tracked</span>`;
    if (s <= 0) return `<span class="bdg bdg--bad">Out of stock</span>`;
    return s <= lowAt() ? `<span class="bdg bdg--warn">${num(s)} in stock</span>` : `<span>${num(s)} in stock</span>`;
  }
  function sold90(slug) {
    const from = Date.now() - 90 * A.DAY; let units = 0, rev = 0;
    data.orders().forEach((o) => { if (new Date(o.date).getTime() < from || o.status === "cancelled" || o.status === "refunded") return; o.items.forEach((it) => { if (it.slug === slug) { units += it.qty || 1; rev += (it.price || 0) * (it.qty || 1); } }); });
    return { units, rev };
  }
  /* Write product fields to overrides + mirror them into memory */
  function saveProduct(p, f) {
    const custom = isCustom(p.slug);
    cat.update((c) => {
      if (custom) {
        const x = c.custom.find((z) => z.slug === p.slug);
        Object.assign(x, f);
        if (f.price != null) { if (x.unit === "kg") x.pricePerKg = +f.price; else x.pricePerUnit = +f.price; delete x.price; }
        c.pmeta[p.slug] = Object.assign(c.pmeta[p.slug] || {}, { status: f.status || x.status || "active" });
      } else {
        if (f.price != null) c.prices[p.slug] = +f.price;
        const meta = Object.assign({}, f); delete meta.price;
        c.pmeta[p.slug] = Object.assign(c.pmeta[p.slug] || {}, meta);
      }
    });
    const m = Object.assign({}, f);
    if (m.price != null) { if (p.unit === "kg") p.pricePerKg = +m.price; else p.pricePerUnit = +m.price; delete m.price; }
    Object.assign(p, m);
    if (m.image) p.noPhoto = false;
  }
  A.saveProduct = saveProduct;

  /* ------------------------------------------------------------------ *
   * Products list
   * ------------------------------------------------------------------ */
  A.route("/products", (root, prm, q) => {
    const st = { tab: q.get("tab") || "all", q: "", catF: "", sort: "name", sel: new Set() };
    root.innerHTML = `<div class="page page--wide">${A.pageHead("Products", { actions: `<button class="ab" type="button" id="exp">${icon("download")}Export</button><a class="ab" href="#/boxes">${icon("gift")}Boxes</a><a class="ab ab--primary" href="#/products/new">${icon("plus")}Add product</a>` })}
      <div class="card card--flush"><div class="tabs" id="tabs" role="tablist"></div>
        <div class="toolbar"><label class="search"><span class="sr-only">Search products</span>${icon("search")}<input class="in" id="q" placeholder="Search products"></label>
          <select class="sel" id="catF" style="width:auto" aria-label="Category"><option value="">All categories</option>${CATS.map((c) => `<option value="${c[0]}">${c[1]}</option>`).join("")}</select>
          <select class="sel" id="sort" style="width:auto" aria-label="Sort"><option value="name">Name A–Z</option><option value="price-h">Price · high to low</option><option value="price-l">Price · low to high</option><option value="stock">Inventory · low first</option><option value="rating">Rating</option></select></div>
        <div id="bulk"></div><div class="tbl-wrap" id="tw"></div></div></div>`;
    const $ = (s) => root.querySelector(s);
    const TABS = [["all", "All"], ["active", "Active"], ["draft", "Draft"], ["archived", "Archived"]];
    function list() {
      let l = cat.products().slice();
      if (st.tab !== "all") l = l.filter((p) => (p.status || "active") === st.tab);
      if (st.catF) l = l.filter((p) => p.category === st.catF);
      const qq = st.q.trim().toLowerCase(); if (qq) l = l.filter((p) => (p.name + " " + p.slug + " " + (p.sku || "")).toLowerCase().includes(qq));
      const s = st.sort;
      l.sort((a, b) => s === "price-h" ? cat.price(b) - cat.price(a) : s === "price-l" ? cat.price(a) - cat.price(b) : s === "stock" ? (cat.stockOf(a) ?? 1e9) - (cat.stockOf(b) ?? 1e9) : s === "rating" ? (b.rating || 0) - (a.rating || 0) : a.name.localeCompare(b.name));
      return l;
    }
    function render() {
      const all = cat.products();
      $("#tabs").innerHTML = TABS.map((t) => `<button type="button" role="tab" data-t="${t[0]}" aria-selected="${t[0] === st.tab}">${t[1]}<span class="cnt">${t[0] === "all" ? all.length : all.filter((p) => (p.status || "active") === t[0]).length}</span></button>`).join("");
      $("#tabs").querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { st.tab = b.dataset.t; st.sel.clear(); render(); }));
      const l = list();
      $("#tw").innerHTML = l.length ? `<table class="tbl"><thead><tr><th class="w-chk"><input type="checkbox" id="all" aria-label="Select all"${l.length && l.every((p) => st.sel.has(p.slug)) ? " checked" : ""}></th><th></th><th>Product</th><th>Status</th><th>Inventory</th><th>Category</th><th class="r">Price</th><th class="r">Rating</th></tr></thead><tbody>
        ${l.map((p) => `<tr class="is-link${st.sel.has(p.slug) ? " is-sel" : ""}" data-s="${esc(p.slug)}"><td class="w-chk"><input type="checkbox" data-sel="${esc(p.slug)}" aria-label="Select ${esc(p.name)}"${st.sel.has(p.slug) ? " checked" : ""}></td><td style="width:52px">${thumb(p)}</td>
          <td><span class="strong">${esc(p.name)}</span>${isCustom(p.slug) ? ` <span class="bdg bdg--plain bdg--info">Custom</span>` : ""}<div class="sub">${esc(p.slug)}${p.sku ? " · " + esc(p.sku) : ""}</div></td>
          <td><span class="bdg ${STATUS_B[p.status || "active"]}">${esc((p.status || "active").replace(/^./, (c) => c.toUpperCase()))}</span></td><td>${stockLabel(p)}</td><td>${esc((p.category || "").replace(/^./, (c) => c.toUpperCase()))}</td>
          <td class="r num">${money(cat.price(p))} <span class="faint">${FV.cardPrice(p).per}</span>${p.compareAt ? `<div class="sub"><s>${money(p.compareAt)}</s></div>` : ""}</td><td class="r num">★ ${(p.rating || 0).toFixed(1)}</td></tr>`).join("")}
        </tbody></table>` : A.empty("No products found", "Try another search or filter.");
      $("#tw").querySelectorAll("tr[data-s]").forEach((tr) => tr.addEventListener("click", (e) => { if (e.target.closest("input")) return; A.go("/products/" + tr.dataset.s); }));
      $("#tw").querySelectorAll("[data-sel]").forEach((c) => c.addEventListener("change", () => { c.checked ? st.sel.add(c.dataset.sel) : st.sel.delete(c.dataset.sel); render(); }));
      const a = $("#all"); a && a.addEventListener("change", () => { l.forEach((p) => a.checked ? st.sel.add(p.slug) : st.sel.delete(p.slug)); render(); });
      const b = $("#bulk");
      if (!st.sel.size) { b.innerHTML = ""; return; }
      b.innerHTML = `<div class="bulk"><b>${st.sel.size} selected</b><span style="flex:1"></span><button class="ab" type="button" data-b="active">Set active</button><button class="ab" type="button" data-b="draft">Set draft</button><button class="ab" type="button" data-b="archived">Archive</button><button class="ab" type="button" data-b="coll">${icon("stack")}Add to collection</button><button class="ab ab--plain" type="button" data-b="clear" style="color:#fff">Clear</button></div>`;
      b.querySelectorAll("[data-b]").forEach((x) => x.addEventListener("click", (e) => {
        const k = x.dataset.b, sel = cat.products().filter((p) => st.sel.has(p.slug));
        if (k === "clear") { st.sel.clear(); render(); return; }
        if (k === "coll") { A.menu(e.currentTarget, COLLS.map(([v, l]) => ({ label: l, fn: () => { sel.forEach((p) => { const c = new Set(p.collections || []); c.add(v); saveProduct(p, { collections: Array.from(c) }); }); A.toast("Added to " + l); render(); } }))); return; }
        sel.forEach((p) => saveProduct(p, { status: k }));
        A.toast(sel.length + " products set to " + k); st.sel.clear(); render();
      }));
    }
    let t; $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; render(); }, 150); });
    $("#catF").addEventListener("change", (e) => { st.catF = e.target.value; render(); });
    $("#sort").addEventListener("change", (e) => { st.sort = e.target.value; render(); });
    $("#exp").addEventListener("click", () => A.csv("products.csv", [["Handle", "Name", "Status", "Category", "Unit", "Price", "Compare at", "Cost", "Stock", "SKU", "Origin", "Season", "Collections", "Badges", "Rating"]].concat(list().map((p) => [p.slug, p.name, p.status || "active", p.category, p.unit, cat.price(p), p.compareAt || "", p.cost || "", cat.stockOf(p) ?? "", p.sku || "", p.origin, p.season, (p.collections || []).join(" "), (p.badges || []).join(" "), p.rating]))));
    render();
  }, { perm: "products" });

  /* ------------------------------------------------------------------ *
   * Product editor
   * ------------------------------------------------------------------ */
  A.route("/products/:slug", (root, prm) => {
    const isNew = prm.slug === "new";
    const p = isNew ? { slug: "", name: "", category: "fruits", unit: "kg", pricePerKg: 100, pricePerUnit: 0, origin: "", season: "All year", rating: 5, reviews: 0, badges: [], collections: [], short: "", desc: "", storage: "", status: "draft", noPhoto: true, image: "" } : FV.find(prm.slug);
    if (!p) { root.innerHTML = `<div class="page">${A.empty("Product not found", "", `<a class="ab" href="#/products">Back to products</a>`)}</div>`; return; }
    const f = { name: p.name, short: p.short || "", desc: p.desc || "", image: FV.isCustomImg(p.image) ? p.image : "", price: cat.price(p) || 0, compareAt: p.compareAt || "", cost: p.cost || "", track: p.stock != null && p.stock !== "", stock: p.stock != null && p.stock !== "" ? +p.stock : 0, sku: p.sku || "", origin: p.origin || "", season: p.season || "", storage: p.storage || "", status: p.status || "active", category: p.category, unit: p.unit, collections: (p.collections || []).slice(), badges: (p.badges || []).slice(), featured: !!p.featured, seo: Object.assign({ title: "", description: "" }, p.seo || {}) };
    const orig = JSON.stringify(f);
    const ins = isNew ? { units: 0, rev: 0 } : sold90(p.slug);
    const perLbl = () => f.unit === "kg" ? "per kg" : f.unit === "bunch" ? "per bunch" : "each";
    root.innerHTML = `<div class="page">${A.pageHead(isNew ? "Add product" : p.name, { back: "#/products", badges: isNew ? "" : `<span class="bdg ${STATUS_B[f.status]}">${esc(f.status.replace(/^./, (c) => c.toUpperCase()))}</span>`, actions: isNew ? "" : `<a class="ab" href="../product.html?slug=${esc(p.slug)}" target="_blank" rel="noopener">${icon("eye")}View</a><button class="ab ab--icon" type="button" id="more" aria-label="More">${icon("dots")}</button>` })}
      <form class="cols" id="pf" novalidate><div class="stack">
        <div class="card"><div class="card__bd" style="display:grid;gap:12px">
          <div class="fld"><label for="fName">Title</label><input class="in" id="fName" data-f="name" value="${esc(f.name)}" required placeholder="e.g. Winter Strawberries"></div>
          <div class="fld"><label for="fShort">Short description</label><input class="in" id="fShort" data-f="short" value="${esc(f.short)}" placeholder="One line for cards and search"></div>
          <div class="fld"><label for="fDesc">Description</label><textarea class="ta" id="fDesc" data-f="desc" rows="5">${esc(f.desc)}</textarea></div></div></div>
        <div class="card"><div class="card__hd"><h2>Media</h2></div><div class="card__bd"><div class="media-pick"><div class="media-pick__img" id="mImg"></div>
          <div class="stack" style="gap:8px"><p class="muted small">Square photos work best (1000 × 1000). ${isNew ? "" : "Built-in photos live in assets/img/products — replacing here overrides them on the storefront."}</p>
            <div class="row"><button class="ab" type="button" id="mPick">${icon("image")}Choose image</button><button class="ab" type="button" id="mUrl">${icon("link")}Use URL</button><button class="ab ab--plain" type="button" id="mReset">Reset</button></div></div></div></div></div>
        <div class="card"><div class="card__hd"><h2>Pricing</h2></div><div class="card__bd"><div class="grid-3">
          <div class="fld"><label for="fPrice">Price <span class="faint" id="perL">${perLbl()}</span></label><div class="in-group"><span>EGP</span><input class="in" id="fPrice" type="number" min="0" step="1" data-f="price" data-num value="${f.price}"></div></div>
          <div class="fld"><label for="fCmp">Compare-at price</label><div class="in-group"><span>EGP</span><input class="in" id="fCmp" type="number" min="0" data-f="compareAt" data-num value="${esc(f.compareAt)}"></div></div>
          <div class="fld"><label for="fCost">Cost per item</label><div class="in-group"><span>EGP</span><input class="in" id="fCost" type="number" min="0" data-f="cost" data-num value="${esc(f.cost)}"></div></div></div>
          <p class="small muted" id="margin" style="margin-top:10px"></p>
          ${f.unit === "kg" ? `<div class="hint-box hint-box--info" style="margin-top:10px">${icon("info")}<span>Weights from ½ kg to 4 kg are priced automatically from this per-kg price, with gentle savings on 2, 3 and 4 kg.</span></div>` : ""}</div></div>
        <div class="card"><div class="card__hd"><h2>Inventory</h2></div><div class="card__bd" style="display:grid;gap:12px">
          <label class="row"><span style="flex:1"><b>Track quantity</b><br><span class="small faint">Shows "sold out" on the storefront at 0 and warns you when stock runs low.</span></span>${A.switchEl("fTrack", f.track, "Track quantity")}</label>
          <div class="grid-2"><div class="fld"><label for="fStock">Quantity available</label><input class="in" id="fStock" type="number" min="0" data-f="stock" data-num value="${f.stock}"${f.track ? "" : " disabled"}></div>
          <div class="fld"><label for="fSku">SKU</label><input class="in" id="fSku" data-f="sku" value="${esc(f.sku)}" placeholder="FV-${esc((p.slug || "new").toUpperCase().slice(0, 8))}"></div></div></div></div>
        <div class="card"><div class="card__hd"><h2>Provenance</h2></div><div class="card__bd"><div class="grid-2">
          <div class="fld"><label for="fOrigin">Origin</label><input class="in" id="fOrigin" data-f="origin" value="${esc(f.origin)}" placeholder="e.g. Ismailia, Egypt"></div>
          <div class="fld"><label for="fSeason">Season</label><input class="in" id="fSeason" data-f="season" value="${esc(f.season)}" placeholder="e.g. Jul – Sep"></div></div>
          <div class="fld" style="margin-top:12px"><label for="fStorage">Storage & care</label><input class="in" id="fStorage" data-f="storage" value="${esc(f.storage)}"></div></div></div>
        <div class="card"><div class="card__hd"><h2>Search engine listing</h2></div><div class="card__bd" style="display:grid;gap:12px">
          <div class="serp" id="serp"></div>
          <div class="fld"><label for="fSeoT">Page title</label><input class="in" id="fSeoT" data-seo="title" value="${esc(f.seo.title)}" maxlength="70" placeholder="Defaults to the product title"></div>
          <div class="fld"><label for="fSeoD">Meta description</label><textarea class="ta" id="fSeoD" data-seo="description" rows="2" maxlength="160" placeholder="Defaults to the short description">${esc(f.seo.description)}</textarea></div></div></div>
      </div><div class="stack">
        <div class="card"><div class="card__hd"><h2>Status</h2></div><div class="card__bd"><select class="sel" data-f="status" aria-label="Status"><option value="active"${f.status === "active" ? " selected" : ""}>Active</option><option value="draft"${f.status === "draft" ? " selected" : ""}>Draft</option><option value="archived"${f.status === "archived" ? " selected" : ""}>Archived</option></select><p class="small faint" style="margin-top:6px">Draft and archived products are hidden from the storefront.</p></div></div>
        <div class="card"><div class="card__hd"><h2>Organisation</h2></div><div class="card__bd" style="display:grid;gap:12px">
          <div class="fld"><label for="fCat">Category</label><select class="sel" id="fCat" data-f="category">${CATS.map((c) => `<option value="${c[0]}"${c[0] === f.category ? " selected" : ""}>${c[1]}</option>`).join("")}</select></div>
          ${isNew ? `<div class="fld"><label for="fUnit">Sold</label><select class="sel" id="fUnit" data-f="unit"><option value="kg">By weight (per kg)</option><option value="piece">Per piece</option><option value="bunch">Per bunch</option></select></div>` : ""}
          <div><span class="lbl">Collections</span><div style="display:grid;gap:6px;margin-top:6px">${COLLS.map((c) => `<label class="chk"><input type="checkbox" data-coll="${c[0]}"${f.collections.includes(c[0]) ? " checked" : ""}>${c[1]}</label>`).join("")}</div></div>
          <div><span class="lbl">Badges</span><div style="display:grid;gap:6px;margin-top:6px">${BADGES.map((c) => `<label class="chk"><input type="checkbox" data-badge="${c[0]}"${f.badges.includes(c[0]) ? " checked" : ""}>${c[1]}</label>`).join("")}</div></div>
          <label class="row"><span style="flex:1"><b>Featured</b><br><span class="small faint">Sorts first in "Featured"</span></span>${A.switchEl("fFeat", f.featured, "Featured")}</label></div></div>
        ${isNew ? "" : `<div class="card"><div class="card__hd"><h2>Last 90 days</h2></div><div class="card__bd"><dl class="kv"><dt>Units sold</dt><dd>${num(ins.units)}</dd><dt>Revenue</dt><dd>${money(ins.rev)}</dd><dt>Rating</dt><dd>★ ${(p.rating || 0).toFixed(1)} · ${num(p.reviews || 0)} reviews</dd></dl></div></div>`}
        ${isNew ? `<button class="ab ab--primary" type="submit" style="height:40px">Save product</button>` : ""}
      </div></form></div>`;
    const $ = (s) => root.querySelector(s);
    const setImg = () => { const src = f.image ? A.imgRef(f.image) : isNew || p.noPhoto ? "" : A.imgRef(p.slug); $("#mImg").innerHTML = src ? `<img src="${esc(src)}" alt="">` : (A.S.ART.herbs || ""); };
    const margin = () => { const pr = +f.price || 0, co = +f.cost || 0; $("#margin").innerHTML = co ? `Margin <b>${pr ? Math.round(((pr - co) / pr) * 100) : 0}%</b> · Profit <b>${money(pr - co)}</b> ${perLbl()}` : "Add a cost to see your margin."; };
    const serp = () => { $("#serp").innerHTML = `<div class="serp__url">freshvalley.eg › product › ${esc(p.slug || "new-product")}</div><div class="serp__t">${esc((f.seo.title || f.name || "Product title") + " — Fresh Valley")}</div><div class="serp__d">${esc((f.seo.description || f.short || f.desc || "Add a description to control how this product appears in search results.").slice(0, 160))}</div>`; };
    const dirty = () => { if (isNew) return; if (JSON.stringify(f) !== orig) A.saveBar.show({ save, discard: () => { A.saveBar.hide(); A.go("/products/" + p.slug + "?r=" + Date.now()); } }); else A.saveBar.hide(); };
    root.querySelectorAll("[data-f]").forEach((el) => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => { f[el.dataset.f] = el.hasAttribute("data-num") ? (el.value === "" ? "" : +el.value) : el.value; if (el.dataset.f === "unit") $("#perL").textContent = perLbl(); margin(); serp(); dirty(); }));
    root.querySelectorAll("[data-seo]").forEach((el) => el.addEventListener("input", () => { f.seo[el.dataset.seo] = el.value; serp(); dirty(); }));
    root.querySelectorAll("[data-coll]").forEach((el) => el.addEventListener("change", () => { f.collections = Array.from(root.querySelectorAll("[data-coll]:checked")).map((x) => x.dataset.coll); dirty(); }));
    root.querySelectorAll("[data-badge]").forEach((el) => el.addEventListener("change", () => { f.badges = Array.from(root.querySelectorAll("[data-badge]:checked")).map((x) => x.dataset.badge); dirty(); }));
    A.bindSwitches(root);
    $("#fTrack").addEventListener("change", (e) => { f.track = e.target.getAttribute("aria-checked") === "true"; $("#fStock").disabled = !f.track; dirty(); });
    $("#fFeat").addEventListener("change", (e) => { f.featured = e.target.getAttribute("aria-checked") === "true"; dirty(); });
    $("#mPick").addEventListener("click", () => { if (window.FVFiles) FVFiles.picker({ title: "Product image", onPick: (ref) => { f.image = ref; setImg(); dirty(); } }); else A.toast("Media library unavailable", "bad"); });
    $("#mUrl").addEventListener("click", async () => { const u = await A.prompt("Image URL", "Paste an https:// image address", f.image && /^https?:/.test(f.image) ? f.image : ""); if (u == null) return; if (u && !/^https?:\/\//.test(u.trim())) { A.toast("Use a full https:// address", "bad"); return; } f.image = u.trim(); setImg(); dirty(); });
    $("#mReset").addEventListener("click", () => { f.image = ""; setImg(); dirty(); });
    function payload() {
      const o = { name: f.name.trim(), short: f.short.trim(), desc: f.desc.trim(), price: +f.price || 0, compareAt: f.compareAt === "" ? "" : +f.compareAt, cost: f.cost === "" ? "" : +f.cost, stock: f.track ? Math.max(0, +f.stock || 0) : "", sku: f.sku.trim(), origin: f.origin.trim(), season: f.season.trim(), storage: f.storage.trim(), status: f.status, category: f.category, collections: f.collections, badges: f.badges, featured: f.featured, seo: f.seo };
      if (f.image) o.image = f.image; else o.image = "";
      return o;
    }
    function save() {
      if (!f.name.trim()) { A.toast("Add a title first", "bad"); $("#fName").focus(); return; }
      const o = payload();
      if (!o.image) delete o.image;
      saveProduct(p, o);
      if (!f.image && FV.isCustomImg(p.image) && !isCustom(p.slug)) { cat.update((c) => { if (c.pmeta[p.slug]) c.pmeta[p.slug].image = ""; }); p.image = p.slug; p.noPhoto = !!(A.D.products.find((x) => x.slug === p.slug) || {}).noPhoto; }
      A.saveBar.hide(); A.toast("Product saved");
      A.go("/products/" + p.slug + "?r=" + Date.now());
    }
    if (isNew) {
      $("#pf").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = f.name.trim(); if (!name) { A.toast("Add a title first", "bad"); $("#fName").focus(); return; }
        let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
        while (FV.find(slug) || FV.findBox(slug)) slug += "-2";
        const o = payload();
        const prod = { slug, name, category: o.category, unit: f.unit, pricePerKg: f.unit === "kg" ? o.price : 0, pricePerUnit: f.unit === "kg" ? 0 : o.price, origin: o.origin || "Egypt", season: o.season || "All year", rating: 5, reviews: 0, badges: o.badges, collections: o.collections, short: o.short, desc: o.desc || o.short, pairings: [], storage: o.storage || "Keep cool and dry.", nutrition: { serving: "100 g", energy: "—", carbs: "—", sugars: "—", fibre: "—", vitc: "—" }, image: o.image || "", noPhoto: !o.image, compareAt: o.compareAt, cost: o.cost, stock: o.stock, sku: o.sku, featured: o.featured, seo: o.seo };
        cat.update((c) => { c.custom.push(prod); c.pmeta[slug] = { status: o.status }; });
        A.D.products.push(Object.assign({}, prod, { status: o.status }));
        A.toast("Product created"); A.go("/products/" + slug);
      });
    } else {
      $("#pf").addEventListener("submit", (e) => { e.preventDefault(); save(); });
      $("#more").addEventListener("click", (e) => A.menu(e.currentTarget, [
        { label: "View on store", icon: "ext", href: "../product.html?slug=" + p.slug, target: "_blank" },
        !isCustom(p.slug) ? { label: "Reset to original", icon: "refresh", fn: async () => { if (!(await A.confirm("Reset " + p.name + "?", "All your edits to this product (price, copy, media, stock) are removed.", { danger: true, ok: "Reset" }))) return; cat.update((c) => { delete c.pmeta[p.slug]; delete c.prices[p.slug]; }); A.toast("Reset — reloading the catalog"); setTimeout(() => location.reload(), 500); } } : null,
        isCustom(p.slug) ? { label: "Delete product", icon: "trash", danger: true, fn: async () => { if (!(await A.confirm("Delete " + p.name + "?", "This can't be undone.", { danger: true, ok: "Delete" }))) return; cat.update((c) => { c.custom = c.custom.filter((x) => x.slug !== p.slug); delete c.pmeta[p.slug]; }); A.D.products.splice(A.D.products.indexOf(p), 1); A.toast("Deleted"); A.go("/products"); } } : null,
      ]));
    }
    setImg(); margin(); serp();
  }, { perm: "products" });

  /* ------------------------------------------------------------------ *
   * Boxes
   * ------------------------------------------------------------------ */
  A.route("/boxes", (root) => {
    root.innerHTML = `<div class="page">${A.pageHead("Boxes", { back: "#/products" })}
      <p class="page__sub">Curated boxes with size tiers — the flagship of the Art of Hosting.</p>
      <div class="card card--flush"><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Box</th><th>Tiers</th><th class="r">From</th><th>Inventory</th><th class="r">Sold · 90 days</th></tr></thead><tbody>
      ${cat.boxes().map((b) => { const s = sold90(b.slug); return `<tr class="is-link" data-s="${esc(b.slug)}"><td style="width:52px"><img class="thumb" src="${esc(cat.bimg(b))}" alt=""></td><td><span class="strong">${esc(b.name)}</span><div class="sub">${esc(b.tagline)}</div></td><td>${b.tiers.map((t) => esc(t.label)).join(" · ")}</td><td class="r num">${money(Math.min(...b.tiers.map((t) => t.price)))}</td><td>${stockLabel(b)}</td><td class="r num">${num(s.units)} · ${money(s.rev)}</td></tr>`; }).join("")}
      </tbody></table></div></div></div>`;
    root.querySelectorAll("tr[data-s]").forEach((tr) => tr.addEventListener("click", () => A.go("/boxes/" + tr.dataset.s)));
  }, { perm: "products" });

  A.route("/boxes/:slug", (root, prm) => {
    const b = FV.findBox(prm.slug);
    if (!b) { A.go("/boxes"); return; }
    const f = { name: b.name, tagline: b.tagline, desc: b.desc, image: b.image, includes: (b.includes || []).join("\n"), tiers: b.tiers.map((t) => Object.assign({}, t)), track: b.stock != null && b.stock !== "", stock: +b.stock || 0, status: b.status || "active" };
    const orig = JSON.stringify(f);
    root.innerHTML = `<div class="page">${A.pageHead(b.name, { back: "#/boxes", actions: `<a class="ab" href="../product.html?box=${esc(b.slug)}" target="_blank" rel="noopener">${icon("eye")}View</a>` })}
      <div class="cols"><div class="stack">
        <div class="card"><div class="card__bd" style="display:grid;gap:12px">
          <div class="fld"><label for="bN">Title</label><input class="in" id="bN" data-f="name" value="${esc(f.name)}"></div>
          <div class="fld"><label for="bT">Tagline</label><input class="in" id="bT" data-f="tagline" value="${esc(f.tagline)}"></div>
          <div class="fld"><label for="bD">Description</label><textarea class="ta" id="bD" data-f="desc" rows="4">${esc(f.desc)}</textarea></div>
          <div class="fld"><label for="bI">What's inside</label><textarea class="ta" id="bI" data-f="includes" rows="5">${esc(f.includes)}</textarea><span class="help">One item per line.</span></div></div></div>
        <div class="card"><div class="card__hd"><h2>Sizes & prices</h2><button class="ab ab--sm" type="button" id="addT">${icon("plus")}Add size</button></div><div class="card__bd" id="tiers"></div></div>
      </div><div class="stack">
        <div class="card"><div class="card__hd"><h2>Media</h2></div><div class="card__bd"><div class="media-pick__img" id="bImg" style="margin-bottom:10px"></div><button class="ab" type="button" id="bPick">${icon("image")}Choose image</button></div></div>
        <div class="card"><div class="card__hd"><h2>Status</h2></div><div class="card__bd"><select class="sel" data-f="status" aria-label="Status"><option value="active"${f.status === "active" ? " selected" : ""}>Active</option><option value="draft"${f.status === "draft" ? " selected" : ""}>Draft</option></select></div></div>
        <div class="card"><div class="card__hd"><h2>Inventory</h2></div><div class="card__bd" style="display:grid;gap:10px"><label class="row"><span style="flex:1"><b>Track quantity</b></span>${A.switchEl("bTrack", f.track, "Track quantity")}</label><input class="in" id="bStock" type="number" min="0" data-f="stock" data-num value="${f.stock}"${f.track ? "" : " disabled"} aria-label="Quantity"></div></div>
      </div></div></div>`;
    const $ = (s) => root.querySelector(s);
    const dirty = () => { if (JSON.stringify(f) !== orig) A.saveBar.show({ save, discard: () => { A.saveBar.hide(); A.go("/boxes/" + b.slug + "?r=" + Date.now()); } }); else A.saveBar.hide(); };
    const img = () => { $("#bImg").innerHTML = `<img src="${esc(A.imgRef(f.image))}" alt="">`; };
    function tiers() {
      $("#tiers").innerHTML = f.tiers.map((t, i) => `<div class="grid-3" style="grid-template-columns:1fr 1fr 1fr auto;align-items:end;margin-bottom:10px">
        <div class="fld"><label for="tl${i}">Size</label><input class="in" id="tl${i}" data-t="${i}" data-k="label" value="${esc(t.label)}"></div>
        <div class="fld"><label for="tp${i}">Price</label><div class="in-group"><span>EGP</span><input class="in" id="tp${i}" type="number" min="0" data-t="${i}" data-k="price" value="${t.price}"></div></div>
        <div class="fld"><label for="ts${i}">Serves</label><input class="in" id="ts${i}" data-t="${i}" data-k="serves" value="${esc(t.serves)}"></div>
        <button class="ab ab--icon" type="button" data-rt="${i}" aria-label="Remove size"${f.tiers.length < 2 ? " disabled" : ""}>${icon("trash")}</button></div>`).join("");
      $("#tiers").querySelectorAll("[data-t]").forEach((el) => el.addEventListener("input", () => { const t = f.tiers[+el.dataset.t]; t[el.dataset.k] = el.dataset.k === "price" ? +el.value || 0 : el.value; dirty(); }));
      $("#tiers").querySelectorAll("[data-rt]").forEach((el) => el.addEventListener("click", () => { f.tiers.splice(+el.dataset.rt, 1); tiers(); dirty(); }));
    }
    root.querySelectorAll("[data-f]").forEach((el) => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => { f[el.dataset.f] = el.hasAttribute("data-num") ? +el.value : el.value; dirty(); }));
    A.bindSwitches(root);
    $("#bTrack").addEventListener("change", (e) => { f.track = e.target.getAttribute("aria-checked") === "true"; $("#bStock").disabled = !f.track; dirty(); });
    $("#addT").addEventListener("click", () => { f.tiers.push({ label: "New size", price: f.tiers[f.tiers.length - 1].price + 300, serves: "" }); tiers(); dirty(); });
    $("#bPick").addEventListener("click", () => { if (window.FVFiles) FVFiles.picker({ title: "Box image", onPick: (ref) => { f.image = ref; img(); dirty(); } }); });
    function save() {
      const m = { name: f.name.trim(), tagline: f.tagline.trim(), desc: f.desc.trim(), image: f.image, includes: f.includes.split("\n").map((x) => x.trim()).filter(Boolean), tiers: f.tiers.map((t) => ({ label: String(t.label).trim() || "Size", price: +t.price || 0, serves: String(t.serves || "").trim() })), stock: f.track ? Math.max(0, +f.stock || 0) : "", status: f.status };
      cat.update((c) => { c.boxes[b.slug] = m; delete c.prices[b.slug]; });
      Object.assign(b, m);
      A.saveBar.hide(); A.toast("Box saved"); A.go("/boxes/" + b.slug + "?r=" + Date.now());
    }
    img(); tiers();
  }, { perm: "products" });

  /* ------------------------------------------------------------------ *
   * Collections
   * ------------------------------------------------------------------ */
  const ALLC = CATS.map((c) => [c[0], c[1], "category"]).concat([["boxes", "Boxes", "category"]]).concat(COLLS.map((c) => [c[0], c[1], "collection"]));
  const membersOf = (key, type) => key === "boxes" ? cat.boxes() : type === "category" ? cat.products().filter((p) => p.category === key) : cat.products().filter((p) => (p.collections || []).includes(key));
  A.route("/collections", (root) => {
    const meta = cat.get().categories;
    root.innerHTML = `<div class="page">${A.pageHead("Collections", { back: "#/products" })}
      <p class="page__sub">Categories group produce on the storefront; collections are hand-picked edits that power carousels and filters.</p>
      <div class="card card--flush"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Title</th><th>Type</th><th class="r">Products</th><th>Storefront link</th></tr></thead><tbody>
      ${ALLC.map(([k, l, t]) => `<tr class="is-link" data-k="${k}"><td><span class="strong">${esc((meta[k] && meta[k].name) || l)}</span><div class="sub">${esc((meta[k] && meta[k].blurb) || (D.categories.find((c) => c.slug === k) || {}).blurb || "")}</div></td><td>${t === "category" ? "Category" : "Collection"}</td><td class="r num">${membersOf(k, t).length}</td><td><span class="faint small">products.html?${t === "category" || k === "seasonal" || k === "organic-reserve" ? "cat" : "collection"}=${k}</span></td></tr>`).join("")}
      </tbody></table></div></div></div>`;
    root.querySelectorAll("tr[data-k]").forEach((tr) => tr.addEventListener("click", () => A.go("/collections/" + tr.dataset.k)));
  }, { perm: "products" });

  A.route("/collections/:key", (root, prm) => {
    const def = ALLC.find((c) => c[0] === prm.key);
    if (!def) { A.go("/collections"); return; }
    const [key, label, type] = def;
    const base = D.categories.find((c) => c.slug === key) || { name: label, blurb: "" };
    const m = cat.get().categories[key] || {};
    const f = { name: m.name || base.name || label, blurb: m.blurb || base.blurb || "" };
    const editable = type === "collection" && key !== "boxes";
    const draw = () => {
      const mem = membersOf(key, type);
      const others = editable ? cat.products().filter((p) => !mem.includes(p)) : [];
      root.querySelector("#mem").innerHTML = `<div class="tbl-wrap"><table class="tbl"><tbody>${mem.map((p) => `<tr><td style="width:52px">${key === "boxes" ? `<img class="thumb" src="${esc(cat.bimg(p))}" alt="">` : thumb(p)}</td><td><a class="strong link" style="text-decoration:none" href="#/${key === "boxes" ? "boxes" : "products"}/${esc(p.slug)}">${esc(p.name)}</a></td><td class="r">${editable ? `<button class="ab ab--sm" type="button" data-out="${esc(p.slug)}">Remove</button>` : ""}</td></tr>`).join("") || `<tr><td>${A.empty("Empty collection", "Add products below.")}</td></tr>`}</tbody></table></div>
        ${editable ? `<div class="card__bd"><div class="row"><select class="sel" id="addSel" style="flex:1" aria-label="Product to add"><option value="">Add a product…</option>${others.map((p) => `<option value="${esc(p.slug)}">${esc(p.name)}</option>`).join("")}</select><button class="ab" type="button" id="addBtn">${icon("plus")}Add</button></div></div>` : `<div class="card__bd"><p class="small faint">${type === "category" ? "Change a product's category from its editor." : ""}</p></div>`}`;
      root.querySelectorAll("[data-out]").forEach((b) => b.addEventListener("click", () => { const p = FV.find(b.dataset.out); saveProduct(p, { collections: (p.collections || []).filter((c) => c !== key) }); A.toast("Removed from " + label); draw(); }));
      const ab = root.querySelector("#addBtn");
      ab && ab.addEventListener("click", () => { const s = root.querySelector("#addSel").value; if (!s) return; const p = FV.find(s); saveProduct(p, { collections: Array.from(new Set((p.collections || []).concat([key]))) }); A.toast("Added to " + label); draw(); });
    };
    root.innerHTML = `<div class="page">${A.pageHead(f.name, { back: "#/collections", actions: `<a class="ab" href="../products.html?${type === "category" || key === "seasonal" || key === "organic-reserve" ? "cat" : "collection"}=${esc(key)}" target="_blank" rel="noopener">${icon("eye")}View</a>` })}
      <div class="cols"><div class="card card--flush"><div class="card__hd" style="padding-bottom:12px"><h2>Products</h2></div><div id="mem"></div></div>
      <div class="card"><div class="card__hd"><h2>Storefront copy</h2></div><div class="card__bd" style="display:grid;gap:10px">
        <div class="fld"><label for="cN">Title</label><input class="in" id="cN" value="${esc(f.name)}"></div>
        <div class="fld"><label for="cB">Description</label><textarea class="ta" id="cB" rows="3">${esc(f.blurb)}</textarea></div>
        <button class="ab ab--primary" type="button" id="cSave">Save</button></div></div></div></div>`;
    root.querySelector("#cSave").addEventListener("click", () => {
      const n = root.querySelector("#cN").value.trim(), bl = root.querySelector("#cB").value.trim();
      cat.update((c) => { c.categories[key] = { name: n || label, blurb: bl }; });
      const dc = D.categories.find((c) => c.slug === key); if (dc) Object.assign(dc, { name: n || label, blurb: bl });
      A.toast("Collection saved");
    });
    draw();
  }, { perm: "products" });

  /* ------------------------------------------------------------------ *
   * Inventory
   * ------------------------------------------------------------------ */
  A.route("/inventory", (root) => {
    const st = { q: "", only: "" };
    root.innerHTML = `<div class="page page--wide">${A.pageHead("Inventory", { back: "#/products", actions: `<button class="ab" type="button" id="exp">${icon("download")}Export</button>` })}
      <div class="card card--flush"><div class="toolbar"><label class="search"><span class="sr-only">Search</span>${icon("search")}<input class="in" id="q" placeholder="Search products"></label>
        <select class="sel" id="only" style="width:auto" aria-label="Show"><option value="">All products</option><option value="tracked">Tracked only</option><option value="low">Low or out of stock</option></select>
        <label class="row small" for="low">Low-stock alert at <input class="in" id="low" type="number" min="0" value="${lowAt()}" style="width:70px;height:32px"></label></div>
        <div class="tbl-wrap" id="tw"></div></div></div>`;
    const $ = (s) => root.querySelector(s);
    function render() {
      let l = cat.products().slice().sort((a, b) => a.name.localeCompare(b.name));
      if (st.q) l = l.filter((p) => p.name.toLowerCase().includes(st.q.toLowerCase()));
      if (st.only === "tracked") l = l.filter((p) => cat.stockOf(p) != null);
      if (st.only === "low") l = l.filter((p) => { const s = cat.stockOf(p); return s != null && s <= lowAt(); });
      $("#tw").innerHTML = `<table class="tbl"><thead><tr><th></th><th>Product</th><th>SKU</th><th>Tracked</th><th>Status</th><th class="r">Available</th></tr></thead><tbody>
        ${l.map((p) => { const s = cat.stockOf(p); return `<tr><td style="width:52px">${thumb(p)}</td><td><a class="strong link" style="text-decoration:none" href="#/products/${esc(p.slug)}">${esc(p.name)}</a></td><td class="faint">${esc(p.sku || "—")}</td>
          <td>${A.switchEl("tr-" + p.slug, s != null, "Track " + p.name)}</td><td>${stockLabel(p)}</td><td class="r"><input class="in num" type="number" min="0" data-stock="${esc(p.slug)}" value="${s == null ? "" : s}" placeholder="—" aria-label="Stock for ${esc(p.name)}"${s == null ? " disabled" : ""}></td></tr>`; }).join("")}</tbody></table>`;
      A.bindSwitches($("#tw"));
      $("#tw").querySelectorAll(".switch").forEach((sw) => sw.addEventListener("change", () => { const p = FV.find(sw.id.slice(3)); const on = sw.getAttribute("aria-checked") === "true"; saveProduct(p, { stock: on ? 20 : "" }); A.toast(on ? "Tracking " + p.name + " (20 in stock)" : "Stopped tracking " + p.name); render(); }));
      $("#tw").querySelectorAll("[data-stock]").forEach((inp) => inp.addEventListener("change", () => { const p = FV.find(inp.dataset.stock); saveProduct(p, { stock: Math.max(0, +inp.value || 0) }); A.toast(p.name + " · " + Math.max(0, +inp.value || 0) + " in stock"); render(); }));
    }
    let t; $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; render(); }, 150); });
    $("#only").addEventListener("change", (e) => { st.only = e.target.value; render(); });
    $("#low").addEventListener("change", (e) => { const s = A.settings.get(); s.lowStock = Math.max(0, +e.target.value || 0); A.settings.save(s); A.toast("Low-stock alert set to " + s.lowStock); render(); });
    $("#exp").addEventListener("click", () => A.csv("inventory.csv", [["Handle", "Name", "SKU", "Tracked", "Available"]].concat(cat.products().map((p) => [p.slug, p.name, p.sku || "", cat.stockOf(p) != null ? "yes" : "no", cat.stockOf(p) ?? ""]))));
    render();
  }, { perm: "products" });
})();
