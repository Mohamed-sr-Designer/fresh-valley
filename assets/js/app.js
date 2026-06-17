/* =====================================================================
   FRESH VALLEY — Application engine
   Shared across every page: shell (header/footer/drawers), cart &
   wishlist stores (localStorage), pricing, toasts, search, motion,
   and reusable render helpers.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.FV_DATA;

  /* ------------------------------------------------------------------ *
   * Icons (inline SVG, 24px, currentColor)
   * ------------------------------------------------------------------ */
  const I = {
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 20s-7-4.6-9.3-9C1 8 2.5 4.7 6 4.7c2 0 3.2 1.1 4 2.3.8-1.2 2-2.3 4-2.3 3.5 0 5 3.3 3.3 6.3C19 15.4 12 20 12 20Z"/></svg>',
    bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-.8 11.2a1.6 1.6 0 0 1-1.6 1.5H8.4a1.6 1.6 0 0 1-1.6-1.5L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>',
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    star:'<svg viewBox="0 0 24 24"><path d="M12 2.5l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.3 6.3 20l1.2-6.4L2.8 9.2l6.4-.8L12 2.5z"/></svg>',
    leaf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-7 5-13 14-13 0 9-6 14-13 14"/><path d="M5 19c2-4 5-6 9-7"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    snow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M20 6 4 18"/></svg>',
    sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    facebook:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.3c0-.8.25-1.4 1.45-1.4H16V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H7.8V14h2.3v7z"/></svg>',
    tiktok:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2 1.6 3.6 3.6 3.9v2.6c-1.3 0-2.6-.4-3.6-1.1v5.9c0 3-2.4 5.2-5.2 5.2A5.2 5.2 0 0 1 8.6 9.4v2.7a2.6 2.6 0 1 0 1.8 2.5V3z"/></svg>',
    leaf2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21c-4 0-7-3-7-8 0-6 6-9 13-9 0 8-3 13-8 14-2 .4-3-1-3-3 0-3 3-5 6-6"/></svg>',
  };

  /* ------------------------------------------------------------------ *
   * Money + pricing
   * ------------------------------------------------------------------ */
  const money = (n) => "EGP " + Math.round(n).toLocaleString("en-US");

  const weightOptions = [
    { g: 250,  label: "250 g" },
    { g: 500,  label: "500 g" },
    { g: 1000, label: "1 kg", default: true },
    { g: 2000, label: "2 kg" },
  ];

  function priceForWeight(product, grams) {
    const factor = grams >= 2000 ? 0.95 : 1; // gentle value at scale
    return Math.round(product.pricePerKg * (grams / 1000) * factor);
  }
  // Headline price shown on cards
  function cardPrice(p) {
    if (p.unit === "kg")    return { value: p.pricePerKg, per: "/ kg" };
    if (p.unit === "bunch") return { value: p.pricePerUnit, per: "/ bunch" };
    return { value: p.pricePerUnit, per: "each" };
  }
  function defaultVariant(p) {
    if (p.unit === "kg")    return { variant: "1 kg", grams: 1000, price: priceForWeight(p, 1000) };
    if (p.unit === "bunch") return { variant: "per bunch", price: p.pricePerUnit };
    return { variant: "each", price: p.pricePerUnit };
  }

  const FV = window.FV = {
    data: D, icon: (n) => I[n] || "", money, weightOptions, priceForWeight, cardPrice, defaultVariant,
    img: (slug) => D.IMG + slug + ".jpg",
    thumb: (slug) => D.IMG + "sm/" + slug + ".jpg",
    find: (slug) => D.products.find((p) => p.slug === slug),
    findBox: (slug) => D.boxes.find((b) => b.slug === slug),
    byCategory: (c) => D.products.filter((p) => p.category === c),
    byCollection: (c) => {
      // Smart collections — resolved from product data so new categories need no data churn
      if (c === "premium") return D.products.filter((p) => (p.pricePerKg >= 110 || p.pricePerUnit >= 130) && (p.rating || 0) >= 4.7);
      if (c === "organic") return D.products.filter((p) => (p.badges || []).includes("organic") || (p.collections || []).includes("organic-reserve"));
      return D.products.filter((p) => (p.collections || []).includes(c));
    },
  };

  /* ------------------------------------------------------------------ *
   * Stores (localStorage)
   * ------------------------------------------------------------------ */
  const store = {
    get(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };
  let cart = store.get("fv_cart", []);
  let wish = store.get("fv_wish", []);

  function saveCart() { store.set("fv_cart", cart); updateCartUI(); }
  function saveWish() { store.set("fv_wish", wish); updateWishUI(); }

  FV.cart = {
    items: () => cart,
    count: () => cart.reduce((s, i) => s + i.qty, 0),
    subtotal: () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    add(item) {
      const key = item.key;
      const ex = cart.find((i) => i.key === key);
      if (ex) ex.qty += item.qty || 1; else cart.push(Object.assign({ qty: 1 }, item));
      saveCart();
    },
    setQty(key, qty) {
      const it = cart.find((i) => i.key === key);
      if (!it) return;
      it.qty = Math.max(1, qty);
      saveCart();
    },
    remove(key) { cart = cart.filter((i) => i.key !== key); saveCart(); },
    clear() { cart = []; saveCart(); },
  };
  FV.wish = {
    items: () => wish,
    has: (slug) => wish.includes(slug),
    toggle(slug) {
      if (wish.includes(slug)) wish = wish.filter((s) => s !== slug);
      else wish.unshift(slug);
      saveWish();
      return wish.includes(slug);
    },
  };
  FV.recent = {
    list: () => store.get("fv_recent", []),
    push(slug) {
      let r = store.get("fv_recent", []).filter((s) => s !== slug);
      r.unshift(slug);
      store.set("fv_recent", r.slice(0, 10));
    },
  };
  // Deterministic 70–88% "claimed" figure per slug — stable, not fake-precise
  FV.scarcityPct = (slug) => {
    let h = 0; for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    return 70 + (h % 19);
  };

  /* Quick add a product (default variant) */
  FV.quickAdd = function (slug) {
    const p = FV.find(slug); if (!p) return;
    const dv = defaultVariant(p);
    FV.cart.add({
      key: slug + "|" + dv.variant, slug, type: "product",
      name: p.name, image: p.slug, noPhoto: !!p.noPhoto,
      variant: dv.variant, price: dv.price,
    });
    toast(`${p.name} added`, dv.variant);
    openCart();
  };
  FV.addBox = function (slug, tierLabel) {
    const b = FV.findBox(slug); if (!b) return;
    const tier = b.tiers.find((t) => t.label === tierLabel) || b.tiers[0];
    FV.cart.add({
      key: slug + "|" + tier.label, slug, type: "box",
      name: b.name, image: b.image, variant: tier.label, price: tier.price,
    });
    toast(`${b.name} added`, tier.label);
    openCart();
  };

  /* ------------------------------------------------------------------ *
   * Shell — announcement, header, footer, drawers, toast host
   * ------------------------------------------------------------------ */
  const NAV = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "hosting.html", label: "The Art of Hosting", key: "hosting" },
    { href: "products.html", label: "Products", key: "products" },
  ];

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }

  function buildHeader() {
    const page = document.body.dataset.page || "";
    const navHtml = NAV.map((n) => `<li><a href="${n.href}" ${n.key === page ? 'aria-current="page"' : ""}>${n.label}</a></li>`).join("");
    return `
    <header class="site-header" id="siteHeader">
      <div class="header-inner">
        <a class="brand" href="index.html" aria-label="Fresh Valley — home">
          <img class="logo logo--dark" src="assets/img/logo.png" alt="Fresh Valley" onerror="this.style.display='none';this.parentNode.querySelector('.brand-fallback').style.display='inline'">
          <img class="logo logo--light" src="assets/img/logo-cream.png" alt="" aria-hidden="true">
          <span class="brand-fallback" style="display:none">Fresh Valley</span>
        </a>
        <a class="h-greet" href="index.html" aria-label="Fresh Valley — home">
          <span class="h-avatar"><img src="assets/img/icon-192.png" alt=""></span>
          <span><span class="gl1">${greeting()}!</span><br><span class="gl2">Fresh Valley</span></span>
        </a>
        <nav class="main-nav" aria-label="Primary"><ul>${navHtml}</ul></nav>
        <div class="header-actions">
          <a class="icon-btn" href="account.html" aria-label="Account">${I.user}</a>
          <a class="icon-btn" href="wishlist.html" aria-label="Wishlist" id="wishLink">${I.heart}<span class="count" id="wishCount">0</span></a>
          <button class="icon-btn" id="cartBtn" aria-label="Cart">${I.bag}<span class="count" id="cartCount">0</span></button>
          <button class="icon-btn icon-btn--search" id="searchBtn" aria-label="Search">${I.search}</button>
        </div>
      </div>
    </header>`;
  }

  function buildFooter() {
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-cta">
          <div class="inner">
            <div>
              <p class="eyebrow">The Fresh Valley Letter</p>
              <h2>Eat with the season.<br>Host a little better.</h2>
            </div>
            <div>
              <p class="muted" style="color:var(--on-dark-muted)">A quiet note each month — what is at its peak, a recipe worth keeping, and an idea for your next table. No noise.</p>
              <form class="newsletter-form" data-newsletter>
                <input class="input" type="email" required placeholder="Your email address" aria-label="Email address">
                <button class="btn btn--brass" type="submit">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
        <div class="footer-grid">
          <div class="footer-brand">
            <span class="brand-fallback" style="font-family:var(--font-display);font-size:1.6rem">Fresh Valley</span>
            <p>Export-grade produce, curated for modern hosting and a quieter kind of luxury. Grown well, graded by hand, delivered with care.</p>
          </div>
          <div class="footer-col">
            <h5>Shop</h5>
            <a href="products.html">All Produce</a>
            <a href="products.html?cat=boxes">Boxes</a>
            <a href="products.html?cat=seasonal">Seasonal</a>
            <a href="products.html?cat=organic-reserve">Organic Reserve</a>
            <a href="products.html?collection=best-sellers">Best Sellers</a>
          </div>
          <div class="footer-col">
            <h5>The Brand</h5>
            <a href="about.html">About Us</a>
            <a href="hosting.html">The Art of Hosting</a>
            <a href="journal.html">Journal</a>
            <a href="about.html#quality">Behind the Quality</a>
          </div>
          <div class="footer-col">
            <h5>Care</h5>
            <a href="contact.html">Contact</a>
            <a href="policies.html">Company Policies</a>
            <a href="terms.html">Terms of Use</a>
            <a href="contact.html#areas">Delivery Areas</a>
          </div>
          <div class="footer-col">
            <h5>Account</h5>
            <a href="account.html">My Account</a>
            <a href="account.html#orders">Orders</a>
            <a href="wishlist.html">Wishlist</a>
            <a href="account.html#subscriptions">Subscriptions</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Fresh Valley. Cairo, Egypt. All rights reserved.</span>
          <div class="pay-row">
            <span>Visa</span><span>Mastercard</span><span>Apple Pay</span><span>Wallet</span><span>Cash</span>
          </div>
          <div class="social-row">
            <a href="#" aria-label="Instagram">${I.instagram}</a>
            <a href="#" aria-label="Facebook">${I.facebook}</a>
            <a href="#" aria-label="TikTok">${I.tiktok}</a>
          </div>
        </div>
      </div>
    </footer>`;
  }

  function buildDrawers() {
    return `
    <div class="scrim" id="scrim"></div>

    <aside class="drawer drawer--left" id="navDrawer" aria-label="Menu" aria-hidden="true">
      <div class="drawer-head">
        <span class="brand-fallback" style="font-family:var(--font-display);font-size:1.4rem;color:var(--forest)">Fresh Valley</span>
        <button class="icon-btn" data-close aria-label="Close menu">${I.close}</button>
      </div>
      <div class="drawer-body">
        <nav class="mobile-nav" aria-label="Mobile">
          ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
          <a href="about.html">About</a>
          <a href="journal.html">Journal</a>
          <a href="contact.html">Contact</a>
        </nav>
      </div>
      <div class="drawer-foot">
        <a class="btn btn--block" href="products.html">Shop all produce ${I.arrow}</a>
      </div>
    </aside>

    <aside class="drawer" id="cartDrawer" aria-label="Cart" aria-hidden="true">
      <div class="drawer-head">
        <h3>Your Selection</h3>
        <button class="icon-btn" data-close aria-label="Close cart">${I.close}</button>
      </div>
      <div class="drawer-body" id="cartBody"></div>
      <div class="drawer-foot" id="cartFoot"></div>
    </aside>

    <div class="search-overlay" id="searchOverlay" aria-hidden="true">
      <div class="search-panel">
        <div class="search-bar">
          ${I.search}
          <input type="search" id="searchInput" placeholder="Search produce, boxes, herbs…" aria-label="Search" autocomplete="off">
          <button class="icon-btn" data-close aria-label="Close search">${I.close}</button>
        </div>
        <div class="search-results" id="searchResults"></div>
      </div>
    </div>

    <div class="toast-wrap" id="toastWrap" aria-live="polite"></div>

    <nav class="app-bar" aria-label="App navigation">
      <a href="index.html" data-ab="home">${I.home}<span>Home</span></a>
      <a href="products.html" data-ab="products">${I.grid}<span>Shop</span></a>
      <button id="abCart" class="ab-center" aria-label="Cart">${I.bag}<span class="ab-count" id="abCartCount">0</span></button>
      <a href="wishlist.html" data-ab="wishlist">${I.heart}<span>Saved</span></a>
      <a href="account.html" data-ab="account">${I.user}<span>Account</span></a>
    </nav>`;
  }

  /* ------------------------------------------------------------------ *
   * Drawer / overlay control
   * ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  let openPanel = null;

  function lockScroll(on) { document.body.classList.toggle("no-scroll", on); }
  function closeAll() {
    $("#scrim")?.classList.remove("open");
    $$(".drawer").forEach((d) => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
    $("#searchOverlay")?.classList.remove("open");
    lockScroll(false); openPanel = null;
  }
  function openCart() {
    renderCartDrawer();
    $("#scrim").classList.add("open");
    const d = $("#cartDrawer"); d.classList.add("open"); d.setAttribute("aria-hidden", "false");
    lockScroll(true); openPanel = "cart";
  }
  function openNav() {
    $("#scrim").classList.add("open");
    const d = $("#navDrawer"); d.classList.add("open"); d.setAttribute("aria-hidden", "false");
    lockScroll(true); openPanel = "nav";
  }
  function openSearch() {
    const o = $("#searchOverlay"); o.classList.add("open"); o.setAttribute("aria-hidden", "false");
    lockScroll(true); openPanel = "search";
    setTimeout(() => $("#searchInput").focus(), 60);
  }
  FV.openCart = openCart;

  /* ------------------------------------------------------------------ *
   * Cart UI
   * ------------------------------------------------------------------ */
  function lineImage(it) {
    if (it.noPhoto) return `<div class="c-media" style="display:grid;place-items:center;background:var(--forest);color:var(--brass)">${I.leaf2}</div>`;
    return `<div class="c-media"><img src="${FV.img(it.image)}" alt="" loading="lazy"></div>`;
  }
  function renderCartDrawer() {
    const body = $("#cartBody"), foot = $("#cartFoot");
    if (!cart.length) {
      body.innerHTML = `<div class="empty-state">${I.bag}<p style="margin-top:.5rem">Your selection is empty.</p><a class="btn btn--outline btn--sm mt-md" href="products.html" style="margin-top:1rem">Browse produce</a></div>`;
      foot.innerHTML = ""; return;
    }
    body.innerHTML = cart.map((it) => `
      <div class="cart-line">
        ${lineImage(it)}
        <div>
          <div class="c-name">${it.name}</div>
          <div class="c-var">${it.variant}</div>
          <div class="qty" style="margin-top:.5rem;transform:scale(.86);transform-origin:left">
            <button data-dec="${it.key}" aria-label="Decrease">${I.minus}</button>
            <input value="${it.qty}" readonly aria-label="Quantity">
            <button data-inc="${it.key}" aria-label="Increase">${I.plus}</button>
          </div>
          <button class="c-remove" data-rm="${it.key}">Remove</button>
        </div>
        <div class="c-price">${money(it.price * it.qty)}</div>
      </div>`).join("");

    const sub = FV.cart.subtotal();
    const freeAt = 600, remain = Math.max(0, freeAt - sub);
    foot.innerHTML = `
      ${remain > 0
        ? `<p style="font-size:var(--step--2);color:var(--text-muted);margin-bottom:.6rem">Add <strong>${money(remain)}</strong> more for complimentary delivery.</p>`
        : `<p style="font-size:var(--step--2);color:var(--forest-mid);margin-bottom:.6rem">${I.check} You've earned complimentary delivery.</p>`}
      <div class="sum-row"><span class="muted">Subtotal</span><span>${money(sub)}</span></div>
      <div class="sum-row"><span class="muted">Delivery</span><span>${remain > 0 ? "Calculated at checkout" : "Free"}</span></div>
      <a class="btn btn--block btn--lg" href="checkout.html" style="margin-top:1rem">Checkout ${I.arrow}</a>
      <a class="btn btn--ghost-light btn--block btn--sm" href="cart.html" style="margin-top:.6rem;--fg:var(--forest);--bd:var(--line)">View full cart</a>`;
  }

  function updateCartUI() {
    const c = FV.cart.count();
    const el = $("#cartCount");
    if (el) { el.textContent = c; el.classList.toggle("show", c > 0); }
    const ab = $("#abCartCount");
    if (ab) { ab.textContent = c; ab.classList.toggle("show", c > 0); }
    if (openPanel === "cart") renderCartDrawer();
    document.dispatchEvent(new CustomEvent("fv:cart"));
  }
  function updateWishUI() {
    const c = wish.length;
    const el = $("#wishCount");
    if (el) { el.textContent = c; el.classList.toggle("show", c > 0); }
    $$(".wish-btn").forEach((b) => {
      const on = FV.wish.has(b.dataset.wish);
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on);
    });
    document.dispatchEvent(new CustomEvent("fv:wish"));
  }
  FV.updateWishUI = updateWishUI;

  /* ------------------------------------------------------------------ *
   * Toast
   * ------------------------------------------------------------------ */
  function toast(msg, sub) {
    const w = $("#toastWrap"); if (!w) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `${I.check}<span>${msg}${sub ? ` · <span style="opacity:.8">${sub}</span>` : ""} &nbsp;<a href="cart.html">View cart</a></span>`;
    w.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 500); }, 3400);
  }
  FV.toast = toast;

  /* ------------------------------------------------------------------ *
   * Search
   * ------------------------------------------------------------------ */
  function runSearch(q) {
    const res = $("#searchResults"); q = q.trim().toLowerCase();
    if (!q) { res.innerHTML = `<p class="search-hint">Try “strawberry”, “hosting box”, or “dates”.</p>`; return; }
    const ps = D.products.filter((p) => (p.name + " " + p.category + " " + p.short).toLowerCase().includes(q)).slice(0, 6);
    const bs = D.boxes.filter((b) => (b.name + " " + b.tagline).toLowerCase().includes(q)).slice(0, 3);
    if (!ps.length && !bs.length) { res.innerHTML = `<p class="search-hint">No matches for “${q}”. Try another word.</p>`; return; }
    res.innerHTML = [
      ...ps.map((p) => `<a class="search-row" href="product.html?slug=${p.slug}"><img src="${p.noPhoto ? "" : FV.img(p.slug)}" alt="" onerror="this.style.visibility='hidden'"><span><strong>${p.name}</strong><em>${p.category} · ${FV.money(FV.cardPrice(p).value)} ${FV.cardPrice(p).per}</em></span></a>`),
      ...bs.map((b) => `<a class="search-row" href="product.html?box=${b.slug}"><img src="${FV.img(b.image)}" alt=""><span><strong>${b.name}</strong><em>box · from ${FV.money(b.tiers[0].price)}</em></span></a>`),
    ].join("");
  }

  /* ------------------------------------------------------------------ *
   * Reusable render helpers
   * ------------------------------------------------------------------ */
  function qualityBadge(p) {
    if ((p.badges || []).includes("export")) return `<span class="badge badge--export">Export-Grade</span>`;
    if ((p.badges || []).includes("organic")) return `<span class="badge badge--organic">Organic</span>`;
    return "";
  }
  function popTag(p) {
    if ((p.collections || []).includes("best-sellers")) return `<span class="badge badge--pop">${I.star} Bestseller</span>`;
    if ((p.badges || []).includes("seasonal")) return `<span class="badge badge--seasonal">In season</span>`;
    return "";
  }
  const cardTags = (p) => `<div class="card-tags">${qualityBadge(p)}${popTag(p)}</div>`;
  const ratingRow = (p) => `<span class="p-rating">${I.star} ${p.rating.toFixed(1)} <span class="rc">(${p.reviews})</span></span>`;

  function cardMedia(p) {
    if (p.noPhoto) {
      return `<div class="media media--herb"><div class="herb-art">${I.leaf2}<span>${p.name}</span></div>
        ${cardTags(p)}
        <button class="wish-btn" data-wish="${p.slug}" aria-label="Save ${p.name}" aria-pressed="false">${I.heart}</button></div>`;
    }
    return `<div class="media">
        <img src="${FV.thumb(p.slug)}" srcset="${FV.thumb(p.slug)} 540w, ${FV.img(p.slug)} 1000w" sizes="(max-width:640px) 48vw, (max-width:1100px) 30vw, 22vw" alt="${p.name}" loading="lazy" width="540" height="540">
        ${cardTags(p)}
        <button class="wish-btn" data-wish="${p.slug}" aria-label="Save ${p.name}" aria-pressed="false">${I.heart}</button>
      </div>`;
  }
  FV.productCardHTML = function (p) {
    const cp = FV.cardPrice(p);
    return `<article class="product-card" data-reveal>
      ${cardMedia(p)}
      <div class="info">
        <div class="p-toprow"><span class="p-origin">${p.origin}</span>${ratingRow(p)}</div>
        <h3 class="p-name"><a href="product.html?slug=${p.slug}">${p.name}</a></h3>
        <div class="p-buy">
          <span class="p-price">${FV.money(cp.value)} <span class="per">${cp.per}</span></span>
          <button class="p-add" data-add="${p.slug}" aria-label="Add ${p.name} to cart">${I.plus}</button>
        </div>
      </div>
    </article>`;
  };
  FV.boxCardHTML = function (b) {
    const from = Math.min(...b.tiers.map((t) => t.price));
    const tag = b.slug === "hosting-box" ? "Most gifted" : ((b.collections || []).includes("best-sellers") ? "Bestseller" : ((b.collections || []).includes("seasonal") ? "Limited" : ""));
    return `<article class="box-card" data-reveal>
      <a class="media" href="product.html?box=${b.slug}">
        <img src="${FV.thumb(b.image)}" srcset="${FV.thumb(b.image)} 540w, ${FV.img(b.image)} 1000w" sizes="(max-width:860px) 90vw, 32vw" alt="${b.name}" loading="lazy" width="540" height="405">
        ${tag ? `<span class="badge badge--pop b-tag">${I.star} ${tag}</span>` : ""}
      </a>
      <div class="b-body">
        <h3 class="b-name">${b.name}</h3>
        <p class="b-desc">${b.tagline}</p>
        <div class="b-foot">
          <div class="b-price"><span class="from">From</span>${FV.money(from)}</div>
          <a class="btn btn--brass btn--sm" href="product.html?box=${b.slug}">Explore</a>
        </div>
      </div>
    </article>`;
  };
  FV.reviewCardHTML = function (r) {
    const initials = r.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    return `<article class="review-card" data-reveal>
      <div class="stars" aria-label="${r.stars} out of 5">${I.star.repeat(r.stars)}</div>
      <p class="quote">“${r.text}”</p>
      <div class="r-author">
        <div class="r-avatar">${initials}</div>
        <div><div class="r-name">${r.name}</div><div class="r-meta">${r.area} · ${r.tag}</div></div>
      </div>
    </article>`;
  };
  FV.articleCardHTML = function (a) {
    return `<article class="article-card" data-reveal>
      <a class="media" href="article.html?slug=${a.slug}"><img src="${FV.img(a.image)}" alt="${a.title}" loading="lazy"></a>
      <span class="a-cat">${a.category}</span>
      <h3><a class="stretch" href="article.html?slug=${a.slug}">${a.title}</a></h3>
      <p class="muted" style="font-size:var(--step--1)">${a.excerpt}</p>
      <span class="a-meta">${a.date} · ${a.read}</span>
    </article>`;
  };

  /* ------------------------------------------------------------------ *
   * Motion — reveal on scroll
   * ------------------------------------------------------------------ */
  function observeReveals(root = document) {
    const els = $$("[data-reveal]:not(.in)", root);
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }
  FV.observeReveals = observeReveals;

  /* Bind a horizontal product rail to prev/next buttons (scroll-snap slider) */
  FV.bindRail = function (rail, prev, next) {
    if (!rail || !prev || !next) return;
    const step = () => Math.max(rail.clientWidth * 0.85, 260);
    const update = () => {
      prev.disabled = rail.scrollLeft < 10;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 10;
    };
    prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  };

  /* Count-up numbers on scroll ([data-count] with optional data-dec/suffix/prefix) */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const suffix = el.dataset.suffix || "", prefix = el.dataset.prefix || "", dur = 1500, t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = target * e;
      el.textContent = prefix + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function observeCounts(root = document) {
    const els = $$("[data-count]:not(.counted)", root);
    if (!els.length || !("IntersectionObserver" in window)) { els.forEach(animateCount); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("counted"); animateCount(e.target); io.unobserve(e.target); }
    }), { threshold: 0.5 });
    els.forEach((e) => io.observe(e));
  }
  FV.observeCounts = observeCounts;

  /* Delivery-cutoff helper — "5h 12m" until the 6pm next-day cutoff */
  FV.cutoffText = function () {
    const now = new Date(), cut = new Date(now); cut.setHours(18, 0, 0, 0);
    if (now >= cut) cut.setDate(cut.getDate() + 1);
    const d = cut - now, h = Math.floor(d / 3.6e6), m = Math.floor((d % 3.6e6) / 6e4);
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  /* Splash — app-launch moment, once per session */
  function splash() {
    if (sessionStorage.getItem("fv_splash")) return;
    sessionStorage.setItem("fv_splash", "1");
    const el = document.createElement("div");
    el.id = "fvSplash";
    el.innerHTML = `<div class="sp-inner"><img src="assets/img/logo-cream.png" alt="Fresh Valley"><span class="sp-bar"><i></i></span></div>`;
    document.body.appendChild(el);
    document.body.classList.add("no-scroll");
    const t0 = performance.now();
    const hide = () => {
      const wait = Math.max(0, 1000 - (performance.now() - t0));
      setTimeout(() => {
        el.classList.add("done");
        document.body.classList.remove("no-scroll");
        setTimeout(() => el.remove(), 650);
      }, wait);
    };
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });
  }

  /* Live social proof — subtle recent-order cards (bottom-left) */
  function startSocialProof() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const names = D.reviews.map((r) => ({ name: r.name.split(" ")[0], area: r.area }));
    const items = D.products.filter((p) => (p.collections || []).some((c) => c === "best-sellers" || c === "hosting"))
      .map((p) => p.name).concat(D.boxes.map((b) => b.name));
    const wrap = document.createElement("div"); wrap.className = "sp-feed"; document.body.appendChild(wrap);
    const pop = () => {
      const n = names[(Math.random() * names.length) | 0], it = items[(Math.random() * items.length) | 0], mins = ((Math.random() * 11) | 0) + 2;
      const el = document.createElement("div"); el.className = "sp-card";
      el.innerHTML = `<span class="sp-dot"></span><div class="sp-body"><strong>${n.name}</strong> in ${n.area}<br><span>ordered ${it} · ${mins} min ago</span></div>`;
      wrap.appendChild(el);
      requestAnimationFrame(() => el.classList.add("in"));
      setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 500); }, 5200);
    };
    (function loop() { setTimeout(() => { pop(); loop(); }, 11000 + Math.random() * 9000); })();
    setTimeout(pop, 8000);
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */
  function wire() {
    // header scroll state
    const header = $("#siteHeader");
    if (document.body.dataset.hero === "true") header.classList.add("transparent");
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

    // buttons
    $("#cartBtn")?.addEventListener("click", openCart);
    $("#abCart")?.addEventListener("click", openCart);
    // app-bar active tab
    const pg = document.body.dataset.page || "";
    $$(".app-bar [data-ab]").forEach((a) => a.setAttribute("aria-current", a.dataset.ab === pg));
    $("#menuBtn")?.addEventListener("click", openNav);
    $("#searchBtn")?.addEventListener("click", openSearch);
    $("#scrim")?.addEventListener("click", closeAll);
    $$("[data-close]").forEach((b) => b.addEventListener("click", closeAll));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

    // search input
    const si = $("#searchInput");
    si?.addEventListener("input", (e) => runSearch(e.target.value));
    runSearch("");

    // delegated clicks: add / wishlist / qty
    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add]");
      if (add) { e.preventDefault(); FV.quickAdd(add.dataset.add); return; }
      const w = e.target.closest("[data-wish]");
      if (w) { e.preventDefault(); const on = FV.wish.toggle(w.dataset.wish); if (on) toast("Saved to wishlist"); return; }
      const dec = e.target.closest("[data-dec]");
      if (dec) { const it = cart.find((i) => i.key === dec.dataset.dec); if (it) FV.cart.setQty(it.key, it.qty - 1); return; }
      const inc = e.target.closest("[data-inc]");
      if (inc) { const it = cart.find((i) => i.key === inc.dataset.inc); if (it) FV.cart.setQty(it.key, it.qty + 1); return; }
      const rm = e.target.closest("[data-rm]");
      if (rm) { FV.cart.remove(rm.dataset.rm); return; }
    });

    // newsletter
    $$("[data-newsletter]").forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault(); f.reset(); toast("Thank you — you're on the list.");
    }));

    updateCartUI(); updateWishUI(); observeReveals(); observeCounts();
    splash(); startSocialProof();
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    // Inject favicon + PWA app meta once (kept in one place rather than every page head)
    if (!document.querySelector('link[rel="icon"]')) {
      const add = (tag, attrs) => { const el = document.createElement(tag); Object.assign(el, attrs); document.head.appendChild(el); };
      add("link", { rel: "icon", type: "image/svg+xml", href: "assets/img/favicon.svg" });
      add("link", { rel: "manifest", href: "manifest.webmanifest" });
      add("link", { rel: "apple-touch-icon", href: "assets/img/icon-192.png" });
      const m1 = document.createElement("meta"); m1.name = "apple-mobile-web-app-capable"; m1.content = "yes"; document.head.appendChild(m1);
      const m2 = document.createElement("meta"); m2.name = "apple-mobile-web-app-status-bar-style"; m2.content = "black-translucent"; document.head.appendChild(m2);
      const m3 = document.createElement("meta"); m3.name = "mobile-web-app-capable"; m3.content = "yes"; document.head.appendChild(m3);
    }
    const head = document.getElementById("fv-header");
    const foot = document.getElementById("fv-footer");
    if (head) head.innerHTML = buildHeader();
    if (foot) foot.innerHTML = buildFooter();
    document.body.insertAdjacentHTML("beforeend", buildDrawers());
    wire();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
