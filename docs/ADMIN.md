# Fresh Valley Admin (CMS) — v4

Open `/admin/` and sign in. Demo accounts: **owner** `admin@freshvalley.eg` / `fresh-admin`,
**staff** `designer@freshvalley.eg` / `design123`. Search anything with **Ctrl K**.

## Screens

| Area | What you can do |
|---|---|
| **Home** | KPIs with sparklines vs the previous period (sales, orders, AOV, sessions, conversion, returning customers), sales over time, things to do, live visitors, top products, sales by area, sessions by source & device, recent orders |
| **Orders** | Tabs (all / unfulfilled / open / delivered / cancelled), search, payment & area filters, sort, bulk status changes, printable receipts, CSV export. Order page: status stepper (New → Confirmed → Packed → Out for delivery → Delivered), items, payment (mark cash orders paid), timeline with team notes, customer & delivery cards, cancel / refund / duplicate / delete. **Create order** builds a manual order |
| **Products** | Status tabs, search, category filter, sort, bulk status / collections, CSV. Product editor: title & descriptions, image (media library or URL), price, compare-at price, cost → margin, stock tracking & SKU, origin / season / storage, SEO title & description with a Google preview, status, category, collections, badges, featured, 90-day sales. Built-in products are edited as overrides (reset any time); **Add product** creates new ones |
| **Boxes** | Name, tagline, description, image, what's inside, sizes & prices (add / remove tiers), stock, status |
| **Collections** | Category names & blurbs, collection membership (Best sellers, Essentials, Hosting, Seasonal, Organic Reserve) |
| **Inventory** | Track / untrack, edit stock inline, low-stock alert level, CSV |
| **Customers** | Everyone who ordered or subscribed, RFM segments (Champions, Loyal, Promising, New, Needs attention, At risk, Hibernating, Subscriber), lifetime value, profile with orders, favourite products, tags, notes and marketing consent |
| **Subscribers** | Newsletter opt-ins from the footer, checkout and accounts |
| **Inbox** | Messages from the contact page — read / unread / archive, reply by email or WhatsApp |
| **Files** | Upload images (resized in the browser); pick them anywhere an image is used |
| **Analytics · Reports · Live view** | 12 reports (sales over time / by product / category / area / payment, orders by status, AOV, new vs returning, sessions over time / by source / by device, conversion funnel) with CSV export; live activity refreshes every 10 s |
| **Discounts** | Percentage, fixed amount or free delivery; minimum order, end date, usage limit, active switch. Customers apply codes in the basket |
| **Online Store** | Theme card with live preview → **Customize**, Navigation (header menu + footer columns), Pages, Preferences (store name, announcement bar, contact, social, delivery areas, SEO titles) |
| **Settings** | General, store open/closed (maintenance screen), delivery fee / free threshold / cut-off / slots, cash on delivery, tax, users & roles, publishing (GitHub), data (demo data, export/import backup, reset) |

## Theme editor (`admin/theme.html`)

* Left: the page's sections — click to edit, drag the handle (or Alt + ↑/↓) to reorder, eye
  to hide, ⋯ for duplicate / move / remove, **Add section** for the library of 25 section
  types, expand a section to edit its blocks. *Theme settings* tab: announcement bar, header
  menu, footer text, contact, social, delivery areas, brand colours, page SEO title.
* Centre: live preview at true desktop / tablet / mobile widths; click anything in the
  preview to select it.
* Right: the selected section's or block's settings. Text supports `*olive italic*` and
  `~hand-drawn underline~`.
* Ctrl Z / Ctrl Shift Z undo & redo, Ctrl S saves. **Publish** saves and pushes live.

## Roles

| | Owner | Manager | Staff |
|---|:-:|:-:|:-:|
| Orders, products, customers, content, analytics, theme | ✓ | ✓ | ✓ |
| Discounts, settings, publishing | ✓ | ✓ | – |
| Users | ✓ | – | – |

## Where data lives

Everything is stored in this browser (`localStorage`) under the keys documented in
`docs/V4-ARCHITECTURE.md`. Demo data lives in separate `fv_demo_*` keys and never mixes with
real records. For multi-device operations run the Node server in `server/`, and publish
theme / catalog changes through **Publishing**.
