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
const roleName = (v: ActivityMeta[string] | undefined) => s(v).toLowerCase();

/**
 * @param linkable whether the entity still exists (so the sentence may link to it)
 */
export function describeActivity(action: string, meta: ActivityMeta, entityId: string | null, linkable: boolean): Described {
  const invoice = (label = s(meta.number)): Segment => ({ text: label, strong: true, href: linkable && entityId ? `/app/invoices/${entityId}` : undefined });
  const client = (): Segment => ({ text: s(meta.client), strong: true, href: linkable && entityId ? `/app/clients/${entityId}` : undefined });
  const amount = meta.total ? [{ text: ` (${s(meta.total)})` }] : [];

  switch (action as Action) {
    case "workspace.created":
      return { tone: "workspace", segments: [{ text: "created the workspace " }, { text: s(meta.name), strong: true }] };
    case "client.created":
      return { tone: "client", segments: [{ text: "added the client " }, client()] };
    case "client.updated":
      return { tone: "client", segments: [{ text: "updated the client " }, client()] };
    case "client.deleted":
      return { tone: "danger", segments: [{ text: "deleted the client " }, { text: s(meta.client), strong: true }] };
    case "invoice.created":
      return { tone: "invoice", segments: [{ text: "created " }, invoice(), { text: " for " }, { text: s(meta.client) }, ...amount] };
    case "invoice.duplicated":
      return { tone: "invoice", segments: [{ text: "duplicated " }, { text: s(meta.from), strong: true }, { text: " as " }, invoice()] };
    case "invoice.updated":
      return { tone: "invoice", segments: [{ text: "edited " }, invoice(), ...amount] };
    case "invoice.sent":
      return { tone: "invoice", segments: [{ text: "marked " }, invoice(), { text: " as sent" }] };
    case "invoice.paid":
      return { tone: "payment", segments: [{ text: "recorded the payment for " }, invoice(), ...amount] };
    case "invoice.unpaid":
      return { tone: "danger", segments: [{ text: "marked " }, invoice(), { text: " as unpaid" }] };
    case "invoice.draft":
      return { tone: "invoice", segments: [{ text: "moved " }, invoice(), { text: " back to draft" }] };
    case "invoice.deleted":
      return { tone: "danger", segments: [{ text: "deleted the draft " }, { text: s(meta.number), strong: true }] };
    case "member.invited":
      return { tone: "team", segments: [{ text: "invited " }, { text: s(meta.email), strong: true }, { text: ` as ${roleName(meta.role)}` }] };
    case "invite.revoked":
      return { tone: "danger", segments: [{ text: "revoked the invite for " }, { text: s(meta.email), strong: true }] };
    case "member.joined":
      return { tone: "team", segments: [{ text: `joined the team as ${roleName(meta.role)}` }] };
    case "member.role_changed":
      return {
        tone: "team",
        segments: [{ text: "changed " }, { text: s(meta.name), strong: true }, { text: `'s role from ${roleName(meta.from)} to ${roleName(meta.to)}` }],
      };
    case "member.removed":
      return { tone: "danger", segments: [{ text: "removed " }, { text: s(meta.name), strong: true }, { text: " from the team" }] };
    case "member.left":
      return { tone: "danger", segments: [{ text: "left the team" }] };
    case "billing.upgraded":
      return { tone: "payment", segments: [{ text: "upgraded to " }, { text: "Pro", strong: true, href: "/app/billing" }, ...amount, { text: " ✨" }] };
    case "billing.canceled":
      return { tone: "danger", segments: [{ text: "cancelled Pro — it stays active until " }, { text: s(meta.date), strong: true }] };
    case "billing.resumed":
      return { tone: "payment", segments: [{ text: "resumed the " }, { text: "Pro", strong: true, href: "/app/billing" }, { text: " subscription" }] };
    case "billing.renewed":
      return { tone: "payment", segments: [{ text: "Pro renewed", strong: true, href: "/app/billing" }, { text: ` for another month${meta.total ? ` (${s(meta.total)})` : ""}` }] };
    case "billing.downgraded":
      return { tone: "danger", segments: [{ text: "The workspace moved to the " }, { text: "Free plan", strong: true, href: "/app/billing" }] };
    default:
      return { tone: "workspace", segments: [{ text: action }] };
  }
}

export const plainText = (d: Described) => d.segments.map((x) => x.text).join("");

/** "just now", "5 min ago", "3 h ago", "2 days ago", then the date. */
export function relativeTime(date: Date, now = new Date()) {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Belgrade" });
}
