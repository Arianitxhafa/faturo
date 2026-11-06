import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireMembership } from "@/lib/session";
import { logOutAction } from "../(auth)/actions";

const NAV = [
  { href: "/app", label: "Dashboard", ready: true },
  { href: "/app/invoices", label: "Invoices", ready: true },
  { href: "/app/clients", label: "Clients", ready: true },
  { href: "/app/team", label: "Team", ready: false },
  { href: "/app/settings", label: "Settings", ready: false },
  { href: "/app/billing", label: "Billing", ready: false },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, role } = await requireMembership();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line bg-surface px-4 py-4 md:w-60 md:border-r md:border-b-0 md:py-6">
        <Logo href="/app" />
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="capitalize">{role}</span> ·
            <span className={`rounded px-1.5 py-px font-semibold uppercase ${workspace.plan === "pro" ? "bg-gold/20 text-gold" : "bg-line text-muted"}`}>
              {workspace.plan}
            </span>
          </p>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map((item) =>
            item.ready ? (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-surface-2">
                {item.label}
              </Link>
            ) : (
              <span key={item.href} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted/70" title="Coming soon">
                {item.label}
                <span className="rounded bg-surface-2 px-1.5 py-px text-[10px] font-semibold uppercase">soon</span>
              </span>
            )
          )}
        </nav>
        <div className="mt-auto hidden border-t border-line pt-4 md:block">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <form action={logOutAction} className="mt-3">
            <button className="text-sm font-medium text-muted hover:text-fg">Log out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
