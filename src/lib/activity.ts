import "server-only";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { activity, clients, invoices, users, type ActivityMeta } from "@/db/schema";
import type { Action } from "./activity-format";
import { formatMoney, invoiceNumberLabel } from "./money";

type Entry = {
  workspaceId: string;
  actorId: string | null;
  action: Action;
  entityType?: "invoice" | "client" | "member" | "invite" | "workspace";
  entityId?: string | null;
  meta?: ActivityMeta;
  createdAt?: Date;
};

/** An insert you can put inside a db.batch([...]) so the change and its log entry commit together. */
export function activityInsert(entry: Entry) {
  return db.insert(activity).values({ ...entry, meta: entry.meta ?? {} });
}

/** Details an invoice entry needs to stay readable even after the invoice is deleted. */
export function invoiceMeta(invoice: { number: number; totalCents: number; currency: string }, clientName?: string): ActivityMeta {
  return {
    number: invoiceNumberLabel(invoice.number),
    total: formatMoney(invoice.totalCents, invoice.currency),
    ...(clientName ? { client: clientName } : {}),
  };
}

/** Activity for a workspace (newest first), with the actor's name and whether the entity still exists. */
export async function getActivity(workspaceId: string, opts: { before?: Date; entityId?: string; limit?: number } = {}) {
  const limit = opts.limit ?? 40;
  const rows = await db
    .select({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      meta: activity.meta,
      createdAt: activity.createdAt,
      actorName: users.name,
      invoiceExists: invoices.id,
      clientExists: clients.id,
    })
    .from(activity)
    .leftJoin(users, eq(users.id, activity.actorId))
    .leftJoin(invoices, and(eq(activity.entityType, "invoice"), eq(invoices.id, activity.entityId), eq(invoices.workspaceId, workspaceId)))
    .leftJoin(clients, and(eq(activity.entityType, "client"), eq(clients.id, activity.entityId), eq(clients.workspaceId, workspaceId)))
    .where(
      and(
        eq(activity.workspaceId, workspaceId),
        opts.before ? lt(activity.createdAt, opts.before) : undefined,
        opts.entityId ? eq(activity.entityId, opts.entityId) : undefined
      )
    )
    .orderBy(desc(activity.createdAt), desc(activity.id))
    .limit(limit + 1);
  return {
    entries: rows.slice(0, limit).map(({ invoiceExists, clientExists, ...r }) => ({ ...r, linkable: Boolean(invoiceExists || clientExists) })),
    hasMore: rows.length > limit,
  };
}

export type ActivityEntry = Awaited<ReturnType<typeof getActivity>>["entries"][number];
