// Pure money maths for invoices. Everything is an integer:
//   money in cents, quantities in hundredths (1.5 h = 150), rates in basis points (18 % = 1800).
// No floating-point money ever reaches the database.

export const VAT_RATES_BPS = [1800, 800, 0] as const;

export type LineInput = { quantityHundredths: number; unitPriceCents: number; vatRateBps: number };

export type VatGroup = { rateBps: number; netCents: number; vatCents: number };

export type InvoiceTotals = {
  lineTotals: number[];
  subtotalCents: number;
  discountCents: number;
  vatCents: number;
  totalCents: number;
  vatGroups: VatGroup[];
};

/** Rounds half away from zero, so 0.5 cent → 1 cent and -0.5 → -1. */
function round(n: number) {
  return Math.sign(n) * Math.round(Math.abs(n));
}

export function lineTotalCents({ quantityHundredths, unitPriceCents }: Pick<LineInput, "quantityHundredths" | "unitPriceCents">) {
  return round((quantityHundredths * unitPriceCents) / 100);
}

/**
 * Subtotal → discount → VAT per rate → total.
 * The discount applies to every line proportionally, so VAT is charged on the discounted amount.
 */
export function computeTotals(lines: LineInput[], discountBps = 0): InvoiceTotals {
  const lineTotals = lines.map(lineTotalCents);
  const subtotalCents = lineTotals.reduce((a, b) => a + b, 0);

  const byRate = new Map<number, number>();
  lines.forEach((line, i) => byRate.set(line.vatRateBps, (byRate.get(line.vatRateBps) ?? 0) + lineTotals[i]));

  const vatGroups: VatGroup[] = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rateBps, gross]) => {
      const netCents = gross - round((gross * discountBps) / 10000);
      return { rateBps, netCents, vatCents: round((netCents * rateBps) / 10000) };
    });

  const netAfterDiscount = vatGroups.reduce((a, g) => a + g.netCents, 0);
  const discountCents = subtotalCents - netAfterDiscount;
  const vatCents = vatGroups.reduce((a, g) => a + g.vatCents, 0);

  return { lineTotals, subtotalCents, discountCents, vatCents, totalCents: netAfterDiscount + vatCents, vatGroups };
}

/** "1,250.5" / "1250,50" / "12" → cents. Returns null for anything that isn't a valid non-negative amount. */
export function parseMoney(input: string): number | null {
  return parseFixed(input, 2);
}

/** "1.5" → 150 hundredths. */
export function parseQuantity(input: string): number | null {
  return parseFixed(input, 2);
}

/** "18" or "18%" → 1800 basis points. */
export function parsePercent(input: string): number | null {
  const bps = parseFixed(input.replace("%", ""), 2);
  return bps === null || bps > 10000 ? null : bps;
}

function parseFixed(input: string, decimals: number): number | null {
  let s = input.trim().replace(/\s/g, "");
  if (!s) return null;
  // Accept both "1,250.50" and "1250,50": the last separator followed by 1-2 digits is the decimal point.
  const lastSep = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  if (lastSep !== -1 && s.length - lastSep - 1 <= decimals) {
    s = s.slice(0, lastSep).replace(/[.,]/g, "") + "." + s.slice(lastSep + 1);
  } else {
    s = s.replace(/[.,]/g, "");
  }
  if (!/^\d+(\.\d*)?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const value = Number(whole) * 10 ** decimals + Number((frac + "00").slice(0, decimals));
  return Number.isSafeInteger(value) ? value : null;
}

export function formatMoney(cents: number, currency: string, locale = "en-GB") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

export function formatQuantity(hundredths: number) {
  return (hundredths / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

export function formatRate(bps: number) {
  return `${(bps / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}%`;
}

export function invoiceNumberLabel(number: number) {
  return `INV-${String(number).padStart(4, "0")}`;
}
