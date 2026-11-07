import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { logInAction } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-5xl leading-none tracking-tight">Welcome back</h1>
      <p className="mt-3 mb-8 text-muted">Log in to your invoices.</p>
      <AuthForm mode="login" action={logInAction} />
    </>
  );
}
