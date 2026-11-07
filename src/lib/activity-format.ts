import type { ActivityMeta } from "@/db/schema";

// Turns an activity row into a short sentence (pure, unit-tested). The actor's name is rendered separately.

export const ACTIONS = [
  "workspace.created",
  "client.created",
  "client.updated",
  "client.deleted",
  "invoice.created",
  "invoice.duplicated",
  "invoice.updated",
  "invoice.sent",
  "invoice.paid",
  "invoice.unpaid",
  "invoice.draft",
  "invoice.deleted",
  "member.invited",
  "invite.revoked",
  "member.joined",
  "member.role_changed",
  "member.removed",
  "member.left",
  "invoice.shared",
  "invoice.unshared",
  "invoice.viewed",
  "workspace.updated",
  "billing.upgraded",
  "billing.canceled",
  "billing.resumed",
  "billing.renewed",
  "billing.downgraded",
] as const;
export type Action = (typeof ACTIONS)[number];

export type Tone = "invoice" | "payment" | "client" | "team" | "danger" | "workspace";
export type Segment = { text: string; strong?: boolean; href?: string };
export type Described = { tone: Tone; segments: Segment[] };

const s = (v: ActivityMeta[string] | undefined) => (v === null || v === undefined ? "" : String(v));
const roleKey = (v: ActivityMeta[string] | undefined) => s(v).toLowerCase();

/**
 * @param linkable whether the entity still exists (so the sentence may link to it)
 */
