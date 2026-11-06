import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signUpAction } from "../actions";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Start invoicing</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Free for up to 5 invoices a month. No card needed.</p>
      <AuthForm mode="signup" action={signUpAction} />
    </>
  );
}
