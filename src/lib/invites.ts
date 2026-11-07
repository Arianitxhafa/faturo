import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, users, workspaces } from "@/db/schema";
import { hashToken, inviteState, isTokenShaped } from "./tokens";

/** The invite behind a link, with its workspace and inviter — or null for a malformed/unknown token. */
export async function findInvite(token: string) {
  if (!isTokenShaped(token)) return null;
  const [row] = await db
    .select({ invite: invites, workspaceName: workspaces.name, inviterName: users.name })
    .from(invites)
    .innerJoin(workspaces, eq(workspaces.id, invites.workspaceId))
    .leftJoin(users, eq(users.id, invites.invitedBy))
    .where(eq(invites.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;
  return { ...row, state: inviteState(row.invite) };
}
