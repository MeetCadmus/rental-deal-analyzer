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
export function overallRiskLabel(insights: unknown): string {
  const d = (insights && typeof insights === "object" ? insights : {}) as Record<string, any>;
  const c = (d.climate && typeof d.climate === "object" ? d.climate : {}) as Record<string, any>;
  const g = String(d.neighborhoodGrade || "")
    .charAt(0)
    .toUpperCase();
  const risksN = Array.isArray(d.risks) ? d.risks.length : 0;
  const levels = [c.floodZone, c.storms, c.wildfire, c.heat].map(hazLevel).filter((l) => l >= 0);
  if (!(g === "C" || g === "D" || risksN > 0 || levels.length)) return "";
  const highs = levels.filter((l) => l === 2).length;
  const mods = levels.filter((l) => l === 1).length;
  const score = (g === "D" ? 3 : g === "C" ? 1 : 0) + highs * 2 + mods + (risksN >= 3 ? 2 : risksN >= 1 ? 1 : 0);
  return (score >= 4 ? "High" : score >= 2 ? "Moderate" : "Low") + " risk";
}
