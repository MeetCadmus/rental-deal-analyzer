import { lv, fmtD, fmtP } from "../money";
import type { BaseMetrics, YearlyResult, DealScore, Deal, Level } from "../types";

type ScoreInput = Pick<BaseMetrics, "capRate" | "coc" | "dscr" | "cf" | "numU" | "beOcc">;

// Grade colors are CSS-variable token strings (resolved by the active skin in the UI).
const SCORE_COLOR: Record<DealScore["grade"], string> = {
  A: "var(--c-tealS)",
  B: "var(--c-blueS)",
  C: "var(--c-amberS)",
  D: "var(--c-redS)",
};

export function calcDealScore(R: ScoreInput, Y: Pick<YearlyResult, "irr"> | null | undefined): DealScore {
  const ms: Level[] = [
    lv(R.capRate, 7, 4.5),
    lv(R.coc, 8, 4),
    lv(R.dscr, 1.25, 1.0),
    lv(R.cf / R.numU / 12, 200, 0),
    lv(R.beOcc, 70, 85, true),
    lv(Y?.irr || 0, 15, 10),
  ];
  const pts = ms.reduce((s, m) => s + (m === "good" ? 2 : m === "warn" ? 1 : 0), 0);
  const pct = pts / (ms.length * 2);
  const grade: DealScore["grade"] = pct >= 0.75 ? "A" : pct >= 0.5 ? "B" : pct >= 0.25 ? "C" : "D";
  const labels = { A: "Great deal", B: "Good deal", C: "Weak deal", D: "Risky deal" } as const;
  const descs = {
    A: "All key metrics in the green zone.",
    B: "Most metrics solid — some room to improve.",
    C: "Several red flags. Need a clear exit strategy.",
    D: "Critical issues. Renegotiate price or walk away.",
  } as const;
  return { grade, pct, color: SCORE_COLOR[grade], label: labels[grade], desc: descs[grade], metrics: ms };
}

type KillerInput = Pick<BaseMetrics, "dscr" | "beOcc" | "cf" | "numU" | "pct1" | "adjThresh" | "beRent" | "monRent">;
export type Killer = [level: "critical" | "warn" | "info", message: string];

export function calcKillers(R: KillerInput): Killer[] {
  const k: Killer[] = [];
  if (R.dscr < 1.0) k.push(["critical", "DSCR " + R.dscr.toFixed(2) + " < 1.0 — NOI does not cover mortgage. Lender will likely decline."]);
  if (R.beOcc > 95) k.push(["critical", "Break-even " + R.beOcc.toFixed(0) + "% — almost no vacancy buffer. One empty unit = losses."]);
  if (R.dscr >= 1.0 && R.dscr < 1.15) k.push(["warn", "DSCR " + R.dscr.toFixed(2) + " — below most lender minimums (1.20–1.25). Financing may be difficult."]);
  if (R.cf / R.numU / 12 < -500) k.push(["warn", "CF " + fmtD(R.cf / R.numU / 12) + "/unit/mo — significant negative. Requires substantial cash reserves."]);
  if (R.pct1 < R.adjThresh * 0.55) k.push(["warn", "1% rule " + fmtP(R.pct1) + " — very low rent-to-price ratio for this market."]);
  if (R.beRent > (R.monRent / R.numU) * 1.25)
    k.push(["info", "Break-even rent " + fmtD(R.beRent) + "/unit — " + Math.round((R.beRent / (R.monRent / R.numU) - 1) * 100) + "% above current rent."]);
  return k;
}

type WntInput = Pick<BaseMetrics, "annPmt" | "noi" | "loan">;
export function whatNeedsToBeTrue(state: Deal, R: WntInput, targetCFmonthly: number): { neededRentPU: number; neededPrice: number | null; neededRate: number } {
  const { units, financing, expenses } = state;
  const numU = Math.max(units.length, 1);
  const vac = (expenses.vacancyPct || 0) / 100,
    ratio = (expenses.ratio || 45) / 100;
  const mr = (financing.rate ?? 7.25) / 100 / 12,
    n = (financing.loanYears || 30) * 12;
  const pmtF = mr > 0 ? (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1) : 1 / n;
  const loanF = 1 - (financing.downPct ?? 25) / 100;
  const targetAnn = targetCFmonthly * 12;
  const neededRentPU = (targetAnn + R.annPmt) / (numU * 12 * (1 - vac) * (1 - ratio));
  const neededPrice = R.noi > targetAnn ? Math.round((R.noi - targetAnn) / (12 * loanF * pmtF)) : null;
  let lo = 1,
    hi = 20;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2,
      mm = mid / 100 / 12;
    const mp = mm === 0 ? R.loan / n : (R.loan * mm * Math.pow(1 + mm, n)) / (Math.pow(1 + mm, n) - 1);
    if (R.noi - mp * 12 > targetAnn) lo = mid;
    else hi = mid;
  }
  return { neededRentPU: Math.round(neededRentPU), neededPrice, neededRate: Math.round(lo * 100) / 100 };
}

export interface LoanOption {
  name: string;
  rate: number;
  monthly: number;
  totalInt: number | null;
  note: string;
}
export function calcLoanOptions(price: number, downPct: number, currentRate: number, loanYears: number): LoanOption[] {
  const loan = price * (1 - (downPct ?? 25) / 100),
    n30 = (loanYears || 30) * 12,
    n15 = 15 * 12;
  const pmt = (l: number, r: number, n: number) => {
    const mr = r / 100 / 12;
    return mr === 0 ? l / n : (l * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  };
  return [
    { name: "30yr fixed", rate: currentRate, monthly: pmt(loan, currentRate, n30), totalInt: pmt(loan, currentRate, n30) * n30 - loan, note: "Current option" },
    {
      name: "15yr fixed",
      rate: Math.max(1, currentRate - 0.5),
      monthly: pmt(loan, Math.max(1, currentRate - 0.5), n15),
      totalInt: pmt(loan, Math.max(1, currentRate - 0.5), n15) * n15 - loan,
      note: "Less interest, higher payment",
    },
    {
      name: "5/1 ARM",
      rate: Math.max(1, currentRate - 0.75),
      monthly: pmt(loan, Math.max(1, currentRate - 0.75), n30),
      totalInt: null,
      note: "Rate fixed 5 years",
    },
    { name: "DSCR loan", rate: currentRate + 0.5, monthly: pmt(loan, currentRate + 0.5, n30), totalInt: null, note: "No income verification" },
    {
      name: "Interest only",
      rate: Math.max(1, currentRate - 0.25),
      monthly: (loan * Math.max(1, currentRate - 0.25)) / 100 / 12,
      totalInt: null,
      note: "10yr IO period — interest only",
    },
  ];
}
