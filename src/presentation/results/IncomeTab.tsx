import { C } from "../theme/tokens";
import { PLRow } from "../ui/primitives";
import { fmtD, fmtP } from "../../domain/money";
import type { BaseMetrics, Deal } from "../../domain/types";
import { CalcTrace } from "./CalcTrace";

export function IncomeTab({ R, S }: { R: BaseMetrics; S: Deal }) {
  return <div>
    <div style={{ border: "1px solid " + C.border, borderRadius: 11, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ padding: "8px 13px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.heading, borderBottom: "1px solid " + C.border }}>P&L statement (annual)</div>
      <div style={{ paddingBottom: 4 }}>
        <PLRow label="Gross potential income" value={fmtD(R.gpi) + "/yr"} pos note={R.numU + " units × " + fmtD(R.monRent / R.numU) + " avg"} />
        <PLRow label={"(−) Vacancy (" + S.expenses.vacancyPct + "%)"} value={"−" + fmtD(R.vacAmt) + "/yr"} neg indent />
        {R.otherInc > 0 && <PLRow label="(+) Other income" value={"+" + fmtD(R.otherInc) + "/yr"} pos indent note="laundry · parking · pet · storage" />}
        <PLRow label="= Effective gross income (EGI)" value={fmtD(Math.round(R.egi)) + "/yr"} bold hl />
        {S.expenses.mode === "quick" ? <PLRow label={"(−) Expenses (" + S.expenses.ratio + "% of EGI)"} value={"−" + fmtD(Math.round(R.totExp)) + "/yr"} neg indent />
          : R.expItems && (Object.entries({ Taxes: R.expItems.taxes, Insurance: R.expItems.insurance, Management: R.expItems.mgmt, Maintenance: R.expItems.maint, "CapEx": R.expItems.capex, Utilities: R.expItems.util, Landscaping: R.expItems.landscape, Accounting: R.expItems.acctg, Misc: R.expItems.misc, Custom: R.expItems.custom }) as [string, number][]).filter(([, v2]) => v2 > 0).map(([l2, v2]) => <PLRow key={l2} label={"(−) " + l2} value={"−" + fmtD(v2) + "/yr"} neg indent />)}
        <PLRow label="= Total expenses" value={"−" + fmtD(Math.round(R.totExp)) + "/yr"} neg bold />
        <PLRow label="= Net operating income (NOI)" value={fmtD(Math.round(R.noi)) + "/yr"} bold hl pos />
        <PLRow label={"(−) Debt service (" + S.financing.loanYears + "yr @ " + S.financing.rate + "%)"} value={"−" + fmtD(Math.round(R.annPmt)) + "/yr"} neg indent note={fmtD(R.pmt) + "/mo × 12"} />
        <PLRow label="= Annual cashflow" value={fmtD(R.cf) + "/yr"} bold hl neg={R.cf < 0} pos={R.cf >= 0} />
        <div style={{ padding: "5px 8px", background: C.bg, fontSize: 11, color: C.slate, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>Monthly: <strong style={{ color: R.cf >= 0 ? C.teal : C.red }}>{fmtD(R.cf / 12)}/mo</strong></span>
          <span>Per unit: <strong style={{ color: R.cf >= 0 ? C.teal : C.red }}>{fmtD(R.cf / R.numU / 12)}/mo</strong></span>
          <span>Exp ratio: <strong>{fmtP(R.expRatio)}/yr</strong></span>
        </div>
      </div>
    </div>
    <CalcTrace R={R} S={S} />
  </div>;
}
