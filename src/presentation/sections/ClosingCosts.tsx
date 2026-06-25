import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { Field, MoneyInput } from "../ui/inputs";
import { SecLabel } from "../ui/primitives";
import { fmtD, num } from "../../domain/money";
import type { Closing } from "../../domain/types";

interface ClosingCostsProps {
  cc: Closing;
  setCC: (fn: (p: Closing) => Closing) => void;
  price: number;
  loan: number;
  annTax: number;
  annIns: number;
  rate: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function ClosingCosts({ cc, setCC, price, loan, annTax, annIns, rate, collapsible, defaultOpen }: ClosingCostsProps) {
  const sf = (k: string, v: unknown) => setCC((p) => ({ ...p, [k]: v }));
  const l = loan || 0,
    p = price || 0,
    r = rate ?? 7.25,
    aT = annTax || 0,
    aI = annIns || 0;
  const transferTax = (p * (cc.transferTaxPct || 0)) / 100,
    prepInt = (cc.prepaidDays || 0) * ((l * r) / 100 / 365);
  const taxEsc = (aT / 12) * (cc.taxEscrowMonths || 0),
    insEsc = (aI / 12) * (cc.insEscrowMonths || 0);
  const lT = (l * (cc.origPct || 0)) / 100 + (l * (cc.pointsPct || 0)) / 100 + (cc.appraisal || 0) + (cc.creditReport || 0) + (cc.underwriting || 0);
  const taxT = transferTax + (cc.recordingFees || 0),
    titleT = (cc.attyFee || 0) + (cc.titleSearch || 0) + (cc.lenderTitle || 0) + (cc.ownerTitle || 0);
  const prepT = (cc.firstYearInsurance || 0) + prepInt + taxEsc + insEsc,
    ddT = (cc.inspection || 0) + (cc.termite || 0) + (cc.survey || 0) + (cc.enviro || 0);
  const custT = (cc.customItems || []).reduce((s, x) => s + num(x.amt), 0),
    grand = lT + taxT + titleT + prepT + ddT + custT;
  const total = cc.mode === "quick" ? (p * (cc.quickPct || 3)) / 100 : grand;
  const addI = () => setCC((p) => ({ ...p, customItems: [...(p.customItems || []), { name: "", amt: 0 }] }));
  const remI = (i: number) => setCC((p) => ({ ...p, customItems: p.customItems.filter((_, j) => j !== i) }));
  const setI = (i: number, k: string, v: unknown) =>
    setCC((p) => {
      const a = [...p.customItems];
      a[i] = { ...a[i], [k]: v };
      return { ...p, customItems: a };
    });
  return (
    <Card
      title="Closing costs"
      icon="file"
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      storeKey="closing"
      summary={collapsible ? fmtD(total) : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        {(
          [
            ["quick", "Quick %"],
            ["detailed", "Itemized"],
          ] as const
        ).map(([id, lbl]) => {
          const on = cc.mode === id;
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
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.slate }}>
          Total: <strong style={{ color: C.heading }}>{fmtD(total)}</strong>
        </span>
      </div>
      {cc.mode === "quick" && (
        <div>
          <Field
            label="Closing cost %"
            suffix="%"
            value={cc.quickPct || 3}
            onChange={(x) => sf("quickPct", x)}
            min={1}
            max={8}
            step={0.1}
            sub={fmtD((p * (cc.quickPct || 3)) / 100) + " estimated"}
          />
          <div style={{ marginTop: 9, background: C.bg, borderRadius: 8, padding: "9px 12px", border: "1px solid " + C.border, fontSize: 11 }}>
            <div style={{ fontWeight: 700, color: C.heading, marginBottom: 4 }}>Typical buyer ranges</div>
            {[
              ["Cash, no inspection", "1.5–2%"],
              ["Standard (financed)", "2.5–3.5%"],
              ["With inspection + survey", "3–4%"],
              ["Investment / multifamily", "3–4.5%"],
            ].map(([l2, r2]) => (
              <div key={l2} style={{ display: "flex", justifyContent: "space-between", color: C.slate, marginBottom: 2 }}>
                <span>{l2}</span>
                <span style={{ fontWeight: 600, color: C.text }}>{r2}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {cc.mode === "detailed" && (
        <div>
          <SecLabel text="Lender fees" right={"= " + fmtD(lT)} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 12 }}>
            <Field
              label="Origination fee"
              suffix="% of loan"
              value={cc.origPct || 0}
              onChange={(x) => sf("origPct", x)}
              min={0}
              max={3}
              step={0.125}
              sub={fmtD((l * (cc.origPct || 0)) / 100)}
              xs
            />
            <Field
              label="Discount points"
              suffix="% of loan"
              value={cc.pointsPct || 0}
              onChange={(x) => sf("pointsPct", x)}
              min={0}
              max={4}
              step={0.125}
              sub={fmtD((l * (cc.pointsPct || 0)) / 100)}
              xs
            />
            <Field label="Appraisal" prefix="$" value={cc.appraisal || 0} onChange={(x) => sf("appraisal", x)} min={0} step={50} sub="$600–1,200" xs />
            <Field label="Underwriting" prefix="$" value={cc.underwriting || 0} onChange={(x) => sf("underwriting", x)} min={0} step={50} sub="$500–1,500" xs />
          </div>
          <SecLabel text="Transfer & recording tax" right={"= " + fmtD(taxT)} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 12 }}>
            <Field
              label="Transfer/deed tax"
              suffix="% of price"
              value={cc.transferTaxPct || 0}
              onChange={(x) => sf("transferTaxPct", x)}
              min={0}
              max={5}
              step={0.05}
              sub={fmtD(transferTax) + " · varies by state/county"}
              xs
            />
            <Field
              label="Recording fees"
              prefix="$"
              value={cc.recordingFees || 0}
              onChange={(x) => sf("recordingFees", x)}
              min={0}
              step={5}
              sub="flat county fees"
              xs
            />
          </div>
          <SecLabel text="Title & attorney" right={"= " + fmtD(titleT)} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 12 }}>
            <Field label="Closing attorney" prefix="$" value={cc.attyFee || 0} onChange={(x) => sf("attyFee", x)} min={0} step={50} sub="Required in GA" xs />
            <Field label="Title search" prefix="$" value={cc.titleSearch || 0} onChange={(x) => sf("titleSearch", x)} min={0} step={25} xs />
            <Field label="Lender's title ins." prefix="$" value={cc.lenderTitle || 0} onChange={(x) => sf("lenderTitle", x)} min={0} step={50} xs />
            <Field label="Owner's title ins." prefix="$" value={cc.ownerTitle || 0} onChange={(x) => sf("ownerTitle", x)} min={0} step={50} xs />
          </div>
          <SecLabel text="Prepaids & escrow" right={"= " + fmtD(prepT)} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 12 }}>
            <MoneyInput label="First-year insurance" value={cc.firstYearInsurance || 0} onChange={(x) => sf("firstYearInsurance", x)} small />
            <Field
              label="Prepaid interest"
              suffix="days"
              value={cc.prepaidDays || 0}
              onChange={(x) => sf("prepaidDays", x)}
              min={0}
              max={31}
              sub={fmtD(prepInt) + " auto"}
              xs
            />
            <Field
              label="Tax escrow"
              suffix="mo"
              value={cc.taxEscrowMonths || 0}
              onChange={(x) => sf("taxEscrowMonths", x)}
              min={0}
              max={6}
              sub={fmtD(taxEsc) + " auto"}
              xs
            />
            <Field
              label="Insurance escrow"
              suffix="mo"
              value={cc.insEscrowMonths || 0}
              onChange={(x) => sf("insEscrowMonths", x)}
              min={0}
              max={6}
              sub={fmtD(insEsc) + " auto"}
              xs
            />
          </div>
          <SecLabel text="Inspection & DD" right={"= " + fmtD(ddT)} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 12 }}>
            <Field
              label="Property inspection"
              prefix="$"
              value={cc.inspection || 0}
              onChange={(x) => sf("inspection", x)}
              min={0}
              step={50}
              sub="$400–700"
              xs
            />
            <Field label="Pest / termite" prefix="$" value={cc.termite || 0} onChange={(x) => sf("termite", x)} min={0} step={25} xs />
            <Field label="Survey" prefix="$" value={cc.survey || 0} onChange={(x) => sf("survey", x)} min={0} step={50} xs />
            <Field label="Environmental" prefix="$" value={cc.enviro || 0} onChange={(x) => sf("enviro", x)} min={0} step={100} xs />
          </div>
          {(cc.customItems || []).length > 0 && <SecLabel text="Other" />}
          {(cc.customItems || []).map((item, i) => (
            <div
              key={i}
              className="del-row-cc"
              style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 110px 28px", gap: 7, marginBottom: 7, alignItems: "end" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {i === 0 && <label style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>Description</label>}
                <input
                  value={item.name || ""}
                  onChange={(e) => setI(i, "name", e.target.value)}
                  placeholder="e.g. HOA fee"
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
              <Field label={i === 0 ? "Amount" : undefined} prefix="$" value={item.amt || 0} onChange={(x) => setI(i, "amt", x)} min={0} step={10} xs />
              <button
                className="tap-sm"
                aria-label="Remove item"
                onClick={() => remI(i)}
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
            onClick={addI}
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
            + Add item
          </button>
          <div
            style={{ background: "linear-gradient(90deg," + C.navy + "," + C.navyM + ")", borderRadius: 9, padding: "10px 14px", color: "#fff", marginTop: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, opacity: 0.7 }}>
              <span>Total closing costs</span>
              <span>{p > 0 ? ((grand / p) * 100).toFixed(2) : 0}% of price</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, marginBottom: 7 }}>{fmtD(grand)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 5 }}>
              {(
                [
                  ["Lender", lT],
                  ["Taxes", taxT],
                  ["Title/atty", titleT],
                  ["Prepaids", prepT],
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
      )}
    </Card>
  );
}
