/* =====================================================================
   FRESH VALLEY — image build
   One photographic system for the whole store:
   · Products — one fixed studio set: the same travertine tray, oatmeal
     stone table, warm sand backdrop and soft window light for every item,
     whole produce only (_src/studio, generated on Magnific from one
     reference frame so every shot matches).
   · Editorial — boxes, category tiles, hero, banners and journal in the
     same world: travertine, linen, forest-green accents, warm daylight
     (_src/life).
   Outputs (JPG + WebP):
     assets/img/products/{key}.jpg  800×1000 (4:5)  + sm/ 432×540
     assets/img/products/j-*.jpg    800×533  (3:2)  + sm/ 432×288
     assets/img/banners/{key}.jpg   1500×780        + sm/ 540×281
     assets/img/hero/hero-{800..2400}.jpg · hero-portrait-{700,1000}.jpg
   Usage: node _build/images.js   (needs sharp)
   ===================================================================== */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const STUDIO = path.join(ROOT, "_src/studio"), LIFE = path.join(ROOT, "_src/life");
const life = (n) => path.join(LIFE, n + ".img");

async function out(input, file, w, h, pos) {
  const buf = await sharp(input).resize(w, h, { fit: "cover", position: pos || "centre", kernel: "lanczos3" }).toBuffer();
  await sharp(buf).jpeg({ quality: 84, mozjpeg: true, progressive: true }).toFile(file + ".jpg");
  await sharp(buf).webp({ quality: 82, effort: 5 }).toFile(file + ".webp");
}
/* studio shots: the tray sits in the lower-middle — frame it a little closer */
async function studioCrop(src) {
  const m = await sharp(src).metadata(), w = Math.round(m.width * 0.86), h = Math.min(m.height, Math.round(w * 1.25));
  const left = Math.round((m.width - w) / 2), top = Math.max(0, Math.min(m.height - h, Math.round(m.height * 0.6 - h / 2)));
  return sharp(src).extract({ left, top, width: w, height: h }).toBuffer();
}

(async () => {
  const P = path.join(ROOT, "assets/img/products"), B = path.join(ROOT, "assets/img/banners"), H = path.join(ROOT, "assets/img/hero");
  [P, P + "/sm", B, B + "/sm", H].forEach((d) => fs.mkdirSync(d, { recursive: true }));
  let n = 0;
  for (const f of fs.readdirSync(STUDIO).filter((x) => x.endsWith(".png") && !/^m\d/.test(x))) {
    const k = f.replace(/\.png$/, ""), buf = await studioCrop(path.join(STUDIO, f));
    await out(buf, path.join(P, k), 800, 1000); await out(buf, path.join(P, "sm", k), 432, 540); n++;
  }
  for (const k of ["box-hosting", "box-premium", "box-family", "box-seasonal", "box-organic", "tile-boxes", "tile-fruit", "tile-veg", "tile-herbs", "q-arrange"]) {
    await out(life(k), path.join(P, k), 800, 1000); await out(life(k), path.join(P, "sm", k), 432, 540); n++;
  }
  for (const k of ["j-hosting-table", "j-grading", "j-dates", "j-mango", "j-guests", "j-storing"]) {
    await out(life(k), path.join(P, k), 800, 533); await out(life(k), path.join(P, "sm", k), 432, 288); n++;
  }
  const BANNERS = { "door-delivery": "door-delivery", "home-delivery": "home-delivery", "hosting-table": "hosting-table", "guest-arrival": "guest-arrival",
    packaging: "grading", "staff-shirt": "cold-room", "delivery-van": "hosting-table", "juice-bottles": "home-delivery", "friday-lunch": "j-guests" };
  for (const [k, src] of Object.entries(BANNERS)) { await out(life(src), path.join(B, k), 1500, 780); await out(life(src), path.join(B, "sm", k), 540, 281); }
  const m = await sharp(life("hero")).metadata();
  for (const w of [800, 1200, 1800, 2400]) await out(life("hero"), path.join(H, "hero-" + w), w, Math.round((w * m.height) / m.width));
  for (const w of [700, 1000]) await out(life("hero-portrait"), path.join(H, "hero-portrait-" + w), w, Math.round(w * 1.25));
  console.log("done", n, "product/editorial images,", Object.keys(BANNERS).length, "banners, hero", m.width + "×" + m.height);
})();
