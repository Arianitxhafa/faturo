import { test } from "node:test";
import assert from "node:assert/strict";
import { monthLabel, monthsEndingAt } from "./months.ts";

test("12 months ending with the current month, oldest first", () => {
  const months = monthsEndingAt(12, "2026-11-07");
  assert.equal(months.length, 12);
  assert.equal(months[0], "2025-12");
  assert.equal(months[11], "2026-11");
});

test("crosses the year boundary correctly", () => {
  assert.deepEqual(monthsEndingAt(3, "2027-01-15"), ["2026-11", "2026-12", "2027-01"]);
});

test("month labels", () => {
  assert.equal(monthLabel("2026-11"), "Nov");
  assert.equal(monthLabel("2026-11", true), "Nov 2026");
});
