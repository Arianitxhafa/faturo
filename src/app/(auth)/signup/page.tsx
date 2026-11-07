import type { Metadata } from "next";
import { Users } from "lucide-react";
import { AuthForm } from "../AuthForm";
import { signUpAction } from "../actions";
import { findInvite } from "@/lib/invites";
import { ROLE_LABEL } from "@/lib/permissions";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite: token } = await searchParams;
  const found = token ? await findInvite(token) : null;
  const invite = found?.state === "valid" ? found : null;

  return (
    <>
      <h1 className="font-display text-5xl leading-none tracking-tight">{invite ? "Join your team" : "Start invoicing"}</h1>
      <p className="mt-3 mb-8 text-muted">
        {invite ? "Create your account — you'll join right after." : "Free for up to 5 invoices a month. No card needed."}
      </p>
      {invite && (
        <p className="-mt-4 mb-6 flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/[0.07] px-3.5 py-3 text-sm">
          <Users className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <span>
            {invite.inviterName ?? "A teammate"} invited you to <strong>{invite.workspaceName}</strong> as{" "}
            <strong>{ROLE_LABEL[invite.invite.role].toLowerCase()}</strong>.
          </span>
        </p>
      )}
      <AuthForm mode="signup" action={signUpAction} invite={invite ? token : undefined} email={invite?.invite.email} />
    </>
  );
}
