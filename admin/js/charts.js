/* =====================================================================
   FRESH VALLEY Admin — SVG charts (no libraries)
   area (smooth line + gradient + dashed previous period + hover tip),
   spark (KPI sparkline), donut. Usage: C.slot(type, cfg) → markup,
   then C.mount(scope) draws every slot; redraws on resize.
   ===================================================================== */
window.FVCharts = (function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const reg = {}; let seq = 0;
  const PALETTE = ["#19291C", "#AE9D57", "#8A8E57", "#7A2B21", "#2D4630", "#CFC287", "#5C574F"];
  const el = (tag, a) => { const n = document.createElementNS(NS, tag); Object.keys(a || {}).forEach((k) => n.setAttribute(k, a[k])); return n; };
  const short = (v) => Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(1).replace(/\.0$/, "") + "k" : String(Math.round(v));
  function slot(type, cfg, cls) { const id = "ch" + (++seq); reg[id] = { type, cfg }; return `<div class="ch ch--${type}${cls ? " " + cls : ""}" data-ch="${id}"></div>`; }
  // Catmull-Rom → Bézier, clamped so it never overshoots much
  function smooth(pts) {
    if (!pts.length) return "";
    if (pts.length < 3) return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
    let d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, k = 0.18;
      const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k], c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
      const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
      c1[1] = Math.max(lo - 6, Math.min(hi + 6, c1[1])); c2[1] = Math.max(lo - 6, Math.min(hi + 6, c2[1]));
      d += "C" + [c1, c2, p2].map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(",");
    }
    return d;
  }
  function nice(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
  function animate(path, ms, delay) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try { const len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len; path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${ms || 1100}ms cubic-bezier(.2,.7,.2,1) ${delay || 0}ms`; requestAnimationFrame(() => { path.style.strokeDashoffset = 0; }); } catch (_) {}
  }
  /* cfg: { values, prev?, labels, h, fmt(v), fmtX(t), fmtTip(t), color, names:[current, previous] } */
  function area(host, cfg) {
    const w = Math.max(280, host.clientWidth), h = cfg.h || 260;
    const pad = { t: 14, b: 30, s: 46, e: 12 };
    const vals = cfg.values || [], prev = cfg.prev || null, n = vals.length;
    const max = nice(Math.max.apply(null, vals.concat(prev || []).concat([0])) * 1.08);
    const x0 = pad.s, x1 = w - pad.e;
    const X = (i) => n < 2 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / (n - 1);
    const Y = (v) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
    const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "ch__svg", role: "img", "aria-label": cfg.label || "Chart" });
    const gid = "g" + Math.random().toString(36).slice(2, 7), color = cfg.color || PALETTE[0];
    const defs = el("defs"), lg = el("linearGradient", { id: gid, x1: 0, x2: 0, y1: 0, y2: 1 });
    lg.appendChild(el("stop", { offset: "0", "stop-color": color, "stop-opacity": ".22" })); lg.appendChild(el("stop", { offset: "1", "stop-color": color, "stop-opacity": "0" }));
    defs.appendChild(lg); svg.appendChild(defs);
    for (let g = 0; g <= 4; g++) {
      const v = max * g / 4, y = Y(v);
      svg.appendChild(el("line", { x1: x0, x2: x1, y1: y, y2: y, class: "ch__grid" + (g ? "" : " is-base") }));
      const t = el("text", { x: 4, y: y + 4, class: "ch__ax" }); t.textContent = (cfg.fmtAxis || short)(v); svg.appendChild(t);
    }
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 90))));
    (cfg.labels || []).forEach((lb, i) => { if (i % every && i !== n - 1) return; const t = el("text", { x: X(i), y: h - 8, class: "ch__ax", "text-anchor": "middle" }); t.textContent = (cfg.fmtX || String)(lb); svg.appendChild(t); });
    if (prev && prev.length) svg.appendChild(el("path", { d: smooth(prev.map((v, i) => [X(i), Y(v)])), class: "ch__prev" }));
    const pts = vals.map((v, i) => [X(i), Y(v)]), d = smooth(pts);
    if (pts.length) {
      svg.appendChild(el("path", { d: d + `L${pts[pts.length - 1][0].toFixed(1)} ${Y(0)}L${pts[0][0].toFixed(1)} ${Y(0)}Z`, fill: `url(#${gid})` }));
      const line = el("path", { d, class: "ch__line", stroke: color }); svg.appendChild(line); animate(line, 1300);
    }
    const cross = el("line", { y1: pad.t, y2: h - pad.b, class: "ch__cross" }), dot = el("circle", { r: 5, class: "ch__dot", fill: color }), dotP = el("circle", { r: 4, class: "ch__dot ch__dot--p" });
    [cross, dotP, dot].forEach((x) => { x.style.opacity = 0; svg.appendChild(x); });
    host.innerHTML = ""; host.appendChild(svg);
    const tip = document.createElement("div"); tip.className = "ch__tip"; host.appendChild(tip);
    const hit = el("rect", { x: 0, y: 0, width: w, height: h, fill: "transparent" }); svg.appendChild(hit);
    const show = (i) => {
      const x = X(i); cross.setAttribute("x1", x); cross.setAttribute("x2", x); dot.setAttribute("cx", x); dot.setAttribute("cy", Y(vals[i]));
      cross.style.opacity = 1; dot.style.opacity = 1;
      if (prev && prev[i] != null) { dotP.setAttribute("cx", x); dotP.setAttribute("cy", Y(prev[i])); dotP.style.opacity = 1; }
      const f = cfg.fmt || short, nm = cfg.names || [];
      tip.innerHTML = `<b>${(cfg.fmtTip || cfg.fmtX || String)(cfg.labels[i])}</b><span><i style="background:${color}"></i>${nm[0] ? nm[0] + ": " : ""}<strong>${f(vals[i])}</strong></span>${prev && prev[i] != null ? `<span class="is-p"><i></i>${nm[1] ? nm[1] + ": " : ""}${f(prev[i])}</span>` : ""}`;
      tip.classList.add("on");
      const tw = tip.offsetWidth; tip.style.left = Math.max(4, Math.min(w - tw - 4, x - tw / 2)) + "px"; tip.style.top = Math.max(0, Y(vals[i]) - tip.offsetHeight - 14) + "px";
    };
    const hide = () => { [cross, dot, dotP].forEach((z) => { z.style.opacity = 0; }); tip.classList.remove("on"); };
    const at = (e) => { const r = svg.getBoundingClientRect(), px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; if (n < 2) return 0; return Math.max(0, Math.min(n - 1, Math.round((px - x0) / (x1 - x0) * (n - 1)))); };
    hit.addEventListener("mousemove", (e) => show(at(e)));
    hit.addEventListener("touchstart", (e) => show(at(e)), { passive: true });
    hit.addEventListener("mouseleave", hide);
  }
  function spark(host, cfg) {
    const w = Math.max(60, host.clientWidth), h = cfg.h || 38, vals = cfg.values || [], n = vals.length;
    const max = Math.max.apply(null, vals.concat([1])), X = (i) => n < 2 ? w / 2 : 2 + (w - 4) * i / (n - 1), Y = (v) => 3 + (h - 6) * (1 - v / max);
    const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "ch__svg", "aria-hidden": "true" });
    const pts = vals.map((v, i) => [X(i), Y(v)]), d = smooth(pts), color = cfg.color || PALETTE[1], gid = "s" + Math.random().toString(36).slice(2, 7);
    const defs = el("defs"), lg = el("linearGradient", { id: gid, x1: 0, x2: 0, y1: 0, y2: 1 });
    lg.appendChild(el("stop", { offset: "0", "stop-color": color, "stop-opacity": ".25" })); lg.appendChild(el("stop", { offset: "1", "stop-color": color, "stop-opacity": "0" })); defs.appendChild(lg); svg.appendChild(defs);
    if (pts.length > 1) {
      svg.appendChild(el("path", { d: d + `L${pts[n - 1][0]} ${h}L${pts[0][0]} ${h}Z`, fill: `url(#${gid})` }));
      const line = el("path", { d, class: "ch__line ch__line--thin", stroke: color }); svg.appendChild(line); animate(line, 900, 150);
    }
    host.innerHTML = ""; host.appendChild(svg);
  }
  /* cfg: { parts:[{label, value, color}], center, sub, size } */
  function donut(host, cfg) {
    const size = cfg.size || 170, r = size / 2 - 14, c = 2 * Math.PI * r, total = (cfg.parts || []).reduce((t, p) => t + p.value, 0) || 1;
    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: "ch__svg", role: "img", "aria-label": cfg.label || "Donut chart" });
    svg.appendChild(el("circle", { cx: size / 2, cy: size / 2, r, class: "ch__ring" }));
    let acc = 0;
    (cfg.parts || []).forEach((p, i) => {
      const len = c * p.value / total, gap = (cfg.parts.length > 1 && len > 4) ? 2 : 0;
      const seg = el("circle", { cx: size / 2, cy: size / 2, r, class: "ch__seg", stroke: p.color || PALETTE[i % PALETTE.length], "stroke-dasharray": `0 ${c}`, "stroke-dashoffset": -acc, transform: `rotate(-90 ${size / 2} ${size / 2})` });
      svg.appendChild(seg);
      const final = `${Math.max(0, len - gap)} ${c}`;
      setTimeout(() => { seg.style.transition = "stroke-dasharray 1s cubic-bezier(.2,.7,.2,1)"; seg.setAttribute("stroke-dasharray", final); }, 60 + i * 90);
      acc += len;
    });
    const t = el("text", { x: size / 2, y: size / 2 - 2, class: "ch__dc", "text-anchor": "middle" }); t.textContent = cfg.center || ""; svg.appendChild(t);
    const s = el("text", { x: size / 2, y: size / 2 + 18, class: "ch__ds", "text-anchor": "middle" }); s.textContent = cfg.sub || ""; svg.appendChild(s);
    host.innerHTML = ""; host.appendChild(svg);
  }
  const DRAW = { area, spark, donut };
  function draw(node) { const r = reg[node.dataset.ch]; if (!r) return; try { DRAW[r.type](node, r.cfg); } catch (e) { console.error(e); } }
  let ro = null;
  function mount(scope) {
    const list = Array.from((scope || document).querySelectorAll("[data-ch]"));
    list.forEach(draw);
    if ("ResizeObserver" in window) {
      if (!ro) ro = new ResizeObserver((es) => es.forEach((e) => { const n = e.target, w = Math.round(e.contentRect.width); if (n._w && Math.abs(n._w - w) > 8) draw(n); n._w = w; }));
      list.filter((n) => reg[n.dataset.ch] && reg[n.dataset.ch].type !== "donut").forEach((n) => { n._w = Math.round(n.clientWidth); ro.observe(n); });
    }
  }
  return { slot, mount, PALETTE, short };
})();
