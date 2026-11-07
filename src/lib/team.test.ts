import { test } from "node:test";
import assert from "node:assert/strict";
import { canChangeRole, canLeave, canRemove, hasRole, invitableRoles } from "./permissions.ts";
import { createToken, hashToken, inviteState, isTokenShaped } from "./tokens.ts";
import { safeCallbackUrl } from "./redirects.ts";
import { clientIp, isLoginLimited, MAX_FAILURES_PER_EMAIL, MAX_FAILURES_PER_IP } from "./rate-limit.ts";
import { describeActivity, plainText, relativeTime } from "./activity-format.ts";

test("role ranks", () => {
  assert.equal(hasRole("owner", "admin"), true);
  assert.equal(hasRole("admin", "admin"), true);
  assert.equal(hasRole("member", "admin"), false);
});

test("who can invite which role", () => {
  assert.deepEqual(invitableRoles("owner"), ["admin", "member"]);
  assert.deepEqual(invitableRoles("admin"), ["member"]);
  assert.deepEqual(invitableRoles("member"), []);
});

test("only the owner changes roles, never to or from owner, never their own", () => {
  assert.equal(canChangeRole("owner", "member", "admin", false), true);
  assert.equal(canChangeRole("owner", "admin", "member", false), true);
  assert.equal(canChangeRole("owner", "admin", "owner", false), false);
  assert.equal(canChangeRole("owner", "owner", "admin", true), false);
  assert.equal(canChangeRole("owner", "member", "member", false), false); // no-op
  assert.equal(canChangeRole("admin", "member", "admin", false), false);
});

test("removing and leaving", () => {
  assert.equal(canRemove("owner", "admin", false), true);
  assert.equal(canRemove("owner", "member", false), true);
  assert.equal(canRemove("admin", "member", false), true);
  assert.equal(canRemove("admin", "admin", false), false);
  assert.equal(canRemove("admin", "owner", false), false);
  assert.equal(canRemove("member", "member", false), false);
  assert.equal(canRemove("owner", "owner", true), false);
  assert.equal(canLeave("owner"), false);
  assert.equal(canLeave("member"), true);
});

test("invite tokens: random, hashed, well-formed", () => {
  const a = createToken();
  const b = createToken();
  assert.notEqual(a.token, b.token);
  assert.equal(a.hash, hashToken(a.token));
  assert.notEqual(a.hash, a.token);
  assert.equal(isTokenShaped(a.token), true);
  assert.equal(isTokenShaped("short"), false);
  assert.equal(isTokenShaped(a.token + "'"), false);
});

test("invite state", () => {
  const now = new Date("2026-11-07T12:00:00Z");
  const future = new Date("2026-11-10T12:00:00Z");
  const past = new Date("2026-11-01T12:00:00Z");
  assert.equal(inviteState({ acceptedAt: null, revokedAt: null, expiresAt: future }, now), "valid");
  assert.equal(inviteState({ acceptedAt: null, revokedAt: null, expiresAt: past }, now), "expired");
  assert.equal(inviteState({ acceptedAt: null, revokedAt: past, expiresAt: future }, now), "revoked");
  assert.equal(inviteState({ acceptedAt: past, revokedAt: null, expiresAt: future }, now), "accepted");
});

test("post-login redirects stay on this site", () => {
  assert.equal(safeCallbackUrl("/invite/abc"), "/invite/abc");
  assert.equal(safeCallbackUrl("https://evil.example"), "/app");
  assert.equal(safeCallbackUrl("https://evil.example/app/invoices?x=1"), "/app/invoices?x=1"); // only the path survives
  assert.equal(safeCallbackUrl("http://localhost:3001/app/clients"), "/app/clients");
  assert.equal(safeCallbackUrl("//evil.example"), "/app");
  assert.equal(safeCallbackUrl("/\\evil.example"), "/app");
  assert.equal(safeCallbackUrl("javascript:alert(1)"), "/app");
  assert.equal(safeCallbackUrl(undefined), "/app");
});

test("login rate limit thresholds", () => {
  assert.equal(isLoginLimited({ emailFailures: MAX_FAILURES_PER_EMAIL - 1, ipFailures: 0 }), false);
  assert.equal(isLoginLimited({ emailFailures: MAX_FAILURES_PER_EMAIL, ipFailures: 0 }), true);
  assert.equal(isLoginLimited({ emailFailures: 0, ipFailures: MAX_FAILURES_PER_IP }), true);
  const h = (v: Record<string, string>) => ({ get: (k: string) => v[k] ?? null });
  assert.equal(clientIp(h({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
  assert.equal(clientIp(h({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");
  assert.equal(clientIp(h({})), null);
});

test("activity sentences", () => {
  const paid = describeActivity("invoice.paid", { number: "INV-0007", total: "€1,380.60" }, "abc", true);
  assert.equal(plainText(paid), "recorded the payment for INV-0007 (€1,380.60)");
  assert.equal(paid.tone, "payment");
  assert.equal(paid.segments[1].href, "/app/invoices/abc");
  const deleted = describeActivity("invoice.created", { number: "INV-0002", client: "Hotel Sharri" }, "abc", false);
  assert.equal(deleted.segments[1].href, undefined); // no link once the invoice is gone
  assert.equal(plainText(describeActivity("member.role_changed", { name: "Elira", from: "member", to: "admin" }, null, false)), "changed Elira's role from member to admin");
  assert.equal(plainText(describeActivity("member.invited", { email: "a@b.co", role: "admin" }, null, false)), "invited a@b.co as admin");
});

test("relative time", () => {
  const now = new Date("2026-11-07T12:00:00Z");
  assert.equal(relativeTime(new Date("2026-11-07T11:59:40Z"), now), "just now");
  assert.equal(relativeTime(new Date("2026-11-07T11:55:00Z"), now), "5 min ago");
  assert.equal(relativeTime(new Date("2026-11-07T09:00:00Z"), now), "3 h ago");
  assert.equal(relativeTime(new Date("2026-11-06T12:00:00Z"), now), "1 day ago");
  assert.equal(relativeTime(new Date("2026-10-01T12:00:00Z"), now), "1 Oct 2026");
});
