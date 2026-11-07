"use client";

import { useActionState, useEffect } from "react";
import type { Workspace } from "@/db/schema";
import { updateWorkspace } from "./actions";
import { inputClass, primaryButton } from "@/components/ui";
import { toast } from "@/components/Toaster";

export function SettingsForm({ workspace, canEdit }: { workspace: Workspace; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateWorkspace, undefined);
  useEffect(() => {
    if (state?.ok) toast("Business details saved");
  }, [state]);

  return (
    <form action={action} className="grid gap-4">
      <fieldset disabled={!canEdit} className="grid gap-4 disabled:opacity-80">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <label className="grid gap-1.5 text-sm font-medium">
            Business name *
            <input name="name" required maxLength={100} defaultValue={workspace.name} className={inputClass} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Currency
            <select name="currency" defaultValue={workspace.currency} className={inputClass}>
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="ALL">ALL L</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">
          Address
          <input name="address" maxLength={200} defaultValue={workspace.address ?? ""} placeholder="Rr. Nëna Terezë 12, Prishtinë" className={inputClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            Tax number
            <input name="taxNumber" maxLength={40} defaultValue={workspace.taxNumber ?? ""} placeholder="Fiscal / VAT number" className={inputClass} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            IBAN
            <input name="iban" maxLength={40} defaultValue={workspace.iban ?? ""} placeholder="XK05 1212 0123 4567 8906" className={inputClass} />
          </label>
        </div>
      </fieldset>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
      {canEdit ? (
        <div className="flex items-center justify-end gap-3">
          <p className="mr-auto text-xs text-muted">A new currency applies to new invoices; existing ones keep theirs.</p>
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">Only the owner can change the business details.</p>
      )}
    </form>
  );
}
