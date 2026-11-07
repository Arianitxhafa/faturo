"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, PlayCircle } from "lucide-react";
import { startDemoAction } from "@/app/(auth)/actions";

function Submit({ className, label }: { className: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} group disabled:cursor-wait disabled:opacity-80`}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <PlayCircle className="size-4 transition group-hover:scale-110" aria-hidden />}
      {pending ? "Preparing your demo…" : label}
    </button>
  );
}

/** Creates a throwaway workspace full of sample data and signs the visitor straight in. */
export function DemoButton({ className, label = "Try the live demo" }: { className: string; label?: string }) {
  const [state, action] = useActionState(startDemoAction, undefined);
  return (
    <form action={action} className="contents">
      <Submit className={className} label={label} />
      {state?.error && (
        <p role="alert" className="basis-full text-sm text-stamp">
          {state.error}
        </p>
      )}
    </form>
  );
}
