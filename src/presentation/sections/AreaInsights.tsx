import { useState } from "react";
import type { ReactNode } from "react";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { num } from "../../domain/money";
import s from "./sections.module.css";

// ── Area & due-diligence: qualitative context (AI-filled + editable). Non-math.
// Stays a slim "add" bar when empty; doesn't affect any formula.
function AreaInsights({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const d = data && typeof data === "object" ? data : {};
  const has =
    d.neighborhoodGrade || d.schools || d.safety || d.appreciation || d.demand || (d.pros || []).length || (d.cons || []).length || (d.risks || []).length;
  const [edit, setEdit] = useState(false);
  if (!has && !edit)
    return (
      <button onClick={() => setEdit(true)} className={`no-print ${s.addNotesBtn}`}>
        Add area &amp; due-diligence notes{" "}
        <span style={{ color: C.muted }}>— neighborhood, schools, safety, pros/cons (optional; or let Quick-fill AI fill it)</span>
      </button>
    );
  const set = (k: string, v: any) => onChange({ ...d, [k]: v });
  const setList = (k: string, text: any) =>
    onChange({
      ...d,
      [k]: String(text)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  const gCol = ({ A: C.teal, B: C.blueS, C: C.amber, D: C.red } as Record<string, string>)[String(d.neighborhoodGrade || "").charAt(0)] || C.slate;
  const Badge = ({ label, val, col }: { label: ReactNode; val: any; col?: string }) =>
    val ? (
      <div className={s.badge}>
        <div className={s.badgeLabel}>{label}</div>
        <div className={s.badgeValue} style={{ color: col || C.heading }}>
          {val}
        </div>
      </div>
    ) : null;
  const line = (label: ReactNode, val: any) =>
    val ? (
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.slate }}>{label}: </span>
        <span style={{ fontSize: 11, color: C.text }}>{val}</span>
      </div>
    ) : null;
  const list = (label: ReactNode, items: any[], col: string, mark: ReactNode) =>
    items && items.length ? (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: col, marginBottom: 3 }}>{label}</div>
        {items.map((s, i) => (
          <div key={i} style={{ fontSize: 11, color: C.text, display: "flex", gap: 6, marginBottom: 2 }}>
            <span style={{ color: col, flexShrink: 0 }}>{mark}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    ) : null;
  const toggle = (
    <button onClick={() => setEdit((e) => !e)} className={s.editBtn}>
      {edit ? "Done" : "Edit"}
    </button>
  );
  return (
    <Card title="Area & due-diligence" icon="pin" right={toggle} collapsible defaultOpen storeKey="area">
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 9 }}>
        Context only — does not affect the math. AI fills it via Quick-fill; edit anything. Verify schools/crime/flood independently.
      </div>
      {edit ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div className={s.grid3}>
            <div>
              <label className={s.aiLbl}>Neighborhood</label>
              <select value={d.neighborhoodGrade || ""} onChange={(e) => set("neighborhoodGrade", e.target.value)} className={s.aiInput}>
                <option value="">—</option>
                {["A", "B", "C", "D"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={s.aiLbl}>Schools /10</label>
              <input value={d.schools || ""} onChange={(e) => set("schools", num(e.target.value))} inputMode="numeric" placeholder="0" className={s.aiInput} />
            </div>
            <div>
              <label className={s.aiLbl}>Safety</label>
              <input value={d.safety || ""} onChange={(e) => set("safety", e.target.value)} placeholder="low crime" className={s.aiInput} />
            </div>
          </div>
          <div>
            <label className={s.aiLbl}>Appreciation outlook</label>
            <input
              value={d.appreciation || ""}
              onChange={(e) => set("appreciation", e.target.value)}
              placeholder="e.g. high — near BeltLine extension"
              className={s.aiInput}
            />
          </div>
          <div>
            <label className={s.aiLbl}>Rental demand</label>
            <input value={d.demand || ""} onChange={(e) => set("demand", e.target.value)} placeholder="e.g. strong; students nearby" className={s.aiInput} />
          </div>
          <div>
            <label className={s.aiLbl}>Pros (one per line)</label>
            <textarea rows={2} value={(d.pros || []).join("\n")} onChange={(e) => setList("pros", e.target.value)} className={s.aiTextarea} />
          </div>
          <div>
            <label className={s.aiLbl}>Cons (one per line)</label>
            <textarea rows={2} value={(d.cons || []).join("\n")} onChange={(e) => setList("cons", e.target.value)} className={s.aiTextarea} />
          </div>
          <div>
            <label className={s.aiLbl}>Risks / red flags (one per line)</label>
            <textarea rows={2} value={(d.risks || []).join("\n")} onChange={(e) => setList("risks", e.target.value)} className={s.aiTextarea} />
          </div>
        </div>
      ) : (
        <div>
          <div className={s.grid3} style={{ gap: 7, marginBottom: 11 }}>
            <Badge label="Neighborhood" val={d.neighborhoodGrade} col={gCol} />
            <Badge label="Schools" val={d.schools > 0 ? d.schools + "/10" : ""} />
            <Badge label="Safety" val={d.safety} />
          </div>
          {line("Appreciation", d.appreciation)}
          {line("Rental demand", d.demand)}
          {list("Pros", d.pros, C.teal, "✓")}
          {list("Cons", d.cons, C.amber, "•")}
          {list("Risks / red flags", d.risks, C.red, "⚠︎")}
        </div>
      )}
    </Card>
  );
}

export { AreaInsights };
