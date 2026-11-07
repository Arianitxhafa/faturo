"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { clients, invoiceItems, invoices, type InvoiceStatus } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { computeTotals, parseMoney, parsePercent, parseQuantity, VAT_RATES_BPS } from "@/lib/money";
import { getInvoice, isUniqueViolation, nextInvoiceNumber } from "@/lib/invoices";
import { isIsoDate, today } from "@/lib/invoice-status";

export type InvoiceFormState = { error?: string } | undefined;

// Real calendar dates only: a bare regex accepts 2026-02-31, which Postgres rejects.
const isoDate = z.string().refine(isIsoDate, "Pick a valid date.");

// Amounts are stored in 32-bit integer columns (cents); keep well inside that range.
const MAX_UNIT_PRICE_CENTS = 100_000_000; // €1,000,000.00
const MAX_QUANTITY_HUNDREDTHS = 10_000_000; // 100,000 units
const MAX_TOTAL_CENTS = 2_000_000_000; // just under 2^31

const payloadSchema = z
  .object({
    id: z.string().uuid().optional(),
    clientId: z.string().uuid("Choose a client."),
    issueDate: isoDate,
    dueDate: isoDate,
    discount: z.string().max(10),
    notes: z.string().trim().max(2000),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Every line needs a description.").max(300),
          quantity: z.string().max(20),
          unitPrice: z.string().max(20),
          vatRateBps: z.number().refine((r) => (VAT_RATES_BPS as readonly number[]).includes(r), "Unsupported VAT rate."),
        })
      )
      .min(1, "Add at least one line item.")
      .max(50, "An invoice can have at most 50 lines."),
  })
  .refine((p) => p.dueDate >= p.issueDate, "The due date can't be before the issue date.");

export async function saveInvoice(_prev: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const { user, workspace } = await requireMembership("admin");

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Something went wrong — please try again." };
  }
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  // Parse every number on the server — totals sent by the browser are never trusted.
  const discountBps = p.discount.trim() ? parsePercent(p.discount) : 0;
  if (discountBps === null) return { error: "Enter the discount as a percentage between 0 and 100." };
  const lines: { description: string; quantityHundredths: number; unitPriceCents: number; vatRateBps: number }[] = [];
  for (const [i, item] of p.items.entries()) {
    const quantityHundredths = parseQuantity(item.quantity);
    const unitPriceCents = parseMoney(item.unitPrice);
    if (!quantityHundredths) return { error: `Line ${i + 1}: enter a quantity greater than 0.` };
    if (unitPriceCents === null) return { error: `Line ${i + 1}: enter a valid price.` };
    if (quantityHundredths > MAX_QUANTITY_HUNDREDTHS) return { error: `Line ${i + 1}: the quantity is too large.` };
    if (unitPriceCents > MAX_UNIT_PRICE_CENTS) return { error: `Line ${i + 1}: the price is too large (max 1,000,000).` };
    lines.push({ description: item.description, quantityHundredths, unitPriceCents, vatRateBps: item.vatRateBps });
  }
  const totals = computeTotals(lines, discountBps);
  if (totals.subtotalCents > MAX_TOTAL_CENTS || totals.totalCents > MAX_TOTAL_CENTS) return { error: "This invoice total is too large." };

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, p.clientId), eq(clients.workspaceId, workspace.id)))
    .limit(1);
  if (!client) return { error: "Choose one of your clients." };

  const header = {
    clientId: client.id,
    issueDate: p.issueDate,
    dueDate: p.dueDate,
    discountBps,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    vatCents: totals.vatCents,
    totalCents: totals.totalCents,
    notes: p.notes || null,
    updatedAt: new Date(),
  };
  const itemRows = (invoiceId: string) =>
    lines.map((l, i) => ({ invoiceId, position: i, ...l, lineTotalCents: totals.lineTotals[i] }));

  if (p.id) {
    const existing = await getInvoice(workspace.id, p.id);
    if (!existing) return { error: "Invoice not found." };
    if (existing.invoice.status !== "draft") return { error: "Only draft invoices can be edited." };
    await db.batch([
      db.update(invoices).set(header).where(and(eq(invoices.id, p.id), eq(invoices.workspaceId, workspace.id))),
      db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, p.id)),
      db.insert(invoiceItems).values(itemRows(p.id)),
    ]);
    revalidatePath("/app/invoices");
    redirect(`/app/invoices/${p.id}`);
  }

  const id = crypto.randomUUID();
  // Numbers are sequential per workspace; retry if another request grabbed the same number.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const number = await nextInvoiceNumber(workspace.id);
      await db.batch([
        db.insert(invoices).values({ id, workspaceId: workspace.id, number, currency: workspace.currency, createdBy: user.id, ...header }),
        db.insert(invoiceItems).values(itemRows(id)),
      ]);
      break;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }
  revalidatePath("/app/invoices");
  redirect(`/app/invoices/${id}`);
}

const TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent"],
  sent: ["paid", "draft"],
  paid: ["sent"],
};

export async function setInvoiceStatus(id: string, next: InvoiceStatus) {
  const { workspace } = await requireMembership("admin");
  const found = await getInvoice(workspace.id, id);
  if (!found) return { error: "Invoice not found." };
  if (!TRANSITIONS[found.invoice.status].includes(next)) return { error: `Can't move a ${found.invoice.status} invoice to ${next}.` };

  const now = new Date();
  await db
    .update(invoices)
    .set({
      status: next,
      sentAt: next === "draft" ? null : next === "sent" && !found.invoice.sentAt ? now : found.invoice.sentAt,
      paidAt: next === "paid" ? now : null,
      updatedAt: now,
    })
    .where(and(eq(invoices.id, id), eq(invoices.workspaceId, workspace.id)));
  revalidatePath("/app/invoices");
  revalidatePath(`/app/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  const { workspace } = await requireMembership("admin");
  const found = await getInvoice(workspace.id, id);
  if (!found) return { error: "Invoice not found." };
  if (found.invoice.status !== "draft") return { error: "Only drafts can be deleted. Sent and paid invoices are kept for your records." };
  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.workspaceId, workspace.id)));
  revalidatePath("/app/invoices");
  redirect("/app/invoices");
}

export async function duplicateInvoice(id: string) {
  const { user, workspace } = await requireMembership("admin");
  const found = await getInvoice(workspace.id, id);
  if (!found) return { error: "Invoice not found." };

  const { invoice, items } = found;
  const issue = today();
  const termDays = Math.max(0, Math.round((Date.parse(invoice.dueDate) - Date.parse(invoice.issueDate)) / 86400000));
  const due = new Date(Date.parse(`${issue}T00:00:00Z`) + termDays * 86400000).toISOString().slice(0, 10);
  const newId = crypto.randomUUID();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const number = await nextInvoiceNumber(workspace.id);
      await db.batch([
        db.insert(invoices).values({
          id: newId,
          workspaceId: workspace.id,
          clientId: invoice.clientId,
          number,
          currency: invoice.currency,
          issueDate: issue,
          dueDate: due,
          discountBps: invoice.discountBps,
          subtotalCents: invoice.subtotalCents,
          discountCents: invoice.discountCents,
          vatCents: invoice.vatCents,
          totalCents: invoice.totalCents,
          notes: invoice.notes,
          createdBy: user.id,
        }),
        db.insert(invoiceItems).values(
          items.map(({ description, position, quantityHundredths, unitPriceCents, vatRateBps, lineTotalCents }) => ({
            invoiceId: newId,
            description,
            position,
            quantityHundredths,
            unitPriceCents,
            vatRateBps,
            lineTotalCents,
          }))
        ),
      ]);
      break;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }
  revalidatePath("/app/invoices");
  redirect(`/app/invoices/${newId}/edit`);
}
