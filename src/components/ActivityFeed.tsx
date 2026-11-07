import Link from "next/link";
import { Building2, CircleCheckBig, FileText, Trash2, UserPlus, Users, type LucideIcon } from "lucide-react";
import { describeActivity, relativeTime, type Tone } from "@/lib/activity-format";
import type { ActivityEntry } from "@/lib/activity";

const TONE: Record<Tone, { icon: LucideIcon; className: string }> = {
  invoice: { icon: FileText, className: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300" },
  payment: { icon: CircleCheckBig, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" },
  client: { icon: Users, className: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300" },
  team: { icon: UserPlus, className: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" },
  danger: { icon: Trash2, className: "bg-stamp/10 text-stamp" },
  workspace: { icon: Building2, className: "bg-brand/10 text-brand" },
};

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(d);

function dayLabel(key: string, now: Date) {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function Entry({ entry, now, showActor = true }: { entry: ActivityEntry; now: Date; showActor?: boolean }) {
  const d = describeActivity(entry.action, entry.meta, entry.entityId, entry.linkable);
  const { icon: Icon, className } = TONE[d.tone];
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-surface ${className}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-1 text-sm">
        <p className="leading-snug">
          {showActor && <span className="font-semibold">{entry.actorName ?? "A former member"} </span>}
          {d.segments.map((seg, i) =>
            seg.href ? (
              <Link key={i} href={seg.href} className="font-semibold text-brand underline-offset-4 hover:underline">
                {seg.text}
              </Link>
            ) : seg.strong ? (
              <strong key={i} className="font-semibold">
                {seg.text}
              </strong>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </p>
        <time dateTime={entry.createdAt.toISOString()} title={entry.createdAt.toLocaleString("en-GB", { timeZone: "Europe/Belgrade" })} className="text-xs text-muted">
          {relativeTime(entry.createdAt, now)}
        </time>
      </div>
    </li>
  );
}

/** A vertical timeline, grouped by day (Kosovo time). */
export function ActivityFeed({ entries, now = new Date(), grouped = true }: { entries: ActivityEntry[]; now?: Date; grouped?: boolean }) {
  const line = "relative before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-line";
  if (!grouped) {
    return (
      <ol className={line}>
        {entries.map((e) => (
          <Entry key={e.id} entry={e} now={now} />
        ))}
      </ol>
    );
  }
  const days = new Map<string, ActivityEntry[]>();
  for (const e of entries) {
    const k = dayKey(e.createdAt);
    days.set(k, [...(days.get(k) ?? []), e]);
  }
  return (
    <div className="grid gap-7">
      {[...days].map(([key, list]) => (
        <section key={key} aria-label={dayLabel(key, now)}>
          <h3 className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted uppercase">{dayLabel(key, now)}</h3>
          <ol className={line}>
            {list.map((e) => (
              <Entry key={e.id} entry={e} now={now} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
