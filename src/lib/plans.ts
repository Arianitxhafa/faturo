// Plans, limits and the rules of the (simulated) billing cycle — pure, so they're unit-tested.

export type Plan = "free" | "pro";

export const PRO_PRICE_CENTS = 900; // €9.00 / month
export const BILLING_CURRENCY = "EUR";

export const PLAN_LIMITS: Record<Plan, { invoicesPerMonth: number; members: number }> = {
  free: { invoicesPerMonth: 5, members: 1 },
  pro: { invoicesPerMonth: Infinity, members: Infinity },
};

export const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ["5 invoices a month", "Just you", "PDF download", "Dashboard & overdue alerts"],
  pro: ["Unlimited invoices", "Unlimited team members", "Roles & activity log for the team", "Priority support"],
};

export type LimitCheck = { ok: true } | { ok: false; limit: number; message: string };

export function checkInvoiceLimit(plan: Plan, createdThisMonth: number): LimitCheck {
  const limit = PLAN_LIMITS[plan].invoicesPerMonth;
  if (createdThisMonth < limit) return { ok: true };
  return { ok: false, limit, message: `The Free plan includes ${limit} invoices a month — upgrade to Pro for unlimited invoices.` };
}

/** `seats` = current members + pending invites. */
export function checkMemberLimit(plan: Plan, seats: number): LimitCheck {
  const limit = PLAN_LIMITS[plan].members;
  if (seats < limit) return { ok: true };
  return { ok: false, limit, message: "The Free plan is just for you — upgrade to Pro to invite your team." };
}

/** Same day next month, clamped to the month's last day (31 Jan → 28/29 Feb). UTC. */
export function addMonths(date: Date, months: number) {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export type RenewalStep = "none" | "renew" | "downgrade";

/** What the billing cycle owes this subscription now (what a provider's webhooks would tell us). */
export function renewalStep(sub: { status: "active" | "canceled"; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean }, now = new Date()): RenewalStep {
  if (sub.status !== "active" || sub.currentPeriodEnd > now) return "none";
  return sub.cancelAtPeriodEnd ? "downgrade" : "renew";
}

// ---- Test cards (simulated checkout) -------------------------------------------------
// Only Stripe's published test numbers are accepted, so nobody can type a real card into the demo.

export type CardResult = { ok: true; brand: string; last4: string } | { ok: false; field: "number" | "expiry" | "cvc"; error: string };

const TEST_CARDS: Record<string, { brand: string; error?: string }> = {
  "4242424242424242": { brand: "Visa" },
  "5555555555554444": { brand: "Mastercard" },
  "4000000000000002": { brand: "Visa", error: "Your card was declined." },
  "4000000000009995": { brand: "Visa", error: "Your card has insufficient funds." },
  "4000000000000069": { brand: "Visa", error: "Your card has expired." },
};

export function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function checkTestCard(input: { number: string; expiry: string; cvc: string }, now = new Date()): CardResult {
  const number = input.number.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(number) || !luhn(number)) return { ok: false, field: "number", error: "Your card number is invalid." };

  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(input.expiry.trim());
  const month = m ? Number(m[1]) : 0;
  if (!m || month < 1 || month > 12) return { ok: false, field: "expiry", error: "Enter the expiry date as MM/YY." };
  const endOfMonth = Date.UTC(2000 + Number(m[2]), month, 1); // first day of the following month
  if (endOfMonth <= now.getTime()) return { ok: false, field: "expiry", error: "Your card's expiry date is in the past." };

  if (!/^\d{3,4}$/.test(input.cvc.trim())) return { ok: false, field: "cvc", error: "Your card's security code is invalid." };

  const card = TEST_CARDS[number];
  if (!card) return { ok: false, field: "number", error: "Test mode: use a test card such as 4242 4242 4242 4242. Real cards are never accepted." };
  if (card.error) return { ok: false, field: "number", error: card.error };
  return { ok: true, brand: card.brand, last4: number.slice(-4) };
}
