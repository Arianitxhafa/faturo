import Link from "next/link";
import { ArrowRight, BellRing, Check, FileDown, Globe2, Percent, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { HeroInvoice } from "@/components/landing/HeroInvoice";
import { primaryButton, secondaryButton } from "@/components/ui";
import { DemoButton } from "@/components/DemoButton";
import { Preferences } from "@/components/Preferences";
import { LandingMenu } from "@/components/LandingMenu";
import { getT } from "@/i18n/server";

export default async function Home() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  const dict = await getT();
  const t = dict.landing;

  return (
    <div className="paper-grain flex flex-1 flex-col overflow-x-clip">
      {/* On phones the header is near-solid with no backdrop blur: re-blurring the grain and scroll animations behind it
          on every frame made it shake while scrolling on iPhone. It also gets its own GPU layer. */}
      <header className="sticky top-0 z-30 transform-gpu border-b border-line/50 bg-bg/95 sm:border-transparent sm:bg-bg/80 sm:backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            {[
              ["#features", t.nav.features],
              ["#how", t.nav.how],
              ["#pricing", t.nav.pricing],
              ["#faq", t.nav.faq],
            ].map(([href, label]) => (
              <a key={href} href={href} className="transition hover:text-fg">
                {label}
              </a>
            ))}
          </nav>
          {/* Phones: logo · theme/language · menu (like Rentigo). */}
          <div className="flex items-center gap-2 sm:hidden">
            <Preferences compact />
            <LandingMenu openLabel={dict.nav.openMenu} closeLabel={dict.nav.closeMenu}>
              <nav className="grid">
                {[
                  ["#features", t.nav.features],
                  ["#how", t.nav.how],
                  ["#pricing", t.nav.pricing],
                  ["#faq", t.nav.faq],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="flex min-h-12 items-center border-b border-line/70 text-base font-medium">
                    {label}
                  </a>
                ))}
              </nav>
              {signedIn ? (
                <Link href="/app" className={`${primaryButton} mt-4 w-full`}>
                  {t.openApp} <ArrowRight className="size-4" />
                </Link>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href="/login" className={secondaryButton}>
                    {t.logIn}
                  </Link>
                  <Link href="/signup" className={primaryButton}>
                    {t.startFree}
                  </Link>
                </div>
              )}
            </LandingMenu>
          </div>
          <div className="flex items-center gap-2 max-sm:hidden">
            <Preferences />
            {signedIn ? (
              <Link href="/app" className={primaryButton}>
                {t.openApp} <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-surface">
                  {t.logIn}
                </Link>
                <Link href="/signup" className={primaryButton}>
                  {t.startFree}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pt-20">
          <div className="stagger">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-card">
              <span className="size-1.5 rounded-full bg-brand" /> {t.badge}
            </p>
            <h1 className="mt-6 font-display text-[3.4rem] leading-[0.95] tracking-tight text-balance sm:text-7xl">
              {t.heroA} <em className="text-brand">{t.heroB}</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted text-balance">
              {t.heroText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={signedIn ? "/app" : "/signup"} className={`${primaryButton} group px-6 py-3 text-base`}>
                {signedIn ? t.goToDashboard : t.createFirst}
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              {signedIn ? (
                <a href="#how" className={`${secondaryButton} px-6 py-3 text-base`}>
                  {t.seeHow}
                </a>
              ) : (
                <DemoButton className={`${secondaryButton} px-6 py-3 text-base`} />
              )}
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {t.perks.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand" /> {p}
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
            {[...t.marquee, ...t.marquee].map((m, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {m} <span className="text-brand">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="reveal max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">{t.featuresEyebrow}</p>
            <h2 className="mt-3 font-display text-5xl leading-none tracking-tight text-balance">{t.featuresTitle}</h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-4">
              <Percent className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">{t.vatTitle}</h3>
              <p className="mt-2 max-w-md text-sm text-muted">{t.vatText}</p>
              <div className="mt-6 grid max-w-sm gap-1.5 rounded-2xl bg-surface-2 p-4 font-mono text-xs">
                <div className="flex justify-between"><span className="text-muted">{t.subtotal}</span><span>€720.00</span></div>
                <div className="flex justify-between"><span className="text-muted">{t.discount}</span><span>−€72.00</span></div>
                <div className="flex justify-between"><span className="text-muted">{t.vat}</span><span>€116.64</span></div>
                <div className="flex justify-between border-t border-line pt-1.5 font-bold"><span>{t.total}</span><span>€764.64</span></div>
              </div>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <FileDown className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">{t.pdfTitle}</h3>
              <p className="mt-2 text-sm text-muted">{t.pdfText}</p>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <BellRing className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">{t.overdueTitle}</h3>
              <p className="mt-2 text-sm text-muted">{t.overdueText}</p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs font-semibold">
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-muted">{dict.status.draft}</span>
                <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-700 dark:text-sky-400">{dict.status.sent}</span>
                <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-red-700 dark:text-red-400">{dict.status.overdue}</span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">{dict.status.paid}</span>
              </div>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <Users className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">{t.teamTitle}</h3>
              <p className="mt-2 text-sm text-muted">{t.teamText}</p>
            </article>
            <article className="reveal lift rounded-3xl border border-line bg-surface p-6 md:col-span-2">
              <ShieldCheck className="size-6 text-brand" />
              <h3 className="mt-4 text-xl font-semibold">{t.privateTitle}</h3>
              <p className="mt-2 text-sm text-muted">{t.privateText}</p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-line bg-surface/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
            <h2 className="reveal max-w-xl font-display text-5xl leading-none tracking-tight">{t.howTitle}</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {t.steps.map((s, i) => (
                <li key={s.title} className="reveal">
                  <span className="font-display text-6xl text-brand/80">0{i + 1}</span>
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
            <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">{t.pricingEyebrow}</p>
            <h2 className="mt-3 font-display text-5xl leading-none tracking-tight">{t.pricingTitle}</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
            <div className="reveal rounded-3xl border border-line bg-surface p-7">
              <p className="font-semibold">{t.free}</p>
              <p className="mt-2 font-display text-5xl">€0</p>
              <p className="text-sm text-muted">{t.forever}</p>
              <ul className="mt-6 grid gap-2.5 text-sm">
                {t.freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-brand" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`${secondaryButton} mt-8 w-full`}>
                {t.startFree}
              </Link>
            </div>
            <div className="reveal relative overflow-hidden rounded-3xl bg-[#0f2e28] p-7 text-[#ecebe6] shadow-[0_30px_60px_-30px_rgb(15_118_110/0.6)]">
              <span className="absolute top-5 right-5 rounded-full bg-[#e0b75a] px-2.5 py-0.5 text-xs font-bold text-[#16181b]">{t.popular}</span>
              <p className="font-semibold">Pro</p>
              <p className="mt-2 font-display text-5xl">€9</p>
              <p className="text-sm text-[#ecebe6]/70">{t.perMonth}</p>
              <ul className="mt-6 grid gap-2.5 text-sm">
                {t.proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-[#34d3b4]" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#34d3b4] px-4 py-2.5 text-sm font-semibold text-[#052a23] transition hover:brightness-110 active:scale-[0.98]">
                {t.tryPro}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <h2 className="reveal font-display text-5xl leading-none tracking-tight">{t.faqTitle}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {t.faq.map((f) => (
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
            <h2 className="max-w-2xl font-display text-5xl leading-none tracking-tight text-balance sm:text-6xl">{t.ctaTitle}</h2>
            <Link href={signedIn ? "/app" : "/signup"} className="group inline-flex items-center gap-2 rounded-xl bg-[#34d3b4] px-6 py-3 text-base font-semibold text-[#052a23] transition hover:brightness-110 active:scale-[0.98]">
              {signedIn ? t.openFaturo : t.ctaStart} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            {!signedIn && (
              <DemoButton
                label={t.ctaDemo}
                className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#ecebe6]/75 underline-offset-4 transition hover:text-[#ecebe6] hover:underline"
              />
            )}
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <Logo />
          <span>
            © 2026 · {t.builtBy}{" "}
            <a href="https://arianitxhafa.github.io" className="font-semibold text-fg hover:text-brand">
              Arianit Xhafa
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
