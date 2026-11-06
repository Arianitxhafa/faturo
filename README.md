# 🧾 Faturo

**Invoicing for freelancers and small businesses.** Create clients and invoices, calculate VAT automatically, download professional PDFs and always know who has paid.

> **Status:** in development — phases 1–2 of 6 done (foundation, clients & invoices). See [docs/PLAN.md](docs/PLAN.md) for the full roadmap.

## ✨ Done so far
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
- **Unit tests** for money, VAT, discounts, parsing and overdue logic (`npm test`)

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

## 👤 Author
**Arianit Xhafa** — [Portfolio](https://arianitxhafa.github.io) · [GitHub](https://github.com/Arianitxhafa) · [LinkedIn](https://www.linkedin.com/in/arianit-xhafa-910228408)
