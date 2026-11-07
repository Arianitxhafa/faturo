"use server";

import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { workspaceSchema } from "@/lib/workspace-schema";
import { hasAnyWorkspace, requireUser, setCurrentWorkspace, userExists } from "@/lib/session";
import { activityInsert } from "@/lib/activity";

export type OnboardingState = { error?: string } | undefined;

export async function createWorkspace(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();
  if (!(await userExists(user.id))) redirect("/session-expired");
  const another = formData.get("new") === "1";
  if (!another && (await hasAnyWorkspace(user.id))) redirect("/app");
  const [{ owned }] = await db
    .select({ owned: count() })
    .from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.role, "owner")));
  if (owned >= 10) return { error: "You can own up to 10 workspaces." };

  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Create the workspace and make this user its owner in one atomic batch.
  const id = crypto.randomUUID();
  await db.batch([
    db.insert(workspaces).values({ id, ...parsed.data }),
    db.insert(memberships).values({ workspaceId: id, userId: user.id, role: "owner" }),
    activityInsert({ workspaceId: id, actorId: user.id, action: "workspace.created", entityType: "workspace", entityId: id, meta: { name: parsed.data.name } }),
  ]);
  await setCurrentWorkspace(id);
  redirect("/app");
}
