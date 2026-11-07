import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { hasAnyWorkspace, requireUser, userExists } from "@/lib/session";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Set up your business" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const another = (await searchParams).new === "1";
  const user = await requireUser();
  if (!(await userExists(user.id))) redirect("/session-expired");
  if (!another && (await hasAnyWorkspace(user.id))) redirect("/app");

  return (
    <div className="paper-grain flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg animate-rise">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">{another ? "New workspace" : "Last step"}</p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-tight">{another ? "Add another business" : `Set up your business${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">These details appear on every invoice. You can change them later in Settings.</p>
          <OnboardingForm another={another} />
        </div>
      </div>
    </div>
  );
}
