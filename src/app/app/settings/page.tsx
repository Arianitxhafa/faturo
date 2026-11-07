import type { Metadata } from "next";
import { requireMembership } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { card } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { workspace, role } = await requireMembership();
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader label="Settings" title="Business details" description="These appear on every invoice, PDF and public link." />
      <section className={`${card} animate-rise p-6 sm:p-8 [animation-delay:100ms]`}>
        <SettingsForm workspace={workspace} canEdit={role === "owner"} />
      </section>
    </div>
  );
}
