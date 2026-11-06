import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { logInAction } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Log in to your invoices.</p>
      <AuthForm mode="login" action={logInAction} />
    </>
  );
}
