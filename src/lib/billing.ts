import "server-only";
import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { checkoutSessions, invites, invoices, memberships, payments, subscriptions, workspaces } from "@/db/schema";
import { activityInsert } from "./activity";
import { addMonths, BILLING_CURRENCY, checkInvoiceLimit, checkMemberLimit, PRO_PRICE_CENTS, renewalStep, type Plan } from "./plans";
import { formatMoney } from "./money";

const proLabel = formatMoney(PRO_PRICE_CENTS, BILLING_CURRENCY);

// ---- Provider interface -------------------------------------------------------------
// Stripe doesn't onboard businesses in Kosovo, so checkout runs on a clearly labelled simulated
// provider. A Stripe provider only has to implement this interface and call the same
// activate/renew/downgrade functions from its webhook.
export interface BillingProvider {
  name: string;
  /** Returns the URL the owner is sent to for payment. */
  startCheckout(input: { workspaceId: string; userId: string }): Promise<string>;
}

export const simulatedProvider: BillingProvider = {
  name: "simulated",
  async startCheckout({ workspaceId, userId }) {
    const [session] = await db
      .insert(checkoutSessions)
      .values({ workspaceId, createdBy: userId, priceCents: PRO_PRICE_CENTS, expiresAt: new Date(Date.now() + 30 * 60_000) })
      .returning({ id: checkoutSessions.id });
    return `/checkout/${session.id}`;
  },
};

export const billingProvider: BillingProvider = simulatedProvider;

// ---- Subscription lifecycle -----------------------------------------------------------

/** Upgrade to Pro: subscription, plan, first payment, activity and the used checkout — one atomic batch. */
export async function activatePro(input: { workspaceId: string; actorId: string; cardLabel: string; sessionId: string }) {
  const now = new Date();
  const periodEnd = addMonths(now, 1);
  const values = {
    provider: billingProvider.name,
    status: "active" as const,
    priceCents: PRO_PRICE_CENTS,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    cardLabel: input.cardLabel,
    updatedAt: now,
  };
  await db.batch([
    db.update(checkoutSessions).set({ completedAt: now }).where(and(eq(checkoutSessions.id, input.sessionId), isNull(checkoutSessions.completedAt))),
    db
      .insert(subscriptions)
      .values({ workspaceId: input.workspaceId, ...values })
      .onConflictDoUpdate({ target: subscriptions.workspaceId, set: values }),
    db.update(workspaces).set({ plan: "pro" }).where(eq(workspaces.id, input.workspaceId)),
    db.insert(payments).values({
      workspaceId: input.workspaceId,
      amountCents: PRO_PRICE_CENTS,
      currency: BILLING_CURRENCY,
      description: "Faturo Pro — monthly",
      cardLabel: input.cardLabel,
      periodStart: now,
      periodEnd,
    }),
    activityInsert({ workspaceId: input.workspaceId, actorId: input.actorId, action: "billing.upgraded", entityType: "workspace", entityId: input.workspaceId, meta: { total: proLabel } }),
  ]);
}

