import { AppSidebar } from "@/components/AppSidebar";
import { hasRole, requireMembership } from "@/lib/session";
import { isDemoEmail } from "@/lib/demo";
import { leaveDemoAction } from "@/app/(auth)/actions";
import { Sparkles } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, role } = await requireMembership();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AppSidebar
        workspaceName={workspace.name}
        plan={workspace.plan}
        role={role}
        userName={user.name ?? "You"}
        userEmail={user.email ?? ""}
        canCreate={hasRole(role, "admin")}
      />
      <main className="paper-grain min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        {isDemoEmail(user.email) && (
          <div className="mx-auto mb-6 flex max-w-6xl animate-rise flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
            <Sparkles className="size-4 shrink-0 text-gold" aria-hidden />
            <p className="min-w-0 flex-1">
              <span className="font-semibold">You&apos;re exploring a demo workspace.</span>{" "}
              <span className="text-muted">Change anything you like — it&apos;s deleted after 24 hours.</span>
            </p>
            <form action={leaveDemoAction} className="max-sm:basis-full max-sm:pl-8">
              <button className="font-semibold text-brand underline-offset-4 hover:underline">Create your own account →</button>
            </form>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
