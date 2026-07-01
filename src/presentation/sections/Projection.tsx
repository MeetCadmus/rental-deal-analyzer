import { useWorkspace } from "../../application/workspaceStore";
import { fmtD, fmtP } from "../../domain/money";
import type { computeBase } from "../../domain/finance/computeBase";
import type { computeYearly } from "../../domain/finance/computeYearly";
import { marketRentFor, vaMonthlyTotal } from "../../domain/finance/valueadd";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { Field } from "../ui/inputs";
import { Tog, SecLabel } from "../ui/primitives";
import s from "./sections.module.css";

type Base = ReturnType<typeof computeBase>;
type Yearly = ReturnType<typeof computeYearly>;

// Hold period, growth, exit assumptions, value-add & refinance scenarios.
export function Projection({ R, Y }: { R: Base; Y: Yearly }) {
  const S = useWorkspace((s) => s.state);
  const setProj = useWorkspace((s) => s.setProj);
  const totalRent = S.units.reduce((a, u) => a + u.rent, 0);
  const numU = S.units.length;
  // Set one unit's stabilized market rent — seed the whole array from resolved values first
  // (keeps other units / a legacy single target), then override index i.
  const setVaRent = (i: number, x: number) => {
    const arr = S.units.map((u, idx) => marketRentFor(S.projection, u, idx));
    arr[i] = x;
    setProj("vaMarketRents", arr);
  };
  const vaTotal = vaMonthlyTotal(S.projection, S.units);
  return (
    <Card
      title="Projection & Growth"
      icon="trend"
      collapsible
      defaultOpen
      storeKey="proj"
      summary={S.projection.holdYears + "yr · " + fmtP(S.projection.appreciationPct)}
    >
      <div className={s.grid2} style={{ marginBottom: 12 }}>
        <Field label="Hold period" suffix="years" value={S.projection.holdYears} onChange={(x) => setProj("holdYears", x)} min={1} max={30} />
        <Field
          label="Appreciation/yr"
          suffix="%"
          value={S.projection.appreciationPct}
          onChange={(x) => setProj("appreciationPct", x)}
          min={0}
          max={12}
          step={0.25}
          sub="set your market's forecast"
        />
        <Field
          label="Rent growth/yr"
          suffix="%"
          value={S.projection.rentGrowthPct || 0}
          onChange={(x) => setProj("rentGrowthPct", x)}
          min={0}
          max={10}
          step={0.25}
          sub="Applied to all units each year"
        />
        <div className={s.tealBox}>
          <div className={s.tealBoxTitle}>Rent in year {S.projection.holdYears}</div>
          <div className={s.tealBoxValue}>
            {fmtD(Math.round((totalRent / numU) * Math.pow(1 + (S.projection.rentGrowthPct || 0) / 100, (S.projection.holdYears || 5) - 1)))}/unit/mo
          </div>
        </div>
      </div>
      <SecLabel text="Exit assumptions" />
      <div style={{ marginBottom: 12 }}>
        <div className={s.grid2} style={{ marginBottom: 9 }}>
          <Field
            label="Selling costs"
            suffix="%"
            value={S.projection.sellingCostPct}
            onChange={(x) => setProj("sellingCostPct", x)}
            min={0}
            max={12}
            step={0.5}
            sub="agent + closing at sale"
            showZero
          />
          <div className={s.box}>
            <div className={s.boxLabel}>Net sale proceeds (yr {S.projection.holdYears})</div>
            <div className={s.boxValue}>{fmtD(Y.exitVal * (1 - (S.projection.sellingCostPct ?? 6) / 100) - (Y.yearly[Y.yearly.length - 1]?.balance || 0))}</div>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Tog
            checked={S.projection.exitCapEnabled || false}
            onChange={(x) => setProj("exitCapEnabled", x)}
            label="Value the exit on a cap rate"
            sub="Sale price = final-year NOI ÷ exit cap (instead of appreciation %)"
          />
        </div>
        {S.projection.exitCapEnabled && (
          <div className={s.grid2}>
            <Field
              label="Exit cap rate"
              suffix="%"
              value={S.projection.exitCapRate}
              onChange={(x) => setProj("exitCapRate", x)}
              min={1}
              max={15}
              step={0.1}
              sub={"vs entry cap " + fmtP(R.capRate)}
            />
            <div className={s.goldBox}>Higher exit cap than entry = conservative (value compresses); lower = optimistic.</div>
          </div>
        )}
      </div>
      <SecLabel text="Value-add scenario" />
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <Tog
            checked={S.projection.vaEnabled || false}
            onChange={(x) => setProj("vaEnabled", x)}
            label="Below-market rents — value-add potential"
            sub="Show metrics at stabilized market rents"
          />
        </div>
        {S.projection.vaEnabled && (
          <div>
            <div className={s.fieldGrid}>
              {S.units.map((u, i) => (
                <Field
                  key={u.id}
                  label={u.label || "Unit " + (i + 1)}
                  prefix="$"
                  value={marketRentFor(S.projection, u, i)}
                  onChange={(x) => setVaRent(i, x)}
                  min={0}
                  step={25}
                  sub={"now " + fmtD(u.rent) + "/mo"}
                  xs
                />
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>
              Stabilized total: <strong style={{ color: C.heading }}>{fmtD(vaTotal)}/mo</strong>{" "}
              <span style={{ color: C.muted }}>· now {fmtD(totalRent)}/mo</span>
            </div>
            <div className={s.grid2}>
              <Field label="Stabilized by year" value={S.projection.vaYear || 2} onChange={(x) => setProj("vaYear", x)} min={1} max={10} />
            </div>
          </div>
        )}
      </div>
      <SecLabel text="Refinance scenario" />
      <div>
        <div style={{ marginBottom: 8 }}>
          <Tog
            checked={S.projection.refiEnabled || false}
            onChange={(x) => setProj("refiEnabled", x)}
            label="Model a refinance in projection"
            sub="New rate applies from refi year onward"
          />
        </div>
        {S.projection.refiEnabled && (
          <div className={s.grid2}>
            <Field label="Refi year" value={S.projection.refiYear || 3} onChange={(x) => setProj("refiYear", x)} min={1} max={S.projection.holdYears || 5} />
            <Field label="New rate" suffix="%" value={S.projection.refiRate || 6.5} onChange={(x) => setProj("refiRate", x)} min={1} max={15} step={0.125} />
          </div>
        )}
      </div>
    </Card>
  );
}
