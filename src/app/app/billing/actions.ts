"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { checkoutSessions } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { activatePro, billingProvider, setCancelAtPeriodEnd } from "@/lib/billing";
import { checkTestCard } from "@/lib/plans";
import { isUuid } from "@/lib/ids";

export type CheckoutState = { error?: string; field?: "number" | "expiry" | "cvc" | "name" } | undefined;

/** Owner only: open a checkout for Pro (the provider decides where that is). */
export async function startCheckout() {
  const { user, workspace } = await requireMembership("owner");
  if (workspace.plan === "pro") redirect("/app/billing");
  redirect(await billingProvider.startCheckout({ workspaceId: workspace.id, userId: user.id }));
}

const cardSchema = z.object({
  name: z.string().trim().min(2, "Enter the name on the card.").max(100),
  number: z.string().max(30),
  expiry: z.string().max(10),
  cvc: z.string().max(6),
});

export async function completeCheckout(sessionId: string, _prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const { user, workspace } = await requireMembership("owner");
  if (!isUuid(sessionId)) return { error: "This checkout link isn't valid." };
  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(and(eq(checkoutSessions.id, sessionId), eq(checkoutSessions.workspaceId, workspace.id)))
    .limit(1);
  if (!session) return { error: "This checkout belongs to another workspace." };
  if (session.completedAt) redirect("/app/billing");
  if (session.expiresAt <= new Date()) return { error: "This checkout expired. Go back to Billing and start again." };

  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, field: "name" };
  // The card details are checked and then forgotten: only the brand and last 4 digits are kept.
  const card = checkTestCard(parsed.data);
  if (!card.ok) return { error: card.error, field: card.field };

  await activatePro({ workspaceId: workspace.id, actorId: user.id, cardLabel: `${card.brand} •••• ${card.last4}`, sessionId });
  revalidatePath("/app", "layout");
  redirect("/app/billing?upgraded=1");
}

export async function cancelPro(): Promise<{ error?: string }> {
  const { user, workspace } = await requireMembership("owner");
  const result = await setCancelAtPeriodEnd(workspace.id, user.id, true);
  revalidatePath("/app/billing");
  return result;
}

export async function resumePro(): Promise<{ error?: string }> {
  const { user, workspace } = await requireMembership("owner");
  const result = await setCancelAtPeriodEnd(workspace.id, user.id, false);
  revalidatePath("/app/billing");
  return result;
}
