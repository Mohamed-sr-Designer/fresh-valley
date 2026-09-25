/* =====================================================================
   FRESH VALLEY Admin — Publishing (window.FVPublish)
   Writes assets/js/content.js to the GitHub repository through the
   contents API, first uploading any browser-stored images that the
   theme or catalog uses into assets/img/uploads/. The personal access
   token stays in this browser and is only ever sent to api.github.com.
   ===================================================================== */
window.FVPublish = (function () {
  "use strict";
  const KEY = "fv_gh";
  const DEF = { owner: "Mohamed-sr-Designer", repo: "fresh-valley", branch: "main" };
  const API = "https://api.github.com";
  function raw() { let c = {}; try { c = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {} return Object.assign({}, DEF, c); }
  function config() { const c = raw(); return { owner: c.owner, repo: c.repo, branch: c.branch, hasToken: !!c.token, lastPublished: c.lastPublished || null, lastUrl: c.lastUrl || "" }; }
  function saveConfig(o) {
    const c = raw();
    ["owner", "repo", "branch"].forEach((k) => { if (o[k] != null && String(o[k]).trim()) c[k] = String(o[k]).trim(); });
    if (o.token) c.token = String(o.token).trim();
    if (o.token === null) delete c.token;
    localStorage.setItem(KEY, JSON.stringify(c));
  }
  async function gh(path, opts) {
    const c = raw();
    if (!c.token) throw new Error("Add a GitHub access token first");
    const res = await fetch(API + path, Object.assign({}, opts, { headers: Object.assign({ Accept: "application/vnd.github+json", Authorization: "Bearer " + c.token, "X-GitHub-Api-Version": "2022-11-28" }, opts && opts.body ? { "Content-Type": "application/json" } : {}) }));
    if (res.status === 404 && opts && opts.allow404) return null;
    if (!res.ok) { let m = res.status + ""; try { const j = await res.json(); m = j.message || m; } catch (_) {} throw new Error("GitHub: " + m); }
    return res.status === 204 ? {} : res.json();
  }
  async function test() {
    try {
      const c = raw();
      const r = await gh(`/repos/${c.owner}/${c.repo}`);
      if (r.permissions && r.permissions.push === false) return { ok: false, msg: "The token can read " + r.full_name + " but can't write to it." };
      return { ok: true, msg: "Connected to " + r.full_name + " · default branch " + r.default_branch };
    } catch (e) { return { ok: false, msg: e.message }; }
  }
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
  function payload() {
    const t = Date.now();
    const theme = read("fv_theme") || (window.FVTheme ? FVTheme.defaults() : null);
    const catalog = read("fv_catalog"), settings = read("fv_admin_settings");
    const p = { updatedAt: t };
    if (theme) p.theme = Object.assign({}, theme, { updatedAt: t });
    if (catalog) p.catalog = Object.assign({}, catalog, { updatedAt: t });
    if (settings) p.settings = Object.assign({}, settings, { updatedAt: t });
    return p;
  }
  function buildContent(p) {
    p = p || payload();
    return "/* =====================================================================\n   FRESH VALLEY — Published store content\n   Written by the admin's Publish button on " + new Date(p.updatedAt).toISOString() + ".\n   Edit through the admin (Online Store → Customize), not by hand.\n   ===================================================================== */\nwindow.FV_CONTENT = " + JSON.stringify(p) + ";\n";
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buildContent()], { type: "text/javascript;charset=utf-8" }));
    a.download = "content.js"; document.body.appendChild(a); a.click(); a.remove();
  }
  const b64 = (str) => btoa(unescape(encodeURIComponent(str)));
  async function hash(s) {
    try { const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s)); return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 14); }
    catch (_) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(16); }
  }
  function walk(o, fn) {
    if (Array.isArray(o)) return o.map((x) => walk(x, fn));
    if (o && typeof o === "object") { const r = {}; Object.keys(o).forEach((k) => { r[k] = walk(o[k], fn); }); return r; }
    return fn(o);
  }
  async function put(path, content64, message) {
    const c = raw();
    const cur = await gh(`/repos/${c.owner}/${c.repo}/contents/${path}?ref=${encodeURIComponent(c.branch)}`, { allow404: true });
    const body = { message, content: content64, branch: c.branch };
    if (cur && cur.sha) body.sha = cur.sha;
    return gh(`/repos/${c.owner}/${c.repo}/contents/${path}`, { method: "PUT", body: JSON.stringify(body) });
  }
  async function publish(o) {
    o = o || {};
    const step = (m) => { if (o.onProgress) o.onProgress(m); };
    const c = raw();
    if (!c.token) return { ok: false, msg: "Add a GitHub access token in Settings → Publishing first." };
    try {
      let p = payload();
      // 1) images that only live in this browser → repository files
      const found = new Set();
      walk(p, (v) => { if (typeof v === "string" && /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/.test(v)) found.add(v); return v; });
      const map = {};
      let i = 0;
      for (const d of found) {
        i++;
        const mime = d.slice(5, d.indexOf(";")), ext = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" }[mime] || "img";
        const path = "assets/img/uploads/" + (await hash(d)) + "." + ext;
        step("Uploading image " + i + " of " + found.size + "…");
        await put(path, d.slice(d.indexOf(",") + 1), "CMS: upload image " + path.split("/").pop());
        map[d] = path;
      }
      if (found.size) p = walk(p, (v) => (typeof v === "string" && map[v]) ? map[v] : v);
      // 2) the content file itself
      step("Publishing content.js…");
      const r = await put("assets/js/content.js", b64(buildContent(p)), "CMS publish · " + new Date(p.updatedAt).toISOString());
      const url = (r && r.commit && r.commit.html_url) || `https://github.com/${c.owner}/${c.repo}`;
      const cc = raw(); cc.lastPublished = p.updatedAt; cc.lastUrl = url; localStorage.setItem(KEY, JSON.stringify(cc));
      step("Done");
      return { ok: true, url, msg: "Published. GitHub Pages refreshes the live store in about a minute." + (found.size ? " " + found.size + " image" + (found.size > 1 ? "s" : "") + " uploaded." : "") };
    } catch (e) { return { ok: false, msg: e.message }; }
  }
  return { config, saveConfig, test, buildContent, download, publish };
})();
