// CSV that opens correctly in Excel, Numbers and Google Sheets (pure, unit-tested).

export type Cell = string | number | null | undefined;

/**
 * Quotes a cell when needed, and neutralises spreadsheet formulas: a client name like
 * `=HYPERLINK(...)` would otherwise run when the accountant opens the file (CSV injection).
 */
export function csvCell(value: Cell) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n;]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 BOM so Excel reads ë, ç and € correctly; CRLF line endings per RFC 4180. */
export function toCsv(rows: Cell[][]) {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** Cents → "1234.50" (a plain number spreadsheets can sum, no currency symbol). */
export const centsToDecimal = (cents: number) => (cents / 100).toFixed(2);
