"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, CreditCard, FileText, History, LayoutDashboard, LogOut, Menu, Plus, Settings, Users, UsersRound, X, type LucideIcon } from "lucide-react";
import { Logo } from "./Logo";
import { logOutAction } from "@/app/(auth)/actions";
import { switchWorkspace } from "@/app/app/workspace-actions";
import { Preferences } from "./Preferences";
import { useT } from "@/i18n/client";

type NavItem = { href: string; key: "dashboard" | "invoices" | "clients" | "team" | "activity" | "settings" | "billing"; icon: LucideIcon; ready: boolean };

const NAV: NavItem[] = [
  { href: "/app", key: "dashboard", icon: LayoutDashboard, ready: true },
  { href: "/app/invoices", key: "invoices", icon: FileText, ready: true },
  { href: "/app/clients", key: "clients", icon: Users, ready: true },
  { href: "/app/team", key: "team", icon: UsersRound, ready: true },
  { href: "/app/activity", key: "activity", icon: History, ready: true },
  { href: "/app/settings", key: "settings", icon: Settings, ready: true },
  { href: "/app/billing", key: "billing", icon: CreditCard, ready: true },
];

type Props = {
  workspaceId: string;
  workspaces: { id: string; name: string; role: string }[];
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

export function AppSidebar({ workspaceId, workspaces, workspaceName, plan, role, userName, userEmail, canCreate }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const dict = useT();
  const t = dict.nav;

  // Close the workspace menu on outside click or Escape.
  useEffect(() => {
    if (!switcher) return;
    const onDown = (e: MouseEvent) => !switcherRef.current?.contains(e.target as Node) && setSwitcher(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSwitcher(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [switcher]);
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav = (
    <nav aria-label={t.main} className="grid gap-0.5">
      {NAV.map(({ href, key, icon: Icon, ready }) => {
        const active = isActive(pathname, href);
        const label = t[key];
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
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-surface md:hidden" aria-label={t.closeMenu}>
          <X className="size-5" />
        </button>
      </div>

      <div ref={switcherRef} className="relative">
        <button
          type="button"
          onClick={() => setSwitcher((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={switcher}
          className="flex w-full items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-left shadow-card transition hover:border-muted/40"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-xl leading-tight">{workspaceName}</span>
            <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <span>{dict.roles[role] ?? role}</span>
              <span aria-hidden>·</span>
              <span className={`rounded-md px-1.5 py-px text-[10px] font-bold tracking-wider uppercase ${plan === "pro" ? "bg-gold/15 text-gold" : "bg-surface-2 text-muted"}`}>{dict.plans[plan]}</span>
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
        {switcher && (
          <div role="menu" aria-label={t.workspaces} className="absolute inset-x-0 top-full z-20 mt-2 animate-scale overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-card">
            <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider text-muted uppercase">{t.workspaces}</p>
            {workspaces.map((w) => (
              <form key={w.id} action={switchWorkspace.bind(null, w.id)}>
                <button role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{w.name}</span>
                    <span className="block text-xs text-muted">{dict.roles[w.role] ?? w.role}</span>
                  </span>
                  {w.id === workspaceId && <Check className="size-4 text-brand" aria-label={t.currentWorkspace} />}
                </button>
              </form>
            ))}
            <Link
              href="/onboarding?new=1"
              role="menuitem"
              className="mt-1 flex items-center gap-2 rounded-xl border-t border-line px-2.5 py-2 text-sm font-medium text-brand transition hover:bg-surface-2"
            >
              <Plus className="size-4" aria-hidden /> {t.newWorkspace}
            </Link>
          </div>
        )}
      </div>

      {canCreate && (
        <Link
          href="/app/invoices/new"
          className="group flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_var(--brand)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="size-4 transition group-hover:rotate-90" aria-hidden /> {t.newInvoice}
        </Link>
      )}

      {nav}

      <div className="mt-auto" aria-hidden />
      {/* On phones the toggles live in the top bar instead. */}
      <Preferences className="max-md:hidden" />

      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <p className="truncate text-xs text-muted">{userEmail}</p>
        </div>
        <form action={logOutAction}>
          <button className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-stamp" aria-label={t.logOut} title={t.logOut}>
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
        <div className="flex items-center gap-2">
          <Preferences compact />
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-fg hover:bg-surface" aria-label={t.openMenu} aria-expanded={open}>
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-black/40 animate-fade" onClick={() => setOpen(false)} aria-label={t.closeMenu} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface-2 shadow-2xl animate-[rise_0.3s_ease_both]">{body}</aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-surface-2/70 md:block">{body}</aside>
    </>
  );
}
