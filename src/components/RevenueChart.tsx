"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { monthLabel } from "@/lib/months";
import { useLocale, useTr } from "@/i18n/client";

type Point = { month: string; cents: number; count: number };

const W = 720;
const H = 240;
const PAD = { top: 12, right: 8, bottom: 28, left: 56 };
const GAP = 2; // surface gap between adjacent bars

/** Rounds the axis maximum up to a "nice" number so gridlines land on readable values. */
function niceMax(v: number) {
  if (v <= 0) return 10000;
  const exp = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= v)!;
  return step * exp;
}

export function RevenueChart({ data, currency }: { data: Point[]; currency: string }) {
  const [active, setActive] = useState<number | null>(null);
  const tr = useTr();
  const locale = useLocale();
  const label = (month: string, year = false) => monthLabel(month, year, locale);
  const max = niceMax(Math.max(...data.map((d) => d.cents)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(36, slot - GAP * 2);
  const y = (c: number) => PAD.top + plotH - (c / max) * plotH;
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const compact = (c: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency, notation: "compact", maximumFractionDigits: 2 }).format(c / 100);
  const empty = data.every((d) => d.cents === 0);
  const point = active !== null ? data[active] : null;

  return (
    <figure className="relative m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={tr("Paid revenue per month for the last 12 months")} onMouseLeave={() => setActive(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fill="var(--muted)" fontSize={11}>
              {compact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const h = Math.max(0, y(0) - y(d.cents));
          const r = Math.min(4, h, barW / 2);
          const top = y(0) - h;
          const isCurrent = i === data.length - 1;
          return (
            <g key={d.month}>
              {h > 0 && (
                // Rounded data end, square at the baseline.
                <path
                  d={`M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${y(0)} Z`}
                  fill="var(--chart)"
                  opacity={active === null || active === i ? 1 : 0.45}
                  // Bars grow up from the baseline one after another.
                  style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `grow-y 0.8s cubic-bezier(0.22,1,0.36,1) ${250 + i * 45}ms both`, transition: "opacity 0.2s" }}
                />
              )}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fill={isCurrent ? "var(--fg)" : "var(--muted)"} fontSize={11} fontWeight={isCurrent ? 600 : 400}>
                {label(d.month)}
              </text>
              {/* Hit target: the whole column, bigger than the bar. */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                aria-label={tr(d.count === 1 ? "{month}: {amount} from {n} paid invoice" : "{month}: {amount} from {n} paid invoices", { month: label(d.month, true), amount: formatMoney(d.cents, currency), n: d.count })}
              />
            </g>
          );
        })}
      </svg>

      {point && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
          style={{ left: `${((PAD.left + (active! + 0.5) * slot) / W) * 100}%` }}
        >
          <p className="font-semibold">{label(point.month, true)}</p>
          <p className="tabular-nums">{formatMoney(point.cents, currency)}</p>
          <p className="text-muted">
            {tr(point.count === 1 ? "{n} paid invoice" : "{n} paid invoices", { n: point.count })}
          </p>
        </div>
      )}

      {empty && (
        <figcaption className="absolute inset-0 grid place-items-center text-center text-sm text-muted">
          {tr("Revenue appears here when invoices are marked as paid.")}
        </figcaption>
      )}

      {/* Same data as a table for screen readers. */}
      <table className="sr-only">
        <caption>{tr("Paid revenue per month")}</caption>
        <thead>
          <tr>
            <th>{tr("Month")}</th>
            <th>{tr("Revenue")}</th>
            <th>{tr("Paid invoices")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{label(d.month, true)}</td>
              <td>{formatMoney(d.cents, currency)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
