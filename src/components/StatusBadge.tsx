import type { InvoiceStatus } from "@/db/schema";
import { displayStatus, type DisplayStatus } from "@/lib/invoice-status";
import { getT } from "@/i18n/server";

const STYLES: Record<DisplayStatus, string> = {
  draft: "bg-surface-2 text-muted",
  sent: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export async function StatusBadge({ status, dueDate }: { status: InvoiceStatus; dueDate: string }) {
  const s = displayStatus(status, dueDate);
  const labels = (await getT()).status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-sans tracking-normal px-2.5 py-0.5 text-xs font-semibold ${STYLES[s]}`}>
      <span className={`size-1.5 rounded-full bg-current ${s === "overdue" ? "animate-pulse" : ""}`} aria-hidden />
      {labels[s]}
    </span>
  );
}
