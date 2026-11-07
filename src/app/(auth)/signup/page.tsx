import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signUpAction } from "../actions";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-5xl leading-none tracking-tight">Start invoicing</h1>
      <p className="mt-3 mb-8 text-muted">Free for up to 5 invoices a month. No card needed.</p>
      <AuthForm mode="signup" action={signUpAction} />
    </>
  );
}
