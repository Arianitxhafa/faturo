import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasRole, requireMembership } from "@/lib/session";
import { getInvoice } from "@/lib/invoices";
import { invoiceNumberLabel } from "@/lib/money";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { displayStatus } from "@/lib/invoice-status";
import { InvoiceActions } from "./InvoiceActions";
import { getActivity } from "@/lib/activity";
import { ActivityFeed } from "@/components/ActivityFeed";
import { card } from "@/components/ui";
import { SharePanel } from "@/components/SharePanel";
import { requestOrigin } from "@/lib/origin";
import { relativeTime } from "@/lib/activity-format";
import { getLocale, getTr } from "@/i18n/server";
import { formatDate } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Invoice") };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace, role } = await requireMembership();
  const found = await getInvoice(workspace.id, id);
  if (!found) notFound();
  const { invoice, client, items } = found;
  const [history, origin] = await Promise.all([getActivity(workspace.id, { entityId: invoice.id, limit: 20 }), requestOrigin()]);
  const [tr, locale] = [await getTr(), await getLocale()];
  const stamp = (d: Date | null) => (d ? formatDate(d, locale) : null);

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader
        label={tr("Invoice")}
        back={{ href: "/app/invoices", label: tr("Invoices") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {invoiceNumberLabel(invoice.number)} <StatusBadge status={invoice.status} dueDate={invoice.dueDate} />
          </span>
        }
        description={
          [stamp(invoice.sentAt) && tr("Sent {date}", { date: stamp(invoice.sentAt)! }), stamp(invoice.paidAt) && tr("Paid {date}", { date: stamp(invoice.paidAt)! })].filter(Boolean).join(" · ") ||
          tr("Draft for {client} — not sent yet", { client: client.name })
        }
        actions={<InvoiceActions id={invoice.id} status={invoice.status} canEdit={hasRole(role, "admin")} />}
      />
      <InvoiceDocument
        workspace={workspace}
        client={client}
        invoice={invoice}
        items={items}
        stamp={invoice.status === "paid" ? "paid" : displayStatus(invoice.status, invoice.dueDate) === "overdue" ? "overdue" : undefined}
      />
      <SharePanel
        id={invoice.id}
        status={invoice.status}
        pro={workspace.plan === "pro"}
        canEdit={hasRole(role, "admin")}
        origin={origin}
        token={invoice.shareToken}
        views={invoice.shareViews}
        lastViewed={invoice.shareLastViewedAt ? relativeTime(invoice.shareLastViewedAt, undefined, locale) : null}
      />
      {history.entries.length > 0 && (
        <section className={`${card} animate-rise p-5 sm:p-7 [animation-delay:250ms]`} aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-4 font-display text-2xl">
            {tr("History")}
          </h2>
          <ActivityFeed entries={history.entries} grouped={false} />
        </section>
      )}
    </div>
  );
}
