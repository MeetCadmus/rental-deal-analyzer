import assert from "node:assert";

// Approximate-equality assertion (ported from the legacy test harness).
export function close(actual: number, expected: number, eps = 1e-6, msg?: string): void {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    (msg ? msg + ": " : "") + "expected " + actual + " ≈ " + expected + " (±" + eps + ")",
  );
}

// Canonical mortgage payment, re-derived independently for cross-checks.
export function pmtOf(loan: number, annualRatePct: number, years: number): number {
  const i = annualRatePct / 100 / 12, n = years * 12;
  return i === 0 ? loan / n : loan * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
}
