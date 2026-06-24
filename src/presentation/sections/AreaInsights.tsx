import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { num } from "../../domain/money";

// ── Area & due-diligence: qualitative context (AI-filled + editable). Non-math.
// Stays a slim "add" bar when empty; doesn't affect any formula.
function AreaInsights({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const d = (data && typeof data === "object") ? data : {};
  const has = d.neighborhoodGrade || d.schools || d.safety || d.appreciation || d.demand || (d.pros || []).length || (d.cons || []).length || (d.risks || []).length;
  const [edit, setEdit] = useState(false);
  if (!has && !edit) return <button onClick={() => setEdit(true)} className="no-print" style={{ width: "100%", padding: "9px 12px", borderRadius: 11, border: "1px dashed " + C.border, background: "transparent", color: C.slate, fontSize: 12, fontFamily: "inherit", cursor: "pointer", marginBottom: 11, textAlign: "left" }}>Add area &amp; due-diligence notes <span style={{ color: C.muted }}>— neighborhood, schools, safety, pros/cons (optional; or let Quick-fill AI fill it)</span></button>;
  const set = (k: string, v: any) => onChange({ ...d, [k]: v });
  const setList = (k: string, text: any) => onChange({ ...d, [k]: String(text).split("\n").map(s => s.trim()).filter(Boolean) });
  const gCol = ({ A: C.teal, B: C.blueS, C: C.amber, D: C.red } as Record<string, string>)[String(d.neighborhoodGrade || "").charAt(0)] || C.slate;
  const Badge = ({ label, val, col }: { label: ReactNode; val: any; col?: string }) => val ? <div style={{ textAlign: "center", padding: "6px 10px", borderRadius: 8, background: C.bg, border: "1px solid " + C.border, minWidth: 0 }}>
    <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: col || C.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</div>
  </div> : null;
  const line = (label: ReactNode, val: any) => val ? <div style={{ marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 700, color: C.slate }}>{label}: </span><span style={{ fontSize: 11, color: C.text }}>{val}</span></div> : null;
  const list = (label: ReactNode, items: any[], col: string, mark: ReactNode) => (items && items.length) ? <div style={{ marginTop: 8 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: col, marginBottom: 3 }}>{label}</div>
    {items.map((s, i) => <div key={i} style={{ fontSize: 11, color: C.text, display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: col, flexShrink: 0 }}>{mark}</span><span>{s}</span></div>)}
  </div> : null;
  const inp: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 12, border: "1px solid " + C.border, borderRadius: 7, fontFamily: "inherit", color: C.text, background: C.white, outline: "none" };
  const lbl: CSSProperties = { fontSize: 10, fontWeight: 700, color: C.slate, marginBottom: 3, display: "block" };
  const ta = (_t?: any): CSSProperties => ({ ...inp, resize: "vertical", lineHeight: 1.4 });
  const toggle = <button onClick={() => setEdit(e => !e)} style={{ fontSize: 11, fontWeight: 700, color: C.slate, background: C.bg, border: "1px solid " + C.border, borderRadius: 7, padding: "4px 11px", cursor: "pointer", fontFamily: "inherit" }}>{edit ? "Done" : "Edit"}</button>;
  return <Card title="Area & due-diligence" icon="pin" right={toggle} collapsible defaultOpen storeKey="area">
    <div style={{ fontSize: 10, color: C.muted, marginBottom: 9 }}>Context only — does not affect the math. AI fills it via Quick-fill; edit anything. Verify schools/crime/flood independently.</div>
    {edit ? <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
        <div><label style={lbl}>Neighborhood</label><select value={d.neighborhoodGrade || ""} onChange={e => set("neighborhoodGrade", e.target.value)} style={inp}><option value="">—</option>{["A", "B", "C", "D"].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
        <div><label style={lbl}>Schools /10</label><input value={d.schools || ""} onChange={e => set("schools", num(e.target.value))} inputMode="numeric" placeholder="0" style={inp} /></div>
        <div><label style={lbl}>Safety</label><input value={d.safety || ""} onChange={e => set("safety", e.target.value)} placeholder="low crime" style={inp} /></div>
      </div>
      <div><label style={lbl}>Appreciation outlook</label><input value={d.appreciation || ""} onChange={e => set("appreciation", e.target.value)} placeholder="e.g. high — near BeltLine extension" style={inp} /></div>
      <div><label style={lbl}>Rental demand</label><input value={d.demand || ""} onChange={e => set("demand", e.target.value)} placeholder="e.g. strong; students nearby" style={inp} /></div>
      <div><label style={lbl}>Pros (one per line)</label><textarea rows={2} value={(d.pros || []).join("\n")} onChange={e => setList("pros", e.target.value)} style={ta()} /></div>
      <div><label style={lbl}>Cons (one per line)</label><textarea rows={2} value={(d.cons || []).join("\n")} onChange={e => setList("cons", e.target.value)} style={ta()} /></div>
      <div><label style={lbl}>Risks / red flags (one per line)</label><textarea rows={2} value={(d.risks || []).join("\n")} onChange={e => setList("risks", e.target.value)} style={ta()} /></div>
    </div> : <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, marginBottom: 11 }}>
        <Badge label="Neighborhood" val={d.neighborhoodGrade} col={gCol} />
        <Badge label="Schools" val={d.schools > 0 ? d.schools + "/10" : ""} />
        <Badge label="Safety" val={d.safety} />
      </div>
      {line("Appreciation", d.appreciation)}
      {line("Rental demand", d.demand)}
      {list("Pros", d.pros, C.teal, "✓")}
      {list("Cons", d.cons, C.amber, "•")}
      {list("Risks / red flags", d.risks, C.red, "⚠︎")}
    </div>}
  </Card>;
}

export { AreaInsights };
