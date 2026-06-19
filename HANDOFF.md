# Fresh Valley — Developer Handoff & Deployment Guide

This repo contains **two layers** that ship together:

| Layer | Tech | What it is |
|------|------|------------|
| **Frontend** | HTML + CSS + vanilla JS (no build step) | The storefront (14 pages) + the **Admin Console** (`/admin`). Works standalone as a localStorage demo. |
| **Backend** | **Node.js + Express** + a pure‑JS JSON store | A REST API + static host (`/server`). Real auth (bcrypt + JWT), roles, orders, products, customers, content/theme/image control, analytics, image upload. |

> The frontend already works on its own (great for a static/GitHub‑Pages demo). The backend turns it into a **real, multi‑device, deployable app**. A full‑stack dev can run it in two commands and deploy it to any Node host.

---

## 1. Quick start (run the whole thing locally)

```bash
cd server
cp .env.example .env          # then edit .env (set JWT_SECRET + admin password)
npm install                   # pure JS — no native build, never fails
npm start                     # → http://localhost:4000
```

Open:
- **Storefront** → http://localhost:4000
- **Admin Console** → http://localhost:4000/admin/login.html

The first run creates the database, seeds the catalog from `assets/js/data.js`, creates the Super Admin from `.env`, and (if `SEED_DEMO=true`) adds ~70 demo orders so the dashboards look alive.

**Default demo logins** (change immediately in production):
- Super Admin → `admin@freshvalley.eg` / `fresh-admin`
- Admin (Design & SEO, restricted) → created from the Admin Console → Team & Users

---

## 2. Project structure

```
/                      storefront pages (index, products, product, cart, checkout, account, …)
/admin                 admin console (login, index=dashboard, orders, products, customers,
                       analytics, content, appearance, images, users, settings)
/assets/css            styles.css (storefront)  ·  admin.css (console)
/assets/js             data.js (catalog)  ·  app.js (storefront engine)  ·  admin.js (console engine)
                       api.js (REST client for going live)
/docs                  product/design docs + ADMIN.md (how the console works)
/server                the Node/Express API + static host
   index.js            app, security middleware, static serving, route mounting
   db.js               schema + seed (from data.js + .env)
   store.js            pure‑JS JSON persistence (swap for SQL to scale)
   auth.js             bcrypt + JWT + role middleware
   catalog.js          loads data.js inside Node for seeding
   routes/             auth, users, products, orders, customers, site, analytics
   .env.example        copy to .env
   Dockerfile          container build (installs build tools, runs the server)
```

---

## 3. Backend configuration (`server/.env`)

```
PORT=4000
CORS_ORIGIN=https://your-domain.com      # comma-separate for multiple
JWT_SECRET=<64+ random hex chars>        # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_EXPIRES=7d
SEED_ADMIN_NAME=...
SEED_ADMIN_EMAIL=...
SEED_ADMIN_PASSWORD=<strong>             # used only on first run to create the owner
SEED_DEMO=false                          # false in production (no fake orders)
DB_FILE=./data/fresh-valley.json
MAX_UPLOAD_MB=3
```

---

## 4. API reference

