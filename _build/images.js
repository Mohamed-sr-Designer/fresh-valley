/* =====================================================================
   FRESH VALLEY — image build
   One photographic direction for the whole store: golden hour, white
   marble, forest-green cabinetry, linen and brass. Sources are the brand's
   raw library (2026/Q3/oct/FV_Social_Q4/01_raw_magnific) plus a few
   matching generations in _src/gen for products the library lacks.
   Outputs (JPG + WebP):
     assets/img/products/{key}.jpg  800×1000 (4:5)   + sm/{key} 432×540
     assets/img/banners/{key}.jpg   1500×780         + sm/{key} 540×281
     assets/img/hero/hero-{800..2400}.jpg (landscape) + hero-portrait-{700,1000}
   Usage: node _build/images.js   (needs sharp)
   ===================================================================== */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const RAW = "D:/Work/Fresh vally/2026/Q3/oct/FV_Social_Q4/01_raw_magnific/FVraw_";
const GEN = path.join(ROOT, "_src/gen/");
const raw = (n) => RAW + n + (fs.existsSync(RAW + n + ".png") ? ".png" : ".jpg");
const gen = (n) => GEN + n + ".png";

const PRODUCTS = {
  strawberry: raw("F30_strawberries"), mango: raw("F09_mango"), orange: raw("S09_mandarin-countdown"),
  "red-grapes": gen("red-grapes"), "green-grapes": gen("green-grapes"), "red-apple": raw("F17_apples"),
  "green-apple": raw("S28_green-or-red"), "golden-apple": gen("golden-apple"), peach: gen("peach"), cherry: gen("cherry"),
  "medjool-dates": gen("medjool-dates"), lemon: raw("F20_lemons"), banana: raw("F35_bananas"), pineapple: gen("pineapple"),
  watermelon: gen("watermelon"), cantaloupe: gen("cantaloupe"), "apple-medley": raw("S28_green-or-red"),
  tomato: raw("F03_tomatoes"), cucumber: raw("F32_cucumbers"), carrot: raw("S10_organic-reserve"), potato: gen("potato"),
  onion: raw("F40_onion-garlic"), garlic: raw("F40_onion-garlic"), "red-pepper": gen("red-pepper"), "green-pepper": gen("green-pepper"),
  "yellow-pepper": gen("yellow-pepper"), "pepper-medley": raw("F11_peppers"), eggplant: raw("F18_eggplant"),
  "white-eggplant": gen("white-eggplant"), cauliflower: gen("cauliflower"),
  mint: gen("mint"), basil: gen("basil"), coriander: gen("coriander"), rosemary: gen("rosemary"), dill: gen("dill"),
  // boxes
  "box-hosting": raw("F48_guest-arrival"), "box-premium": raw("C2_05_step4"), "box-family": raw("F49_friday-lunch"),
  "box-seasonal": raw("S01_this-week"), "box-organic": raw("F59_organic-heirloom"),
  // journal + editorial tiles
  "j-hosting-table": raw("X_fb-cover-A"), "j-grading": raw("S35_sorting"), "j-dates": raw("F23_dates"),
  "j-mango": raw("F52_fp-mango"), "j-guests": raw("F50_late-guests"), "j-storing": raw("S07_your-week"),
  "q-arrange": raw("C2_03_step2"),
  "tile-herbs": raw("F15_herbs"), "tile-fruit": raw("C2_04_step3"), "tile-veg": raw("F22_selection"),
  "tile-boxes": raw("F01_hosting-table"), "tile-seasonal": raw("S01_this-week"), "tile-organic": raw("F59_organic-heirloom"),
};
const BANNERS = {
  "door-delivery": raw("F58_delivery"), "home-delivery": raw("S31_delivered-cairo"), "delivery-van": raw("F01_hosting-table"),
  packaging: raw("S35_sorting"), "staff-shirt": raw("F57_cold-storage"), "juice-bottles": raw("F52_fp-mango"),
  "hosting-table": raw("X_fb-cover-A"), "guest-arrival": raw("F48_guest-arrival"), "friday-lunch": raw("F49_friday-lunch"),
};
const HERO = raw("X_fb-cover-B"), HERO_P = raw("F01_hosting-table");

/* Product shots: the produce sits in the lower-middle of these scenes —
   crop in on it so the card shows the fruit, not the room. */
const ZOOM = { raw: 0.6, gen: 0.7 };
const FOCUS = { mango: [0.5, 0.72], orange: [0.5, 0.62], "pepper-medley": [0.55, 0.62], eggplant: [0.62, 0.6], tomato: [0.62, 0.55], carrot: [0.55, 0.6], strawberry: [0.48, 0.66], cucumber: [0.5, 0.7], banana: [0.55, 0.72], lemon: [0.6, 0.66], "red-apple": [0.8, 0.74], "green-apple": [0.4, 0.7], "apple-medley": [0.5, 0.7], onion: [0.45, 0.62], garlic: [0.5, 0.62] };
async function zoomed(src, k) {
  const m = await sharp(src).metadata(), isGen = src.indexOf("_src") > -1 || src.indexOf("_src".replace("_", "")) > -1;
  const z = /[\/]_src[\/]gen/.test(src) ? ZOOM.gen : ZOOM.raw, [fx, fy] = FOCUS[k] || [0.5, 0.66];
  const w = Math.round(m.width * z), h = Math.min(m.height, Math.round(w * 1.25));
  const left = Math.max(0, Math.min(m.width - w, Math.round(fx * m.width - w / 2))), top = Math.max(0, Math.min(m.height - h, Math.round(fy * m.height - h / 2)));
  return sharp(src).extract({ left, top, width: w, height: h }).toBuffer();
}
async function out(src, file, w, h, pos) {
  const img = sharp(src).resize(w, h, { fit: "cover", position: pos || sharp.strategy.attention, kernel: "lanczos3" });
  const buf = await img.toBuffer();
  await sharp(buf).jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(file + ".jpg");
  await sharp(buf).webp({ quality: 80, effort: 5 }).toFile(file + ".webp");
}
(async () => {
  const P = path.join(ROOT, "assets/img/products"), B = path.join(ROOT, "assets/img/banners"), H = path.join(ROOT, "assets/img/hero");
  [P, P + "/sm", B, B + "/sm", H].forEach((d) => fs.mkdirSync(d, { recursive: true }));
  for (const [k, src] of Object.entries(PRODUCTS)) {
    if (!fs.existsSync(src)) { console.log("missing", k, src); continue; }
    const isProduct = !/^(box-|j-|tile-|q-)/.test(k);
    const s2 = isProduct ? await zoomed(src, k) : src;
    await out(s2, path.join(P, k), 800, 1000, isProduct ? "centre" : undefined);
    await out(s2, path.join(P, "sm", k), 432, 540, isProduct ? "centre" : undefined);
  }
  for (const [k, src] of Object.entries(BANNERS)) {
    await out(src, path.join(B, k), 1500, 780);
    await out(src, path.join(B, "sm", k), 540, 281);
  }
  const m = await sharp(HERO).metadata();
  for (const w of [800, 1200, 1800, 2400]) await out(HERO, path.join(H, "hero-" + w), w, Math.round((w * m.height) / m.width), "centre");
  for (const w of [700, 1000]) await out(HERO_P, path.join(H, "hero-portrait-" + w), w, Math.round(w * 1.25), "centre");
  console.log("done", Object.keys(PRODUCTS).length, "products,", Object.keys(BANNERS).length, "banners");
})();
