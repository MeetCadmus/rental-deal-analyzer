// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";
import { close, pmtOf } from "../../test/util";

function deal(over) {
  return M.fullState(
    Object.assign(
      {
        price: 620000,
        units: [
          { id: 1, rent: 1800 },
          { id: 2, rent: 1800 },
          { id: 3, rent: 1550 },
          { id: 4, rent: 1550 },
        ],
        financing: { downPct: 25, rate: 7, loanYears: 30 },
        expenses: { mode: "quick", ratio: 42, vacancyPct: 5 },
        closing: { mode: "quick", quickPct: 3 },
      },
      over,
    ),
  );
}

test("whatNeedsToBeTrue: the required rent/unit actually produces the target CF", () => {
  const st = deal();
  const R = M.computeBase(st);
  const target = 500; // $/mo
  const w = M.whatNeedsToBeTrue(st, R, target);
  const st2 = M.fullState(Object.assign({}, st, { units: st.units.map((u) => Object.assign({}, u, { rent: w.neededRentPU })) }));
  close(M.computeBase(st2).cf / 12, target, 2.0, "CF at neededRentPU (rent rounded to whole dollars)");
});

test("whatNeedsToBeTrue: the max purchase price actually produces the target CF", () => {
  const st = deal();
  const R = M.computeBase(st);
  const target = 300;
  const w = M.whatNeedsToBeTrue(st, R, target);
  assert.ok(w.neededPrice, "neededPrice should be solvable for this deal");
  const st2 = M.fullState(Object.assign({}, st, { price: w.neededPrice }));
  close(M.computeBase(st2).cf / 12, target, 2.0, "CF at neededPrice");
});

test("whatNeedsToBeTrue: the required rate actually produces the target CF", () => {
  const st = deal();
  const R = M.computeBase(st);
  const target = 0; // break-even
  const w = M.whatNeedsToBeTrue(st, R, target);
  const st2 = M.fullState(Object.assign({}, st, { financing: Object.assign({}, st.financing, { rate: w.neededRate }) }));
  close(M.computeBase(st2).cf / 12, target, 12.0, "CF at neededRate (rate rounded to 0.01%)");
});

test("calcLoanOptions: 30yr option matches the standard payment; 15yr costs more per month", () => {
  const loans = M.calcLoanOptions(500000, 25, 7, 30);
  const loanAmt = 500000 * (1 - 0.25);
  assert.equal(loans[0].name, "30yr fixed");
  close(loans[0].monthly, pmtOf(loanAmt, 7, 30), 1e-2, "30yr payment");
  assert.ok(loans[1].monthly > loans[0].monthly, "15yr payment should exceed 30yr");
  loans.forEach((l) => assert.ok(Number.isFinite(l.monthly) && l.monthly > 0, l.name + " payment finite & positive"));
});

test("computeSensitivity: grid shape and the centre cell equals the base case", () => {
  const st = deal();
  const R = M.computeBase(st);
  const SEN = M.computeSensitivity(st, R);
  assert.equal(SEN.priceRate.length, 5, "5 price rows");
  SEN.priceRate.forEach((row) => assert.equal(row.cells.length, 5, "5 rate cols"));
  assert.equal(SEN.rentCells.length, 7, "7 rent steps");
  // centre of the price/rate grid = current price & current rate
  close(SEN.priceRate[2].cells[2].cf, R.cf, 1.0, "price/rate centre = base CF");
  // the 0-delta rent cell = base case
  const center = SEN.rentCells.find((c) => c.delta === 0);
  close(center.cf, R.cf, 1.0, "0-delta rent = base CF");
});
