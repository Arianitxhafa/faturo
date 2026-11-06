# Faturo — product plan

**Invoicing for freelancers and small businesses.** Create clients and invoices, calculate VAT automatically, download professional PDFs, track what's paid and see your revenue at a glance. Teams share a workspace with roles, and a Pro plan unlocks unlimited invoices.

## Users
- **Freelancers** (designers, developers, photographers) who invoice a handful of clients each month.
- **Small businesses** with a few people, where an accountant needs read-only access.

Interface in English. Currency per workspace (EUR default, also USD and ALL). VAT rates 18 %, 8 % and 0 % per line item.

## Features

### Core (MVP)
- **Accounts** — sign up and log in with email and password (Auth.js, hashed passwords, JWT sessions).
- **Workspaces** — each business has its own isolated workspace: name, address, tax number, IBAN, currency, logo.
- **Clients** — name, email, address, tax number; reused on every invoice.
- **Invoices** — line items with quantity, price and VAT rate; automatic subtotal, VAT and total; optional discount; auto numbering (`INV-2026-0001`); issue and due dates; notes.
- **Statuses** — Draft → Sent → Paid, with **Overdue** computed automatically when the due date passes.
- **PDF** — server-generated, professional invoice PDF.
- **Dashboard** — revenue this month, unpaid and overdue totals, 12-month revenue chart, top clients.

### Team
- **Invites** by email link, roles **Owner / Admin / Member**:
  - Owner — everything, including billing and deleting the workspace
  - Admin — create and edit clients and invoices
  - Member — read-only: view invoices and download PDFs
- **Activity log** — who created, sent, paid or deleted what, and when.

### Billing (SaaS)
| | Free | Pro (€9 / month) |
|---|---|---|
| Invoices per month | 5 | Unlimited |
| Team members | 1 | Unlimited |
| Logo on PDF | — | ✓ |
| Public invoice links | — | ✓ |

- Stripe Checkout (test mode) to upgrade, Customer Portal to manage or cancel, **webhooks** keep the plan in sync on the server.
- If Stripe test mode isn't available from Kosovo, billing sits behind a provider interface and the demo uses a clearly labelled simulated checkout.

### Extras that make it feel real
- **Public invoice link** — share `faturo.app/i/abc123` so a client can view and download the invoice without an account.
- **Duplicate invoice** — one click for repeat work.
- **CSV export** — for the accountant.
- **Try the demo** — one click signs into a pre-filled demo workspace, so recruiters can explore without signing up.

### Later
- Recurring invoices (e.g. monthly hosting)
- Email sending and payment reminders
- Albanian translation

## Architecture
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Neon (serverless Postgres) |
| ORM & migrations | Drizzle ORM + drizzle-kit |
| Auth | Auth.js v5 (Credentials, JWT sessions) |
| Payments | Stripe (test mode) |
| PDF | Server-side generation |
| Tests | Node test runner — money and VAT calculations, permissions |
| Hosting | Vercel |

**Multi-tenancy & security.** Every query is scoped by `workspace_id` through one data-access helper that also checks the member's role; money is stored in integer cents; all input is validated with Zod on the server.

## Phases
1. **Foundation** — project, Neon + Drizzle, Auth.js sign-up/login, workspace onboarding, protected app shell.
2. **Clients & invoices** — CRUD, line items, VAT and totals (unit-tested), numbering, statuses, PDF.
3. **Dashboard** — revenue, unpaid, overdue, chart, top clients.
4. **Team** — invites, roles, activity log.
5. **Billing** — plans, Stripe Checkout, Customer Portal, webhooks, plan limits.
6. **Polish & launch** — public links, duplicate, CSV export, demo workspace, landing page, Vercel, README, portfolio and CV.
