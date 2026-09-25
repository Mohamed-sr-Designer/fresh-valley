/* =====================================================================
   FRESH VALLEY Admin — Media library (window.FVFiles)
   Uploads are downscaled in the browser (max 1800px, WebP/JPEG ~0.82)
   and kept in localStorage fv_files as data URLs; "Publish" later moves
   any that are used into assets/img/uploads/ in the repository.
   picker({ onPick(ref), title }) opens a self-contained modal with
   Uploaded / Products / Brand photos / Line-art tabs.
   ===================================================================== */
window.FVFiles = (function () {
  "use strict";
  const KEY = "fv_files";
  const FV = window.FV, S = window.FVSections;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { return []; } };
  const write = (l) => { localStorage.setItem(KEY, JSON.stringify(l)); };
  const all = () => read().map((f) => Object.assign({ ref: f.data }, f));
  const BRAND = ["hero", "banner:packaging", "banner:door-delivery", "banner:home-delivery", "banner:delivery-van", "banner:staff-shirt", "banner:juice-bottles"];
  const ARTS = ["sprig", "leaf", "citrus", "fig", "tomato", "strawberry", "herbs", "bouquet"];
  const src = (ref) => ref.indexOf("banner:") === 0 ? "../assets/img/banners/sm/" + ref.slice(7) + ".jpg" : ref === "hero" ? "../assets/img/hero/hero-800.jpg" : /^(data:|https?:)/.test(ref) ? ref : ref.indexOf("assets/") === 0 ? "../" + ref : "../" + FV.thumb(ref);

  function compress(file) {
    return new Promise((res, rej) => {
      if (!/^image\//.test(file.type)) return rej(new Error("Only images can be uploaded"));
      if (file.type === "image/svg+xml") { const r = new FileReader(); r.onload = () => res({ data: r.result, w: 0, h: 0 }); r.onerror = () => rej(new Error("Couldn't read the file")); r.readAsDataURL(file); return; }
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const max = 1800, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        let data = c.toDataURL("image/webp", 0.82);
        if (data.indexOf("data:image/webp") !== 0) data = c.toDataURL("image/jpeg", 0.84);
        res({ data, w, h });
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("That image couldn't be opened")); };
      img.src = url;
    });
  }
  async function add(file) {
    const out = await compress(file);
    const size = Math.round((out.data.length * 3) / 4);
    if (size > 4 * 1024 * 1024) throw new Error("Image is too large even after compression (max 4 MB)");
    const f = { id: "F" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: file.name.replace(/[<>]/g, ""), type: out.data.slice(5, out.data.indexOf(";")), size, w: out.w, h: out.h, data: out.data, date: new Date().toISOString() };
    const l = read(); l.unshift(f);
    try { write(l); } catch (e) { throw new Error("Browser storage is full — delete some files or clear demo data first"); }
    return Object.assign({ ref: f.data }, f);
  }
  function remove(id) { write(read().filter((f) => f.id !== id)); }
  const fmtSize = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";

  /* ------------------------------------------------------------------ *
   * Picker modal
   * ------------------------------------------------------------------ */
  let styled = false;
  function style() {
    if (styled) return; styled = true;
    const s = document.createElement("style");
    s.textContent = `.fvf-scrim{position:fixed;inset:0;z-index:300;background:rgba(25,41,28,.45);display:grid;place-items:center;padding:20px;font-family:"Jakarta",system-ui,sans-serif}
.fvf{width:min(880px,100%);height:min(640px,calc(100vh - 40px));background:#fff;border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden;color:#211F1B}
.fvf__hd{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #E4E1D8}.fvf__hd h2{font-size:16px;font-weight:750;flex:1;margin:0}
.fvf__x{width:32px;height:32px;border-radius:8px;border:0;background:none;cursor:pointer;font-size:20px;line-height:1;color:#5C574F}.fvf__x:hover{background:#F3F2EE}
.fvf__tabs{display:flex;gap:2px;padding:8px 12px 0;border-bottom:1px solid #E4E1D8}.fvf__tabs button{height:34px;padding:0 12px;border:0;background:none;font:inherit;font-size:13px;font-weight:650;color:#5C574F;cursor:pointer;border-radius:8px 8px 0 0;position:relative}
.fvf__tabs button[aria-selected=true]{color:#19291C}.fvf__tabs button[aria-selected=true]:after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:2.5px;border-radius:3px;background:#19291C}
.fvf__bar{display:flex;gap:8px;padding:10px 14px;align-items:center}.fvf__bar input[type=search]{flex:1;height:34px;border:1px solid #CFCBBF;border-radius:8px;padding:0 10px;font:inherit;font-size:13px}
.fvf__up{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:9px;background:#19291C;color:#F3EDE1;font-weight:650;font-size:13px;cursor:pointer;border:0}
.fvf__grid{flex:1;overflow:auto;padding:4px 14px 14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;align-content:start}
.fvf__it{position:relative;border:1.5px solid #E4E1D8;border-radius:12px;overflow:hidden;background:#F3EDE1;cursor:pointer;padding:0;text-align:left;font:inherit}
.fvf__it:hover,.fvf__it:focus-visible{border-color:#19291C;outline:none;box-shadow:0 0 0 3px rgba(174,157,87,.35)}
.fvf__it img,.fvf__it .art-box{display:block;width:100%;aspect-ratio:1;object-fit:cover}.fvf__it .art-box{display:grid;place-items:center;background:#19291C;color:#CFC287;padding:18%}
.fvf__it .art-box svg{width:100%;height:100%}.fvf__it .art-box path,.fvf__it .art-box circle{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.fvf__it span{display:block;padding:6px 8px;font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#fff}
.fvf__drop{grid-column:1/-1;border:1.5px dashed #BDB8AB;border-radius:12px;padding:28px;text-align:center;color:#5C574F;font-size:13px}.fvf__drop.on{border-color:#19291C;background:#F4F1E6}
.fvf__empty{grid-column:1/-1;color:#8A8479;font-size:13px;padding:20px 4px}`;
    document.head.appendChild(s);
  }
  function picker(o) {
    o = o || {};
    style();
    const scrim = document.createElement("div");
    scrim.className = "fvf-scrim";
    scrim.innerHTML = `<div class="fvf" role="dialog" aria-modal="true" aria-label="${esc(o.title || "Choose an image")}">
      <div class="fvf__hd"><h2>${esc(o.title || "Choose an image")}</h2><button class="fvf__x" type="button" aria-label="Close">×</button></div>
      <div class="fvf__tabs" role="tablist"><button type="button" role="tab" data-tab="up" aria-selected="true">Uploaded</button><button type="button" role="tab" data-tab="prod" aria-selected="false">Products</button><button type="button" role="tab" data-tab="brand" aria-selected="false">Brand photos</button><button type="button" role="tab" data-tab="art" aria-selected="false">Line-art</button></div>
      <div class="fvf__bar"><input type="search" placeholder="Search…" aria-label="Search images"><label class="fvf__up">Upload<input type="file" accept="image/*" multiple hidden></label></div>
      <div class="fvf__grid" tabindex="-1"></div></div>`;
    document.body.appendChild(scrim);
    const prev = document.activeElement;
    const grid = scrim.querySelector(".fvf__grid"), search = scrim.querySelector("input[type=search]"), fileIn = scrim.querySelector("input[type=file]");
    let tab = "up";
    const close = () => { scrim.remove(); document.removeEventListener("keydown", key); if (prev && prev.focus) prev.focus(); };
    const choose = (ref) => { close(); if (o.onPick) o.onPick(ref); };
    function key(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab") { const f = Array.from(scrim.querySelectorAll("button, input, [tabindex='0']")).filter((x) => x.offsetParent !== null); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
    }
    document.addEventListener("keydown", key);
    scrim.addEventListener("click", (e) => { if (e.target === scrim) close(); });
    scrim.querySelector(".fvf__x").addEventListener("click", close);
    async function upload(files) {
      for (const f of Array.from(files)) { try { await add(f); } catch (e) { alert(e.message); } }
      tab = "up"; setTab(); render();
    }
    fileIn.addEventListener("change", () => upload(fileIn.files));
    function setTab() { scrim.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab)); }
    scrim.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; setTab(); render(); }));
    search.addEventListener("input", render);
    function render() {
      const q = search.value.trim().toLowerCase();
      let items = [];
      if (tab === "up") items = all().map((f) => ({ ref: f.ref, label: f.name, img: f.ref }));
      if (tab === "prod") items = FV.data.products.filter((p) => !p.noPhoto).map((p) => ({ ref: p.slug, label: p.name, img: src(p.slug) }));
      if (tab === "brand") items = BRAND.map((r) => ({ ref: r, label: r === "hero" ? "Hero · woman arranging fruit" : r.slice(7).replace(/-/g, " "), img: src(r) }));
      if (tab === "art") items = ARTS.map((a) => ({ ref: "art:" + a, label: a, art: S.ART[a] }));
      items = items.filter((i) => !q || i.label.toLowerCase().includes(q));
      grid.innerHTML = (tab === "up" ? `<div class="fvf__drop">Drop images here, or use Upload. They're resized in your browser before saving.</div>` : "") +
        (items.length ? items.map((i, n) => `<button type="button" class="fvf__it" data-n="${n}">${i.art ? `<span class="art-box">${i.art}</span>` : `<img src="${esc(i.img)}" alt="" loading="lazy">`}<span>${esc(i.label)}</span></button>`).join("") : `<p class="fvf__empty">${tab === "up" ? "No uploads yet." : "Nothing matches."}</p>`);
      grid.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => choose(items[+b.dataset.n].ref)));
    }
    const dropOn = (on) => { const d = grid.querySelector(".fvf__drop"); if (d) d.classList.toggle("on", on); };
    ["dragenter", "dragover"].forEach((ev) => grid.addEventListener(ev, (e) => { e.preventDefault(); dropOn(true); }));
    grid.addEventListener("dragleave", () => dropOn(false));
    grid.addEventListener("drop", (e) => { e.preventDefault(); dropOn(false); if (e.dataTransfer && e.dataTransfer.files.length) upload(e.dataTransfer.files); });
    if (!read().length) { tab = "prod"; setTab(); }
    render();
    search.focus();
  }
  return { all, add, remove, picker, fmtSize, src, KEY };
})();
