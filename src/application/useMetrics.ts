import { useMemo } from "react";
import { computeBase } from "../domain/finance/computeBase";
import { computeYearly } from "../domain/finance/computeYearly";
import { computeSensitivity } from "../domain/finance/computeSensitivity";
import { calcDealScore } from "../domain/finance/scoring";
import { useWorkspace, activeTitle } from "./workspaceStore";

// Derived finance metrics for the working deal. Recomputed only when `state` changes.
export function useMetrics() {
  const state = useWorkspace((s) => s.state);
  const R = useMemo(() => computeBase(state), [state]);
  const Y = useMemo(() => computeYearly(state, R), [state, R]);
  const SEN = useMemo(() => computeSensitivity(state, R), [state, R]);
  const score = useMemo(() => calcDealScore(R, Y), [R, Y]);
  const totalRent = state.units.reduce((s, u) => s + u.rent, 0);
  const numU = state.units.length;
  const title = useWorkspace(activeTitle);
  return { R, Y, SEN, score, totalRent, numU, activeTitle: title };
}
