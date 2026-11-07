import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireMembership } from "@/lib/session";
import { getDashboard } from "@/lib/dashboard";
import { formatMoney, invoiceNumberLabel } from "@/lib/money";
import { RevenueChart } from "@/components/RevenueChart";
import { StatusBadge } from "@/components/StatusBadge";
import { primaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "First paid revenue vs last month" : "No paid revenue yet this month";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs last month`;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { user, workspace, role } = await requireMembership();
  const { denied } = await searchParams;
  const { kpis, monthly, topClients, recent } = await getDashboard(workspace.id);
  const money = (c: number) => formatMoney(c, workspace.currency);
  const canEdit = hasRole(role, "admin");
  const yearTotal = monthly.reduce((a, m) => a + m.cents, 0);
  const topMax = Math.max(1, ...topClients.map((c) => c.billedCents));

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-rise">
        <div>
          <p className="text-sm font-medium text-brand">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Welcome, {user.name?.split(" ")[0] ?? "there"} 👋</h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s how {workspace.name} is doing.</p>
        </div>
        {canEdit && (
          <Link href="/app/invoices/new" className={primaryButton}>
            + New invoice
          </Link>
        )}
      </div>

      {denied && (
        <p role="alert" className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          You don&apos;t have permission for that page — ask an admin of {workspace.name}.
        </p>
      )}

      <section aria-label="Overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">Revenue this month</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{money(kpis.paidThisMonth)}</p>
          <p className="mt-1 text-xs text-muted">{change(kpis.paidThisMonth, kpis.paidLastMonth)}</p>
        </div>
        <Link href="/app/invoices?status=sent" className="rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/40">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">Unpaid</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{money(kpis.unpaidCents)}</p>
          <p className="mt-1 text-xs text-muted">
            {kpis.unpaidCount} invoice{kpis.unpaidCount === 1 ? "" : "s"} not due yet
          </p>
        </Link>
        <Link
          href="/app/invoices?status=overdue"
          className={`rounded-2xl border p-4 transition ${kpis.overdueCount ? "border-red-500/30 bg-red-500/5 hover:border-red-500/60" : "border-line bg-surface hover:border-brand/40"}`}
        >
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted uppercase">
            {kpis.overdueCount > 0 && <span aria-hidden>⚠</span>} Overdue
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{money(kpis.overdueCents)}</p>
          <p className={`mt-1 text-xs ${kpis.overdueCount ? "font-medium text-red-700 dark:text-red-400" : "text-muted"}`}>
            {kpis.overdueCount ? `${kpis.overdueCount} invoice${kpis.overdueCount === 1 ? "" : "s"} past due — follow up` : "Nothing overdue 🎉"}
          </p>
        </Link>
        <Link href="/app/invoices?status=draft" className="rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/40">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">Drafts</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{kpis.draftCount}</p>
          <p className="mt-1 text-xs text-muted">waiting to be sent</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Revenue — last 12 months</h2>
          <p className="text-sm text-muted">
            <span className="font-semibold text-fg tabular-nums">{money(yearTotal)}</span> paid
          </p>
        </div>
        <RevenueChart data={monthly} currency={workspace.currency} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Top clients</h2>
          {topClients.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Clients appear here once you send invoices.</p>
          ) : (
            <ol className="mt-3 grid gap-3">
              {topClients.map((c) => (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link href={`/app/clients/${c.id}`} className="truncate font-medium hover:text-brand">
                      {c.name}
                    </Link>
                    <span className="font-semibold tabular-nums">{money(c.billedCents)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <div className="h-full rounded-full bg-chart" style={{ width: `${(c.billedCents / topMax) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{money(c.paidCents)} paid</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Recent invoices</h2>
            <Link href="/app/invoices" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-3 rounded-xl bg-surface-2 p-4 text-sm">
              <p className="font-medium">No invoices yet</p>
              <p className="mt-1 text-muted">
                {canEdit ? (
                  <>
                    Start by{" "}
                    <Link href="/app/clients" className="font-medium text-brand hover:underline">
                      adding a client
                    </Link>
                    , then create your first invoice.
                  </>
                ) : (
                  "An admin hasn't created any invoices yet."
                )}
              </p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/app/invoices/${r.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-brand">
                    <span className="w-20 shrink-0 font-semibold">{invoiceNumberLabel(r.number)}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{r.clientName}</span>
                    <StatusBadge status={r.status} dueDate={r.dueDate} />
                    <span className="w-24 text-right font-semibold tabular-nums text-fg">{formatMoney(r.totalCents, r.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
