import Link from "next/link";
import { ArrowRight, BellRing, Check, FileDown, Globe2, Percent, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { HeroInvoice } from "@/components/landing/HeroInvoice";
import { primaryButton, secondaryButton } from "@/components/ui";

const MARQUEE = ["VAT 18% · 8% · 0%", "PDF in one click", "Overdue alerts", "EUR · USD · ALL", "Team roles", "Duplicate in a click", "Client history", "Monthly revenue chart"];

const STEPS = [
  { n: "01", title: "Add your business", text: "Name, address, tax number and IBAN — once. They appear on every invoice." },
  { n: "02", title: "Create the invoice", text: "Pick a client, add lines. VAT, discounts and totals are calculated as you type." },
  { n: "03", title: "Send & get paid", text: "Download the PDF, mark it sent, and Faturo tells you the moment it's overdue." },
];

const FAQ = [
  { q: "Is Faturo really free?", a: "Yes — the Free plan includes up to 5 invoices a month for one person, forever. Upgrade only when you need more." },
  { q: "Does it handle VAT in Kosovo and Albania?", a: "Every line can use 18 %, 8 % or 0 % VAT, discounts are applied before tax, and invoices can be in EUR, USD or ALL." },
  { q: "Can my accountant see my invoices?", a: "Invite them as a Member: they can view invoices and download PDFs, but can't change anything." },
  { q: "Is my data private?", a: "Every workspace is isolated on the server — another business can never read your clients or invoices." },
];

export default async function Home() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <div className="paper-grain flex flex-1 flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-transparent bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            {[
              ["#features", "Features"],
              ["#how", "How it works"],
              ["#pricing", "Pricing"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="transition hover:text-fg">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Link href="/app" className={primaryButton}>
                Open app <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-surface">
                  Log in
                </Link>
                <Link href="/signup" className={primaryButton}>
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="stagger">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-card">
              <span className="size-1.5 rounded-full bg-brand" /> For freelancers &amp; small businesses
            </p>
            <h1 className="mt-6 font-display text-[3.4rem] leading-[0.95] tracking-tight text-balance sm:text-7xl">
              Invoices that look sharp <em className="text-brand">and get paid on time.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted text-balance">
              Stop copying last month&apos;s invoice in Word. Faturo calculates VAT, numbers every invoice, creates the PDF and tells you exactly who still owes you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={signedIn ? "/app" : "/signup"} className={`${primaryButton} group px-6 py-3 text-base`}>
                {signedIn ? "Go to dashboard" : "Create your first invoice"}
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a href="#how" className={`${secondaryButton} px-6 py-3 text-base`}>
                See how it works
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {["No card needed", "Free up to 5 invoices / month", "EUR, USD & ALL"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-md animate-[rise_0.9s_0.2s_cubic-bezier(0.22,1,0.36,1)_both] lg:rotate-[1.5deg]">
            <HeroInvoice />
          </div>
        </section>

        {/* Marquee */}
        <div className="border-y border-line bg-surface/60 py-4" aria-hidden>
          <div className="flex w-max animate-marquee gap-10 pr-10 font-display text-2xl text-muted">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {m} <span className="text-brand">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="reveal max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">Features</p>
            <h2 className="mt-3 font-display text-5xl leading-none tracking-tight text-balance">Everything an invoice needs. Nothing it doesn&apos;t.</h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-4">
              <Percent className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">VAT and totals, always right</h3>
              <p className="mt-2 max-w-md text-sm text-muted">Mix 18 %, 8 % and 0 % lines, add a discount, and watch every total update as you type. Money is stored in whole cents — no rounding surprises.</p>
              <div className="mt-6 grid max-w-sm gap-1.5 rounded-2xl bg-surface-2 p-4 font-mono text-xs">
                <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>€720.00</span></div>
                <div className="flex justify-between"><span className="text-muted">Discount 10%</span><span>−€72.00</span></div>
                <div className="flex justify-between"><span className="text-muted">VAT 18%</span><span>€116.64</span></div>
                <div className="flex justify-between border-t border-line pt-1.5 font-bold"><span>Total</span><span>€764.64</span></div>
              </div>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <FileDown className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">Beautiful PDFs</h3>
              <p className="mt-2 text-sm text-muted">One click gives you a clean, print-ready invoice with your business details — ë, ç and € included.</p>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <BellRing className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">Never miss a payment</h3>
              <p className="mt-2 text-sm text-muted">Draft → Sent → Paid. The day after the due date, an invoice turns overdue so you know whom to call.</p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs font-semibold">
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-muted">Draft</span>
                <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-700 dark:text-sky-400">Sent</span>
                <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-red-700 dark:text-red-400">Overdue</span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">Paid</span>
              </div>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <Users className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">Built for small teams</h3>
              <p className="mt-2 text-sm text-muted">Owner, Admin and read-only Member roles. Give your accountant access without giving away the keys.</p>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <ShieldCheck className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">Private by design</h3>
              <p className="mt-2 text-sm text-muted">Every workspace is isolated on the server, passwords are hashed, and every number is re-checked before it&apos;s saved.</p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-line bg-surface/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
            <h2 className="reveal max-w-xl font-display text-5xl leading-none tracking-tight">From blank page to paid, in three steps.</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="reveal">
                  <span className="font-display text-6xl text-brand/80">{s.n}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="reveal text-center">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">Pricing</p>
            <h2 className="mt-3 font-display text-5xl leading-none tracking-tight">Start free. Grow when you&apos;re ready.</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
            <div className="reveal rounded-3xl border border-line bg-surface p-7">
              <p className="font-semibold">Free</p>
              <p className="mt-2 font-display text-5xl">€0</p>
              <p className="text-sm text-muted">forever</p>
              <ul className="mt-6 grid gap-2.5 text-sm">
                {["5 invoices a month", "Unlimited clients", "PDF download", "Dashboard & overdue alerts"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-brand" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`${secondaryButton} mt-8 w-full`}>
                Start free
              </Link>
            </div>
            <div className="reveal relative overflow-hidden rounded-3xl bg-[#0f2e28] p-7 text-[#ecebe6] shadow-[0_30px_60px_-30px_rgb(15_118_110/0.6)]">
              <span className="absolute top-5 right-5 rounded-full bg-[#e0b75a] px-2.5 py-0.5 text-xs font-bold text-[#16181b]">Popular</span>
              <p className="font-semibold">Pro</p>
              <p className="mt-2 font-display text-5xl">€9</p>
              <p className="text-sm text-[#ecebe6]/70">per month</p>
              <ul className="mt-6 grid gap-2.5 text-sm">
                {["Unlimited invoices", "Unlimited team members", "Your logo on every PDF", "Public invoice links"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-[#34d3b4]" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#34d3b4] px-4 py-2.5 text-sm font-semibold text-[#052a23] transition hover:brightness-110 active:scale-[0.98]">
                Try Pro
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <h2 className="reveal font-display text-5xl leading-none tracking-tight">Questions</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group reveal py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  {f.q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="reveal mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-[2rem] bg-[#0f2e28] px-6 py-16 text-center text-[#ecebe6]">
            <Globe2 className="size-8 text-[#34d3b4]" />
            <h2 className="max-w-2xl font-display text-5xl leading-none tracking-tight text-balance sm:text-6xl">Your next invoice could take two minutes.</h2>
            <Link href={signedIn ? "/app" : "/signup"} className="group inline-flex items-center gap-2 rounded-xl bg-[#34d3b4] px-6 py-3 text-base font-semibold text-[#052a23] transition hover:brightness-110 active:scale-[0.98]">
              {signedIn ? "Open Faturo" : "Start free — no card needed"} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <Logo />
          <span>
            © 2026 · Built by{" "}
            <a href="https://arianitxhafa.github.io" className="font-semibold text-fg hover:text-brand">
              Arianit Xhafa
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
