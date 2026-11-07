import type { Metadata } from "next";
import { and, asc, desc, eq, gt, isNull } from "drizzle-orm";
import { Crown, Eye, MailPlus, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { invites, memberships, users, type Role } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { canChangeRole, canLeave, canRemove, invitableRoles, ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/permissions";
import { relativeTime } from "@/lib/activity-format";
import { PageHeader } from "@/components/PageHeader";
import { card } from "@/components/ui";
import { Avatar } from "@/components/team/Avatar";
import { InviteForm } from "@/components/team/InviteForm";
import { LeaveButton, RemoveMemberButton, RevokeInviteButton, RoleSelect } from "@/components/team/TeamControls";

export const metadata: Metadata = { title: "Team" };

const ROLE_ORDER: Record<Role, number> = { owner: 0, admin: 1, member: 2 };
const ROLE_ICON = { owner: Crown, admin: ShieldCheck, member: Eye } as const;
const ROLE_BADGE: Record<Role, string> = {
  owner: "bg-gold/15 text-[#8a6417] dark:text-gold",
  admin: "bg-brand/10 text-brand",
  member: "bg-surface-2 text-muted",
};

export default async function TeamPage() {
  const { user, workspace, role } = await requireMembership();
  const canInvite = invitableRoles(role).length > 0;

  const [members, pending] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, role: memberships.role, joinedAt: memberships.createdAt })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.workspaceId, workspace.id))
      .orderBy(asc(memberships.createdAt)),
    canInvite
      ? db
          .select({ id: invites.id, email: invites.email, role: invites.role, expiresAt: invites.expiresAt, createdAt: invites.createdAt, inviter: users.name })
          .from(invites)
          .leftJoin(users, eq(users.id, invites.invitedBy))
          .where(and(eq(invites.workspaceId, workspace.id), isNull(invites.acceptedAt), isNull(invites.revokedAt), gt(invites.expiresAt, new Date())))
          .orderBy(desc(invites.createdAt))
      : Promise.resolve([]),
  ]);
  members.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.joinedAt.getTime() - b.joinedAt.getTime());
  const now = new Date();

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        label="Team"
        title="Your team"
        description={`${members.length} ${members.length === 1 ? "person" : "people"} in ${workspace.name}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-6">
          <section className={`${card} animate-rise overflow-hidden [animation-delay:100ms]`} aria-labelledby="members-heading">
            <h2 id="members-heading" className="border-b border-line px-5 py-4 font-display text-2xl">
              Members
            </h2>
            <ul className="stagger divide-y divide-line">
              {members.map((m) => {
                const isSelf = m.id === user.id;
                const RoleIcon = ROLE_ICON[m.role];
                const changeable = canChangeRole(role, m.role, m.role === "admin" ? "member" : "admin", isSelf);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-surface-2/50">
                    <Avatar name={m.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {m.name} {isSelf && <span className="ml-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">You</span>}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {m.email} · joined {relativeTime(m.joinedAt, now)}
                      </p>
                    </div>
                    {changeable ? (
                      <RoleSelect userId={m.id} name={m.name} role={m.role} />
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[m.role]}`}>
                        <RoleIcon className="size-3.5" aria-hidden /> {ROLE_LABEL[m.role]}
                      </span>
                    )}
                    {canRemove(role, m.role, isSelf) && <RemoveMemberButton userId={m.id} name={m.name} />}
                  </li>
                );
              })}
            </ul>
          </section>

          {canInvite && (
            <section className={`${card} animate-rise overflow-hidden [animation-delay:200ms]`} aria-labelledby="pending-heading">
              <h2 id="pending-heading" className="flex items-baseline justify-between border-b border-line px-5 py-4">
                <span className="font-display text-2xl">Pending invites</span>
                <span className="text-sm text-muted">{pending.length}</span>
              </h2>
              {pending.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted">No open invites. New invite links show up here until they&apos;re used or expire.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {pending.map((inv) => {
                    const days = Math.max(1, Math.ceil((inv.expiresAt.getTime() - now.getTime()) / 86_400_000));
                    return (
                      <li key={inv.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="grid size-10 place-items-center rounded-full border border-dashed border-line text-muted" aria-hidden>
                          <MailPlus className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{inv.email}</p>
                          <p className="truncate text-xs text-muted">
                            {ROLE_LABEL[inv.role]} · invited by {inv.inviter ?? "a former member"} · expires in {days} day{days === 1 ? "" : "s"}
                          </p>
                        </div>
                        <RevokeInviteButton id={inv.id} email={inv.email} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="grid content-start gap-6">
          <section className={`${card} animate-rise p-5 [animation-delay:150ms]`} aria-labelledby="invite-heading">
            <h2 id="invite-heading" className="font-display text-2xl">
              Invite a teammate
            </h2>
            {canInvite ? (
              <>
                <p className="mt-1 mb-4 text-sm text-muted">You&apos;ll get a private link to send them.</p>
                <InviteForm roles={invitableRoles(role)} />
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Only owners and admins can invite people. Ask {workspace.name}&apos;s owner if someone should join.</p>
            )}
          </section>

          <section className={`${card} animate-rise p-5 [animation-delay:250ms]`} aria-labelledby="roles-heading">
            <h2 id="roles-heading" className="font-display text-2xl">
              Roles
            </h2>
            <dl className="mt-3 grid gap-3 text-sm">
              {(["owner", "admin", "member"] as Role[]).map((r) => {
                const Icon = ROLE_ICON[r];
                return (
                  <div key={r} className="flex gap-3">
                    <dt className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${ROLE_BADGE[r]}`}>
                      <Icon className="size-3.5" aria-hidden />
                      <span className="sr-only">{ROLE_LABEL[r]}</span>
                    </dt>
                    <dd>
                      <span className="font-semibold">{ROLE_LABEL[r]}</span>
                      {r === role && <span className="ml-1.5 text-xs text-brand">(you)</span>}
                      <span className="block text-muted">{ROLE_DESCRIPTION[r]}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          {canLeave(role) && (
            <section className={`${card} animate-rise p-2 [animation-delay:300ms]`}>
              <LeaveButton workspaceName={workspace.name} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
