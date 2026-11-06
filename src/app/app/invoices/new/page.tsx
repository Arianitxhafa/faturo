import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { addDays, today } from "@/lib/invoice-status";
import { InvoiceEditor } from "@/components/InvoiceEditor";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { workspace } = await requireMembership("admin");
  const { client } = await searchParams;
  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.workspaceId, workspace.id))
    .orderBy(asc(clients.name));

  const issue = today();

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div>
        <Link href="/app/invoices" className="text-sm text-muted hover:text-fg">
          ← Invoices
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New invoice</h1>
      </div>
      {clientList.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <p className="font-semibold">Add a client first</p>
          <p className="text-sm text-muted">Every invoice is addressed to a client.</p>
          <Link href="/app/clients" className="mt-1 text-sm font-semibold text-brand hover:underline">
            Add a client →
          </Link>
        </div>
      ) : (
        <InvoiceEditor
          clients={clientList}
          currency={workspace.currency}
          initial={{
            clientId: clientList.some((c) => c.id === client) ? client! : clientList.length === 1 ? clientList[0].id : "",
            issueDate: issue,
            dueDate: addDays(issue, 15),
            discount: "",
            notes: workspace.iban ? `Please pay by bank transfer to IBAN ${workspace.iban}.` : "",
            items: [],
          }}
        />
      )}
    </div>
  );
}