Base path: `/api`. Auth = `Authorization: Bearer <token>` from `POST /api/auth/login`.
Roles: **super-admin** (everything) · **admin** (products, appearance, images, content only).

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/health` | – | Liveness check |
| POST | `/api/auth/login` | – | `{email,password}` → `{token,user}` |
| GET  | `/api/auth/me` | any | Current user |
| GET  | `/api/site` | – | `{content,theme,images,settings}` for the storefront |
| GET  | `/api/products` | – | Catalog with effective prices & stock |
| POST | `/api/orders` | – | **Checkout.** Totals recomputed server‑side |
| PATCH| `/api/products/:slug` | admin | `{price?,stock?,active?,featured?}` |
| PATCH| `/api/site/content` | admin | Merge storefront copy |
| PUT  | `/api/site/theme` | admin | Replace colour palette |
| PATCH| `/api/site/images` | admin | `{key,url}` banner override |
| POST | `/api/site/images/upload` | admin | multipart `file`+`key` → `{url}` |
| GET  | `/api/orders` `?status&channel&q` | super-admin | List/filter orders |
| GET  | `/api/orders/:id` | super-admin | One order |
| PATCH| `/api/orders/:id` | super-admin | `{status}` |
| GET  | `/api/customers` | super-admin | CRM list (merged with order activity) |
| PATCH| `/api/customers/:id` | super-admin | Edit customer |
| PATCH| `/api/site/settings` | super-admin | Store rules (open/closed, delivery, currency…) |
| GET  | `/api/analytics/summary` | super-admin | KPIs, revenue series, top products, breakdowns |
| GET/POST/PATCH/DELETE | `/api/users` | super-admin | Manage the team |

---

## 5. Frontend integration map (go from demo → live)

The frontend is intentionally decoupled: every admin/store data call is a localStorage read/write today. To go live, replace those with the matching `FVAPI` call (`assets/js/api.js`). They map 1:1:

| Demo (localStorage) | Live (`FVAPI`) |
|---|---|
| `ADMIN.authUser()` / `login.html` | `FVAPI.login(email, pass)` |
| `ADMIN.orders()` | `await FVAPI.orders.list()` |
| `ADMIN.updateOrder(id,{status})` | `FVAPI.orders.setStatus(id, status)` |
| `ADMIN.clients()` | `await FVAPI.customers.list()` |
| `ADMIN.setPrice/​setPmeta` | `FVAPI.catalog.update(slug, {...})` |
| `ADMIN.setContent / setTheme / setImage` | `FVAPI.content.save / theme / setImage / uploadImage` |
| `ADMIN.users / addUser / …` | `FVAPI.users.*` |
| `ADMIN.kpis()` etc. | `await FVAPI.analytics()` |
| storefront `FV.orders.record()` (checkout) | `FVAPI.checkout(order)` |
| storefront overrides (prices/theme/content/images) | `await FVAPI.site()` applied on load |

Because the admin pages currently use **synchronous** reads, the live wiring makes each page `async` (fetch on load, then render). The render functions don't change — only the data source. Estimated effort: ~1–2 days for a mid‑level full‑stack dev.

---

## 6. Deployment

The Node server **hosts both the API and the static site**, so you deploy one process.

**Option A — VPS (Ubuntu) with PM2 + Nginx + HTTPS**
```bash
cd server && npm install --omit=dev
pm2 start index.js --name fresh-valley
pm2 save && pm2 startup
```
Put Nginx in front, proxy `:443 → :4000`, and issue a free TLS cert with certbot. Point `CORS_ORIGIN` at your domain.

**Option B — Docker**
```bash
docker build -t fresh-valley -f server/Dockerfile .
docker run -d -p 4000:4000 --env-file server/.env \
  -v fv_data:/app/server/data -v fv_uploads:/app/server/uploads fresh-valley
```

**Option C — Render / Railway / Fly.io**
Root dir `server`, build `npm install`, start `node index.js`, add the env vars, attach a persistent disk for `server/data` + `server/uploads`.

Always serve over **HTTPS** and back up `server/data/` (the database) + `server/uploads/`.

---

## 7. Security — what's done vs what you must do

**Already implemented**
- Passwords hashed with **bcrypt** (cost 12); never stored or returned in plaintext.
- **JWT** access tokens; role‑based authorisation on every protected route.
- **Server‑side order totals** — client prices are never trusted at checkout.
- Input sanitisation (strips `<>` from customer fields) + admin copy rendered with `textContent` (no stored XSS).
- `helmet`, CORS allow‑list, rate limiting (login + general API), upload type/size limits.
- The `/server` folder and dotfiles are never served; `.env` is git‑ignored.

**You must configure before launch**
- Set a strong unique `JWT_SECRET` and change the seeded admin password.
- Terminate **TLS/HTTPS** (Nginx/Caddy/host).
- Add a **Content‑Security‑Policy** (currently disabled because the demo pages use inline scripts — move inline JS to files + nonces, then enable CSP in `server/index.js`).
- Set `SEED_DEMO=false`, configure backups, and add a real payment provider (Stripe/Paymob/Fawry) — the current checkout records orders but does **not** charge a card.

---

## 8. Pre‑launch checklist

- [ ] `.env` filled (secret, admin password, CORS origin, `SEED_DEMO=false`)
- [ ] Wire the frontend to `FVAPI` (section 5) and remove the localStorage demo paths
- [ ] HTTPS + domain + `CORS_ORIGIN` set
- [ ] Real payment gateway integrated at checkout
- [ ] CSP enabled, security headers verified
- [ ] DB + uploads on a persistent, backed‑up volume
- [ ] Load the admin, place a test order, fulfil it, download an invoice

Questions about how the console behaves are covered in **`docs/ADMIN.md`**.
