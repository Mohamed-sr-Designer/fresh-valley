// Minimal zero-dependency static server for the Fresh Valley site.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");          // serves /fresh-valley
const PORT = process.env.PORT || process.argv[2] || 5500;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  // default .html for extensionless routes
  let filePath = path.join(ROOT, urlPath);
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + ".html")) filePath += ".html";
    else if (fs.existsSync(path.join(filePath, "index.html"))) filePath = path.join(filePath, "index.html");
  }
  // prevent path traversal
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<h1>404</h1><p>Not found: " + urlPath + "</p>");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(PORT, () => console.log("Fresh Valley running at http://localhost:" + PORT));
