import { useState } from "react";
import { C } from "../theme/tokens";
import { fmt, fmtD, fmtP } from "../../domain/money";
import type { BaseMetrics, Deal } from "../../domain/types";
import s from "./results.module.css";

interface TraceRow {
  l: string;
  v: string;
  f: string;
  c: string;
  b?: boolean;
}

export function CalcTrace({ R, S }: { R: BaseMetrics; S: Deal }) {
  const [open, setOpen] = useState(false);
  const numU = S.units.length || 1;
  const rows: TraceRow[] = [
    { l: "Gross potential income", v: fmtD(R.gpi) + "/yr", f: "= " + fmtD(R.monRent) + "/mo × 12 = " + fmtD(R.gpi) + "/yr", c: C.blueS, b: true },
    { l: "(−) Vacancy (" + S.expenses.vacancyPct + "%)", v: "−" + fmtD(R.vacAmt) + "/yr", f: "= GPI × " + S.expenses.vacancyPct + "%", c: C.red },
    ...(R.otherInc > 0 ? [{ l: "(+) Other income", v: "+" + fmtD(R.otherInc) + "/yr", f: "laundry · parking · pet · storage", c: C.teal }] : []),
    {
      l: "= Effective gross income",
      v: fmtD(Math.round(R.egi)) + "/yr",
      f: R.otherInc > 0 ? "= GPI − vacancy + other income" : "= GPI − vacancy",
      c: C.blueS,
      b: true,
    },
    {
      l: "(−) Total expenses",
      v: "−" + fmtD(R.totExp) + "/yr",
      f: S.expenses.mode === "quick" ? S.expenses.ratio + "% of EGI" : "sum of itemized expenses",
      c: C.red,
    },
    { l: "= Net operating income (NOI)", v: fmtD(Math.round(R.noi)) + "/yr", f: "= EGI − expenses", c: C.teal, b: true },
    { l: "(−) Debt service", v: "−" + fmtD(Math.round(R.annPmt)) + "/yr", f: fmtD(R.pmt) + "/mo × 12", c: C.red },
    { l: "= Annual cashflow", v: fmtD(R.cf) + "/yr", f: "= NOI − debt service", c: R.cf >= 0 ? C.teal : C.red, b: true },
    { l: "= Monthly cashflow", v: fmtD(R.cf / 12) + "/mo", f: "= annual ÷ 12", c: R.cf >= 0 ? C.teal : C.red, b: true },
    { l: "= Per unit cashflow", v: fmtD(R.cf / numU / 12) + "/unit/mo", f: "= monthly ÷ " + numU + " units", c: R.cf >= 0 ? C.teal : C.red },
  ];
  return (
    <div className={s.panel} style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)} className={`${s.traceToggle}${open ? " " + s.traceToggleOpen : ""}`}>
        <span className={s.traceTitle}>How cashflow is calculated — step by step</span>
        <span className={s.traceChevron} style={{ transform: open ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>
      {open && (
        <div className={s.traceBody}>
          {rows.map((row, i) => (
            <div key={i} style={{ marginBottom: 8, borderLeft: "3px solid " + (row.b ? row.c : C.grid), paddingLeft: 8 }}>
              <div className={s.traceRowTop}>
                <span style={{ fontSize: 12, fontWeight: row.b ? 600 : 400, color: row.b ? row.c : C.slate }}>{row.l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.c, marginLeft: 8, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{row.v}</span>
              </div>
              <div className={s.traceRowFormula}>{row.f}</div>
            </div>
          ))}
          <div className={s.goldNote} style={{ marginTop: 6 }}>
            Cap rate: {fmtD(R.noi)} ÷ ${fmt(S.price)} = <strong>{fmtP(R.capRate)}</strong> &nbsp;·&nbsp; CoC: {fmtD(R.cf)} ÷ {fmtD(R.cashIn)} ={" "}
            <strong>{fmtP(R.coc)}</strong> &nbsp;·&nbsp; DSCR: {fmtD(R.noi)} ÷ {fmtD(R.annPmt)} = <strong>{R.dscr.toFixed(2)}</strong> &nbsp;·&nbsp; Break-even
            rent: <strong>{fmtD(R.beRent)}/unit/mo</strong>
          </div>
        </div>
      )}
    </div>
  );
}
