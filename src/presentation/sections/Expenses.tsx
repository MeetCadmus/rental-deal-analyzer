import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { Field } from "../ui/inputs";
import { SecLabel, SmBtn, Info } from "../ui/primitives";
import { fmtD } from "../../domain/money";
import { calcExp } from "../../domain/finance/expenses";
import { CLASS_PRESETS } from "../../domain/defaults";
import type { Expenses as ExpensesT } from "../../domain/types";

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.slate }}>Start from a property class</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 8px",
              borderRadius: 10,
              background: activeCls ? C.tealL : C.bg,
              color: activeCls ? C.teal : C.muted,
              border: "1px solid " + C.border,
            }}
          >
            {activeCls ? CLASS_PRESETS[activeCls].label : "Custom"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {Object.entries(CLASS_PRESETS).map(([cls, p]) => {
            const on = activeCls === cls;
            return (
              <button
                key={cls}
                onClick={() => applyClass(cls)}
                style={{
                  flex: 1,
                  padding: "5px 4px",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  border: "1.5px solid " + (on ? C.navy : C.border),
                  background: on ? C.navy : C.white,
                  color: on ? "#fff" : C.slate,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700 }}>{p.label}</div>
                <div style={{ fontSize: 9, opacity: 0.7 }}>{p.hint}</div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
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
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 700,
                border: "1.5px solid " + (on ? C.navy : C.border),
                background: on ? C.navy : C.white,
                color: on ? "#fff" : C.slate,
              }}
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.slate }}>Expense ratio (% of EGI/yr)</label>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.heading }}>
              {ex.ratio || 45}% = {fmtD((egi * (ex.ratio || 45)) / 100)}/yr
            </span>
          </div>
          <input
            type="range"
            min={30}
            max={60}
            step={1}
            value={ex.ratio || 45}
            onChange={(e) => sf("ratio", parseInt(e.target.value))}
            style={{ width: "100%", accentColor: C.navy, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.slate, marginTop: 2 }}>
            <span>30% new/stable</span>
            <span>45% typical</span>
            <span>60% old/C-class</span>
          </div>
          <div
            style={{ marginTop: 8, padding: "7px 10px", background: C.goldL, borderRadius: 7, border: "1px solid " + C.border, fontSize: 10, color: C.amber }}
          >
            Covers all costs: taxes, insurance, management, repairs, CapEx, utilities. Switch to Itemized for full control.
          </div>
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
          const sub2 = { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9, marginBottom: 13 } as const;
          return (
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>
                Enter every cost as an annual amount. Each section totals on the right; the grand total is at the bottom.
              </div>

              <SecLabel text="Taxes & insurance" right={"= " + fmtD(taxIns) + "/yr"} />
              <div style={sub2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <label style={{ fontSize: 10, color: C.slate, fontWeight: 600, display: "flex", alignItems: "center" }}>
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
              <div style={sub2}>
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
              <div style={sub2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <label style={{ fontSize: 10, color: C.slate, fontWeight: 600, display: "flex", alignItems: "center" }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <label style={{ fontSize: 10, color: C.slate, fontWeight: 600, display: "flex", alignItems: "center" }}>
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
              <div style={sub2}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {i === 0 && <label style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>Name</label>}
                    <input
                      value={e.name || ""}
                      onChange={(ev) => setCE(i, "name", ev.target.value)}
                      placeholder="e.g. pest control"
                      style={{
                        padding: "6px 8px",
                        fontSize: 12,
                        border: "1px solid " + C.border,
                        borderRadius: 7,
                        fontFamily: "inherit",
                        color: C.text,
                        outline: "none",
                      }}
                    />
                  </div>
                  <Field label={i === 0 ? "Amount" : undefined} prefix="$" value={e.amt || 0} onChange={(x) => setCE(i, "amt", x)} min={0} step={10} xs />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {i === 0 && <label style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>Period</label>}
                    <select
                      value={e.period || "annual"}
                      onChange={(ev) => setCE(i, "period", ev.target.value)}
                      style={{
                        padding: "6px 7px",
                        fontSize: 12,
                        border: "1px solid " + C.border,
                        borderRadius: 7,
                        fontFamily: "inherit",
                        color: C.text,
                        background: C.white,
                      }}
                    >
                      <option value="annual">/yr</option>
                      <option value="monthly">/mo</option>
                    </select>
                  </div>
                  <button
                    className="tap-sm"
                    aria-label="Remove expense"
                    onClick={() => remCE(i)}
                    style={{
                      padding: "6px",
                      background: C.redL,
                      border: "1px solid " + C.border,
                      borderRadius: 7,
                      cursor: "pointer",
                      fontSize: 12,
                      color: C.red,
                      marginTop: i === 0 ? 17 : 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addCE}
                style={{
                  fontSize: 11,
                  padding: "5px 11px",
                  borderRadius: 7,
                  border: "1px dashed " + C.border,
                  background: C.white,
                  cursor: "pointer",
                  color: C.slate,
                  fontFamily: "inherit",
                }}
              >
                + Add expense
              </button>

              <div
                style={{
                  background: "linear-gradient(90deg," + C.navy + "," + C.navyM + ")",
                  borderRadius: 9,
                  padding: "10px 14px",
                  color: "#fff",
                  marginTop: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, opacity: 0.75 }}>
                  <span>Total operating expenses</span>
                  <span>
                    {egi > 0 ? ((totExp / egi) * 100).toFixed(0) : 0}% of EGI · {fmtD(totExp / u / 12)}/unit/mo
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, marginBottom: 7 }}>{fmtD(totExp)}/yr</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 5 }}>
                  {(
                    [
                      ["Tax & ins", taxIns],
                      ["Mgmt", items.mgmt],
                      ["Maint & reserves", maintRes],
                      ["Other", other],
                    ] as const
                  ).map(([l2, v2]) => (
                    <div key={l2} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 7px" }}>
                      <div style={{ fontSize: 9, opacity: 0.65 }}>{l2}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>{fmtD(v2)}</div>
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
