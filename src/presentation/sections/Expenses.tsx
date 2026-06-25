import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { Field } from "../ui/inputs";
import { SecLabel, SmBtn, Info } from "../ui/primitives";
import { fmtD } from "../../domain/money";
import { calcExp } from "../../domain/finance/expenses";
import { CLASS_PRESETS } from "../../domain/defaults";
import type { Expenses as ExpensesT } from "../../domain/types";
import s from "./sections.module.css";

interface ExpensesProps {
  ex: ExpensesT;
  setEx: (fn: (p: ExpensesT) => ExpensesT) => void;
  units: number;
  egi: number;
  price: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function Expenses({ ex, setEx, units, egi, price, collapsible, defaultOpen }: ExpensesProps) {
  const sf = (k: string, v: unknown) => setEx((p) => ({ ...p, [k]: v }));
  const u = units || 1;
  const { totExp, items } = calcExp(ex, units, egi, price);
  // Presets store per-unit/mo (maint/capex) & per-unit/yr (insurance); applied as annual totals.
  const applyClass = (cls: string) => {
    const p = CLASS_PRESETS[cls];
    if (!p) return;
    if (ex.mode === "quick") {
      setEx((prev) => ({ ...prev, ratio: p.ratio, propertyClass: cls }));
    } else {
      setEx((prev) => ({
        ...prev,
        propertyClass: cls,
        ratio: p.ratio,
        insurance: p.insurance * u,
        maintenance: p.maintenance * u * 12,
        capex: p.capex * u * 12,
        taxes: Math.round(((price || 0) * 1.2) / 100),
        taxMode: "fixed",
        maintMode: "fixed",
        capexMode: "fixed",
        v: 2,
      }));
    }
  };
  // A class is "active" only while the current values still match it — edit a field
  // (or drag the ratio) and it falls back to "Custom".
  const activeCls = (() => {
    for (const [cls, p] of Object.entries(CLASS_PRESETS)) {
      if (ex.mode === "quick") {
        if ((ex.ratio || 45) === p.ratio) return cls;
      } else if ((ex.maintenance || 0) === p.maintenance * u * 12 && (ex.capex || 0) === p.capex * u * 12 && (ex.insurance || 0) === p.insurance * u)
        return cls;
    }
    return null;
  })();
  const addCE = () => setEx((p) => ({ ...p, customExpenses: [...(p.customExpenses || []), { name: "", amt: 0, period: "annual" }] }));
  const remCE = (i: number) => setEx((p) => ({ ...p, customExpenses: p.customExpenses.filter((_, j) => j !== i) }));
  const setCE = (i: number, k: string, v: unknown) =>
    setEx((p) => {
      const a = [...p.customExpenses];
      a[i] = { ...a[i], [k]: v };
      return { ...p, customExpenses: a };
    });
  return (
    <Card
      title="Vacancy & Expenses"
      icon="percent"
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      storeKey="expenses"
      summary={collapsible ? fmtD(totExp) + "/yr" : undefined}
    >
      {/* Property class preset (a starting point — clears to "Custom" once edited) */}
      <div style={{ marginBottom: 12 }}>
        <div className={s.classHeadRow}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.slate }}>Start from a property class</span>
          <span className={s.classBadge} style={{ background: activeCls ? C.tealL : C.bg, color: activeCls ? C.teal : C.muted }}>
            {activeCls ? CLASS_PRESETS[activeCls].label : "Custom"}
          </span>
        </div>
        <div className={s.classRow}>
          {Object.entries(CLASS_PRESETS).map(([cls, p]) => {
            const on = activeCls === cls;
            return (
              <button
                key={cls}
                onClick={() => applyClass(cls)}
                className={s.classBtn}
                style={{ border: "1.5px solid " + (on ? C.navy : C.border), background: on ? C.navy : C.white, color: on ? "#fff" : C.slate }}
              >
                <div className={s.classBtnLabel}>{p.label}</div>
                <div className={s.classBtnHint}>{p.hint}</div>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
          {activeCls
            ? ex.mode === "quick"
              ? "Sets the expense ratio. Drag the ratio below to customize."
              : "Filled all expense fields. Edit any to customize."
            : "Custom values — tap a class to prefill " + (ex.mode === "quick" ? "its typical ratio." : "typical expense fields.")}
        </div>
      </div>
      <div className={s.modeRow}>
        {(
          [
            ["quick", "Quick %"],
            ["detailed", "Itemized"],
          ] as const
        ).map(([id, lbl]) => {
          const on = ex.mode === id;
          return (
            <button
              key={id}
              onClick={() => sf("mode", id)}
              className={s.segBtn}
              style={{ border: "1.5px solid " + (on ? C.navy : C.border), background: on ? C.navy : C.white, color: on ? "#fff" : C.slate }}
            >
              {lbl}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.slate }}>
          Total: <strong style={{ color: C.heading }}>{fmtD(totExp)}/yr</strong>
        </span>
      </div>
      <div style={{ marginBottom: ex.mode === "quick" ? 10 : 12 }}>
        <Field
          label="Vacancy rate"
          suffix="%"
          value={ex.vacancyPct || 0}
          onChange={(x) => sf("vacancyPct", x)}
          min={0}
          max={30}
          step={0.5}
          sub="typically 5–8%"
        />
      </div>
      {ex.mode === "quick" && (
        <div>
          <div className={s.ratioLabelRow}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.slate }}>Expense ratio (% of EGI/yr)</label>
            <span className={s.ratioValue}>
              {ex.ratio || 45}% = {fmtD((egi * (ex.ratio || 45)) / 100)}/yr
            </span>
          </div>
          <input type="range" min={30} max={60} step={1} value={ex.ratio || 45} onChange={(e) => sf("ratio", parseInt(e.target.value))} className={s.range} />
          <div className={s.ratioHints}>
            <span>30% new/stable</span>
            <span>45% typical</span>
            <span>60% old/C-class</span>
          </div>
          <div className={s.quickNote}>Covers all costs: taxes, insurance, management, repairs, CapEx, utilities. Switch to Itemized for full control.</div>
        </div>
      )}
      {ex.mode === "detailed" &&
        items &&
        (() => {
          const perMo = (v: number) => "≈ " + fmtD(v / 12) + "/mo";
          const perUnitMo = (v: number) => (u > 0 ? "≈ " + fmtD(v / u / 12) + "/unit/mo" : "");
          const taxIns = items.taxes + items.insurance,
            maintRes = items.maint + items.capex,
            other = items.util + items.landscape + items.acctg + items.misc + items.custom;
          return (
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>
                Enter every cost as an annual amount. Each section totals on the right; the grand total is at the bottom.
              </div>

              <SecLabel text="Taxes & insurance" right={"= " + fmtD(taxIns) + "/yr"} />
              <div className={s.subGrid}>
                <div className={s.col}>
                  <div className={s.modeFieldHead}>
                    <label className={s.modeFieldLabel}>
                      Property taxes
                      <Info lines={["Annual property tax bill.", "· GA est ≈ 1.0–1.5% of price/yr", "· Check the county assessor for the real figure"]} />
                    </label>
                    <SmBtn active={ex.taxMode !== "pct"} onClick={() => sf("taxMode", "fixed")} label="$/yr" />
                    <SmBtn active={ex.taxMode === "pct"} onClick={() => sf("taxMode", "pct")} label="% price" />
                  </div>
                  {ex.taxMode === "pct" ? (
                    <Field
                      suffix="% of price"
                      value={ex.taxPct || 1.2}
                      onChange={(x) => sf("taxPct", x)}
                      min={0}
                      max={5}
                      step={0.05}
                      sub={"= " + fmtD(items.taxes) + "/yr"}
                      xs
                    />
                  ) : (
                    <Field
                      prefix="$"
                      suffix="/yr"
                      value={ex.taxes || 0}
                      onChange={(x) => sf("taxes", x)}
                      min={0}
                      step={100}
                      sub={"auto est " + fmtD(Math.round(((price || 0) * 1.2) / 100))}
                      xs
                    />
                  )}
                </div>
                <Field
                  label="Insurance"
                  prefix="$"
                  suffix="/yr"
                  value={ex.insurance || 0}
                  onChange={(x) => sf("insurance", x)}
                  min={0}
                  step={100}
                  sub={perMo(items.insurance)}
                  tip={["Landlord / hazard insurance per year.", "· Small multifamily ≈ $1,000–2,000/unit/yr", "· get a real quote for your market"]}
                  xs
                />
              </div>

              <SecLabel text="Management" right={"= " + fmtD(items.mgmt) + "/yr"} />
              <div className={s.subGrid}>
                <Field
                  label="Management fee"
                  suffix="% of rent"
                  value={ex.mgmtPct || 0}
                  onChange={(x) => sf("mgmtPct", x)}
                  min={0}
                  max={15}
                  step={0.5}
                  sub={"= " + fmtD(items.mgmt) + "/yr"}
                  tip={[
                    "Property-management fee, % of collected rent (EGI).",
                    "· Typical 8–10%",
                    "· Include ~8% even if self-managing — it values your time and keeps the deal honest",
                  ]}
                  xs
                />
                <div />
              </div>

              <SecLabel text="Maintenance & reserves" right={"= " + fmtD(maintRes) + "/yr"} />
              <div className={s.subGrid}>
                <div className={s.col}>
                  <div className={s.modeFieldHead}>
                    <label className={s.modeFieldLabel}>
                      Maintenance
                      <Info
                        lines={[
                          "Routine repairs & turnover.",
                          "· Rule of thumb ≈ $100–250/unit/mo",
                          "· or ≈ 1% of property value /yr",
                          "· Older buildings: budget more",
                        ]}
                      />
                    </label>
                    <SmBtn active={ex.maintMode !== "pct"} onClick={() => sf("maintMode", "fixed")} label="$/yr" />
                    <SmBtn active={ex.maintMode === "pct"} onClick={() => sf("maintMode", "pct")} label="% value" />
                  </div>
                  {ex.maintMode === "pct" ? (
                    <Field
                      suffix="% of value/yr"
                      value={ex.maintPct || 1}
                      onChange={(x) => sf("maintPct", x)}
                      min={0}
                      max={5}
                      step={0.1}
                      sub={"= " + fmtD(items.maint) + "/yr"}
                      xs
                    />
                  ) : (
                    <Field
                      prefix="$"
                      suffix="/yr"
                      value={ex.maintenance || 0}
                      onChange={(x) => sf("maintenance", x)}
                      min={0}
                      step={100}
                      sub={perUnitMo(items.maint)}
                      xs
                    />
                  )}
                </div>
                <div className={s.col}>
                  <div className={s.modeFieldHead}>
                    <label className={s.modeFieldLabel}>
                      CapEx reserve
                      <Info
                        lines={[
                          "Savings for big-ticket replacements (roof, HVAC, etc.).",
                          "· ≈ $100–200/unit/mo",
                          "· or ≈ 0.5–1% of value /yr",
                          "· Not a monthly bill — money you set aside",
                        ]}
                      />
                    </label>
                    <SmBtn active={ex.capexMode !== "pct"} onClick={() => sf("capexMode", "fixed")} label="$/yr" />
                    <SmBtn active={ex.capexMode === "pct"} onClick={() => sf("capexMode", "pct")} label="% value" />
                  </div>
                  {ex.capexMode === "pct" ? (
                    <Field
                      suffix="% of value/yr"
                      value={ex.capexPct || 0.5}
                      onChange={(x) => sf("capexPct", x)}
                      min={0}
                      max={3}
                      step={0.1}
                      sub={"= " + fmtD(items.capex) + "/yr"}
                      xs
                    />
                  ) : (
                    <Field prefix="$" suffix="/yr" value={ex.capex || 0} onChange={(x) => sf("capex", x)} min={0} step={100} sub={perUnitMo(items.capex)} xs />
                  )}
                </div>
              </div>

              <SecLabel text="Other operating" right={"= " + fmtD(other - items.custom) + "/yr"} />
              <div className={s.subGrid}>
                <Field
                  label="Utilities"
                  prefix="$"
                  suffix="/yr"
                  value={ex.utilities || 0}
                  onChange={(x) => sf("utilities", x)}
                  min={0}
                  step={100}
                  sub={perMo(items.util)}
                  tip={[
                    "Owner-paid utilities (water/sewer, common-area power, trash).",
                    "· Often $0 if tenants pay their own",
                    "· Water/sewer & trash are commonly owner-paid",
                  ]}
                  xs
                />
                <Field
                  label="Landscaping"
                  prefix="$"
                  suffix="/yr"
                  value={ex.landscaping || 0}
                  onChange={(x) => sf("landscaping", x)}
                  min={0}
                  step={100}
                  sub={perMo(items.landscape)}
                  tip={["Lawn / grounds / snow.", "· Single-family or small MF often $0–1,500/yr"]}
                  xs
                />
                <Field
                  label="Accounting & legal"
                  prefix="$"
                  suffix="/yr"
                  value={ex.accounting || 0}
                  onChange={(x) => sf("accounting", x)}
                  min={0}
                  step={100}
                  sub="bookkeeping, tax prep"
                  tip={["Bookkeeping, tax prep, LLC/registration fees.", "· Often $500–1,500/yr"]}
                  xs
                />
                <Field
                  label="Misc / other"
                  prefix="$"
                  suffix="/yr"
                  value={ex.misc || 0}
                  onChange={(x) => sf("misc", x)}
                  min={0}
                  step={100}
                  sub="advertising, supplies"
                  tip={["Catch-all: advertising, supplies, bank fees, software, HOA dues if any."]}
                  xs
                />
              </div>

              <SecLabel text="Custom line items" right={(ex.customExpenses || []).length ? "= " + fmtD(items.custom) + "/yr" : undefined} />
              {(ex.customExpenses || []).map((e, i) => (
                <div
                  key={i}
                  className="del-row-ex"
                  style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 92px 86px 26px", gap: 6, marginBottom: 6, alignItems: "end" }}
                >
                  <div className={s.fieldCol}>
                    {i === 0 && <label className={s.miniLabel}>Name</label>}
                    <input
                      value={e.name || ""}
                      onChange={(ev) => setCE(i, "name", ev.target.value)}
                      placeholder="e.g. pest control"
                      className={s.customNameInput}
                    />
                  </div>
                  <Field label={i === 0 ? "Amount" : undefined} prefix="$" value={e.amt || 0} onChange={(x) => setCE(i, "amt", x)} min={0} step={10} xs />
                  <div className={s.fieldCol}>
                    {i === 0 && <label className={s.miniLabel}>Period</label>}
                    <select value={e.period || "annual"} onChange={(ev) => setCE(i, "period", ev.target.value)} className={s.periodSelect}>
                      <option value="annual">/yr</option>
                      <option value="monthly">/mo</option>
                    </select>
                  </div>
                  <button className={`tap-sm ${s.delBtn}`} aria-label="Remove expense" onClick={() => remCE(i)} style={{ marginTop: i === 0 ? 17 : 0 }}>
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={addCE} className={s.addItemBtn}>
                + Add expense
              </button>

              <div className={s.totalBox} style={{ marginTop: 13 }}>
                <div className={s.totalBoxHead} style={{ opacity: 0.75 }}>
                  <span>Total operating expenses</span>
                  <span>
                    {egi > 0 ? ((totExp / egi) * 100).toFixed(0) : 0}% of EGI · {fmtD(totExp / u / 12)}/unit/mo
                  </span>
                </div>
                <div className={s.totalBoxValue}>{fmtD(totExp)}/yr</div>
                <div className={s.totalBoxGrid}>
                  {(
                    [
                      ["Tax & ins", taxIns],
                      ["Mgmt", items.mgmt],
                      ["Maint & reserves", maintRes],
                      ["Other", other],
                    ] as const
                  ).map(([l2, v2]) => (
                    <div key={l2} className={s.totalTile}>
                      <div className={s.totalTileLabel}>{l2}</div>
                      <div className={s.totalTileValue}>{fmtD(v2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
    </Card>
  );
}
