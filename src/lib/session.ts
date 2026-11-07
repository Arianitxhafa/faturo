import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { memberships, users, workspaces, type Role } from "@/db/schema";
import { hasRole } from "./permissions";

export { hasRole };

/** Cookie holding the workspace the user is looking at (only a hint — membership is always re-checked). */
export const CURRENT_WORKSPACE_COOKIE = "faturo_ws";

/** The signed-in user, or a redirect to /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user as { id: string; name?: string | null; email?: string | null };
}

/** Every workspace this user belongs to, oldest membership first. */
export async function listMemberships(userId: string) {
  return db
    .select({ workspace: workspaces, role: memberships.role })
    .from(memberships)
    .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(memberships.createdAt));
}

/**
 * The single entry point for tenant-scoped access: returns the user, their current workspace and role.
 * Every query for workspace data must use `workspace.id` from here — never an id sent by the client.
 */
export async function requireMembership(minimum: Role = "member") {
  const user = await requireUser();
  const rows = await listMemberships(user.id);
  if (!rows.length) redirect((await userExists(user.id)) ? "/onboarding" : "/session-expired");

  const preferred = (await cookies()).get(CURRENT_WORKSPACE_COOKIE)?.value;
  const row = rows.find((r) => r.workspace.id === preferred) ?? rows[0];
  if (!hasRole(row.role, minimum)) redirect("/app?denied=1");
  return {
    user,
    workspace: row.workspace,
    role: row.role,
    memberships: rows.map((r) => ({ id: r.workspace.id, name: r.workspace.name, role: r.role })),
  };
}

/** False when the session outlived its user (for example a purged demo account). */
export async function userExists(userId: string) {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  return Boolean(row);
}

export async function hasAnyWorkspace(userId: string) {
  const [row] = await db.select({ id: memberships.workspaceId }).from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return Boolean(row);
}

/** Remember which workspace to open (call from a server action or route handler). */
export async function setCurrentWorkspace(workspaceId: string) {
  (await cookies()).set(CURRENT_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
