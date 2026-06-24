// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";

test("fmtGroup: live thousands grouping for integers", () => {
  assert.equal(M.fmtGroup("100", false), "100");
  assert.equal(M.fmtGroup("1000", false), "1,000");
  assert.equal(M.fmtGroup("1000000", false), "1,000,000");
  assert.equal(M.fmtGroup(1000000, false), "1,000,000");
});

test("fmtGroup: tolerates clearing and partials", () => {
  assert.equal(M.fmtGroup("", false), "");
  assert.equal(M.fmtGroup("0", false), "0");
  assert.equal(M.fmtGroup("abc", false), "");
  assert.equal(M.fmtGroup("1,000", false), "1,000"); // already-grouped input is stable
});

test("fmtGroup: decimals preserved, integer part grouped", () => {
  assert.equal(M.fmtGroup("1234.5", true), "1,234.5");
  assert.equal(M.fmtGroup("7.", true), "7.");      // mid-typing a decimal
  assert.equal(M.fmtGroup("7.25", true), "7.25");
  assert.equal(M.fmtGroup(".5", true), ".5");      // mid-edit: don't inject a leading 0 (it normalizes on blur)
  assert.equal(M.fmtGroup(".", true), ".");        // just a lone decimal point while typing
});

test("fmtGroup: integer mode strips a stray decimal point then groups", () => {
  assert.equal(M.fmtGroup("12.34", false), "1,234");
});

test("fmtGroup: negative values", () => {
  assert.equal(M.fmtGroup("-5000", true), "-5,000");
  assert.equal(M.fmtGroup("-", true), "-");        // mid-typing a negative
});

test("fmtGroup: strips leading zeros but keeps a single zero", () => {
  assert.equal(M.fmtGroup("007", false), "7");
  assert.equal(M.fmtGroup("0", true), "0");
});
