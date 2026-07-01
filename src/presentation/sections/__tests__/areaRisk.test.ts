import { test, expect } from "vitest";
import { hazLevel, overallRiskLabel } from "../areaRisk";

test("hazLevel reads the leading rating word", () => {
  expect(hazLevel("Minimal — Zone X")).toBe(0);
  expect(hazLevel("Low — urban")).toBe(0);
  expect(hazLevel("Moderate — severe wind")).toBe(1);
  expect(hazLevel("High — urban heat island")).toBe(2);
  expect(hazLevel("~950 ft, inland")).toBe(-1); // no rating word
});

test("overallRiskLabel: an A deal with minor hazards is not High (heat-island & red flags don't inflate)", () => {
  // The real-world case: A grade, minimal flood, low wildfire, moderate storms, HIGH heat,
  // and several routine DD red flags → driven by storms (moderate) → Moderate, never High.
  const label = overallRiskLabel({
    neighborhoodGrade: "A",
    safety: "Low crime; high walkability and strong community presence",
    climate: { floodZone: "Zone X — minimal", storms: "Moderate severe-wind exposure", wildfire: "Low — urban", heat: "High urban heat island" },
    risks: ["deferred maintenance", "historic restrictions", "system age unknown"],
  });
  expect(label).toBe("Moderate risk");
});

test("overallRiskLabel: heat-island alone never drives the level (informational)", () => {
  expect(overallRiskLabel({ climate: { heat: "High — urban heat island" } })).toBe("");
});

test("overallRiskLabel: a serious hazard drives it High", () => {
  expect(overallRiskLabel({ climate: { floodZone: "High — Zone AE, 100-yr floodplain", storms: "Low", wildfire: "Low" } })).toBe("High risk");
});

test("overallRiskLabel: benign serious hazards → Low", () => {
  expect(overallRiskLabel({ climate: { floodZone: "Minimal — Zone X", storms: "Low", wildfire: "Low" } })).toBe("Low risk");
});

test("overallRiskLabel: weak neighborhood bumps the level", () => {
  expect(overallRiskLabel({ neighborhoodGrade: "D", climate: { floodZone: "Low", storms: "Low", wildfire: "Low" } })).toBe("Moderate risk");
  expect(overallRiskLabel({ neighborhoodGrade: "D", climate: { storms: "High" } })).toBe("High risk");
});

test("overallRiskLabel: no basis (no hazards, strong grade) → empty string", () => {
  expect(overallRiskLabel({ neighborhoodGrade: "A" })).toBe("");
  expect(overallRiskLabel({ risks: ["a", "b", "c"] })).toBe(""); // red flags alone don't set a level
  expect(overallRiskLabel({})).toBe("");
  expect(overallRiskLabel(null)).toBe("");
});
