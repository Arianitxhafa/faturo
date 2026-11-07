import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { displayStatus, today } from "@/lib/invoice-status";
import { invoiceNumberLabel } from "@/lib/money";
import { centsToDecimal, toCsv } from "@/lib/csv";
import { getLocale, getT, getTr } from "@/i18n/server";

const TABS = ["all", "draft", "sent", "overdue", "paid"] as const;
type Tab = (typeof TABS)[number];

const stamp = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

/** CSV of the workspace's invoices (any role — accountants are usually read-only members). */
export async function GET(request: Request) {
  const { workspace } = await requireMembership();
  const status = new URL(request.url).searchParams.get("status") ?? "all";
  const tab: Tab = (TABS as readonly string[]).includes(status) ? (status as Tab) : "all";
  const now = today();

  const filters: SQL[] = [eq(invoices.workspaceId, workspace.id)];
  if (tab === "draft" || tab === "paid" || tab === "sent") filters.push(eq(invoices.status, tab));
  if (tab === "overdue") filters.push(eq(invoices.status, "sent"), lt(invoices.dueDate, now));

  const rows = await db
    .select({ invoice: invoices, clientName: clients.name, clientTax: clients.taxNumber, clientEmail: clients.email })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(and(...filters))
    .orderBy(desc(invoices.number));

  const [tr, dict, locale] = [await getTr(), await getT(), await getLocale()];
  const csv = toCsv([
    ["Number", "Status", "Client", "Client tax number", "Client email", "Issue date", "Due date", "Currency", "Subtotal", "Discount", "VAT", "Total", "Sent on", "Paid on"].map((h) => tr(h)),
    ...rows.map(({ invoice: i, clientName, clientTax, clientEmail }) => [
      invoiceNumberLabel(i.number),
      // English keeps the plain machine-friendly status; Albanian gets the translated label.
      locale === "sq" ? dict.status[displayStatus(i.status, i.dueDate, now)] : displayStatus(i.status, i.dueDate, now),
      clientName,
      clientTax,
      clientEmail,
      i.issueDate,
      i.dueDate,
      i.currency,
      centsToDecimal(i.subtotalCents),
      centsToDecimal(i.discountCents),
      centsToDecimal(i.vatCents),
      centsToDecimal(i.totalCents),
      stamp(i.sentAt),
      stamp(i.paidAt),
    ]),
  ]);

  const slug = workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="faturo-${slug}-invoices${tab === "all" ? "" : `-${tab}`}-${now}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
