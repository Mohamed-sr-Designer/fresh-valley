/* =====================================================================
   Loads the storefront catalog (assets/js/data.js) inside Node so the
   database is seeded from the SAME single source of truth the frontend
   uses. No duplication — edit data.js and re-seed.
   ===================================================================== */
const fs = require("fs");
const path = require("path");

function loadCatalog() {
  const file = path.join(__dirname, "..", "assets", "js", "data.js");
  const code = fs.readFileSync(file, "utf8");
  // data.js does:  window.FV_DATA = (function(){ ... return {...} })();
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function("window", code)(sandbox.window);
  const D = sandbox.window.FV_DATA;
  if (!D || !D.products) throw new Error("Could not parse catalog from data.js");
  return D;
}

module.exports = { loadCatalog };
