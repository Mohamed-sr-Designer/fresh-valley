# Fresh Valley — Super Admin Console

A full dashboard to run the whole storefront: orders, customers, prices,
analytics, theme and content. Built in the same framework-free stack as the
site (HTML + `admin.css` + `admin.js`), styled after the Nexus reference.

## Open it

```
/admin/login.html
```

Demo sign-in: **admin@freshvalley.eg** / **fresh-admin** (or any email + a 4+
char password). The session is kept in the browser for 7 days.

## Pages

| Page | What it does |
|------|--------------|
| **Dashboard** (`index.html`) | KPIs (revenue, orders, customers, AOV), sales-overview line chart, orders-this-week bars, sales distribution donut, recent orders, top sellers, sales by channel. Export summary report. |
| **Orders** (`orders.html`) | Filter by status/channel, search, sort. Open any order → full receipt drawer with line items, customer, fulfilment timeline. Change status, **print receipt**, **download receipt**, export all to CSV. |
| **Products** (`products.html`) | Edit **price** and **stock** inline, toggle **active** (show/hide on store) and **featured**. Sorting, search, category filter. Changes go live on the storefront instantly. Export catalog. |
| **Customers** (`customers.html`) | Everyone who registered or ordered. Filter VIP / active / pending / lead. Open a profile → stats, contact, full order history. Mark VIP. Export CSV. |
| **Analytics** (`analytics.html`) | Revenue trend, best sellers, revenue by category / area / day-of-week, repeat rate. Full export. |
| **Content** (`content.html`) | Edit hero copy & store name, announcement bar, show/hide each homepage section. |
| **Appearance** (`appearance.html`) | Recolour the whole brand with presets or colour pickers + live preview. |
| **Settings** (`settings.html`) | Store open/closed, currency, delivery fee, free-delivery threshold, tax, admin account, reports & data tools. |

## How it works (and the production note)

The storefront is a **static site**, so the console uses the browser's
`localStorage` as its database:

- **Orders** are captured at checkout (`checkout.html`) into `fv_orders`.
- **Customers** are captured on sign-up / sign-in (`account.html`) into `fv_clients`.
- Admin edits write override keys (`fv_admin_prices`, `fv_admin_theme`,
  `fv_admin_pmeta`, `fv_admin_content`, `fv_admin_settings`) which the
  storefront's `app.js` reads on every page and applies live.
- On first open the console seeds ~78 realistic demo orders and ~43 customers
  (deterministic) so analytics look real immediately. Reset/regenerate from
  **Settings → Data** or the Dashboard.

**Important:** because data lives in `localStorage`, changes are per-browser —
they do not yet sync to other visitors. To make this a real multi-user admin,
swap the `FVStore`/`FV.orders`/`FV.clients` read-write methods (and the override
readers in `app.js`) for calls to a backend API + database. The entire dashboard
UI stays exactly the same — only the data layer changes.

## Security notes

This is a **front-end demo**, so the login is a convenience gate, not a real
security boundary — auth state and the demo passwords live in the browser and a
technical user can bypass the role checks via devtools. Treat `/admin/` as
public until a real backend is added. What *is* hardened for the demo:

- **No stored XSS from customers.** Angle brackets are stripped from all
  customer-entered fields (`FV.orders.record` / `FV.clients.upsert`), and admin
  copy is rendered with `textContent`, so a malicious name/address can't run
  script in the dashboard.
- `/admin/` is `Disallow`-ed in `robots.txt` and every admin page is `noindex`.

For production you must add: server-side authentication & sessions, hashed
passwords, server-side role enforcement on every API call, CSRF protection, and
server-side input validation. The client checks here are UX, not enforcement.

## Files

```
admin/            login · index · orders · products · customers · analytics · content · appearance · settings
assets/css/admin.css   dashboard design system
assets/js/admin.js     engine: store, seed, analytics roll-ups, SVG charts, shell, auth
assets/js/app.js       storefront — now also applies admin overrides + records orders/customers
```
