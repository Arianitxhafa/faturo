import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, displayStatus, isIsoDate } from "./invoice-status.ts";

test("a sent invoice becomes overdue only after its due date", () => {
  assert.equal(displayStatus("sent", "2026-11-20", "2026-11-20"), "sent"); // due today: not overdue yet
  assert.equal(displayStatus("sent", "2026-11-20", "2026-11-21"), "overdue");
});

test("drafts and paid invoices are never overdue", () => {
  assert.equal(displayStatus("draft", "2026-01-01", "2026-11-21"), "draft");
  assert.equal(displayStatus("paid", "2026-01-01", "2026-11-21"), "paid");
});

test("adds days across month and year boundaries", () => {
  assert.equal(addDays("2026-11-06", 15), "2026-11-21");
  assert.equal(addDays("2026-12-25", 10), "2027-01-04");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29"); // leap year
});

test("only real calendar dates are accepted", () => {
  assert.equal(isIsoDate("2026-11-07"), true);
  assert.equal(isIsoDate("2028-02-29"), true); // leap year
  assert.equal(isIsoDate("2026-02-29"), false);
  assert.equal(isIsoDate("2026-02-31"), false);
  assert.equal(isIsoDate("2026-13-01"), false);
  assert.equal(isIsoDate("7.11.2026"), false);
  assert.equal(isIsoDate(""), false);
});
