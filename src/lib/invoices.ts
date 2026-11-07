import "server-only";
import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoiceItems, invoices } from "@/db/schema";
import { isUuid } from "./ids";

export { isUuid };

/** One invoice with its client and items — always scoped to the caller's workspace. */
export async function getInvoice(workspaceId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ invoice: invoices, client: clients })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)))
    .limit(1);
  if (!row) return null;
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.position));
  return { ...row, items };
}

export async function nextInvoiceNumber(workspaceId: string) {
  const [{ value }] = await db.select({ value: max(invoices.number) }).from(invoices).where(eq(invoices.workspaceId, workspaceId));
  return (value ?? 0) + 1;
}

/** True for Postgres unique-violation errors (e.g. two invoices racing for the same number). */
export function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}
