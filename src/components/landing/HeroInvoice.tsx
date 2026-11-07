"use client";

import { useEffect, useState } from "react";

const LINES = [
  { d: "Brand identity", q: "1", p: "450.00", a: "450.00" },
  { d: "Website design", q: "1", p: "600.00", a: "600.00" },
  { d: "Hosting · 12 months", q: "1", p: "120.00", a: "120.00" },
];
// subtotal 1,170.00 · VAT 18 % 210.60 · total 1,380.60
const STEPS = 7; // 0 empty → 1..3 lines → 4 totals → 5 sent → 6 paid stamp

/** A self-writing invoice that loops: lines appear, totals land, then it gets stamped PAID. */
export function HeroInvoice() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setTimeout(() => setStep(STEPS - 1), 0);
      return () => clearTimeout(id);
    }
    const delays = [700, 650, 650, 650, 900, 1100, 3600];
    const id = setTimeout(() => setStep((s) => (s + 1) % STEPS), delays[step]);
    return () => clearTimeout(id);
  }, [step]);

  const status = step >= 6 ? "Paid" : step >= 5 ? "Sent" : "Draft";

  return (
    <div className="relative">
      <div className="perforated relative rounded-b-2xl bg-white px-6 pt-8 pb-7 text-[#16181b] shadow-[0_30px_80px_-30px_rgb(22_24_27/0.45)] ring-1 ring-black/5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl leading-none">Arbën Design</p>
            <p className="mt-1.5 text-xs text-[#6e6a62]">Rr. Nëna Terezë 12, Prishtinë</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#0f766e] uppercase">Invoice</p>
            <p className="mt-0.5 font-semibold tabular-nums">INV-0042</p>
            <span
              className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors duration-500 ${
                status === "Paid" ? "bg-emerald-100 text-emerald-800" : status === "Sent" ? "bg-sky-100 text-sky-800" : "bg-[#efebe2] text-[#6e6a62]"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        <div className="mt-6 text-xs">
          <p className="text-[10px] font-semibold tracking-wider text-[#6e6a62] uppercase">Bill to</p>
          <p className="mt-0.5 font-semibold">Restaurant Liburnia</p>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-x-4 border-b-2 border-[#16181b] pb-1.5 text-[10px] font-semibold tracking-wider uppercase">
          <span>Description</span>
          <span className="text-right">Amount</span>
        </div>
        <ul className="min-h-[7.5rem] text-sm">
          {LINES.map((l, i) =>
            step > i ? (
              <li key={l.d} className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-[#e3ddd0] py-2 animate-[type-in_0.5s_ease_both]">
                <span>{l.d}</span>
                <span className="text-right font-medium tabular-nums">€{l.a}</span>
              </li>
            ) : null
          )}
        </ul>

        <dl className={`mt-3 ml-auto grid w-52 gap-1 text-sm transition-all duration-500 ${step >= 4 ? "opacity-100" : "translate-y-1 opacity-0"}`}>
          <div className="flex justify-between text-[#6e6a62]">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">€1,170.00</dd>
          </div>
          <div className="flex justify-between text-[#6e6a62]">
            <dt>VAT 18%</dt>
            <dd className="tabular-nums">€210.60</dd>
          </div>
          <div className="mt-1 flex justify-between border-t-2 border-[#16181b] pt-1.5 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">€1,380.60</dd>
          </div>
        </dl>

        {step >= 6 && (
          <div
            className="pointer-events-none absolute bottom-[14%] left-[10%] animate-stamp rounded-lg border-[3px] border-emerald-700/80 px-4 py-1 font-display text-4xl tracking-[0.15em] text-emerald-700/80 uppercase mix-blend-multiply"
            aria-hidden
          >
            Paid
          </div>
        )}
      </div>

      {/* Floating notes */}
      <div
        className={`absolute -right-3 -bottom-14 flex items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-card transition-all duration-500 sm:-right-8 ${
          step >= 6 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
        <div>
          <p className="font-semibold">Payment received</p>
          <p className="text-xs text-muted tabular-nums">+€1,380.60 · Restaurant Liburnia</p>
        </div>
      </div>
      <div
        className={`absolute -top-5 -right-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium shadow-card transition-all duration-500 sm:-right-10 ${
          step >= 4 ? "opacity-100" : "opacity-0"
        }`}
        style={{ animation: step >= 4 ? "float 6s ease-in-out infinite" : undefined }}
      >
        🧮 VAT calculated for you
      </div>
    </div>
  );
}
