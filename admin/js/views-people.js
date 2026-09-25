/* =====================================================================
   FRESH VALLEY Admin — Customers, Subscribers, Discounts, Inbox
   ===================================================================== */
(function () {
  "use strict";
  const { esc, icon, money, num, data, cat, fmtDate, fmtDT, ago, pct } = A;
  const SEGS = ["Champions", "Loyal", "Promising", "New", "Needs attention", "At risk", "Hibernating", "Subscriber"];
  const SEG_B = { Champions: "bdg--dark", Loyal: "bdg--ok", Promising: "bdg--info", New: "bdg--info", "Needs attention": "bdg--warn", "At risk": "bdg--bad", Hibernating: "", Subscriber: "" };
  const SEG_HINT = { Champions: "4+ orders, bought in the last 30 days", Loyal: "3+ orders, active in the last 60 days", Promising: "1–2 orders in the last 30 days", New: "First order in the last 14 days", "Needs attention": "Were active, slowing down", "At risk": "Repeat buyers gone quiet for 60+ days", Hibernating: "No order in 90+ days", Subscriber: "Signed up, no order yet" };
  const initials = (n) => String(n || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  /* ------------------------------------------------------------------ *
   * Customers
   * ------------------------------------------------------------------ */
  A.route("/customers", (root, p, q) => {
    const st = { seg: q.get("seg") || "", q: "", sort: "spent" };
    root.innerHTML = `<div class="page page--wide">${A.pageHead("Customers", { actions: `<button class="ab" type="button" id="exp">${icon("download")}Export</button>` })}
      <div class="grid-3" id="segCards"></div>
      <div class="card card--flush"><div class="toolbar" style="flex-direction:column;align-items:stretch">
        <div class="chips" id="chips"></div>
        <div class="row"><label class="search"><span class="sr-only">Search customers</span>${icon("search")}<input class="in" id="q" placeholder="Search by name, email or phone"></label>
        <select class="sel" id="sort" style="width:auto" aria-label="Sort"><option value="spent">Most spent</option><option value="orders">Most orders</option><option value="recent">Most recent</option><option value="joined">Newest customers</option></select></div></div>
        <div class="tbl-wrap" id="tw"></div></div></div>`;
    const $ = (s) => root.querySelector(s);
    const all = data.customers();
    const buyers = all.filter((c) => c.count), rep = buyers.filter((c) => c.count > 1).length;
    $("#segCards").innerHTML = `<div class="card kpi"><span class="kpi__l">Customers</span><span class="kpi__v">${num(buyers.length)}</span><span class="faint small">${num(all.length - buyers.length)} subscribers yet to order</span></div>
      <div class="card kpi"><span class="kpi__l">Repeat customers</span><span class="kpi__v">${pct(buyers.length ? rep / buyers.length : 0, 0)}</span><span class="faint small">${num(rep)} have ordered more than once</span></div>
      <div class="card kpi"><span class="kpi__l">Average lifetime value</span><span class="kpi__v">${money(buyers.length ? buyers.reduce((s, c) => s + c.spent, 0) / buyers.length : 0)}</span><span class="faint small">total spent per customer</span></div>`;
    function render() {
      $("#chips").innerHTML = `<button class="chipf" type="button" data-seg="" aria-pressed="${!st.seg}">All · ${all.length}</button>` + SEGS.map((s) => { const n = all.filter((c) => c.segment === s).length; return n ? `<button class="chipf" type="button" data-seg="${s}" aria-pressed="${st.seg === s}" title="${esc(SEG_HINT[s])}">${s} · ${n}</button>` : ""; }).join("");
      $("#chips").querySelectorAll("[data-seg]").forEach((b) => b.addEventListener("click", () => { st.seg = b.dataset.seg; render(); }));
      let l = all.slice();
      if (st.seg) l = l.filter((c) => c.segment === st.seg);
      const qq = st.q.trim().toLowerCase(); if (qq) l = l.filter((c) => [c.name, c.email, c.phone].some((x) => String(x || "").toLowerCase().includes(qq)));
      l.sort((a, b) => st.sort === "orders" ? b.count - a.count : st.sort === "recent" ? b.last - a.last : st.sort === "joined" ? new Date(b.joined) - new Date(a.joined) : b.spent - a.spent);
      $("#tw").innerHTML = l.length ? `<table class="tbl"><thead><tr><th>Customer</th><th>Area</th><th>Segment</th><th class="r">Orders</th><th class="r">Spent</th><th class="r">Avg order</th><th>Last order</th><th>Email marketing</th></tr></thead><tbody>
        ${l.slice(0, 300).map((c) => `<tr class="is-link" data-e="${esc(c.email)}"><td><div class="row" style="flex-wrap:nowrap"><span class="av" style="background:var(--sage-lt)">${esc(initials(c.name))}</span><span><span class="strong">${esc(c.name || c.email)}</span>${A.demoBadge(c)}<div class="sub">${esc(c.email)}</div></span></div></td>
          <td>${esc(c.area || "—")}</td><td><span class="bdg ${SEG_B[c.segment]}">${esc(c.segment)}</span></td><td class="r num">${num(c.count)}</td><td class="r num">${money(c.spent)}</td><td class="r num">${c.count ? money(c.aov) : "—"}</td><td class="nowrap">${c.last ? ago(c.last) : "—"}</td><td>${c.marketing ? `<span class="bdg bdg--ok">Subscribed</span>` : `<span class="faint">—</span>`}</td></tr>`).join("")}</tbody></table>` : A.empty("No customers found", "Customers appear when someone checks out or signs up.");
      $("#tw").querySelectorAll("tr[data-e]").forEach((tr) => tr.addEventListener("click", () => A.go("/customers/" + encodeURIComponent(tr.dataset.e))));
    }
    let t; $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; render(); }, 150); });
    $("#sort").addEventListener("change", (e) => { st.sort = e.target.value; render(); });
    $("#exp").addEventListener("click", () => A.csv("customers.csv", [["Name", "Email", "Phone", "Area", "Segment", "Orders", "Spent", "Average order", "Last order", "Customer since", "Email marketing"]].concat(data.customers().map((c) => [c.name, c.email, c.phone, c.area, c.segment, c.count, c.spent, Math.round(c.aov), c.last ? new Date(c.last).toISOString() : "", c.joined, c.marketing ? "yes" : "no"]))));
    render();
  }, { perm: "customers" });

  A.route("/customers/:email", (root, prm) => {
    const c = data.customers().find((x) => String(x.email).toLowerCase() === String(prm.email).toLowerCase());
    if (!c) { root.innerHTML = `<div class="page">${A.empty("Customer not found", "", `<a class="ab" href="#/customers">Back to customers</a>`)}</div>`; return; }
    const wa = String(c.phone || "").replace(/[^0-9]/g, "");
    const fav = {}; c.orders.forEach((o) => o.items.forEach((it) => { fav[it.name] = (fav[it.name] || 0) + (it.qty || 1); }));
    const favs = Object.entries(fav).sort((a, b) => b[1] - a[1]).slice(0, 5);
    root.innerHTML = `<div class="page">${A.pageHead(c.name || c.email, { back: "#/customers", badges: `<span class="bdg ${SEG_B[c.segment]}" title="${esc(SEG_HINT[c.segment])}">${esc(c.segment)}</span>${A.demoBadge(c)}`, actions: `${c.email ? `<a class="ab" href="mailto:${esc(c.email)}">${icon("mail")}Email</a>` : ""}${wa ? `<a class="ab" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">${icon("whatsapp")}WhatsApp</a>` : ""}<button class="ab ab--primary" type="button" id="newO">${icon("plus")}Create order</button>` })}
      <p class="page__sub">${esc(c.area || "")}${c.area ? " · " : ""}Customer since ${esc(fmtDate(c.joined))}</p>
      <div class="cols"><div class="stack">
        <div class="kpis"><div class="card kpi"><span class="kpi__l">Amount spent</span><span class="kpi__v">${money(c.spent)}</span></div><div class="card kpi"><span class="kpi__l">Orders</span><span class="kpi__v">${num(c.count)}</span></div><div class="card kpi"><span class="kpi__l">Average order</span><span class="kpi__v">${c.count ? money(c.aov) : "—"}</span></div></div>
        <div class="card card--flush"><div class="card__hd" style="padding-bottom:12px"><h2>Orders</h2></div>${c.orders.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th class="r">Total</th><th>Status</th></tr></thead><tbody>${c.orders.map((o) => `<tr class="is-link" data-id="${esc(o.id)}"><td class="strong">${esc(o.id)}</td><td>${esc(fmtDate(o.date))}</td><td class="small">${esc(o.items.map((i) => i.name).slice(0, 3).join(", "))}${o.items.length > 3 ? "…" : ""}</td><td class="r num">${money(o.total)}</td><td>${A.statusBadge(o.status)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="card__bd"><p class="muted">No orders yet.</p></div>`}</div>
        ${favs.length ? `<div class="card"><div class="card__hd"><h2>Favourite products</h2></div><div class="card__bd">${A.bars(favs)}</div></div>` : ""}
      </div><div class="stack">
        <div class="card"><div class="card__hd"><h2>Contact</h2></div><div class="card__bd"><dl class="kv"><dt>Email</dt><dd>${esc(c.email)}</dd><dt>Phone</dt><dd>${esc(c.phone || "—")}</dd><dt>Area</dt><dd>${esc(c.area || "—")}</dd><dt>Last order</dt><dd>${c.last ? esc(fmtDate(c.last)) : "—"}</dd></dl></div></div>
        <div class="card"><div class="card__hd"><h2>Marketing</h2></div><div class="card__bd"><label class="row"><span style="flex:1">Subscribed to the Fresh Valley Letter</span>${A.switchEl("mk", c.marketing, "Email marketing")}</label></div></div>
        <div class="card"><div class="card__hd"><h2>Tags & notes</h2></div><div class="card__bd" style="display:grid;gap:10px">
          <div class="fld"><label for="tg">Tags</label><input class="in" id="tg" value="${esc((c.tags || []).join(", "))}" placeholder="vip, corporate, hosting"></div>
          <div class="fld"><label for="nt">Note</label><textarea class="ta" id="nt" rows="3" placeholder="Preferences, allergies, delivery instructions…">${esc(c.note || "")}</textarea></div>
          <button class="ab" type="button" id="sv">Save</button></div></div>
      </div></div></div>`;
    root.querySelectorAll("tr[data-id]").forEach((tr) => tr.addEventListener("click", () => A.go("/orders/" + tr.dataset.id)));
    A.bindSwitches(root);
    const persist = (patch) => { data.upsertClient(Object.assign({}, c, patch)); };
    root.querySelector("#mk").addEventListener("change", (e) => { persist({ marketing: e.target.getAttribute("aria-checked") === "true" }); A.toast("Marketing preference saved"); });
    root.querySelector("#sv").addEventListener("click", () => { persist({ tags: root.querySelector("#tg").value.split(",").map((x) => x.trim()).filter(Boolean), note: root.querySelector("#nt").value.trim() }); A.toast("Customer saved"); });
    root.querySelector("#newO").addEventListener("click", () => { sessionStorage.setItem("fv_admin_dup", JSON.stringify({ items: [], customer: { name: c.name, email: c.email, phone: c.phone, area: c.area }, address: "", payment: "Cash on delivery" })); A.go("/orders/new"); });
  }, { perm: "customers" });

  /* ------------------------------------------------------------------ *
   * Subscribers
   * ------------------------------------------------------------------ */
  A.route("/subscribers", (root) => {
    const subs = data.customers().filter((c) => c.marketing || c.status === "subscriber");
    root.innerHTML = `<div class="page">${A.pageHead("Subscribers", { back: "#/customers", actions: `<button class="ab" type="button" id="exp">${icon("download")}Export</button>` })}
      <p class="page__sub">People who opted in to the Fresh Valley Letter — from the footer, checkout or their account.</p>
      <div class="card card--flush">${subs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Email</th><th>Name</th><th>Signed up</th><th class="r">Orders</th></tr></thead><tbody>${subs.map((c) => `<tr class="is-link" data-e="${esc(c.email)}"><td class="strong">${esc(c.email)}${A.demoBadge(c)}</td><td>${esc(c.name || "—")}</td><td>${esc(fmtDate(c.joined))}</td><td class="r num">${num(c.count)}</td></tr>`).join("")}</tbody></table></div>` : A.empty("No subscribers yet", "Newsletter sign-ups from the storefront land here.")}</div></div>`;
    root.querySelectorAll("tr[data-e]").forEach((tr) => tr.addEventListener("click", () => A.go("/customers/" + encodeURIComponent(tr.dataset.e))));
    root.querySelector("#exp").addEventListener("click", () => A.csv("subscribers.csv", [["Email", "Name", "Signed up", "Orders"]].concat(subs.map((c) => [c.email, c.name, c.joined, c.count]))));
  }, { perm: "customers" });

  /* ------------------------------------------------------------------ *
   * Discounts
   * ------------------------------------------------------------------ */
  const used = (code) => data.orders().filter((o) => String(o.code || "").toUpperCase() === String(code).toUpperCase() && o.status !== "cancelled").length;
  const dState = (d) => d.active === false ? ["Disabled", ""] : d.expires && new Date(d.expires) < new Date() ? ["Expired", "bdg--bad"] : d.limit && used(d.code) >= +d.limit ? ["Used up", "bdg--warn"] : ["Active", "bdg--ok"];
  const dText = (d) => (d.type === "percent" ? d.value + "% off" : d.type === "fixed" ? A.money(d.value) + " off" : "Free delivery") + (d.min ? " orders over " + A.money(d.min) : " any order");
  A.route("/discounts", (root) => {
    const list = cat.get().discounts;
    root.innerHTML = `<div class="page">${A.pageHead("Discounts", { actions: `<a class="ab ab--primary" href="#/discounts/new">${icon("plus")}Create discount</a>` })}
      <div class="card card--flush">${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Offer</th><th>Status</th><th class="r">Used</th><th>Expires</th></tr></thead><tbody>${list.map((d) => { const s = dState(d); return `<tr class="is-link" data-c="${esc(d.code)}"><td class="strong">${esc(d.code)}</td><td>${esc(dText(d))}</td><td><span class="bdg ${s[1]}">${s[0]}</span></td><td class="r num">${num(used(d.code))}${d.limit ? " / " + num(d.limit) : ""}</td><td>${d.expires ? esc(fmtDate(d.expires)) : "—"}</td></tr>`; }).join("")}</tbody></table></div>`
        : A.empty("Reward your regulars", "Create a code like WELCOME10 — customers enter it in the basket and it applies at checkout.", `<a class="ab ab--primary" href="#/discounts/new">Create discount</a>`)}</div></div>`;
    root.querySelectorAll("tr[data-c]").forEach((tr) => tr.addEventListener("click", () => A.go("/discounts/" + encodeURIComponent(tr.dataset.c))));
  }, { perm: "marketing" });

  A.route("/discounts/:code", (root, prm) => {
    const isNew = prm.code === "new";
    const all = cat.get().discounts;
    const ex = all.find((d) => d.code === prm.code);
    if (!isNew && !ex) { A.go("/discounts"); return; }
    const d = Object.assign({ code: "", type: "percent", value: 10, min: "", expires: "", limit: "", active: true, note: "" }, ex || {});
    const gen = () => "FV" + Math.random().toString(36).slice(2, 7).toUpperCase();
    root.innerHTML = `<div class="page page--narrow">${A.pageHead(isNew ? "Create discount" : d.code, { back: "#/discounts", badges: isNew ? "" : `<span class="bdg ${dState(d)[1]}">${dState(d)[0]}</span>` })}
      <form class="stack" id="df" novalidate>
        <div class="card"><div class="card__hd"><h2>Discount code</h2><button class="ab ab--plain ab--sm" type="button" id="gen">Generate</button></div><div class="card__bd" style="display:grid;gap:10px">
          <div class="fld"><label for="dc">Code</label><input class="in" id="dc" value="${esc(d.code)}" placeholder="WELCOME10" style="text-transform:uppercase;letter-spacing:.06em" required></div><span class="help">Customers enter this in the basket or at checkout.</span></div></div>
        <div class="card"><div class="card__hd"><h2>Value</h2></div><div class="card__bd" style="display:grid;gap:12px">
          <div class="btn-group" role="group" aria-label="Discount type">${[["percent", "Percentage"], ["fixed", "Fixed amount"], ["shipping", "Free delivery"]].map(([v, l]) => `<button class="ab" type="button" data-type="${v}" aria-pressed="${d.type === v}">${l}</button>`).join("")}</div>
          <div class="grid-2"><div class="fld" id="valF"><label for="dv">Discount value</label><div class="in-group"><input class="in" id="dv" type="number" min="0" value="${esc(d.value)}"><span id="unit">${d.type === "percent" ? "%" : "EGP"}</span></div></div>
          <div class="fld"><label for="dm">Minimum order (optional)</label><div class="in-group"><span>EGP</span><input class="in" id="dm" type="number" min="0" value="${esc(d.min)}"></div></div></div></div></div>
        <div class="card"><div class="card__hd"><h2>Limits</h2></div><div class="card__bd"><div class="grid-2">
          <div class="fld"><label for="dl">Total usage limit (optional)</label><input class="in" id="dl" type="number" min="0" value="${esc(d.limit)}"></div>
          <div class="fld"><label for="de">Ends on (optional)</label><input class="in" id="de" type="date" value="${esc(d.expires ? String(d.expires).slice(0, 10) : "")}"></div></div>
          <label class="row" style="margin-top:12px"><span style="flex:1"><b>Active</b></span>${A.switchEl("da", d.active !== false, "Active")}</label></div></div>
        <div class="card"><div class="card__hd"><h2>Summary</h2></div><div class="card__bd"><p id="sum" class="muted"></p>${isNew ? "" : `<p class="small faint" style="margin-top:6px">Used ${num(used(d.code))} times.</p>`}</div></div>
        <div class="row row--between">${isNew ? "<span></span>" : `<button class="ab ab--critical" type="button" id="del">Delete discount</button>`}<button class="ab ab--primary" type="submit">Save discount</button></div>
      </form></div>`;
    const $ = (s) => root.querySelector(s);
    A.bindSwitches(root);
    const read = () => ({ code: $("#dc").value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ""), type: d.type, value: +$("#dv").value || 0, min: $("#dm").value === "" ? "" : +$("#dm").value, limit: $("#dl").value === "" ? "" : +$("#dl").value, expires: $("#de").value || "", active: $("#da").getAttribute("aria-checked") === "true" });
    const sum = () => { const x = read(); $("#sum").textContent = (x.code || "This code") + " gives customers " + dText(x) + (x.limit ? ", up to " + x.limit + " uses" : "") + (x.expires ? ", until " + fmtDate(x.expires) : "") + "."; $("#valF").hidden = x.type === "shipping"; $("#unit").textContent = x.type === "percent" ? "%" : "EGP"; };
    root.querySelectorAll("[data-type]").forEach((b) => b.addEventListener("click", () => { d.type = b.dataset.type; root.querySelectorAll("[data-type]").forEach((x) => x.setAttribute("aria-pressed", x === b)); sum(); }));
    root.querySelectorAll("input").forEach((i) => i.addEventListener("input", sum));
    $("#da").addEventListener("change", sum);
    $("#gen").addEventListener("click", () => { $("#dc").value = gen(); sum(); });
    $("#df").addEventListener("submit", (e) => {
      e.preventDefault();
      const x = read();
      if (!x.code) { A.toast("Add a code", "bad"); $("#dc").focus(); return; }
      if (x.type === "percent" && (x.value <= 0 || x.value > 100)) { A.toast("Percentage must be between 1 and 100", "bad"); return; }
      const clash = cat.get().discounts.some((z) => z.code === x.code && z.code !== d.code);
      if (clash) { A.toast("That code already exists", "bad"); return; }
      cat.update((c) => { c.discounts = c.discounts.filter((z) => z.code !== d.code); c.discounts.unshift(x); });
      A.toast("Discount " + x.code + " saved"); A.go("/discounts");
    });
    const del = $("#del");
    del && del.addEventListener("click", async () => { if (!(await A.confirm("Delete " + d.code + "?", "Customers won't be able to use it any more.", { danger: true, ok: "Delete" }))) return; cat.update((c) => { c.discounts = c.discounts.filter((z) => z.code !== d.code); }); A.toast("Discount deleted"); A.go("/discounts"); });
    sum();
  }, { perm: "marketing" });

  /* ------------------------------------------------------------------ *
   * Inbox
   * ------------------------------------------------------------------ */
  A.route("/inbox", (root, p, q) => {
    const st = { tab: q.get("tab") || "inbox" };
    const render = () => {
      const all = data.messages();
      const TABS = [["inbox", "Inbox", (m) => m.status !== "archived"], ["unread", "Unread", (m) => m.status === "new"], ["archived", "Archived", (m) => m.status === "archived"]];
      const l = all.filter(TABS.find((t) => t[0] === st.tab)[2]);
      root.innerHTML = `<div class="page">${A.pageHead("Inbox")}
        <p class="page__sub">Messages sent from the storefront contact form.</p>
        <div class="card card--flush"><div class="tabs" role="tablist">${TABS.map((t) => `<button type="button" role="tab" data-t="${t[0]}" aria-selected="${t[0] === st.tab}">${t[1]}<span class="cnt">${all.filter(t[2]).length}</span></button>`).join("")}</div>
          ${l.length ? l.map((m) => `<a class="li" href="#/inbox/${esc(m.id)}" style="${m.status === "new" ? "background:#FBFAF5" : ""}"><span class="av" style="background:${m.status === "new" ? "var(--olive)" : "var(--sage-lt)"}">${esc(initials((m.first || "") + " " + (m.last || "")))}</span><span class="li__main"><span class="li__t">${m.status === "new" ? "<b>" : ""}${esc((m.first || "") + " " + (m.last || ""))} · ${esc(m.subject || "Message")}${m.status === "new" ? "</b>" : ""}${A.demoBadge(m)}</span><span class="li__s">${esc(String(m.message || "").slice(0, 110))}</span></span><span class="faint small nowrap">${ago(m.date)}</span></a>`).join("") : A.empty("Nothing here", st.tab === "unread" ? "You've read everything." : "Messages from the contact page appear here.")}
        </div></div>`;
      root.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { st.tab = b.dataset.t; render(); }));
    };
    render();
  }, { perm: "content" });

  A.route("/inbox/:id", (root, prm) => {
    const m = data.messages().find((x) => x.id === prm.id);
    if (!m) { A.go("/inbox"); return; }
    if (m.status === "new") { m.status = "read"; data.saveMessage(m); A.renderSide(); A.updateBell(); }
    const name = ((m.first || "") + " " + (m.last || "")).trim();
    const wa = String(m.phone || "").replace(/[^0-9]/g, "");
    root.innerHTML = `<div class="page page--narrow">${A.pageHead(m.subject || "Message", { back: "#/inbox", badges: A.demoBadge(m), actions: `<button class="ab" type="button" id="unr">Mark unread</button><button class="ab" type="button" id="arc">${m.status === "archived" ? "Move to inbox" : "Archive"}</button>` })}
      <div class="card"><div class="card__bd"><div class="row" style="margin-bottom:12px"><span class="av av--lg">${esc(initials(name))}</span><span><b>${esc(name || m.email)}</b><div class="small faint">${esc(m.email)}${m.phone ? " · " + esc(m.phone) : ""} · ${esc(fmtDT(m.date))}</div></span></div>
        <p style="white-space:pre-wrap;line-height:1.7">${esc(m.message || "")}</p></div>
        <div class="card__ft" style="justify-content:flex-start"><a class="ab ab--primary" href="mailto:${esc(m.email)}?subject=${encodeURIComponent("Re: " + (m.subject || "your message") + " — Fresh Valley")}">${icon("mail")}Reply by email</a>${wa ? `<a class="ab" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">${icon("whatsapp")}WhatsApp</a>` : ""}<a class="ab" href="#/customers/${encodeURIComponent(m.email)}">${icon("user")}Customer profile</a></div></div></div>`;
    root.querySelector("#unr").addEventListener("click", () => { m.status = "new"; data.saveMessage(m); A.renderSide(); A.go("/inbox"); });
    root.querySelector("#arc").addEventListener("click", () => { m.status = m.status === "archived" ? "read" : "archived"; data.saveMessage(m); A.toast(m.status === "archived" ? "Archived" : "Moved to inbox"); A.go("/inbox"); });
  }, { perm: "content" });
})();
