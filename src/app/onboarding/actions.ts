"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { currencyEnum, memberships, workspaces } from "@/db/schema";
import { hasAnyWorkspace, requireUser, userExists } from "@/lib/session";

export type OnboardingState = { error?: string } | undefined;

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name.").max(100),
  currency: z.enum(currencyEnum.enumValues),
  address: optional(200),
  taxNumber: optional(40),
  iban: optional(40),
});

export async function createWorkspace(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();
  if (!(await userExists(user.id))) redirect("/session-expired");
  if (await hasAnyWorkspace(user.id)) redirect("/app");

  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Create the workspace and make this user its owner in one atomic batch.
  const id = crypto.randomUUID();
  await db.batch([
    db.insert(workspaces).values({ id, ...parsed.data }),
    db.insert(memberships).values({ workspaceId: id, userId: user.id, role: "owner" }),
  ]);
  redirect("/app");
}
