// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";
import { close, pmtOf } from "../../test/util";

test("calcExp: quick mode = ratio % of EGI", () => {
  const r = M.calcExp({ mode: "quick", ratio: 50 }, 4, 100000, 500000);
  close(r.totExp, 50000, 1e-9);
  assert.equal(r.items, null);
});

test("calcExp: detailed mode sums every line item (annual $ inputs)", () => {
  const ex = {
    mode: "detailed", v: 2, taxMode: "fixed", taxes: 8000, insurance: 4000, mgmtPct: 8,
    maintMode: "fixed", maintenance: 4800, capexMode: "fixed", capex: 7200,
    utilities: 600, landscaping: 0, accounting: 500, misc: 300,
    customExpenses: [{ name: "a", amt: 1200, period: "annual" }, { name: "b", amt: 50, period: "monthly" }],
  };
  const r = M.calcExp(ex, 4, 100000, 500000);
  close(r.items.taxes, 8000, 1e-9, "taxes (annual $)");
  close(r.items.mgmt, 8000, 1e-9, "mgmt = 8% of EGI");
  close(r.items.maint, 4800, 1e-9, "maintenance (annual $ as entered)");
  close(r.items.capex, 7200, 1e-9, "capex (annual $)");
  close(r.items.util, 600, 1e-9, "utilities (annual $)");
  close(r.items.custom, 1200 + 50 * 12, 1e-9, "custom (annual + monthly*12)");
  close(r.totExp, 8000 + 4000 + 8000 + 4800 + 7200 + 600 + 0 + 500 + 300 + 1800, 1e-9, "total = sum of items");
});

test("calcExp: percentage modes (taxes/maint/capex) yield annual $", () => {
  const ex = {
    mode: "detailed", v: 2, taxMode: "pct", taxPct: 1.2, insurance: 0, mgmtPct: 0,
    maintMode: "pct", maintPct: 1, capexMode: "pct", capexPct: 0.5,
    utilities: 0, landscaping: 0, accounting: 0, misc: 0, customExpenses: [],
  };
  const r = M.calcExp(ex, 4, 100000, 500000);
  close(r.items.taxes, Math.round(500000 * 1.2 / 100), 1e-9, "taxes = 1.2% of price");
  close(r.items.maint, Math.round(500000 * 1 / 100), 1e-9, "maint = 1% of value/yr");
  close(r.items.capex, Math.round(500000 * 0.5 / 100), 1e-9, "capex = 0.5% of value/yr");
});

test("migrateExpenses: converts pre-v2 per-unit/mo & per-mo to annual once", () => {
  const old = { mode: "detailed", maintenance: 100, capex: 150, utilities: 50, landscaping: 25 };
  const m = M.migrateExpenses(old, 4);
  assert.equal(m.v, 2);
  close(m.maintenance, 100 * 4 * 12, 1e-9, "maint -> annual");
  close(m.capex, 150 * 4 * 12, 1e-9, "capex -> annual");
  close(m.utilities, 50 * 12, 1e-9, "utilities -> annual");
  close(m.landscaping, 25 * 12, 1e-9, "landscaping -> annual");
  // idempotent: already-v2 is returned unchanged
  assert.strictEqual(M.migrateExpenses(m, 4), m);
});

test("fullState: migrates an old detailed deal's expenses to annual", () => {
  const fs = M.fullState({ price: 500000, units: [{ id: 1, rent: 1000 }, { id: 2, rent: 1000 }],
    expenses: { mode: "detailed", maintenance: 100, capex: 150, utilities: 50 } });
  assert.equal(fs.expenses.v, 2);
  close(fs.expenses.maintenance, 100 * 2 * 12, 1e-9, "maint migrated using unit count");
  close(fs.expenses.utilities, 50 * 12, 1e-9, "utilities migrated");
});

test("calcCC: quick mode = quickPct % of price", () => {
  close(M.calcCC({ mode: "quick", quickPct: 3 }, 500000, 375000, 0, 0, 7), 15000, 1e-9);
});

test("calcCC: transfer/deed tax is an editable % of price (state-neutral)", () => {
  const zero = {
    mode: "detailed", origPct: 0, pointsPct: 0, appraisal: 0, creditReport: 0, underwriting: 0,
    transferTaxPct: 0.4, recordingFees: 0, attyFee: 0, titleSearch: 0, lenderTitle: 0, ownerTitle: 0,
    firstYearInsurance: 0, prepaidDays: 0, taxEscrowMonths: 0, insEscrowMonths: 0,
    inspection: 0, termite: 0, survey: 0, enviro: 0, customItems: [],
  };
  close(M.calcCC(zero, 500000, 400000, 0, 0, 7), 500000 * 0.4 / 100, 1e-9, "= price × transferTaxPct"); // 2000
  // omitted/zero pct adds nothing (no region baked in)
  close(M.calcCC({ ...zero, transferTaxPct: 0 }, 500000, 400000, 0, 0, 7), 0, 1e-9);
});

test("calcCC: prepaids & escrows (per-diem interest + tax/ins reserves)", () => {
  const cc = {
    mode: "detailed", origPct: 0, pointsPct: 0, appraisal: 0, creditReport: 0, underwriting: 0,
    recordingFees: 0, attyFee: 0, titleSearch: 0, lenderTitle: 0, ownerTitle: 0,
    firstYearInsurance: 0, prepaidDays: 15, taxEscrowMonths: 3, insEscrowMonths: 2,
    inspection: 0, termite: 0, survey: 0, enviro: 0, customItems: [],
  };
  const loan = 400000, price = 500000, rate = 7, annTax = 6000, annIns = 2400;
  const prepaidInt = 15 * (loan * rate / 100 / 365);
  const taxEsc = (annTax / 12) * 3;
  const insEsc = (annIns / 12) * 2;
  close(M.calcCC(cc, price, loan, annTax, annIns, rate), prepaidInt + taxEsc + insEsc, 1e-6);
});

test("calcExp / calcCC default presets are shaped correctly", () => {
  assert.equal(M.DEX.mode, "quick");
  assert.equal(M.DCC.mode, "quick");
  assert.ok(M.CLASS_PRESETS.B && typeof M.CLASS_PRESETS.B.ratio === "number");
});
