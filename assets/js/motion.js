/* =====================================================================
   FRESH VALLEY — Motion engine v4
   GSAP 3 + ScrollTrigger + SplitText + Lenis, driven by data attributes:

     data-reveal[="fade|scale|left|right"]   rise / fade in on scroll
     data-stagger                             children rise in sequence
     data-fan                                 children fan in (cards deck)
     data-clip                                media wipes up into its frame
     data-split[="lines|words"]               masked line / word reveal
     data-parallax="10"                       scroll parallax (±10%)
     data-count="1400" data-dec data-suffix   count up once in view
     data-draw                                SVG line-art draws itself
     data-marquee[="right"] data-speed        velocity-reactive marquee
     data-magnetic                            gentle cursor pull
     data-cursor="Drag"                       custom cursor label
     data-strike                              strike-throughs draw in turn
     data-float                               idle float (produce orbs)

   Every effect degrades: no GSAP, reduced motion or the theme-editor
   preview → the page is complete, visible and still.
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

  const M = (W.FVMotion = { ready: false, on: false, lenis: null, velocity: 0, scan, refresh, fly, bump, scrollTo, kill });

  /* ------------------------------------------------------------------ *
   * Global scroll velocity (drives marquees) — works with or without Lenis
   * ------------------------------------------------------------------ */
  let lastY = W.scrollY;
  function sampleVelocity() {
    const y = W.scrollY;
    const raw = M.lenis ? M.lenis.velocity : y - lastY;
    M.velocity += (raw - M.velocity) * 0.25;
    lastY = y;
    requestAnimationFrame(sampleVelocity);
  }

  /* ------------------------------------------------------------------ *
   * Smooth scroll
   * ------------------------------------------------------------------ */
  function setupLenis() {
    if (!W.Lenis || RM || PREVIEW) return;
    const lenis = new W.Lenis({ lerp: 0.105, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    M.lenis = lenis;
    if (HAS_G) {
      lenis.on("scroll", ST.update);
      G.ticker.add((t) => lenis.raf(t * 1000));
      G.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
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
    const hdr = parseFloat(getComputedStyle(html).getPropertyValue("--hdr")) || 84;
    if (M.lenis) M.lenis.scrollTo(target, Object.assign({ offset: -(hdr + 16), duration: 1.4 }, opts || {}));
    else if (target && target.scrollIntoView) target.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
  }

  /* ------------------------------------------------------------------ *
   * Reveals
   * ------------------------------------------------------------------ */
  function reveals(root) {
    let els = q("[data-reveal]", root).filter((el) => once(el, "rv"));
    if (!els.length) return;
    if (!M.on) { els.forEach((el) => el.classList.add("is-in")); return; }
    // children of a staggered / fanned group are played by their group
    const grouped = (el) => el.parentElement && el.parentElement.closest("[data-stagger], [data-fan]");
    els.filter(grouped).forEach((el) => el.classList.add("is-in"));
    els = els.filter((el) => !grouped(el) && !el.classList.contains("is-in"));
    if (!els.length) return;
    ST.batch(els, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => batch.forEach((el, i) => {
        G.to(el, {
          opacity: 1, x: 0, y: 0, scale: 1, duration: 1.15, ease: "expo.out", delay: i * 0.08,
          onComplete: () => { el.classList.add("is-in"); G.set(el, { clearProps: "opacity,transform" }); },
        });
      }),
    });
  }
  function staggers(root) {
    q("[data-stagger], [data-fan]", root).filter((el) => once(el, "sg")).forEach((el) => {
      const kids = Array.from(el.children);
      if (!M.on || !kids.length) { el.classList.add("is-in"); return; }
      const fan = el.hasAttribute("data-fan");
      const mid = (kids.length - 1) / 2;
      G.fromTo(kids,
        fan ? { opacity: 0, y: 120, rotate: (i) => (i - mid) * 5, x: (i) => (mid - i) * 40 } : { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, x: 0, rotate: 0, duration: fan ? 1.3 : 1.05, ease: "expo.out", stagger: fan ? 0.1 : 0.07,
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
          onComplete: () => { el.classList.add("is-in"); G.set(kids, { clearProps: "opacity,transform" }); },
        });
    });
  }
  function clips(root) {
    q("[data-clip]", root).filter((el) => once(el, "cl")).forEach((el) => {
      if (!M.on) { el.classList.add("is-in"); return; }
      const img = el.querySelector("img");
      const st = { trigger: el, start: "top 88%", once: true };
      G.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", scrollTrigger: st,
        onComplete: () => { el.classList.add("is-in"); G.set(el, { clearProps: "clipPath" }); },
      });
      if (img && !img.hasAttribute("data-parallax")) {
        G.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: st, onComplete: () => G.set(img, { clearProps: "transform" }) });
      }
    });
  }
  function splits(root) {
    q("[data-split]", root).filter((el) => once(el, "sp")).forEach((el) => {
      if (!M.on || !SPLIT) { el.classList.add("split-ready"); return; }
      const words = el.dataset.split === "words";
      try {
        SPLIT.create(el, {
          type: words ? "words,lines" : "lines",
          mask: words ? "words" : "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            el.classList.add("split-ready");
            return G.from(words ? self.words : self.lines, {
              yPercent: 118, rotate: words ? 0 : 2.5, duration: 1.25, ease: "expo.out", stagger: words ? 0.035 : 0.1,
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
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
      const amt = parseFloat(el.dataset.parallax) || 10;
      G.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: el.closest("[data-parallax-root]") || el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
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
      G.to(o, { v: to, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true }, onUpdate: () => { el.textContent = fmt(o.v); } });
    });
  }
  function draws(root) {
    q("[data-draw]", root).filter((el) => once(el, "dr")).forEach((el) => {
      if (!M.on) { el.classList.add("is-in"); return; }
      const parts = q("path, line, polyline, circle, ellipse", el);
      parts.forEach((p) => { p.setAttribute("pathLength", "1"); p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = "1"; });
      el.classList.add("is-in");
      G.to(parts, {
        strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut", stagger: { each: 0.05, from: "start" },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
  }
  function strikes(root) {
    q("[data-strike]", root).filter((el) => once(el, "sk")).forEach((el) => {
      const items = q(".sl__t, .story__struck p, [data-strike-item]", el);
      if (!M.on) { items.forEach((i) => i.style.setProperty("--strike", 1)); return; }
      G.to(items, { "--strike": 1, duration: 0.75, ease: "power2.inOut", stagger: 0.28, scrollTrigger: { trigger: el, start: "top 72%", once: true } });
    });
  }
  function floats(root) {
    if (!M.on) return;
    q("[data-float]", root).filter((el) => once(el, "fl")).forEach((el, i) => {
      const a = parseFloat(el.dataset.float) || 12;
      G.to(el, { y: -a, rotate: i % 2 ? 4 : -4, duration: 2.6 + (i % 3) * 0.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.3 });
    });
  }

  /* ------------------------------------------------------------------ *
   * Marquee — rAF, reacts to scroll speed + direction, pauses offscreen
   * ------------------------------------------------------------------ */
  function marquees(root) {
    q("[data-marquee]", root).filter((el) => once(el, "mq")).forEach((el) => {
      const track = el.querySelector(".marquee__track") || el.firstElementChild;
      const unit = track && track.firstElementChild;
      if (!unit) return;
      const fill = () => {
        let guard = 0;
        while (track.scrollWidth < el.offsetWidth * 2 + unit.offsetWidth && guard++ < 14) {
          const c = unit.cloneNode(true);
          c.setAttribute("aria-hidden", "true");
          q("a, button", c).forEach((a) => a.setAttribute("tabindex", "-1"));
          track.appendChild(c);
        }
      };
      fill();
      if (RM) return;
      let w = unit.getBoundingClientRect().width;
      const base = parseFloat(el.dataset.speed || "1");
      const baseDir = el.dataset.marquee === "right" ? 1 : -1;
      let dir = baseDir, x = baseDir > 0 ? -w : 0, mul = 1, visible = true, hover = false, last = performance.now();
      if ("IntersectionObserver" in W) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);
      if (el.hasAttribute("data-pause")) {
        el.addEventListener("mouseenter", () => { hover = true; });
        el.addEventListener("mouseleave", () => { hover = false; });
        el.addEventListener("focusin", () => { hover = true; });
        el.addEventListener("focusout", () => { hover = false; });
      }
      if ("ResizeObserver" in W) new ResizeObserver(() => { w = unit.getBoundingClientRect().width; fill(); }).observe(el);
      const tick = (now) => {
        const dt = Math.min(64, now - last); last = now;
        if (visible && w > 0) {
          const v = M.velocity;
          if (!PREVIEW) { if (v > 0.6) dir = baseDir; else if (v < -0.6) dir = -baseDir; }
          const target = hover ? 0 : 1 + Math.min(Math.abs(v) / 6, 6);
          mul += (target - mul) * 0.07;
          x += dir * base * mul * dt * 0.045;
          if (x <= -w) x += w; else if (x > 0) x -= w;
          track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ------------------------------------------------------------------ *
   * Rotating word (hero)
   * ------------------------------------------------------------------ */
  function rotators(root) {
    q("[data-rotate]", root).filter((el) => once(el, "ro")).forEach((el) => {
      const words = (el.dataset.rotate || "").split("|").map((s) => s.trim()).filter(Boolean);
      if (words.length < 2 || RM) return;
      let i = 0;
      const cur = () => el.querySelector(".rot__w");
      const measure = (txt) => {
        const s = document.createElement("span");
        s.className = "rot__w"; s.textContent = txt;
        s.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
        el.appendChild(s); const wd = s.getBoundingClientRect().width; s.remove(); return wd;
      };
      el.style.width = cur().getBoundingClientRect().width + "px";
      setInterval(() => {
        if (document.hidden) return;
        i = (i + 1) % words.length;
        const old = cur();
        const nw = document.createElement("span");
        nw.className = "rot__w"; nw.textContent = words[i];
        nw.style.cssText = "position:absolute;left:0;top:0";
        if (HAS_G) G.set(nw, { yPercent: 110 });
        el.appendChild(nw);
        el.style.width = measure(words[i]) + "px";
        const done = () => { old.remove(); nw.style.cssText = ""; };
        if (HAS_G) {
          G.to(old, { yPercent: -110, duration: 0.8, ease: "expo.inOut" });
          G.to(nw, { yPercent: 0, duration: 0.8, ease: "expo.inOut", onComplete: done });
        } else { done(); }
      }, 2600);
    });
  }

  /* ------------------------------------------------------------------ *
   * Hero — intro timeline, media expands to full bleed, orbs follow pointer
   * ------------------------------------------------------------------ */
  function hero() {
    const h = document.querySelector(".s-hero");
    if (!h || !once(h, "hero")) return;
    // The intro itself is CSS (styles.css › "Hero intro") so it starts on the
    // first frame; here we only add the scroll- and pointer-linked layers.
    h.classList.add("is-in");
    if (!M.on) return;

    const media = h.querySelector(".hero__media");
    if (media) {
      const gut = () => parseFloat(getComputedStyle(media).getPropertyValue("--gut")) || Math.max(18, Math.min(56, W.innerWidth * 0.042));
      G.fromTo(media, { "--clip-x": () => gut() + "px", "--clip-r": "44px" }, {
        "--clip-x": "0px", "--clip-r": "0px", ease: "none",
        scrollTrigger: { trigger: media, start: "top 78%", end: "top 12%", scrub: 0.6, invalidateOnRefresh: true },
      });
      const img = media.querySelector("img");
      if (img) G.to(img, { yPercent: 9, ease: "none", scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true } });
    }
    const orbs = h.querySelector(".hero__orbs");
    if (orbs) G.to(orbs, { yPercent: -35, ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true } });
    if (FINE) {
      const items = q(".orb", h).map((o) => ({ d: parseFloat(o.dataset.depth || "0.5"), x: G.quickTo(o, "x", { duration: 1.2, ease: "power3" }), y: G.quickTo(o, "y", { duration: 1.2, ease: "power3" }) }));
      h.addEventListener("pointermove", (e) => {
        const cx = e.clientX / W.innerWidth - 0.5, cy = e.clientY / W.innerHeight - 0.5;
        items.forEach((o) => { o.x(cx * 60 * o.d); o.y(cy * 40 * o.d); });
      }, { passive: true });
    }
  }

  /* ------------------------------------------------------------------ *
   * Story — pinned, stacking ritual cards (desktop)
   * ------------------------------------------------------------------ */
  function stories() {
    q("[data-story]").filter((el) => once(el, "st")).forEach((sec) => {
      const steps = q(".step", sec);
      const bars = q(".story__progress i", sec);
      if (!M.on || steps.length < 2) return;
      const mm = G.matchMedia();
      mm.add("(min-width: 961px) and (min-height: 640px)", () => {
        const wrap = sec.querySelector(".story");
        wrap.classList.add("story--pin");
        sec.classList.add("is-pin");
        q(".step", sec).forEach((s) => s.classList.add("is-in"));
        const tl = G.timeline({
          scrollTrigger: {
            trigger: sec, start: "top top", end: () => "+=" + (steps.length - 1) * W.innerHeight * 0.85,
            pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
          },
        });
        steps.forEach((s, i) => {
          if (i === 0) return;
          tl.fromTo(s, { yPercent: 108, rotate: 4 }, { yPercent: 0, rotate: 0, ease: "none", duration: 1 }, i - 1)
            .to(steps[i - 1], { scale: 0.9, yPercent: -4, filter: "brightness(.55)", ease: "none", duration: 1 }, i - 1);
          if (bars[i]) tl.fromTo(bars[i], { "--p": 0 }, { "--p": 1, ease: "none", duration: 1 }, i - 1);
        });
        if (bars[0]) G.set(bars[0], { "--p": 1 });
        return () => { wrap.classList.remove("story--pin"); sec.classList.remove("is-pin"); G.set(steps, { clearProps: "all" }); };
      });
    });
  }

  /* Horizontal scroll track — pinned on desktop, native swipe on touch */
  function hscrolls() {
    q("[data-hscroll]").filter((el) => once(el, "hs")).forEach((sec) => {
      const vp = sec.querySelector(".hs__viewport"), track = sec.querySelector(".hs__track");
      if (!vp || !track) return;
      if (!M.on) { vp.style.overflowX = "auto"; return; }
      const mm = G.matchMedia();
      mm.add("(min-width: 961px) and (min-height: 600px)", () => {
        const dist = () => Math.max(0, track.scrollWidth - W.innerWidth);
        G.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 },
        });
        q(".hs__card", sec).forEach((c, i) => {
          const im = c.querySelector("img");
          if (im) G.fromTo(im, { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), scrub: true } });
        });
        return () => G.set(track, { clearProps: "transform" });
      });
      mm.add("(max-width: 960px), (max-height: 599px)", () => { vp.style.overflowX = "auto"; return () => { vp.style.overflowX = ""; }; });
    });
  }

  /* ------------------------------------------------------------------ *
   * Rails — mouse drag with inertia + snap, progress bar
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
        const proj = Math.max(0, Math.min(max, rail.scrollLeft - v * 380));
        let best = proj, bd = Infinity;
        kids.forEach((k) => {
          const pos = k.getBoundingClientRect().left - rl + rail.scrollLeft;
          const d = Math.abs(pos - proj);
          if (d < bd) { bd = d; best = Math.min(max, pos); }
        });
        const end = () => setTimeout(() => rail.classList.remove("is-dragging"), 30);
        if (HAS_G) G.to(rail, { scrollLeft: best, duration: 1, ease: "expo.out", onComplete: end });
        else { rail.scrollLeft = best; end(); }
      });
      rail.addEventListener("click", (e) => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
      rail.addEventListener("dragstart", (e) => e.preventDefault());
    });
  }

  /* ------------------------------------------------------------------ *
   * Pointer niceties — custom cursor + magnetic
   * ------------------------------------------------------------------ */
  function cursor() {
    if (!FINE || RM || PREVIEW || !HAS_G || document.querySelector(".cursor")) return;
    html.classList.add("has-cursor");
    const c = document.createElement("div");
    c.className = "cursor is-hidden";
    c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div>';
    document.body.appendChild(c);
    const ring = c.querySelector(".cursor__ring"), dot = c.querySelector(".cursor__dot"), label = c.querySelector(".cursor__label");
    const rx = G.quickTo(ring, "x", { duration: 0.5, ease: "power3" }), ry = G.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    const DARK = ".band--dark, .ftr, .marquee--brand, .s-quote, .cta-block:not(.cta-block--olive), .ctile, .menu, .banner, .season, .moment, .step, .hero__media, .compare__col--new, .band--charcoal";
    let lastT = null;
    W.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      dot.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      rx(e.clientX); ry(e.clientY);
      c.classList.remove("is-hidden");
      const t = e.target;
      if (t === lastT || !t.closest) return;
      lastT = t;
      const lab = t.closest("[data-cursor]");
      if (lab) { label.textContent = lab.dataset.cursor; c.classList.add("is-label"); c.classList.remove("is-link"); }
      else {
        c.classList.remove("is-label");
        c.classList.toggle("is-link", !!t.closest("a, button, [role='button'], label, select, summary, input[type='checkbox'], input[type='radio']"));
      }
      c.classList.toggle("on-dark", !!t.closest(DARK));
      c.classList.toggle("is-text", !!t.closest("input:not([type='checkbox']):not([type='radio']), textarea, select, [contenteditable]"));
    }, { passive: true });
    document.addEventListener("mouseleave", () => c.classList.add("is-hidden"));
    W.addEventListener("blur", () => c.classList.add("is-hidden"));
    document.addEventListener("pointerdown", () => c.classList.add("is-down"));
    document.addEventListener("pointerup", () => c.classList.remove("is-down"));
  }
  function magnetic(root) {
    if (!FINE || RM || !HAS_G) return;
    q("[data-magnetic]", root).filter((el) => once(el, "mg")).forEach((el) => {
      const s = parseFloat(el.dataset.magnetic) || 0.3;
      const xt = G.quickTo(el, "x", { duration: 0.6, ease: "power3" }), yt = G.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xt((e.clientX - (r.left + r.width / 2)) * s); yt((e.clientY - (r.top + r.height / 2)) * s);
      });
      el.addEventListener("pointerleave", () => { G.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, .45)" }); });
    });
  }

  /* ------------------------------------------------------------------ *
   * Commerce moments — fly-to-cart + badge bump
   * ------------------------------------------------------------------ */
  function fly(fromEl, src) {
    if (RM || !fromEl || !HAS_G) return;
    const targets = [document.getElementById("cartBtn"), document.getElementById("tabCart")].filter((t) => t && t.offsetParent !== null);
    const to = targets[0];
    if (!to) return;
    const card = fromEl.closest(".pcard, .bcard, .pdp, [data-fly-root]") || fromEl;
    const img = card.querySelector("img");
    const a = (img || fromEl).getBoundingClientRect(), b = to.getBoundingClientRect();
    const size = 76;
    const g = document.createElement("div");
    g.className = "fly";
    g.style.cssText = "width:" + size + "px;height:" + size + "px;left:0;top:0";
    const url = src || (img && (img.currentSrc || img.src));
    g.innerHTML = url ? '<img alt="" src="' + url + '">' : "";
    if (!url) g.style.background = "var(--olive)";
    document.body.appendChild(g);
    const sx = a.left + a.width / 2 - size / 2, sy = a.top + a.height / 2 - size / 2;
    const ex = b.left + b.width / 2 - size / 2, ey = b.top + b.height / 2 - size / 2;
    G.set(g, { x: sx, y: sy, scale: 0.4, opacity: 0 });
    const tl = G.timeline({ onComplete: () => { g.remove(); bump(to.querySelector(".badge-count") || to); } });
    tl.to(g, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)" })
      .to(g, { x: ex, duration: 0.85, ease: "power2.inOut" }, 0.2)
      .to(g, { y: Math.min(sy, ey) - 120, duration: 0.4, ease: "power2.out" }, 0.2)
      .to(g, { y: ey, duration: 0.45, ease: "power2.in" }, 0.6)
      .to(g, { scale: 0.2, opacity: 0.2, duration: 0.3, ease: "power2.in" }, 0.8);
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
    parallax(root); counts(root); draws(root); strikes(root); floats(root);
    marquees(root); rotators(root); rails(root); magnetic(root);
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
    requestAnimationFrame(sampleVelocity);
    hero();
    stories();
    hscrolls();
    scan(document);
    cursor();
    M.ready = true;
    if (HAS_G) {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      W.addEventListener("load", refresh);
    }
    document.dispatchEvent(new CustomEvent("fv:motion"));
  }
  // Deferred scripts run before DOMContentLoaded — wait for app.js to mount
  // the shell (header, footer, overlays) so every element gets its motion.
  if (W.FV && !W.FV.booted) document.addEventListener("fv:ready", init, { once: true });
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
