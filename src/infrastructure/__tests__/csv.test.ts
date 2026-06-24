// @ts-nocheck — 1:1 port of legacy JS test; production code is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../../test/barrel";

test("CSV: full deal state round-trips exactly (nested, arrays, types, commas)", () => {
  const state = {
    address: "123 Maple, Atlanta, GA", notes: "rents low, new roof\nmotivated seller", price: 620000,
    units: [{ id: 1, label: "Unit 1", rent: 1550, beds: 2 }, { id: 2, label: "Unit 2", rent: 1150, beds: 1 }],
    financing: { downPct: 25, rate: 7.25, loanYears: 30 },
    projection: { vaEnabled: false, refiEnabled: true, refiRate: 6.5 },
    repairs: { include: true, unknown: false, amount: 35000 },
    comparables: [], closing: { customItems: [] }, partnership: { enabled: false, myPct: 60 },
  };
  const back = M.csvToState(M.stateToCSV(state));
  assert.deepStrictEqual(back, state, "round-tripped object must equal the original");
});

test("CSV: types are restored (numbers, booleans, empty arrays) not left as strings", () => {
  const back = M.csvToState(M.stateToCSV({
    price: 500000, financing: { rate: 7.25 }, repairs: { include: true }, comparables: [], notes: "",
  }));
  assert.strictEqual(back.price, 500000);
  assert.strictEqual(back.financing.rate, 7.25);
  assert.strictEqual(back.repairs.include, true);
  assert.ok(Array.isArray(back.comparables) && back.comparables.length === 0);
});

test("CSV: meta fields (_name/_ts) are stripped from the export", () => {
  const csv = M.stateToCSV({ price: 1, _name: "x", _ts: 123 });
  assert.ok(!/_name/.test(csv) && !/_ts/.test(csv), "internal meta should not be exported");
});

test("CSV: quoting handles commas, quotes and newlines in values", () => {
  const rows = M.parseCSV('key,value\nnotes,"a, b ""c"" \nd"\nprice,5');
  const notes = rows.find((r) => r[0] === "notes");
  assert.strictEqual(notes[1], 'a, b "c" \nd');
});
