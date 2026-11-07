// Shared Tailwind class strings, so controls look and move the same everywhere.
export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg shadow-[inset_0_1px_0_rgb(0_0_0/0.02)] outline-none transition placeholder:text-muted/70 hover:border-muted/40 focus:border-brand focus:ring-4 focus:ring-brand/15";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60";

export const primaryButton = `${buttonBase} bg-brand text-brand-ink shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-8px_var(--brand)] hover:brightness-110 hover:shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_10px_22px_-8px_var(--brand)]`;

export const secondaryButton = `${buttonBase} border border-line bg-surface text-fg hover:border-muted/40 hover:bg-surface-2`;

export const ghostButton = `${buttonBase} text-muted hover:bg-surface-2 hover:text-fg`;

export const card = "rounded-2xl border border-line bg-surface shadow-card";

export const eyebrow = "text-xs font-semibold tracking-[0.14em] text-brand uppercase";

export const pageTitle = "font-display text-4xl leading-none tracking-tight sm:text-5xl";
