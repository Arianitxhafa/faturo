import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { Crown, Eye, Link2Off, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { memberships, users } from "@/db/schema";
import { findInvite } from "@/lib/invites";
import { ROLE_DESCRIPTION } from "@/lib/permissions";
import { Logo } from "@/components/Logo";
import { primaryButton, secondaryButton } from "@/components/ui";
import { AcceptInviteButton } from "./AcceptInvite";
import { switchAccount } from "./actions";
import { getT, getTr } from "@/i18n/server";
import { Preferences } from "@/components/Preferences";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Team invite"), robots: { index: false } };
}

const ROLE_ICON = { owner: Crown, admin: ShieldCheck, member: Eye } as const;

const DEAD: Record<string, { title: string; body: string }> = {
  missing: { title: "This invite link isn't valid", body: "Check that you copied the whole link, or ask your teammate for a new one." },
  accepted: { title: "This invite was already used", body: "Each invite link works once. If that wasn't you, ask for a new link." },
  revoked: { title: "This invite was cancelled", body: "The person who sent it revoked it. Ask them for a new link if you should still join." },
  expired: { title: "This invite has expired", body: "Invite links last 7 days. Ask your teammate to send a fresh one." },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Logo />
          <Preferences />
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">{children}</div>
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findInvite(token);
  const [tr, dict] = [await getTr(), await getT()];

  if (!found || found.state !== "valid") {
    const dead = DEAD[found?.state ?? "missing"];
    return (
      <Shell>
        <span className="grid size-12 place-items-center rounded-2xl bg-stamp/10 text-stamp">
          <Link2Off className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-4xl leading-none tracking-tight">{tr(dead.title)}</h1>
        <p className="mt-3 text-sm text-muted">{tr(dead.body)}</p>
        <Link href="/" className={`${secondaryButton} mt-6 w-full`}>
          {tr("Go to Faturo")}
        </Link>
      </Shell>
    );
  }

  const { invite, workspaceName, inviterName } = found;
  const RoleIcon = ROLE_ICON[invite.role];
  const session = await auth();
  const [me] = session?.user?.id ? await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1) : [];
  const [already] = me
    ? await db
        .select({ role: memberships.role })
        .from(memberships)
        .where(and(eq(memberships.workspaceId, invite.workspaceId), eq(memberships.userId, me.id)))
        .limit(1)
    : [];
  const wrongAccount = me && me.email.toLowerCase() !== invite.email.toLowerCase();
  const back = `/invite/${token}`;

  return (
    <Shell>
      <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">{tr("You're invited")}</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-tight">{tr("Join {workspace}", { workspace: workspaceName })}</h1>
      <p className="mt-3 text-sm text-muted">
        {tr("{inviter} invited {email} to work together on invoices in Faturo.", { inviter: inviterName ?? tr("A teammate"), email: invite.email })}
      </p>

      <div className="mt-5 flex gap-3 rounded-2xl border border-line bg-surface-2/60 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <RoleIcon className="size-4" aria-hidden />
        </span>
        <p className="text-sm">
          <span className="font-semibold">{tr("Role: {role}", { role: dict.roles[invite.role] })}</span>
          <span className="block text-muted">{tr(ROLE_DESCRIPTION[invite.role])}</span>
        </p>
      </div>

      <div className="mt-6">
        {!me ? (
          <div className="grid gap-2">
            <Link href={`/signup?invite=${token}`} className={`${primaryButton} w-full py-3 text-base`}>
              {tr("Create an account to join")}
            </Link>
            <Link href={`/login?callbackUrl=${encodeURIComponent(back)}`} className={`${secondaryButton} w-full`}>
              {tr("I already have an account")}
            </Link>
          </div>
        ) : wrongAccount ? (
          <div className="grid gap-3">
            <p role="alert" className="rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-800 dark:text-amber-300">
              {tr("This invite is for {invited}, but you're signed in as {me}.", { invited: invite.email, me: me.email })}
            </p>
            <form action={switchAccount.bind(null, token)}>
              <button className={`${secondaryButton} w-full`}>{tr("Log in with {email}", { email: invite.email })}</button>
            </form>
          </div>
        ) : already ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted">{tr("You're already on this team.")}</p>
            <AcceptInviteButton token={token} workspaceName={workspaceName} />
          </div>
        ) : (
          <AcceptInviteButton token={token} workspaceName={workspaceName} />
        )}
      </div>
    </Shell>
  );
}
