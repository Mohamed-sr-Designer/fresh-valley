const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

const getJSON = (key) => db.site.get(key, {});
const setJSON = (key, obj) => db.site.set(key, obj);
const adminOnly = [requireAuth, requireRole("super-admin", "admin")];

// GET /api/site  (public) — everything the storefront needs to render itself
router.get("/", (req, res) => {
  res.json({ content: getJSON("content"), theme: getJSON("theme"), images: getJSON("images"), settings: getJSON("settings") });
});

// PATCH /api/site/content  (admin) — merge keys
router.patch("/content", adminOnly, (req, res) => {
  const merged = Object.assign({}, getJSON("content"), req.body || {});
  setJSON("content", merged); res.json(merged);
});

// PUT /api/site/theme  (admin) — replace whole palette
router.put("/theme", adminOnly, (req, res) => { setJSON("theme", req.body || {}); res.json(req.body || {}); });

// PATCH /api/site/settings  (super-admin only — store rules)
router.patch("/settings", requireAuth, requireRole("super-admin"), (req, res) => {
  const merged = Object.assign({}, getJSON("settings"), req.body || {});
  setJSON("settings", merged); res.json(merged);
});

// PATCH /api/site/images  (admin) — set/clear an override by key { key, url }
router.patch("/images", adminOnly, (req, res) => {
  const { key, url } = req.body || {};
  if (!key) return res.status(400).json({ error: "key is required" });
  const imgs = Object.assign({}, getJSON("images"));
  if (url == null || url === "") delete imgs[key]; else imgs[key] = url;
  setJSON("images", imgs); res.json(imgs);
});

/* ---- Image upload ---- */
const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const MAX_MB = +(process.env.MAX_UPLOAD_MB || 3);
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || ".jpg").toLowerCase().replace(/[^.a-z0-9]/g, "");
    cb(null, ((req.body.key || "image").replace(/[^a-z0-9-]/gi, "")) + "-" + Date.now() + ext);
  },
});
const upload = multer({
  storage, limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpe?g|png|webp|avif)$/.test(file.mimetype)),
});

// POST /api/site/images/upload  (admin) — multipart field "file" + "key"
router.post("/images/upload", adminOnly, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Upload an image under " + MAX_MB + "MB (jpg/png/webp)" });
  const url = "/uploads/" + req.file.filename;
  const key = (req.body.key || "").replace(/[^a-z0-9-]/gi, "");
  if (key) { const imgs = Object.assign({}, getJSON("images")); imgs[key] = url; setJSON("images", imgs); }
  res.status(201).json({ url, key });
});

module.exports = router;
