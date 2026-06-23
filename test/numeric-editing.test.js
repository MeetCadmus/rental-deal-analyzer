"use strict";
const test = require("node:test");
const assert = require("node:assert");
const M = require("./../test-harness");

// Simulate a focused text input: {display, caret}. type() inserts a char at the
// caret; back() deletes the char before the caret — each runs through editNumber,
// exactly like the real onChange does.
function field(display, caret, decimals) {
  display = display || ""; caret = caret == null ? display.length : caret;
  return {
    display, caret, decimals: !!decimals,
    type(ch) { const raw = this.display.slice(0, this.caret) + ch + this.display.slice(this.caret); const r = M.editNumber(raw, this.caret + ch.length, this.decimals); this.display = r.display; this.caret = r.caret; this.value = r.value; return this; },
    back() { if (this.caret > 0) { const raw = this.display.slice(0, this.caret - 1) + this.display.slice(this.caret); const r = M.editNumber(raw, this.caret - 1, this.decimals); this.display = r.display; this.caret = r.caret; this.value = r.value; } return this; },
    typeStr(s) { for (const c of s) this.type(c); return this; },
  };
}

test("Bug 1: clearing 7.25 then typing 6 yields 6 (not 0./600.)", () => {
  const f = field("7.25", 4, true);   // value present, caret at end
  f.back().back().back().back();        // delete all four chars
  assert.equal(f.display, "", "fully cleared");
  f.type("6");
  assert.equal(f.display, "6");
  assert.equal(f.value, 6);
});

test("Bug 2: typing 6 . 0 yields 6.0 with caret staying after the dot", () => {
  const f = field("", 0, true);
  f.type("6"); assert.equal(f.display, "6");
  f.type("."); assert.equal(f.display, "6."); assert.equal(f.caret, 2, "caret after the dot");
  f.type("0"); assert.equal(f.display, "6.0"); assert.equal(f.value, 6);
});

test("typing a full decimal rate 6.5 works", () => {
  const f = field("", 0, true).typeStr("6.5");
  assert.equal(f.display, "6.5");
  assert.equal(f.value, 6.5);
});

test("live thousands grouping while typing 1000000", () => {
  const f = field("", 0, false).typeStr("1000000");
  assert.equal(f.display, "1,000,000");
  assert.equal(f.value, 1000000);
  assert.equal(f.caret, f.display.length, "caret stays at end");
});

test("deleting a digit inside a grouped number keeps the caret sane", () => {
  // 1,000,000 -> delete the digit just left of the first comma
  const f = field("1,000,000", 1, false); // caret right after the leading 1
  f.back();                                 // delete the 1
  assert.equal(f.value, 0);                 // "000000" -> 0
});

test("Bug 3: editing 7.5 -> delete the 7 -> type 6 yields 6.5 (not 60.5)", () => {
  const f = field("7.5", 1, true);   // caret right after the "7"
  f.back();                          // delete the 7 -> ".5" (no injected leading 0)
  assert.equal(f.display, ".5");
  assert.equal(f.value, 0.5);
  f.type("6");                       // caret sits before the dot -> "6.5"
  assert.equal(f.display, "6.5");
  assert.equal(f.value, 6.5);
});

test("editNumber: caret counts the decimal point as significant", () => {
  // "6" + "." at end: caret must be after the dot (index 2), not before it
  const r = M.editNumber("6.", 2, true);
  assert.equal(r.display, "6.");
  assert.equal(r.caret, 2);
});
