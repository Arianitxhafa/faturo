"use client";

import { useState } from "react";
import { Check, Copy, Landmark } from "lucide-react";

/** Bank-transfer details with one-tap copy for the IBAN and the payment reference. */
export function CopyIban({ iban, reference, total }: { iban: string; reference: string; total: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked — the text is still selectable */
    }
  };
  const row = (label: string, value: string) => (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="truncate font-mono text-sm font-semibold select-all">{value}</dd>
      </div>
      <button
        type="button"
        onClick={() => copy(label, value)}
        aria-label={`Copy ${label}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
      >
        {copied === label ? <Check className="size-3.5 text-brand" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied === label ? "Copied" : "Copy"}
      </button>
    </div>
  );
  return (
    <section className="animate-rise rounded-2xl border border-line bg-surface p-4 shadow-card [animation-delay:80ms]" aria-labelledby="pay-heading">
      <h2 id="pay-heading" className="flex items-center gap-2 text-sm font-semibold">
        <Landmark className="size-4 text-brand" aria-hidden /> Pay {total} by bank transfer
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {row("IBAN", iban)}
        {row("Reference", reference)}
      </dl>
    </section>
  );
}
