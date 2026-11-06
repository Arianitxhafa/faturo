import type { Metadata } from "next";
import { requireMembership } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const NEXT_STEPS = [
  { title: "Add your first client", text: "Save the people and companies you bill.", phase: "Phase 2" },
  { title: "Create an invoice", text: "Line items, VAT and totals calculated for you.", phase: "Phase 2" },
  { title: "Invite your team", text: "Give your accountant read-only access.", phase: "Phase 4" },
  { title: "Upgrade to Pro", text: "Unlimited invoices and your logo on every PDF.", phase: "Phase 5" },
];

export default async function DashboardPage() {
  const { user, workspace } = await requireMembership();
  const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: workspace.currency });

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="animate-rise">
        <p className="text-sm font-medium text-brand">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Welcome, {user.name?.split(" ")[0] ?? "there"} 👋</h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s how {workspace.name} is doing.</p>
      </div>

      <section aria-label="Overview" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Revenue this month", value: money.format(0) },
          { label: "Unpaid", value: money.format(0) },
          { label: "Overdue", value: money.format(0) },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-medium tracking-wider text-muted uppercase">{t.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{t.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Get started</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {NEXT_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-xl bg-surface-2 p-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted">{s.text}</p>
                <p className="mt-1 text-[11px] font-medium text-brand">{s.phase}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
