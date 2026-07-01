import type { Projection, Unit } from "../types";

// Value-add ("stabilized market rents"): the target market rent is set PER UNIT so mixed
// unit types work. Resolution for unit i: an explicit per-unit override, else the legacy
// single `vaMarketRentPerUnit` (older deals / examples), else the unit's current rent
// (i.e. no uplift until you raise it).
export function marketRentFor(projection: Projection, unit: Unit, i: number): number {
  const v = projection.vaMarketRents?.[i];
  if (typeof v === "number" && v > 0) return v;
  if (projection.vaMarketRentPerUnit && projection.vaMarketRentPerUnit > 0) return projection.vaMarketRentPerUnit;
  return unit.rent || 0;
}

// Total stabilized monthly rent across all units.
export function vaMonthlyTotal(projection: Projection, units: Unit[]): number {
  return units.reduce((sum, u, i) => sum + marketRentFor(projection, u, i), 0);
}
