import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, eq, ne, sum } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { hasRole, requireMembership } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { ClientForm } from "@/components/ClientForm";
import { getTr } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Clients") };
}

export default async function ClientsPage() {
  const { workspace, role } = await requireMembership();
  const canEdit = hasRole(role, "admin");
  const tr = await getTr();

  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      taxNumber: clients.taxNumber,
      invoiceCount: count(invoices.id),
      billedCents: sum(invoices.totalCents).mapWith(Number),
    })
    .from(clients)
    .leftJoin(invoices, and(eq(invoices.clientId, clients.id), ne(invoices.status, "draft")))
    .where(eq(clients.workspaceId, workspace.id))
    .groupBy(clients.id)
    .orderBy(asc(clients.name));

  return (
    <div className="mx-auto grid max-w-6xl gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">{tr("Clients")}</p>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">{tr("Your clients")}</h1>
        <p className="mt-1 text-sm text-muted">{rows.length === 0 ? tr("Add the people and companies you bill.") : tr(rows.length === 1 ? "{n} client" : "{n} clients", { n: rows.length })}</p>

        {rows.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface shadow-card animate-rise [animation-delay:120ms]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">{tr("Name")}</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">{tr("Email")}</th>
                  <th className="px-4 py-3 text-right font-medium">{tr("Invoices")}</th>
                  <th className="px-4 py-3 text-right font-medium">{tr("Billed")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 transition hover:bg-surface-2/70">
                    <td className="px-4 py-3">
                      <Link href={`/app/clients/${c.id}`} className="font-semibold hover:text-brand">
                        {c.name}
                      </Link>
                      {c.taxNumber && <p className="text-xs text-muted">{tr("Tax no. {n}", { n: c.taxNumber })}</p>}
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">{c.email ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.invoiceCount}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(c.billedCents ?? 0, workspace.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canEdit ? (
        <aside className="h-fit rounded-2xl border border-line bg-surface p-5 lg:mt-14">
          <h2 className="mb-3 font-semibold">{tr("New client")}</h2>
          <ClientForm />
        </aside>
      ) : (
        <p className="h-fit rounded-2xl border border-line bg-surface p-5 text-sm text-muted lg:mt-14">{tr("You have read-only access. Ask an admin to add clients.")}</p>
      )}
    </div>
  );
}
