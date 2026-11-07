"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";
import { completeCheckout, type CheckoutState } from "@/app/app/billing/actions";
import { inputClass } from "@/components/ui";

// Light formatting as you type: "4242 4242 4242 4242" and "12/30".
const formatNumber = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function CheckoutForm({ sessionId, price, email }: { sessionId: string; price: string; email: string }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(completeCheckout.bind(null, sessionId), undefined);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  // Controlled, so a declined card doesn't wipe what was typed (React resets uncontrolled fields after an action).
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const invalid = (f: string) => (state?.field === f ? "border-stamp focus:border-stamp focus:ring-stamp/15" : "");

  return (
    <form action={action} className="grid gap-4" noValidate>
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input value={email} readOnly className={`${inputClass} bg-surface-2 text-muted`} />
      </label>

      <fieldset className="grid gap-1.5 text-sm font-medium">
        <legend className="mb-1.5">Card information</legend>
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <input
            name="number"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Card number"
            placeholder="1234 1234 1234 1234"
            value={number}
            onChange={(e) => setNumber(formatNumber(e.target.value))}
            className={`w-full border-b border-line bg-transparent px-3.5 py-2.5 font-mono text-sm tracking-wider outline-none focus:bg-brand/[0.03] ${state?.field === "number" ? "text-stamp" : ""}`}
          />
          <div className="grid grid-cols-2">
            <input
              name="expiry"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Expiry date (MM/YY)"
              placeholder="MM / YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className={`border-r border-line bg-transparent px-3.5 py-2.5 font-mono text-sm outline-none focus:bg-brand/[0.03] ${state?.field === "expiry" ? "text-stamp" : ""}`}
            />
            <input
              name="cvc"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
              aria-label="Security code (CVC)"
              placeholder="CVC"
              className={`bg-transparent px-3.5 py-2.5 font-mono text-sm outline-none focus:bg-brand/[0.03] ${state?.field === "cvc" ? "text-stamp" : ""}`}
            />
          </div>
        </div>
      </fieldset>

      <label className="grid gap-1.5 text-sm font-medium">
        Name on card
        <input name="name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="Arbën Krasniqi" className={`${inputClass} ${invalid("name")}`} />
      </label>

      {state?.error && (
        <p role="alert" className="animate-shake rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f2e28] px-4 py-3 text-base font-semibold text-[#ecebe6] transition hover:brightness-125 active:scale-[0.98] disabled:opacity-70 dark:bg-[#34d3b4] dark:text-[#052a23]"
      >
        <Lock className="size-4" aria-hidden /> {pending ? "Processing…" : `Subscribe — ${price}/month`}
      </button>
    </form>
  );
}
