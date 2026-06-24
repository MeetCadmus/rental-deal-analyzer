import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { Field, MoneyInput } from "../ui/inputs";
import { fmtP, fmtX } from "../../domain/money";
import type { BaseMetrics } from "../../domain/types";

// ── Comparables ───────────────────────────────────────────────
let _cid = 100;
function cuid() { return ++_cid; }

function ComparablesCard({ comps, setComps, currentR }: { comps: any[]; setComps: (fn: (p: any[]) => any[]) => void; currentR: BaseMetrics }) {
  const add = () => setComps(p => [...p, { id: cuid(), label: "Comp " + (p.length + 1), price: 550000, rent: 5600, capRate: 5.5 }]);
  const rem = (i: number) => setComps(p => p.filter((_, j) => j !== i));
  const setC = (i: number, k: string, v: any) => setComps(p => { const a = [...p]; a[i] = { ...a[i], [k]: v }; return a; });
  if (comps.length === 0) return <Card title="Comparable properties" icon="chart">
    <div style={{ fontSize: 12, color: C.slate, marginBottom: 10 }}>Add nearby comparable sales to benchmark this deal against the market.</div>
    <button onClick={add} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 8, border: "1px dashed " + C.border, background: C.white, cursor: "pointer", color: C.slate, fontFamily: "inherit" }}>+ Add comparable</button>
  </Card>;
  const avgCapRate = comps.reduce((s, c) => s + c.capRate, 0) / comps.length;
  return <Card title={"Comparables (" + comps.length + ")"} icon="chart">
    <div style={{ display: "flex", gap: 12, marginBottom: 10, padding: "7px 10px", background: C.bg, borderRadius: 8, border: "1px solid " + C.border, fontSize: 11 }}>
      <div><div style={{ color: C.slate }}>Avg cap rate comps</div><div style={{ fontWeight: 700, color: C.text }}>{fmtP(avgCapRate)}</div></div>
      <div><div style={{ color: C.slate }}>This deal</div><div style={{ fontWeight: 700, color: currentR.capRate >= avgCapRate ? C.teal : C.red }}>{fmtP(currentR.capRate)} {currentR.capRate >= avgCapRate ? "✓ above avg" : "↓ below avg"}</div></div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {comps.map((c, i) => <div key={c.id} style={{ border: "1px solid " + C.border, borderRadius: 9, padding: "8px 10px", background: C.bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
          <input value={c.label} onChange={e => setC(i, "label", e.target.value)} style={{ fontSize: 12, fontWeight: 700, color: C.heading, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", flex: "1 1 auto", minWidth: 0, maxWidth: 160 }} />
          <button onClick={() => rem(i)} style={{ fontSize: 11, color: C.red, background: C.redL, border: "none", borderRadius: 5, cursor: "pointer", padding: "3px 8px", flexShrink: 0, marginLeft: 8 }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)", gap: 7 }}>
          <MoneyInput label="Price" value={c.price} onChange={x => setC(i, "price", x)} small />
          <MoneyInput label="Total rent/mo" value={c.rent} onChange={x => setC(i, "rent", x)} small />
          <Field label="Cap rate" suffix="%" value={c.capRate} onChange={x => setC(i, "capRate", x)} min={0} max={20} step={0.1} xs />
        </div>
        <div style={{ marginTop: 5, fontSize: 10, color: C.slate }}>GRM: {fmtX(c.price / (c.rent * 12))} · 1% rule: {fmtP(c.rent / c.price * 100)}</div>
      </div>)}
    </div>
    <button onClick={add} style={{ marginTop: 8, fontSize: 11, padding: "5px 11px", borderRadius: 7, border: "1px dashed " + C.border, background: C.white, cursor: "pointer", color: C.slate, fontFamily: "inherit" }}>+ Add comp</button>
  </Card>;
}

export { ComparablesCard, cuid };
