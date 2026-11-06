import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasRole, requireMembership } from "@/lib/session";
import { getInvoice } from "@/lib/invoices";
import { invoiceNumberLabel } from "@/lib/money";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceActions } from "./InvoiceActions";

export const metadata: Metadata = { title: "Invoice" };

const stamp = (d: Date | null) => (d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace, role } = await requireMembership();
  const found = await getInvoice(workspace.id, id);
  if (!found) notFound();
  const { invoice, client, items } = found;

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/app/invoices" className="text-sm text-muted hover:text-fg">
            ← Invoices
          </Link>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight">
            {invoiceNumberLabel(invoice.number)} <StatusBadge status={invoice.status} dueDate={invoice.dueDate} />
          </h1>
          <p className="mt-1 text-sm text-muted">
            {[stamp(invoice.sentAt) && `Sent ${stamp(invoice.sentAt)}`, stamp(invoice.paidAt) && `Paid ${stamp(invoice.paidAt)}`].filter(Boolean).join(" · ") ||
              "Draft — not sent yet"}
          </p>
        </div>
        <InvoiceActions id={invoice.id} status={invoice.status} canEdit={hasRole(role, "admin")} />
      </div>
      <InvoiceDocument workspace={workspace} client={client} invoice={invoice} items={items} />
    </div>
  );
}
