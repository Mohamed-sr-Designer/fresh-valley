/* =====================================================================
   Fresh Valley — API server + static host
   Serves the storefront + admin console and the REST API from one Node
   process. Run:  npm install && npm start   (see README.md)
   ===================================================================== */
require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { seedAll } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;
const ROOT = path.join(__dirname, "..");           // the static storefront + admin

// First-run: create schema + seed (idempotent).
const seedResult = seedAll();
console.log("DB ready:", seedResult);

/* ---- Security & parsing --------------------------------------------------- */
app.disable("x-powered-by");
app.set("trust proxy", 1);                          // correct client IPs behind a proxy/CDN
app.use(helmet({
  contentSecurityPolicy: false,        // the static pages use inline scripts; add a CSP in prod (see README)
  crossOriginEmbedderPolicy: false,    // allow Google Fonts / external images
}));
const origins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use("/api", cors({ origin: origins.length ? origins : true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Throttle auth + general API abuse
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many sign-in attempts — try again in a few minutes" } }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

/* ---- API routes ----------------------------------------------------------- */
app.get("/api/health", (req, res) => res.json({ ok: true, name: "fresh-valley-api", time: new Date().toISOString() }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/site", require("./routes/site"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api", (req, res) => res.status(404).json({ error: "Unknown API endpoint" }));

/* ---- Static frontend ------------------------------------------------------ */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((req, res, next) => {                        // never expose the server folder or dotfiles
  if (req.path === "/server" || req.path.startsWith("/server/")) return res.status(404).end();
  next();
});
app.use(express.static(ROOT, { dotfiles: "ignore", index: "index.html", extensions: ["html"] }));
// SPA-style fallback for clean URLs → storefront home
app.get("*", (req, res) => res.sendFile(path.join(ROOT, "index.html")));

/* ---- Errors --------------------------------------------------------------- */
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Image too large" });
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => console.log(`Fresh Valley running → http://localhost:${PORT}`));
