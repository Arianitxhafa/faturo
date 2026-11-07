import { app } from "./app";
import { landing } from "./landing";

// Each namespace keeps English and Albanian side by side; `sq` is typed as `typeof en`,
// so a missing or misspelled key fails the type check.
export const dictionaries = {
  en: { ...app.en, landing: landing.en },
  sq: { ...app.sq, landing: landing.sq },
};

export type Dict = (typeof dictionaries)["en"];
