import type { Client, Invoice, InvoiceItem, Workspace } from "@/db/schema";
import { computeTotals, formatMoney, formatQuantity, formatRate, invoiceNumberLabel } from "@/lib/money";

type Props = { workspace: Workspace; client: Client; invoice: Invoice; items: InvoiceItem[] };

const date = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The invoice as a printed page — used on the detail screen. The PDF mirrors this layout. */
export function InvoiceDocument({ workspace, client, invoice, items }: Props) {
  const money = (c: number) => formatMoney(c, invoice.currency);
  const { vatGroups } = computeTotals(items, invoice.discountBps);

  return (
    <article className="rounded-2xl bg-white p-6 text-[#14161a] shadow-sm ring-1 ring-black/5 sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xl font-bold">{workspace.name}</p>
          <p className="mt-1 text-sm whitespace-pre-line text-[#6b6f76]">
            {[workspace.address, workspace.taxNumber && `Tax no. ${workspace.taxNumber}`].filter(Boolean).join("\n")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#0f766e] uppercase">Invoice</p>
          <p className="mt-1 text-2xl font-bold">{invoiceNumberLabel(invoice.number)}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#6b6f76] uppercase">Bill to</p>
          <p className="mt-1 font-semibold">{client.name}</p>
          <p className="text-sm whitespace-pre-line text-[#6b6f76]">
            {[client.address, client.email, client.taxNumber && `Tax no. ${client.taxNumber}`].filter(Boolean).join("\n")}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:justify-self-end">
          <dt className="text-[#6b6f76]">Issue date</dt>
          <dd className="text-right font-medium">{date(invoice.issueDate)}</dd>
          <dt className="text-[#6b6f76]">Due date</dt>
          <dd className="text-right font-medium">{date(invoice.dueDate)}</dd>
        </dl>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#14161a] text-left text-xs tracking-wider uppercase">
              <th className="py-2 pr-3 font-semibold">Description</th>
              <th className="py-2 pr-3 text-right font-semibold">Qty</th>
              <th className="py-2 pr-3 text-right font-semibold">Unit price</th>
              <th className="py-2 pr-3 text-right font-semibold">VAT</th>
              <th className="py-2 text-right font-semibold">Amount</th>
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

      <dl className="mt-6 ml-auto grid max-w-xs gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-[#6b6f76]">Subtotal</dt>
          <dd className="tabular-nums">{money(invoice.subtotalCents)}</dd>
        </div>
        {invoice.discountCents > 0 && (
          <div className="flex justify-between">
            <dt className="text-[#6b6f76]">Discount ({formatRate(invoice.discountBps)})</dt>
            <dd className="tabular-nums">−{money(invoice.discountCents)}</dd>
          </div>
        )}
        {vatGroups
          .filter((g) => g.rateBps > 0)
          .map((g) => (
            <div key={g.rateBps} className="flex justify-between">
              <dt className="text-[#6b6f76]">VAT {formatRate(g.rateBps)}</dt>
              <dd className="tabular-nums">{money(g.vatCents)}</dd>
            </div>
          ))}
        <div className="mt-1 flex justify-between border-t-2 border-[#14161a] pt-2 text-lg font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{money(invoice.totalCents)}</dd>
        </div>
      </dl>

      {(invoice.notes || workspace.iban) && (
        <footer className="mt-10 border-t border-[#e4e2da] pt-4 text-sm text-[#6b6f76]">
          {invoice.notes && <p className="whitespace-pre-line">{invoice.notes}</p>}
          {workspace.iban && !invoice.notes?.includes(workspace.iban) && <p className="mt-1">IBAN: {workspace.iban}</p>}
        </footer>
      )}
    </article>
  );
}
