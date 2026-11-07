"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inputClass, primaryButton } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import type { AuthState } from "./actions";

type Props = { mode: "login" | "signup"; action: (state: AuthState, formData: FormData) => Promise<AuthState> };

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const signup = mode === "signup";

  return (
    <form action={formAction} className="grid gap-4">
      {signup && (
        <label className="grid gap-1.5 text-sm font-medium">
          Your name
          <input name="name" required autoComplete="name" defaultValue={state?.values?.name} placeholder="Arbën Krasniqi" className={inputClass} />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email} placeholder="you@business.com" className={inputClass} />
      </label>
      <PasswordInput
        label="Password"
        autoComplete={signup ? "new-password" : "current-password"}
        minLength={signup ? 8 : undefined}
        placeholder={signup ? "At least 8 characters" : "••••••••"}
      />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${primaryButton} mt-1`}>
        {pending ? "Please wait…" : signup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-muted">
        {signup ? "Already have an account? " : "New to Faturo? "}
        <Link href={signup ? "/login" : "/signup"} className="font-semibold text-brand hover:underline">
          {signup ? "Log in" : "Create a free account"}
        </Link>
      </p>
    </form>
  );
}
