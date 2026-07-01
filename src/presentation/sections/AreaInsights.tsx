import { useState } from "react";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { num } from "../../domain/money";
import s from "./sections.module.css";

// ── Area & due-diligence: qualitative context (AI-filled + editable). Non-math.
// Stays a slim "add" bar when empty; doesn't affect any formula. Editable inline
// (no edit/view toggle) and, like every other section, shows a summary when collapsed.
function AreaInsights({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const d = data && typeof data === "object" ? data : {};
  const has =
    d.neighborhoodGrade || d.schools || d.safety || d.appreciation || d.demand || (d.pros || []).length || (d.cons || []).length || (d.risks || []).length;
  const [reveal, setReveal] = useState(false);
  if (!has && !reveal)
    return (
      <button onClick={() => setReveal(true)} className={`no-print ${s.addNotesBtn}`}>
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
  // Collapsed summary (like Closing costs / Expenses): a compact at-a-glance recap.
  const summaryParts = [
    d.neighborhoodGrade ? "Grade " + d.neighborhoodGrade : "",
    d.schools > 0 ? d.schools + "/10 schools" : "",
    (d.pros || []).length ? (d.pros || []).length + " pros" : "",
    (d.risks || []).length ? (d.risks || []).length + " risks" : "",
  ].filter(Boolean);
  const summary = summaryParts.length ? summaryParts.join(" · ") : "Not filled";
  return (
    <Card title="Area & due-diligence" icon="pin" summary={summary} collapsible defaultOpen storeKey="area">
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 9 }}>
        Context only — does not affect the math. AI fills it via Quick-fill; edit anything. Verify schools/crime/flood independently.
      </div>
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
    </Card>
  );
}

export { AreaInsights };