export function describeActivity(
  action: string,
  meta: ActivityMeta,
  entityId: string | null,
  linkable: boolean,
  tr: (text: string, vars?: Record<string, string>) => string = (t, v) => (v ? t.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m) : t)
): Described {
  const invoice = (label = s(meta.number)): Segment => ({ text: label, strong: true, href: linkable && entityId ? `/app/invoices/${entityId}` : undefined });
  const client = (): Segment => ({ text: s(meta.client), strong: true, href: linkable && entityId ? `/app/clients/${entityId}` : undefined });
  const amount = meta.total ? [{ text: ` (${s(meta.total)})` }] : [];
  const roleName = (v: ActivityMeta[string] | undefined) => tr(roleKey(v));

  switch (action as Action) {
    case "workspace.created":
      return { tone: "workspace", segments: [{ text: tr("created the workspace ") }, { text: s(meta.name), strong: true }] };
    case "client.created":
      return { tone: "client", segments: [{ text: tr("added the client ") }, client()] };
    case "client.updated":
      return { tone: "client", segments: [{ text: tr("updated the client ") }, client()] };
    case "client.deleted":
      return { tone: "danger", segments: [{ text: tr("deleted the client ") }, { text: s(meta.client), strong: true }] };
    case "invoice.created":
      return { tone: "invoice", segments: [{ text: tr("created ") }, invoice(), { text: tr(" for ") }, { text: s(meta.client) }, ...amount] };
    case "invoice.duplicated":
      return { tone: "invoice", segments: [{ text: tr("duplicated ") }, { text: s(meta.from), strong: true }, { text: tr(" as ") }, invoice()] };
    case "invoice.updated":
      return { tone: "invoice", segments: [{ text: tr("edited ") }, invoice(), ...amount] };
    case "invoice.sent":
      return { tone: "invoice", segments: [{ text: tr("marked ") }, invoice(), { text: tr(" as sent") }] };
    case "invoice.paid":
      return { tone: "payment", segments: [{ text: tr("recorded the payment for ") }, invoice(), ...amount] };
    case "invoice.unpaid":
      return { tone: "danger", segments: [{ text: tr("marked ") }, invoice(), { text: tr(" as unpaid") }] };
    case "invoice.draft":
      return { tone: "invoice", segments: [{ text: tr("moved ") }, invoice(), { text: tr(" back to draft") }] };
    case "invoice.deleted":
      return { tone: "danger", segments: [{ text: tr("deleted the draft ") }, { text: s(meta.number), strong: true }] };
    case "member.invited":
      return { tone: "team", segments: [{ text: tr("invited ") }, { text: s(meta.email), strong: true }, { text: tr(" as {role}", { role: roleName(meta.role) }) }] };
    case "invite.revoked":
      return { tone: "danger", segments: [{ text: tr("revoked the invite for ") }, { text: s(meta.email), strong: true }] };
    case "member.joined":
      return { tone: "team", segments: [{ text: tr("joined the team as {role}", { role: roleName(meta.role) }) }] };
    case "member.role_changed":
      return {
        tone: "team",
        segments: [{ text: tr("changed ") }, { text: s(meta.name), strong: true }, { text: tr("'s role from {from} to {to}", { from: roleName(meta.from), to: roleName(meta.to) }) }],
      };
    case "member.removed":
      return { tone: "danger", segments: [{ text: tr("removed ") }, { text: s(meta.name), strong: true }, { text: tr(" from the team") }] };
    case "member.left":
      return { tone: "danger", segments: [{ text: tr("left the team") }] };
    case "invoice.shared":
      return { tone: "invoice", segments: [{ text: tr("shared a public link to ") }, invoice()] };
    case "invoice.unshared":
      return { tone: "danger", segments: [{ text: tr("turned off the public link to ") }, invoice()] };
    case "invoice.viewed":
      return { tone: "payment", segments: [{ text: s(meta.client), strong: true }, { text: tr(" opened ") }, invoice(), { text: tr(" for the first time 👀") }] };
    case "workspace.updated":
      return { tone: "workspace", segments: [{ text: tr("updated the business details") }] };
    case "billing.upgraded":
      return { tone: "payment", segments: [{ text: tr("upgraded to ") }, { text: tr("Pro"), strong: true, href: "/app/billing" }, ...amount, { text: tr(" ✨") }] };
    case "billing.canceled":
      return { tone: "danger", segments: [{ text: tr("cancelled Pro — it stays active until ") }, { text: s(meta.date), strong: true }] };
    case "billing.resumed":
      return { tone: "payment", segments: [{ text: tr("resumed the ") }, { text: tr("Pro"), strong: true, href: "/app/billing" }, { text: tr(" subscription") }] };
    case "billing.renewed":
      return { tone: "payment", segments: [{ text: tr("Pro renewed"), strong: true, href: "/app/billing" }, { text: tr(" for another month") + (meta.total ? ` (${s(meta.total)})` : "") }] };
    case "billing.downgraded":
      return { tone: "danger", segments: [{ text: tr("The workspace moved to the ") }, { text: tr("Free plan"), strong: true, href: "/app/billing" }] };
    default:
      return { tone: "workspace", segments: [{ text: action }] };
  }
}

export const plainText = (d: Described) => d.segments.map((x) => x.text).join("");

const REL = {
  en: { now: "just now", min: (n: number) => `${n} min ago`, h: (n: number) => `${n} h ago`, d: (n: number) => `${n} day${n === 1 ? "" : "s"} ago`, months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
  sq: { now: "tani", min: (n: number) => `para ${n} min`, h: (n: number) => `para ${n} orësh`, d: (n: number) => (n === 1 ? "para 1 dite" : `para ${n} ditësh`), months: ["jan", "shk", "mar", "pri", "maj", "qer", "korr", "gush", "sht", "tet", "nën", "dhj"] },
};

/** "just now", "5 min ago", "3 h ago", "2 days ago", then the date — or "tani", "para 5 min"… in Albanian. */
export function relativeTime(date: Date, now = new Date(), locale: "en" | "sq" = "en") {
  const w = REL[locale];
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return w.now;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return w.min(minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return w.h(hours);
  const days = Math.round(hours / 24);
  if (days < 7) return w.d(days);
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(date).split("-").map(Number);
  return `${d} ${w.months[m - 1]} ${y}`;
}
