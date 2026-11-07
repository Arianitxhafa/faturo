"use client";

import { useEffect, useState, useTransition } from "react";
import { LogOut, UserMinus, X } from "lucide-react";
import type { Role } from "@/db/schema";
import { changeRole, leaveWorkspace, removeMember, revokeInvite } from "@/app/app/team/actions";
import { ROLE_LABEL } from "@/lib/permissions";
import { useTr } from "@/i18n/client";
import type { Tr } from "@/i18n/tr";
import { toast } from "@/components/Toaster";

/** Two-click confirmation that disarms itself after a few seconds. */
function useConfirm() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return [armed, setArmed] as const;
}

const report = (result: { error?: string } | void, success: string, tr: Tr) => {
  if (result?.error) toast(tr(result.error), "error");
  else toast(success);
};

export function RoleSelect({ userId, name, role }: { userId: string; name: string; role: Role }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={tr("Role for {name}", { name })}
      value={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as Role;
        start(async () => report(await changeRole(userId, next), tr("{name} is now {role}", { name, role: tr(ROLE_LABEL[next]).toLowerCase() }), tr));
      }}
      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold outline-none transition hover:border-muted/40 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
    >
      <option value="admin">{tr("Admin")}</option>
      <option value="member">{tr("Member")}</option>
    </select>
  );
}

export function RemoveMemberButton({ userId, name }: { userId: string; name: string }) {
  const tr = useTr();
  const [armed, setArmed] = useConfirm();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => (armed ? start(async () => report(await removeMember(userId), tr("{name} was removed", { name }), tr)) : setArmed(true))}
      aria-label={armed ? tr("Confirm removing {name}", { name }) : tr("Remove {name}", { name })}
      title={armed ? tr("Click again to remove") : tr("Remove from team")}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
        armed ? "bg-red-600 text-white" : "text-muted hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
      }`}
    >
      <UserMinus className="size-3.5" aria-hidden /> {armed ? tr("Remove?") : <span className="sr-only">{tr("Remove")}</span>}
    </button>
  );
}

export function RevokeInviteButton({ id, email }: { id: string; email: string }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => report(await revokeInvite(id), tr("Invite for {email} revoked", { email }), tr))}
      aria-label={tr("Revoke the invite for {email}", { email })}
      title={tr("Revoke invite")}
      className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}

export function LeaveButton({ workspaceName }: { workspaceName: string }) {
  const tr = useTr();
  const [armed, setArmed] = useConfirm();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => (armed ? start(async () => report(await leaveWorkspace(), tr("You left the team"), tr)) : setArmed(true))}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        armed ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-500/10 dark:text-red-400"
      }`}
    >
      <LogOut className="size-4" aria-hidden /> {armed ? tr("Click again to leave {workspace}", { workspace: workspaceName }) : tr("Leave this workspace")}
    </button>
  );
}
