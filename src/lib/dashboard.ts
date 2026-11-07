import "server-only";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { today } from "./invoice-status";
import { monthsEndingAt } from "./months";

export async function getDashboard(workspaceId: string) {
  const now = today();
  const months = monthsEndingAt(12, now);
  const thisMonth = months[11];
  const lastMonth = months[10];
  // Literal time zone (not a bound parameter) so the same expression can be used in SELECT and GROUP BY.
  const paidMonth = sql<string>`to_char(${invoices.paidAt} at time zone 'Europe/Belgrade', 'YYYY-MM')`;

  const [kpis] = await db
    .select({
      paidThisMonth: sql<number>`coalesce(sum(${invoices.totalCents}) filter (where ${invoices.status} = 'paid' and ${paidMonth} = ${thisMonth}), 0)`.mapWith(Number),
      paidLastMonth: sql<number>`coalesce(sum(${invoices.totalCents}) filter (where ${invoices.status} = 'paid' and ${paidMonth} = ${lastMonth}), 0)`.mapWith(Number),
      unpaidCents: sql<number>`coalesce(sum(${invoices.totalCents}) filter (where ${invoices.status} = 'sent' and ${invoices.dueDate} >= ${now}), 0)`.mapWith(Number),
      unpaidCount: sql<number>`count(*) filter (where ${invoices.status} = 'sent' and ${invoices.dueDate} >= ${now})`.mapWith(Number),
      overdueCents: sql<number>`coalesce(sum(${invoices.totalCents}) filter (where ${invoices.status} = 'sent' and ${invoices.dueDate} < ${now}), 0)`.mapWith(Number),
      overdueCount: sql<number>`count(*) filter (where ${invoices.status} = 'sent' and ${invoices.dueDate} < ${now})`.mapWith(Number),
      draftCount: sql<number>`count(*) filter (where ${invoices.status} = 'draft')`.mapWith(Number),
      invoiceCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(invoices)
    .where(eq(invoices.workspaceId, workspaceId));

  const monthlyRows = await db
    .select({ month: paidMonth, cents: sql<number>`sum(${invoices.totalCents})`.mapWith(Number), count: sql<number>`count(*)`.mapWith(Number) })
    .from(invoices)
    .where(and(eq(invoices.workspaceId, workspaceId), eq(invoices.status, "paid"), gte(invoices.paidAt, new Date(`${months[0]}-01T00:00:00Z`))))
    .groupBy(paidMonth);
  const byMonth = new Map(monthlyRows.map((r) => [r.month, r]));
  const monthly = months.map((m) => ({ month: m, cents: byMonth.get(m)?.cents ?? 0, count: byMonth.get(m)?.count ?? 0 }));

  const billed = sql<number>`sum(${invoices.totalCents})`.mapWith(Number);
  const topClients = await db
    .select({
      id: clients.id,
      name: clients.name,
      billedCents: billed,
      paidCents: sql<number>`coalesce(sum(${invoices.totalCents}) filter (where ${invoices.status} = 'paid'), 0)`.mapWith(Number),
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(and(eq(invoices.workspaceId, workspaceId), inArray(invoices.status, ["sent", "paid"])))
    .groupBy(clients.id)
    .orderBy(desc(billed))
    .limit(5);

  const recent = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      status: invoices.status,
      dueDate: invoices.dueDate,
      totalCents: invoices.totalCents,
      currency: invoices.currency,
      clientName: clients.name,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(eq(invoices.workspaceId, workspaceId))
    .orderBy(desc(invoices.updatedAt))
    .limit(5);

  return { kpis, monthly, topClients, recent };
}
