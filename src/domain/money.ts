// Pure number/format helpers (no React/DOM).
import type { Level } from "./types";

export const fmt = (n: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n || 0);
export const fmtD = (n: number): string =>
  (n < 0 ? "−$" : "$") + fmt(Math.abs(Math.round(n || 0)));
export const fmtP = (n: number, d = 1): string => (isFinite(n) ? n.toFixed(d) + "%" : "—");
export const fmtX = (n: number): string => (isFinite(n) ? n.toFixed(1) + "×" : "—");
export const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));
export const num = (v: unknown): number => parseFloat((v + "").replace(/,/g, "")) || 0;

// 3-way threshold classifier. inv=true means lower is better.
export function lv(v: number, g: number, w: number, inv = false): Level {
  return !inv ? (v >= g ? "good" : v >= w ? "warn" : "bad") : (v <= w ? "good" : v <= g ? "warn" : "bad");
}

// Live thousands-grouping for number inputs, tolerant of partial typing ("", "1,", "7.").
export function fmtGroup(raw: string | number | null | undefined, decimals: boolean): string {
  if (raw === null || raw === undefined) return "";
  let s = String(raw);
  const neg = /^\s*-/.test(s);
  s = s.replace(decimals ? /[^0-9.]/g : /[^0-9]/g, "");
  let intp = s;
  let dec: string | null = null;
  if (decimals) { const i = s.indexOf("."); if (i >= 0) { intp = s.slice(0, i); dec = s.slice(i + 1).replace(/\./g, ""); } }
  intp = intp.replace(/^0+(?=\d)/, "");
  const g = intp === "" ? "" : Number(intp).toLocaleString("en-US");
  let out = g;
  // While editing, keep a bare ".5" as ".5" — don't inject a leading "0" (it dropped the
  // caret in front of the synthetic 0 → pasting produced "60.5"). Normalizes onBlur.
  if (dec !== null) out = g + "." + dec;
  return out === "" ? (neg ? "-" : "") : (neg ? "-" + out : out);
}

const SIG = /[0-9.\-]/;
// Pure editing step: given raw input value + caret, return grouped display, caret kept
// relative to significant chars, and the numeric value.
export function editNumber(raw: string, sel: number, decimals: boolean): { display: string; caret: number; value: number } {
  const leftSig = (String(raw).slice(0, sel).match(/[0-9.\-]/g) || []).length;
  const display = fmtGroup(raw, decimals);
  let pos = 0, seen = 0;
  while (pos < display.length && seen < leftSig) { if (SIG.test(display[pos])) seen++; pos++; }
  return { display, caret: pos, value: num(display) };
}
