"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { invites, memberships, users, type Role } from "@/db/schema";
import { CURRENT_WORKSPACE_COOKIE, requireMembership } from "@/lib/session";
import { canChangeRole, canLeave, canRemove, invitableRoles } from "@/lib/permissions";
import { activityInsert } from "@/lib/activity";
import { createToken, INVITE_TTL_DAYS } from "@/lib/tokens";
import { isUuid } from "@/lib/ids";
import { memberLimit } from "@/lib/billing";

export type InviteFormState = { error?: string; link?: string; email?: string; role?: Role } | undefined;
type Result = { error?: string } | void;

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  role: z.enum(["admin", "member"]),
});

/** The absolute origin of this request, for building the invite link. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createInvite(_prev: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const { user, workspace, role } = await requireMembership("admin");
  const parsed = inviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, role: inviteRole } = parsed.data;
  if (!invitableRoles(role).includes(inviteRole)) return { error: "You can't invite someone with that role." };

  const [member] = await db
    .select({ id: users.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.workspaceId, workspace.id), sql`lower(${users.email}) = ${email}`))
    .limit(1);
  if (member) return { error: `${email} is already on this team.` };
  const limit = await memberLimit(workspace.id, workspace.plan);
  if (!limit.ok) return { error: limit.message };

  const { token, hash } = createToken();
  const now = new Date();
  await db.batch([
    // A new invite replaces any pending one for the same address, so only the newest link works.
    db
      .update(invites)
      .set({ revokedAt: now })
      .where(and(eq(invites.workspaceId, workspace.id), eq(invites.email, email), isNull(invites.acceptedAt), isNull(invites.revokedAt))),
    db.insert(invites).values({
      workspaceId: workspace.id,
      email,
      role: inviteRole,
      tokenHash: hash,
      invitedBy: user.id,
      expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 86_400_000),
    }),
    activityInsert({ workspaceId: workspace.id, actorId: user.id, action: "member.invited", entityType: "invite", meta: { email, role: inviteRole } }),
  ]);
  revalidatePath("/app/team");
  return { link: `${await origin()}/invite/${token}`, email, role: inviteRole };
}

export async function revokeInvite(id: string): Promise<Result> {
  const { user, workspace } = await requireMembership("admin");
  if (!isUuid(id)) return { error: "Invite not found." };
  const [invite] = await db
    .select({ email: invites.email })
    .from(invites)
    .where(and(eq(invites.id, id), eq(invites.workspaceId, workspace.id), isNull(invites.acceptedAt), isNull(invites.revokedAt), gt(invites.expiresAt, new Date())))
    .limit(1);
  if (!invite) return { error: "This invite is no longer pending." };
  await db.batch([
    db.update(invites).set({ revokedAt: new Date() }).where(and(eq(invites.id, id), eq(invites.workspaceId, workspace.id))),
    activityInsert({ workspaceId: workspace.id, actorId: user.id, action: "invite.revoked", entityType: "invite", entityId: id, meta: { email: invite.email } }),
  ]);
  revalidatePath("/app/team");
}

async function findMember(workspaceId: string, userId: string) {
  if (!isUuid(userId)) return null;
  const [row] = await db
    .select({ role: memberships.role, name: users.name, email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function changeRole(userId: string, next: Role): Promise<Result> {
  const { user, workspace, role } = await requireMembership("admin");
  const target = await findMember(workspace.id, userId);
  if (!target) return { error: "That person isn't on this team." };
  if (!canChangeRole(role, target.role, next, userId === user.id)) return { error: "Only the owner can change roles." };

  await db.batch([
    db.update(memberships).set({ role: next }).where(and(eq(memberships.workspaceId, workspace.id), eq(memberships.userId, userId))),
    activityInsert({
      workspaceId: workspace.id,
      actorId: user.id,
      action: "member.role_changed",
      entityType: "member",
      entityId: userId,
      meta: { name: target.name, from: target.role, to: next },
    }),
  ]);
  revalidatePath("/app/team");
}

export async function removeMember(userId: string): Promise<Result> {
  const { user, workspace, role } = await requireMembership("admin");
  const target = await findMember(workspace.id, userId);
  if (!target) return { error: "That person isn't on this team." };
  if (!canRemove(role, target.role, userId === user.id)) {
    return { error: target.role === "owner" ? "The owner can't be removed." : "You don't have permission to remove this person." };
  }

  await db.batch([
    db.delete(memberships).where(and(eq(memberships.workspaceId, workspace.id), eq(memberships.userId, userId))),
    activityInsert({ workspaceId: workspace.id, actorId: user.id, action: "member.removed", entityType: "member", entityId: userId, meta: { name: target.name, email: target.email } }),
  ]);
  revalidatePath("/app/team");
}

export async function leaveWorkspace(): Promise<Result> {
  const { user, workspace, role } = await requireMembership();
  if (!canLeave(role)) return { error: "The owner can't leave their own workspace." };

  await db.batch([
    db.delete(memberships).where(and(eq(memberships.workspaceId, workspace.id), eq(memberships.userId, user.id))),
    activityInsert({ workspaceId: workspace.id, actorId: user.id, action: "member.left", entityType: "member", entityId: user.id }),
  ]);
  (await cookies()).delete(CURRENT_WORKSPACE_COOKIE);
  redirect("/app");
}
