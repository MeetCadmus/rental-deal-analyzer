import { useState } from "react";
import { C } from "../theme/tokens";
import { fmtD, fmtP } from "../../domain/money";
import type { BaseMetrics, YearlyResult, Deal } from "../../domain/types";
import s from "./results.module.css";

interface ProjRow {
  l: string;
  v: string;
  f: string;
  c?: string;
  bold?: boolean;
}
interface ProjSection {
  t: string;
  rows: ProjRow[];
}

export function ProjTrace({ R, Y, S }: { R: BaseMetrics; Y: YearlyResult; S: Deal }) {
  const [open, setOpen] = useState(false);
  const hold = S.projection.holdYears || 5;
  const last = Y.yearly[Y.yearly.length - 1] || ({} as Partial<YearlyResult["yearly"][number]>);
  const sc = S.projection.sellingCostPct ?? 6;
  const netSale = Math.round((Y.exitVal || 0) * (1 - sc / 100) - (last.balance || 0));
  const exitMethod = S.projection.exitCapEnabled
    ? "final-year NOI ÷ " + (S.projection.exitCapRate || 6) + "% exit cap"
    : (S.projection.appreciationPct || 0) + "%/yr appreciation";
  const sections: ProjSection[] = [
    {
      t: "Total return (" + hold + "yr) — total dollars gained, four parts added up",
      rows: [
        {
          l: "Appreciation",
          v: fmtD(Y.appGain),
          f: "exit value " + fmtD(Y.exitVal) + " − price " + fmtD(S.price) + "  (" + exitMethod + ")",
          c: Y.appGain >= 0 ? C.teal : C.red,
        },
        { l: "+ Principal paydown", v: fmtD(Y.equityBuild), f: "loan " + fmtD(R.loan) + " − balance still owed " + fmtD(last.balance || 0), c: C.teal },
        { l: "+ Net cash flow", v: fmtD(Y.totCF), f: "every year's cash flow, summed", c: Y.totCF >= 0 ? C.teal : C.red },
        { l: "+ Depreciation benefit (est.)", v: fmtD(Y.deprBen), f: "(price × 85% ÷ 27.5 yrs) × 28% tax × " + hold + " yrs — rough tax saving", c: C.teal },
        {
          l: "= Total return",
          v: fmtD(Y.totRet),
          f: "that's " + fmtP((Y.totRet / (R.cashIn || 1)) * 100) + " of your " + fmtD(R.cashIn) + " cash in (not annualized)",
          bold: true,
          c: Y.totRet >= 0 ? C.teal : C.red,
        },
      ],
    },
    {
      t: "Est. IRR = " + fmtP(Y.irr) + " — annualized, timing-aware return",
      rows: [
        {
          l: "What it is",
          v: "yearly % return",
          f: "the rate at which all the cash flows below net to $0. Unlike total return, it accounts for WHEN cash arrives, so it's comparable to other investments.",
        },
        { l: "Year 0", v: fmtD(-R.cashIn), f: "cash invested at close", c: C.red },
        { l: "Years 1–" + Math.max(1, hold - 1), v: "each year's cash flow", f: "straight from the year-by-year table" },
        { l: "Year " + hold, v: fmtD((last.cf || 0) + netSale), f: "final-year CF " + fmtD(last.cf || 0) + " + net sale " + fmtD(netSale), c: C.teal },
        {
          l: "Net sale proceeds",
          v: fmtD(netSale),
          f: "exit value " + fmtD(Y.exitVal) + " − " + sc + "% selling costs − loan payoff " + fmtD(last.balance || 0),
        },
      ],
    },
    {
      t: "Cumulative cash position (the line chart)",
      rows: [
        { l: "Starts at", v: fmtD(-R.cashIn), f: "minus your cash invested at close — down payment + closing" + (R.repairCost ? " + repairs" : "") },
        { l: "Each year adds", v: "that year's cash flow", f: "the line rises by CF/yr from the year-by-year table" },
        { l: "Crosses $0 when", v: "rent has repaid your cash", f: "= the payback point (years to get your money back)", c: C.teal },
        { l: "Final year also adds", v: fmtD(netSale), f: "net proceeds from selling (see IRR section)" },
      ],
    },
  ];
  return (
    <div className={s.panel} style={{ marginBottom: 11 }}>
      <button onClick={() => setOpen(!open)} className={`${s.traceToggle}${open ? " " + s.traceToggleOpen : ""}`}>
        <span className={s.traceTitle}>How total return, IRR & the cash chart are calculated</span>
        <span className={s.traceChevron} style={{ transform: open ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>
      {open && (
        <div className={s.traceBody}>
          {sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: si < sections.length - 1 ? 14 : 2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.heading, marginBottom: 6 }}>{sec.t}</div>
              {sec.rows.map((row, i) => (
                <div key={i} style={{ marginBottom: 7, borderLeft: "3px solid " + (row.bold ? row.c || C.heading : "var(--c-grid)"), paddingLeft: 8 }}>
                  <div className={s.traceRowTop} style={{ gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: row.bold ? 700 : 400, color: row.bold ? row.c || C.heading : C.slate }}>{row.l}</span>
                    <span
                      style={{ fontSize: 12, fontWeight: 700, color: row.c || C.text, flexShrink: 0, fontVariantNumeric: "tabular-nums", textAlign: "right" }}
                    >
                      {row.v}
                    </span>
                  </div>
                  <div className={s.traceRowFormula} style={{ lineHeight: 1.5 }}>
                    {row.f}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className={s.goldNote}>
            Estimates only — appreciation, rent growth, vacancy and exit are assumptions you set in “Projection &amp; Growth”. Depreciation benefit is a rough
            figure; consult a CPA.
          </div>
        </div>
      )}
    </div>
  );
}
