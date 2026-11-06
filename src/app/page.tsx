import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { primaryButton, secondaryButton } from "@/components/ui";

const FEATURES = [
  { icon: "🧾", title: "Invoices in two minutes", text: "Pick a client, add line items and Faturo calculates VAT and totals for you." },
  { icon: "📄", title: "Professional PDFs", text: "Download a clean invoice with your business details, ready to send." },
  { icon: "⏰", title: "Know who has paid", text: "Draft, sent, paid — and overdue invoices flagged automatically." },
  { icon: "👥", title: "Built for teams", text: "Invite your accountant with read-only access. Every workspace is private." },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <Link href="/app" className={primaryButton}>
              Open app
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-2">
                Log in
              </Link>
              <Link href="/signup" className={primaryButton}>
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="animate-rise py-16 text-center sm:py-24">
          <p className="mx-auto inline-flex rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
            For freelancers and small businesses
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Stop invoicing in Word. <span className="text-brand">Get paid on time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted text-balance sm:text-lg">
            Faturo creates professional invoices, calculates VAT automatically and shows you exactly who still owes you money.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={session?.user ? "/app" : "/signup"} className={`${primaryButton} px-5 py-3`}>
              {session?.user ? "Go to dashboard →" : "Create your first invoice →"}
            </Link>
            <a href="#features" className={`${secondaryButton} px-5 py-3`}>
              See features
            </a>
          </div>
        </section>

        <section id="features" className="grid gap-4 pb-20 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-line bg-surface p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-xl">{f.icon}</span>
              <h2 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <span>© 2026 Faturo</span>
          <span>
            Built by{" "}
            <a href="https://arianitxhafa.github.io" className="font-semibold text-fg hover:text-brand">
              Arianit Xhafa
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
