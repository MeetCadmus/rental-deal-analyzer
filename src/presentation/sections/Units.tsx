import { useWorkspace } from "../../application/workspaceStore";
import { fmtD } from "../../domain/money";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { MoneyInput, RentInput, Field } from "../ui/inputs";
import { Tog } from "../ui/primitives";

// Purchase price + per-unit rents (with optional beds/bath/sqft) + other income.
export function Units() {
  const S = useWorkspace((s) => s.state);
  const set = useWorkspace((s) => s.set);
  const setUnit = useWorkspace((s) => s.setUnit);
  const addUnit = useWorkspace((s) => s.addUnit);
  const remUnit = useWorkspace((s) => s.remUnit);
  const showUD = useWorkspace((s) => s.showUD);
  const setShowUD = useWorkspace((s) => s.setShowUD);
  const totalRent = S.units.reduce((a, u) => a + u.rent, 0);
  const numU = S.units.length;
  return (
    <Card
      title={"Units & Rents · " + numU + " unit" + (numU !== 1 ? "s" : "")}
      icon="home"
      collapsible
      defaultOpen
      storeKey="units"
      summary={fmtD(totalRent) + "/mo"}
    >
      <div style={{ marginBottom: 11 }}>
        <MoneyInput
          label="Purchase price"
          value={S.price}
          onChange={(x) => set("price", x)}
          sub={"Loan: " + fmtD(S.price * (1 - S.financing.downPct / 100)) + " · Down: " + fmtD((S.price * S.financing.downPct) / 100)}
        />
      </div>
      <div style={{ marginBottom: 9 }}>
        <Tog checked={showUD} onChange={setShowUD} label="Show unit details (beds / bath / sq ft)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {S.units.map((u, i) => (
          <div key={u.id} style={{ border: "1px solid " + C.border, borderRadius: 9, padding: "8px 10px", background: C.bg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: showUD ? 8 : 0 }}>
              <input
                value={u.label}
                onChange={(e) => setUnit(i, "label", e.target.value)}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.heading,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  flex: "0 1 72px",
                  minWidth: 0,
                }}
              />
              <RentInput value={u.rent} onChange={(v) => setUnit(i, "rent", v)} />
              {numU > 1 && (
                <button
                  className="tap-sm"
                  aria-label={"Remove " + (u.label || "unit")}
                  onClick={() => remUnit(i)}
                  style={{
                    padding: "5px 9px",
                    background: C.redL,
                    border: "1px solid " + C.border,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    color: C.red,
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {showUD && (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)", gap: 6 }}>
                <Field label="Beds" value={u.beds || 0} onChange={(x) => setUnit(i, "beds", x)} min={0} max={10} xs />
                <Field label="Baths" value={u.bath || 0} onChange={(x) => setUnit(i, "bath", x)} min={0} max={6} step={0.5} xs />
                <Field label="Sq ft" value={u.sqft || 0} onChange={(x) => setUnit(i, "sqft", x)} min={0} step={50} xs />
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addUnit}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "7px",
          borderRadius: 8,
          border: "1px dashed " + C.border,
          background: C.white,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: C.slate,
          fontFamily: "inherit",
        }}
      >
        + Add unit
      </button>
      <div style={{ marginTop: 10 }}>
        <MoneyInput
          label="Other income / mo"
          value={S.otherIncome || 0}
          onChange={(x) => set("otherIncome", x)}
          sub="laundry · parking · pet · storage (added to EGI)"
        />
      </div>
      <div
        style={{
          marginTop: 9,
          padding: "6px 9px",
          background: C.bg,
          borderRadius: 7,
          border: "1px solid " + C.border,
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: C.slate }}>Total monthly income</span>
        <span style={{ fontWeight: 700, color: C.heading }}>
          {fmtD(totalRent + (S.otherIncome || 0))}/mo · {fmtD((totalRent + (S.otherIncome || 0)) * 12)}/yr
        </span>
      </div>
    </Card>
  );
}
