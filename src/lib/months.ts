/** "YYYY-MM" keys for the last `n` months, oldest first, ending with the month of `isoDate`. */
export function monthsEndingAt(n: number, isoDate: string) {
  const [y, m] = isoDate.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1)).toISOString().slice(0, 7));
}

/** "2026-11" → "Nov" (or "Nov 2026" with the year). */
export function monthLabel(key: string, withYear = false) {
  return new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });
}
