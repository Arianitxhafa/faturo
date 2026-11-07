import type { Metadata } from "next";
import { Check, CreditCard, FlaskConical, Receipt } from "lucide-react";
import { requireMembership } from "@/lib/session";
import { getBilling } from "@/lib/billing";
import { BILLING_CURRENCY, PLAN_FEATURES, PLAN_LIMITS, PRO_PRICE_CENTS } from "@/lib/plans";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/PageHeader";
import { card } from "@/components/ui";
import { UpgradeCard } from "@/components/billing/UpgradeCard";
import { CancelProButton, ResumeProButton } from "@/components/billing/BillingControls";

export const metadata: Metadata = { title: "Billing" };

const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Belgrade" });
const short = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Belgrade" });

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  const full = !unlimited && used >= limit;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className={`tabular-nums ${full ? "font-semibold text-stamp" : "text-muted"}`}>
          {used} {unlimited ? "· unlimited" : `of ${limit}`}
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={unlimited ? undefined : limit}
      >
        <div
          className={`h-full origin-left rounded-full ${full ? "bg-stamp" : "bg-chart"}`}
          style={{ width: unlimited ? "100%" : `${pct}%`, opacity: unlimited ? 0.25 : 1, animation: "grow-x 0.9s cubic-bezier(0.22,1,0.36,1) 200ms both" }}
        />
      </div>
    </div>
  );
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const { workspace, role } = await requireMembership();
  const { upgraded } = await searchParams;
  const { subscription, history, usage } = await getBilling(workspace.id);
  const isOwner = role === "owner";
  const pro = workspace.plan === "pro";
  const limits = PLAN_LIMITS[workspace.plan];
  const ending = pro && subscription?.cancelAtPeriodEnd;

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader label="Billing" title="Plan & billing" description={`${workspace.name} is on the ${pro ? "Pro" : "Free"} plan.`} />

      {upgraded && pro && (
        <div role="status" className={`${card} relative flex items-center gap-5 overflow-hidden p-5 sm:p-6`}>
          <div
            className="animate-stamp shrink-0 rounded-xl border-[3px] border-brand px-3 py-1 font-display text-3xl tracking-[0.15em] text-brand uppercase"
            style={{ animationDelay: "150ms" }}
            aria-hidden
          >
            Pro
          </div>
          <div>
            <p className="font-display text-2xl leading-tight">You&apos;re on Pro 🎉</p>
            <p className="text-sm text-muted">Unlimited invoices and your whole team — thanks for supporting Faturo.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <section className={`${card} animate-rise p-6 [animation-delay:100ms]`} aria-labelledby="plan-heading">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Current plan</p>
                <h2 id="plan-heading" className="mt-1 flex items-center gap-3 font-display text-5xl leading-none">
                  {pro ? "Pro" : "Free"}
                  {pro && !ending && <span className="rounded-full bg-brand/10 px-2.5 py-1 font-sans text-xs font-semibold text-brand">Active</span>}
                  {ending && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 font-sans text-xs font-semibold text-amber-800 dark:text-amber-300">Ending</span>}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {pro && subscription
                    ? ending
                      ? `Ends on ${day(subscription.currentPeriodEnd)} — then ${workspace.name} moves to Free.`
                      : `${formatMoney(subscription.priceCents, BILLING_CURRENCY)} / month · renews on ${day(subscription.currentPeriodEnd)}`
                    : "Free forever — no card needed."}
                </p>
                {pro && subscription?.cardLabel && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <CreditCard className="size-4" aria-hidden /> {subscription.cardLabel}
                  </p>
                )}
              </div>
              {isOwner && pro && subscription && (ending ? <ResumeProButton /> : <CancelProButton until={short(subscription.currentPeriodEnd)} />)}
            </div>

            <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2" aria-describedby="usage-note">
              <Meter label="Invoices this month" used={usage.invoicesThisMonth} limit={limits.invoicesPerMonth} />
              <Meter label="Team seats" used={usage.seats} limit={limits.members} />
            </div>
            <p id="usage-note" className="mt-3 text-xs text-muted">
              Invoices reset on the 1st of each month. Seats count members and pending invites.
            </p>
          </section>

          <section className={`${card} animate-rise overflow-hidden [animation-delay:200ms]`} aria-labelledby="history-heading">
            <h2 id="history-heading" className="border-b border-line px-6 py-4 font-display text-2xl">
              Billing history
            </h2>
            {history.length === 0 ? (
              <p className="flex items-center gap-2 px-6 py-6 text-sm text-muted">
                <Receipt className="size-4" aria-hidden /> No payments yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs tracking-wider text-muted uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Description</th>
                      <th className="px-6 py-3 font-medium">Card</th>
                      <th className="px-6 py-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {history.map((p) => (
                      <tr key={p.id} className="transition hover:bg-surface-2/50">
                        <td className="px-6 py-3 whitespace-nowrap">{short(p.createdAt)}</td>
                        <td className="px-6 py-3">
                          {p.description}
                          <span className="block text-xs text-muted">
                            {short(p.periodStart)} – {short(p.periodEnd)}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-muted">{p.cardLabel ?? "—"}</td>
                        <td className="px-6 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                          {formatMoney(p.amountCents, p.currency)}
                          <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Paid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-6">
          {!pro && (
            <div className="animate-rise [animation-delay:150ms]">
              <UpgradeCard
                compact
                title="Grow without limits"
                body="Unlimited invoices every month and your whole team, with roles and an activity log."
                isOwner={isOwner}
              />
            </div>
          )}

          <section className={`${card} animate-rise p-6 [animation-delay:250ms]`} aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="font-display text-2xl">
              Compare plans
            </h2>
            <div className="mt-4 grid gap-4">
              {(["free", "pro"] as const).map((p) => (
                <div key={p} className={`rounded-xl border p-4 ${workspace.plan === p ? "border-brand/40 bg-brand/[0.04]" : "border-line"}`}>
                  <p className="flex items-baseline justify-between">
                    <span className="font-semibold">{p === "pro" ? "Pro" : "Free"}</span>
                    <span className="text-sm text-muted">{p === "pro" ? `${formatMoney(PRO_PRICE_CENTS, BILLING_CURRENCY)} / month` : "€0"}</span>
                  </p>
                  <ul className="mt-2 grid gap-1 text-sm">
                    {PLAN_FEATURES[p].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="size-3.5 text-brand" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                  {workspace.plan === p && <p className="mt-2 text-xs font-semibold text-brand">Your plan</p>}
                </div>
              ))}
            </div>
            {!isOwner && <p className="mt-4 text-xs text-muted">Only the workspace owner can change the plan.</p>}
          </section>

          <p className="flex gap-2 rounded-xl border border-dashed border-line p-4 text-xs text-muted">
            <FlaskConical className="size-4 shrink-0" aria-hidden />
            <span>
              Payments run in a simulated <strong>test mode</strong>: Stripe doesn&apos;t yet onboard businesses in Kosovo, so checkout only accepts test cards and
              nothing is ever charged. Renewals and cancellations follow the same rules a real provider&apos;s webhooks would.
            </span>
          </p>
        </aside>
      </div>
    </div>
  );
}
