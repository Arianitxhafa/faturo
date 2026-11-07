import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { requireMembership } from "@/lib/session";
import { getActivity } from "@/lib/activity";
import { PageHeader } from "@/components/PageHeader";
import { ActivityFeed } from "@/components/ActivityFeed";
import { card, secondaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const { workspace } = await requireMembership();
  const { before } = await searchParams;
  const beforeDate = before && !Number.isNaN(Date.parse(before)) ? new Date(before) : undefined;
  const { entries, hasMore } = await getActivity(workspace.id, { before: beforeDate, limit: 40 });

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader label="Activity" title="What happened" description={`Everything your team did in ${workspace.name}, newest first.`} />

      <section className={`${card} animate-rise p-5 sm:p-7 [animation-delay:100ms]`}>
        {entries.length === 0 ? (
          <div className="grid place-items-center gap-2 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
              <History className="size-6" aria-hidden />
            </span>
            <p className="font-semibold">{beforeDate ? "No older activity" : "Nothing yet"}</p>
            <p className="text-sm text-muted">Creating, sending and paying invoices — and team changes — will show up here.</p>
          </div>
        ) : (
          <ActivityFeed entries={entries} />
        )}
      </section>

      <nav className="flex justify-between gap-3" aria-label="Activity pages">
        {beforeDate ? (
          <Link href="/app/activity" className={secondaryButton}>
            ← Newest
          </Link>
        ) : (
          <span />
        )}
        {hasMore && (
          <Link href={`/app/activity?before=${encodeURIComponent(entries[entries.length - 1].createdAt.toISOString())}`} className={secondaryButton}>
            Older activity →
          </Link>
        )}
      </nav>
    </div>
  );
}
