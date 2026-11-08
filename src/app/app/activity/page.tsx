import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { requireMembership } from "@/lib/session";
import { getActivity } from "@/lib/activity";
import { PageHeader } from "@/components/PageHeader";
import { ActivityFeed } from "@/components/ActivityFeed";
import { card, secondaryButton } from "@/components/ui";
import { getTr } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Activity") };
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const { workspace } = await requireMembership();
  const { before } = await searchParams;
  const beforeDate = before && !Number.isNaN(Date.parse(before)) ? new Date(before) : undefined;
  const { entries, hasMore } = await getActivity(workspace.id, { before: beforeDate, limit: 40 });
  const tr = await getTr();

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader label={tr("Activity")} title={tr("What happened")} description={tr("Everything your team did in {workspace}, newest first.", { workspace: workspace.name })} />

      <section className={`${card} animate-rise p-5 sm:p-7 [animation-delay:100ms]`}>
        {entries.length === 0 ? (
          <div className="grid place-items-center gap-2 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
              <History className="size-6" aria-hidden />
            </span>
            <p className="font-semibold">{beforeDate ? tr("No older activity") : tr("Nothing yet")}</p>
            <p className="text-sm text-muted">{tr("Creating, sending and paying invoices — and team changes — will show up here.")}</p>
          </div>
        ) : (
          <ActivityFeed entries={entries} />
        )}
      </section>

      <nav className="flex justify-between gap-3" aria-label={tr("Activity pages")}>
        {beforeDate ? (
          <Link href="/app/activity" className={secondaryButton}>
            {tr("← Newest")}
          </Link>
        ) : (
          <span />
        )}
        {hasMore && (
          <Link href={`/app/activity?before=${encodeURIComponent(entries[entries.length - 1].createdAt.toISOString())}`} className={secondaryButton}>
            {tr("Older activity →")}
          </Link>
        )}
      </nav>
    </div>
  );
}
