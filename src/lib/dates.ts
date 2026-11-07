// Dates in English or Albanian, built by hand: browsers (and headless Chrome) don't all ship
// Albanian date data, so Intl would print English on the client and break hydration.
// Only the numbers come from Intl, which is the same everywhere.

export type DateLocale = "en" | "sq";

export const MONTHS = {
  en: { short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] },
  sq: { short: ["jan", "shk", "mar", "pri", "maj", "qer", "korr", "gush", "sht", "tet", "nën", "dhj"], long: ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"] },
};
const DAYS = {
  en: { short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], long: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
  sq: { short: ["Die", "Hën", "Mar", "Mër", "Enj", "Pre", "Sht"], long: ["e diel", "e hënë", "e martë", "e mërkurë", "e enjte", "e premte", "e shtunë"] },
};
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DateStyle = { weekday?: "short" | "long"; day?: boolean; month?: "short" | "long"; year?: boolean; time?: boolean };

/** "7 Nov 2026", "Saturday 7 November 2026", "7 Nov, 14:30" — or "7 nën 2026", "e shtunë 7 nëntor 2026"… */
export function formatDate(date: Date, locale: DateLocale = "en", style: DateStyle = { day: true, month: "short", year: true }, timeZone = "Europe/Belgrade") {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  const out: string[] = [];
  if (style.weekday) out.push(DAYS[locale][style.weekday][EN_WEEKDAYS.indexOf(p.weekday)]);
  if (style.day) out.push(String(Number(p.day)));
  if (style.month) out.push(MONTHS[locale][style.month][Number(p.month) - 1]);
  if (style.year) out.push(p.year);
  const text = out.join(" ");
  return style.time ? `${text}${text ? ", " : ""}${p.hour}:${p.minute}` : text;
}

/** A YYYY-MM-DD calendar date (no time zone shift). */
export const formatDay = (iso: string, locale: DateLocale = "en", style?: DateStyle) => formatDate(new Date(`${iso}T12:00:00Z`), locale, style, "UTC");
