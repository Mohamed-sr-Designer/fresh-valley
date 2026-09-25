/* =====================================================================
   FRESH VALLEY — Theme editor (Online Store → Customize)
   Shopify-style: sections list (drag, hide, add, blocks) · live preview
   iframe (desktop / tablet / mobile) · schema-driven settings forms ·
   theme settings · undo/redo · save to this browser · publish to GitHub.
   Preview protocol: docs/V4-ARCHITECTURE.md
   ===================================================================== */
(function () {
  "use strict";
  const FV = window.FV, T = window.FVTheme, S = window.FVSections, SCHEMA = S.schema;
  const esc = FV.esc, icon = A.icon;
  const session = A.auth.session();
  if (!session) { location.replace("index.html#/login"); return; }
  const PAGES = [["index", "Home", "index.html"], ["hosting", "The Art of Hosting", "hosting.html"], ["about", "About", "about.html"], ["contact", "Contact", "contact.html"], ["journal", "Journal", "journal.html"], ["policies", "Company Policies", "policies.html"], ["terms", "Terms of Use", "terms.html"]];
  const DESC = { hero: "Light headline, the live almanac line and the arched hero photo", statement: "One calm paragraph that says who you are", categories: "Six categories as a quiet image index", product_rail: "Draggable carousel from a collection", almanac: "Harvest calendar — the months each crop is in season", origins: "Provenance — the regions your produce grows in", story: "Arched photo, the hosting story and numbered steps", boxes: "Box cards", stats: "Count-up numbers", image_text: "Photo beside copy and a numbered list", banner: "Wide photo with a text panel", journal: "Latest field notes", page_head: "Page title, intro and optional photo", strike_list: "Items that get crossed out as you scroll", seasons: "Four seasons, photo and caption", hscroll: "Numbered ritual steps on a dark rail", gallery: "Carousel of moments", compare: "Two columns — the usual versus yours", quote: "Big quote over a photo", cta: "Centred call to action", steps: "Numbered steps", features: "Numbered or icon columns", areas: "Delivery areas list and photo", contact: "Contact form and details", faq: "Questions and answers", legal: "Policy text with a table of contents" };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const DEF = T.defaults();
  const uid = (t) => t + "-" + Math.random().toString(36).slice(2, 6);
  function normalize(t) {
    t = t || clone(DEF);
    t.settings = Object.assign(clone(DEF.settings), t.settings || {});
    t.pages = t.pages || {};
    PAGES.forEach(([k]) => { if (!t.pages[k] || !Array.isArray(t.pages[k].sections)) t.pages[k] = clone(DEF.pages[k]); });
    Object.values(t.pages).forEach((pg) => pg.sections.forEach((s) => { s.id = s.id || uid(s.type); s.settings = s.settings || {}; s.blocks = Array.isArray(s.blocks) ? s.blocks : []; s.blocks.forEach((b) => { b.settings = b.settings || {}; }); }));
    return t;
  }
  const qp = new URLSearchParams(location.search);
  const st = { theme: normalize(clone(T.get())), page: qp.get("page") || "index", tab: "sections", sel: null, blk: null, open: {}, undo: [], redo: [], dirty: false, device: "desktop", savedAt: (A.get(T.KEY, null) || {}).updatedAt || null };
  if (!PAGES.some((p) => p[0] === st.page)) st.page = "index";
  const pageObj = () => st.theme.pages[st.page];
  const secs = () => pageObj().sections;
  const findSec = (id) => secs().find((s) => s.id === id);
  const pageFile = () => PAGES.find((p) => p[0] === st.page)[2];

  /* ------------------------------------------------------------------ *
   * Shell
   * ------------------------------------------------------------------ */
  document.body.className = "te";
  const canPublish = A.auth.can("publish");
  document.body.innerHTML = `
    <header class="te-top">
      <div class="te-top__l"><a class="te-back" href="index.html#/online-store" id="teBack">${icon("back")}Exit</a><span class="te-name"><b>${esc(FV.settings.storeName)}</b><span>Field &amp; Herb theme</span></span></div>
      <div class="te-top__c"><label class="sr-only" for="tePage">Page</label><select class="te-page" id="tePage">${PAGES.map((p) => `<option value="${p[0]}">${esc(p[1])}</option>`).join("")}</select></div>
      <div class="te-top__r">
        <span class="te-dev" role="group" aria-label="Preview size"><button class="te-ib" type="button" data-dev="desktop" aria-label="Desktop" aria-pressed="true">${icon("grid")}</button><button class="te-ib" type="button" data-dev="tablet" aria-label="Tablet" aria-pressed="false">${icon("doc")}</button><button class="te-ib" type="button" data-dev="mobile" aria-label="Mobile" aria-pressed="false">${icon("phone")}</button></span>
        <button class="te-ib" type="button" id="teUndo" aria-label="Undo (Ctrl+Z)" title="Undo">${icon("back")}</button><button class="te-ib" type="button" id="teRedo" aria-label="Redo (Ctrl+Shift+Z)" title="Redo" style="transform:scaleX(-1)">${icon("back")}</button>
        <span class="te-status" id="teStatus" aria-live="polite"></span>
        <button class="ab" type="button" id="teSave">Save</button>${canPublish ? `<button class="ab ab--olive" type="button" id="tePub">Publish</button>` : ""}<button class="te-ib" type="button" id="teMore" aria-label="More">${icon("dots")}</button>
      </div>
    </header>
    <div class="te-body">
      <aside class="te-pane te-left" aria-label="Sections"><div class="te-narrow">The live preview needs a wider screen — you can still edit settings here.</div><div class="te-tabs" role="tablist"><button type="button" role="tab" data-tab="sections" aria-selected="true">Sections</button><button type="button" role="tab" data-tab="settings" aria-selected="false">Theme settings</button></div><div id="teLeft"></div></aside>
      <main class="te-canvas" aria-label="Preview"><div class="te-frame" id="teFrameBox"><iframe id="teFrame" title="Store preview"></iframe><div class="te-loading" id="teLoad">Loading preview…</div></div></main>
      <aside class="te-pane te-right" aria-label="Settings" id="teRight"></aside>
    </div>
    <datalist id="teLinks"></datalist>
    <div class="toasts" aria-live="polite"></div>`;
  const $ = (id) => document.getElementById(id);
  const frame = $("teFrame");
  $("tePage").value = st.page;
  $("teLinks").innerHTML = [["index.html", "Home"], ["products.html", "All products"], ["products.html?cat=fruits", "Fruits"], ["products.html?cat=vegetables", "Vegetables"], ["products.html?cat=herbs", "Herbs"], ["products.html?cat=boxes", "Boxes"], ["products.html?cat=seasonal", "Seasonal"], ["products.html?cat=organic-reserve", "Organic Reserve"], ["products.html?collection=best-sellers", "Best sellers"], ["hosting.html", "The Art of Hosting"], ["hosting.html#ritual", "Hosting · the ritual"], ["about.html", "About"], ["about.html#quality", "About · quality"], ["journal.html", "Journal"], ["contact.html", "Contact"], ["contact.html#areas", "Delivery areas"], ["policies.html", "Policies"], ["terms.html", "Terms"], ["account.html", "Account"]]
    .concat(FV.data.boxes.map((b) => ["product.html?box=" + b.slug, b.name])).concat(FV.data.products.map((p) => ["product.html?slug=" + p.slug, p.name])).map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");

  /* ------------------------------------------------------------------ *
   * Status, undo/redo, save
   * ------------------------------------------------------------------ */
  function updateTop() {
    const s = $("teStatus");
    s.className = "te-status" + (st.dirty ? " dirty" : "");
    s.textContent = st.dirty ? "Unsaved changes" : st.savedAt ? "Saved " + A.ago(st.savedAt) : "Using defaults";
    $("teUndo").disabled = !st.undo.length; $("teRedo").disabled = !st.redo.length;
    document.title = (st.dirty ? "• " : "") + "Customize " + PAGES.find((p) => p[0] === st.page)[1] + " — Fresh Valley";
  }
  const snapshot = () => { st.undo.push(JSON.stringify(st.theme)); if (st.undo.length > 60) st.undo.shift(); st.redo = []; };
  let typing = false, typingT = null;
  function commit(mut, o) {
    o = o || {};
    if (o.typing) { if (!typing) { snapshot(); typing = true; } clearTimeout(typingT); typingT = setTimeout(() => { typing = false; }, 900); }
    else { typing = false; snapshot(); }
    mut();
    st.dirty = true; updateTop();
    if (o.global) reload(true); else pushDraft();
    if (o.left !== false) renderLeft();
    if (o.right) renderRight();
  }
  function restore(json) { st.theme = normalize(JSON.parse(json)); if (st.sel && !findSec(st.sel)) { st.sel = null; st.blk = null; } st.dirty = true; updateTop(); renderLeft(); renderRight(); reload(false); }
  function undo() { if (!st.undo.length) return; st.redo.push(JSON.stringify(st.theme)); restore(st.undo.pop()); }
  function redo() { if (!st.redo.length) return; st.undo.push(JSON.stringify(st.theme)); restore(st.redo.pop()); }
  function save() {
    const saved = T.save(clone(st.theme));
    st.savedAt = saved.updatedAt; st.theme.updatedAt = saved.updatedAt; st.dirty = false; updateTop();
    A.toast("Saved — the store in this browser now shows your changes");
    return saved;
  }
  $("teUndo").addEventListener("click", undo);
  $("teRedo").addEventListener("click", redo);
  $("teSave").addEventListener("click", save);
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && k === "s") { e.preventDefault(); save(); }
    else if (mod && k === "z" && !e.shiftKey && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); undo(); }
    else if (mod && ((k === "z" && e.shiftKey) || k === "y") && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); redo(); }
  });
  window.addEventListener("beforeunload", (e) => { if (st.dirty) { e.preventDefault(); e.returnValue = ""; } });
  if ($("tePub")) $("tePub").addEventListener("click", publish);
  function publish() {
    if (!window.FVPublish) return;
    const cfg = FVPublish.config();
    if (!cfg.hasToken) {
      A.modal({ title: "Connect GitHub to publish", body: `<p class="muted small">Publishing writes your theme to <b>assets/js/content.js</b> in the store's repository. Paste a fine-grained token with <b>Contents: read &amp; write</b> for this repository — it stays in this browser.</p>
        <div class="grid-3"><div class="fld"><label for="pOw">Owner</label><input class="in" id="pOw" value="${esc(cfg.owner)}"></div><div class="fld"><label for="pRe">Repository</label><input class="in" id="pRe" value="${esc(cfg.repo)}"></div><div class="fld"><label for="pBr">Branch</label><input class="in" id="pBr" value="${esc(cfg.branch)}"></div></div>
        <div class="fld"><label for="pTk">Access token</label><input class="in" id="pTk" type="password" autocomplete="off" placeholder="github_pat_…"></div><p class="small faint">No token? Use “Download content.js” from the ⋯ menu and commit it yourself.</p>`,
        actions: [{ label: "Cancel" }, { label: "Save & publish", primary: true, onClick: (m) => { const v = (id) => m.el.querySelector("#" + id).value.trim(); if (!v("pTk")) { A.toast("Paste a token first", "bad"); return false; } FVPublish.saveConfig({ owner: v("pOw"), repo: v("pRe"), branch: v("pBr"), token: v("pTk") }); setTimeout(publish, 50); } }] });
      return;
    }
    if (st.dirty) save();
    const m = A.modal({ title: "Publishing…", body: `<div class="hint-box" id="pm">${icon("upload")}<span>Starting…</span></div>`, actions: [{ label: "Close" }] });
    const span = m.el.querySelector("#pm span");
    FVPublish.publish({ onProgress: (t) => { span.textContent = t; } }).then((r) => {
      m.el.querySelector("#pm").className = "hint-box " + (r.ok ? "hint-box--info" : "hint-box--bad");
      span.innerHTML = r.ok ? esc(r.msg) + ` <a class="link" href="${esc(r.url)}" target="_blank" rel="noopener">View commit</a>` : esc(r.msg);
      m.el.querySelector("h2").textContent = r.ok ? "Published" : "Publishing failed";
    });
  }
  $("teMore").addEventListener("click", (e) => A.menu(e.currentTarget, [
    { label: "View this page live", icon: "ext", href: "../" + pageFile(), target: "_blank" },
    { label: "Discard unsaved changes", icon: "refresh", fn: async () => { if (!st.dirty) { A.toast("Nothing to discard"); return; } if (await A.confirm("Discard changes?", "Everything since your last save is lost.", { danger: true, ok: "Discard" })) { st.theme = normalize(clone(T.get())); st.undo = []; st.redo = []; st.dirty = false; st.sel = null; updateTop(); renderLeft(); renderRight(); reload(false); } } },
    { label: "Reset this page to default", icon: "refresh", fn: async () => { if (await A.confirm("Reset " + PAGES.find((p) => p[0] === st.page)[1] + "?", "Its sections go back to the original design (you can still undo).", { danger: true, ok: "Reset page" })) commit(() => { st.theme.pages[st.page] = clone(DEF.pages[st.page]); st.sel = null; st.blk = null; }, { right: true, global: true }); } },
    { label: "Reset whole theme", icon: "refresh", danger: true, fn: async () => { if (await A.confirm("Reset the whole theme?", "Every page and setting returns to the defaults (you can still undo).", { danger: true, ok: "Reset theme" })) commit(() => { st.theme = normalize(clone(DEF)); st.sel = null; st.blk = null; }, { right: true, global: true }); } },
    window.FVPublish ? { label: "Download content.js", icon: "download", fn: () => { if (st.dirty) save(); FVPublish.download(); } } : null,
    { label: "Export theme JSON", icon: "download", fn: () => A.download("fresh-valley-theme.json", JSON.stringify(st.theme, null, 2)) },
    { label: "Import theme JSON", icon: "upload", fn: importJSON },
  ]));
  function importJSON() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json";
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const t = JSON.parse(r.result); if (!t.pages || !t.settings) throw new Error("That file isn't a Fresh Valley theme"); commit(() => { st.theme = normalize(t); st.sel = null; }, { right: true, global: true }); A.toast("Theme imported — review and save"); } catch (e) { A.toast(e.message, "bad"); } }; r.readAsText(f); };
    inp.click();
  }

  /* ------------------------------------------------------------------ *
   * Preview iframe
   * ------------------------------------------------------------------ */
  const writeDraft = () => { try { sessionStorage.setItem("fv_theme_draft", JSON.stringify(st.theme)); } catch (_) {} };
  const post = (m) => { try { frame.contentWindow.postMessage(m, location.origin); } catch (_) {} };
  function load() { writeDraft(); $("teLoad").classList.add("on"); frame.src = "../" + pageFile() + "?fv_preview=1&v=" + Date.now(); }
  let reloadT = null, draftT = null;
  function reload(debounced) { clearTimeout(reloadT); reloadT = setTimeout(load, debounced ? 450 : 0); }
  function pushDraft() { clearTimeout(draftT); draftT = setTimeout(() => { writeDraft(); post({ type: "fv:draft", theme: st.theme, select: st.sel }); }, 120); }
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const m = e.data || {};
    if (m.type === "fv:ready") { $("teLoad").classList.remove("on"); post({ type: "fv:draft", theme: st.theme, select: st.sel }); if (st.sel) setTimeout(() => post({ type: "fv:select", id: st.sel, scroll: true }), 150); }
    if (m.type === "fv:clicked" && m.id) select(m.id, null, false);
    if (m.type === "fv:navigate") {
      const file = String(m.href || "").split("#")[0].split("?")[0].replace(/^\.?\//, "") || "index.html";
      const pg = PAGES.find((p) => p[2] === file);
      if (pg) switchPage(pg[0]); else A.toast("Only theme pages can be customised here (" + file + ")");
    }
  });
  frame.addEventListener("load", () => setTimeout(() => $("teLoad").classList.remove("on"), 1500));
  /* The preview renders at a real device width and is scaled to fit the
     canvas, so "Desktop" shows the true desktop layout even on a laptop. */
  const VIEW = { desktop: 1366, tablet: 820, mobile: 390 };
  function fit() {
    const canvas = document.querySelector(".te-canvas"), box = $("teFrameBox");
    if (!canvas || !canvas.clientWidth) return;
    const W = canvas.clientWidth - 28, H = canvas.clientHeight - 28, V = VIEW[st.device];
    const s = Math.min(1, W / V);
    box.style.width = Math.round(V * s) + "px";
    box.style.height = H + "px";
    frame.style.width = V + "px";
    frame.style.height = Math.round(H / s) + "px";
    frame.style.transform = s < 1 ? "scale(" + s + ")" : "";
    frame.style.transformOrigin = "0 0";
  }
  window.addEventListener("resize", fit);
  document.querySelectorAll("[data-dev]").forEach((b) => b.addEventListener("click", () => {
    st.device = b.dataset.dev;
    document.querySelectorAll("[data-dev]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    $("teFrameBox").className = "te-frame" + (st.device === "mobile" ? " mobile" : "");
    fit();
  }));
  requestAnimationFrame(fit);
  function switchPage(k) {
    if (k === st.page) return;
    st.page = k; st.sel = null; st.blk = null;
    $("tePage").value = k;
    history.replaceState(null, "", "theme.html?page=" + k);
    updateTop(); renderLeft(); renderRight(); load();
  }
  $("tePage").addEventListener("change", (e) => switchPage(e.target.value));

  /* ------------------------------------------------------------------ *
   * Left pane — sections list / theme settings
   * ------------------------------------------------------------------ */
  const clean = (s) => String(s || "").replace(/[*~]/g, "").replace(/\s+/g, " ").trim();
  function secName(sec) {
    const x = sec.settings || {};
    const n = clean(x.title || (sec.type === "hero" ? [x.line1, x.line2, x.line3].join(" ") : "") || x.quote || x.eyebrow || (sec.type === "marquee" ? String(x.items || "").split("|")[0] : ""));
    return n || (SCHEMA[sec.type] || {}).name || sec.type;
  }
  function blockName(sec, b) {
    const t = b.settings || {};
    const n = clean(t.title || t.q || t.label || (t.value != null && t.value !== "" ? t.value + (t.suffix || "") + " " + (t.label || "") : ""));
    return n || (((SCHEMA[sec.type] || {}).blocks || {})[b.type] || {}).name || b.type;
  }
  const secIcon = (sec) => icon((SCHEMA[sec.type] || {}).icon || "leaf");
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { st.tab = b.dataset.tab; document.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x === b)); renderLeft(); }));
  function renderLeft() {
    const L = $("teLeft");
    if (st.tab === "settings") { renderGlobal(L); return; }
    const list = secs();
    L.innerHTML = `<div class="te-group"><div class="te-group__t">Header</div>
        <button type="button" class="te-fixed" data-goset="announcement" style="width:100%">${icon("megaphone")}Announcement bar</button>
        <button type="button" class="te-fixed" data-goset="nav" style="width:100%">${icon("menu")}Header &amp; menu</button></div>
      <div class="te-group"><div class="te-group__t"><span>Template · ${esc(PAGES.find((p) => p[0] === st.page)[1])}</span><span class="faint" style="letter-spacing:0;text-transform:none">${list.length}</span></div>
        <div role="list" id="secList">${list.map((s, i) => secHTML(s, i)).join("")}</div>
        <button type="button" class="te-addsec" id="addSec">${icon("plus")}Add section</button></div>
      <div class="te-group"><div class="te-group__t">Footer</div><button type="button" class="te-fixed" data-goset="footer" style="width:100%">${icon("list")}Footer</button></div>`;
    L.querySelectorAll("[data-goset]").forEach((b) => b.addEventListener("click", () => { st.tab = "settings"; document.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x.dataset.tab === "settings")); renderLeft(); const g = $("g-" + b.dataset.goset); if (g) g.scrollIntoView({ block: "start" }); }));
    $("addSec").addEventListener("click", () => library());
    wireSections(L);
  }
  function secHTML(s, i) {
    const sch = SCHEMA[s.type] || {}, hasBlocks = !!sch.blocks, open = hasBlocks && st.open[s.id];
    return `<div class="te-sec${s.id === st.sel ? " is-sel" : ""}${open ? " is-open" : ""}${s.disabled ? " is-off" : ""}" data-id="${esc(s.id)}" draggable="true" role="listitem">
      <div class="te-sec__row">
        <span class="te-handle" title="Drag to reorder" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6" fill="currentColor"/><circle cx="15" cy="6" r="1.6" fill="currentColor"/><circle cx="9" cy="12" r="1.6" fill="currentColor"/><circle cx="15" cy="12" r="1.6" fill="currentColor"/><circle cx="9" cy="18" r="1.6" fill="currentColor"/><circle cx="15" cy="18" r="1.6" fill="currentColor"/></svg></span>
        ${hasBlocks ? `<button type="button" class="te-caret" data-toggle aria-label="${open ? "Hide" : "Show"} blocks" aria-expanded="${!!open}">${icon("chevR")}</button>` : `<span class="te-caret"></span>`}
        <span class="te-sec__ic">${secIcon(s)}</span>
        <button type="button" class="te-sec__name" data-pick title="${esc(secName(s))} — Alt+↑/↓ to move">${esc(secName(s))}</button>
        <span class="te-sec__acts"><button type="button" class="te-mini" data-eye aria-label="${s.disabled ? "Show" : "Hide"} section">${icon(s.disabled ? "eyeOff" : "eye")}</button><button type="button" class="te-mini" data-more aria-label="Section actions">${icon("dots")}</button></span>
      </div>
      ${open ? `<div class="te-blocks">${s.blocks.map((b, bi) => `<div class="te-block${s.id === st.sel && st.blk === bi ? " is-sel" : ""}" data-bi="${bi}" role="button" tabindex="0">${icon("list")}<span>${esc(blockName(s, b))}</span><span class="te-sec__acts"><button type="button" class="te-mini" data-bup aria-label="Move block up">↑</button><button type="button" class="te-mini" data-bdel aria-label="Remove block">${icon("trash")}</button></span></div>`).join("")}
        ${!sch.max_blocks || s.blocks.length < sch.max_blocks ? `<button type="button" class="te-addblock" data-addb>${icon("plus")}Add ${esc((Object.values(sch.blocks)[0] || {}).name || "block").toLowerCase()}</button>` : `<span class="faint small" style="padding:0 8px">Maximum ${sch.max_blocks}</span>`}</div>` : ""}
    </div>`;
  }
  function wireSections(L) {
    L.querySelectorAll(".te-sec").forEach((el) => {
      const id = el.dataset.id, s = findSec(id), idx = () => secs().indexOf(findSec(id));
      el.querySelector("[data-pick]").addEventListener("click", () => select(id, null));
      el.querySelector("[data-pick]").addEventListener("keydown", (e) => { if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); move(id, e.key === "ArrowUp" ? -1 : 1, true); } });
      const tg = el.querySelector("[data-toggle]"); tg && tg.addEventListener("click", () => { st.open[id] = !st.open[id]; renderLeft(); });
      el.querySelector("[data-eye]").addEventListener("click", () => commit(() => { s.disabled = !s.disabled; if (!s.disabled) delete s.disabled; }, { right: st.sel === id }));
      el.querySelector("[data-more]").addEventListener("click", (e) => secMenu(e.currentTarget, id));
      el.querySelectorAll("[data-bi]").forEach((b) => {
        const bi = +b.dataset.bi;
        b.addEventListener("click", (e) => { if (e.target.closest("[data-bup],[data-bdel]")) return; select(id, bi); });
        b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(id, bi); } });
        b.querySelector("[data-bup]").addEventListener("click", () => { if (bi < 1) return; commit(() => { const a = s.blocks; [a[bi - 1], a[bi]] = [a[bi], a[bi - 1]]; if (st.sel === id && st.blk === bi) st.blk = bi - 1; }, { right: st.sel === id }); });
        b.querySelector("[data-bdel]").addEventListener("click", () => commit(() => { s.blocks.splice(bi, 1); if (st.sel === id) st.blk = null; }, { right: st.sel === id }));
      });
      const ab = el.querySelector("[data-addb]"); ab && ab.addEventListener("click", (e) => addBlock(e.currentTarget, id));
      // drag & drop
      el.addEventListener("dragstart", (e) => { if (e.target.closest(".te-blocks")) { e.preventDefault(); return; } e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; el.classList.add("dragging"); });
      el.addEventListener("dragend", () => { el.classList.remove("dragging"); L.querySelectorAll(".drag-over").forEach((x) => x.classList.remove("drag-over")); });
      el.addEventListener("dragover", (e) => { e.preventDefault(); L.querySelectorAll(".drag-over").forEach((x) => x.classList.remove("drag-over")); el.classList.add("drag-over"); });
      el.addEventListener("drop", (e) => { e.preventDefault(); const from = e.dataTransfer.getData("text/plain"); if (!from || from === id) return; commit(() => { const a = secs(), fi = a.findIndex((x) => x.id === from), item = a.splice(fi, 1)[0]; a.splice(a.findIndex((x) => x.id === id), 0, item); }); A.toast("Section moved"); });
      void idx;
    });
  }
  function move(id, d, keepFocus) {
    const a = secs(), i = a.findIndex((x) => x.id === id), j = i + d;
    if (j < 0 || j >= a.length) return;
    commit(() => { [a[i], a[j]] = [a[j], a[i]]; });
    if (keepFocus) { const b = document.querySelector(`.te-sec[data-id="${CSS.escape(id)}"] [data-pick]`); b && b.focus(); }
    post({ type: "fv:select", id, scroll: true });
  }
  function secMenu(anchor, id) {
    const s = findSec(id), a = secs(), i = a.indexOf(s);
    A.menu(anchor, [
      { label: "Duplicate", icon: "copy", fn: () => commit(() => { const c = clone(s); c.id = uid(s.type); a.splice(i + 1, 0, c); st.sel = c.id; }, { right: true }) },
      i > 0 ? { label: "Move up", icon: "chevD", fn: () => move(id, -1) } : null,
      i < a.length - 1 ? { label: "Move down", icon: "chevD", fn: () => move(id, 1) } : null,
      { label: s.disabled ? "Show section" : "Hide section", icon: s.disabled ? "eye" : "eyeOff", fn: () => commit(() => { s.disabled = !s.disabled; if (!s.disabled) delete s.disabled; }, { right: true }) },
      { label: "Remove section", icon: "trash", danger: true, fn: () => { commit(() => { a.splice(a.indexOf(s), 1); if (st.sel === id) { st.sel = null; st.blk = null; } }, { right: true }); A.toast("Section removed", "", { label: "Undo", fn: undo }); } },
    ]);
  }
  function library() {
    const types = Object.keys(SCHEMA).filter((t) => !SCHEMA[t].only || SCHEMA[t].only.includes(st.page));
    const m = A.modal({ title: "Add section", wide: true, body: `<p class="muted small">Pick a section — it's added ${st.sel ? "below the selected one" : "at the end of the page"}, filled with sample content you can edit.</p><div class="te-lib">${types.map((t) => { const sch = SCHEMA[t], taken = sch.limit && secs().filter((s) => s.type === t).length >= sch.limit; return `<button type="button" data-type="${t}"${taken ? " disabled" : ""}><span class="te-sec__ic">${icon(sch.icon || "leaf")}</span><span><b>${esc(sch.name)}</b><span class="d">${esc(taken ? "Already on this page" : DESC[t] || "")}</span></span></button>`; }).join("")}</div>` });
    m.el.querySelectorAll("[data-type]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.type, p = clone((S.presets[t] || (() => ({ settings: {} })))());
      const sec = { id: uid(t), type: t, settings: p.settings || {}, blocks: p.blocks || [] };
      commit(() => { const a = secs(), i = st.sel ? a.findIndex((x) => x.id === st.sel) + 1 : a.length; a.splice(i, 0, sec); st.sel = sec.id; st.blk = null; }, { right: true });
      m.close();
      setTimeout(() => post({ type: "fv:select", id: sec.id, scroll: true }), 400);
      A.toast(SCHEMA[t].name + " added");
    }));
  }
  function addBlock(anchor, id) {
    const s = findSec(id), defs = SCHEMA[s.type].blocks || {};
    const add = (bt) => {
      const sample = s.blocks.find((b) => b.type === bt);
      const settings = sample ? clone(sample.settings) : {};
      (defs[bt].settings || []).forEach((f) => { if (settings[f.id] == null) settings[f.id] = f.type === "range" ? (f.min || 0) : f.type === "toggle" ? false : ""; });
      if ("title" in settings) settings.title = "New " + defs[bt].name.toLowerCase();
      commit(() => { s.blocks.push({ type: bt, settings }); st.open[id] = true; st.sel = id; st.blk = s.blocks.length - 1; }, { right: true });
    };
    const keys = Object.keys(defs);
    if (keys.length === 1) add(keys[0]); else A.menu(anchor, keys.map((k) => ({ label: defs[k].name, fn: () => add(k) })));
  }
  function select(id, blk, scroll) {
    st.sel = id; st.blk = blk == null ? null : blk;
    if (id && blk != null) st.open[id] = true;
    if (st.tab !== "sections") { st.tab = "sections"; document.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x.dataset.tab === "sections")); }
    renderLeft(); renderRight();
    if (id) post({ type: "fv:select", id, scroll: scroll !== false });
    const row = document.querySelector(`.te-sec[data-id="${CSS.escape(id || "")}"]`); if (row && scroll === false) row.scrollIntoView({ block: "nearest" });
  }

  /* ------------------------------------------------------------------ *
   * Right pane — schema-driven settings
   * ------------------------------------------------------------------ */
  const ICONS = ["leaf", "shield", "check", "sparkle", "truck", "snow", "pin", "gift", "box", "clock", "heart", "star", "phone", "mail"];
  function thumbOf(ref) {
    if (!ref) return "";
    if (String(ref).indexOf("art:") === 0) return S.ART[ref.slice(4)] || "";
    const src = window.FVFiles ? FVFiles.src(ref) : A.imgRef(ref, true);
    return `<img src="${esc(src)}" alt="">`;
  }
  function field(f, val, key) {
    const id = "f_" + key.replace(/[^a-z0-9]/gi, "_");
    const lab = `<label for="${id}">${esc(f.label)}</label>`, help = f.info ? `<span class="help">${esc(f.info)}</span>` : "";
    const v = val == null ? "" : val;
    switch (f.type) {
      case "textarea": return `<div class="te-f">${lab}<textarea class="ta" id="${id}" data-k="${key}" rows="4">${esc(v)}</textarea>${help}</div>`;
      case "link": return `<div class="te-f">${lab}<input class="in" id="${id}" data-k="${key}" list="teLinks" value="${esc(v)}" placeholder="products.html">${help}</div>`;
      case "select": return `<div class="te-f">${lab}<select class="sel" id="${id}" data-k="${key}">${(f.options || []).map(([ov, ol]) => `<option value="${esc(ov)}"${String(ov) === String(v) ? " selected" : ""}>${esc(ol)}</option>`).join("")}</select>${help}</div>`;
      case "toggle": return `<div class="te-f"><div class="row row--between"><span class="te-f__l" id="${id}-l">${esc(f.label)}</span><button type="button" class="switch" role="switch" data-k="${key}" data-toggle-f aria-labelledby="${id}-l" aria-checked="${!!v}"></button></div>${help}</div>`;
      case "range": return `<div class="te-f">${lab}<div class="te-range"><input type="range" id="${id}" data-k="${key}" data-num min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${v === "" ? f.min : v}"><output>${v === "" ? f.min : v}</output></div>${help}</div>`;
      case "list": return `<div class="te-f">${lab}<textarea class="ta" id="${id}" data-k="${key}" data-list rows="5">${esc(String(v).split("|").join("\n"))}</textarea><span class="help">${esc(f.info || "One per line")}</span></div>`;
      case "image": return `<div class="te-f"><span class="te-f__l">${esc(f.label)}</span><div class="te-img"><div class="te-img__th">${thumbOf(v)}</div><div class="stack" style="gap:6px"><div class="row"><button type="button" class="ab ab--sm" data-img="${key}">${icon("image")}${v ? "Change" : "Select"}</button>${v ? `<button type="button" class="ab ab--sm ab--plain" data-imgclr="${key}">Remove</button>` : ""}</div><span class="te-img__ref">${esc(/^data:/.test(v) ? "Uploaded image" : v)}</span></div></div>${help}</div>`;
      case "products": case "boxes": {
        const src = f.type === "boxes" ? FV.data.boxes : FV.data.products.filter((p) => !p.noPhoto || f.type !== "products" || true);
        const chosen = String(v).split(",").map((x) => x.trim()).filter(Boolean);
        return `<div class="te-f"><span class="te-f__l">${esc(f.label)}${f.max ? ` <span class="faint">(${chosen.length}/${f.max})</span>` : ""}</span><div class="te-picks" data-multi="${key}" data-max="${f.max || 0}">${src.map((p) => `<label class="te-pick"><input type="checkbox" value="${esc(p.slug)}"${chosen.includes(p.slug) ? " checked" : ""}>${p.noPhoto && !FV.isCustomImg(p.image) ? `<span class="ph"></span>` : `<img src="${esc(A.imgRef(f.type === "boxes" ? p.image : (FV.isCustomImg(p.image) ? p.image : p.slug), true))}" alt="" loading="lazy">`}<span>${esc(p.name)}</span></label>`).join("")}</div>${help}</div>`;
      }
      case "icon": return `<div class="te-f"><span class="te-f__l">${esc(f.label)}</span><div class="te-icons" role="group" aria-label="${esc(f.label)}">${ICONS.map((n) => `<button type="button" data-icon="${key}" data-v="${n}" aria-pressed="${v === n}" aria-label="${n}">${icon(n)}</button>`).join("")}</div></div>`;
      default: return `<div class="te-f">${lab}<input class="in" id="${id}" data-k="${key}" value="${esc(v)}">${help}</div>`;
    }
  }
  function target(key) {
    const s = findSec(st.sel); if (!s) return null;
    const p = key.split(".");
    if (p[0] === "s") return { obj: s.settings, k: p[1] };
    if (p[0] === "b") return { obj: (s.blocks[+p[1]] || {}).settings, k: p[2] };
    return null;
  }
  function renderRight() {
    const R = $("teRight");
    const s = st.sel && findSec(st.sel);
    if (!s) {
      R.innerHTML = `<div class="te-empty">${S.ART.bouquet}<h3>Customize ${esc(PAGES.find((p) => p[0] === st.page)[1])}</h3><p class="small">Select a section on the left — or click anything in the preview — to edit its content. Drag sections to reorder, use the eye to hide one, and add new ones from the library.</p><div class="te-fmt">Text tips: <code>*word*</code> = olive italic · <code>~word~</code> = hand-drawn underline · new lines are kept.</div></div>`;
      return;
    }
    const sch = SCHEMA[s.type] || { settings: [] };
    const isBlock = st.blk != null && s.blocks[st.blk];
    const fields = isBlock ? (((sch.blocks || {})[s.blocks[st.blk].type] || {}).settings || []) : (sch.settings || []);
    const vals = isBlock ? s.blocks[st.blk].settings : s.settings;
    R.innerHTML = `<div class="te-set">
      ${isBlock ? `<button type="button" class="te-set__crumb" data-back>${icon("back")}${esc(secName(s))}</button>` : ""}
      <div class="te-set__hd"><span class="te-sec__ic">${isBlock ? icon("list") : secIcon(s)}</span><h2>${esc(isBlock ? blockName(s, s.blocks[st.blk]) : sch.name || s.type)}</h2>${isBlock ? "" : `<button type="button" class="te-mini" data-rmore aria-label="Section actions">${icon("dots")}</button>`}</div>
      ${!isBlock && s.disabled ? `<div class="hint-box">${icon("eyeOff")}<span>This section is hidden on the storefront. <button type="button" class="link" data-show>Show it</button></span></div>` : ""}
      ${fields.map((f) => field(f, vals[f.id], (isBlock ? "b." + st.blk + "." : "s.") + f.id)).join("")}
      ${fields.some((f) => /title|line|quote|text/.test(f.id)) ? `<div class="te-fmt"><code>*word*</code> olive italic · <code>~word~</code> hand-drawn underline · line breaks are kept.</div>` : ""}
      ${isBlock ? `<button type="button" class="ab ab--plain" data-bdel2 style="color:var(--bad);align-self:flex-start">${icon("trash")}Remove ${esc(((sch.blocks || {})[s.blocks[st.blk].type] || {}).name || "block").toLowerCase()}</button>`
        : `${sch.blocks && s.blocks.length ? `<div class="te-f"><span class="te-f__l">${esc((Object.values(sch.blocks)[0] || {}).name || "Block")}s · ${s.blocks.length}</span>${s.blocks.map((b, bi) => `<button type="button" class="te-block" data-gob="${bi}" style="width:100%">${icon("list")}<span>${esc(blockName(s, b))}</span>${icon("chevR")}</button>`).join("")}</div>` : ""}
           <div class="row"><button type="button" class="ab ab--sm" data-hide2>${icon(s.disabled ? "eye" : "eyeOff")}${s.disabled ? "Show" : "Hide"} section</button><button type="button" class="ab ab--sm ab--plain" data-del2 style="color:var(--bad)">${icon("trash")}Remove</button></div>`}
    </div>`;
    const set = (key, v, o) => { const t = target(key); if (!t || !t.obj) return; commit(() => { t.obj[t.k] = v; }, o || { typing: true }); };
    R.querySelectorAll("[data-k]:not([data-toggle-f])").forEach((el) => {
      const ev = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(ev, () => {
        let v = el.value;
        if (el.hasAttribute("data-list")) v = v.split("\n").map((x) => x.trim()).filter(Boolean).join("|");
        if (el.hasAttribute("data-num")) { v = +v; const o = el.parentElement.querySelector("output"); if (o) o.textContent = v; }
        set(el.dataset.k, v, el.tagName === "SELECT" ? {} : { typing: true });
      });
    });
    R.querySelectorAll("[data-toggle-f]").forEach((b) => b.addEventListener("click", () => { const on = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", on); set(b.dataset.k, on, {}); }));
    R.querySelectorAll("[data-img]").forEach((b) => b.addEventListener("click", () => { if (!window.FVFiles) return; FVFiles.picker({ title: "Choose an image", onPick: (ref) => { set(b.dataset.img, ref, { right: true }); } }); }));
    R.querySelectorAll("[data-imgclr]").forEach((b) => b.addEventListener("click", () => set(b.dataset.imgclr, "", { right: true })));
    R.querySelectorAll("[data-multi]").forEach((box) => box.addEventListener("change", (e) => {
      const max = +box.dataset.max, vals2 = Array.from(box.querySelectorAll("input:checked")).map((i) => i.value);
      if (max && vals2.length > max) { e.target.checked = false; A.toast("Up to " + max + " — untick one first"); return; }
      set(box.dataset.multi, vals2.join(","), { right: true });
    }));
    R.querySelectorAll("[data-icon]").forEach((b) => b.addEventListener("click", () => set(b.dataset.icon, b.dataset.v, { right: true })));
    const back = R.querySelector("[data-back]"); back && back.addEventListener("click", () => select(s.id, null));
    R.querySelectorAll("[data-gob]").forEach((b) => b.addEventListener("click", () => select(s.id, +b.dataset.gob)));
    const bd = R.querySelector("[data-bdel2]"); bd && bd.addEventListener("click", () => commit(() => { s.blocks.splice(st.blk, 1); st.blk = null; }, { right: true }));
    const hd = R.querySelector("[data-hide2]"); hd && hd.addEventListener("click", () => commit(() => { s.disabled = !s.disabled; if (!s.disabled) delete s.disabled; }, { right: true }));
    const sh = R.querySelector("[data-show]"); sh && sh.addEventListener("click", () => commit(() => { delete s.disabled; }, { right: true }));
    const dl = R.querySelector("[data-del2]"); dl && dl.addEventListener("click", () => { const a = secs(); commit(() => { a.splice(a.indexOf(s), 1); st.sel = null; st.blk = null; }, { right: true }); A.toast("Section removed", "", { label: "Undo", fn: undo }); });
    const rm = R.querySelector("[data-rmore]"); rm && rm.addEventListener("click", (e) => secMenu(e.currentTarget, s.id));
  }

  /* ------------------------------------------------------------------ *
   * Theme settings (global) — reloads the preview so header/footer update
   * ------------------------------------------------------------------ */
  const TOKENS = [["--forest", "Forest (logo ink)", "#19291C"], ["--moss", "Mid Forest", "#2D4630"], ["--olive", "Olive (accent)", "#AE9D57"], ["--olive-dk", "Olive text", "#6E5F2E"], ["--sage", "Sage", "#8A8E57"], ["--kraft", "Kraft paper", "#E6DAC4"], ["--paper", "Paper (page)", "#F3EDE1"], ["--pom", "Pomegranate", "#7A2B21"]];
  function renderGlobal(L) {
    const g = st.theme.settings, a = g.announcement || {}, c = g.contact || {}, so = g.social || {}, f = g.footer || {};
    const pg = pageObj();
    const inp = (key, label, val, o) => `<div class="te-f"><label for="g_${key.replace(/\W/g, "_")}">${esc(label)}</label>${o && o.area ? `<textarea class="ta" id="g_${key.replace(/\W/g, "_")}" data-g="${key}" rows="${o.rows || 3}">${esc(val || "")}</textarea>` : `<input class="in" id="g_${key.replace(/\W/g, "_")}" data-g="${key}" value="${esc(val || "")}"${o && o.list ? ' list="teLinks"' : ""}${o && o.ph ? ` placeholder="${esc(o.ph)}"` : ""}>`}${o && o.help ? `<span class="help">${esc(o.help)}</span>` : ""}</div>`;
    L.innerHTML = `<div class="te-set">
      <section id="g-announcement" class="stack" style="gap:10px"><div class="te-set__hd"><span class="te-sec__ic">${icon("megaphone")}</span><h2>Announcement bar</h2><button type="button" class="switch" role="switch" data-gtoggle="announcement.enabled" aria-checked="${!!a.enabled}" aria-label="Show announcement bar"></button></div>
        ${inp("announcement.text", "Message", a.text)}${inp("announcement.link", "Link", a.link, { list: true })}${inp("announcement.link_label", "Link text", a.link_label)}</section>
      <section id="g-nav" class="stack" style="gap:8px"><div class="te-set__hd"><span class="te-sec__ic">${icon("menu")}</span><h2>Header menu</h2><button type="button" class="ab ab--sm" data-navadd>${icon("plus")}Link</button></div>
        ${(g.nav || []).map((l, i) => `<div class="te-row"><input class="in" data-g="nav.${i}.label" value="${esc(l.label)}" aria-label="Label"><input class="in" data-g="nav.${i}.href" value="${esc(l.href)}" list="teLinks" aria-label="Link"><button type="button" class="te-mini" data-navdel="${i}" aria-label="Remove">${icon("trash")}</button></div>`).join("")}</section>
      <section id="g-footer" class="stack" style="gap:10px"><div class="te-set__hd"><span class="te-sec__ic">${icon("list")}</span><h2>Footer</h2></div>
        ${inp("footer.title", "Headline", f.title, { area: true, rows: 2, help: "*word* for the light italic accent" })}${inp("footer.blurb", "Brand blurb", f.blurb, { area: true })}
        <p class="small faint">Footer link columns: <a class="link" href="index.html#/navigation" target="_blank" rel="noopener">edit in Navigation</a>.</p></section>
      <section class="stack" style="gap:10px"><div class="te-set__hd"><span class="te-sec__ic">${icon("phone")}</span><h2>Contact</h2></div>
        ${inp("contact.phone", "Phone", c.phone)}${inp("contact.whatsapp", "WhatsApp number", c.whatsapp, { ph: "201000000000" })}${inp("contact.email", "Email", c.email)}${inp("contact.hours", "Hours", c.hours)}${inp("contact.city", "City", c.city)}</section>
      <section class="stack" style="gap:10px"><div class="te-set__hd"><span class="te-sec__ic">${icon("instagram")}</span><h2>Social</h2></div>${inp("social.instagram", "Instagram", so.instagram)}${inp("social.facebook", "Facebook", so.facebook)}${inp("social.tiktok", "TikTok", so.tiktok)}</section>
      <section class="stack" style="gap:10px"><div class="te-set__hd"><span class="te-sec__ic">${icon("pin")}</span><h2>Delivery areas</h2></div><div class="te-f"><textarea class="ta" data-garea rows="5" aria-label="Delivery areas">${esc((g.areas || []).join("\n"))}</textarea><span class="help">One per line.</span></div></section>
      <section class="stack" style="gap:10px"><div class="te-set__hd"><span class="te-sec__ic">${icon("palette")}</span><h2>Colours</h2><button type="button" class="ab ab--sm ab--plain" data-cres>Reset</button></div>
        <div class="hint-box">${icon("info")}<span>These are the Fresh Valley brand colours sampled from the logo and packaging — change them only for seasonal campaigns.</span></div>
        <div class="te-colors">${TOKENS.map(([t, l, d]) => { const cv = (g.colors || {})[t] || d; return `<label class="te-color"><input type="color" data-color="${t}" value="${esc(cv)}"><span>${esc(l)}</span><code>${esc(cv)}</code></label>`; }).join("")}</div></section>
      <section class="stack" style="gap:10px"><div class="te-set__hd"><span class="te-sec__ic">${icon("globe")}</span><h2>SEO · ${esc(PAGES.find((p) => p[0] === st.page)[1])}</h2></div><div class="te-f"><label for="gSeo">Page title</label><input class="in" id="gSeo" data-seo value="${esc(pg.seo_title || "")}" placeholder="Default title"></div></section>
    </div>`;
    const setPath = (path, v) => { const p = path.split("."); let o = st.theme.settings; for (let i = 0; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = /^\d+$/.test(p[i + 1]) ? [] : {}; o = o[p[i]]; } o[p[p.length - 1]] = v; };
    L.querySelectorAll("[data-g]").forEach((el) => el.addEventListener("input", () => commit(() => setPath(el.dataset.g, el.value), { typing: true, global: true, left: false })));
    L.querySelectorAll("[data-gtoggle]").forEach((b) => b.addEventListener("click", () => { const on = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", on); commit(() => setPath(b.dataset.gtoggle, on), { global: true, left: false }); }));
    L.querySelector("[data-navadd]").addEventListener("click", () => commit(() => { st.theme.settings.nav = (st.theme.settings.nav || []).concat([{ label: "New link", href: "products.html" }]); }, { global: true }));
    L.querySelectorAll("[data-navdel]").forEach((b) => b.addEventListener("click", () => commit(() => { st.theme.settings.nav.splice(+b.dataset.navdel, 1); }, { global: true })));
    L.querySelector("[data-garea]").addEventListener("input", (e) => commit(() => { st.theme.settings.areas = e.target.value.split("\n").map((x) => x.trim()).filter(Boolean); }, { typing: true, global: true, left: false }));
    L.querySelectorAll("[data-color]").forEach((inp) => inp.addEventListener("input", () => { inp.parentElement.querySelector("code").textContent = inp.value; commit(() => { st.theme.settings.colors = Object.assign({}, st.theme.settings.colors, { [inp.dataset.color]: inp.value }); }, { typing: true, global: true, left: false }); }));
    L.querySelector("[data-cres]").addEventListener("click", () => commit(() => { st.theme.settings.colors = {}; }, { global: true }));
    L.querySelector("[data-seo]").addEventListener("input", (e) => commit(() => { const v = e.target.value.trim(); if (v) pageObj().seo_title = v; else delete pageObj().seo_title; }, { typing: true, left: false }));
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  updateTop(); renderLeft(); renderRight(); load();
  setInterval(updateTop, 30000);
})();
