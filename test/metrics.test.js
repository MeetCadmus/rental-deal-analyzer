"use strict";
const test = require("node:test");
const assert = require("node:assert");
const M = require("../test-harness");
const close = (a, b, eps, msg) => M.close(assert, a, b, eps, msg);

test("computeBase: income waterfall (GPI → vacancy → EGI → NOI)", () => {
  const st = M.fullState({
    price: 1000000,
    units: [{ id: 1, rent: 5000 }, { id: 2, rent: 5000 }],
    financing: { downPct: 25, rate: 6, loanYears: 30 },
    expenses: { mode: "quick", ratio: 40, vacancyPct: 5 },
    closing: { mode: "quick", quickPct: 3 },
    repairs: { include: false, unknown: false, amount: 0 },
  });
  const R = M.computeBase(st);
  close(R.monRent, 10000, 1e-9, "monthly rent");
  close(R.gpi, 120000, 1e-9, "GPI = rent*12");
  close(R.vacAmt, 6000, 1e-9, "vacancy = GPI*5%");
  close(R.egi, 114000, 1e-9, "EGI = GPI - vacancy");
  close(R.totExp, 45600, 1e-9, "expenses = 40% of EGI");
  close(R.noi, 68400, 1e-9, "NOI = EGI - expenses");
});

test("computeBase: financing (down, loan, payment) matches the standard amortization formula", () => {
  const st = M.fullState({
    price: 1000000,
    units: [{ id: 1, rent: 5000 }, { id: 2, rent: 5000 }],
    financing: { downPct: 25, rate: 6, loanYears: 30 },
    expenses: { mode: "quick", ratio: 40, vacancyPct: 5 },
    closing: { mode: "quick", quickPct: 3 },
  });
  const R = M.computeBase(st);
  close(R.down, 250000, 1e-9, "down = 25% of price");
  close(R.loan, 750000, 1e-9, "loan = price - down");
  close(R.pmt, M.pmtOf(750000, 6, 30), 1e-6, "monthly payment");
  close(R.annPmt, R.pmt * 12, 1e-9, "annual debt service");
});

test("computeBase: an explicit 0% rate / 0% down is honored (not silently replaced by defaults)", () => {
  // Uses ?? not || so a literal 0 means 0 (100% financing / 0% interest), while
  // a missing field still falls back to the 25% / 7.25% defaults.
  const R = M.computeBase(M.fullState({
    price: 600000, units: [{ id: 1, rent: 3000 }],
    financing: { downPct: 0, rate: 0, loanYears: 30 },
    expenses: { mode: "quick", ratio: 40, vacancyPct: 0 },
  }));
  close(R.down, 0, 1e-9, "0% down honored");
  close(R.loan, 600000, 1e-9, "100% financed");
  close(R.pmt, 600000 / 360, 1e-9, "0% rate amortizes linearly (loan / months)");
});

test("computeBase: return ratios (cap, CoC, DSCR, GRM, 1%, break-even occ & rent)", () => {
  const st = M.fullState({
    price: 1000000,
    units: [{ id: 1, rent: 5000 }, { id: 2, rent: 5000 }],
    financing: { downPct: 25, rate: 6, loanYears: 30 },
    expenses: { mode: "quick", ratio: 40, vacancyPct: 5 },
    closing: { mode: "quick", quickPct: 3 },
    repairs: { include: false, unknown: false, amount: 0 },
  });
  const R = M.computeBase(st);
  const annPmt = M.pmtOf(750000, 6, 30) * 12;
  close(R.ccTotal, 30000, 1e-6, "closing = 3% of price");
  close(R.cashIn, 280000, 1e-4, "cash in = down + closing");
  close(R.cf, 68400 - annPmt, 1e-4, "cashflow = NOI - debt");
  close(R.capRate, 6.84, 1e-9, "cap rate = NOI/price");
  close(R.coc, (68400 - annPmt) / 280000 * 100, 1e-6, "CoC = CF/cash-in");
  close(R.dscr, 68400 / annPmt, 1e-6, "DSCR = NOI/debt");
  close(R.grm, 1000000 / 120000, 1e-9, "GRM = price/GPI");
  close(R.pct1, 1.0, 1e-9, "1% rule = monthly rent/price");
  close(R.beOcc, (45600 + annPmt) / 120000 * 100, 1e-6, "break-even occupancy");
  close(R.expRatio, 40, 1e-9, "expense ratio = exp/EGI");
  close(R.beRent, (45600 + annPmt) / (2 * 12 * 0.95), 1e-4, "break-even rent / unit");
});

test("computeBase: repairs add to cash-in only when included & not 'unknown'", () => {
  const base = {
    price: 500000, units: [{ id: 1, rent: 4000 }],
    financing: { downPct: 25, rate: 7, loanYears: 30 },
    expenses: { mode: "quick", ratio: 45, vacancyPct: 5 },
    closing: { mode: "quick", quickPct: 3 },
  };
  const noRep = M.computeBase(M.fullState({ ...base, repairs: { include: false, unknown: false, amount: 20000 } }));
  const withRep = M.computeBase(M.fullState({ ...base, repairs: { include: true, unknown: false, amount: 20000 } }));
  const unknown = M.computeBase(M.fullState({ ...base, repairs: { include: true, unknown: true, amount: 20000 } }));
  close(withRep.cashIn - noRep.cashIn, 20000, 1e-6, "included repairs add to cash-in");
  close(unknown.cashIn, noRep.cashIn, 1e-6, "'unknown' repairs are excluded from cash-in");
});

test("computeBase: partnership splits cashflow by my equity share", () => {
  const st = M.fullState({
    price: 600000, units: [{ id: 1, rent: 2000 }, { id: 2, rent: 2000 }],
    financing: { downPct: 25, rate: 6.5, loanYears: 30 },
    expenses: { mode: "quick", ratio: 42, vacancyPct: 5 },
    partnership: { enabled: true, myPct: 60 },
  });
  const R = M.computeBase(st);
  close(R.myCF, R.cf * 0.6, 1e-6, "my cashflow = 60% of total");
});

test("computeBase: degenerate inputs never produce NaN/Infinity", () => {
  const R = M.computeBase(M.fullState({ price: 0, units: [{ id: 1, rent: 0 }] }));
  for (const k of ["capRate", "coc", "dscr", "beOcc", "grm", "pct1", "cf", "noi"]) {
    assert.ok(Number.isFinite(R[k]), k + " should be finite, got " + R[k]);
  }
});
