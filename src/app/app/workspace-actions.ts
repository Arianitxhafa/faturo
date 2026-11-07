"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { requireUser, setCurrentWorkspace } from "@/lib/session";
import { isUuid } from "@/lib/ids";

/** Open another workspace the user belongs to (membership is verified, never assumed). */
export async function switchWorkspace(workspaceId: string) {
  const user = await requireUser();
  if (!isUuid(workspaceId)) redirect("/app");
  const [row] = await db
    .select({ id: memberships.workspaceId })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, user.id)))
    .limit(1);
  if (row) await setCurrentWorkspace(workspaceId);
  redirect("/app");
}
