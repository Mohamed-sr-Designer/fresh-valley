/* =====================================================================
   FRESH VALLEY Admin — Online Store (themes, navigation, pages,
   preferences), Files, Settings (general, status, delivery, payments,
   taxes, users, publishing, data & demo)
   ===================================================================== */
(function () {
  "use strict";
  const { esc, icon, money, num, fmtDate, fmtDT, ago } = A;
  const T = A.T;
  const PAGES = [["index", "Home", "index.html"], ["hosting", "The Art of Hosting", "hosting.html"], ["about", "About", "about.html"], ["contact", "Contact", "contact.html"], ["journal", "Journal", "journal.html"], ["policies", "Company Policies", "policies.html"], ["terms", "Terms of Use", "terms.html"]];
  const publishedAt = () => (window.FV_CONTENT && window.FV_CONTENT.updatedAt) || (window.FVPublish && FVPublish.config().lastPublished) || null;

  function publishFlow() {
    if (!window.FVPublish) { A.toast("Publishing module unavailable", "bad"); return; }
    if (!A.auth.can("publish")) { A.toast("Only the owner or a manager can publish", "bad"); return; }
    const cfg = FVPublish.config();
    if (!cfg.hasToken) { A.go("/settings/publishing"); A.toast("Connect GitHub first"); return; }
    const m = A.modal({ title: "Publish to the live store", body: `<p class="muted">This writes your saved theme, catalog and settings to <b>${esc(cfg.owner)}/${esc(cfg.repo)}</b> (${esc(cfg.branch)}). Unsaved theme-editor changes are not included.</p><div class="hint-box" id="pubMsg">${icon("info")}<span>Ready.</span></div>`,
      actions: [{ label: "Cancel" }, { label: "Publish now", primary: true, onClick: (api) => {
        const msg = api.el.querySelector("#pubMsg span");
        api.el.querySelectorAll(".modal__ft .ab").forEach((b) => { b.disabled = true; });
        FVPublish.publish({ onProgress: (t) => { msg.textContent = t; } }).then((r) => {
          api.el.querySelectorAll(".modal__ft .ab").forEach((b) => { b.disabled = false; });
          msg.innerHTML = r.ok ? `${esc(r.msg)} <a class="link" href="${esc(r.url)}" target="_blank" rel="noopener">View commit</a>` : esc(r.msg);
          api.el.querySelector("#pubMsg").className = "hint-box " + (r.ok ? "hint-box--info" : "hint-box--bad");
          if (r.ok) A.toast("Published");
        });
        return false;
      } }] });
    return m;
  }
  A.publishFlow = publishFlow;

  /* ------------------------------------------------------------------ *
   * Online Store → Themes
   * ------------------------------------------------------------------ */
  A.route("/online-store", (root) => {
    const saved = A.theme.savedAt(), pub = publishedAt();
    const t = A.theme.get();
    root.innerHTML = `<div class="page">${A.pageHead("Themes", { actions: `<a class="ab" href="../index.html" target="_blank" rel="noopener">${icon("eye")}View store</a>` })}
      <div class="card theme-card"><div class="theme-card__pv"><iframe src="../index.html?fv_preview=1" title="Store preview" loading="lazy" tabindex="-1" aria-hidden="true"></iframe></div>
        <div class="theme-card__bd"><span class="bdg bdg--ok">Current theme</span><h2>Market Day</h2>
          <p class="muted">Fresh Valley's section-based theme — forest ink, olive accent, kraft paper, Fraunces &amp; Jakarta, and a full motion layer.</p>
          <div class="swatches" aria-label="Brand colours">${["#19291C", "#2D4630", "#AE9D57", "#8A8E57", "#E6DAC4", "#F3EDE1", "#7A2B21"].map((c) => `<i style="background:${c}" title="${c}"></i>`).join("")}</div>
          <dl class="kv"><dt>Last saved</dt><dd>${saved ? esc(ago(saved)) : "Using defaults"}</dd><dt>Published</dt><dd>${pub ? esc(fmtDT(pub)) : "Not yet"}</dd><dt>Pages</dt><dd>${Object.keys(t.pages).length} theme pages</dd></dl>
          <div class="row"><a class="ab ab--primary" href="theme.html">${icon("palette")}Customize</a>${A.auth.can("publish") ? `<button class="ab" type="button" id="pub">${icon("upload")}Publish</button>` : ""}<button class="ab ab--icon" type="button" id="more" aria-label="More">${icon("dots")}</button></div></div></div>
      <div class="card"><div class="card__hd"><h2>Theme pages</h2></div><div class="card__bd" style="padding:6px 0 8px">
        ${PAGES.map(([k, l, f]) => { const pg = t.pages[k]; return `<div class="li"><span class="todo__ic">${icon("doc")}</span><span class="li__main"><span class="li__t">${esc(l)}</span><span class="li__s">${pg ? pg.sections.length + " sections · " + pg.sections.filter((s) => s.disabled).length + " hidden" : ""}</span></span><a class="ab ab--sm" href="../${f}" target="_blank" rel="noopener">View</a><a class="ab ab--sm ab--primary" href="theme.html?page=${k}">Customize</a></div>`; }).join("")}
      </div></div></div>`;
    const pb = root.querySelector("#pub"); pb && pb.addEventListener("click", publishFlow);
    root.querySelector("#more").addEventListener("click", (e) => A.menu(e.currentTarget, [
      { label: "Download content.js", icon: "download", fn: () => { if (window.FVPublish) FVPublish.download(); } },
      { label: "Export theme JSON", icon: "download", fn: () => A.download("fresh-valley-theme.json", JSON.stringify(A.theme.get(), null, 2)) },
      { label: "Reset theme to default", icon: "refresh", danger: true, fn: async () => { if (await A.confirm("Reset the whole theme?", "Every section and setting returns to the original Market Day defaults in this browser.", { danger: true, ok: "Reset theme" })) { T.reset(); A.toast("Theme reset"); A.go("/online-store?r=" + Date.now()); } } },
    ]));
  }, { perm: "store" });

  /* ------------------------------------------------------------------ *
   * Navigation (header + footer menus)
   * ------------------------------------------------------------------ */
  A.route("/navigation", (root) => {
    const t = A.theme.get();
    const st = { nav: t.settings.nav.map((x) => Object.assign({}, x)), cols: t.settings.footer.columns.map((c) => ({ title: c.title, links: c.links.map((l) => Object.assign({}, l)) })) };
    const orig = JSON.stringify(st);
    const LINKS = [["index.html", "Home"], ["products.html", "All products"], ["products.html?cat=boxes", "Boxes"], ["products.html?cat=fruits", "Fruits"], ["products.html?cat=vegetables", "Vegetables"], ["products.html?cat=herbs", "Herbs"], ["products.html?cat=seasonal", "Seasonal"], ["products.html?cat=organic-reserve", "Organic Reserve"], ["products.html?collection=best-sellers", "Best sellers"], ["hosting.html", "The Art of Hosting"], ["about.html", "About"], ["journal.html", "Journal"], ["contact.html", "Contact"], ["contact.html#areas", "Delivery areas"], ["policies.html", "Policies"], ["terms.html", "Terms"], ["account.html", "Account"], ["wishlist.html", "Wishlist"]];
    const row = (l, path) => `<div class="row" style="flex-wrap:nowrap;margin-bottom:8px" data-row="${path}"><input class="in" data-k="label" value="${esc(l.label)}" aria-label="Label" style="flex:1"><input class="in" data-k="href" value="${esc(l.href)}" aria-label="Link" list="lnk" style="flex:1.3"><button class="ab ab--icon" type="button" data-up aria-label="Move up">↑</button><button class="ab ab--icon" type="button" data-down aria-label="Move down">↓</button><button class="ab ab--icon" type="button" data-del aria-label="Remove">${icon("trash")}</button></div>`;
    function render() {
      root.innerHTML = `<div class="page page--narrow">${A.pageHead("Navigation", { back: "#/online-store" })}
        <datalist id="lnk">${LINKS.map((l) => `<option value="${l[0]}">${l[1]}</option>`).join("")}</datalist>
        <div class="card"><div class="card__hd"><h2>Main menu</h2><button class="ab ab--sm" type="button" data-add="nav">${icon("plus")}Add link</button></div><div class="card__bd">${st.nav.map((l, i) => row(l, "nav." + i)).join("")}<p class="small faint">Shown in the header and the mobile menu. Keep it to five or six links.</p></div></div>
        ${st.cols.map((c, ci) => `<div class="card"><div class="card__hd"><input class="in" data-col="${ci}" value="${esc(c.title)}" aria-label="Column title" style="max-width:260px;font-weight:700"><div class="row"><button class="ab ab--sm" type="button" data-add="col.${ci}">${icon("plus")}Add link</button><button class="ab ab--sm ab--plain" type="button" data-delcol="${ci}">Remove column</button></div></div><div class="card__bd">${c.links.map((l, i) => row(l, "col." + ci + "." + i)).join("")}</div></div>`).join("")}
        <button class="ab" type="button" id="addCol" style="align-self:flex-start">${icon("plus")}Add footer column</button></div>`;
      root.querySelectorAll("[data-row]").forEach((r) => {
        const path = r.dataset.row.split("."), list = path[0] === "nav" ? st.nav : st.cols[+path[1]].links, i = +path[path.length - 1];
        r.querySelectorAll("[data-k]").forEach((inp) => inp.addEventListener("input", () => { list[i][inp.dataset.k] = inp.value; dirty(); }));
        r.querySelector("[data-up]").addEventListener("click", () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; render(); dirty(); } });
        r.querySelector("[data-down]").addEventListener("click", () => { if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; render(); dirty(); } });
        r.querySelector("[data-del]").addEventListener("click", () => { list.splice(i, 1); render(); dirty(); });
      });
      root.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => { const p = b.dataset.add.split("."); (p[0] === "nav" ? st.nav : st.cols[+p[1]].links).push({ label: "New link", href: "products.html" }); render(); dirty(); }));
      root.querySelectorAll("[data-col]").forEach((inp) => inp.addEventListener("input", () => { st.cols[+inp.dataset.col].title = inp.value; dirty(); }));
      root.querySelectorAll("[data-delcol]").forEach((b) => b.addEventListener("click", () => { st.cols.splice(+b.dataset.delcol, 1); render(); dirty(); }));
      root.querySelector("#addCol").addEventListener("click", () => { st.cols.push({ title: "New column", links: [] }); render(); dirty(); });
    }
    function dirty() { if (JSON.stringify(st) !== orig) A.saveBar.show({ save, discard: () => { A.saveBar.hide(); A.go("/navigation?r=" + Date.now()); } }); else A.saveBar.hide(); }
    function save() {
      const th = A.theme.get();
      th.settings.nav = st.nav.filter((l) => l.label.trim() && l.href.trim()).map((l) => ({ label: l.label.trim(), href: l.href.trim() }));
      th.settings.footer.columns = st.cols.map((c) => ({ title: c.title.trim() || "Links", links: c.links.filter((l) => l.label.trim() && l.href.trim()).map((l) => ({ label: l.label.trim(), href: l.href.trim() })) }));
      A.theme.save(th); A.saveBar.hide(); A.toast("Navigation saved"); A.go("/navigation?r=" + Date.now());
    }
    render();
  }, { perm: "store" });

  /* ------------------------------------------------------------------ *
   * Pages
   * ------------------------------------------------------------------ */
  A.route("/pages", (root) => {
    const t = A.theme.get();
    const SHOP = [["Collection", "products.html"], ["Product page", "product.html?slug=strawberry"], ["Box page", "product.html?box=hosting-box"], ["Basket", "cart.html"], ["Checkout", "checkout.html"], ["Wishlist", "wishlist.html"], ["Account", "account.html"], ["Journal article", "article.html?slug=art-of-the-hosting-table"]];
    root.innerHTML = `<div class="page">${A.pageHead("Pages", { back: "#/online-store" })}
      <div class="card"><div class="card__hd"><h2>Theme pages</h2><span class="small faint">Built from sections — fully editable</span></div><div class="card__bd" style="padding:6px 0 8px">${PAGES.map(([k, l, f]) => `<div class="li"><span class="todo__ic">${icon("doc")}</span><span class="li__main"><span class="li__t">${esc(l)}</span><span class="li__s">/${esc(f)} · ${(t.pages[k] || { sections: [] }).sections.length} sections</span></span><a class="ab ab--sm" href="../${f}" target="_blank" rel="noopener">View</a><a class="ab ab--sm ab--primary" href="theme.html?page=${k}">Customize</a></div>`).join("")}</div></div>
      <div class="card"><div class="card__hd"><h2>Store templates</h2><span class="small faint">Driven by your catalog and settings</span></div><div class="card__bd" style="padding:6px 0 8px">${SHOP.map(([l, f]) => `<div class="li"><span class="todo__ic">${icon("bag")}</span><span class="li__main"><span class="li__t">${esc(l)}</span><span class="li__s">/${esc(f)}</span></span><a class="ab ab--sm" href="../${f}" target="_blank" rel="noopener">View</a></div>`).join("")}</div></div></div>`;
  }, { perm: "store" });

  /* ------------------------------------------------------------------ *
   * Preferences (store identity, announcement, contact, social, SEO)
   * ------------------------------------------------------------------ */
  A.route("/preferences", (root) => {
    const t = A.theme.get(), s = t.settings;
    const f = { store_name: s.store_name || "Fresh Valley", tagline: s.tagline || "", ann: Object.assign({ enabled: false, text: "", link: "", link_label: "" }, s.announcement || {}), contact: Object.assign({ phone: "", whatsapp: "", email: "", hours: "", city: "" }, s.contact || {}), social: Object.assign({ instagram: "", facebook: "", tiktok: "" }, s.social || {}), areas: (s.areas || []).join("\n"), seo: {} };
    PAGES.forEach(([k]) => { f.seo[k] = (t.pages[k] && t.pages[k].seo_title) || ""; });
    const orig = JSON.stringify(f);
    const inp = (path, label, val, o) => `<div class="fld"><label for="p-${path}">${esc(label)}</label><input class="in" id="p-${path}" data-p="${path}" value="${esc(val)}"${o && o.ph ? ` placeholder="${esc(o.ph)}"` : ""}></div>`;
    root.innerHTML = `<div class="page page--narrow">${A.pageHead("Preferences", { back: "#/online-store" })}
      <div class="card"><div class="card__hd"><h2>Store identity</h2></div><div class="card__bd grid-2">${inp("store_name", "Store name", f.store_name)}${inp("tagline", "Tagline", f.tagline)}</div></div>
      <div class="card"><div class="card__hd"><h2>Announcement bar</h2>${A.switchEl("annOn", f.ann.enabled, "Show announcement bar")}</div><div class="card__bd" style="display:grid;gap:10px">${inp("ann.text", "Message", f.ann.text)}<div class="grid-2">${inp("ann.link", "Link", f.ann.link, { ph: "products.html" })}${inp("ann.link_label", "Link text", f.ann.link_label, { ph: "Shop now" })}</div></div></div>
      <div class="card"><div class="card__hd"><h2>Contact</h2></div><div class="card__bd"><div class="grid-2">${inp("contact.phone", "Phone", f.contact.phone)}${inp("contact.whatsapp", "WhatsApp number", f.contact.whatsapp, { ph: "201000000000" })}${inp("contact.email", "Email", f.contact.email)}${inp("contact.city", "City", f.contact.city)}</div><div style="margin-top:12px">${inp("contact.hours", "Opening hours", f.contact.hours)}</div></div></div>
      <div class="card"><div class="card__hd"><h2>Social</h2></div><div class="card__bd grid-3">${inp("social.instagram", "Instagram", f.social.instagram)}${inp("social.facebook", "Facebook", f.social.facebook)}${inp("social.tiktok", "TikTok", f.social.tiktok)}</div></div>
      <div class="card"><div class="card__hd"><h2>Delivery areas</h2></div><div class="card__bd"><textarea class="ta" id="areas" rows="5" aria-label="Delivery areas">${esc(f.areas)}</textarea><span class="small faint">One per line — used by checkout, the contact page and the About page.</span></div></div>
      <div class="card"><div class="card__hd"><h2>Page titles (SEO)</h2></div><div class="card__bd" style="display:grid;gap:10px">${PAGES.map(([k, l]) => inp("seo." + k, l, f.seo[k], { ph: "Default title" })).join("")}</div></div></div>`;
    A.bindSwitches(root);
    const dirty = () => { if (JSON.stringify(f) !== orig) A.saveBar.show({ save, discard: () => { A.saveBar.hide(); A.go("/preferences?r=" + Date.now()); } }); else A.saveBar.hide(); };
    root.querySelectorAll("[data-p]").forEach((el) => el.addEventListener("input", () => { const [a, b] = el.dataset.p.split("."); if (b) f[a === "ann" ? "ann" : a][b] = el.value; else f[a] = el.value; dirty(); }));
    root.querySelector("#annOn").addEventListener("change", (e) => { f.ann.enabled = e.target.getAttribute("aria-checked") === "true"; dirty(); });
    root.querySelector("#areas").addEventListener("input", (e) => { f.areas = e.target.value; dirty(); });
    function save() {
      const th = A.theme.get();
      Object.assign(th.settings, { store_name: f.store_name.trim(), tagline: f.tagline.trim(), announcement: f.ann, contact: f.contact, social: f.social, areas: f.areas.split("\n").map((x) => x.trim()).filter(Boolean) });
      PAGES.forEach(([k]) => { if (th.pages[k]) { if (f.seo[k].trim()) th.pages[k].seo_title = f.seo[k].trim(); else delete th.pages[k].seo_title; } });
      A.theme.save(th);
      const st = A.settings.get(); st.storeName = f.store_name.trim() || "Fresh Valley"; A.settings.save(st);
      A.saveBar.hide(); A.toast("Preferences saved"); A.go("/preferences?r=" + Date.now());
    }
  }, { perm: "store" });

  /* ------------------------------------------------------------------ *
   * Files
   * ------------------------------------------------------------------ */
  A.route("/files", (root) => {
    if (!window.FVFiles) { root.innerHTML = `<div class="page">${A.empty("Media library unavailable", "files.js didn't load.")}</div>`; return; }
    const render = () => {
      const files = FVFiles.all();
      const used = JSON.stringify(A.get("fv_theme", {})) + JSON.stringify(A.get("fv_catalog", {}));
      const total = files.reduce((s, f) => s + (f.size || 0), 0);
      root.innerHTML = `<div class="page">${A.pageHead("Files", { actions: `<label class="ab ab--primary">${icon("upload")}Upload files<input type="file" id="up" accept="image/*" multiple hidden></label>` })}
        <p class="page__sub">Images you upload are resized in the browser and saved here, then moved into the repository when you publish. ${files.length} files · ${FVFiles.fmtSize(total)}</p>
        <div class="card card--flush">${files.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>File</th><th>Size</th><th>Added</th><th>In use</th><th></th></tr></thead><tbody>${files.map((f) => `<tr><td style="width:60px"><img class="thumb" src="${esc(f.data)}" alt=""></td><td class="strong">${esc(f.name)}<div class="sub">${f.w ? f.w + " × " + f.h : ""}</div></td><td>${FVFiles.fmtSize(f.size)}</td><td>${esc(fmtDate(f.date))}</td><td>${used.indexOf(f.data.slice(0, 120)) > -1 ? `<span class="bdg bdg--ok">Used</span>` : `<span class="faint">—</span>`}</td><td class="r"><button class="ab ab--sm ab--plain" type="button" data-del="${esc(f.id)}">${icon("trash")}Delete</button></td></tr>`).join("")}</tbody></table></div>`
          : A.empty("No uploads yet", "Upload photos to use them on products, boxes and theme sections. Built-in product and brand photos are always available in the picker.", `<button class="ab" type="button" id="browse">${icon("image")}Browse built-in images</button>`)}</div></div>`;
      root.querySelector("#up").addEventListener("change", async (e) => { for (const f of Array.from(e.target.files)) { try { await FVFiles.add(f); } catch (err) { A.toast(err.message, "bad"); } } A.toast("Upload complete"); render(); });
      root.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => { if (await A.confirm("Delete this file?", "Sections or products using it will fall back to their previous image.", { danger: true, ok: "Delete" })) { FVFiles.remove(b.dataset.del); render(); } }));
      const br = root.querySelector("#browse"); br && br.addEventListener("click", () => FVFiles.picker({ title: "Built-in images", onPick: () => {} }));
    };
    render();
  }, { perm: "content" });

  /* ------------------------------------------------------------------ *
   * Settings
   * ------------------------------------------------------------------ */
  const SETS = [
    ["general", "General", "Store name and currency", "store"],
    ["status", "Store status", "Open the store or show a maintenance screen", "lock"],
    ["delivery", "Delivery", "Fees, free-delivery threshold, cut-off and slots", "truck"],
    ["payments", "Payments", "Cash on delivery and payment methods", "percent"],
    ["taxes", "Taxes", "Tax rate included in prices", "doc"],
    ["users", "Users & permissions", "Staff accounts and roles", "users"],
    ["publishing", "Publishing", "Connect GitHub and push changes live", "globe"],
    ["data", "Data & demo", "Demo data, export, import and reset", "stack"],
  ];
  A.route("/settings", (root) => {
    root.innerHTML = `<div class="page">${A.pageHead("Settings")}<div class="grid-2">${SETS.map(([k, l, d, ic]) => `<a class="card li" href="#/settings/${k}" style="border-top:1px solid var(--line);padding:16px 18px"><span class="todo__ic">${icon(ic)}</span><span class="li__main"><span class="li__t">${esc(l)}</span><span class="li__s">${esc(d)}</span></span>${icon("chevR")}</a>`).join("")}</div></div>`;
  }, { perm: "settings" });

  A.route("/settings/:tab", (root, prm) => {
    const def = SETS.find((x) => x[0] === prm.tab);
    if (!def) { A.go("/settings"); return; }
    if ((prm.tab === "users") && A.auth.session().role !== "owner") { root.innerHTML = `<div class="page">${A.empty("Owner only", "Only the store owner can manage users.", `<a class="ab" href="#/settings">Back</a>`)}</div>`; return; }
    const s = A.settings.get();
    const head = A.pageHead(def[1], { back: "#/settings" });
    const simple = (body, read) => {
      root.innerHTML = `<div class="page page--narrow">${head}<form class="stack" id="sf">${body}<div class="row" style="justify-content:flex-end"><button class="ab ab--primary" type="submit">Save</button></div></form></div>`;
      A.bindSwitches(root);
      root.querySelector("#sf").addEventListener("submit", (e) => { e.preventDefault(); const x = read(); if (!x) return; A.settings.save(Object.assign(A.settings.get(), x)); A.toast(def[1] + " saved"); });
    };
    const $ = (id) => root.querySelector("#" + id);
    switch (prm.tab) {
      case "general":
        simple(`<div class="card"><div class="card__bd grid-2"><div class="fld"><label for="sn">Store name</label><input class="in" id="sn" value="${esc(s.storeName)}"></div><div class="fld"><label for="cu">Currency</label><select class="sel" id="cu"><option${s.currency === "EGP" ? " selected" : ""}>EGP</option><option${s.currency === "USD" ? " selected" : ""}>USD</option><option${s.currency === "SAR" ? " selected" : ""}>SAR</option><option${s.currency === "AED" ? " selected" : ""}>AED</option></select></div></div></div>`,
          () => ({ storeName: $("sn").value.trim() || "Fresh Valley", currency: $("cu").value }));
        break;
      case "status":
        simple(`<div class="card"><div class="card__bd"><label class="row"><span style="flex:1"><b>Store is open</b><br><span class="small faint">When closed, customers see a calm "We're tidying the shelves" screen. You can still preview everything from the admin.</span></span>${A.switchEl("op", s.storeOpen !== false, "Store open")}</label></div></div>`,
          () => ({ storeOpen: $("op").getAttribute("aria-checked") === "true" }));
        break;
      case "delivery":
        simple(`<div class="card"><div class="card__bd grid-3"><div class="fld"><label for="df">Delivery fee</label><div class="in-group"><span>${esc(s.currency)}</span><input class="in" id="df" type="number" min="0" value="${esc(s.deliveryFee)}"></div></div>
          <div class="fld"><label for="ft">Free delivery over</label><div class="in-group"><span>${esc(s.currency)}</span><input class="in" id="ft" type="number" min="0" value="${esc(s.freeThreshold)}"></div></div>
          <div class="fld"><label for="co">Next-day cut-off</label><select class="sel" id="co">${[14, 15, 16, 17, 18, 19, 20, 21, 22].map((h) => `<option value="${h}"${+s.cutoffHour === h ? " selected" : ""}>${h > 12 ? h - 12 + " pm" : h + " am"}</option>`).join("")}</select></div></div></div>
          <div class="card"><div class="card__hd"><h2>Delivery slots</h2></div><div class="card__bd"><textarea class="ta" id="sl" rows="5" aria-label="Delivery slots">${esc((s.slots || []).join("\n"))}</textarea><span class="small faint">One per line, e.g. "Morning · 9–12". Shown at checkout.</span></div></div>
          <div class="hint-box hint-box--info">${icon("info")}<span>Delivery areas live in <a class="link" href="#/preferences">Online Store → Preferences</a>.</span></div>`,
          () => ({ deliveryFee: Math.max(0, +$("df").value || 0), freeThreshold: Math.max(0, +$("ft").value || 0), cutoffHour: +$("co").value, slots: $("sl").value.split("\n").map((x) => x.trim()).filter(Boolean) }));
        break;
      case "payments":
        simple(`<div class="card"><div class="card__bd" style="display:grid;gap:14px"><label class="row"><span style="flex:1"><b>Cash on delivery</b><br><span class="small faint">Customers pay the courier. Orders show "Payment pending" until delivered.</span></span>${A.switchEl("cod", s.codEnabled !== false, "Cash on delivery")}</label>
          <div class="divider"></div><div class="row">${A.FV.payMarks}</div><p class="small muted">Card, Apple Pay and mobile wallets are shown at checkout. In production these connect to your payment provider (e.g. Paymob, Fawry or Stripe) — the storefront never stores card numbers.</p></div></div>`,
          () => ({ codEnabled: $("cod").getAttribute("aria-checked") === "true" }));
        break;
      case "taxes":
        simple(`<div class="card"><div class="card__bd"><div class="fld" style="max-width:220px"><label for="tx">Tax rate</label><div class="in-group"><input class="in" id="tx" type="number" min="0" max="30" step="0.5" value="${esc(s.taxRate || 0)}"><span>%</span></div></div><p class="small faint" style="margin-top:8px">Prices on the storefront include tax. Fresh produce in Egypt is generally VAT-exempt — confirm with your accountant.</p></div></div>`,
          () => ({ taxRate: Math.max(0, +$("tx").value || 0) }));
        break;
      case "users": {
        const draw = () => {
          const users = A.auth.users(), me = A.auth.session();
          root.innerHTML = `<div class="page page--narrow">${head}<div class="card card--flush"><div class="card__hd" style="padding-bottom:12px"><h2>Staff</h2><button class="ab ab--primary ab--sm" type="button" id="add">${icon("plus")}Add user</button></div>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>${users.map((u) => `<tr><td class="strong">${esc(u.name)}${u.id === me.id ? ` <span class="bdg bdg--plain bdg--info">You</span>` : ""}</td><td>${esc(u.email)}</td><td><span class="bdg ${u.role === "owner" ? "bdg--dark" : u.role === "manager" ? "bdg--ok" : ""}">${esc(A.ROLE_LABEL[u.role])}</span></td><td class="r"><button class="ab ab--sm" type="button" data-ed="${esc(u.id)}">Edit</button></td></tr>`).join("")}</tbody></table></div></div>
            <div class="card"><div class="card__hd"><h2>What each role can do</h2></div><div class="card__bd small"><p><b>Owner</b> — everything, including users and publishing.</p><p><b>Manager</b> — everything except managing users.</p><p><b>Staff</b> — orders, products, customers, content, analytics and the theme; no settings, discounts or publishing.</p></div></div>
            <div class="hint-box">${icon("lock")}<span>This demo keeps accounts in the browser. For a real launch, run the included Node server (server/) for hashed passwords and JWT sign-in.</span></div></div>`;
          const edit = (u) => {
            const isNew = !u; u = u || { id: "U" + Date.now().toString(36), name: "", email: "", password: "", role: "staff" };
            A.modal({ title: isNew ? "Add user" : "Edit " + u.name, body: `<div class="fld"><label for="un">Name</label><input class="in" id="un" value="${esc(u.name)}"></div><div class="fld"><label for="ue">Email</label><input class="in" id="ue" type="email" value="${esc(u.email)}"></div><div class="fld"><label for="up">${isNew ? "Password" : "New password (leave blank to keep)"}</label><input class="in" id="up" type="password" autocomplete="new-password"></div><div class="fld"><label for="ur">Role</label><select class="sel" id="ur">${["owner", "manager", "staff"].map((r) => `<option value="${r}"${u.role === r ? " selected" : ""}>${A.ROLE_LABEL[r]}</option>`).join("")}</select></div>`,
              actions: [!isNew && u.id !== me.id ? { label: "Delete", critical: true, onClick: () => { const l = A.auth.users(); if (u.role === "owner" && l.filter((x) => x.role === "owner").length < 2) { A.toast("Keep at least one owner", "bad"); return false; } A.set(A.K.users, l.filter((x) => x.id !== u.id)); A.toast("User removed"); draw(); } } : null, { label: "Cancel" }, { label: "Save", primary: true, onClick: (m) => {
                const q = (id) => m.el.querySelector("#" + id).value.trim();
                if (!q("un") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q("ue"))) { A.toast("Add a name and a valid email", "bad"); return false; }
                if (isNew && q("up").length < 6) { A.toast("Password must be at least 6 characters", "bad"); return false; }
                const l = A.auth.users();
                if (l.some((x) => x.email.toLowerCase() === q("ue").toLowerCase() && x.id !== u.id)) { A.toast("That email is already used", "bad"); return false; }
                if (u.id === me.id && q("ur") !== "owner" && l.filter((x) => x.role === "owner").length < 2) { A.toast("Keep at least one owner", "bad"); return false; }
                const nu = Object.assign({}, u, { name: q("un"), email: q("ue"), role: q("ur") }); if (q("up")) nu.password = q("up");
                const i = l.findIndex((x) => x.id === u.id); if (i > -1) l[i] = nu; else l.push(Object.assign(nu, { created: new Date().toISOString() }));
                A.set(A.K.users, l); A.toast("User saved"); draw();
              } }].filter(Boolean) });
          };
          root.querySelector("#add").addEventListener("click", () => edit(null));
          root.querySelectorAll("[data-ed]").forEach((b) => b.addEventListener("click", () => edit(A.auth.users().find((x) => x.id === b.dataset.ed))));
        };
        draw();
        break;
      }
      case "publishing": {
        if (!A.auth.can("publish")) { root.innerHTML = `<div class="page">${A.empty("No access", "Only the owner or a manager can publish.")}</div>`; return; }
        if (!window.FVPublish) { root.innerHTML = `<div class="page">${A.empty("Publishing unavailable", "publish.js didn't load.")}</div>`; return; }
        const c = FVPublish.config();
        root.innerHTML = `<div class="page page--narrow">${head}
          <div class="card"><div class="card__hd"><h2>GitHub repository</h2>${c.hasToken ? `<span class="bdg bdg--ok">Token saved</span>` : `<span class="bdg bdg--warn">Not connected</span>`}</div><div class="card__bd" style="display:grid;gap:12px">
            <p class="small muted">The live store runs on GitHub Pages. Publishing writes <code>assets/js/content.js</code> (and any uploaded images) to the repository; Pages redeploys in about a minute.</p>
            <div class="grid-3"><div class="fld"><label for="go">Owner</label><input class="in" id="go" value="${esc(c.owner)}"></div><div class="fld"><label for="gr">Repository</label><input class="in" id="gr" value="${esc(c.repo)}"></div><div class="fld"><label for="gb">Branch</label><input class="in" id="gb" value="${esc(c.branch)}"></div></div>
            <div class="fld"><label for="gt">Personal access token</label><input class="in" id="gt" type="password" autocomplete="off" placeholder="${c.hasToken ? "•••••••••••••••• (saved — paste to replace)" : "github_pat_…"}"><span class="help">Fine-grained token with <b>Contents: Read and write</b> on this repository only. It's stored in this browser and sent only to api.github.com.</span></div>
            <div class="row"><button class="ab ab--primary" type="button" id="gs">Save</button><button class="ab" type="button" id="gtst">Test connection</button>${c.hasToken ? `<button class="ab ab--plain" type="button" id="gx">Remove token</button>` : ""}</div>
            <div id="gmsg"></div></div></div>
          <div class="card"><div class="card__hd"><h2>Publish</h2></div><div class="card__bd" style="display:grid;gap:12px">
            <dl class="kv"><dt>Last published</dt><dd>${c.lastPublished ? esc(fmtDT(c.lastPublished)) + (c.lastUrl ? ` · <a class="link" href="${esc(c.lastUrl)}" target="_blank" rel="noopener">commit</a>` : "") : "Never from this browser"}</dd><dt>Theme saved</dt><dd>${A.theme.savedAt() ? esc(ago(A.theme.savedAt())) : "Defaults"}</dd></dl>
            <div class="row"><button class="ab ab--olive" type="button" id="gp">${icon("upload")}Publish now</button><button class="ab" type="button" id="gd">${icon("download")}Download content.js</button></div>
            <p class="small faint">No token? Download content.js and commit it to <code>assets/js/</code> yourself.</p></div></div></div>`;
        const msg = (ok, t) => { $("gmsg").innerHTML = `<div class="hint-box ${ok ? "hint-box--info" : "hint-box--bad"}">${icon(ok ? "check" : "alert")}<span>${esc(t)}</span></div>`; };
        $("gs").addEventListener("click", () => { FVPublish.saveConfig({ owner: $("go").value, repo: $("gr").value, branch: $("gb").value, token: $("gt").value || undefined }); A.toast("Publishing settings saved"); A.go("/settings/publishing?r=" + Date.now()); });
        $("gtst").addEventListener("click", async () => { if ($("gt").value) FVPublish.saveConfig({ token: $("gt").value }); msg(true, "Testing…"); const r = await FVPublish.test(); msg(r.ok, r.msg); });
        const gx = $("gx"); gx && gx.addEventListener("click", () => { FVPublish.saveConfig({ token: null }); A.toast("Token removed"); A.go("/settings/publishing?r=" + Date.now()); });
        $("gp").addEventListener("click", publishFlow);
        $("gd").addEventListener("click", () => FVPublish.download());
        break;
      }
      case "data": {
        const size = () => { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += (localStorage.getItem(k) || "").length + k.length; } return n * 2; };
        const draw = () => {
          const on = A.data.demoOn(), has = window.ADemo && ADemo.has();
          const used = size();
          root.innerHTML = `<div class="page page--narrow">${head}
            <div class="card"><div class="card__hd"><h2>Demo data</h2>${on ? `<span class="bdg bdg--warn">Showing demo data</span>` : ""}</div><div class="card__bd" style="display:grid;gap:12px">
              <p class="small muted">90 days of realistic orders, customers, sessions and messages generated from your real catalog — stored separately and never mixed into real records. Great for demos and training.</p>
              <label class="row"><span style="flex:1"><b>Show demo data</b></span>${A.switchEl("dOn", on, "Show demo data")}</label>
              <div class="row"><button class="ab" type="button" id="dGen">${icon("refresh")}${has ? "Regenerate" : "Generate"} demo data</button>${has ? `<button class="ab ab--plain" type="button" id="dClr">Delete demo data</button>` : ""}</div></div></div>
            <div class="card"><div class="card__hd"><h2>Export &amp; import</h2></div><div class="card__bd" style="display:grid;gap:12px">
              <p class="small muted">Everything this admin stores (orders, customers, catalog edits, theme, settings, files) as one JSON file.</p>
              <div class="row"><button class="ab" type="button" id="ex">${icon("download")}Export all data</button><label class="ab">${icon("upload")}Import…<input type="file" id="im" accept="application/json" hidden></label></div></div></div>
            <div class="card"><div class="card__hd"><h2>Browser storage</h2></div><div class="card__bd"><div class="bar-row" style="grid-template-columns:1fr auto"><span class="bar-row__bar"><i style="width:${Math.min(100, (used / (5 * 1024 * 1024)) * 100)}%"></i></span><b class="num">${(used / 1048576).toFixed(2)} MB of ~5 MB</b></div></div></div>
            <div class="card" style="border-color:var(--bad-bg)"><div class="card__hd"><h2>Danger zone</h2></div><div class="card__bd" style="display:grid;gap:10px">
              <div class="row row--between"><span><b>Clear store records</b><br><span class="small faint">Removes real orders, customers, messages and analytics events from this browser.</span></span><button class="ab ab--critical" type="button" id="rs">Clear records</button></div>
              <div class="row row--between"><span><b>Reset catalog edits</b><br><span class="small faint">Prices, stock, product copy, discounts and custom products go back to the original catalog.</span></span><button class="ab ab--critical" type="button" id="rc">Reset catalog</button></div></div></div></div>`;
          A.bindSwitches(root);
          $("dOn").addEventListener("change", (e) => { const v = e.target.getAttribute("aria-checked") === "true"; if (v && !(window.ADemo && ADemo.has())) ADemo.generate(); A.set(A.K.demoOn, v); A.renderSide(); A.updateBell(); A.toast(v ? "Demo data on" : "Demo data off"); draw(); });
          $("dGen").addEventListener("click", () => { const r = ADemo.generate(); A.toast(r.ok ? `Generated ${num(r.orders)} orders · ${num(r.clients)} customers · ${num(r.events)} events` : "Couldn't store demo data", r.ok ? "" : "bad"); A.renderSide(); draw(); });
          const dc = $("dClr"); dc && dc.addEventListener("click", async () => { if (await A.confirm("Delete demo data?", "Real orders and customers are not affected.", { ok: "Delete demo data" })) { ADemo.clear(); A.renderSide(); A.toast("Demo data deleted"); draw(); } });
          $("ex").addEventListener("click", () => { const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^fv_/.test(k) && k !== "fv_gh" && k !== "fv_admin_session") out[k] = localStorage.getItem(k); } A.download("fresh-valley-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(out)); A.toast("Backup downloaded"); });
          $("im").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = async () => { try { const obj = JSON.parse(r.result); const keys = Object.keys(obj).filter((k) => /^fv_/.test(k) && k !== "fv_admin_session"); if (!keys.length) throw new Error("Not a Fresh Valley backup"); if (!(await A.confirm("Import " + keys.length + " data sets?", "Matching data in this browser is replaced.", { ok: "Import" }))) return; keys.forEach((k) => localStorage.setItem(k, obj[k])); A.toast("Imported — reloading"); setTimeout(() => location.reload(), 600); } catch (err) { A.toast(err.message, "bad"); } }; r.readAsText(f); });
          $("rs").addEventListener("click", async () => { if (await A.confirm("Clear store records?", "Real orders, customers, messages and analytics events are deleted from this browser. This can't be undone.", { danger: true, ok: "Clear records" })) { [A.K.orders, A.K.clients, A.K.messages, A.K.track].forEach((k) => A.del(k)); A.toast("Records cleared"); A.renderSide(); draw(); } });
          $("rc").addEventListener("click", async () => { if (await A.confirm("Reset catalog edits?", "All product, box, collection and discount edits are removed.", { danger: true, ok: "Reset catalog" })) { ["fv_catalog", "fv_admin_prices", "fv_admin_pmeta", "fv_admin_custom"].forEach((k) => A.del(k)); A.toast("Catalog reset — reloading"); setTimeout(() => location.reload(), 600); } });
        };
        draw();
        break;
      }
    }
  }, { perm: "settings" });
})();
