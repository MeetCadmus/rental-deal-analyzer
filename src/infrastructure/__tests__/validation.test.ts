import { describe, expect, test } from "vitest";
import { validateAIResult, validateDealImport } from "../validation";

describe("validateAIResult", () => {
  test("accepts a well-formed AI object (numbers or numeric strings)", () => {
    const r = validateAIResult({ address: "1 A St", price: 500000, units: [{ beds: 2, bath: 1, sqft: "900", rent: "1500" }], opinion: "ok" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.address).toBe("1 A St");
      expect(r.data.units?.length).toBe(1);
    }
  });

  test("rejects a non-object", () => {
    expect(validateAIResult([1, 2, 3]).ok).toBe(false);
    expect(validateAIResult("nope").ok).toBe(false);
    expect(validateAIResult(null).ok).toBe(false);
  });

  test("rejects an object with no usable fields", () => {
    const r = validateAIResult({ foo: "bar", random: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/no usable fields/i);
  });

  test("rejects when units is the wrong type", () => {
    const r = validateAIResult({ price: 100, units: "two" });
    expect(r.ok).toBe(false);
  });

  test("a lone opinion still counts as usable", () => {
    expect(validateAIResult({ opinion: "great deal" }).ok).toBe(true);
  });
});

describe("validateDealImport", () => {
  test("accepts an object with recognizable deal fields", () => {
    expect(validateDealImport({ address: "x", price: 1, units: [{ rent: 1000 }] }).ok).toBe(true);
    expect(validateDealImport({ financing: { rate: 6 } }).ok).toBe(true);
  });

  test("rejects an object with no recognizable fields", () => {
    const r = validateDealImport({ key: "value", hello: "world" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/deal export/i);
  });

  test("rejects non-objects and arrays", () => {
    expect(validateDealImport(null).ok).toBe(false);
    expect(validateDealImport([{ address: "x" }]).ok).toBe(false);
  });
});
