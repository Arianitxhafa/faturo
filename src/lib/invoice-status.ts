import type { InvoiceStatus } from "@/db/schema";

export type DisplayStatus = InvoiceStatus | "overdue";

/** Today's date as YYYY-MM-DD in the Kosovo time zone. */
export function today(timeZone = "Europe/Belgrade") {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** "Overdue" isn't stored: a sent invoice becomes overdue the day after its due date. */
export function displayStatus(status: InvoiceStatus, dueDate: string, now = today()): DisplayStatus {
  return status === "sent" && dueDate < now ? "overdue" : status;
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
