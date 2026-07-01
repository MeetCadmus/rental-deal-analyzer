import { test, expect } from "vitest";
import { hazLevel, overallRiskLabel } from "../areaRisk";

test("hazLevel reads the leading rating word", () => {
  expect(hazLevel("Minimal — Zone X")).toBe(0);
  expect(hazLevel("Low — urban")).toBe(0);
  expect(hazLevel("Moderate — severe wind")).toBe(1);
  expect(hazLevel("High — urban heat island")).toBe(2);
  expect(hazLevel("~950 ft, inland")).toBe(-1); // no rating word
});

test("overallRiskLabel does NOT count positives in free-text safety ('high walkability')", () => {
  const label = overallRiskLabel({
    neighborhoodGrade: "B",
    safety: "Low crime; high walkability and strong community presence",
    climate: { floodZone: "Minimal — Zone X", storms: "Moderate — severe wind", wildfire: "Low — urban", heat: "High — urban heat island" },
  });
  // only heat is high + storms moderate → Moderate, not High
  expect(label).toBe("Moderate risk");
});

test("overallRiskLabel: multiple high hazards → High", () => {
  const label = overallRiskLabel({
    climate: { floodZone: "High — Zone AE, 100-yr floodplain", storms: "High — hurricane exposure", wildfire: "Low", heat: "Moderate" },
  });
  expect(label).toBe("High risk");
});

test("overallRiskLabel: benign inputs → Low", () => {
  const label = overallRiskLabel({ climate: { floodZone: "Minimal — Zone X", storms: "Low", wildfire: "Low", heat: "Low" } });
  expect(label).toBe("Low risk");
});

test("overallRiskLabel: no basis → empty string", () => {
  expect(overallRiskLabel({ neighborhoodGrade: "A" })).toBe("");
  expect(overallRiskLabel({})).toBe("");
  expect(overallRiskLabel(null)).toBe("");
});

test("overallRiskLabel: many red flags raise the level even without hazards", () => {
  expect(overallRiskLabel({ risks: ["a", "b", "c"] })).toBe("Moderate risk");
});
