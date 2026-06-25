import { num } from "../money";
import type { Closing } from "../types";

// Total closing costs. Quick mode = % of price; detailed = itemized sum.
export function calcCC(cc: Closing | undefined, price: number, loan: number, annTax: number, annIns: number, rate: number): number {
  if (!cc || cc.mode === "quick") return (price || 0) * ((cc?.quickPct || 3) / 100);
  const r = rate ?? 7.25,
    l = loan || 0,
    p = price || 0;
  return (
    (l * (cc.origPct || 0)) / 100 +
    (l * (cc.pointsPct || 0)) / 100 +
    (cc.appraisal || 0) +
    (cc.creditReport || 0) +
    (cc.underwriting || 0) +
    (p * (cc.transferTaxPct || 0)) / 100 +
    (cc.recordingFees || 0) +
    (cc.attyFee || 0) +
    (cc.titleSearch || 0) +
    (cc.lenderTitle || 0) +
    (cc.ownerTitle || 0) +
    (cc.firstYearInsurance || 0) +
    (cc.prepaidDays || 0) * ((l * r) / 100 / 365) +
    ((annTax || 0) / 12) * (cc.taxEscrowMonths || 0) +
    ((annIns || 0) / 12) * (cc.insEscrowMonths || 0) +
    (cc.inspection || 0) +
    (cc.termite || 0) +
    (cc.survey || 0) +
    (cc.enviro || 0) +
    (cc.customItems || []).reduce((s, x) => s + num(x.amt), 0)
  );
}
