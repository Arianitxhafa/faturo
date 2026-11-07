"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { inputClass, primaryButton } from "@/components/ui";
import { createWorkspace } from "./actions";
import { useTr } from "@/i18n/client";

export function OnboardingForm({ another = false }: { another?: boolean }) {
  const [state, action, pending] = useActionState(createWorkspace, undefined);
  const [, start] = useTransition();
  const tr = useTr();

  return (
    <form
      // Submit manually so the fields keep their values if validation fails.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(() => action(data));
      }}
      className="grid gap-4"
    >
      {another && <input type="hidden" name="new" value="1" />}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <label className="grid gap-1.5 text-sm font-medium">
          {tr("Business name *")}
          <input name="name" required maxLength={100} placeholder="Arbën Design" className={inputClass} autoFocus />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          {tr("Currency")}
          <select name="currency" defaultValue="EUR" className={inputClass}>
            <option value="EUR">EUR €</option>
            <option value="USD">USD $</option>
            <option value="ALL">ALL L</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        {tr("Address")}
        <input name="address" maxLength={200} placeholder="Rr. Nëna Terezë 12, Prishtinë" className={inputClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          {tr("Tax number")}
          <input name="taxNumber" maxLength={40} placeholder={tr("Fiscal / VAT number")} className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          IBAN
          <input name="iban" maxLength={40} placeholder="XK05 1212 0123 4567 8906" className={inputClass} />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {tr(state.error)}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${primaryButton} mt-2`}>
        {pending ? tr("Creating…") : tr("Create workspace")}
      </button>
      {another && (
        <Link href="/app" className="text-center text-sm text-muted hover:text-fg">
          {tr("Cancel")}
        </Link>
      )}
    </form>
  );
}
