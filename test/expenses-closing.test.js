"use strict";
const test = require("node:test");
const assert = require("node:assert");
const M = require("../test-harness");
const close = (a, b, eps, msg) => M.close(assert, a, b, eps, msg);

test("calcExp: quick mode = ratio % of EGI", () => {
  const r = M.calcExp({ mode: "quick", ratio: 50 }, 4, 100000, 500000);
  close(r.totExp, 50000, 1e-9);
  assert.equal(r.items, null);
});

test("calcExp: detailed mode sums every line item (fixed inputs)", () => {
  const ex = {
    mode: "detailed", taxMode: "fixed", taxes: 8000, insurance: 4000, mgmtPct: 8,
    maintMode: "fixed", maintenance: 100, capexMode: "fixed", capex: 150,
    utilities: 50, landscaping: 0, accounting: 500, misc: 300,
    customExpenses: [{ name: "a", amt: 1200, period: "annual" }, { name: "b", amt: 50, period: "monthly" }],
  };
  const r = M.calcExp(ex, 4, 100000, 500000);
  close(r.items.taxes, 8000, 1e-9, "taxes");
  close(r.items.mgmt, 8000, 1e-9, "mgmt = 8% of EGI");
  close(r.items.maint, 100 * 4 * 12, 1e-9, "maintenance = $/unit/mo * units * 12");
  close(r.items.capex, 150 * 4 * 12, 1e-9, "capex");
  close(r.items.util, 50 * 12, 1e-9, "utilities annualized");
  close(r.items.custom, 1200 + 50 * 12, 1e-9, "custom (annual + monthly*12)");
  close(r.totExp, 8000 + 4000 + 8000 + 4800 + 7200 + 600 + 0 + 500 + 300 + 1800, 1e-9, "total = sum of items");
});

test("calcExp: percentage-of-value modes for taxes/maint/capex", () => {
  const ex = {
    mode: "detailed", taxMode: "pct", taxPct: 1.2, insurance: 0, mgmtPct: 0,
    maintMode: "pct", maintPct: 1, capexMode: "pct", capexPct: 0.5,
    utilities: 0, landscaping: 0, accounting: 0, misc: 0, customExpenses: [],
  };
  const r = M.calcExp(ex, 4, 100000, 500000);
  close(r.items.taxes, Math.round(500000 * 1.2 / 100), 1e-9, "taxes = 1.2% of price");
  const maintPU = Math.round(500000 * 1 / 100 / 4 / 12);
  close(r.items.maint, maintPU * 4 * 12, 1e-9, "maint from % of value");
  const capexPU = Math.round(500000 * 0.5 / 100 / 4 / 12);
  close(r.items.capex, capexPU * 4 * 12, 1e-9, "capex from % of value");
});

test("calcCC: quick mode = quickPct % of price", () => {
  close(M.calcCC({ mode: "quick", quickPct: 3 }, 500000, 375000, 0, 0, 7), 15000, 1e-9);
});

test("calcCC: Georgia statutory taxes (intangible, transfer, flat fee)", () => {
  const zero = {
    mode: "detailed", origPct: 0, pointsPct: 0, appraisal: 0, creditReport: 0, underwriting: 0,
    recordingFees: 0, attyFee: 0, titleSearch: 0, lenderTitle: 0, ownerTitle: 0,
    firstYearInsurance: 0, prepaidDays: 0, taxEscrowMonths: 0, insEscrowMonths: 0,
    inspection: 0, termite: 0, survey: 0, enviro: 0, customItems: [],
  };
  // intangible $1.50 / $500 of loan + transfer $1 / $1,000 of price + flat $10
  const expected = Math.ceil(400000 / 500) * 1.5 + Math.round(500000 / 1000) + 10; // 1200 + 500 + 10
  close(M.calcCC(zero, 500000, 400000, 0, 0, 7), expected, 1e-9);
  close(expected, 1710, 1e-9, "sanity on the GA tax math");
});

test("calcCC: prepaids & escrows (per-diem interest + tax/ins reserves)", () => {
  const cc = {
    mode: "detailed", origPct: 0, pointsPct: 0, appraisal: 0, creditReport: 0, underwriting: 0,
    recordingFees: 0, attyFee: 0, titleSearch: 0, lenderTitle: 0, ownerTitle: 0,
    firstYearInsurance: 0, prepaidDays: 15, taxEscrowMonths: 3, insEscrowMonths: 2,
    inspection: 0, termite: 0, survey: 0, enviro: 0, customItems: [],
  };
  const loan = 400000, price = 500000, rate = 7, annTax = 6000, annIns = 2400;
  const ga = Math.ceil(loan / 500) * 1.5 + Math.round(price / 1000) + 10;
  const prepaidInt = 15 * (loan * rate / 100 / 365);
  const taxEsc = (annTax / 12) * 3;
  const insEsc = (annIns / 12) * 2;
  close(M.calcCC(cc, price, loan, annTax, annIns, rate), ga + prepaidInt + taxEsc + insEsc, 1e-6);
});

test("calcExp / calcCC default presets are shaped correctly", () => {
  assert.equal(M.DEX.mode, "quick");
  assert.equal(M.DCC.mode, "quick");
  assert.ok(M.CLASS_PRESETS.B && typeof M.CLASS_PRESETS.B.ratio === "number");
});
