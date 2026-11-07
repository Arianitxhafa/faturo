import { AUTH } from "./catalog/auth";
import { DASHBOARD } from "./catalog/dashboard";
import { INVOICES } from "./catalog/invoices";
import { ACTIVITY } from "./catalog/activity";
import { EDITOR } from "./catalog/editor";
import { CLIENTS } from "./catalog/clients";
import { TEAM } from "./catalog/team";
import { SETTINGS } from "./catalog/settings";
import { BILLING } from "./catalog/billing";
import { PUBLIC } from "./catalog/public";

/** English text → Albanian, for `tr()` (see ../tr.ts). */
export const SQ: Record<string, string> = { ...AUTH, ...DASHBOARD, ...INVOICES, ...ACTIVITY, ...EDITOR, ...CLIENTS, ...TEAM, ...SETTINGS, ...BILLING, ...PUBLIC };
