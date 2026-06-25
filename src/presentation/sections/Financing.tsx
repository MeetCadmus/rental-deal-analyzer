import { useWorkspace } from "../../application/workspaceStore";
import { fmtD } from "../../domain/money";
import type { computeBase } from "../../domain/finance/computeBase";
import { Card } from "../ui/Card";
import { Field } from "../ui/inputs";
import { Tog } from "../ui/primitives";
import s from "./sections.module.css";

type Base = ReturnType<typeof computeBase>;

// Down payment, rate, term, reserves + optional partnership share.
export function Financing({ R }: { R: Base }) {
  const S = useWorkspace((s) => s.state);
  const setFin = useWorkspace((s) => s.setFin);
  const setPart = useWorkspace((s) => s.setPart);
  return (
    <Card title="Financing" icon="bank" collapsible defaultOpen storeKey="fin" summary={fmtD(R.pmt) + "/mo"}>
      <div className={s.grid2}>
        <Field
          label="Down payment"
          suffix="%"
          value={S.financing.downPct}
          onChange={(x) => setFin("downPct", x)}
          min={0}
          max={100}
          step={0.5}
          sub={"= " + fmtD((S.price * S.financing.downPct) / 100)}
          showZero
        />
        <Field label="Interest rate" suffix="%" value={S.financing.rate} onChange={(x) => setFin("rate", x)} min={0} max={20} step={0.125} showZero />
        <Field label="Loan term" suffix="yrs" value={S.financing.loanYears} onChange={(x) => setFin("loanYears", x)} min={1} max={40} />
        <div className={s.box}>
          <div className={s.boxLabel}>Monthly payment</div>
          <div className={s.boxValue}>{fmtD(R.pmt)}/mo</div>
          <div className={s.boxSub}>Loan: {fmtD(R.loan)}</div>
        </div>
      </div>
      <div style={{ marginTop: 9 }}>
        <Field
          label="Cash reserves"
          suffix="mo PITI"
          value={S.financing.reserveMonths || 0}
          onChange={(x) => setFin("reserveMonths", x)}
          min={0}
          max={24}
          step={1}
          tip={[
            "Liquid cash a lender wants you to keep AFTER closing — months of PITI (principal+interest+taxes+insurance).",
            "· Investment / multifamily: often 6 months",
            "· DSCR loans: ~3–12 months",
            "· Owner-occupied: 0–2 months",
            "· You keep this money — it's not spent, so it's not counted in cash-on-cash.",
          ]}
          sub={
            (S.financing.reserveMonths || 0) > 0
              ? "= " + fmtD(R.reserves) + " to keep on hand · PITI ≈ " + fmtD(R.pitiMo) + "/mo"
              : "0 = none. Investment loans often require ~6."
          }
        />
      </div>
      <div className={s.dividerTop}>
        <Tog
          checked={S.partnership?.enabled || false}
          onChange={(x) => setPart("enabled", x)}
          label="Partnership purchase"
          sub="Calculate my share of returns"
        />
        {S.partnership?.enabled && (
          <div style={{ marginTop: 9 }}>
            <Field
              label="My equity share"
              suffix="%"
              value={S.partnership.myPct || 60}
              onChange={(x) => setPart("myPct", x)}
              min={1}
              max={99}
              step={1}
              sub={"Partner: " + (100 - (S.partnership.myPct || 60)) + "%"}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
