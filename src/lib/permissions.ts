import type { Role } from "@/db/schema";

// Pure role rules (no database), so they can be unit-tested and shared by pages and server actions.
//   Owner  — everything, including managing roles
//   Admin  — create and edit clients and invoices, invite and remove members
//   Member — read-only: view invoices and download PDFs

export const ROLES: Role[] = ["owner", "admin", "member"];
const ROLE_RANK: Record<Role, number> = { member: 1, admin: 2, owner: 3 };

export function hasRole(role: Role, minimum: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Roles this person may hand out in an invite. Nobody can invite a second owner. */
export function invitableRoles(actor: Role): Role[] {
  if (actor === "owner") return ["admin", "member"];
  if (actor === "admin") return ["member"];
  return [];
}

/** Only the owner changes roles, never their own, and the owner role can't be given away here. */
export function canChangeRole(actor: Role, target: Role, next: Role, isSelf: boolean) {
  return actor === "owner" && !isSelf && target !== "owner" && next !== "owner" && next !== target;
}

/** Owners remove anyone but themselves; admins remove members only. Use "leave" for yourself. */
export function canRemove(actor: Role, target: Role, isSelf: boolean) {
  if (isSelf || target === "owner") return false;
  if (actor === "owner") return true;
  return actor === "admin" && target === "member";
}

/** Everyone except the owner can leave (a workspace always keeps its owner). */
export function canLeave(role: Role) {
  return role !== "owner";
}

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", member: "Member" };

export const ROLE_DESCRIPTION: Record<Role, string> = {
  owner: "Everything, including team roles and billing.",
  admin: "Creates and edits clients and invoices, invites members.",
  member: "Read-only: views invoices and downloads PDFs.",
};
