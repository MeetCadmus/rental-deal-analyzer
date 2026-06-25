import { INIT, DCC, DEX } from "./defaults";
import { migrateExpenses } from "./finance/expenses";
import type { Deal } from "./types";

let _uid = 10;
export function uid(): number {
  return ++_uid;
}

let _dseq = 0;
export function newDealId(): string {
  return "d" + Date.now().toString(36) + (_dseq++).toString(36);
}

// Merge a partial/legacy deal over defaults (and migrate expenses) into a full Deal.
export function fullState(d?: Partial<Deal> | null): Deal {
  d = d || {};
  const units = Array.isArray(d.units) && d.units.length ? d.units : INIT.units;
  return {
    ...INIT,
    ...d,
    financing: { ...INIT.financing, ...(d.financing || {}) },
    closing: { ...DCC, ...(d.closing || {}) },
    expenses: { ...DEX, ...(migrateExpenses(d.expenses, units.length) || {}) },
    projection: { ...INIT.projection, ...(d.projection || {}) },
    repairs: { ...INIT.repairs, ...(d.repairs || {}) },
    partnership: { ...INIT.partnership, ...(d.partnership || {}) },
    units,
    comparables: Array.isArray(d.comparables) ? d.comparables : [],
  };
}

export interface DealMeta {
  label?: string;
  ts?: number;
  created?: string | number;
  _name?: string;
}

export function makeDeal(data?: Partial<Deal>, meta?: DealMeta): Deal {
  const ts = Date.now();
  meta = meta || {};
  const { _id, _label, _ts, _created, ...d } = fullState(data) as Deal & { _name?: string };
  void _id;
  void _ts;
  void _created;
  return { ...d, _id: newDealId(), _label: meta.label || _label || meta._name || "", _ts: meta.ts || ts, _created: meta.created || ts };
}

export function dealTitle(d?: Partial<Deal>): string {
  return (d && d._label && d._label.trim()) || (d && d.address && d.address.trim()) || "Untitled deal";
}
