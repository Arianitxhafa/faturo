import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eyebrow, pageTitle } from "./ui";

type Props = {
  label: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
};

export function PageHeader({ label, title, description, back, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="group inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
            <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" aria-hidden /> {back.label}
          </Link>
        ) : (
          <p className={eyebrow}>{label}</p>
        )}
        <h1 className={`${pageTitle} mt-2`}>{title}</h1>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
