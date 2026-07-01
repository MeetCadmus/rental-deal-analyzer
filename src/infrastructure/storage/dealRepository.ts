import { makeDeal } from "../../domain/deal";
import { INIT } from "../../domain/defaults";
import type { Deal } from "../../domain/types";

// Repository for the deal library: localStorage persistence + cross-device merge.
export const DEALS_KEY = "re_deals_v1";

export interface DealStore {
  deals: Deal[];
  activeId: string | null;
  deleted?: Record<string, number>;
}

// Tombstones (id -> deletion ts) kept module-level so persistence/sync always include them.
let TOMB: Record<string, number> = {};
export const getTomb = (): Record<string, number> => TOMB;
export const setTomb = (t: Record<string, number>): void => {
  TOMB = t || {};
};

// Read the current persisted store as-is (no legacy migration / default seeding). Used to
// merge cross-tab writes: each tab re-reads this before saving so it only touches its own
// deal, and refreshes its in-memory list when another tab writes (`storage` event).
export function readPersistedStore(): DealStore | null {
  try {
    const r = JSON.parse(localStorage.getItem(DEALS_KEY) || "null");
    if (r && Array.isArray(r.deals)) return { deals: r.deals, activeId: r.activeId ?? null, deleted: r.deleted || {} };
  } catch {
    /* ignore */
  }
  return null;
}

export function persistDeals(deals: Deal[], activeId: string | null): void {
  try {
    localStorage.setItem(DEALS_KEY, JSON.stringify({ deals, activeId, deleted: TOMB }));
  } catch {
    /* ignore */
  }
}

// Merge two deal libraries (local + cloud): union by _id (newest edit wins), minus
// tombstoned deals (a delete wins unless the deal was edited after it). Pure & testable.
export function mergeDealStores(localStore?: Partial<DealStore>, cloudStore?: Partial<DealStore>): DealStore {
  localStore = localStore || {};
  cloudStore = cloudStore || {};
  const tomb: Record<string, number> = {};
  const addTomb = (t?: Record<string, number>) => {
    if (t)
      for (const id in t) {
        if (!(id in tomb) || t[id] > tomb[id]) tomb[id] = t[id];
      }
  };
  addTomb(localStore.deleted);
  addTomb(cloudStore.deleted);
  const byId = new Map<string, Deal>();
  const add = (d: Deal) => {
    if (!d || !d._id) return;
    const ex = byId.get(d._id);
    if (!ex || (d._ts || 0) > (ex._ts || 0)) byId.set(d._id, d);
  };
  (localStore.deals || []).forEach(add);
  (cloudStore.deals || []).forEach(add);
  const deals = [...byId.values()]
    .filter((d) => !(d._id! in tomb) || (d._ts || 0) > tomb[d._id!])
    .sort((a, b) => (Number(a._created) || 0) - (Number(b._created) || 0));
  const survive = new Set(deals.map((d) => d._id));
  const deleted: Record<string, number> = {};
  for (const id in tomb) {
    if (!survive.has(id)) deleted[id] = tomb[id];
  }
  const has = (id: string | null | undefined) => !!id && survive.has(id);
  const activeId = has(localStore.activeId)
    ? localStore.activeId!
    : has(cloudStore.activeId)
      ? cloudStore.activeId!
      : deals.length
        ? deals[deals.length - 1]._id!
        : null;
  return { deals, activeId, deleted };
}

export function loadDealStore(): { deals: Deal[]; activeId: string } {
  try {
    const r = JSON.parse(localStorage.getItem(DEALS_KEY) || "null");
    if (r && Array.isArray(r.deals) && r.deals.length) {
      TOMB = r.deleted && typeof r.deleted === "object" ? r.deleted : {};
      return { deals: r.deals, activeId: r.deals.some((d: Deal) => d._id === r.activeId) ? r.activeId : r.deals[r.deals.length - 1]._id };
    }
  } catch {
    /* ignore */
  }
  const deals: Deal[] = [];
  try {
    const sc = JSON.parse(localStorage.getItem("re_scenarios") || "[]");
    if (Array.isArray(sc)) sc.forEach((s) => deals.push(makeDeal(s, { label: s._name, ts: s._ts, created: s._ts })));
  } catch {
    /* ignore */
  }
  try {
    const a = JSON.parse(localStorage.getItem("re_autosave") || "null");
    if (a && typeof a === "object" && Object.keys(a).length) deals.push(makeDeal(a, {}));
  } catch {
    /* ignore */
  }
  if (!deals.length) deals.push(makeDeal(INIT, {}));
  persistDeals(deals, deals[deals.length - 1]._id!);
  return { deals, activeId: deals[deals.length - 1]._id! };
}