export async function setCancelAtPeriodEnd(workspaceId: string, actorId: string, cancel: boolean) {
  const [sub] = await db.select().from(subscriptions).where(and(eq(subscriptions.workspaceId, workspaceId), eq(subscriptions.status, "active"))).limit(1);
  if (!sub) return { error: "There's no active Pro subscription." };
  if (sub.cancelAtPeriodEnd === cancel) return {};
  await db.batch([
    db.update(subscriptions).set({ cancelAtPeriodEnd: cancel, updatedAt: new Date() }).where(eq(subscriptions.workspaceId, workspaceId)),
    activityInsert({
      workspaceId,
      actorId,
      action: cancel ? "billing.canceled" : "billing.resumed",
      entityType: "workspace",
      entityId: workspaceId,
      meta: { date: sub.currentPeriodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Belgrade" }) },
    }),
  ]);
  return {};
}

/**
 * Brings a subscription up to date: renews each period that has ended (one payment each),
 * or drops to Free when it was cancelled. Updates are conditional on the period they saw,
 * so two requests running this at once can't renew twice.
 */
export async function syncSubscription(workspaceId: string): Promise<Plan | null> {
  for (let i = 0; i < 24; i++) {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId)).limit(1);
    if (!sub) return null;
    const step = renewalStep(sub);
    if (step === "none") return sub.status === "active" ? "pro" : "free";

    // Postgres keeps microseconds, JavaScript milliseconds: compare at millisecond precision.
    const samePeriod = and(
      eq(subscriptions.workspaceId, workspaceId),
      sql`date_trunc('milliseconds', ${subscriptions.currentPeriodEnd}) = ${sub.currentPeriodEnd}`,
      eq(subscriptions.status, "active")
    );
    if (step === "downgrade") {
      const [done] = await db.update(subscriptions).set({ status: "canceled", updatedAt: new Date() }).where(samePeriod).returning({ id: subscriptions.workspaceId });
      if (done) {
        await db.batch([
          db.update(workspaces).set({ plan: "free" }).where(eq(workspaces.id, workspaceId)),
          activityInsert({ workspaceId, actorId: null, action: "billing.downgraded", entityType: "workspace", entityId: workspaceId, createdAt: sub.currentPeriodEnd }),
        ]);
        return "free";
      }
      continue; // changed under us — re-read
    }

    const next = addMonths(sub.currentPeriodEnd, 1);
    const [done] = await db.update(subscriptions).set({ currentPeriodEnd: next, updatedAt: new Date() }).where(samePeriod).returning({ id: subscriptions.workspaceId });
    if (!done) continue; // someone else renewed it — re-read
    await db.batch([
      db.insert(payments).values({
        workspaceId,
        amountCents: sub.priceCents,
        currency: BILLING_CURRENCY,
        description: "Faturo Pro — monthly renewal",
        cardLabel: sub.cardLabel,
        periodStart: sub.currentPeriodEnd,
        periodEnd: next,
        createdAt: sub.currentPeriodEnd,
      }),
      activityInsert({
        workspaceId,
        actorId: null,
        action: "billing.renewed",
        entityType: "workspace",
        entityId: workspaceId,
        meta: { total: formatMoney(sub.priceCents, BILLING_CURRENCY) },
        createdAt: sub.currentPeriodEnd,
      }),
    ]);
  }
  return "pro";
}

// ---- Usage & limits ------------------------------------------------------------------

/** Invoices created this calendar month (Kosovo time) and seats used (members + pending invites). */
export async function getUsage(workspaceId: string) {
  const thisMonth = sql`to_char(now() at time zone 'Europe/Belgrade', 'YYYY-MM')`;
  const [[inv], [mem], [pend]] = await Promise.all([
    db
      .select({ n: count() })
      .from(invoices)
      .where(and(eq(invoices.workspaceId, workspaceId), sql`to_char(${invoices.createdAt} at time zone 'Europe/Belgrade', 'YYYY-MM') = ${thisMonth}`)),
    db.select({ n: count() }).from(memberships).where(eq(memberships.workspaceId, workspaceId)),
    db
      .select({ n: count() })
      .from(invites)
      .where(and(eq(invites.workspaceId, workspaceId), isNull(invites.acceptedAt), isNull(invites.revokedAt), gt(invites.expiresAt, new Date()))),
  ]);
  return { invoicesThisMonth: inv.n, members: mem.n, pendingInvites: pend.n, seats: mem.n + pend.n };
}

export async function invoiceLimit(workspaceId: string, plan: Plan) {
  if (plan === "pro") return checkInvoiceLimit(plan, 0);
  return checkInvoiceLimit(plan, (await getUsage(workspaceId)).invoicesThisMonth);
}

export async function memberLimit(workspaceId: string, plan: Plan) {
  if (plan === "pro") return checkMemberLimit(plan, 0);
  return checkMemberLimit(plan, (await getUsage(workspaceId)).seats);
}

export async function getBilling(workspaceId: string) {
  const [[subscription], history, usage] = await Promise.all([
    db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId)).limit(1),
    db.select().from(payments).where(eq(payments.workspaceId, workspaceId)).orderBy(desc(payments.createdAt)).limit(24),
    getUsage(workspaceId),
  ]);
  return { subscription: subscription ?? null, history, usage };
}
