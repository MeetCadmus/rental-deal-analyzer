// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";

test("num: parses currency-formatted strings", () => {
  assert.strictEqual(M.num("1,250"), 1250);
  assert.strictEqual(M.num("1250"), 1250);
  assert.strictEqual(M.num(""), 0);
  assert.strictEqual(M.num("abc"), 0);
});

test("fmtD: signed currency with a true minus sign", () => {
  assert.strictEqual(M.fmtD(1250), "$1,250");
  assert.strictEqual(M.fmtD(-1250), "−$1,250");
  assert.strictEqual(M.fmtD(0), "$0");
});

test("fmtP / fmtX: percent and multiple, with em-dash for non-finite", () => {
  assert.strictEqual(M.fmtP(6.84), "6.8%");
  assert.strictEqual(M.fmtP(Infinity), "—");
  assert.strictEqual(M.fmtX(8.333), "8.3×");
});

test("clamp: bounds a value to [a,b]", () => {
  assert.strictEqual(M.clamp(5, 0, 10), 5);
  assert.strictEqual(M.clamp(-1, 0, 10), 0);
  assert.strictEqual(M.clamp(99, 0, 10), 10);
});

test("lv: normal metric (higher is better) thresholds", () => {
  assert.strictEqual(M.lv(8, 7, 4.5), "good");
  assert.strictEqual(M.lv(5, 7, 4.5), "warn");
  assert.strictEqual(M.lv(3, 7, 4.5), "bad");
});

test("lv: inverse metric (lower is better)", () => {
  assert.strictEqual(M.lv(60, 70, 85, true), "good");
  assert.strictEqual(M.lv(95, 70, 85, true), "bad");
});

test("fullState: fills every section from defaults for a sparse deal", () => {
  const fs = M.fullState({ price: 100 });
  for (const k of ["financing", "closing", "expenses", "projection", "repairs", "partnership"]) {
    assert.ok(fs[k] && typeof fs[k] === "object", k + " present");
  }
  assert.ok(Array.isArray(fs.units) && fs.units.length >= 1, "units defaulted");
  assert.ok(Array.isArray(fs.comparables), "comparables defaulted to array");
});

test("dealTitle: prefers label, then address, then fallback", () => {
  assert.strictEqual(M.dealTitle({ _label: "My deal", address: "X" }), "My deal");
  assert.strictEqual(M.dealTitle({ _label: "", address: "123 Main" }), "123 Main");
  assert.strictEqual(M.dealTitle({}), "Untitled deal");
});
