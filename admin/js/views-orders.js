/* =====================================================================
   FRESH VALLEY Admin — Orders (list, detail, draft order)
   ===================================================================== */
(function () {
  "use strict";
  const { esc, icon, money, num, data, cat, fmtDate, fmtDT, ago, STATUS, STATUS_LABEL } = A;
  const FV = A.FV;
  const PER = 25;
  const OPEN = ["new", "confirmed", "packed", "out"];
  const TABS = [
    ["all", "All", () => true],
    ["unfulfilled", "Unfulfilled", (o) => ["new", "confirmed", "packed"].includes(o.status)],
    ["open", "Open", (o) => OPEN.includes(o.status)],
    ["delivered", "Delivered", (o) => o.status === "delivered"],
    ["closed", "Cancelled & refunded", (o) => o.status === "cancelled" || o.status === "refunded"],
  ];
  const itemThumb = (it) => { const src = cat.itemImg(it); return src ? `<img src="${esc(src)}" alt="" loading="lazy">` : `<span class="thumb-art">${icon("leaf2")}</span>`; };

  function setStatus(o, st, silent) {
    const prev = o.status;
    o.status = st;
    if (st === "delivered") { o.fulfillment = "fulfilled"; if (/cash/i.test(o.payment || "")) o.paid = true; }
    if (st === "cancelled" || st === "refunded") o.fulfillment = "unfulfilled";
    o.timeline = (o.timeline || []).concat([{ t: Date.now(), msg: (STATUS_LABEL[st] || st) + (prev !== st ? "" : "") + " · by " + A.auth.session().name.split(" ")[0] }]);
    data.saveOrder(o);
    if (!silent) A.toast(o.id + " · " + STATUS_LABEL[st]);
  }
  A.setOrderStatus = setStatus;

  /* Printable receipts — several orders in one document */
  function printReceipts(list) {
    if (!list.length) return;
    const docs = list.map((o) => FV.receiptDoc(o, true));
    const headEnd = docs[0].indexOf("</head>");
    const head = docs[0].slice(0, headEnd).replace("<head>", '<head><base href="../">');
    const bodies = docs.map((d) => d.slice(d.indexOf("<body>") + 6, d.lastIndexOf("</body>")));
    const html = head + '<style>.pb{page-break-after:always;height:24px}</style></head><body>' + bodies.join('<div class="pb"></div>') + "</body></html>";
    let f = document.getElementById("printFrame");
    if (f) f.remove();
    f = document.createElement("iframe"); f.id = "printFrame"; f.title = "Receipts"; f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    f.srcdoc = html;
    f.onload = () => { setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (_) {} }, 250); };
  }
  A.printReceipts = printReceipts;
  function exportOrders(list) {
    A.csv("orders.csv", [["Order", "Date", "Customer", "Email", "Phone", "Area", "Address", "Slot", "Items", "Subtotal", "Discount", "Code", "Delivery", "Total", "Payment", "Payment status", "Status", "Source"]]
      .concat(list.map((o) => [o.id, o.date, o.customer.name, o.customer.email, o.customer.phone, o.customer.area, o.address, o.slot, o.items.map((i) => i.qty + "× " + i.name + " (" + i.variant + ")").join("; "), o.subtotal, o.discount, o.code, o.delivery, o.total, o.payment, A.payState(o), STATUS_LABEL[o.status], o.source || ""])));
  }

  /* ------------------------------------------------------------------ *
   * List
   * ------------------------------------------------------------------ */
  A.route("/orders", (root, p, q) => {
    const st = { tab: q.get("tab") || "all", q: q.get("q") || "", pay: "", area: "", sort: "new", page: 1, sel: new Set() };
    const areas = Array.from(new Set(data.orders().map((o) => o.customer.area).filter(Boolean))).sort();
    root.innerHTML = `<div class="page page--wide">
      ${A.pageHead("Orders", { actions: `<button class="ab" type="button" id="exp">${icon("download")}Export</button><a class="ab ab--primary" href="#/orders/new">${icon("plus")}Create order</a>` })}
      <div class="card card--flush" id="oc">
        <div class="tabs" role="tablist" id="tabs"></div>
        <div class="toolbar">
          <label class="search"><span class="sr-only">Search orders</span>${icon("search")}<input class="in" id="q" placeholder="Search by order, customer, email or phone" value="${esc(st.q)}"></label>
          <select class="sel" id="pay" style="width:auto" aria-label="Payment"><option value="">Any payment</option><option value="paid">Paid</option><option value="pending">Payment pending</option><option value="refunded">Refunded</option></select>
          <select class="sel" id="area" style="width:auto" aria-label="Area"><option value="">All areas</option>${areas.map((a) => `<option>${esc(a)}</option>`).join("")}</select>
          <select class="sel" id="sort" style="width:auto" aria-label="Sort"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="high">Total · high to low</option><option value="low">Total · low to high</option></select>
        </div>
        <div id="bulk"></div>
        <div class="tbl-wrap" id="tw"></div>
        <div class="pager" id="pager"></div>
      </div></div>`;
    const $ = (s) => root.querySelector(s);
    function filtered() {
      const qq = st.q.trim().toLowerCase();
      let list = data.orders().filter(TABS.find((t) => t[0] === st.tab)[2]);
      if (qq) list = list.filter((o) => [o.id, o.customer.name, o.customer.email, o.customer.phone].some((x) => String(x || "").toLowerCase().includes(qq)));
      if (st.pay) list = list.filter((o) => A.payState(o) === st.pay);
      if (st.area) list = list.filter((o) => o.customer.area === st.area);
      if (st.sort === "old") list.reverse(); else if (st.sort === "high") list.sort((a, b) => b.total - a.total); else if (st.sort === "low") list.sort((a, b) => a.total - b.total);
      return list;
    }
    function render() {
      const all = data.orders();
      $("#tabs").innerHTML = TABS.map((t) => `<button role="tab" type="button" data-tab="${t[0]}" aria-selected="${t[0] === st.tab}">${t[1]}<span class="cnt">${all.filter(t[2]).length}</span></button>`).join("");
      $("#tabs").querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { st.tab = b.dataset.tab; st.page = 1; st.sel.clear(); render(); }));
      const list = filtered(), pages = Math.max(1, Math.ceil(list.length / PER));
      st.page = Math.min(st.page, pages);
      const rows = list.slice((st.page - 1) * PER, st.page * PER);
      $("#tw").innerHTML = list.length ? `<table class="tbl"><thead><tr><th class="w-chk"><input type="checkbox" id="all" aria-label="Select all on this page"${rows.length && rows.every((o) => st.sel.has(o.id)) ? " checked" : ""}></th><th>Order</th><th>Date</th><th>Customer</th><th>Area</th><th class="r">Total</th><th>Payment</th><th>Fulfilment</th><th>Status</th><th class="r">Items</th></tr></thead><tbody>
        ${rows.map((o) => `<tr class="is-link${st.sel.has(o.id) ? " is-sel" : ""}" data-id="${esc(o.id)}"><td class="w-chk"><input type="checkbox" data-sel="${esc(o.id)}" aria-label="Select ${esc(o.id)}"${st.sel.has(o.id) ? " checked" : ""}></td>
          <td class="strong nowrap">${esc(o.id)}${A.demoBadge(o)}</td><td class="nowrap" title="${esc(fmtDT(o.date))}">${ago(o.date)}</td><td>${esc(o.customer.name || "—")}<div class="sub">${esc(o.customer.email || "")}</div></td><td>${esc(o.customer.area || "—")}</td>
          <td class="r num">${money(o.total)}</td><td>${A.payBadge(o)}</td><td>${A.fulBadge(o)}</td><td>${A.statusBadge(o.status)}</td><td class="r num">${o.items.reduce((s, i) => s + (i.qty || 1), 0)}</td></tr>`).join("")}
        </tbody></table>` : A.empty(st.q || st.pay || st.area ? "No orders match" : "No orders here yet", st.q || st.pay || st.area ? "Try a different search or filter." : "Orders placed on the storefront appear here instantly.");
      $("#pager").innerHTML = list.length > PER ? `<button class="ab ab--sm" type="button" id="pv"${st.page <= 1 ? " disabled" : ""}>${icon("back")}</button><span>Page ${st.page} of ${pages} · ${num(list.length)} orders</span><button class="ab ab--sm" type="button" id="nx"${st.page >= pages ? " disabled" : ""}>${icon("chevR")}</button>` : `<span>${num(list.length)} orders</span>`;
      const pv = $("#pv"), nx = $("#nx");
      pv && pv.addEventListener("click", () => { st.page--; render(); });
      nx && nx.addEventListener("click", () => { st.page++; render(); });
      $("#tw").querySelectorAll("tr[data-id]").forEach((tr) => tr.addEventListener("click", (e) => { if (e.target.closest("input")) return; A.go("/orders/" + tr.dataset.id); }));
      $("#tw").querySelectorAll("[data-sel]").forEach((c) => c.addEventListener("change", () => { c.checked ? st.sel.add(c.dataset.sel) : st.sel.delete(c.dataset.sel); render(); }));
      const allC = $("#all"); allC && allC.addEventListener("change", () => { rows.forEach((o) => allC.checked ? st.sel.add(o.id) : st.sel.delete(o.id)); render(); });
      bulk();
    }
    function bulk() {
      const b = $("#bulk");
      if (!st.sel.size) { b.innerHTML = ""; return; }
      b.innerHTML = `<div class="bulk"><b>${st.sel.size} selected</b><span style="flex:1"></span>
        <button class="ab" type="button" data-b="confirmed">Mark confirmed</button><button class="ab" type="button" data-b="packed">Packed</button><button class="ab" type="button" data-b="out">Out for delivery</button><button class="ab" type="button" data-b="delivered">Delivered</button>
        <button class="ab" type="button" data-b="print">${icon("printer")}Receipts</button><button class="ab" type="button" data-b="csv">${icon("download")}CSV</button><button class="ab" type="button" data-b="cancelled">Cancel</button><button class="ab ab--plain" type="button" data-b="clear" style="color:#fff">Clear</button></div>`;
      b.querySelectorAll("[data-b]").forEach((x) => x.addEventListener("click", async () => {
        const list = data.orders().filter((o) => st.sel.has(o.id)), k = x.dataset.b;
        if (k === "clear") { st.sel.clear(); render(); return; }
        if (k === "print") { printReceipts(list); return; }
        if (k === "csv") { exportOrders(list); return; }
        if (k === "cancelled" && !(await A.confirm("Cancel " + list.length + " orders?", "Customers are not notified automatically in this demo.", { danger: true, ok: "Cancel orders" }))) return;
        list.forEach((o) => setStatus(o, k, true));
        A.toast(list.length + " orders · " + STATUS_LABEL[k]);
        st.sel.clear(); A.renderSide(); render();
      }));
    }
    let t;
    $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; st.page = 1; render(); }, 180); });
    $("#pay").addEventListener("change", (e) => { st.pay = e.target.value; st.page = 1; render(); });
    $("#area").addEventListener("change", (e) => { st.area = e.target.value; st.page = 1; render(); });
    $("#sort").addEventListener("change", (e) => { st.sort = e.target.value; render(); });
    $("#exp").addEventListener("click", () => exportOrders(filtered()));
    render();
  }, { perm: "orders" });

  /* ------------------------------------------------------------------ *
   * Detail
   * ------------------------------------------------------------------ */
  A.route("/orders/:id", (root, p) => {
    if (p.id === "new") return draft(root);
    const o = data.order(p.id);
    if (!o) { root.innerHTML = `<div class="page">${A.empty("Order not found", "It may have been deleted.", `<a class="ab" href="#/orders">Back to orders</a>`)}</div>`; return; }
    const idx = STATUS.indexOf(o.status), closed = o.status === "cancelled" || o.status === "refunded";
    const next = idx > -1 && idx < STATUS.length - 1 ? STATUS[idx + 1] : null;
    const cust = data.customers().find((c) => String(c.email).toLowerCase() === String(o.customer.email).toLowerCase());
    const wa = String(o.customer.phone || "").replace(/[^0-9]/g, "");
    root.innerHTML = `<div class="page">
      ${A.pageHead(o.id, { back: "#/orders", badges: A.payBadge(o) + A.fulBadge(o) + A.demoBadge(o), actions: `<button class="ab" type="button" id="rc">${icon("printer")}Receipt</button><button class="ab ab--icon" type="button" id="more" aria-label="More actions">${icon("dots")}</button>` })}
      <p class="page__sub">${esc(fmtDT(o.date))} · ${esc(o.channel || "Website")}${o.source ? " · via " + esc(o.source) : ""}</p>
      <div class="cols">
        <div class="stack">
          <div class="card"><div class="card__hd"><h2>${closed ? STATUS_LABEL[o.status] : "Order status"}</h2>${A.statusBadge(o.status)}</div><div class="card__bd">
            ${closed ? `<p class="muted">This order was ${o.status}. ${o.status === "cancelled" ? "No payment was captured." : "The customer has been refunded " + money(o.total) + "."}</p>` : `<div class="stepper">${STATUS.map((s, i) => `<div class="stepper__s${i <= idx ? " on" : ""}${i === idx ? " cur" : ""}"><i></i>${esc(STATUS_LABEL[s])}</div>`).join("")}</div>
            <div class="row" style="margin-top:14px">${next ? `<button class="ab ab--primary" type="button" data-to="${next}">${icon("check")}Mark as ${esc(STATUS_LABEL[next].toLowerCase())}</button>` : `<span class="bdg bdg--ok">Complete</span>`}${o.status !== "delivered" ? `<button class="ab" type="button" data-to="delivered">Mark delivered</button>` : ""}</div>`}
          </div></div>
          <div class="card"><div class="card__hd"><h2>${o.fulfillment === "fulfilled" || o.status === "delivered" ? "Fulfilled" : "Items"} · ${o.items.reduce((s, i) => s + (i.qty || 1), 0)}</h2></div><div class="card__bd">
            ${o.items.map((it) => `<div class="line-it">${itemThumb(it)}<div><a class="strong link" style="text-decoration:none" href="#/${it.type === "box" ? "boxes" : "products"}/${esc(it.slug)}">${esc(it.name)}</a><div class="sub small faint">${esc(it.variant || "")}</div>${it.note ? `<div class="small" style="color:var(--olive-dk)">${esc(it.note)}</div>` : ""}</div><span class="faint num nowrap">${money(it.price)} × ${it.qty || 1}</span><b class="num">${money((it.price || 0) * (it.qty || 1))}</b></div>`).join("")}
          </div></div>
          <div class="card"><div class="card__hd"><h2>Payment</h2>${A.payBadge(o)}</div><div class="card__bd"><div class="sum">
            <span>Subtotal · ${o.items.length} line${o.items.length === 1 ? "" : "s"}</span><span class="num">${money(o.subtotal)}</span>
            ${o.discount ? `<span>Discount${o.code ? " · " + esc(o.code) : ""}</span><span class="num">− ${money(o.discount)}</span>` : ""}
            <span>Delivery</span><span class="num">${o.delivery ? money(o.delivery) : "Free"}</span>
            <span class="tot">Total</span><span class="tot num">${money(o.total)}</span>
            <span class="faint">${esc(o.payment || "—")}</span><span class="faint">${A.payState(o) === "paid" ? "Paid by customer" : A.payState(o) === "pending" ? "Collect on delivery" : ""}</span>
          </div>${A.payState(o) === "pending" ? `<div class="row" style="margin-top:12px"><button class="ab" type="button" id="paid">Mark as paid</button></div>` : ""}</div></div>
          <div class="card"><div class="card__hd"><h2>Timeline</h2></div><div class="card__bd">
            <form class="row" id="noteF" style="margin-bottom:10px"><label class="sr-only" for="noteIn">Add a note</label><input class="in" id="noteIn" placeholder="Leave a note for the team…" style="flex:1"><button class="ab" type="submit">Post</button></form>
            <div class="timeline">${(o.timeline || []).slice().reverse().map((e) => `<div class="timeline__it"><i></i><span>${esc(e.msg)}</span><time>${esc(fmtDT(e.t))}</time></div>`).join("") || `<p class="muted small">No activity yet.</p>`}</div>
          </div></div>
        </div>
        <div class="stack">
          <div class="card"><div class="card__hd"><h2>Customer</h2></div><div class="card__bd">
            <a class="link" href="#/customers/${encodeURIComponent(o.customer.email || "")}">${esc(o.customer.name || "—")}</a>
            <div class="faint small">${cust ? cust.count + " order" + (cust.count === 1 ? "" : "s") + " · " + money(cust.spent) + " spent" : ""}</div>
            <div class="divider"></div>
            <h4>Contact</h4>
            <div class="small" style="display:flex;flex-direction:column;gap:4px">${o.customer.email ? `<a class="link" href="mailto:${esc(o.customer.email)}?subject=${encodeURIComponent("Your Fresh Valley order " + o.id)}">${esc(o.customer.email)}</a>` : ""}${o.customer.phone ? `<a class="link" href="tel:${esc(o.customer.phone.replace(/\s/g, ""))}">${esc(o.customer.phone)}</a>` : ""}${wa ? `<a class="link" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent("Hello " + (o.customer.name || "").split(" ")[0] + ", about your Fresh Valley order " + o.id)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</div>
          </div></div>
          <div class="card"><div class="card__hd"><h2>Delivery</h2></div><div class="card__bd"><dl class="kv"><dt>Area</dt><dd>${esc(o.customer.area || "—")}</dd><dt>Address</dt><dd>${esc(o.address || "—")}</dd><dt>Slot</dt><dd>${esc(o.slot || "—")}</dd>${o.note ? `<dt>Note</dt><dd>${esc(o.note)}</dd>` : ""}</dl></div></div>
          <div class="card"><div class="card__hd"><h2>Conversion</h2></div><div class="card__bd"><dl class="kv"><dt>Channel</dt><dd>${esc(o.channel || "Website")}</dd><dt>Source</dt><dd>${esc(o.source || "direct")}</dd><dt>Customer since</dt><dd>${cust ? esc(fmtDate(cust.joined)) : "—"}</dd></dl></div></div>
        </div>
      </div></div>`;
    root.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => { setStatus(o, b.dataset.to); A.renderSide(); A.updateBell(); A.go("/orders/" + o.id + "?r=" + Date.now()); }));
    root.querySelector("#rc").addEventListener("click", () => FV.receipt.open(o));
    const pd = root.querySelector("#paid");
    pd && pd.addEventListener("click", () => { o.paid = true; o.timeline.push({ t: Date.now(), msg: "Payment collected · " + money(o.total) }); data.saveOrder(o); A.toast("Marked as paid"); A.go("/orders/" + o.id + "?r=" + Date.now()); });
    root.querySelector("#noteF").addEventListener("submit", (e) => { e.preventDefault(); const v = root.querySelector("#noteIn").value.trim(); if (!v) return; o.timeline.push({ t: Date.now(), msg: A.auth.session().name.split(" ")[0] + ": " + v.replace(/[<>]/g, "") }); data.saveOrder(o); A.go("/orders/" + o.id + "?r=" + Date.now()); });
    root.querySelector("#more").addEventListener("click", (e) => A.menu(e.currentTarget, [
      { label: "Download receipt", icon: "download", fn: () => FV.receipt.download(o) },
      { label: "Duplicate as new order", icon: "copy", fn: () => { sessionStorage.setItem("fv_admin_dup", JSON.stringify(o)); A.go("/orders/new"); } },
      !closed ? { label: "Cancel order", icon: "x", danger: true, fn: async () => { if (await A.confirm("Cancel " + o.id + "?", "The order will be marked as cancelled.", { danger: true, ok: "Cancel order" })) { setStatus(o, "cancelled"); A.renderSide(); A.go("/orders/" + o.id + "?r=" + Date.now()); } } } : null,
      o.status === "delivered" ? { label: "Refund order", icon: "back", danger: true, fn: async () => { if (await A.confirm("Refund " + money(o.total) + "?", "The order will be marked as refunded.", { danger: true, ok: "Refund" })) { setStatus(o, "refunded"); A.go("/orders/" + o.id + "?r=" + Date.now()); } } } : null,
      { label: "Delete order", icon: "trash", danger: true, fn: async () => { if (await A.confirm("Delete " + o.id + "?", "This permanently removes the order from this browser's records.", { danger: true, ok: "Delete" })) { data.removeOrder(o); A.toast("Order deleted"); A.go("/orders"); } } },
    ]));
  }, { perm: "orders" });

  /* ------------------------------------------------------------------ *
   * Draft order (manual)
   * ------------------------------------------------------------------ */
  function draft(root) {
    let dup = null; try { dup = JSON.parse(sessionStorage.getItem("fv_admin_dup")); sessionStorage.removeItem("fv_admin_dup"); } catch (_) {}
    const st = { lines: dup ? dup.items.map((i) => Object.assign({}, i)) : [], cust: dup ? Object.assign({}, dup.customer) : { name: "", email: "", phone: "", area: "" }, address: dup ? dup.address : "", slot: "", payment: "Cash on delivery", discount: 0, note: "" };
    const areas = (A.T.settings().areas || []);
    const slots = FV.settings.slots || [];
    const S = A.settings.get();
    root.innerHTML = `<div class="page">${A.pageHead("Create order", { back: "#/orders" })}
      <div class="cols"><div class="stack">
        <div class="card"><div class="card__hd"><h2>Products</h2></div><div class="card__bd">
          <label class="search"><span class="sr-only">Search products</span>${icon("search")}<input class="in" id="ps" placeholder="Search produce or boxes to add…" autocomplete="off"></label>
          <div id="psr" style="margin-top:6px"></div><div id="lines" style="margin-top:10px"></div></div></div>
        <div class="card"><div class="card__hd"><h2>Payment</h2></div><div class="card__bd"><div id="sum"></div>
          <div class="grid-2" style="margin-top:12px"><div class="fld"><label for="dPay">Payment method</label><select class="sel" id="dPay">${["Cash on delivery", "Card", "Mobile wallet", "Apple Pay", "Bank transfer"].map((x) => `<option>${x}</option>`).join("")}</select></div>
          <div class="fld"><label for="dDisc">Manual discount (EGP)</label><input class="in" id="dDisc" type="number" min="0" value="0"></div></div></div></div>
      </div><div class="stack">
        <div class="card"><div class="card__hd"><h2>Customer</h2></div><div class="card__bd" style="display:grid;gap:10px">
          <div class="fld"><label for="cN">Name</label><input class="in" id="cN" value="${esc(st.cust.name || "")}"></div>
          <div class="fld"><label for="cE">Email</label><input class="in" id="cE" type="email" value="${esc(st.cust.email || "")}"></div>
          <div class="fld"><label for="cP">Phone</label><input class="in" id="cP" value="${esc(st.cust.phone || "")}"></div></div></div>
        <div class="card"><div class="card__hd"><h2>Delivery</h2></div><div class="card__bd" style="display:grid;gap:10px">
          <div class="fld"><label for="cA">Area</label><select class="sel" id="cA">${areas.map((a) => `<option${a === st.cust.area ? " selected" : ""}>${esc(a)}</option>`).join("")}</select></div>
          <div class="fld"><label for="cAd">Address</label><input class="in" id="cAd" value="${esc(st.address || "")}"></div>
          <div class="fld"><label for="cS">Slot</label><select class="sel" id="cS">${slots.map((s) => `<option>Tomorrow, ${esc(s)}</option>`).join("")}</select></div>
          <div class="fld"><label for="cNo">Note</label><input class="in" id="cNo"></div></div></div>
        <button class="ab ab--primary" type="button" id="create" style="height:40px">Create order</button>
      </div></div></div>`;
    const $ = (s) => root.querySelector(s);
    const all = cat.products().filter((x) => x.status !== "archived").map((x) => ({ kind: "product", x })).concat(cat.boxes().map((x) => ({ kind: "box", x })));
    function totals() { const sub = st.lines.reduce((s, l) => s + l.price * l.qty, 0), del = sub >= S.freeThreshold || !sub ? 0 : S.deliveryFee, disc = Math.min(sub, +$("#dDisc").value || 0); return { sub, del, disc, total: sub + del - disc }; }
    function renderLines() {
      $("#lines").innerHTML = st.lines.length ? st.lines.map((l, i) => {
        const pr = l.type === "box" ? cat.boxes().find((b) => b.slug === l.slug) : A.FV.find(l.slug);
        const opts = l.type === "box" ? pr.tiers.map((t) => [t.label, t.price]) : pr && pr.unit === "kg" ? FV.weightOptions.map((w) => [FV.weightLabel(w.g), FV.priceForWeight(pr, w.g)]) : [[l.variant, l.price]];
        return `<div class="line-it">${itemThumb(l)}<div><b>${esc(l.name)}</b><div><select class="sel" data-v="${i}" style="height:30px;width:auto;margin-top:4px" aria-label="Variant">${opts.map(([v, pz]) => `<option value="${esc(v)}" data-p="${pz}"${v === l.variant ? " selected" : ""}>${esc(v)} · ${money(pz)}</option>`).join("")}</select></div></div>
          <input class="in" type="number" min="1" value="${l.qty}" data-q="${i}" style="width:70px;height:30px" aria-label="Quantity"><span class="row"><b class="num">${money(l.price * l.qty)}</b><button class="ab ab--plain ab--icon" type="button" data-rm="${i}" aria-label="Remove">${icon("trash")}</button></span></div>`;
      }).join("") : `<p class="muted small">No products yet — search above to add.</p>`;
      $("#lines").querySelectorAll("[data-v]").forEach((s) => s.addEventListener("change", () => { const l = st.lines[+s.dataset.v]; l.variant = s.value; l.price = +s.selectedOptions[0].dataset.p; renderLines(); }));
      $("#lines").querySelectorAll("[data-q]").forEach((s) => s.addEventListener("change", () => { st.lines[+s.dataset.q].qty = Math.max(1, +s.value || 1); renderLines(); }));
      $("#lines").querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", () => { st.lines.splice(+b.dataset.rm, 1); renderLines(); }));
      renderSum();
    }
    function renderSum() { const t = totals(); $("#sum").innerHTML = `<div class="sum"><span>Subtotal</span><span class="num">${money(t.sub)}</span>${t.disc ? `<span>Discount</span><span class="num">− ${money(t.disc)}</span>` : ""}<span>Delivery</span><span class="num">${t.del ? money(t.del) : "Free"}</span><span class="tot">Total</span><span class="tot num">${money(t.total)}</span></div>`; }
    $("#ps").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      $("#psr").innerHTML = q ? all.filter((a) => a.x.name.toLowerCase().includes(q)).slice(0, 6).map((a, i) => `<button class="li" type="button" data-add="${all.indexOf(a)}">${a.kind === "box" ? `<img src="${esc(cat.bimg(a.x))}" alt="">` : cat.pimg(a.x) ? `<img src="${esc(cat.pimg(a.x))}" alt="">` : `<span class="thumb-art" style="width:36px;height:36px;border-radius:8px;display:grid;place-items:center;background:var(--forest);color:var(--olive-lt)">${icon("leaf2")}</span>`}<span class="li__main"><span class="li__t">${esc(a.x.name)}</span><span class="li__s">${a.kind === "box" ? "Box · from " + money(Math.min(...a.x.tiers.map((t) => t.price))) : money(cat.price(a.x)) + " " + FV.cardPrice(a.x).per}</span></span>${icon("plus")}</button>`).join("") : "";
      $("#psr").querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
        const a = all[+b.dataset.add];
        if (a.kind === "box") st.lines.push({ slug: a.x.slug, type: "box", name: a.x.name, variant: a.x.tiers[0].label, price: a.x.tiers[0].price, qty: 1, image: a.x.image });
        else { const dv = FV.defaultVariant(a.x); st.lines.push({ slug: a.x.slug, type: "product", name: a.x.name, variant: dv.variant, price: dv.price, qty: 1, image: FV.isCustomImg(a.x.image) ? a.x.image : a.x.slug, noPhoto: !!a.x.noPhoto }); }
        e.target.value = ""; $("#psr").innerHTML = ""; renderLines();
      }));
    });
    $("#dDisc").addEventListener("input", renderSum);
    $("#dPay").value = dup ? (dup.payment || "Cash on delivery") : "Cash on delivery";
    $("#create").addEventListener("click", () => {
      const name = $("#cN").value.trim(), email = $("#cE").value.trim();
      if (!st.lines.length) { A.toast("Add at least one product", "bad"); return; }
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { A.toast("Add the customer's name and a valid email", "bad"); return; }
      const t = totals();
      const o = { id: "FV" + Math.floor(100000 + Math.random() * 899999), date: new Date().toISOString(), customer: { name, email, phone: $("#cP").value.trim(), area: $("#cA").value }, address: $("#cAd").value.trim() + ", " + $("#cA").value, slot: $("#cS").value, items: st.lines, subtotal: t.sub, discount: t.disc, code: t.disc ? "MANUAL" : "", delivery: t.del, total: t.total, payment: $("#dPay").value, status: "confirmed", fulfillment: "unfulfilled", channel: "Admin", source: "direct", note: $("#cNo").value.trim(), timeline: [{ t: Date.now(), msg: "Order created in the admin by " + A.auth.session().name.split(" ")[0] }] };
      data.saveOrder(Object.assign(o, { demo: false }));
      A.FV.clients.upsert({ name, email, phone: o.customer.phone, area: o.customer.area });
      A.toast("Order " + o.id + " created");
      A.go("/orders/" + o.id);
    });
    renderLines();
  }
})();
