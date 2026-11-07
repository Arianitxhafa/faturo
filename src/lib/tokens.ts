import { createHash, randomBytes } from "node:crypto";

// Invite tokens: 32 random bytes in the link, only the SHA-256 hash in the database.
// A leaked database therefore can't be turned into working invite links.

export const INVITE_TTL_DAYS = 7;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Cheap shape check before touching the database. */
export function isTokenShaped(token: unknown): token is string {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

export type InviteState = "valid" | "accepted" | "revoked" | "expired";

export function inviteState(invite: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date }, now = new Date()): InviteState {
  if (invite.acceptedAt) return "accepted";
  if (invite.revokedAt) return "revoked";
  if (invite.expiresAt <= now) return "expired";
  return "valid";
}
