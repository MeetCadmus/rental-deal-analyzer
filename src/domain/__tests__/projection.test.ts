// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";
import { close, pmtOf } from "../../test/util";

function deal(over) {
  return M.fullState(Object.assign({
    price: 600000,
    units: [{ id: 1, rent: 2000 }, { id: 2, rent: 2000 }, { id: 3, rent: 1600 }, { id: 4, rent: 1600 }],
    financing: { downPct: 25, rate: 6.5, loanYears: 30 },
    expenses: { mode: "quick", ratio: 42, vacancyPct: 5 },
    closing: { mode: "quick", quickPct: 3 },
    projection: { holdYears: 5, appreciationPct: 4, rentGrowthPct: 3 },
  }, over));
}

test("computeYearly: loan fully amortizes to ~0 over its term & balance never increases", () => {
  const st = deal({ projection: { holdYears: 30, appreciationPct: 0, rentGrowthPct: 0 } });
  const R = M.computeBase(st);
  const Y = M.computeYearly(st, R);
  assert.equal(Y.yearly.length, 30);
  const last = Y.yearly[29];
  assert.ok(Math.abs(last.balance) < 2, "balance ~0 after full term, got " + last.balance);
  for (let i = 1; i < Y.yearly.length; i++) {
    assert.ok(Y.yearly[i].balance <= Y.yearly[i - 1].balance + 1e-6, "balance must not increase at year " + (i + 1));
  }
});

test("computeYearly: equity, appreciation & total-return identities hold", () => {
  const st = deal();
  const R = M.computeBase(st);
  const Y = M.computeYearly(st, R);
  const last = Y.yearly[Y.yearly.length - 1];
  // property value compounds at the appreciation rate
  close(last.propVal, Math.round(st.price * Math.pow(1.04, 5)), 1, "exit value compounds appreciation");
  close(Y.exitVal, last.propVal, 1e-9, "exitVal = last year value");
  // equity = value - balance
  close(last.equity, last.propVal - last.balance, 1, "equity = value - loan balance");
  // return components
  close(Y.appGain, Y.exitVal - st.price, 1, "appreciation gain");
  close(Y.equityBuild, R.loan - last.balance, 1, "principal paydown = loan - final balance");
  close(Y.deprBen, (st.price * 0.85 / 27.5) * 0.28 * 5, 1e-6, "depreciation benefit formula");
  close(Y.totRet, Y.appGain + Y.equityBuild + Y.totCF + Y.deprBen, 2, "total return = sum of components");
});

test("computeYearly: IRR actually solves NPV(flows) ≈ 0", () => {
  const st = deal();
  const R = M.computeBase(st);
  const Y = M.computeYearly(st, R);
  const years = 5;
  const last = Y.yearly[years - 1];
  const sellProc = Y.exitVal * 0.94 - last.balance;
  const flows = [-R.cashIn].concat(Y.yearly.map((y, i) => (i < years - 1 ? y.cf : y.cf + sellProc)));
  const r = Y.irr / 100;
  let npv = 0;
  flows.forEach((f, j) => { npv += f / Math.pow(1 + r, j); });
  assert.ok(Math.abs(npv) < 1, "NPV at the reported IRR should be ~0, got " + npv);
});

test("computeYearly: IRR rises with appreciation (monotonic)", () => {
  const irrAt = (app) => {
    const st = deal({ projection: { holdYears: 5, appreciationPct: app, rentGrowthPct: 3 } });
    return M.computeYearly(st, M.computeBase(st)).irr;
  };
  assert.ok(irrAt(2) < irrAt(4), "more appreciation -> higher IRR");
  assert.ok(irrAt(4) < irrAt(7), "more appreciation -> higher IRR");
});

test("computeYearly: cumulative cashflow is the running sum of annual CF", () => {
  const st = deal();
  const Y = M.computeYearly(st, M.computeBase(st));
  for (let i = 0; i < Y.yearly.length; i++) {
    const prev = i === 0 ? 0 : Y.yearly[i - 1].cumCF;
    close(Y.yearly[i].cumCF - prev, Y.yearly[i].cf, 1.0, "cumCF step at year " + (i + 1));
  }
  close(Y.yearly[Y.yearly.length - 1].cumCF, Y.totCF, 3, "last cumCF ≈ total CF");
});

test("computeYearly: exit-cap valuation prices the sale off final-year NOI", () => {
  const st = deal({ projection: { holdYears: 5, appreciationPct: 4, rentGrowthPct: 0, exitCapEnabled: true, exitCapRate: 6 } });
  const Y = M.computeYearly(st, M.computeBase(st));
  const last = Y.yearly[4];
  close(last.propVal, last.noi / 0.06, 20, "exit value = final NOI / exit cap");
  close(Y.exitVal, last.propVal, 1e-9, "exitVal tracks the cap-based value");
});

test("computeYearly: a lower exit cap raises both exit value and IRR", () => {
  const mk = (cap) => { const st = deal({ projection: { holdYears: 5, rentGrowthPct: 0, exitCapEnabled: true, exitCapRate: cap } }); return M.computeYearly(st, M.computeBase(st)); };
  const hi = mk(8), lo = mk(5);
  assert.ok(lo.exitVal > hi.exitVal, "lower cap -> higher exit value");
  assert.ok(lo.irr > hi.irr, "lower cap -> higher IRR");
});

test("computeYearly: higher selling costs reduce IRR", () => {
  const mk = (sc) => { const st = deal({ projection: { holdYears: 5, appreciationPct: 4, rentGrowthPct: 0, sellingCostPct: sc } }); return M.computeYearly(st, M.computeBase(st)); };
  assert.ok(mk(2).irr > mk(10).irr, "higher selling cost -> lower IRR");
});

test("computeYearly: refinance changes the payment from the refi year onward", () => {
  const base = deal({ projection: { holdYears: 6, appreciationPct: 3, rentGrowthPct: 0 } });
  const refi = deal({ projection: { holdYears: 6, appreciationPct: 3, rentGrowthPct: 0, refiEnabled: true, refiYear: 3, refiRate: 4.5 } });
  const Yb = M.computeYearly(base, M.computeBase(base));
  const Yr = M.computeYearly(refi, M.computeBase(refi));
  // a lower refi rate should reduce debt service -> higher CF in later years
  assert.ok(Yr.yearly[5].debtService < Yb.yearly[5].debtService, "refi to a lower rate cuts debt service");
});
