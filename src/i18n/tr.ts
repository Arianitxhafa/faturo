import type { Locale } from "./config";
import { SQ } from "./messages/sq-catalog";

export type Vars = Record<string, string | number>;
export type Tr = (text: string, vars?: Vars) => string;

/**
 * Gettext-style lookup: the English text is the key, the Albanian catalog holds the translation.
 * Server-action errors (including zod messages) are translated the same way where they're shown.
 * `{name}` placeholders are filled from `vars`. `scripts/check-i18n.mjs` verifies every key exists.
 */
export function translate(locale: Locale, text: string, vars?: Vars) {
  const s = locale === "sq" ? (SQ[text] ?? text) : text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

export const makeTr =
  (locale: Locale): Tr =>
  (text, vars) =>
    translate(locale, text, vars);
