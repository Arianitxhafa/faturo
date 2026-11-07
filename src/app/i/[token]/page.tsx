import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CircleCheckBig, Clock, Download } from "lucide-react";
import { auth } from "@/auth";
import { findSharedInvoice, recordShareView } from "@/lib/share";
import { displayStatus } from "@/lib/invoice-status";
import { formatMoney, invoiceNumberLabel } from "@/lib/money";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { Logo } from "@/components/Logo";
import { CopyIban } from "./CopyIban";

export const dynamic = "force-dynamic";

const day = (d: string | Date) =>
  (typeof d === "string" ? new Date(`${d}T00:00:00Z`) : d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: typeof d === "string" ? "UTC" : "Europe/Belgrade",
  });

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const found = await findSharedInvoice((await params).token);
  return {
    title: found ? `${invoiceNumberLabel(found.invoice.number)} from ${found.workspace.name}` : "Invoice",
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findSharedInvoice(token);
  if (!found) notFound();
  const { invoice, client, workspace, items } = found;

  const session = await auth();
  await recordShareView(invoice, client.name, session?.user?.id);

  const status = displayStatus(invoice.status, invoice.dueDate);
  const total = formatMoney(invoice.totalCents, invoice.currency);
  const banner =
    status === "paid"
      ? { icon: CircleCheckBig, tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300", text: `Paid${invoice.paidAt ? ` on ${day(invoice.paidAt)}` : ""} — thank you!` }
      : status === "overdue"
        ? { icon: AlertTriangle, tone: "border-stamp/30 bg-stamp/10 text-stamp", text: `${total} was due on ${day(invoice.dueDate)}.` }
        : { icon: Clock, tone: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300", text: `${total} due on ${day(invoice.dueDate)}.` };
  const Icon = banner.icon;

  return (
    <div className="paper-grain flex flex-1 flex-col">
      <header className="border-b border-line bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-display text-2xl leading-none">{workspace.name}</p>
            <p className="mt-1 text-xs text-muted">
              Invoice {invoiceNumberLabel(invoice.number)} for {client.name}
            </p>
          </div>
          <a href={`/i/${token}/pdf`} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:brightness-110 active:scale-[0.98]">
            <Download className="size-4" aria-hidden /> Download PDF
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-8 sm:px-6">
        <p role="status" className={`flex animate-rise items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium ${banner.tone}`}>
          <Icon className="size-5 shrink-0" aria-hidden /> {banner.text}
        </p>

        {status !== "paid" && workspace.iban && <CopyIban iban={workspace.iban} reference={invoiceNumberLabel(invoice.number)} total={total} />}

        <InvoiceDocument workspace={workspace} client={client} invoice={invoice} items={items} stamp={status === "paid" ? "paid" : status === "overdue" ? "overdue" : undefined} />
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted sm:px-6">
          <span>This page is private to the people {workspace.name} shares it with.</span>
          <span className="inline-flex items-center gap-2">
            Sent with <Logo />
          </span>
        </div>
      </footer>
    </div>
  );
}
