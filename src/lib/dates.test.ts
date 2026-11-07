import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatDay } from "./dates.ts";
import { monthLabel } from "./months.ts";
import { relativeTime } from "./activity-format.ts";

test("dates in English and Albanian without relying on the runtime's locale data", () => {
  const d = new Date("2026-11-07T13:30:00Z"); // Saturday 14:30 in Prishtina
  assert.equal(formatDate(d), "7 Nov 2026");
  assert.equal(formatDate(d, "sq"), "7 nën 2026");
  assert.equal(formatDate(d, "sq", { weekday: "long", day: true, month: "long", year: true }), "e shtunë 7 nëntor 2026");
  assert.equal(formatDate(d, "en", { day: true, month: "short", time: true }), "7 Nov, 14:30");
  assert.equal(formatDay("2026-01-31", "sq", { day: true, month: "long", year: true }), "31 janar 2026");
  assert.equal(monthLabel("2026-08", true, "sq"), "gush 2026");
  assert.equal(monthLabel("2026-08"), "Aug");
});

test("relative time in Albanian", () => {
  const now = new Date("2026-11-07T12:00:00Z");
  assert.equal(relativeTime(new Date("2026-11-07T11:59:40Z"), now, "sq"), "tani");
  assert.equal(relativeTime(new Date("2026-11-07T11:55:00Z"), now, "sq"), "para 5 min");
  assert.equal(relativeTime(new Date("2026-11-06T12:00:00Z"), now, "sq"), "para 1 dite");
  assert.equal(relativeTime(new Date("2026-10-01T12:00:00Z"), now, "sq"), "1 tet 2026");
});
