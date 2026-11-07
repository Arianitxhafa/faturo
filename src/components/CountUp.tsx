"use client";

import { useEffect, useRef } from "react";
import { formatMoney } from "@/lib/money";

// Props are plain data (no functions) so server components can render it.
type Props = { value: number; currency?: string; duration?: number };

/**
 * Renders the final value on the server, then counts up to it once in the browser.
 * Writes to the DOM directly so the animation doesn't re-render React 60 times a second.
 */
export function CountUp({ value, currency, duration = 1100 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) => (currency ? formatMoney(n, currency) : n.toLocaleString("en-GB"));

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      el.textContent = format(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = format(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- format only depends on currency
  }, [value, duration, currency]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}
