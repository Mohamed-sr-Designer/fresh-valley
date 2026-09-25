/* =====================================================================
   FRESH VALLEY — bake theme pages
   Pre-renders the default theme (header, announcement bar, sections,
   footer) into the HTML of every theme page, so the first paint needs no
   JavaScript (fast LCP, full content for crawlers and no-JS visitors).
   At runtime sections.js compares the baked data-sig with the live theme
   + catalog; any CMS change re-renders the page, so baking is optional.

   Usage (dev server running, a Chromium started with remote debugging):
     node _build/server.js 5517
     msedge --headless=new --remote-debugging-port=9333 --user-data-dir=<tmp>
     node _build/bake.js [http://localhost:5517] [http://127.0.0.1:9333]
   Requires puppeteer-core (npm i -D puppeteer-core).
   Re-run whenever theme.js defaults, data.js or section markup change.
   ===================================================================== */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const BASE = process.argv[2] || "http://localhost:5517";
const BROWSER = process.argv[3] || "http://127.0.0.1:9333";
const PAGES = [["index", "index.html"], ["hosting", "hosting.html"], ["about", "about.html"], ["contact", "contact.html"], ["journal", "journal.html"], ["policies", "policies.html"], ["terms", "terms.html"]];

(async () => {
  const browser = await puppeteer.connect({ browserURL: BROWSER, defaultViewport: null });
  const ctx = await browser.createBrowserContext(); // clean storage → pure defaults
  for (const [key, file] of PAGES) {
    const page = await ctx.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setRequestInterception(true);
    // no motion while baking — SplitText/marquees would rewrite the DOM
    page.on("request", (r) => (/\/assets\/(vendor\/|js\/motion\.js)/.test(r.url()) ? r.abort() : r.continue()));
    // serve the page without its previously baked markup so we bake from scratch
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    await page.goto(BASE + "/" + file + "?bake=1", { waitUntil: "networkidle0" });
    const out = await page.evaluate((key) => {
      const main = document.querySelector("main[data-fv-page]");
      // runtime-only details that depend on the viewport or listeners
      main.querySelectorAll(".hero__title").forEach((t) => { t.removeAttribute("style"); t.classList.remove("orbs-tight", "orbs-none"); });
      main.querySelectorAll(".tabs__ink").forEach((i) => i.removeAttribute("style"));
      const header = document.getElementById("fv-header"), footer = document.getElementById("fv-footer");
      const ann = document.querySelector(".announce");
      return { sig: window.FVSections.signature(key), main: main.innerHTML.trim(), header: header ? header.innerHTML.trim() : "", footer: footer ? footer.innerHTML.trim() : "", ann: ann ? ann.outerHTML : "" };
    }, key);
    await page.close();
    let html = src;
    // announcement bar (first thing in <body>)
    html = html.replace(/\n?\s*<!--bake:ann-->[\s\S]*?<!--\/bake:ann-->/, "");
    if (out.ann) html = html.replace(/(<body[^>]*>)/, `$1\n  <!--bake:ann-->${out.ann}<!--/bake:ann-->`);
    // header + footer
    html = html.replace(/<div id="fv-header">(?:<!--bake:header-->[\s\S]*?<!--\/bake:header-->)?<\/div>/, `<div id="fv-header"><!--bake:header-->${out.header}<!--/bake:header--></div>`);
    html = html.replace(/<div id="fv-footer">(?:<!--bake:footer-->[\s\S]*?<!--\/bake:footer-->)?<\/div>/, `<div id="fv-footer"><!--bake:footer-->${out.footer}<!--/bake:footer--></div>`);
    // sections
    html = html.replace(/<main id="main" data-fv-page="([a-z]+)"[^>]*>[\s\S]*?<\/main>/, `<main id="main" data-fv-page="$1" data-sig="${out.sig}">\n${out.main}\n  </main>`);
    fs.writeFileSync(path.join(ROOT, file), html);
    console.log("baked", file.padEnd(14), (html.length / 1024).toFixed(0) + " KB", "sig " + out.sig);
  }
  await ctx.close();
  await browser.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
