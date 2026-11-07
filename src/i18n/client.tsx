"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale, Theme } from "./config";
import { dictionaries } from "./messages";
import { makeTr } from "./tr";

const PrefsContext = createContext<{ locale: Locale; theme: Theme }>({ locale: "en", theme: "system" });

/** Provided once in the root layout with the language and theme the server picked. */
export function I18nProvider({ locale, theme, children }: { locale: Locale; theme: Theme; children: React.ReactNode }) {
  return <PrefsContext value={{ locale, theme }}>{children}</PrefsContext>;
}

export const useLocale = () => useContext(PrefsContext).locale;
export const useSavedTheme = () => useContext(PrefsContext).theme;
export const useT = () => dictionaries[useLocale()];
/** Stable per language, so it can sit in effect dependency lists. */
export const useTr = () => {
  const locale = useLocale();
  return useMemo(() => makeTr(locale), [locale]);
};
