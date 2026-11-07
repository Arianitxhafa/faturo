"use client";

import { useTr } from "@/i18n/client";
import { useEffect, useState, useTransition } from "react";
import { cancelPro, resumePro } from "@/app/app/billing/actions";
import { secondaryButton, primaryButton } from "@/components/ui";
import { toast } from "@/components/Toaster";

export function CancelProButton({ until }: { until: string }) {
  const tr = useTr();
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        armed
          ? start(async () => {
              const r = await cancelPro();
              toast(r.error ? tr(r.error) : tr("Pro will end on {date}", { date: until }), r.error ? "error" : "success");
            })
          : setArmed(true)
      }
      className={armed ? "inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white" : secondaryButton}
    >
      {pending ? tr("Cancelling…") : armed ? tr("Click again — Pro ends {date}", { date: until }) : tr("Cancel subscription")}
    </button>
  );
}

export function ResumeProButton() {
  const tr = useTr();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await resumePro();
          toast(r.error ? tr(r.error) : tr("Pro will keep renewing — welcome back"), r.error ? "error" : "success");
        })
      }
      className={primaryButton}
    >
      {pending ? tr("Resuming…") : tr("Keep Pro")}
    </button>
  );
}
