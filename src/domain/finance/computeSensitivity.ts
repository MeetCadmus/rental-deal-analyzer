import { computeBase } from "./computeBase";
import type { Deal, BaseMetrics } from "../types";

export interface SensitivityCell {
  label: string;
  cf: number;
  capRate: number;
}
export interface PriceRow {
  label: string;
  price: number;
  cells: SensitivityCell[];
}
export interface RentCell {
  delta: number;
  cf: number;
  capRate: number;
}
export interface Sensitivity {
  priceRate: PriceRow[];
  rentCells: RentCell[];
}

// Price×rate grid + rent-delta sensitivity. Pure (re-runs computeBase on variants).
export function computeSensitivity(state: Deal, _R: BaseMetrics): Sensitivity {
  const pVars = [-0.1, -0.05, 0, +0.05, +0.1];
  const rVars = [-1.0, -0.5, 0, +0.5, +1.0];
  return {
    priceRate: pVars.map((pv) => {
      const np = Math.round((state.price || 0) * (1 + pv));
      return {
        label: pv === 0 ? "Current" : (pv > 0 ? "+" : "") + Math.round(pv * 100) + "%",
        price: np,
        cells: rVars.map((rv) => {
          const nr = Math.max(1, (state.financing.rate ?? 7.25) + rv);
          const ns = { ...state, price: np, financing: { ...state.financing, rate: nr } };
          const rb = computeBase(ns);
          return { label: rv === 0 ? "Current" : (rv > 0 ? "+" : "") + rv.toFixed(1) + "%", cf: rb.cf, capRate: rb.capRate };
        }),
      };
    }),
    rentCells: [-300, -200, -100, 0, 100, 200, 300].map((d) => {
      const nu = state.units.map((u) => ({ ...u, rent: Math.max(0, u.rent + d) }));
      const rb = computeBase({ ...state, units: nu });
      return { delta: d, cf: rb.cf, capRate: rb.capRate };
    }),
  };
}
