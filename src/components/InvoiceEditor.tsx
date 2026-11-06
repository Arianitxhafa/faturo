"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { saveInvoice } from "@/app/app/invoices/actions";
import { computeTotals, formatMoney, formatRate, parseMoney, parsePercent, parseQuantity, VAT_RATES_BPS } from "@/lib/money";
import { inputClass, primaryButton } from "./ui";

type Line = { key: number; description: string; quantity: string; unitPrice: string; vatRateBps: number };

export type EditorInitial = {
  id?: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  discount: string;
  notes: string;
  items: Omit<Line, "key">[];
};

type Props = {
  clients: { id: string; name: string }[];
  currency: string;
  initial: EditorInitial;
};

let nextKey = 1;
const blankLine = (): Line => ({ key: nextKey++, description: "", quantity: "1", unitPrice: "", vatRateBps: 1800 });

const cell = "w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export function InvoiceEditor({ clients, currency, initial }: Props) {
  const [state, action, pending] = useActionState(saveInvoice, undefined);
  const [, start] = useTransition();
  const [clientId, setClientId] = useState(initial.clientId);
  const [issueDate, setIssueDate] = useState(initial.issueDate);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [discount, setDiscount] = useState(initial.discount);
  const [notes, setNotes] = useState(initial.notes);
  const [lines, setLines] = useState<Line[]>(() =>
    initial.items.length ? initial.items.map((i) => ({ ...i, key: nextKey++ })) : [blankLine()]
  );

  // Live preview using the same maths the server runs — the server recomputes and is the source of truth.
  const preview = useMemo(() => {
    const parsed = lines.map((l) => ({
      quantityHundredths: parseQuantity(l.quantity) ?? 0,
      unitPriceCents: parseMoney(l.unitPrice) ?? 0,
      vatRateBps: l.vatRateBps,
    }));
    return computeTotals(parsed, parsePercent(discount) ?? 0);
  }, [lines, discount]);

  const money = (c: number) => formatMoney(c, currency);
  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const payload = JSON.stringify({
          id: initial.id,
          clientId,
          issueDate,
          dueDate,
          discount,
          notes,
          items: lines.map(({ description, quantity, unitPrice, vatRateBps }) => ({ description, quantity, unitPrice, vatRateBps })),
        });
        const data = new FormData();
        data.set("payload", payload);
        start(() => action(data));
      }}
      className="grid gap-6"
    >
      <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-3">
          Client *
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className={inputClass}>
            <option value="" disabled>
              Choose a client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Issue date
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Due date
          <input type="date" value={dueDate} min={issueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Discount %
          <input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className={inputClass} />
        </label>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="hidden grid-cols-[1fr_90px_120px_90px_110px_32px] gap-2 pb-2 text-xs font-medium tracking-wider text-muted uppercase md:grid">
          <span>Description</span>
          <span>Qty</span>
          <span>Unit price</span>
          <span>VAT</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        <ul className="grid gap-3 md:gap-2">
          {lines.map((line, i) => (
            <li key={line.key} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3 md:grid-cols-[1fr_90px_120px_90px_110px_32px] md:items-center md:border-0 md:p-0">
              <input
                aria-label={`Line ${i + 1} description`}
                value={line.description}
                onChange={(e) => update(line.key, { description: e.target.value })}
                placeholder="Website design"
                maxLength={300}
                required
                className={`${cell} col-span-2 md:col-span-1`}
              />
              <input aria-label={`Line ${i + 1} quantity`} inputMode="decimal" value={line.quantity} onChange={(e) => update(line.key, { quantity: e.target.value })} className={cell} />
              <input aria-label={`Line ${i + 1} unit price`} inputMode="decimal" value={line.unitPrice} onChange={(e) => update(line.key, { unitPrice: e.target.value })} placeholder="0.00" className={cell} />
              <select aria-label={`Line ${i + 1} VAT rate`} value={line.vatRateBps} onChange={(e) => update(line.key, { vatRateBps: Number(e.target.value) })} className={cell}>
                {VAT_RATES_BPS.map((r) => (
                  <option key={r} value={r}>
                    {formatRate(r)}
                  </option>
                ))}
              </select>
              <span className="self-center text-right text-sm font-semibold tabular-nums">{money(preview.lineTotals[i] ?? 0)}</span>
              <button
                type="button"
                onClick={() => setLines((ls) => (ls.length === 1 ? ls : ls.filter((l) => l.key !== line.key)))}
                disabled={lines.length === 1}
                aria-label={`Remove line ${i + 1}`}
                className="grid size-8 place-items-center justify-self-end rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-30"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setLines((ls) => [...ls, blankLine()])} disabled={lines.length >= 50} className="mt-3 text-sm font-semibold text-brand hover:underline">
          + Add line
        </button>

        <dl className="mt-6 ml-auto grid max-w-xs gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{money(preview.subtotalCents)}</dd>
          </div>
          {preview.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Discount ({formatRate(parsePercent(discount) ?? 0)})</dt>
              <dd className="tabular-nums">−{money(preview.discountCents)}</dd>
            </div>
          )}
          {preview.vatGroups
            .filter((g) => g.rateBps > 0)
            .map((g) => (
              <div key={g.rateBps} className="flex justify-between">
                <dt className="text-muted">VAT {formatRate(g.rateBps)}</dt>
                <dd className="tabular-nums">{money(g.vatCents)}</dd>
              </div>
            ))}
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(preview.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <label className="grid gap-1.5 text-sm font-medium">
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} placeholder="Payment details, thank-you note…" className={`${inputClass} resize-y`} />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={`${primaryButton} px-6`}>
          {pending ? "Saving…" : initial.id ? "Save invoice" : "Create invoice"}
        </button>
      </div>
    </form>
  );
}
