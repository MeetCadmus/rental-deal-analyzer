import { useState } from "react";
import { C } from "../theme/tokens";
import { fmtD } from "../../domain/money";
import type { YearRow } from "../../domain/types";

const _pol = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
function _donutArc(cx: number, cy: number, R: number, r: number, a1: number, a2: number) {
  const large = a2 - a1 > Math.PI ? 1 : 0;
  const [x1, y1] = _pol(cx, cy, R, a1),
    [x2, y2] = _pol(cx, cy, R, a2);
  const [x3, y3] = _pol(cx, cy, r, a2),
    [x4, y4] = _pol(cx, cy, r, a1);
  return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
}
export function ChartBox({ title, children, note }: { title: React.ReactNode; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid " + C.border, borderRadius: 11, overflow: "hidden", marginBottom: 11 }}>
      <div style={{ padding: "7px 12px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.heading, borderBottom: "1px solid " + C.border }}>
        {title}
      </div>
      <div style={{ padding: "12px 13px", background: C.white }}>
        {children}
        {note && <div style={{ fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{note}</div>}
      </div>
    </div>
  );
}
// Cumulative cash position (starts at −cash in) → shows years-to-payback
export function CashflowChart({ yearly, cashIn }: { yearly: YearRow[]; cashIn: number }) {
  const [hi, setHi] = useState<number | null>(null);
  const W = 540,
    H = 170,
    pad = { l: 52, r: 18, t: 12, b: 24 };
  const pts = [{ x: 0, y: -cashIn }, ...yearly.map((r) => ({ x: r.year, y: -cashIn + r.cumCF }))];
  const ys = pts.map((p) => p.y),
    minY = Math.min(0, ...ys),
    maxY = Math.max(0, ...ys),
    spanY = maxY - minY || 1;
  const px = (i: number) => pad.l + (pts.length <= 1 ? 0 : (i / (pts.length - 1)) * (W - pad.l - pad.r));
  const py = (v: number) => pad.t + (1 - (v - minY) / spanY) * (H - pad.t - pad.b);
  const line = pts.map((p, i) => (i ? "L" : "M") + px(i).toFixed(1) + " " + py(p.y).toFixed(1)).join(" ");
  const area = line + ` L${px(pts.length - 1).toFixed(1)} ${py(minY).toFixed(1)} L${px(0).toFixed(1)} ${py(minY).toFixed(1)} Z`;
  const zeroY = py(0);
  // payback year (first crossing >= 0)
  let payback: string | null = null;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i - 1].y < 0 && pts[i].y >= 0) {
      const t = (0 - pts[i - 1].y) / (pts[i].y - pts[i - 1].y);
      payback = (pts[i - 1].x + t).toFixed(1);
      break;
    }
  }
  const ticks = [maxY, minY + spanY / 2, minY].filter((v, i, a) => a.indexOf(v) === i);
  // thin out markers/labels as the hold period grows so 30yr stays legible
  const yrs = yearly.length,
    step = yrs <= 10 ? 1 : yrs <= 20 ? 2 : 5;
  const showAt = (i: number) => i === 0 || i === pts.length - 1 || pts[i].x % step === 0;
  return (
    <ChartBox
      title="Cumulative cash position"
      note={
        payback
          ? `Crosses break-even at ~year ${payback} (cumulative cash flow recovers your ${fmtD(cashIn)} invested).`
          : "Does not recover initial investment from cash flow alone within the hold period — most of the return is at sale."
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} onMouseLeave={() => setHi(null)}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} y1={py(v)} x2={W - pad.r} y2={py(v)} strokeWidth="1" style={{ stroke: "var(--c-grid)" }} />
            <text x={pad.l - 6} y={py(v) + 3} textAnchor="end" style={{ fontSize: 9, fill: C.slate }}>
              {fmtD(v)}
            </text>
          </g>
        ))}
        <line x1={pad.l} y1={zeroY} x2={W - pad.r} y2={zeroY} strokeWidth="1" strokeDasharray="3 3" style={{ stroke: C.muted }} />
        <path d={area} style={{ fill: C.teal, opacity: 0.1 }} />
        <path d={line} fill="none" strokeWidth="2.5" strokeLinejoin="round" style={{ stroke: C.teal }} />
        {pts.map((p, i) => (showAt(i) ? <circle key={i} cx={px(i)} cy={py(p.y)} r="3" style={{ fill: p.y >= 0 ? C.teal : C.red }} /> : null))}
        {pts.map((p, i) =>
          showAt(i) ? (
            <text key={i} x={px(i)} y={H - 8} textAnchor="middle" style={{ fontSize: 9, fill: C.slate }}>
              {p.x === 0 ? "Now" : "Y" + p.x}
            </text>
          ) : null,
        )}
        {pts.map((p, i) => {
          const w = (W - pad.l - pad.r) / Math.max(1, pts.length - 1);
          return (
            <rect
              key={"h" + i}
              x={px(i) - w / 2}
              y={pad.t}
              width={w}
              height={H - pad.t - pad.b}
              fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHi(i)}
              onMouseMove={() => setHi(i)}
              onClick={() => setHi(i)}
            />
          );
        })}
        {hi != null &&
          (() => {
            const p = pts[hi],
              tx = Math.min(Math.max(px(hi) - 48, 2), W - 98);
            return (
              <g pointerEvents="none">
                <line x1={px(hi)} y1={pad.t} x2={px(hi)} y2={H - pad.b} strokeWidth="1" strokeDasharray="3 3" style={{ stroke: C.slate }} opacity="0.5" />
                <circle cx={px(hi)} cy={py(p.y)} r="4.5" strokeWidth="1.5" style={{ fill: p.y >= 0 ? C.teal : C.red, stroke: "#fff" }} />
                <rect x={tx} y={6} width="96" height="32" rx="6" opacity="0.96" style={{ fill: C.navy }} />
                <text x={tx + 8} y={19} style={{ fontSize: 9, fill: "#fff", opacity: 0.7 }}>
                  {p.x === 0 ? "Today (cash in)" : "Year " + p.x}
                </text>
                <text x={tx + 8} y={32} style={{ fontSize: 11, fontWeight: 700, fill: "#fff" }}>
                  {fmtD(p.y)}
                </text>
              </g>
            );
          })()}
      </svg>
    </ChartBox>
  );
}
// Equity vs loan balance, stacked per year
export function EquityChart({ yearly, loan }: { yearly: YearRow[]; loan: number }) {
  const [hi, setHi] = useState<number | null>(null);
  const W = 540,
    H = 180,
    pad = { l: 52, r: 14, t: 12, b: 24 };
  const maxV = Math.max(...yearly.map((r) => r.propVal), loan) || 1;
  const n = yearly.length,
    gap = n > 20 ? 2 : n > 12 ? 3 : n > 6 ? 6 : 10;
  const bw = Math.max(2, (W - pad.l - pad.r - gap * (n - 1)) / n),
    rx = bw < 5 ? 1 : 2;
  const py = (v: number) => pad.t + (1 - v / maxV) * (H - pad.t - pad.b);
  const x = (i: number) => pad.l + i * (bw + gap);
  const ticks = [maxV, maxV / 2, 0];
  const step = n <= 10 ? 1 : n <= 20 ? 2 : 5;
  const showLbl = (r: YearRow, i: number) => i === n - 1 || r.year % step === 0;
  return (
    <ChartBox
      title="Equity vs. loan balance"
      note="Each bar = property value, split into your equity (gold) and remaining loan balance (navy). Equity grows from appreciation + principal paydown."
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} onMouseLeave={() => setHi(null)}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} y1={py(v)} x2={W - pad.r} y2={py(v)} strokeWidth="1" style={{ stroke: "var(--c-grid)" }} />
            <text x={pad.l - 6} y={py(v) + 3} textAnchor="end" style={{ fontSize: 9, fill: C.slate }}>
              {fmtD(v)}
            </text>
          </g>
        ))}
        {yearly.map((r, i) => {
          const eqTop = py(r.propVal),
            balTop = py(r.balance),
            base = py(0);
          return (
            <g key={i}>
              <rect
                x={x(i)}
                y={balTop}
                width={bw}
                height={Math.max(0, base - balTop)}
                rx={rx}
                style={{ fill: C.navy, opacity: hi == null || hi === i ? 1 : 0.5 }}
              />
              <rect
                x={x(i)}
                y={eqTop}
                width={bw}
                height={Math.max(0, balTop - eqTop)}
                rx={rx}
                style={{ fill: C.gold, opacity: hi == null || hi === i ? 1 : 0.5 }}
              />
              {showLbl(r, i) && (
                <text x={x(i) + bw / 2} y={H - 8} textAnchor="middle" style={{ fontSize: 9, fill: C.slate }}>
                  {"Y" + r.year}
                </text>
              )}
            </g>
          );
        })}
        {yearly.map((r, i) => (
          <rect
            key={"h" + i}
            x={x(i) - gap / 2}
            y={pad.t}
            width={bw + gap}
            height={H - pad.t - pad.b}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHi(i)}
            onMouseMove={() => setHi(i)}
            onClick={() => setHi(i)}
          />
        ))}
        {hi != null &&
          (() => {
            const r = yearly[hi],
              tx = Math.min(Math.max(x(hi) + bw / 2 - 60, 2), W - 122);
            return (
              <g pointerEvents="none">
                <rect x={tx} y={6} width="120" height="50" rx="6" opacity="0.96" style={{ fill: C.navy }} />
                <text x={tx + 8} y={19} style={{ fontSize: 9, fill: "#fff", opacity: 0.7 }}>
                  Year {r.year} · value {fmtD(r.propVal)}
                </text>
                <text x={tx + 8} y={33} style={{ fontSize: 10, fontWeight: 700, fill: C.gold }}>
                  Equity {fmtD(r.equity)}
                </text>
                <text x={tx + 8} y={47} style={{ fontSize: 10, fontWeight: 700, fill: "rgba(255,255,255,0.82)" }}>
                  Loan {fmtD(r.balance)}
                </text>
              </g>
            );
          })()}
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 10, color: C.slate }}>
        <span>
          <span style={{ display: "inline-block", width: 9, height: 9, background: C.gold, borderRadius: 2, marginRight: 4 }} />
          Equity
        </span>
        <span>
          <span style={{ display: "inline-block", width: 9, height: 9, background: C.navy, borderRadius: 2, marginRight: 4 }} />
          Loan balance
        </span>
      </div>
    </ChartBox>
  );
}
// Return components donut
export function ReturnDonut({ segs }: { segs: { label: string; value: number; color: string }[] }) {
  const pos = segs.filter((s) => s.value > 0),
    tot = pos.reduce((s, x) => s + x.value, 0) || 1;
  let a = -Math.PI / 2;
  const arcs = pos.map((s) => {
    const a2 = a + (s.value / tot) * 2 * Math.PI;
    const path = _donutArc(64, 64, 58, 38, a, a2);
    a = a2;
    return { path, color: s.color, label: s.label, value: s.value };
  });
  const grand = segs.reduce((s, x) => s + x.value, 0);
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox="0 0 128 128" style={{ width: 128, height: 128, flexShrink: 0 }}>
        {arcs.map((a2, i) => (
          <path key={i} d={a2.path} style={{ fill: a2.color }} />
        ))}
        <text x="64" y="60" textAnchor="middle" style={{ fontSize: 10, fill: C.muted }}>
          Total
        </text>
        <text x="64" y="76" textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: C.text }}>
          {fmtD(grand)}
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 160 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.slate }}>
              <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, opacity: s.value > 0 ? 1 : 0.3 }} />
              {s.label}
            </span>
            <span style={{ fontWeight: 700, color: s.value >= 0 ? C.text : C.red, fontVariantNumeric: "tabular-nums" }}>{fmtD(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
