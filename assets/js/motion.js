/* =====================================================================
   FRESH VALLEY — Motion engine v5 · "Field & Herb"
   Calm by design: slow, soft reveals and smooth scrolling — nothing that
   bounces, spins or chases the cursor. GSAP 3 + ScrollTrigger + SplitText
   + Lenis, driven by data attributes:

     data-reveal[="fade"]          rise / fade in on scroll
     data-stagger                  children rise in sequence
     data-clip                     media unveils upward into its frame
     data-split                    masked line reveal (headings)
     data-parallax="6"             gentle scroll parallax (±6%)
     data-count="24" data-dec data-suffix   count up once in view
     data-strike                   strike-throughs draw in turn

   Every effect degrades: no GSAP, reduced motion or the theme-editor
   preview → the page is complete, visible and still.
   The first-visit loading screen ("first light") lives in app.js so it
   always lifts, even if this file never loads.
   ===================================================================== */
(function () {
  "use strict";
  const html = document.documentElement;
  const W = window;
  const RM = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const PREVIEW = /[?&]fv_preview=1/.test(location.search);
  const G = W.gsap, ST = W.ScrollTrigger, SPLIT = W.SplitText;
  const HAS_G = !!(G && ST);
  const q = (s, r) => Array.from((r || document).querySelectorAll(s));
  const once = (el, k) => { if (el.hasAttribute("data-m-" + k)) return false; el.setAttribute("data-m-" + k, ""); return true; };
  const EASE = "power3.out";

  const M = (W.FVMotion = { ready: false, on: false, lenis: null, velocity: 0, scan, refresh, fly, bump, scrollTo, kill });

  /* ------------------------------------------------------------------ *
   * Smooth scroll — a touch slower than native, never floaty
   * ------------------------------------------------------------------ */
  function setupLenis() {
    if (!W.Lenis || RM || PREVIEW) return;
    const lenis = new W.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.2 });
    M.lenis = lenis;
    if (HAS_G) {
      lenis.on("scroll", ST.update);
      G.ticker.add((t) => lenis.raf(t * 1000));
      G.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    if (html.classList.contains("is-loading")) lenis.stop();
    document.addEventListener("fv:loaded", () => lenis.start(), { once: true });
    // in-page anchors glide instead of jumping (skip link stays native)
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains("skip-link")) return;
      const id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      let t; try { t = document.querySelector(id); } catch (_) { return; }
      if (!t) return;
      e.preventDefault();
      scrollTo(t);
      history.replaceState(null, "", id);
    });
  }
  function scrollTo(target, opts) {
    const hdr = parseFloat(getComputedStyle(html).getPropertyValue("--hdr")) || 80;
    if (M.lenis) M.lenis.scrollTo(target, Object.assign({ offset: -(hdr + 24), duration: 1.6 }, opts || {}));
    else if (target && target.scrollIntoView) target.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
  }

  /* ------------------------------------------------------------------ *
   * Reveals
   * ------------------------------------------------------------------ */
  function reveals(root) {
    let els = q("[data-reveal]", root).filter((el) => once(el, "rv"));
    if (!els.length) return;
    if (!M.on) { els.forEach((el) => el.classList.add("is-in")); return; }
    const grouped = (el) => el.parentElement && el.parentElement.closest("[data-stagger]");
    els.filter(grouped).forEach((el) => el.classList.add("is-in"));
    els = els.filter((el) => !grouped(el) && !el.classList.contains("is-in"));
    if (!els.length) return;
    ST.batch(els, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => batch.forEach((el, i) => {
        G.to(el, {
          opacity: 1, y: 0, duration: 1.4, ease: EASE, delay: i * 0.09,
          onComplete: () => { el.classList.add("is-in"); G.set(el, { clearProps: "opacity,transform" }); },
        });
      }),
    });
  }
  function staggers(root) {
    q("[data-stagger]", root).filter((el) => once(el, "sg")).forEach((el) => {
      const kids = Array.from(el.children);
      if (!M.on || !kids.length) { el.classList.add("is-in"); return; }
      G.fromTo(kids, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 1.3, ease: EASE, stagger: 0.09,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onComplete: () => { el.classList.add("is-in"); G.set(kids, { clearProps: "opacity,transform" }); },
      });
    });
  }
  function clips(root) {
    q("[data-clip]", root).filter((el) => once(el, "cl")).forEach((el) => {
      if (!M.on) { el.classList.add("is-in"); return; }
      const img = el.querySelector("img");
      const st = { trigger: el, start: "top 90%", once: true };
      G.fromTo(el, { clipPath: "inset(12% 0% 0% 0%)", opacity: 0 }, {
        clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.8, ease: "power2.out", scrollTrigger: st,
        onComplete: () => { el.classList.add("is-in"); G.set(el, { clearProps: "clipPath,opacity" }); },
      });
      if (img && !img.hasAttribute("data-parallax")) {
        G.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 2.4, ease: "power2.out", scrollTrigger: st, onComplete: () => G.set(img, { clearProps: "transform" }) });
      }
    });
  }
  function splits(root) {
    q("[data-split]", root).filter((el) => once(el, "sp")).forEach((el) => {
      if (!M.on || !SPLIT) { el.classList.add("split-ready"); return; }
      try {
        SPLIT.create(el, {
          type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true,
          onSplit(self) {
            el.classList.add("split-ready");
            return G.from(self.lines, {
              yPercent: 105, opacity: 0, duration: 1.5, ease: EASE, stagger: 0.1,
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            });
          },
        });
      } catch (_) { el.classList.add("split-ready"); }
    });
  }

  /* ------------------------------------------------------------------ *
   * Scroll-linked
   * ------------------------------------------------------------------ */
  function parallax(root) {
    if (!M.on) return;
    q("[data-parallax]", root).filter((el) => once(el, "px")).forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 6;
      G.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: el.closest("[data-parallax-root]") || el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });
  }
  function counts(root) {
    q("[data-count]", root).filter((el) => once(el, "ct")).forEach((el) => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
      const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
      const fmt = (v) => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + suf;
      if (!M.on || isNaN(to)) { if (!isNaN(to)) el.textContent = fmt(to); return; }
      const o = { v: 0 };
      el.textContent = fmt(0);
      G.to(o, { v: to, duration: 2.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%", once: true }, onUpdate: () => { el.textContent = fmt(o.v); } });
    });
  }
  function strikes(root) {
    q("[data-strike]", root).filter((el) => once(el, "sk")).forEach((el) => {
      const items = q(".sl__t, .story__struck p, [data-strike-item]", el);
      if (!M.on) { items.forEach((i) => i.style.setProperty("--strike", 1)); return; }
      G.to(items, { "--strike": 1, duration: 1, ease: "power2.inOut", stagger: 0.3, scrollTrigger: { trigger: el, start: "top 75%", once: true } });
    });
  }

  /* ------------------------------------------------------------------ *
   * Hero — the image drifts a little slower than the page
   * ------------------------------------------------------------------ */
  function hero() {
    const h = document.querySelector(".s-hero");
    if (!h || !once(h, "hero")) return;
    h.classList.add("is-in");
    if (!M.on) return;
    const img = h.querySelector(".hero__media img");
    if (img) G.fromTo(img, { yPercent: 0 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: 0.6 } });
  }

  /* ------------------------------------------------------------------ *
   * Rails — mouse drag with gentle inertia + snap, progress line
   * ------------------------------------------------------------------ */
  function rails(root) {
    q(".rail", root).filter((el) => once(el, "rl")).forEach((rail) => {
      const prog = rail.parentElement && rail.parentElement.querySelector(".rail-progress i");
      const upd = () => {
        if (!prog) return;
        const max = rail.scrollWidth - rail.clientWidth;
        const vis = rail.clientWidth / Math.max(1, rail.scrollWidth);
        prog.style.width = Math.max(12, vis * 100) + "%";
        prog.style.transform = "translateX(" + (max > 0 ? (rail.scrollLeft / max) * ((1 / Math.max(vis, 0.12)) - 1) * 100 : 0) + "%)";
      };
      rail.addEventListener("scroll", upd, { passive: true });
      W.addEventListener("resize", upd);
      upd();
      if (!FINE) return;
      let down = false, sx = 0, sl = 0, moved = 0, lx = 0, lt = 0, v = 0;
      rail.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true; sx = lx = e.clientX; sl = rail.scrollLeft; moved = 0; v = 0; lt = performance.now();
        if (HAS_G) G.killTweensOf(rail);
      });
      W.addEventListener("pointermove", (e) => {
        if (!down) return;
        const dx = e.clientX - sx;
        moved = Math.max(moved, Math.abs(dx));
        if (moved > 5) rail.classList.add("is-dragging");
        rail.scrollLeft = sl - dx;
        const now = performance.now();
        v = (e.clientX - lx) / Math.max(1, now - lt); lx = e.clientX; lt = now;
      }, { passive: true });
      W.addEventListener("pointerup", () => {
        if (!down) return;
        down = false;
        if (moved <= 5) { rail.classList.remove("is-dragging"); return; }
        const kids = Array.from(rail.children);
        const rl = rail.getBoundingClientRect().left + parseFloat(getComputedStyle(rail).paddingLeft || 0);
        const max = rail.scrollWidth - rail.clientWidth;
        const proj = Math.max(0, Math.min(max, rail.scrollLeft - v * 320));
        let best = proj, bd = Infinity;
        kids.forEach((k) => {
          const pos = k.getBoundingClientRect().left - rl + rail.scrollLeft;
          const d = Math.abs(pos - proj);
          if (d < bd) { bd = d; best = Math.min(max, pos); }
        });
        const end = () => setTimeout(() => rail.classList.remove("is-dragging"), 30);
        if (HAS_G) G.to(rail, { scrollLeft: best, duration: 1.1, ease: EASE, onComplete: end });
        else { rail.scrollLeft = best; end(); }
      });
      rail.addEventListener("click", (e) => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
      rail.addEventListener("dragstart", (e) => e.preventDefault());
    });
  }

  /* ------------------------------------------------------------------ *
   * Commerce moments — a soft fly-to-basket + badge pulse
   * ------------------------------------------------------------------ */
  function fly(fromEl, src) {
    if (RM || !fromEl || !HAS_G) return;
    const to = document.getElementById("cartBtn");
    if (!to || to.offsetParent === null) return;
    const card = fromEl.closest(".pcard, .bcard, .pdp, [data-fly-root]") || fromEl;
    const img = card.querySelector("img");
    const a = (img || fromEl).getBoundingClientRect(), b = to.getBoundingClientRect();
    const size = 64;
    const g = document.createElement("div");
    g.className = "fly";
    g.style.cssText = "width:" + size + "px;height:" + size + "px;left:0;top:0";
    const url = src || (img && (img.currentSrc || img.src));
    g.innerHTML = url ? '<img alt="" src="' + url + '">' : "";
    if (!url) g.style.background = "var(--sage-lt)";
    document.body.appendChild(g);
    const sx = a.left + a.width / 2 - size / 2, sy = a.top + a.height / 2 - size / 2;
    const ex = b.left + b.width / 2 - size / 2, ey = b.top + b.height / 2 - size / 2;
    G.set(g, { x: sx, y: sy, scale: 0.6, opacity: 0 });
    G.timeline({ onComplete: () => { g.remove(); bump(to.querySelector(".badge-count") || to); } })
      .to(g, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" })
      .to(g, { x: ex, y: ey, scale: 0.25, opacity: 0.4, duration: 0.9, ease: "power2.inOut" }, 0.2);
  }
  function bump(el) {
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  /* ------------------------------------------------------------------ *
   * Scan / refresh / kill — for content rendered after boot
   * ------------------------------------------------------------------ */
  function scan(root) {
    root = root || document;
    reveals(root); staggers(root); clips(root); splits(root);
    parallax(root); counts(root); strikes(root); rails(root);
    if (M.ready && HAS_G) refresh();
  }
  let rT = null;
  function refresh() {
    if (!HAS_G) return;
    clearTimeout(rT);
    rT = setTimeout(() => ST.refresh(), 120);
  }
  function kill() {
    if (!HAS_G) return;
    ST.getAll().forEach((st) => { const t = st.trigger; if (t && !document.contains(t)) st.kill(); });
  }

  /* ------------------------------------------------------------------ *
   * Boot — after app.js has mounted the shell and pages have rendered
   * ------------------------------------------------------------------ */
  function init() {
    if (M.ready) return;
    if (HAS_G) { G.registerPlugin(ST); if (SPLIT) G.registerPlugin(SPLIT); }
    M.on = HAS_G && !RM && !PREVIEW && html.classList.contains("m-on");
    if (!M.on) html.classList.remove("m-on");
    if (HAS_G) G.defaults({ overwrite: "auto" });
    setupLenis();
    // under the first-visit loading screen, nothing plays until it lifts
    const go = () => {
      hero();
      M.ready = true;
      scan(document);
      if (HAS_G) {
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
        W.addEventListener("load", refresh);
        document.addEventListener("fv:loaded", refresh);
      }
      document.dispatchEvent(new CustomEvent("fv:motion"));
    };
    if (html.classList.contains("is-loading") && !html.classList.contains("is-lifting")) document.addEventListener("fv:lifting", go, { once: true });
    else go();
  }
  if (W.FV && !W.FV.booted) document.addEventListener("fv:ready", init, { once: true });
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
