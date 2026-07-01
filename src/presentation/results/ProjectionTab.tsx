import { C } from "../theme/tokens";
import { Info } from "../ui/primitives";
import { CashflowChart, EquityChart, ReturnDonut } from "../charts/charts";
import { fmtD, fmtP, fmtK } from "../../domain/money";
import type { BaseMetrics, YearlyResult, Deal } from "../../domain/types";
import { ProjTrace } from "./ProjTrace";
import s from "./results.module.css";

export function ProjectionTab({ R, Y, S }: { R: BaseMetrics; Y: YearlyResult; S: Deal }) {
  const hold = S.projection.holdYears || 5;
  const last = Y.yearly[Y.yearly.length - 1] || ({} as Partial<YearlyResult["yearly"][number]>);
  const sc = S.projection.sellingCostPct ?? 6;
  const netSale = Math.round((Y.exitVal || 0) * (1 - sc / 100) - (last.balance || 0));
  const totRetTip = [
    "Total return = sum of 4 parts:",
    "· Appreciation " + fmtD(Y.appGain),
    "· Principal paydown " + fmtD(Y.equityBuild),
    "· Net cash flow " + fmtD(Y.totCF),
    "· Depreciation est. " + fmtD(Y.deprBen),
    "= " + fmtD(Y.totRet) + "  (" + fmtP((Y.totRet / (R.cashIn || 1)) * 100) + " of cash in)",
    "Full detail below ↓",
  ];
  const irrTip = [
    "IRR = annual rate where all cash flows net to $0:",
    "· Year 0: " + fmtD(-R.cashIn) + " (cash in)",
    "· Years 1–" + Math.max(1, hold - 1) + ": each year's CF",
    "· Year " + hold + ": CF + net sale " + fmtD(netSale),
    "= " + fmtP(Y.irr) + " / yr",
    "Full detail below ↓",
  ];
  return (
    <div>
      <div className={s.cols2} style={{ gap: 8, marginBottom: 11 }}>
        <div className={s.metricCard}>
          <div className={s.metricLabel}>
            <span>Total return ({hold}yr)</span>
            <Info lines={totRetTip} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: Y.totRet >= 0 ? C.heading : C.red, fontVariantNumeric: "tabular-nums" }}>{fmtD(Y.totRet)}</div>
          <div className={s.metricSub}>
            {fmtP((Y.totRet / (R.cashIn || 1)) * 100)} on cash in · {((R.cashIn + Y.totRet) / (R.cashIn || 1)).toFixed(2)}× equity multiple
          </div>
        </div>
        <div className={s.metricCard}>
          <div className={s.metricLabel}>
            <span>Est. IRR</span>
            <Info lines={irrTip} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: Y.irr >= 15 ? C.tealS : Y.irr >= 10 ? C.amberS : C.redS, fontVariantNumeric: "tabular-nums" }}>
            {fmtP(Y.irr)}
          </div>
          <div className={s.metricSub}>{Y.irr >= 15 ? "Excellent" : Y.irr >= 10 ? "Good" : "Below target"}</div>
        </div>
      </div>
      <CashflowChart yearly={Y.yearly} cashIn={R.cashIn} />
      <EquityChart yearly={Y.yearly} loan={R.loan} />
      <div className={s.panel} style={{ marginBottom: 11 }}>
        <div className={`${s.panelHead} ${s.panelHeadRow}`} style={{ padding: "7px 12px" }}>
          <span>Year-by-year</span>
          {hold > 12 && <span style={{ fontWeight: 400, color: C.muted }}>scroll ↓ · {hold} yrs</span>}
        </div>
        <div className={"ytable-scroll" + (hold > 12 ? " cap" : "") + " " + s.scrollX}>
          <table className={s.table} style={{ fontSize: 11, width: "100%" }}>
            <thead>
              <tr>
                {["Yr", "Rent/unit", "NOI/yr", "CF/yr", "CF/mo", "Equity", "Value"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "5px 6px",
                      fontWeight: 600,
                      color: C.slate,
                      textAlign: "right",
                      borderBottom: "1px solid " + C.border,
                      whiteSpace: "nowrap",
                      position: "sticky",
                      top: 0,
                      background: C.bg,
                      zIndex: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Y.yearly.map((row, i) => (
                <tr key={row.year} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                  <td style={{ padding: "5px 6px", fontWeight: 600, color: C.heading, textAlign: "right" }}>{row.year}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{fmtK(row.monthlyRent)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{fmtK(row.noi)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 600, color: row.cf >= 0 ? C.teal : C.red }}>{fmtK(row.cf)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 600, color: row.cf >= 0 ? C.teal : C.red }}>{fmtK(row.cf / 12)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", color: C.teal }}>{fmtK(row.equity)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{fmtK(row.propVal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={s.panel}>
        <div className={s.panelHead} style={{ padding: "7px 12px" }}>
          Return components
        </div>
        <div style={{ padding: "12px" }}>
          <ReturnDonut
            segs={[
              { label: "Appreciation", value: Y.appGain, color: C.teal },
              { label: "Principal paydown", value: Y.equityBuild, color: C.heading },
              { label: "Net cashflow", value: Y.totCF, color: C.gold },
              { label: "Depreciation benefit (est.)", value: Y.deprBen, color: "#185FA5" },
            ]}
          />
          <div style={{ fontSize: 9, color: C.muted, marginTop: 10 }}>
            Exit: {fmtD(Y.exitVal)} ·{" "}
            {S.projection.exitCapEnabled ? S.projection.exitCapRate + "% exit cap" : S.projection.appreciationPct + "%/yr appreciation"} ·{" "}
            {S.projection.sellingCostPct ?? 6}% selling costs · consult CPA. Donut shows positive contributors only.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 11 }}>
        <ProjTrace R={R} Y={Y} S={S} />
      </div>
    </div>
  );
}
