import type { Metadata } from "next";
import { requireMembership } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { card } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";
import { getTr } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Settings") };
}

export default async function SettingsPage() {
  const { workspace, role } = await requireMembership();
  const tr = await getTr();
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader label={tr("Settings")} title={tr("Business details")} description={tr("These appear on every invoice, PDF and public link.")} />
      <section className={`${card} animate-rise p-6 sm:p-8 [animation-delay:100ms]`}>
        <SettingsForm workspace={workspace} canEdit={role === "owner"} />
      </section>
    </div>
  );
}
