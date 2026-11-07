import Link from "next/link";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-[10px] bg-brand text-brand-ink shadow-sm ${className}`}>
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {/* A receipt with a torn bottom edge */}
        <path d="M6 3h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 20z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 text-fg" aria-label="Faturo home">
      <LogoMark />
      <span className="font-display text-[1.65rem] leading-none tracking-tight transition-colors group-hover:text-brand">Faturo</span>
    </Link>
  );
}
