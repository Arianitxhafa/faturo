"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteClient } from "../actions";

export function DeleteClientButton({ id, hasInvoices }: { id: string; hasInvoices: boolean }) {
  const [confirm, setConfirm] = useState(false);

  // Disarm the second-click confirmation after a few seconds.
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (hasInvoices) return <p className="text-xs text-muted">Clients with invoices can&apos;t be deleted.</p>;

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm) return setConfirm(true);
          start(async () => {
            const result = await deleteClient(id);
            if (result?.error) setError(result.error);
          });
        }}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${confirm ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-500/10 dark:text-red-400"}`}
      >
        {pending ? "Deleting…" : confirm ? "Click again to delete" : "Delete client"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
