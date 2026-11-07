"use client";

import { useTr } from "@/i18n/client";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { acceptInvite } from "./actions";
import { primaryButton } from "@/components/ui";

export function AcceptInviteButton({ token, workspaceName }: { token: string; workspaceName: string }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await acceptInvite(token);
            if (result?.error) setError(tr(result.error));
          })
        }
        className={`${primaryButton} group w-full py-3 text-base`}
      >
        {pending ? tr("Joining…") : tr("Join {workspace}", { workspace: workspaceName })} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
