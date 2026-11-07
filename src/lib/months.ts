/** "YYYY-MM" keys for the last `n` months, oldest first, ending with the month of `isoDate`. */
export function monthsEndingAt(n: number, isoDate: string) {
  const [y, m] = isoDate.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1)).toISOString().slice(0, 7));
}

const SHORT = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  sq: ["jan", "shk", "mar", "pri", "maj", "qer", "korr", "gush", "sht", "tet", "nën", "dhj"],
};

/** "2026-11" → "Nov" (or "Nov 2026" with the year); Albanian "nën 2026". Names by hand so server and browser agree. */
export function monthLabel(key: string, withYear = false, locale: "en" | "sq" = "en") {
  const [y, m] = key.split("-").map(Number);
  return withYear ? `${SHORT[locale][m - 1]} ${y}` : SHORT[locale][m - 1];
}
