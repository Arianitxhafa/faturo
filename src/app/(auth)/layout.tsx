import { Logo } from "@/components/Logo";
import { HeroInvoice } from "@/components/landing/HeroInvoice";
import { Preferences } from "@/components/Preferences";
import { getTr } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const tr = await getTr();
  return (
    <div className="grid flex-1 lg:grid-cols-[1fr_1.05fr]">
      <div className="paper-grain flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <Preferences />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-rise">{children}</div>
        <p className="text-xs text-muted">{tr("© 2026 Faturo · Invoicing for freelancers and small businesses")}</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-[#0f2e28] lg:flex lg:flex-col lg:justify-center lg:px-16" aria-hidden>
        <div className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-[#34d3b4]/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-[#e0b75a]/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-md">
          <p className="mb-8 font-display text-4xl leading-tight text-[#ecebe6]">
            &ldquo;{tr("I used to spend an evening on invoices.")} <em className="text-[#34d3b4]">{tr("Now it's two minutes.")}</em>&rdquo;
          </p>
          <div className="rotate-[-1.5deg]">
            <HeroInvoice />
          </div>
        </div>
      </aside>
    </div>
  );
}
