import "server-only";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { memberships, users, workspaces, type Role } from "@/db/schema";

const ROLE_RANK: Record<Role, number> = { member: 1, admin: 2, owner: 3 };

export function hasRole(role: Role, minimum: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** The signed-in user, or a redirect to /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user as { id: string; name?: string | null; email?: string | null };
}

/**
 * The single entry point for tenant-scoped access: returns the user, their workspace and role.
 * Every query for workspace data must use `workspace.id` from here — never an id sent by the client.
 */
export async function requireMembership(minimum: Role = "member") {
  const user = await requireUser();
  const [row] = await db
    .select({ workspace: workspaces, role: memberships.role })
    .from(memberships)
    .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
    .where(eq(memberships.userId, user.id))
    .orderBy(asc(memberships.createdAt))
    .limit(1);

  if (!row) redirect((await userExists(user.id)) ? "/onboarding" : "/session-expired");
  if (!hasRole(row.role, minimum)) redirect("/app?denied=1");
  return { user, workspace: row.workspace, role: row.role };
}

/** False when the session outlived its user (for example a purged demo account). */
export async function userExists(userId: string) {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  return Boolean(row);
}

export async function hasAnyWorkspace(userId: string) {
  const [row] = await db
    .select({ id: memberships.workspaceId })
    .from(memberships)
    .where(and(eq(memberships.userId, userId)))
    .limit(1);
  return Boolean(row);
}
