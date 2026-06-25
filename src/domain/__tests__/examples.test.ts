// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";
import { close, pmtOf } from "../../test/util";

// Regression guard: the five built-in Atlanta examples must keep their intended
// grade ladder (Disaster D -> Bad D -> Mixed C -> Good B -> Home run A) and their
// headline metrics. If a math change silently moves these, a test breaks.
const EXPECT = {
  en: { grade: "D", cap: 4.9, dscr: 0.69 },
  cp: { grade: "D", cap: 6.0, dscr: 0.96 },
  cl: { grade: "C", cap: 6.7, dscr: 1.1 },
  sm: { grade: "B", cap: 7.1, dscr: 1.21 },
  kw: { grade: "A", cap: 8.6, dscr: 1.47 },
};

test("there are exactly 5 example deals with the expected ids", () => {
  assert.equal(M.EXAMPLES.length, 5);
  assert.deepStrictEqual(M.EXAMPLES.map((e) => e.id).sort(), Object.keys(EXPECT).sort());
});

for (const ex of M.EXAMPLES) {
  test('example "' + ex.label + '" keeps its grade and headline metrics', () => {
    const st = M.fullState(ex);
    const R = M.computeBase(st);
    const Y = M.computeYearly(st, R);
    const score = M.calcDealScore(R, Y);
    const e = EXPECT[ex.id];
    assert.equal(score.grade, e.grade, ex.label + " grade");
    close(R.capRate, e.cap, 0.15, ex.label + " cap rate");
    close(R.dscr, e.dscr, 0.05, ex.label + " DSCR");
  });
}

test("the example ladder is monotonically improving worst -> best", () => {
  const order = { D: 1, C: 2, B: 3, A: 4 };
  const grades = ["en", "cp", "cl", "sm", "kw"].map((id) => {
    const ex = M.EXAMPLES.find((e) => e.id === id);
    const st = M.fullState(ex);
    return M.calcDealScore(M.computeBase(st), M.computeYearly(st, M.computeBase(st))).grade;
  });
  for (let i = 1; i < grades.length; i++) {
    assert.ok(order[grades[i]] >= order[grades[i - 1]], "grade ladder should not regress at " + i + " (" + grades.join(",") + ")");
  }
});
