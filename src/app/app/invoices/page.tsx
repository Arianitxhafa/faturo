import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { hasRole, requireMembership } from "@/lib/session";
import { formatMoney, invoiceNumberLabel } from "@/lib/money";
import { today } from "@/lib/invoice-status";
import { StatusBadge } from "@/components/StatusBadge";
import { primaryButton, secondaryButton } from "@/components/ui";
import { FileDown } from "lucide-react";

export const metadata: Metadata = { title: "Invoices" };

const TABS = ["all", "draft", "sent", "overdue", "paid"] as const;
type Tab = (typeof TABS)[number];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { workspace, role } = await requireMembership();
  const { status } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(status ?? "") ? (status as Tab) : "all";
  const now = today();

  const filters: SQL[] = [eq(invoices.workspaceId, workspace.id)];
  if (tab === "draft" || tab === "paid") filters.push(eq(invoices.status, tab));
  if (tab === "sent") filters.push(eq(invoices.status, "sent"));
  if (tab === "overdue") filters.push(eq(invoices.status, "sent"), lt(invoices.dueDate, now));

  const rows = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      totalCents: invoices.totalCents,
      currency: invoices.currency,
      clientName: clients.name,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(and(...filters))
    .orderBy(desc(invoices.number));

  const date = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">Invoices</p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">Your invoices</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {rows.length > 0 && (
            <a href={`/app/invoices/export${tab === "all" ? "" : `?status=${tab}`}`} className={secondaryButton} download>
              <FileDown className="size-4" aria-hidden /> Export CSV
            </a>
          )}
          {hasRole(role, "admin") && (
            <Link href="/app/invoices/new" className={primaryButton}>
              + New invoice
            </Link>
          )}
        </div>
      </div>

      <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/app/invoices" : `/app/invoices?status=${t}`}
            aria-current={t === tab ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${t === tab ? "bg-surface shadow-sm" : "text-muted hover:text-fg"}`}
          >
            {t}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <span className="text-3xl">🧾</span>
          <p className="font-semibold">{tab === "all" ? "No invoices yet" : `No ${tab} invoices`}</p>
          {tab === "all" && hasRole(role, "admin") && (
            <Link href="/app/invoices/new" className="text-sm font-semibold text-brand hover:underline">
              Create your first invoice →
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card animate-rise [animation-delay:120ms]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Issued</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 transition hover:bg-surface-2/70">
                  <td className="px-4 py-3">
                    <Link href={`/app/invoices/${r.id}`} className="font-semibold hover:text-brand">
                      {invoiceNumberLabel(r.number)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.clientName}</td>
                  <td className="hidden px-4 py-3 text-muted md:table-cell">{date(r.issueDate)}</td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">{date(r.dueDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} dueDate={r.dueDate} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(r.totalCents, r.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
