// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTotals, formatMoney, invoiceNumberLabel, lineTotalCents, parseMoney, parsePercent, parseQuantity } from "./money.ts";

test("line total = quantity × unit price, rounded to the cent", () => {
  assert.equal(lineTotalCents({ quantityHundredths: 100, unitPriceCents: 60000 }), 60000); // 1 × 600.00
  assert.equal(lineTotalCents({ quantityHundredths: 150, unitPriceCents: 2500 }), 3750); // 1.5 h × 25.00
  assert.equal(lineTotalCents({ quantityHundredths: 33, unitPriceCents: 1001 }), 330); // 0.33 × 10.01 = 3.3033
  assert.equal(lineTotalCents({ quantityHundredths: 50, unitPriceCents: 1 }), 1); // 0.5 cent rounds up
});

test("example from the plan: website + hosting at 18 % VAT", () => {
  const t = computeTotals([
    { quantityHundredths: 100, unitPriceCents: 60000, vatRateBps: 1800 },
    { quantityHundredths: 100, unitPriceCents: 12000, vatRateBps: 1800 },
  ]);
  assert.equal(t.subtotalCents, 72000);
  assert.equal(t.vatCents, 12960);
  assert.equal(t.totalCents, 84960); // 849.60 €
});

test("mixed VAT rates are grouped and summed separately", () => {
  const t = computeTotals([
    { quantityHundredths: 200, unitPriceCents: 1000, vatRateBps: 1800 }, // 20.00 @ 18 %
    { quantityHundredths: 100, unitPriceCents: 5000, vatRateBps: 800 }, // 50.00 @ 8 %
    { quantityHundredths: 100, unitPriceCents: 3000, vatRateBps: 0 }, // 30.00 @ 0 %
  ]);
  assert.deepEqual(
    t.vatGroups.map((g) => [g.rateBps, g.netCents, g.vatCents]),
    [
      [1800, 2000, 360],
      [800, 5000, 400],
      [0, 3000, 0],
    ]
  );
  assert.equal(t.subtotalCents, 10000);
  assert.equal(t.vatCents, 760);
  assert.equal(t.totalCents, 10760);
});

test("discount reduces the taxable amount before VAT", () => {
  const t = computeTotals([{ quantityHundredths: 100, unitPriceCents: 10000, vatRateBps: 1800 }], 1000); // 10 % off 100.00
  assert.equal(t.discountCents, 1000);
  assert.equal(t.vatCents, 1620); // 18 % of 90.00
  assert.equal(t.totalCents, 10620);
});

test("totals always add up: subtotal − discount + VAT = total", () => {
  const t = computeTotals(
    [
      { quantityHundredths: 333, unitPriceCents: 1999, vatRateBps: 1800 },
      { quantityHundredths: 77, unitPriceCents: 4321, vatRateBps: 800 },
    ],
    1250
  );
  assert.equal(t.subtotalCents - t.discountCents + t.vatCents, t.totalCents);
});

test("an empty invoice totals zero", () => {
  const t = computeTotals([]);
  assert.equal(t.totalCents, 0);
  assert.deepEqual(t.vatGroups, []);
});

test("parses amounts written the European or English way", () => {
  assert.equal(parseMoney("600"), 60000);
  assert.equal(parseMoney("12.5"), 1250);
  assert.equal(parseMoney("12,50"), 1250);
  assert.equal(parseMoney("1,250.50"), 125050);
  assert.equal(parseMoney("1.250,50"), 125050);
  assert.equal(parseMoney(" 1 250 "), 125000);
  assert.equal(parseMoney("-5"), null);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney(""), null);
});

test("parses quantities and percentages", () => {
  assert.equal(parseQuantity("1.5"), 150);
  assert.equal(parseQuantity("3"), 300);
  assert.equal(parsePercent("18"), 1800);
  assert.equal(parsePercent("12.5%"), 1250);
  assert.equal(parsePercent("150"), null);
});

test("formats money and invoice numbers", () => {
  assert.equal(formatMoney(84960, "EUR"), "€849.60");
  assert.equal(invoiceNumberLabel(14), "INV-0014");
});
