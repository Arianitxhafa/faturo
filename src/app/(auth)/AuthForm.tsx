"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inputClass, primaryButton } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import type { AuthState } from "./actions";
import { useTr } from "@/i18n/client";

type Props = {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  /** Where to go after logging in (validated on the server). */
  callbackUrl?: string;
  /** Invite token when signing up from an invite link. */
  invite?: string;
  /** Prefilled email, e.g. the address an invite was sent to. */
  email?: string;
};

export function AuthForm({ mode, action, callbackUrl, invite, email }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const signup = mode === "signup";
  const tr = useTr();

  return (
    <form action={formAction} className="grid gap-4">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      {invite && <input type="hidden" name="invite" value={invite} />}
      {signup && (
        <label className="grid gap-1.5 text-sm font-medium">
          {tr("Your name")}
          <input name="name" required autoComplete="name" defaultValue={state?.values?.name} placeholder="Arbën Krasniqi" className={inputClass} />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium">
        {tr("Email")}
        <input name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email ?? email} placeholder="you@business.com" className={inputClass} />
      </label>
      <PasswordInput
        label={tr("Password")}
        autoComplete={signup ? "new-password" : "current-password"}
        minLength={signup ? 8 : undefined}
        placeholder={signup ? tr("At least 8 characters") : "••••••••"}
      />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {tr(state.error)}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${primaryButton} mt-1`}>
        {pending ? tr("Please wait…") : signup ? tr("Create account") : tr("Log in")}
      </button>

      <p className="text-center text-sm text-muted">
        {signup ? tr("Already have an account? ") : tr("New to Faturo? ")}
        <Link
          href={
            signup
              ? `/login${invite ? `?callbackUrl=${encodeURIComponent(`/invite/${invite}`)}` : ""}`
              : `/signup${callbackUrl?.startsWith("/invite/") ? `?invite=${callbackUrl.slice("/invite/".length)}` : ""}`
          }
          className="font-semibold text-brand hover:underline"
        >
          {signup ? tr("Log in") : tr("Create a free account")}
        </Link>
      </p>
    </form>
  );
}
