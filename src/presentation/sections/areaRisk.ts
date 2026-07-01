// Roll up the Area & due-diligence hazard ratings into ONE overall risk level for the
// collapsed summary. Pure & testable. Only reads the dedicated hazard fields (flood /
// storms / wildfire / heat) — never free-text like `safety` (so "high walkability" can't
// be mistaken for risk). Each hazard is expected to lead with a rating word.

// leading/first rating word → 0 low · 1 moderate · 2 high · −1 unknown
export function hazLevel(t: unknown): number {
  if (typeof t !== "string") return -1;
  const m = /(minimal|none|\blow\b|moderate|\bhigh\b|severe|extreme)/i.exec(t);
  if (!m) return -1;
  const w = m[1].toLowerCase();
  return w === "moderate" ? 1 : w === "high" || w === "severe" || w === "extreme" ? 2 : 0;
}

// "" when there's no basis to judge; otherwise "Low risk" | "Moderate risk" | "High risk".
// Driven by the SERIOUS physical hazards only — flood / wildfire / storms — plus a bump for
// a weak neighborhood (grade C/D). Deliberately ignores heat-island and the qualitative
// red-flag/cons lists: those are near-constant for typical deals (almost every urban
// property is "high heat", every deal lists a few DD caveats) so scoring them just inflates
// everything. They remain visible in the expanded detail.
export function overallRiskLabel(insights: unknown): string {
  const d = (insights && typeof insights === "object" ? insights : {}) as Record<string, any>;
  const c = (d.climate && typeof d.climate === "object" ? d.climate : {}) as Record<string, any>;
  const g = String(d.neighborhoodGrade || "")
    .charAt(0)
    .toUpperCase();
  const serious = [c.floodZone, c.wildfire, c.storms].map(hazLevel).filter((l) => l >= 0);
  if (!(serious.length || g === "C" || g === "D")) return "";
  let lvl = serious.length ? Math.max(...serious) : 0; // 0 low · 1 moderate · 2 high
  if (g === "D") lvl = Math.min(2, lvl + 1);
  else if (g === "C") lvl = Math.max(lvl, 1);
  return ["Low", "Moderate", "High"][lvl] + " risk";
}
