import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireMembership } from "@/lib/session";
import { addDays, today } from "@/lib/invoice-status";
import { InvoiceEditor } from "@/components/InvoiceEditor";
import { getTr } from "@/i18n/server";
import { UpgradeCard } from "@/components/billing/UpgradeCard";
import { getUsage } from "@/lib/billing";
import { PLAN_LIMITS } from "@/lib/plans";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTr())("New invoice") };
}

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { workspace, role } = await requireMembership("admin");
  const { client } = await searchParams;
  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.workspaceId, workspace.id))
    .orderBy(asc(clients.name));

  const issue = today();
  const usage = workspace.plan === "free" ? await getUsage(workspace.id) : null;
  const limit = PLAN_LIMITS.free.invoicesPerMonth;
  const blocked = usage !== null && usage.invoicesThisMonth >= limit;
  const tr = await getTr();

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)] gap-5">
      <div>
        <Link href="/app/invoices" className="text-sm text-muted hover:text-fg">
          {tr("← Invoices")}
        </Link>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">{tr("New invoice")}</h1>
      </div>
      {usage && !blocked && (
        <p className="-mt-2 text-sm text-muted">
          {tr("{used} of {limit} free invoices used this month.", { used: usage.invoicesThisMonth, limit })}
        </p>
      )}
      {blocked ? (
        <UpgradeCard
          title={tr("You've used all {limit} free invoices this month", { limit })}
          body={tr("Upgrade to Pro for unlimited invoices — or wait until next month, when your free invoices reset.")}
          isOwner={role === "owner"}
        />
      ) : clientList.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <p className="font-semibold">{tr("Add a client first")}</p>
          <p className="text-sm text-muted">{tr("Every invoice is addressed to a client.")}</p>
          <Link href="/app/clients" className="mt-1 text-sm font-semibold text-brand hover:underline">
            {tr("Add a client →")}
          </Link>
        </div>
      ) : (
        <InvoiceEditor
          clients={clientList}
          currency={workspace.currency}
          initial={{
            clientId: clientList.some((c) => c.id === client) ? client! : clientList.length === 1 ? clientList[0].id : "",
            issueDate: issue,
            dueDate: addDays(issue, 15),
            discount: "",
            notes: workspace.iban ? tr("Please pay by bank transfer to IBAN {iban}.", { iban: workspace.iban }) : "",
            items: [],
          }}
        />
      )}
    </div>
  );
}
