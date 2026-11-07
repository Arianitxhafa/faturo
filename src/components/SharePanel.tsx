"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Eye, Globe, Lock, Sparkles } from "lucide-react";
import type { InvoiceStatus } from "@/db/schema";
import { shareInvoice, unshareInvoice } from "@/app/app/invoices/actions";
import { card, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { toast } from "@/components/Toaster";

type Props = {
  id: string;
  status: InvoiceStatus;
  pro: boolean;
  canEdit: boolean;
  origin: string;
  token: string | null;
  views: number;
  lastViewed: string | null; // already formatted on the server
};

/** Public link for the client: create, copy, open, turn off — plus whether they've opened it. */
export function SharePanel({ id, status, pro, canEdit, origin, token: initialToken, views, lastViewed }: Props) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const link = token ? `${origin}/i/${token}` : null;

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Link copied — send it to your client");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the field is selectable */
    }
  };

  let body: React.ReactNode;
  if (!pro) {
    body = (
      <p className="text-sm text-muted">
        Send your client a link where they can view and download the invoice — no account needed.{" "}
        <Link href="/app/billing" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
          <Sparkles className="size-3.5" aria-hidden /> Available on Pro
        </Link>
      </p>
    );
  } else if (status === "draft" && !token) {
    body = <p className="text-sm text-muted">Mark the invoice as sent to share it with your client.</p>;
  } else if (!link) {
    body = canEdit ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Let your client view and download this invoice without an account.</p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await shareInvoice(id);
              if (r.error) toast(r.error, "error");
              else if (r.token) {
                setToken(r.token);
                toast("Public link created");
              }
            })
          }
          className={primaryButton}
        >
          <Globe className="size-4" aria-hidden /> {pending ? "Creating…" : "Create public link"}
        </button>
      </div>
    ) : (
      <p className="text-sm text-muted">This invoice isn&apos;t shared.</p>
    );
  } else {
    body = (
      <div className="grid gap-3">
        {status === "draft" && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">The link is paused while this invoice is a draft — it works again once it&apos;s sent.</p>
        )}
        <div className="flex gap-2">
          <input readOnly value={link} aria-label="Public invoice link" onFocus={(e) => e.currentTarget.select()} className={`${inputClass} min-w-0 flex-1 font-mono text-xs`} />
          <button type="button" onClick={copy} className={`${primaryButton} shrink-0 px-3`} aria-label="Copy public link">
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            <span className="max-sm:sr-only">{copied ? "Copied" : "Copy"}</span>
          </button>
          <a href={link} target="_blank" rel="noopener" className={`${secondaryButton} shrink-0 px-3`} aria-label="Open public link in a new tab">
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="flex items-center gap-1.5 text-muted">
            <Eye className="size-4" aria-hidden />
            {views === 0 ? "Not opened yet" : `Opened ${views} time${views === 1 ? "" : "s"}${lastViewed ? ` · last ${lastViewed}` : ""}`}
          </p>
          {canEdit && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await unshareInvoice(id);
                  if (r.error) toast(r.error, "error");
                  else {
                    setToken(null);
                    toast("Public link turned off");
                  }
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Lock className="size-3.5" aria-hidden /> Turn off link
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className={`${card} animate-rise p-5 [animation-delay:200ms]`} aria-labelledby="share-heading">
      <h2 id="share-heading" className="mb-3 flex items-center gap-2 font-display text-2xl">
        Share with client
        {link && <span className="rounded-full bg-brand/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-brand">Live</span>}
      </h2>
      {body}
    </section>
  );
}
