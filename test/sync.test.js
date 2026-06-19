"use strict";
const test = require("node:test");
const assert = require("node:assert");
const M = require("./../test-harness");

const d = (id, ts, extra) => Object.assign({ _id: id, _ts: ts, _created: ts, _label: id, price: 100000 }, extra);

test("mergeDealStores: union of deals from both sides by _id", () => {
  const local = { deals: [d("a", 1), d("b", 2)], activeId: "a" };
  const cloud = { deals: [d("b", 2), d("c", 3)], activeId: "c" };
  const m = M.mergeDealStores(local, cloud);
  assert.deepStrictEqual(m.deals.map((x) => x._id).sort(), ["a", "b", "c"]);
});

test("mergeDealStores: newer _ts wins per deal", () => {
  const local = { deals: [d("a", 100, { price: 111 })], activeId: "a" };
  const cloud = { deals: [d("a", 200, { price: 999 })], activeId: "a" };
  const m = M.mergeDealStores(local, cloud);
  assert.equal(m.deals.length, 1);
  assert.equal(m.deals[0].price, 999, "cloud is newer -> its version wins");

  const m2 = M.mergeDealStores(
    { deals: [d("a", 300, { price: 111 })], activeId: "a" },
    { deals: [d("a", 200, { price: 999 })], activeId: "a" }
  );
  assert.equal(m2.deals[0].price, 111, "local is newer -> its version wins");
});

test("mergeDealStores: neither device clobbers the other's new deals", () => {
  const local = { deals: [d("a", 1), d("local-only", 5)], activeId: "a" };
  const cloud = { deals: [d("a", 1), d("cloud-only", 6)], activeId: "a" };
  const ids = M.mergeDealStores(local, cloud).deals.map((x) => x._id).sort();
  assert.deepStrictEqual(ids, ["a", "cloud-only", "local-only"]);
});

test("mergeDealStores: keeps local activeId when still present, else falls back", () => {
  assert.equal(M.mergeDealStores({ deals: [d("a", 1)], activeId: "a" }, { deals: [], activeId: null }).activeId, "a");
  // local active deleted-from-set -> fall back to cloud active
  assert.equal(M.mergeDealStores({ deals: [], activeId: "gone" }, { deals: [d("c", 1)], activeId: "c" }).activeId, "c");
});

test("mergeDealStores: stable order by _created; tolerates empty/missing input", () => {
  const m = M.mergeDealStores({ deals: [d("z", 9, { _created: 9 }), d("a", 1, { _created: 1 })] }, undefined);
  assert.deepStrictEqual(m.deals.map((x) => x._id), ["a", "z"]);
  const empty = M.mergeDealStores(undefined, undefined);
  assert.deepStrictEqual(empty.deals, []);
  assert.equal(empty.activeId, null);
});
