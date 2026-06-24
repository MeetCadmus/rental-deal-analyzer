import { useState, useMemo } from "react";
import { C } from "../theme/tokens";
import { Field } from "../ui/inputs";
import { fmtD, fmtP } from "../../domain/money";
import { whatNeedsToBeTrue, calcLoanOptions } from "../../domain/finance/scoring";
import type { BaseMetrics, YearlyResult, Deal } from "../../domain/types";
import type { Sensitivity } from "../../domain/finance/computeSensitivity";

interface WntItem { label: string; val: string; curr: string; delta: number | null; good: boolean }

export function AnalysisTab({ SEN, R, S, Y: _Y }: { SEN: Sensitivity; R: BaseMetrics; S: Deal; Y: YearlyResult }) {
  const [targetCF, setTargetCF] = useState(0);
  const wnt = useMemo(() => whatNeedsToBeTrue(S, R, targetCF), [S, R, targetCF]);
  const loans = useMemo(() => calcLoanOptions(S.price, S.financing.downPct, S.financing.rate, S.financing.loanYears), [S.price, S.financing.downPct, S.financing.rate, S.financing.loanYears]);
  const cfColor = (v: number) => v > 0 ? C.teal : v > -500 ? C.amber : C.red;
  const cfBg = (v: number) => v > 0 ? C.tealL : v > -500 ? C.amberL : C.redL;
  const rVars = [-1.0, -0.5, 0, +0.5, +1.0];

  return <div>
    {/* What needs to be true */}
    <div style={{ border: "1px solid " + C.border, borderRadius: 11, overflow: "hidden", marginBottom: 11 }}>
      <div style={{ padding: "8px 13px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.heading, borderBottom: "1px solid " + C.border, letterSpacing: "0.02em" }}>What needs to be true</div>
      <div style={{ padding: "12px 13px", background: C.white }}>
        <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>Enter your target monthly CF — see what needs to change to hit it</div>
        <div style={{ display: "flex", gap: 9, alignItems: "end", marginBottom: 12 }}>
          <div style={{ flex: 1 }}><Field label="Target CF/mo" prefix="$" value={targetCF} onChange={setTargetCF} min={-5000} max={10000} step={50} sub="0 = break-even, positive = cash flow" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)", gap: 9 }}>
          {([
            { label: "Needed rent/unit", val: fmtD(wnt.neededRentPU) + "/mo", curr: fmtD(R.monRent / R.numU) + "/mo current", delta: wnt.neededRentPU - (R.monRent / R.numU), good: wnt.neededRentPU <= R.monRent / R.numU },
            { label: "Max purchase price", val: wnt.neededPrice ? fmtD(wnt.neededPrice) : "Not possible", curr: fmtD(S.price) + " current", delta: wnt.neededPrice ? wnt.neededPrice - S.price : null, good: wnt.neededPrice != null && wnt.neededPrice >= S.price },
            { label: "Needed rate", val: wnt.neededRate + "%", curr: S.financing.rate + "% current", delta: wnt.neededRate - S.financing.rate, good: wnt.neededRate >= S.financing.rate },
          ] as WntItem[]).map(item => <div key={item.label} style={{ padding: "10px 11px", background: C.white, borderRadius: "calc(var(--c-rad) - 2px)", border: "1px solid " + C.border }}>
            <div style={{ fontSize: 10, color: C.slate, marginBottom: 2, letterSpacing: "0.03em", textTransform: "uppercase" }}>{item.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: item.good ? C.teal : C.red }}>{item.val}</div>
            <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{item.curr}</div>
            {item.delta !== null && <div style={{ fontSize: 10, fontWeight: 600, color: item.good ? C.teal : C.red, marginTop: 2 }}>{item.delta >= 0 ? "+" : ""}{item.label.includes("Rate") ? (item.delta.toFixed(2) + "%") : (item.label.includes("rent") ? fmtD(item.delta) : fmtD(item.delta))} vs current</div>}
          </div>)}
        </div>
      </div>
    </div>

    {/* Sensitivity table */}
    <div style={{ border: "1px solid " + C.border, borderRadius: 11, overflow: "hidden", marginBottom: 11 }}>
      <div style={{ padding: "7px 12px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.heading, borderBottom: "1px solid " + C.border }}>Monthly CF — price vs rate</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ background: C.bg }}>
            <th style={{ padding: "5px 10px", fontWeight: 600, color: C.slate, textAlign: "left", borderBottom: "1px solid " + C.border }}>Price</th>
            {rVars.map(r => <th key={r} style={{ padding: "5px 8px", fontWeight: 600, color: C.slate, textAlign: "center", borderBottom: "1px solid " + C.border, whiteSpace: "nowrap" }}>{r === 0 ? "Current" : (r > 0 ? "+" : "") + r.toFixed(1) + "%"}</th>)}
          </tr></thead>
          <tbody>{SEN.priceRate.map((row, ri) => <tr key={ri}>
            <td style={{ padding: "5px 10px", fontWeight: 600, color: row.label === "Current" ? C.heading : C.text, background: row.label === "Current" ? "var(--c-hl)" : C.white, whiteSpace: "nowrap" }}>
              {row.label === "Current" ? "Current" : row.label} {row.label !== "Current" && <span style={{ fontSize: 9, color: C.slate }}>({fmtD(row.price)})</span>}
            </td>
            {row.cells.map((cell, ci) => { const isCur = row.label === "Current" && cell.label === "Current"; return <td key={ci} style={{ padding: "5px 8px", textAlign: "center", background: cfBg(cell.cf), fontWeight: isCur ? 800 : 500, color: cfColor(cell.cf), fontVariantNumeric: "tabular-nums", outline: isCur ? "2px solid " + C.heading : "none", outlineOffset: -2 }}>{fmtD(cell.cf / 12)}/mo</td>; })}
          </tr>)}</tbody>
        </table>
      </div>
    </div>

    {/* Rent sensitivity */}
    <div style={{ border: "1px solid " + C.border, borderRadius: 11, overflow: "hidden", marginBottom: 11 }}>
      <div style={{ padding: "7px 12px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.heading, borderBottom: "1px solid " + C.border }}>CF sensitivity — rent/unit</div>
      <div style={{ padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SEN.rentCells.map(cell => <div key={cell.delta} style={{ flex: 1, minWidth: 80, padding: "8px", background: cfBg(cell.cf), borderRadius: 8, textAlign: "center", border: "1px solid " + (cell.delta === 0 ? C.gold : "transparent") }}>
          <div style={{ fontSize: 10, color: C.slate, marginBottom: 2 }}>{cell.delta === 0 ? "Current" : (cell.delta > 0 ? "+" : "") + fmtD(cell.delta) + "/unit"}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cfColor(cell.cf), fontVariantNumeric: "tabular-nums" }}>{fmtD(cell.cf / 12)}/mo</div>
          <div style={{ fontSize: 10, color: C.slate, marginTop: 1 }}>{fmtP(cell.capRate)} cap</div>
        </div>)}
      </div>
    </div>

    {/* Loan comparison */}
    <div style={{ border: "1px solid " + C.border, borderRadius: 11, overflow: "hidden", marginBottom: 11 }}>
      <div style={{ padding: "7px 12px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.heading, borderBottom: "1px solid " + C.border }}>Loan type comparison</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ background: C.bg }}>{["Type", "Rate", "Payment/mo", "CF/mo", "Notes"].map(h => <th key={h} style={{ padding: "5px 8px", fontWeight: 600, color: C.slate, textAlign: "right", borderBottom: "1px solid " + C.border, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>{loans.map((loan, i) => {
            const loanCF = R.noi - loan.monthly * 12;
            const isCurrent = i === 0;
            return <tr key={loan.name} style={{ background: isCurrent ? "var(--c-hl)" : i % 2 === 0 ? C.white : C.bg }}>
              <td style={{ padding: "5px 8px", fontWeight: isCurrent ? 600 : 400, color: isCurrent ? C.heading : C.text, textAlign: "right", whiteSpace: "nowrap" }}>{loan.name}{isCurrent && <span style={{ fontSize: 9, marginLeft: 4, padding: "1px 5px", background: C.hl, color: C.heading, borderRadius: 4 }}>current</span>}</td>
              <td style={{ padding: "5px 8px", textAlign: "right" }}>{loan.rate.toFixed(3)}%</td>
              <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>{fmtD(loan.monthly)}/mo</td>
              <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600, color: loanCF >= 0 ? C.teal : C.red }}>{fmtD(loanCF / 12)}/mo</td>
              <td style={{ padding: "5px 8px", textAlign: "right", color: C.slate, fontSize: 10 }}>{loan.note}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  </div>;
}
