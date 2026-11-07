import "server-only";
import { cache } from "react";
import { asc, and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoiceItems, invoices, memberships, workspaces } from "@/db/schema";
import { activityInsert, invoiceMeta } from "./activity";
import { isTokenShaped } from "./tokens";

/**
 * The invoice behind a public link — only while sharing is on, the invoice isn't a draft
 * and its workspace is on Pro (public links are a Pro feature).
 */
export const findSharedInvoice = cache(async (token: string) => {
  if (!isTokenShaped(token)) return null;
  const [row] = await db
    .select({ invoice: invoices, client: clients, workspace: workspaces })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .innerJoin(workspaces, eq(workspaces.id, invoices.workspaceId))
    .where(eq(invoices.shareToken, token))
    .limit(1);
  if (!row || row.invoice.status === "draft" || row.workspace.plan !== "pro") return null;
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, row.invoice.id)).orderBy(asc(invoiceItems.position));
  return { ...row, items };
}); // cache(): metadata and page share one lookup per request

/** Counts a client's view. Team members previewing their own link aren't counted. The first view is logged. */
export async function recordShareView(invoice: { id: string; workspaceId: string; number: number; totalCents: number; currency: string; shareViews: number }, clientName: string, viewerUserId?: string) {
  if (viewerUserId) {
    const [member] = await db
      .select({ id: memberships.userId })
      .from(memberships)
      .where(and(eq(memberships.workspaceId, invoice.workspaceId), eq(memberships.userId, viewerUserId)))
      .limit(1);
    if (member) return;
  }
  const bump = db
    .update(invoices)
    .set({ shareViews: sql`${invoices.shareViews} + 1`, shareLastViewedAt: new Date() })
    .where(eq(invoices.id, invoice.id));
  if (invoice.shareViews > 0) {
    await bump;
    return;
  }
  await db.batch([
    bump,
    activityInsert({ workspaceId: invoice.workspaceId, actorId: null, action: "invoice.viewed", entityType: "invoice", entityId: invoice.id, meta: invoiceMeta(invoice, clientName) }),
  ]);
}
