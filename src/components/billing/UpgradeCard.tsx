import { Sparkles } from "lucide-react";
import { startCheckout } from "@/app/app/billing/actions";
import { formatMoney } from "@/lib/money";
import { BILLING_CURRENCY, PRO_PRICE_CENTS } from "@/lib/plans";
import { getTr } from "@/i18n/server";

/** Shown wherever a Free limit is reached. Owners can upgrade on the spot; others are told who can. */
export async function UpgradeCard({ title, body, isOwner, compact = false }: { title: string; body: string; isOwner: boolean; compact?: boolean }) {
  const tr = await getTr();
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#0f2e28] text-[#ecebe6] ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-[#34d3b4]/20 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-[#34d3b4] uppercase">
          <Sparkles className="size-3.5" aria-hidden /> Faturo Pro
        </p>
        <h2 className={`mt-2 font-display leading-none tracking-tight ${compact ? "text-2xl" : "text-3xl sm:text-4xl"}`}>{title}</h2>
        <p className="mt-2 max-w-md text-sm text-[#ecebe6]/75">{body}</p>
        {isOwner ? (
          <form action={startCheckout} className="mt-5">
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#34d3b4] px-5 py-2.5 text-sm font-semibold text-[#052a23] transition hover:brightness-110 active:scale-[0.98]">
              {tr("Upgrade to Pro — {price}/month", { price: formatMoney(PRO_PRICE_CENTS, BILLING_CURRENCY) })}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm font-medium text-[#34d3b4]">{tr("Ask the workspace owner to upgrade to Pro.")}</p>
        )}
      </div>
    </div>
  );
}
