"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { InvoiceStatus } from "@/db/schema";
import { deleteInvoice, duplicateInvoice, setInvoiceStatus } from "../actions";
import { primaryButton, secondaryButton } from "@/components/ui";
import { toast } from "@/components/Toaster";
import { Check, Copy, Download, Pencil, Send, Undo2 } from "lucide-react";

type Props = { id: string; status: InvoiceStatus; canEdit: boolean };

export function InvoiceActions({ id, status, canEdit }: Props) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Disarm the second-click confirmation after a few seconds.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string } | void>, success?: string) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (result?.error) {
        setError(result.error);
        toast(result.error, "error");
      } else if (success) toast(success);
    });

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a href={`/app/invoices/${id}/pdf`} className={secondaryButton}>
          <Download className="size-4" /> PDF
        </a>
        {canEdit && (
          <>
            {status === "draft" && (
              <>
                <Link href={`/app/invoices/${id}/edit`} className={secondaryButton}>
                  <Pencil className="size-4" /> Edit
                </Link>
                <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "sent"), "Invoice marked as sent")} className={primaryButton}>
                  <Send className="size-4" /> Mark as sent
                </button>
              </>
            )}
            {status === "sent" && (
              <>
                <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "paid"), "Payment recorded — nice work 🎉")} className={primaryButton}>
                  <Check className="size-4" /> Mark as paid
                </button>
                <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "draft"), "Moved back to draft")} className={secondaryButton}>
                  <Undo2 className="size-4" /> Back to draft
                </button>
              </>
            )}
            {status === "paid" && (
              <button disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "sent"), "Marked as unpaid")} className={secondaryButton}>
                <Undo2 className="size-4" /> Mark as unpaid
              </button>
            )}
            <button disabled={pending} onClick={() => run(() => duplicateInvoice(id))} className={secondaryButton}>
              <Copy className="size-4" /> Duplicate
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
