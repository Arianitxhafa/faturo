"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { saveClient } from "@/app/app/clients/actions";
import type { Client } from "@/db/schema";
import { inputClass, primaryButton } from "./ui";
import { toast } from "./Toaster";
import { useTr } from "@/i18n/client";

export function ClientForm({ client, onSaved }: { client?: Client; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(saveClient, undefined);
  const [, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const tr = useTr();

  useEffect(() => {
    if (!state?.ok) return;
    toast(client ? tr("Client updated") : tr("Client added"));
    if (!client) formRef.current?.reset();
    onSaved?.();
  }, [state, client, onSaved, tr]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(() => action(data));
      }}
      className="grid gap-3"
    >
      {client && <input type="hidden" name="id" value={client.id} />}
      <label className="grid gap-1.5 text-sm font-medium">
        {tr("Name *")}
        <input name="name" required maxLength={120} defaultValue={client?.name} placeholder="Restaurant Liburnia" className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        {tr("Email")}
        <input name="email" type="email" maxLength={200} defaultValue={client?.email ?? ""} placeholder="accounts@client.com" className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        {tr("Address")}
        <input name="address" maxLength={200} defaultValue={client?.address ?? ""} placeholder={tr("Street, city")} className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        {tr("Tax number")}
        <input name="taxNumber" maxLength={40} defaultValue={client?.taxNumber ?? ""} placeholder={tr("Fiscal / VAT number")} className={inputClass} />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {tr(state.error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? tr("Saving…") : client ? tr("Save changes") : tr("Add client")}
        </button>
        {state?.ok && <span className="text-sm text-brand">{tr("✓ Saved")}</span>}
      </div>
    </form>
  );
}
