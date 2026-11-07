import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Check, FlaskConical } from "lucide-react";
import { db } from "@/db";
import { checkoutSessions } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { isUuid } from "@/lib/ids";
import { formatMoney } from "@/lib/money";
import { BILLING_CURRENCY, PLAN_FEATURES } from "@/lib/plans";
import { LogoMark } from "@/components/Logo";
import { CheckoutForm } from "./CheckoutForm";
import { getTr } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("Checkout"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, workspace } = await requireMembership("owner");
  if (!isUuid(id)) notFound();
  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(and(eq(checkoutSessions.id, id), eq(checkoutSessions.workspaceId, workspace.id)))
    .limit(1);
  if (!session) notFound();
  if (session.completedAt || workspace.plan === "pro") redirect("/app/billing");
  const expired = session.expiresAt <= new Date();
  const price = formatMoney(session.priceCents, BILLING_CURRENCY);

  const tr = await getTr();
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      {/* Order summary */}
      <section className="relative overflow-hidden bg-[#0f2e28] px-6 py-10 text-[#ecebe6] sm:px-12 lg:py-16">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-[#34d3b4]/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-md lg:mr-0 lg:ml-auto">
          <Link href="/app/billing" className="group inline-flex items-center gap-2 text-sm text-[#ecebe6]/70 transition hover:text-[#ecebe6]">
            <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" aria-hidden />
            <LogoMark className="size-6" /> {tr("Back to Faturo")}
          </Link>
          <p className="mt-10 text-sm text-[#ecebe6]/70">{tr("Subscribe to Faturo Pro for {workspace}", { workspace: workspace.name })}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-6xl leading-none">{price}</span>
            <span className="text-sm text-[#ecebe6]/70">{tr("per month")}</span>
          </p>
          <ul className="mt-8 grid gap-2.5 text-sm">
            {PLAN_FEATURES.pro.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-[#34d3b4]/20 text-[#34d3b4]">
                  <Check className="size-3" aria-hidden />
                </span>
                {tr(f)}
              </li>
            ))}
          </ul>
          <dl className="mt-10 grid gap-2 border-t border-[#ecebe6]/15 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#ecebe6]/70">{tr("Faturo Pro · billed monthly")}</dt>
              <dd className="tabular-nums">{price}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>{tr("Total due today")}</dt>
              <dd className="tabular-nums">{price}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Payment */}
      <section className="paper-grain px-6 py-10 sm:px-12 lg:py-16">
        <div className="mx-auto max-w-md animate-rise lg:mr-auto lg:ml-0">
          <div className="mb-6 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm" role="note">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
            <p>
              <strong>{tr("Test mode — no real payment.")}</strong> {tr("Use the test card")} <span className="font-mono font-semibold">4242 4242 4242 4242</span>
              {tr(", any future date and any CVC. Try")} <span className="font-mono">4000 0000 0000 0002</span> {tr("to see a decline. Real cards are rejected.")}
            </p>
          </div>
          <h1 className="mb-5 font-display text-4xl leading-none tracking-tight">{tr("Pay with card")}</h1>
          {expired ? (
            <div className="grid gap-3">
              <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400">
                {tr("This checkout expired after 30 minutes.")}
              </p>
              <Link href="/app/billing" className="text-sm font-semibold text-brand hover:underline">
                {tr("← Start again from Billing")}
              </Link>
            </div>
          ) : (
            <CheckoutForm sessionId={session.id} price={price} email={user.email ?? ""} />
          )}
          <p className="mt-6 text-center text-xs text-muted">{tr("Cancel anytime from Billing. Your card number is never stored — only its last 4 digits.")}</p>
        </div>
      </section>
    </div>
  );
}
