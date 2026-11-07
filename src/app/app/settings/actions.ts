"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { workspaceSchema } from "@/lib/workspace-schema";
import { activityInsert } from "@/lib/activity";

export type SettingsState = { error?: string; ok?: boolean } | undefined;

/** Owner only. Currency applies to new invoices; existing ones keep the currency they were issued in. */
export async function updateWorkspace(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { user, workspace } = await requireMembership("owner");
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.batch([
    db.update(workspaces).set(parsed.data).where(eq(workspaces.id, workspace.id)),
    activityInsert({ workspaceId: workspace.id, actorId: user.id, action: "workspace.updated", entityType: "workspace", entityId: workspace.id }),
  ]);
  revalidatePath("/app", "layout");
  return { ok: true };
}
