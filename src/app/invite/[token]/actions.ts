"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { signOut } from "@/auth";
import { db } from "@/db";
import { invites, memberships, users } from "@/db/schema";
import { requireUser, setCurrentWorkspace } from "@/lib/session";
import { findInvite } from "@/lib/invites";
import { activityInsert } from "@/lib/activity";
import { getUsage } from "@/lib/billing";
import { checkMemberLimit } from "@/lib/plans";
import { workspaces } from "@/db/schema";

export type AcceptState = { error?: string } | undefined;

export async function acceptInvite(token: string): Promise<AcceptState> {
  const sessionUser = await requireUser();
  const found = await findInvite(token);
  if (!found || found.state !== "valid") return { error: "This invite is no longer valid. Ask for a new link." };
  const { invite } = found;

  const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!user) redirect("/session-expired");
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return { error: `This invite was sent to ${invite.email}. Log in with that email to accept it.` };
  }

  const [existing] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, invite.workspaceId), eq(memberships.userId, user.id)))
    .limit(1);

  if (!existing) {
    // The workspace may have dropped to Free since the invite was sent. The pending invite itself holds a seat.
    const [ws] = await db.select({ plan: workspaces.plan }).from(workspaces).where(eq(workspaces.id, invite.workspaceId)).limit(1);
    const usage = await getUsage(invite.workspaceId);
    if (ws?.plan === "free" && !checkMemberLimit("free", usage.members).ok) {
      return { error: `${found.workspaceName} is on the Free plan, which is just for its owner. Ask them to upgrade to Pro.` };
    }
  }

  const now = new Date();
  // The invite is marked used only if it's still pending, so a link can't be redeemed twice.
  const claim = db
    .update(invites)
    .set({ acceptedAt: now, acceptedBy: user.id })
    .where(and(eq(invites.id, invite.id), isNull(invites.acceptedAt), isNull(invites.revokedAt)));

  if (existing) {
    await claim;
  } else {
    await db.batch([
      claim,
      db.insert(memberships).values({ workspaceId: invite.workspaceId, userId: user.id, role: invite.role }).onConflictDoNothing(),
      activityInsert({ workspaceId: invite.workspaceId, actorId: user.id, action: "member.joined", entityType: "member", entityId: user.id, meta: { role: invite.role } }),
    ]);
  }
  await setCurrentWorkspace(invite.workspaceId);
  redirect("/app?joined=1");
}

/** Signed in with the wrong account: sign out and come back to this invite. */
export async function switchAccount(token: string) {
  await signOut({ redirectTo: `/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}` });
}
