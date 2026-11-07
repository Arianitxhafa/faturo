"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CreditCard, FileText, LayoutDashboard, LogOut, Menu, Plus, Settings, Users, UsersRound, X, type LucideIcon } from "lucide-react";
import { Logo } from "./Logo";
import { logOutAction } from "@/app/(auth)/actions";

type NavItem = { href: string; label: string; icon: LucideIcon; ready: boolean };

const NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/app/invoices", label: "Invoices", icon: FileText, ready: true },
  { href: "/app/clients", label: "Clients", icon: Users, ready: true },
  { href: "/app/team", label: "Team", icon: UsersRound, ready: false },
  { href: "/app/settings", label: "Settings", icon: Settings, ready: false },
  { href: "/app/billing", label: "Billing", icon: CreditCard, ready: false },
];

type Props = {
  workspaceName: string;
  plan: "free" | "pro";
  role: string;
  userName: string;
  userEmail: string;
  canCreate: boolean;
};

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function AppSidebar({ workspaceName, plan, role, userName, userEmail, canCreate }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav = (
    <nav aria-label="Main" className="grid gap-0.5">
      {NAV.map(({ href, label, icon: Icon, ready }) => {
        const active = isActive(pathname, href);
        return ready ? (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active ? "bg-surface text-fg shadow-card" : "text-muted hover:bg-surface/60 hover:text-fg"
            }`}
          >
            {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-brand animate-scale" aria-hidden />}
            <Icon className={`size-[18px] transition ${active ? "text-brand" : "group-hover:scale-110"}`} aria-hidden />
            {label}
          </Link>
        ) : (
          <span key={href} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted/60" title="Coming soon">
            <Icon className="size-[18px]" aria-hidden />
            {label}
            <span className="ml-auto rounded-md border border-line px-1.5 py-px text-[10px] font-semibold tracking-wider uppercase">soon</span>
          </span>
        );
      })}
    </nav>
  );

  const body = (
    // Close the mobile drawer when any link inside it is followed.
    <div className="flex h-full flex-col gap-5 p-4" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
      <div className="flex items-center justify-between">
        <Logo href="/app" />
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-surface md:hidden" aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-3 shadow-card">
        <p className="truncate font-display text-xl leading-tight">{workspaceName}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <span className="capitalize">{role}</span>
          <span aria-hidden>·</span>
          <span className={`rounded-md px-1.5 py-px text-[10px] font-bold tracking-wider uppercase ${plan === "pro" ? "bg-gold/15 text-gold" : "bg-surface-2 text-muted"}`}>{plan}</span>
        </p>
      </div>

      {canCreate && (
        <Link
          href="/app/invoices/new"
          className="group flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_var(--brand)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="size-4 transition group-hover:rotate-90" aria-hidden /> New invoice
        </Link>
      )}

      {nav}

      <div className="mt-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <p className="truncate text-xs text-muted">{userEmail}</p>
        </div>
        <form action={logOutAction}>
          <button className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-stamp" aria-label="Log out" title="Log out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur md:hidden">
        <Logo href="/app" />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-fg hover:bg-surface" aria-label="Open menu" aria-expanded={open}>
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-black/40 animate-fade" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface-2 shadow-2xl animate-[rise_0.3s_ease_both]">{body}</aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-surface-2/70 md:block">{body}</aside>
    </>
  );
}
