// @ts-nocheck — value-add per-unit stabilized market rents
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";

function deal(over) {
  return M.fullState(
    Object.assign(
      {
        price: 500000,
        units: [
          { id: 1, rent: 1000 },
          { id: 2, rent: 1200 },
          { id: 3, rent: 1500 },
        ],
        financing: { downPct: 25, rate: 6, loanYears: 30 },
        expenses: { mode: "quick", ratio: 40, vacancyPct: 5 },
        closing: { mode: "quick", quickPct: 3 },
      },
      over,
    ),
  );
}

test("vaMonthlyTotal: per-unit market rents sum across units", () => {
  const d = deal({ projection: { vaEnabled: true, vaMarketRents: [1400, 1600, 1800] } });
  assert.equal(M.vaMonthlyTotal(d.projection, d.units), 1400 + 1600 + 1800);
  const R = M.computeBase(d);
  assert.equal(R.vaMonthly, 4800);
});

test("marketRentFor: falls back to the unit's current rent when unset", () => {
  const d = deal({ projection: { vaEnabled: true } }); // no vaMarketRents, no legacy per-unit
  assert.equal(M.marketRentFor(d.projection, d.units[0], 0), 1000);
  assert.equal(M.vaMonthlyTotal(d.projection, d.units), 1000 + 1200 + 1500); // = current total (no uplift)
});

test("marketRentFor: a set unit uses its market rent; unset units keep current rent", () => {
  const d = deal({ projection: { vaEnabled: true, vaMarketRents: [1400] } });
  assert.equal(M.marketRentFor(d.projection, d.units[0], 0), 1400); // overridden
  assert.equal(M.marketRentFor(d.projection, d.units[1], 1), 1200); // current
  assert.equal(M.vaMonthlyTotal(d.projection, d.units), 1400 + 1200 + 1500);
});

test("legacy vaMarketRentPerUnit still applies to every unit when no per-unit array", () => {
  const d = deal({ projection: { vaEnabled: true, vaMarketRentPerUnit: 1750 } });
  assert.equal(M.vaMonthlyTotal(d.projection, d.units), 1750 * 3);
});

test("value-add lifts projected cashflow above the current-rent baseline", () => {
  const base = deal({ projection: { vaEnabled: false } });
  const va = deal({ projection: { vaEnabled: true, vaYear: 1, vaMarketRents: [1600, 1800, 2000] } });
  const Rb = M.computeBase(base);
  const Rv = M.computeBase(va);
  assert.ok(Rv.vaCF > Rb.cf, "stabilized cashflow should exceed current-rent cashflow");
});
