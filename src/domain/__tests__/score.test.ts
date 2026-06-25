// @ts-nocheck — 1:1 port of legacy JS test; production domain is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../index";

// calcDealScore(R, Y) scores 6 metrics (cap, CoC, DSCR, CF/unit, break-even occ, IRR),
// 2 pts good / 1 warn / 0 bad, max 12 -> A>=75% B>=50% C>=25% else D.
const R = (o) => Object.assign({ capRate: 0, coc: 0, dscr: 0, cf: 0, numU: 4, beOcc: 100 }, o);

test("calcDealScore: all metrics green => A", () => {
  const s = M.calcDealScore(R({ capRate: 9, coc: 12, dscr: 1.5, cf: 4 * 12 * 300, beOcc: 60 }), { irr: 18 });
  assert.equal(s.grade, "A");
  assert.equal(s.pct, 1);
});

test("calcDealScore: all metrics red => D", () => {
  const s = M.calcDealScore(R({ capRate: 3, coc: -5, dscr: 0.7, cf: -4 * 12 * 100, beOcc: 110 }), { irr: -5 });
  assert.equal(s.grade, "D");
  assert.equal(s.pct, 0);
});

test("calcDealScore: mid metrics land on B (6/12)", () => {
  // 3 good + 3 bad = 6 pts = 0.5 => B
  const s = M.calcDealScore(R({ capRate: 8, coc: 10, dscr: 1.3, cf: -4 * 12 * 100, beOcc: 95 }), { irr: 5 });
  assert.equal(s.grade, "B");
  assert.equal(s.pct, 0.5);
});

test("calcDealScore: weak metrics land on C (3/12)", () => {
  // 3 warn + 3 bad = 3 pts = 0.25 => C
  const s = M.calcDealScore(R({ capRate: 6, coc: 6, dscr: 1.1, cf: -4 * 12 * 100, beOcc: 95 }), { irr: 5 });
  assert.equal(s.grade, "C");
  assert.equal(s.pct, 0.25);
});

test("calcDealScore: exposes a color and human label for each grade", () => {
  const s = M.calcDealScore(R({ capRate: 9, coc: 12, dscr: 1.5, cf: 4 * 12 * 300, beOcc: 60 }), { irr: 18 });
  assert.ok(typeof s.color === "string" && s.color.length > 0);
  assert.ok(typeof s.label === "string" && s.label.length > 0);
  assert.equal(s.metrics.length, 6);
});

test("calcDealScore: a deal with no rent (gpi 0) is incomplete, grade —", () => {
  const s = M.calcDealScore(R({ capRate: 0, coc: 0, dscr: 0, gpi: 0 }), { irr: 0 });
  assert.equal(s.incomplete, true);
  assert.equal(s.grade, "—");
  assert.equal(s.metrics.length, 0);
});

test("calcDealScore: a 0 purchase price is incomplete even with rent", () => {
  const s = M.calcDealScore(R({ capRate: 9, coc: 12, dscr: 1.5, gpi: 50000 }), { irr: 18 }, 0);
  assert.equal(s.incomplete, true);
  assert.equal(s.grade, "—");
});

test("calcDealScore: a filled deal (gpi>0, price>0) still grades normally", () => {
  const s = M.calcDealScore(R({ capRate: 9, coc: 12, dscr: 1.5, cf: 4 * 12 * 300, beOcc: 60, gpi: 50000 }), { irr: 18 }, 620000);
  assert.equal(s.grade, "A");
  assert.ok(!s.incomplete);
});

test("calcKillers: DSCR below 1.0 is flagged critical", () => {
  const k = M.calcKillers(R({ dscr: 0.8, beOcc: 90, cf: -3000, pct1: 0.9, adjThresh: 1.0, beRent: 1500, monRent: 6000 }), {});
  assert.ok(
    k.some((x) => x[0] === "critical" && /DSCR/.test(x[1])),
    "expected a critical DSCR killer",
  );
});

test("calcKillers: a healthy deal raises no critical flags", () => {
  const k = M.calcKillers(R({ dscr: 1.4, beOcc: 70, cf: 12000, pct1: 1.0, adjThresh: 0.85, beRent: 1200, monRent: 6000 }), {});
  assert.ok(!k.some((x) => x[0] === "critical"), "healthy deal should have no critical killers");
});

test("calcKillers: near-100% break-even occupancy is flagged", () => {
  const k = M.calcKillers(R({ dscr: 1.1, beOcc: 98, cf: 100, pct1: 1, adjThresh: 0.85, beRent: 1500, monRent: 6000 }), {});
  assert.ok(
    k.some((x) => /[Bb]reak-even/.test(x[1])),
    "expected a break-even occupancy warning",
  );
});
