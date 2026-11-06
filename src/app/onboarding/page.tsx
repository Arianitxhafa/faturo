import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { hasAnyWorkspace, requireUser } from "@/lib/session";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Set up your business" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (await hasAnyWorkspace(user.id)) redirect("/app");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg animate-rise">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-brand">Step 1 of 1</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Set up your business{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">These details appear on every invoice. You can change them later in Settings.</p>
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
