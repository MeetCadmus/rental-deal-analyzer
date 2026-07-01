import { useState } from "react";
import type { ReactNode } from "react";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { num } from "../../domain/money";
import s from "./sections.module.css";

// ── Area & due-diligence: qualitative context (AI-filled + editable). Non-math.
// Shows a polished read-only view; click any value to edit it inline (blur → back
// to view). No edit/view toggle. Like other cards, shows a summary when collapsed.

type FieldType = "grade" | "schools" | "text" | "list" | "area";
interface F {
  k: string;
  label: string;
  type: FieldType;
  ph?: string; // placeholder
  col?: string; // list accent
  mark?: string; // list bullet
  climate?: boolean; // lives under insights.climate
}

const FIELDS: F[] = [
  { k: "neighborhoodGrade", label: "Neighborhood", type: "grade" },
  { k: "schools", label: "Schools", type: "schools" },
  { k: "safety", label: "Safety", type: "text", ph: "low crime" },
  { k: "appreciation", label: "Appreciation", type: "text", ph: "e.g. high — near BeltLine" },
  { k: "demand", label: "Rental demand", type: "text", ph: "e.g. strong; students nearby" },
  { k: "floodZone", label: "Flood zone", type: "text", ph: "e.g. Zone X (minimal)", climate: true },
  { k: "elevation", label: "Elevation / sea level", type: "text", ph: "e.g. ~1,050 ft, inland", climate: true },
  { k: "storms", label: "Storms", type: "text", ph: "hurricane / tornado exposure", climate: true },
  { k: "wildfire", label: "Wildfire", type: "text", ph: "e.g. low — urban", climate: true },
  { k: "heat", label: "Extreme heat", type: "text", ph: "e.g. rising summers", climate: true },
  { k: "history", label: "Incident history", type: "area", ph: "known flooding, fire, claims…", climate: true },
  { k: "pros", label: "Pros", type: "list", col: C.teal, mark: "✓" },
  { k: "cons", label: "Cons", type: "list", col: C.amber, mark: "•" },
  { k: "risks", label: "Risks / red flags", type: "list", col: C.red, mark: "⚠︎" },
];
const BADGE_KEYS = ["neighborhoodGrade", "schools", "safety"];
const F_BY_K: Record<string, F> = Object.fromEntries(FIELDS.map((f) => [f.k, f]));

