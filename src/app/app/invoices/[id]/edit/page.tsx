import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { getInvoice } from "@/lib/invoices";
import { formatQuantity, invoiceNumberLabel } from "@/lib/money";
import { InvoiceEditor } from "@/components/InvoiceEditor";

export const metadata: Metadata = { title: "Edit invoice" };

const plain = (cents: number) => (cents / 100).toFixed(2);

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireMembership("admin");
  const found = await getInvoice(workspace.id, id);
  if (!found) notFound();
  if (found.invoice.status !== "draft") redirect(`/app/invoices/${id}`);

  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.workspaceId, workspace.id))
    .orderBy(asc(clients.name));
  const { invoice, items } = found;

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div>
        <Link href={`/app/invoices/${id}`} className="text-sm text-muted hover:text-fg">
          ← {invoiceNumberLabel(invoice.number)}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit {invoiceNumberLabel(invoice.number)}</h1>
      </div>
      <InvoiceEditor
        clients={clientList}
        currency={invoice.currency}
        initial={{
          id: invoice.id,
          clientId: invoice.clientId,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          discount: invoice.discountBps ? String(invoice.discountBps / 100) : "",
          notes: invoice.notes ?? "",
          items: items.map((i) => ({
            description: i.description,
            quantity: formatQuantity(i.quantityHundredths).replace(/,/g, ""),
            unitPrice: plain(i.unitPriceCents),
            vatRateBps: i.vatRateBps,
          })),
        }}
      />
    </div>
  );
}
