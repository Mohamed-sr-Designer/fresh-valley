# Fresh Valley — Server (API + static host)

Node.js + Express. Serves the storefront, the admin console, and the REST API
from one process. Pure‑JS data store (no native build) — `npm install` works on
any host. See the full guide in **[`../HANDOFF.md`](../HANDOFF.md)**.

## Run

```bash
cp .env.example .env     # set JWT_SECRET + SEED_ADMIN_PASSWORD
npm install
npm start                # http://localhost:4000
```

Scripts: `npm start` · `npm run dev` (watch) · `npm run seed` · `npm run seed:reset`.

## Layout

```
index.js     app + security + static + routes        store.js   JSON persistence
db.js        schema + seed (from ../assets/js/data.js)  auth.js  bcrypt + JWT + roles
catalog.js   loads data.js in Node                    routes/   auth, users, products,
data/        the database file (git-ignored)                    orders, customers, site, analytics
uploads/     uploaded banner images (git-ignored)
```

## Notes
- **Roles:** `super-admin` (all) · `admin` (products, appearance, images, content).
- **Data:** `data/fresh-valley.json`. Back it up. To scale, replace `store.js`
  with a Postgres/Prisma adapter exposing the same `.all/.where/.find/.insert/.update/.remove`.
- **Security:** see HANDOFF.md §7 — set a real `JWT_SECRET`, serve over HTTPS,
  enable a CSP, set `SEED_DEMO=false`, and add a payment provider before launch.
