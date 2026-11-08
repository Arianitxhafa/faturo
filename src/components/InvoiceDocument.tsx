import type { Client, Invoice, InvoiceItem, Workspace } from "@/db/schema";
import { computeTotals, formatMoney, formatQuantity, formatRate, invoiceNumberLabel } from "@/lib/money";
import { getLocale, getTr } from "@/i18n/server";
import { formatDay } from "@/lib/dates";

type Props = { workspace: Workspace; client: Client; invoice: Invoice; items: InvoiceItem[]; stamp?: "paid" | "overdue" };

/** The invoice as a printed page — used on the detail screen. The PDF mirrors this layout. */
export async function InvoiceDocument({ workspace, client, invoice, items, stamp }: Props) {
  const [tr, locale] = [await getTr(), await getLocale()];
  const date = (d: string) => formatDay(d, locale, { day: true, month: "long", year: true });
  const money = (c: number) => formatMoney(c, invoice.currency);
  const { vatGroups } = computeTotals(items, invoice.discountBps);

  return (
    <article className="relative overflow-hidden rounded-2xl bg-white p-5 text-[#14161a] shadow-[0_30px_70px_-35px_rgb(22_24_27/0.45)] ring-1 ring-black/5 animate-[rise_0.6s_0.1s_cubic-bezier(0.22,1,0.36,1)_both] sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xl font-bold">{workspace.name}</p>
          <p className="mt-1 text-sm whitespace-pre-line text-[#6b6f76]">
            {[workspace.address, workspace.taxNumber && tr("Tax no. {n}", { n: workspace.taxNumber })].filter(Boolean).join("\n")}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#0f766e] uppercase">{tr("Invoice")}</p>
          <p className="mt-1 text-2xl font-bold">{invoiceNumberLabel(invoice.number)}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#6b6f76] uppercase">{tr("Bill to")}</p>
          <p className="mt-1 font-semibold">{client.name}</p>
          <p className="text-sm whitespace-pre-line text-[#6b6f76]">
            {[client.address, client.email, client.taxNumber && tr("Tax no. {n}", { n: client.taxNumber })].filter(Boolean).join("\n")}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:justify-self-end">
          <dt className="text-[#6b6f76]">{tr("Issue date")}</dt>
          <dd className="text-right font-medium">{date(invoice.issueDate)}</dd>
          <dt className="text-[#6b6f76]">{tr("Due date")}</dt>
          <dd className="text-right font-medium">{date(invoice.dueDate)}</dd>
        </dl>
      </div>

      {/* Phones: one block per line, so the amount is never pushed off screen. */}
      <ul className="mt-8 divide-y divide-[#e4e2da] border-y-2 border-y-[#14161a] text-sm sm:hidden">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block font-medium break-words">{item.description}</span>
              <span className="block text-xs text-[#6b6f76] tabular-nums">
                {formatQuantity(item.quantityHundredths)} × {money(item.unitPriceCents)} · {tr("VAT")} {formatRate(item.vatRateBps)}
              </span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">{money(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#14161a] text-left text-xs tracking-wider uppercase">
              <th className="py-2 pr-3 font-semibold">{tr("Description")}</th>
              <th className="py-2 pr-3 text-right font-semibold">{tr("Qty")}</th>
              <th className="py-2 pr-3 text-right font-semibold">{tr("Unit price")}</th>
              <th className="py-2 pr-3 text-right font-semibold">{tr("VAT")}</th>
              <th className="py-2 text-right font-semibold">{tr("Amount")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#e4e2da]">
                <td className="py-2.5 pr-3">{item.description}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{formatQuantity(item.quantityHundredths)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{money(item.unitPriceCents)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{formatRate(item.vatRateBps)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">{money(item.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The stamp sits left of the totals, so it never covers dates, items or notes. */}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        {stamp && (
          <div
            className={`pointer-events-none ml-[4%] shrink-0 rounded-xl border-[4px] px-5 py-1.5 font-display text-5xl tracking-[0.18em] uppercase opacity-80 mix-blend-multiply animate-stamp max-sm:text-4xl sm:text-6xl ${
              stamp === "paid" ? "border-emerald-700 text-emerald-700" : "border-[#b42318] text-[#b42318]"
            }`}
            style={{ animationDelay: "350ms" }}
            aria-hidden
          >
            {tr(stamp)}
          </div>
        )}
        <dl className="ml-auto grid w-full max-w-xs gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#6b6f76]">{tr("Subtotal")}</dt>
            <dd className="tabular-nums">{money(invoice.subtotalCents)}</dd>
          </div>
          {invoice.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-[#6b6f76]">{tr("Discount ({rate})", { rate: formatRate(invoice.discountBps) })}</dt>
              <dd className="tabular-nums">−{money(invoice.discountCents)}</dd>
            </div>
          )}
          {vatGroups
            .filter((g) => g.rateBps > 0)
            .map((g) => (
              <div key={g.rateBps} className="flex justify-between">
                <dt className="text-[#6b6f76]">{tr("VAT {rate}", { rate: formatRate(g.rateBps) })}</dt>
                <dd className="tabular-nums">{money(g.vatCents)}</dd>
              </div>
            ))}
          <div className="mt-1 flex justify-between border-t-2 border-[#14161a] pt-2 text-lg font-bold">
            <dt>{tr("Total")}</dt>
            <dd className="tabular-nums">{money(invoice.totalCents)}</dd>
          </div>
        </dl>
      </div>

      {(invoice.notes || workspace.iban) && (
        <footer className="mt-10 border-t border-[#e4e2da] pt-4 text-sm text-[#6b6f76]">
          {invoice.notes && <p className="whitespace-pre-line">{invoice.notes}</p>}
          {workspace.iban && !invoice.notes?.includes(workspace.iban) && <p className="mt-1">IBAN: {workspace.iban}</p>}
        </footer>
      )}
    </article>
  );
}