function AreaInsights({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const d = data && typeof data === "object" ? data : {};
  const c = d.climate && typeof d.climate === "object" ? d.climate : {};
  const [editing, setEditing] = useState<string | null>(null);
  const [buf, setBuf] = useState(""); // scratch buffer for list textareas (split on blur)
  const [reveal, setReveal] = useState(false);

  const getVal = (f: F) => (f.climate ? c[f.k] : d[f.k]);
  const hasVal = (f: F) => (f.type === "list" ? (getVal(f) || []).length > 0 : f.type === "schools" ? getVal(f) > 0 : !!getVal(f));
  const anyVal = FIELDS.some(hasVal);

  if (!anyVal && !reveal)
    return (
      <button onClick={() => setReveal(true)} className={`no-print ${s.addNotesBtn}`}>
        Add area &amp; due-diligence notes{" "}
        <span style={{ color: C.muted }}>— neighborhood, schools, safety, hazards, pros/cons (optional; or let Quick-fill AI fill it)</span>
      </button>
    );

  const set = (k: string, v: any) => onChange({ ...d, [k]: v });
  const setC = (k: string, v: any) => onChange({ ...d, climate: { ...c, [k]: v } });
  const setVal = (f: F, v: any) => (f.climate ? setC(f.k, v) : set(f.k, v));
  const setList = (f: F, text: string) =>
    setVal(
      f,
      String(text)
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    );

  const startEdit = (f: F) => {
    if (f.type === "list") setBuf((getVal(f) || []).join("\n"));
    setEditing(f.k);
  };
  const stop = () => setEditing(null);
  const keyClose = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      stop();
    }
    if (e.key === "Escape") stop();
  };
  const focusRef = (el: HTMLElement | null) => el?.focus();

  // Keep the collapsed summary short & fixed — a few compact tokens (grade, schools, the
  // flood-zone code only, pros/risks counts), capped so it never overruns the header.
  const summaryParts = [
    d.neighborhoodGrade || "",
    d.schools > 0 ? d.schools + "/10" : "",
    c.floodZone ? String(c.floodZone).split(/[—([]/)[0].trim().slice(0, 10) : "",
    (d.pros || []).length ? (d.pros || []).length + "✓" : "",
    (d.risks || []).length ? (d.risks || []).length + "⚠" : "",
  ].filter(Boolean);
  const summary = summaryParts.length ? summaryParts.slice(0, 4).join(" · ") : "Not filled";
  const gCol = ({ A: C.teal, B: C.blueS, C: C.amber, D: C.red } as Record<string, string>)[String(d.neighborhoodGrade || "").charAt(0)] || C.slate;

  // Wrap a read-only view node so clicking (or Enter/Space) opens its inline editor.
  const wrap = (f: F, node: ReactNode) => (
    <div
      key={f.k}
      role="button"
      tabIndex={0}
      onClick={() => startEdit(f)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startEdit(f);
        }
      }}
      title="Click to edit"
      style={{ cursor: "text" }}
    >
      {node}
    </div>
  );

  const editor = (f: F) => {
    const v = getVal(f);
    if (f.type === "grade")
      return (
        <select
          ref={focusRef}
          value={v || ""}
          onChange={(e) => {
            setVal(f, e.target.value);
            stop();
          }}
          onBlur={stop}
          className={s.aiInput}
        >
          <option value="">—</option>
          {["A", "B", "C", "D"].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      );
    if (f.type === "schools")
      return (
        <input
          ref={focusRef}
          value={v || ""}
          onChange={(e) => setVal(f, num(e.target.value))}
          onBlur={stop}
          onKeyDown={keyClose}
          inputMode="numeric"
          placeholder="0"
          className={s.aiInput}
        />
      );
    if (f.type === "list")
      return (
        <textarea
          ref={focusRef}
          rows={2}
          value={buf}
          onChange={(e) => setBuf(e.target.value)}
          onBlur={() => {
            setList(f, buf);
            stop();
          }}
          placeholder="one per line"
          className={s.aiTextarea}
        />
      );
    if (f.type === "area")
      return (
        <textarea
          ref={focusRef}
          rows={2}
          value={v || ""}
          onChange={(e) => setVal(f, e.target.value)}
          onBlur={stop}
          placeholder={f.ph}
          className={s.aiTextarea}
        />
      );
    return (
      <input
        ref={focusRef}
        value={v || ""}
        onChange={(e) => setVal(f, e.target.value)}
        onBlur={stop}
        onKeyDown={keyClose}
        placeholder={f.ph}
        className={s.aiInput}
      />
    );
  };

  const badgeCell = (k: string) => {
    const f = F_BY_K[k];
    if (editing === k) return <div key={k}>{editor(f)}</div>;
    if (!hasVal(f)) return null;
    const v = getVal(f);
    return wrap(
      f,
      <div className={s.badge}>
        <div className={s.badgeLabel}>{f.label}</div>
        <div className={s.badgeValue} style={{ color: k === "neighborhoodGrade" ? gCol : C.heading }}>
          {f.type === "schools" ? v + "/10" : v}
        </div>
      </div>,
    );
  };

  const lineSlot = (f: F) => {
    if (editing === f.k)
      return (
        <div key={f.k} style={{ marginBottom: 6 }}>
          <div className={s.aiLbl}>{f.label}</div>
          {editor(f)}
        </div>
      );
    if (!hasVal(f)) return null;
    return wrap(
      f,
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.slate }}>{f.label}: </span>
        <span style={{ fontSize: 11, color: C.text }}>{getVal(f)}</span>
      </div>,
    );
  };

  const listSlot = (f: F) => {
    if (editing === f.k)
      return (
        <div key={f.k} style={{ marginTop: 8 }}>
          <div className={s.aiLbl}>{f.label} (one per line)</div>
          {editor(f)}
        </div>
      );
    if (!hasVal(f)) return null;
    const items = getVal(f) as string[];
    return wrap(
      f,
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: f.col, marginBottom: 3 }}>{f.label}</div>
        {items.map((t, i) => (
          <div key={i} style={{ fontSize: 11, color: C.text, display: "flex", gap: 6, marginBottom: 2 }}>
            <span style={{ color: f.col, flexShrink: 0 }}>{f.mark}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>,
    );
  };

  const CLIMATE = FIELDS.filter((f) => f.climate);
  const badgeActive = BADGE_KEYS.some((k) => hasVal(F_BY_K[k]) || editing === k);
  const climateActive = CLIMATE.some((f) => hasVal(f) || editing === f.k);
  const empties = FIELDS.filter((f) => !hasVal(f) && editing !== f.k);

  return (
    <Card title="Area & due-diligence" icon="pin" summary={summary} collapsible defaultOpen storeKey="area">
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 9 }}>
        Context only — does not affect the math. AI fills it via Quick-fill; click any value to edit. Verify schools/crime/flood independently.
      </div>
      {badgeActive && (
        <div className={s.grid3} style={{ gap: 7, marginBottom: 11 }}>
          {BADGE_KEYS.map(badgeCell)}
        </div>
      )}
      {lineSlot(F_BY_K.appreciation)}
      {lineSlot(F_BY_K.demand)}
      {climateActive && (
        <div style={{ marginTop: 8 }}>
          <div className={s.aiLbl} style={{ marginBottom: 4 }}>
            Climate &amp; hazard risk
          </div>
          {CLIMATE.map(lineSlot)}
        </div>
      )}
      {listSlot(F_BY_K.pros)}
      {listSlot(F_BY_K.cons)}
      {listSlot(F_BY_K.risks)}
      {empties.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {empties.map((f) => (
            <button key={f.k} onClick={() => startEdit(f)} className={`no-print ${s.addChip}`}>
              + {f.label}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

export { AreaInsights };
