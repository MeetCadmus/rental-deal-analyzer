import type { Expenses, ExpenseItems } from "../types";

// Convert a pre-v2 expenses object (maintenance/capex as $/unit/mo, utilities/landscaping
// as $/mo) into annual dollars so saved deals keep the same numbers.
export function migrateExpenses(raw: Expenses | null | undefined, unitCount: number): Expenses | null {
  if (!raw) return null;
  if (raw.v === 2) return raw;
  const u = unitCount || 1;
  return {
    ...raw,
    maintenance: Math.round((raw.maintenance || 0) * u * 12),
    capex: Math.round((raw.capex || 0) * u * 12),
    utilities: Math.round((raw.utilities || 0) * 12),
    landscaping: Math.round((raw.landscaping || 0) * 12),
    v: 2,
  };
}

export function calcExp(ex: Expenses | undefined, _units: number, egi: number, price: number): { totExp: number; items: ExpenseItems | null } {
  if (!ex || ex.mode === "quick") return { totExp: egi * ((ex?.ratio || 45) / 100), items: null };
  const p = price || 0;
  const taxAmt = ex.taxMode === "pct" ? Math.round(p * (ex.taxPct || 1.2) / 100) : (ex.taxes || 0);
  const maintAmt = ex.maintMode === "pct" ? Math.round(p * (ex.maintPct || 1) / 100) : (ex.maintenance || 0);
  const capexAmt = ex.capexMode === "pct" ? Math.round(p * (ex.capexPct || 0.5) / 100) : (ex.capex || 0);
  const items: ExpenseItems = {
    taxes: taxAmt, insurance: ex.insurance || 0, mgmt: Math.round(egi * (ex.mgmtPct || 0) / 100),
    maint: maintAmt, capex: capexAmt, util: ex.utilities || 0, landscape: ex.landscaping || 0,
    acctg: ex.accounting || 0, misc: ex.misc || 0,
    custom: (ex.customExpenses || []).reduce((s, e) => s + (e.period === "monthly" ? e.amt * 12 : e.amt), 0),
  };
  return { totExp: Object.values(items).reduce((s, x) => s + x, 0), items };
}
