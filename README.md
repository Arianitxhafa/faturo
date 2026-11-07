# 🧾 Faturo

**Invoicing for freelancers and small businesses.** Create clients and invoices, calculate VAT automatically, download professional PDFs and always know who has paid.

> **Live:** **[faturo-two.vercel.app](https://faturo-two.vercel.app)** — click **Try the live demo** to explore a pre-filled workspace without signing up.
>
> **Status:** v1 complete — all six phases from [docs/PLAN.md](docs/PLAN.md) are built, tested end to end and live.

## ✨ Features
- Email and password accounts with **Auth.js v5** — scrypt-hashed passwords, JWT sessions, generic login errors
- **Multi-tenant workspaces** — onboarding creates a business workspace and makes you its owner
- Roles (owner / admin / member) and plans (free / pro) in the schema, enforced through one data-access helper
- Route protection with the Next.js 16 `proxy`
- App shell with dashboard
- **Clients** — create, edit, delete (blocked while they have invoices), with invoice count and billed total
- **Invoices** — line items, quantities, VAT 18 % / 8 % / 0 %, percentage discount, live totals, sequential numbering per workspace
- **Statuses** — Draft → Sent → Paid, with **Overdue** computed from the due date; filters by status
- **Duplicate** an invoice in one click; delete drafts only
- **PDF download** — server-rendered with `@react-pdf/renderer` and an embedded font, so ë, ç and € render correctly
- **Money done right** — integer cents, quantities in hundredths, VAT in basis points; the server recomputes every total
- **Dashboard** — revenue this month vs last month, unpaid and overdue totals, drafts, a 12-month revenue chart (accessible SVG with hover tooltips and a table for screen readers), top clients and recent invoices — all computed with SQL aggregates
- **One-click demo** — creates a throwaway workspace with 5 clients and a year of realistic invoices in a single atomic batch, signs the visitor in, and purges demos after 24 hours
- **Design** — custom "Paper & ink" look: serif display type, paper grain, a self-writing hero invoice, rubber stamps on paid/overdue invoices, count-up KPIs, toasts, skeletons, scroll-driven reveals, dark mode, and full `prefers-reduced-motion` support
- **Teams** — invite people by private link (only a SHA-256 hash of the token is stored; links are single-use, bound to the invited email and expire in 7 days); roles **Owner / Admin / Member** enforced on the server; change roles, remove members, leave, revoke invites
- **Multiple workspaces** — one account can belong to several businesses, with a workspace switcher
- **Activity log** — who created, edited, sent, paid or deleted what (and team changes), written in the same atomic batch as the change; a timeline per invoice
- **Plans & billing** — Free (5 invoices a month, just you) and Pro (€9/month, unlimited invoices and team), enforced on the server with upgrade prompts at each limit. Checkout, cancel at period end, resume, monthly renewals with billing history, and an automatic drop to Free after a cancellation — behind a provider interface. Stripe doesn't onboard businesses in Kosovo, so checkout runs as a clearly labelled **test-mode simulation** that accepts only Stripe's test cards (e.g. `4242 4242 4242 4242`) and stores just the card brand and last 4 digits
- **Public invoice links** (Pro) — an unguessable link where the client views the invoice, copies the IBAN and payment reference, and downloads the PDF without an account; views are counted (team previews excluded) and the first open lands in the activity log; links pause for drafts, can be turned off or rotated, and stop on the Free plan
- **CSV export** — for the accountant, respecting the current status filter: UTF-8 BOM for Excel, plain decimal amounts, and formula-injection protection (`=HYPERLINK(...)` in a client name is neutralised)
- **Settings** — business name, address, tax number, IBAN and currency
- **Login rate limiting** — 5 failed attempts per account (and 30 per IP) in 15 minutes, enforced inside Auth.js so the API endpoint is protected too
- **Unit tests** for money, VAT, discounts, parsing, overdue logic, role rules, invite tokens, redirects, rate limits, plan limits, billing periods, test cards and CSV escaping (`npm test`); end-to-end suites drive real browsers through every phase

## 🛠 Tech stack
| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Neon (serverless Postgres) |
| ORM & migrations | Drizzle ORM + drizzle-kit |
| Auth | Auth.js v5 (Credentials) |
| Validation | Zod |
| PDF | @react-pdf/renderer |
| Tests | Node test runner |

## 🚀 Run locally
```bash
npm install
cp .env.example .env.local     # add your Neon connection string and an AUTH_SECRET
npm run db:migrate             # create the tables
npm run dev
npm test                       # unit tests
```

| Script | What it does |
| --- | --- |
| `npm run db:generate` | Generate a SQL migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## ☁️ Deploy to Vercel
1. Import the GitHub repo in Vercel (framework preset: Next.js).
2. Add the environment variables `DATABASE_URL` (Neon connection string) and `AUTH_SECRET`.
3. Deploy. Migrations are applied separately with `npm run db:migrate`.

## 👤 Author
**Arianit Xhafa** — [Portfolio](https://arianitxhafa.github.io) · [GitHub](https://github.com/Arianitxhafa) · [LinkedIn](https://www.linkedin.com/in/arianit-xhafa-910228408)
