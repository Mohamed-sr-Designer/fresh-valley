/* =====================================================================
   FRESH VALLEY — Frontend API client (FVAPI)
   ---------------------------------------------------------------------
   A thin wrapper over the backend REST API (see /server). The current
   storefront + admin run on localStorage (a self-contained demo). To go
   live, the front-end developer points the data layer at these methods —
   each one maps 1:1 to an admin.js/app.js localStorage call. See the
   "Frontend integration map" section of HANDOFF.md.

   Usage:
     FVAPI.base = "/api";              // same-origin (server hosts the site)
     await FVAPI.login(email, pass);   // stores the token
     const orders = await FVAPI.orders.list();
   ===================================================================== */
(function () {
  "use strict";
  const TOKEN_KEY = "fv_api_token";

  const FVAPI = {
    base: (window.FV_CONFIG && window.FV_CONFIG.apiBase) || "/api",
    token: () => localStorage.getItem(TOKEN_KEY) || "",
    setToken: (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY),

    async req(method, path, body, isForm) {
      const headers = {};
      const t = FVAPI.token();
      if (t) headers.Authorization = "Bearer " + t;
      let payload;
      if (isForm) { payload = body; }
      else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
      const res = await fetch(FVAPI.base + path, { method, headers, body: payload });
      const data = res.status === 204 ? null : await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || ("Request failed (" + res.status + ")"));
      return data;
    },
    get(p) { return this.req("GET", p); },
    post(p, b) { return this.req("POST", p, b); },
    patch(p, b) { return this.req("PATCH", p, b); },
    put(p, b) { return this.req("PUT", p, b); },
    del(p) { return this.req("DELETE", p); },

    /* ---- Auth ---- */
    async login(email, password) {
      const r = await this.post("/auth/login", { email, password });
      this.setToken(r.token); return r.user;
    },
    logout() { this.setToken(""); },
    me() { return this.get("/auth/me"); },

    /* ---- Public storefront ---- */
    site() { return this.get("/site"); },                 // { content, theme, images, settings }
    products() { return this.get("/products"); },
    checkout(order) { return this.post("/orders", order); },

    /* ---- Admin ---- */
    orders: {
      list(query) { return FVAPI.get("/orders" + (query ? "?" + new URLSearchParams(query) : "")); },
      get(id) { return FVAPI.get("/orders/" + id); },
      setStatus(id, status) { return FVAPI.patch("/orders/" + id, { status }); },
    },
    customers: {
      list() { return FVAPI.get("/customers"); },
      update(id, patch) { return FVAPI.patch("/customers/" + id, patch); },
    },
    catalog: {
      update(slug, patch) { return FVAPI.patch("/products/" + slug, patch); },
    },
    users: {
      list() { return FVAPI.get("/users"); },
      create(u) { return FVAPI.post("/users", u); },
      update(id, patch) { return FVAPI.patch("/users/" + id, patch); },
      remove(id) { return FVAPI.del("/users/" + id); },
    },
    content: {
      save(patch) { return FVAPI.patch("/site/content", patch); },
      theme(map) { return FVAPI.put("/site/theme", map); },
      settings(patch) { return FVAPI.patch("/site/settings", patch); },
      setImage(key, url) { return FVAPI.patch("/site/images", { key, url }); },
      uploadImage(key, file) {
        const fd = new FormData(); fd.append("key", key); fd.append("file", file);
        return FVAPI.req("POST", "/site/images/upload", fd, true);
      },
    },
    analytics() { return this.get("/analytics/summary"); },
  };

  window.FVAPI = FVAPI;
})();
