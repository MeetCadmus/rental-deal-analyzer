// @ts-nocheck — 1:1 port of legacy JS test; production code is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../../test/barrel";

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

  const m2 = M.mergeDealStores({ deals: [d("a", 300, { price: 111 })], activeId: "a" }, { deals: [d("a", 200, { price: 999 })], activeId: "a" });
  assert.equal(m2.deals[0].price, 111, "local is newer -> its version wins");
});

test("mergeDealStores: neither device clobbers the other's new deals", () => {
  const local = { deals: [d("a", 1), d("local-only", 5)], activeId: "a" };
  const cloud = { deals: [d("a", 1), d("cloud-only", 6)], activeId: "a" };
  const ids = M.mergeDealStores(local, cloud)
    .deals.map((x) => x._id)
    .sort();
  assert.deepStrictEqual(ids, ["a", "cloud-only", "local-only"]);
});

test("mergeDealStores: keeps local activeId when still present, else falls back", () => {
  assert.equal(M.mergeDealStores({ deals: [d("a", 1)], activeId: "a" }, { deals: [], activeId: null }).activeId, "a");
  // local active deleted-from-set -> fall back to cloud active
  assert.equal(M.mergeDealStores({ deals: [], activeId: "gone" }, { deals: [d("c", 1)], activeId: "c" }).activeId, "c");
});

test("mergeDealStores: a tombstoned deal stays deleted (doesn't come back from cloud)", () => {
  const local = { deals: [d("a", 5)], activeId: "a", deleted: { b: 9 } };
  const cloud = { deals: [d("a", 5), d("b", 2)], activeId: "b" }; // cloud still has b
  const m = M.mergeDealStores(local, cloud);
  assert.deepStrictEqual(
    m.deals.map((x) => x._id),
    ["a"],
    "b is removed",
  );
  assert.equal(m.deleted.b, 9, "tombstone retained for propagation");
});

test("mergeDealStores: an edit newer than the deletion resurrects the deal", () => {
  const local = { deals: [], activeId: null, deleted: { b: 100 } };
  const cloud = { deals: [d("b", 200)], activeId: "b" }; // edited after the delete
  const m = M.mergeDealStores(local, cloud);
  assert.deepStrictEqual(
    m.deals.map((x) => x._id),
    ["b"],
    "b resurrected (edit wins)",
  );
  assert.ok(!("b" in m.deleted), "tombstone pruned for surviving deal");
});

test("mergeDealStores: tombstones from both sides are unioned", () => {
  const m = M.mergeDealStores({ deals: [d("a", 1)], activeId: "a", deleted: { x: 5 } }, { deals: [d("a", 1)], activeId: "a", deleted: { y: 6 } });
  assert.equal(m.deleted.x, 5);
  assert.equal(m.deleted.y, 6);
});

test("mergeDealStores: stable order by _created; tolerates empty/missing input", () => {
  const m = M.mergeDealStores({ deals: [d("z", 9, { _created: 9 }), d("a", 1, { _created: 1 })] }, undefined);
  assert.deepStrictEqual(
    m.deals.map((x) => x._id),
    ["a", "z"],
  );
  const empty = M.mergeDealStores(undefined, undefined);
  assert.deepStrictEqual(empty.deals, []);
  assert.equal(empty.activeId, null);
});
