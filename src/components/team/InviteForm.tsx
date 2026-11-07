"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, Send } from "lucide-react";
import type { Role } from "@/db/schema";
import { createInvite } from "@/app/app/team/actions";
import { ROLE_LABEL } from "@/lib/permissions";
import { useTr } from "@/i18n/client";
import { inputClass, primaryButton } from "@/components/ui";
import { toast } from "@/components/Toaster";

export function InviteForm({ roles }: { roles: Role[] }) {
  const [state, action, pending] = useActionState(createInvite, undefined);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const tr = useTr();

  useEffect(() => {
    if (!state?.link) return;
    formRef.current?.reset();
    toast(tr("Invite link ready for {email}", { email: state.email ?? "" }));
  }, [state, tr]);

  const copy = async () => {
    if (!state?.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
    } catch {
      linkRef.current?.select(); // clipboard blocked: select it so Ctrl+C works
      return;
    }
    setCopied(true);
    toast(tr("Link copied — send it to your teammate"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-4">
      <form ref={formRef} action={action} className="grid gap-3">
        <label className="grid gap-1.5 text-sm font-medium">
          {tr("Email")}
          <input name="email" type="email" required maxLength={200} placeholder="teammate@business.com" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          {tr("Role")}
          <select name="role" defaultValue={roles.includes("member") ? "member" : roles[0]} className={inputClass}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {tr(ROLE_LABEL[r])}
              </option>
            ))}
          </select>
        </label>
        {state?.error && (
          <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
            {tr(state.error)}
          </p>
        )}
        <button type="submit" disabled={pending} className={primaryButton}>
          <Send className="size-4" aria-hidden /> {pending ? tr("Creating link…") : tr("Create invite link")}
        </button>
      </form>

      {state?.link && (
        <div className="animate-scale rounded-xl border border-brand/25 bg-brand/[0.06] p-3.5" role="status">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Link2 className="size-4 text-brand" aria-hidden /> Invite for {state.email}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              ref={linkRef}
              readOnly
              value={state.link}
              aria-label={tr("Invite link")}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass} min-w-0 flex-1 font-mono text-xs`}
            />
            <button type="button" onClick={copy} className={`${primaryButton} shrink-0 px-3`} aria-label={tr("Copy invite link")}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? tr("Copied") : tr("Copy")}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            {tr("Send this link to {email}. It works once, only for that email, and expires in 7 days. It won't be shown again.", { email: state.email ?? "" })}
          </p>
        </div>
      )}
    </div>
  );
}
