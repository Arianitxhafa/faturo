import { AppSidebar } from "@/components/AppSidebar";
import { hasRole, requireMembership } from "@/lib/session";

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
      <main className="paper-grain min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
