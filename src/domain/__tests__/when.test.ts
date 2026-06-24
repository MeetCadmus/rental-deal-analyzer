// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";

test("fmtWhen: today shows just a compact time", () => {
  const now = new Date();
  const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 45).getTime();
  assert.match(M.fmtWhen(ts), /^\d{1,2}:\d{2}[ap]$/, "e.g. 3:45p");
});

test("fmtWhen: yesterday is prefixed", () => {
  const y = new Date(Date.now() - 86400000);
  const ts = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 9, 5).getTime();
  assert.match(M.fmtWhen(ts), /^Yest \d{1,2}:\d{2}[ap]$/);
});

test("fmtWhen: an old date shows month + 2-digit year (no time)", () => {
  const ts = new Date(2021, 0, 9, 8, 30).getTime(); // Jan 9, 2021
  assert.equal(M.fmtWhen(ts), "Jan 9 '21");
});

test("fmtWhen: empty for missing timestamp", () => {
  assert.equal(M.fmtWhen(0), "");
  assert.equal(M.fmtWhen(undefined), "");
});
