import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { hasRole, requireMembership } from "@/lib/session";
import { formatMoney, invoiceNumberLabel } from "@/lib/money";
import { ClientForm } from "@/components/ClientForm";
import { DeleteClientButton } from "./DeleteClientButton";
import { StatusBadge } from "@/components/StatusBadge";
import { isUuid } from "@/lib/invoices";
import { getTr } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Client") };
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace, role } = await requireMembership();
  const canEdit = hasRole(role, "admin");
  const tr = await getTr();
  if (!isUuid(id)) notFound();

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.workspaceId, workspace.id)))
    .limit(1);
  if (!client) notFound();

  const clientInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.clientId, client.id), eq(invoices.workspaceId, workspace.id)))
    .orderBy(desc(invoices.number));

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <Link href="/app/clients" className="text-sm text-muted hover:text-fg">
          {tr("← All clients")}
        </Link>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">{client.name}</h1>
        <p className="mt-1 text-sm text-muted">{[client.email, client.address, client.taxNumber && tr("Tax no. {n}", { n: client.taxNumber })].filter(Boolean).join(" · ") || tr("No contact details yet")}</p>

        <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wider text-muted uppercase">{tr("Invoices")}</h2>
        {clientInvoices.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{tr("No invoices for this client yet.")}</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface shadow-card animate-rise [animation-delay:120ms]">
            {clientInvoices.map((inv) => (
              <li key={inv.id}>
                <Link href={`/app/invoices/${inv.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-2/70">
                  <span className="font-medium">{invoiceNumberLabel(inv.number)}</span>
                  <StatusBadge status={inv.status} dueDate={inv.dueDate} />
                  <span className="ml-auto font-semibold tabular-nums">{formatMoney(inv.totalCents, inv.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit && (
        <aside className="grid h-fit gap-4 rounded-2xl border border-line bg-surface p-5 lg:mt-8">
          <h2 className="font-semibold">{tr("Edit client")}</h2>
          <ClientForm client={client} />
          <div className="border-t border-line pt-4">
            <DeleteClientButton id={client.id} hasInvoices={clientInvoices.length > 0} />
          </div>
        </aside>
      )}
    </div>
  );
}
