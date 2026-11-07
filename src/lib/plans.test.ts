import { test } from "node:test";
import assert from "node:assert/strict";
import { addMonths, checkInvoiceLimit, checkMemberLimit, checkTestCard, luhn, renewalStep } from "./plans.ts";

test("free plan: 5 invoices a month, pro unlimited", () => {
  assert.equal(checkInvoiceLimit("free", 4).ok, true);
  assert.equal(checkInvoiceLimit("free", 5).ok, false);
  assert.equal(checkInvoiceLimit("pro", 5000).ok, true);
});

test("free plan: just the owner; pro: a whole team", () => {
  assert.equal(checkMemberLimit("free", 1).ok, false); // the owner already uses the seat
  assert.equal(checkMemberLimit("pro", 40).ok, true);
});

test("addMonths clamps to the end of shorter months", () => {
  assert.equal(addMonths(new Date("2026-01-31T10:00:00Z"), 1).toISOString(), "2026-02-28T10:00:00.000Z");
  assert.equal(addMonths(new Date("2028-01-31T10:00:00Z"), 1).toISOString(), "2028-02-29T10:00:00.000Z");
  assert.equal(addMonths(new Date("2026-11-07T10:00:00Z"), 1).toISOString(), "2026-12-07T10:00:00.000Z");
  assert.equal(addMonths(new Date("2026-12-15T10:00:00Z"), 1).toISOString(), "2027-01-15T10:00:00.000Z");
});

test("renewal: renew when due, downgrade when cancelled, otherwise nothing", () => {
  const now = new Date("2026-12-07T12:00:00Z");
  const due = new Date("2026-12-07T10:00:00Z");
  const later = new Date("2027-01-07T10:00:00Z");
  assert.equal(renewalStep({ status: "active", currentPeriodEnd: later, cancelAtPeriodEnd: false }, now), "none");
  assert.equal(renewalStep({ status: "active", currentPeriodEnd: due, cancelAtPeriodEnd: false }, now), "renew");
  assert.equal(renewalStep({ status: "active", currentPeriodEnd: due, cancelAtPeriodEnd: true }, now), "downgrade");
  assert.equal(renewalStep({ status: "canceled", currentPeriodEnd: due, cancelAtPeriodEnd: true }, now), "none");
});

test("luhn", () => {
  assert.equal(luhn("4242424242424242"), true);
  assert.equal(luhn("4242424242424241"), false);
});

test("only test cards are accepted, with realistic declines", () => {
  const now = new Date("2026-11-07T00:00:00Z");
  const card = (number: string, expiry = "12/30", cvc = "123") => checkTestCard({ number, expiry, cvc }, now);
  assert.deepEqual(card("4242 4242 4242 4242"), { ok: true, brand: "Visa", last4: "4242" });
  assert.deepEqual(card("5555 5555 5555 4444"), { ok: true, brand: "Mastercard", last4: "4444" });
  assert.match((card("4000 0000 0000 0002") as { error: string }).error, /declined/);
  assert.match((card("4000 0000 0000 9995") as { error: string }).error, /insufficient funds/);
  assert.match((card("4111 1111 1111 1111") as { error: string }).error, /Test mode/); // valid-looking, but not a test card
  assert.match((card("1234 5678 9012 3456") as { error: string }).error, /invalid/);
  assert.match((card("4242424242424242", "10/26") as { error: string }).error, /past/);
  assert.match((card("4242424242424242", "13/30") as { error: string }).error, /MM\/YY/);
  assert.match((card("4242424242424242", "12/30", "1") as { error: string }).error, /security code/);
  assert.equal(card("4242424242424242", "11/26").ok, true); // valid through the end of this month
});

import { centsToDecimal, csvCell, toCsv } from "./csv.ts";

test("CSV cells are quoted and formula-safe", () => {
  assert.equal(csvCell("Hotel Sharri"), "Hotel Sharri");
  assert.equal(csvCell('Kafe "Prishtina", Rr. UÇK'), '"Kafe ""Prishtina"", Rr. UÇK"');
  assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
  assert.equal(csvCell("=HYPERLINK(\"http://evil\")"), `"'=HYPERLINK(""http://evil"")"`);
  assert.equal(csvCell("-10"), "'-10"); // text that looks like a formula
  assert.equal(csvCell(-10), "-10"); // real numbers stay numbers
  assert.equal(csvCell(null), "");
  assert.equal(centsToDecimal(123450), "1234.50");
  assert.equal(centsToDecimal(5), "0.05");
});

test("CSV file: BOM, header, CRLF", () => {
  const csv = toCsv([["Number", "Client"], ["INV-0001", "Arbën"]]);
  assert.equal(csv, "﻿Number,Client\r\nINV-0001,Arbën\r\n");
});
