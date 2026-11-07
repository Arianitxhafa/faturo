import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { logInAction } from "../actions";
import { DemoButton } from "@/components/DemoButton";
import { secondaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-5xl leading-none tracking-tight">Welcome back</h1>
      <p className="mt-3 mb-8 text-muted">Log in to your invoices.</p>
      <AuthForm mode="login" action={logInAction} />
      <div className="my-6 flex items-center gap-3 text-xs tracking-wider text-muted uppercase">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-wrap">
        <DemoButton className={`${secondaryButton} w-full`} label="Explore a demo workspace" />
      </div>
    </>
  );
}
