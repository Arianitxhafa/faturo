"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { InvoiceStatus } from "@/db/schema";
import { deleteInvoice, duplicateInvoice, setInvoiceStatus } from "../actions";
import { primaryButton, secondaryButton } from "@/components/ui";

type Props = { id: string; status: InvoiceStatus; canEdit: boolean };

export function InvoiceActions({ id, status, canEdit }: Props) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string } | void>) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (result?.error) setError(result.error);
    });

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a href={`/app/invoices/${id}/pdf`} className={secondaryButton}>
          ⬇ Download PDF
        </a>
        {canEdit && (
          <>
            {status === "draft" && (
              <>
                <Link href={`/app/invoices/${id}/edit`} className={secondaryButton}>
                  Edit
                </Link>
                <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "sent"))} className={primaryButton}>
                  Mark as sent
                </button>
              </>
            )}
            {status === "sent" && (
              <>
                <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "paid"))} className={primaryButton}>
                  ✓ Mark as paid
                </button>
                <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "draft"))} className={secondaryButton}>
                  Back to draft
                </button>
              </>
            )}
            {status === "paid" && (
              <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "sent"))} className={secondaryButton}>
                Mark as unpaid
              </button>
            )}
            <button disabled={pending} onClick={() => run(() => duplicateInvoice(id))} className={secondaryButton}>
              Duplicate
            </button>
            {status === "draft" && (
              <button
                disabled={pending}
                onClick={() => (confirmDelete ? run(() => deleteInvoice(id)) : setConfirmDelete(true))}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${confirmDelete ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-500/10 dark:text-red-400"}`}
              >
                {confirmDelete ? "Click again to delete" : "Delete"}
              </button>
            )}
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
