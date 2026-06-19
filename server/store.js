/* =====================================================================
   Pure-JS persistent store (JSON file) — zero native dependencies, so
   `npm install` never fails and it deploys on any Node host.
   Collections: users, products, customers, orders + a site key/value.
   For higher scale, swap this module for a Postgres/Prisma adapter that
   exposes the same small surface (.all/.where/.find/.insert/.update/.remove).
   ===================================================================== */
const fs = require("fs");
const path = require("path");

function createStore(file) {
  const dir = path.dirname(file);
  let data = { users: [], products: [], customers: [], orders: [], seq: {}, site: {} };

  function load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      data = Object.assign(data, parsed);
    } catch { /* fresh database */ }
    ["users", "products", "customers", "orders"].forEach((k) => { if (!Array.isArray(data[k])) data[k] = []; });
    data.seq = data.seq || {}; data.site = data.site || {};
  }
  let dirty = false, timer = null;
  function persist() { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)); }
  function save() { // debounce bursts of writes, but flush synchronously on demand
    dirty = true;
    if (timer) return;
    timer = setTimeout(() => { timer = null; if (dirty) { dirty = false; persist(); } }, 40);
  }
  function flush() { if (timer) { clearTimeout(timer); timer = null; } if (dirty || true) { dirty = false; persist(); } }

  load();

  function nextId(name) { data.seq[name] = (data.seq[name] || 0) + 1; save(); return data.seq[name]; }

  const coll = (name) => ({
    all: () => data[name].slice(),
    where: (p) => data[name].filter(p),
    find: (p) => data[name].find(p),
    insert: (row) => { data[name].push(row); flush(); return row; },
    update: (p, patch) => { const r = typeof p === "function" ? data[name].find(p) : null; if (r) { Object.assign(r, patch); flush(); } return r; },
    remove: (p) => { const before = data[name].length; data[name] = data[name].filter((x) => !p(x)); if (data[name].length !== before) flush(); },
    count: (p) => (p ? data[name].filter(p).length : data[name].length),
    nextId: () => nextId(name),
  });

  return {
    users: coll("users"),
    products: coll("products"),
    customers: coll("customers"),
    orders: coll("orders"),
    site: {
      get: (k, fb) => (k in data.site ? data.site[k] : fb),
      set: (k, v) => { data.site[k] = v; flush(); },
      all: () => Object.assign({}, data.site),
    },
    flush,
    _data: data,
  };
}

module.exports = { createStore };
