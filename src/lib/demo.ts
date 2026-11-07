import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { and, gte, inArray, like, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { activity, clients, invites, invoiceItems, invoices, memberships, users, workspaces, type ActivityMeta } from "@/db/schema";
import { computeTotals, formatMoney, invoiceNumberLabel } from "@/lib/money";
import { createToken } from "@/lib/tokens";
import { addDays, today } from "@/lib/invoice-status";
import { hashPassword } from "@/lib/password";

// Demo accounts live on a reserved TLD, so they can never collide with a real address.
export const DEMO_EMAIL_DOMAIN = "@demo.faturo.invalid";
const DEMO_TTL = sql`now() - interval '24 hours'`;
const MAX_DEMOS_PER_DAY = 500;

export const isDemoEmail = (email?: string | null) => Boolean(email?.endsWith(DEMO_EMAIL_DOMAIN));

const CLIENTS = [
  { name: "Restaurant Liburnia", email: "accounts@liburnia.example", address: "Rr. Agim Ramadani 15, Prishtinë", taxNumber: "810004521" },
  { name: "Hotel Sharri", email: "finance@hotelsharri.example", address: "Rr. Shuaip Spahiu 3, Prizren", taxNumber: "810112309" },
  { name: "Dardania Tech", email: "billing@dardaniatech.example", address: "Bulevardi Bill Clinton 40, Prishtinë", taxNumber: "811730056" },
  { name: "Kafe Prishtina", email: "hello@kafeprishtina.example", address: "Rr. UÇK 22, Prishtinë", taxNumber: null },
  { name: "Studio Iliria", email: "studio@iliria.example", address: "Rr. Myslym Shyri 8, Tiranë", taxNumber: "L91234567A" },
];

// [description, quantity in hundredths, unit price in cents, VAT bps]
type Line = [string, number, number, number];
const SERVICES: Line[][] = [
  [["Website design", 100, 60000, 1800], ["Hosting · 12 months", 100, 12000, 1800]],
  [["Brand identity", 100, 45000, 1800]],
  [["Social media management · monthly", 100, 28000, 1800], ["Photography session", 200, 9000, 1800]],
  [["Maintenance & support", 650, 2500, 1800]],
  [["Menu design", 100, 18000, 1800], ["Print-ready files", 100, 4000, 1800]],
  [["SEO audit", 100, 35000, 1800], ["Keyword report", 100, 8000, 0]],
  [["Landing page", 100, 42000, 1800], ["Copywriting", 300, 3500, 1800]],
];

/** Small deterministic PRNG so every demo looks the same but not robotic. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

type Planned = { clientIdx: number; lines: Line[]; issue: string; due: string; status: "draft" | "sent" | "paid"; paidOn?: string; discountBps?: number };

function plan(now: string): Planned[] {
  const rand = rng(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const out: Planned[] = [];
  const [y, m] = now.split("-").map(Number);

  // Two paid invoices in each of the last 11 months, a bit busier towards the present.
  for (let back = 11; back >= 1; back--) {
    const d = new Date(Date.UTC(y, m - 1 - back, 1));
    const month = d.toISOString().slice(0, 7);
    const count = back <= 4 ? 3 : 2;
    for (let k = 0; k < count; k++) {
      const issue = `${month}-${String(3 + k * 9).padStart(2, "0")}`;
      const lines = pick(SERVICES);
      out.push({ clientIdx: Math.floor(rand() * CLIENTS.length), lines, issue, due: addDays(issue, 15), status: "paid", paidOn: addDays(issue, 6 + Math.floor(rand() * 8)), discountBps: rand() < 0.2 ? 1000 : 0 });
    }
  }
  // This month: one already paid, two open, two overdue and a draft.
  const paidIssue = addDays(now, -6);
  out.push({ clientIdx: 2, lines: SERVICES[0], issue: paidIssue, due: addDays(paidIssue, 15), status: "paid", paidOn: addDays(now, -1) });
  out.push({ clientIdx: 3, lines: SERVICES[2], issue: addDays(now, -48), due: addDays(now, -33), status: "sent" });
  out.push({ clientIdx: 1, lines: SERVICES[5], issue: addDays(now, -36), due: addDays(now, -21), status: "sent" });
  out.push({ clientIdx: 0, lines: SERVICES[6], issue: addDays(now, -5), due: addDays(now, 10), status: "sent" });
  out.push({ clientIdx: 4, lines: SERVICES[1], issue: addDays(now, -2), due: addDays(now, 13), status: "sent" });
  out.push({ clientIdx: 3, lines: SERVICES[4], issue: now, due: addDays(now, 15), status: "draft" });

  return out.sort((a, b) => a.issue.localeCompare(b.issue));
}

// A moment on a given day — never in the future (today's 09:00 may not have happened yet).
const at = (isoDate: string, hour: number) => {
  const t = new Date(`${isoDate}T${String(hour).padStart(2, "0")}:00:00Z`);
  const latest = Date.now() - 60_000;
  return t.getTime() > latest ? new Date(latest - (24 - hour) * 60_000) : t;
};

/** Removes demo accounts (and their workspaces) older than 24 hours. */
export async function purgeOldDemos() {
  const oldUsers = db.select({ id: users.id }).from(users).where(and(like(users.email, `%${DEMO_EMAIL_DOMAIN}`), lt(users.createdAt, DEMO_TTL)));
  const oldWorkspaces = db.select({ id: memberships.workspaceId }).from(memberships).where(inArray(memberships.userId, oldUsers));
  // Invoices first: clients are referenced with ON DELETE RESTRICT.
  await db.batch([
    db.delete(invoices).where(inArray(invoices.workspaceId, oldWorkspaces)),
    db.delete(workspaces).where(inArray(workspaces.id, oldWorkspaces)),
    db.delete(users).where(and(like(users.email, `%${DEMO_EMAIL_DOMAIN}`), lt(users.createdAt, DEMO_TTL))),
  ]);
}

/** Creates a fresh demo user with a workspace full of realistic invoices. Returns credentials to sign in with. */
export async function createDemoAccount() {
  await purgeOldDemos();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(like(users.email, `demo-%${DEMO_EMAIL_DOMAIN}`), gte(users.createdAt, DEMO_TTL)));
  if (n >= MAX_DEMOS_PER_DAY) throw new Error("demo-limit");

  const email = `demo-${randomBytes(6).toString("hex")}${DEMO_EMAIL_DOMAIN}`;
  const password = randomBytes(18).toString("base64url");
  const userId = randomUUID();
  const workspaceId = randomUUID();
  const clientIds = CLIENTS.map(() => randomUUID());
  const now = today();
  const tag = randomBytes(4).toString("hex");

  // Two teammates (they can't log in: "disabled" is not a valid password hash) and one pending invite.
  const team = [
    { id: randomUUID(), name: "Elira Hoxha", email: `team-${tag}-elira${DEMO_EMAIL_DOMAIN}`, role: "admin" as const, joined: addDays(now, -300) },
    { id: randomUUID(), name: "Driton Berisha", email: `team-${tag}-driton${DEMO_EMAIL_DOMAIN}`, role: "member" as const, joined: addDays(now, -120) },
  ];
  const [elira] = team;
  const log: (typeof activity.$inferInsert)[] = [];
  const add = (actorId: string, action: string, createdAt: Date, meta: ActivityMeta, entityType?: string, entityId?: string) =>
    log.push({ workspaceId, actorId, action, createdAt, meta, entityType, entityId });

  const start = addDays(now, -365);
  add(userId, "workspace.created", at(start, 8), { name: "Arbën Design Studio" }, "workspace", workspaceId);
  CLIENTS.forEach((c, i) => add(userId, "client.created", at(addDays(start, i * 3), 9), { client: c.name }, "client", clientIds[i]));
  for (const m of team) {
    add(userId, "member.invited", at(addDays(m.joined, -1), 15), { email: `${m.name.split(" ")[0].toLowerCase()}@arbendesign.example`, role: m.role }, "invite");
    add(m.id, "member.joined", at(m.joined, 9), { role: m.role }, "member", m.id);
  }
  add(userId, "member.invited", at(addDays(now, -2), 11), { email: "accountant@arbendesign.example", role: "member" }, "invite");

  const invoiceRows: (typeof invoices.$inferInsert)[] = [];
  const itemRows: (typeof invoiceItems.$inferInsert)[] = [];
  plan(now).forEach((p, i) => {
    const id = randomUUID();
    const lines = p.lines.map(([, quantityHundredths, unitPriceCents, vatRateBps]) => ({ quantityHundredths, unitPriceCents, vatRateBps }));
    const t = computeTotals(lines, p.discountBps ?? 0);
    invoiceRows.push({
      id,
      workspaceId,
      clientId: clientIds[p.clientIdx],
      number: i + 1,
      status: p.status,
      currency: "EUR",
      issueDate: p.issue,
      dueDate: p.due,
      discountBps: p.discountBps ?? 0,
      subtotalCents: t.subtotalCents,
      discountCents: t.discountCents,
      vatCents: t.vatCents,
      totalCents: t.totalCents,
      notes: "Thank you for your business!",
      sentAt: p.status === "draft" ? null : at(p.issue, 10),
      paidAt: p.paidOn ? at(p.paidOn, 12) : null,
      createdBy: userId,
      createdAt: at(p.issue, 9),
      updatedAt: at(p.paidOn ?? p.issue, 12),
    });
    // History: Elira (admin) handles some of the invoicing once she has joined.
    const author = p.issue >= elira.joined && i % 3 === 0 ? elira.id : userId;
    const meta = { number: invoiceNumberLabel(i + 1), total: formatMoney(t.totalCents, "EUR"), client: CLIENTS[p.clientIdx].name };
    add(author, "invoice.created", at(p.issue, 9), meta, "invoice", id);
    if (p.status !== "draft") add(author, "invoice.sent", at(p.issue, 10), meta, "invoice", id);
    if (p.paidOn) add(userId, "invoice.paid", at(p.paidOn, 12), meta, "invoice", id);
    p.lines.forEach(([description, quantityHundredths, unitPriceCents, vatRateBps], position) =>
      itemRows.push({ invoiceId: id, position, description, quantityHundredths, unitPriceCents, vatRateBps, lineTotalCents: t.lineTotals[position] })
    );
  });

  await db.batch([
    db.insert(users).values({ id: userId, name: "Demo User", email, passwordHash: await hashPassword(password) }),
    db.insert(workspaces).values({ id: workspaceId, name: "Arbën Design Studio", currency: "EUR", address: "Rr. Nëna Terezë 12, Prishtinë", taxNumber: "811234567", iban: "XK00 0000 0000 0000 0000" }),
    db.insert(users).values(team.map((m) => ({ id: m.id, name: m.name, email: m.email, passwordHash: "disabled" }))),
    db.insert(memberships).values([
      { workspaceId, userId, role: "owner" as const, createdAt: at(start, 8) },
      ...team.map((m) => ({ workspaceId, userId: m.id, role: m.role, createdAt: at(m.joined, 9) })),
    ]),
    db.insert(invites).values({
      workspaceId,
      email: "accountant@arbendesign.example",
      role: "member",
      tokenHash: createToken().hash,
      invitedBy: userId,
      createdAt: at(addDays(now, -2), 11),
      expiresAt: new Date(Date.now() + 5 * 86_400_000), // in the future, so not via at()
    }),
    db.insert(clients).values(CLIENTS.map((c, i) => ({ id: clientIds[i], workspaceId, ...c }))),
    db.insert(invoices).values(invoiceRows),
    db.insert(invoiceItems).values(itemRows),
    db.insert(activity).values(log),
  ]);

  return { email, password };
}
