import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FilePen, Hourglass, TrendingUp } from "lucide-react";
import { hasRole, requireMembership } from "@/lib/session";
import { getDashboard } from "@/lib/dashboard";
import { formatMoney, invoiceNumberLabel } from "@/lib/money";
import { RevenueChart } from "@/components/RevenueChart";
import { StatusBadge } from "@/components/StatusBadge";
import { CountUp } from "@/components/CountUp";
import { PageHeader } from "@/components/PageHeader";
import { card } from "@/components/ui";
import { getTr } from "@/i18n/server";
import type { Tr } from "@/i18n/tr";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Dashboard") };
}

function change(current: number, previous: number, tr: Tr) {
  if (previous === 0) return current > 0 ? tr("First paid revenue vs last month") : tr("No paid revenue yet this month");
  const pct = Math.round(((current - previous) / previous) * 100);
  return tr("{arrow} {pct}% vs last month", { arrow: pct >= 0 ? "▲" : "▼", pct: Math.abs(pct) });
}

function greeting(tr: Tr) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Belgrade" }).format(new Date()));
  return h < 12 ? tr("Good morning") : h < 18 ? tr("Good afternoon") : tr("Good evening");
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string; joined?: string }> }) {
  const { user, workspace, role } = await requireMembership();
  const { denied, joined } = await searchParams;
  const { kpis, monthly, topClients, recent } = await getDashboard(workspace.id);
  const money = (c: number) => formatMoney(c, workspace.currency);
  const canEdit = hasRole(role, "admin");
  const yearTotal = monthly.reduce((a, m) => a + m.cents, 0);
  const topMax = Math.max(1, ...topClients.map((c) => c.billedCents));
  const tile = `${card} lift block p-5`;
  const tr = await getTr();

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        label={tr("Dashboard")}
        title={
          <>
            {greeting(tr)}, <em className="text-brand">{user.name?.split(" ")[0] ?? tr("there")}</em>
          </>
        }
        description={tr("Here's how {workspace} is doing.", { workspace: workspace.name })}
      />

      {joined && (
        <p role="status" className="animate-rise rounded-xl border border-brand/25 bg-brand/[0.07] px-4 py-3 text-sm">
          {tr("🎉 Welcome to {workspace} — you joined as {role}.", { workspace: workspace.name, role: role === "member" ? tr("a member (read-only)") : tr(`an ${role}`) })}
        </p>
      )}

      {denied && (
        <p role="alert" className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {tr("You don't have permission for that page — ask an admin of {workspace}.", { workspace: workspace.name })}
        </p>
      )}

      <section aria-label={tr("Overview")} className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={tile}>
          <p className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted uppercase">
            {tr("Revenue this month")} <TrendingUp className="size-4 text-brand" aria-hidden />
          </p>
          <p className="mt-3 font-display text-4xl leading-none">
            <CountUp value={kpis.paidThisMonth} currency={workspace.currency} />
          </p>
          <p className="mt-2 text-xs text-muted">{change(kpis.paidThisMonth, kpis.paidLastMonth, tr)}</p>
        </div>
        <Link href="/app/invoices?status=sent" className={tile}>
          <p className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted uppercase">
            {tr("Unpaid")} <Hourglass className="size-4 text-sky-600 dark:text-sky-400" aria-hidden />
          </p>
          <p className="mt-3 font-display text-4xl leading-none">
            <CountUp value={kpis.unpaidCents} currency={workspace.currency} />
          </p>
          <p className="mt-2 text-xs text-muted">
            {tr(kpis.unpaidCount === 1 ? "{n} invoice not due yet" : "{n} invoices not due yet", { n: kpis.unpaidCount })}
          </p>
        </Link>
        <Link
          href="/app/invoices?status=overdue"
          className={`lift block rounded-2xl border p-5 shadow-card ${kpis.overdueCount ? "border-stamp/30 bg-stamp/[0.06]" : "border-line bg-surface"}`}
        >
          <p className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted uppercase">
            {tr("Overdue")} <AlertTriangle className={`size-4 ${kpis.overdueCount ? "text-stamp" : "text-muted"}`} aria-hidden />
          </p>
          <p className="mt-3 font-display text-4xl leading-none">
            <CountUp value={kpis.overdueCents} currency={workspace.currency} />
          </p>
          <p className={`mt-2 text-xs ${kpis.overdueCount ? "font-semibold text-stamp" : "text-muted"}`}>
            {kpis.overdueCount ? tr(kpis.overdueCount === 1 ? "{n} invoice past due — follow up" : "{n} invoices past due — follow up", { n: kpis.overdueCount }) : tr("Nothing overdue 🎉")}
          </p>
        </Link>
        <Link href="/app/invoices?status=draft" className={tile}>
          <p className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted uppercase">
            {tr("Drafts")} <FilePen className="size-4 text-muted" aria-hidden />
          </p>
          <p className="mt-3 font-display text-4xl leading-none">
            <CountUp value={kpis.draftCount} />
          </p>
          <p className="mt-2 text-xs text-muted">{tr("waiting to be sent")}</p>
        </Link>
      </section>

      <section className={`${card} p-6 animate-rise [animation-delay:200ms]`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl">{tr("Revenue, last 12 months")}</h2>
          <p className="text-sm text-muted">
            <span className="font-semibold text-fg tabular-nums">{money(yearTotal)}</span> {tr("paid")}
          </p>
        </div>
        <RevenueChart data={monthly} currency={workspace.currency} />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section className={`${card} p-6 animate-rise [animation-delay:300ms]`}>
          <h2 className="font-display text-2xl">{tr("Top clients")}</h2>
          {topClients.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{tr("Clients appear here once you send invoices.")}</p>
          ) : (
            <ol className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4">
              {topClients.map((c, i) => (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link href={`/app/clients/${c.id}`} className="truncate font-medium hover:text-brand">
                      {c.name}
                    </Link>
                    <span className="font-semibold tabular-nums">{money(c.billedCents)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <div
                      className="h-full origin-left rounded-full bg-chart"
                      style={{ width: `${(c.billedCents / topMax) * 100}%`, animation: `grow-x 0.9s cubic-bezier(0.22,1,0.36,1) ${400 + i * 90}ms both` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">{tr("{amount} paid", { amount: money(c.paidCents) })}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={`${card} p-6 animate-rise [animation-delay:380ms]`}>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">{tr("Recent invoices")}</h2>
            <Link href="/app/invoices" className="group inline-flex items-center gap-1 text-sm font-medium text-brand">
              {tr("View all")} <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-4 rounded-xl bg-surface-2 p-4 text-sm">
              <p className="font-medium">{tr("No invoices yet")}</p>
              <p className="mt-1 text-muted">
                {canEdit ? (
                  <>
                    {tr("Start by")}{" "}
                    <Link href="/app/clients" className="font-medium text-brand hover:underline">
                      {tr("adding a client")}
                    </Link>
                    {tr(", then create your first invoice.")}
                  </>
                ) : (
                  tr("An admin hasn't created any invoices yet.")
                )}
              </p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/app/invoices/${r.id}`} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition hover:bg-surface-2">
                    <span className="w-20 shrink-0 font-semibold group-hover:text-brand">{invoiceNumberLabel(r.number)}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{r.clientName}</span>
                    <StatusBadge status={r.status} dueDate={r.dueDate} />
                    <span className="w-24 text-right font-semibold tabular-nums">{formatMoney(r.totalCents, r.currency)}</span>
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
