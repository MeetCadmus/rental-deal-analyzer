import { useState, useRef, useEffect, type ReactNode } from "react";
import { C } from "../theme/tokens";
import { clamp } from "../../domain/money";
import type { Level } from "../../domain/types";

export function Tog({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          background: checked ? C.navy : C.border,
          transition: "background 0.2s",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 2,
            left: checked ? 16 : 2,
            transition: "left 0.2s",
          }}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.slate }}>{sub}</div>}
      </div>
    </label>
  );
}

export function Pill({ text, lvl }: { text: ReactNode; lvl?: Level | "n" }) {
  const m: Record<string, [string, string]> = {
    good: ["#DFF2EC", "#14705A"],
    warn: ["#FDF3E3", "#8C5A0A"],
    bad: ["#FCEAEC", "#9B2335"],
    n: ["#F7F8FA", "#4A5568"],
  };
  const [bg, fg] = m[lvl || "n"] || m.n;
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: bg, color: fg, fontWeight: 700, whiteSpace: "nowrap" }}>{text}</span>;
}

export function Bar({ val, max, good, warn, inv = false }: { val: number; max: number; good: number; warn: number; inv?: boolean }) {
  const pct = clamp((val / (max || 1)) * 100, 0, 100);
  const col = !inv ? (val >= good ? C.teal : val >= warn ? C.gold : C.red) : val <= warn ? C.teal : val <= good ? C.gold : C.red;
  return (
    <div style={{ height: 4, background: C.grid, borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: pct + "%", height: "100%", background: col, transition: "width 0.4s" }} />
    </div>
  );
}

interface Pos {
  left: number;
  top: number;
  W: number;
  arrow: number;
  below: boolean;
}
export function Info({ lines, tint }: { lines: string[]; tint?: string }) {
  const [s, setS] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const show = () => {
    const el = ref.current;
    if (!el) return;
    try {
      const r = el.getBoundingClientRect(),
        vw = window.innerWidth,
        W = Math.min(240, vw - 16);
      let left = r.left + r.width / 2 - W / 2;
      left = Math.max(8, Math.min(left, vw - W - 8));
      const arrow = Math.max(12, Math.min(W - 12, r.left + r.width / 2 - left));
      const below = r.top < 150;
      setPos({ left, top: below ? r.bottom + 8 : r.top - 8, W, arrow, below });
    } catch {
      setPos(null);
    }
    setS(true);
  };
  const hide = () => setS(false);
  useEffect(() => {
    if (!s) return;
    const h = () => setS(false);
    document.addEventListener("click", h);
    document.addEventListener("scroll", h, true);
    return () => {
      document.removeEventListener("click", h);
      document.removeEventListener("scroll", h, true);
    };
  }, [s]);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 4 }}>
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label="More info"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => {
          e.stopPropagation();
          if (s) hide();
          else show();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            if (s) hide();
            else show();
          } else if (e.key === "Escape") hide();
        }}
        style={{ cursor: "pointer", color: tint || C.muted, fontSize: 13, fontWeight: 700, userSelect: "none", padding: "0 2px" }}
      >
        ⓘ
      </span>
      {s && pos && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            transform: pos.below ? "none" : "translateY(-100%)",
            width: pos.W,
            background: "#0B1220",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 11,
            zIndex: 1200,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.22)",
            whiteSpace: "normal",
            pointerEvents: "none",
          }}
        >
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                lineHeight: 1.6,
                color: l.startsWith("=") ? "#68D391" : l.startsWith("·") ? "#C2CCDA" : "#fff",
                fontWeight: l.startsWith("=") ? 700 : 400,
              }}
            >
              {l}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              ...(pos.below ? { top: -6 } : { bottom: -6 }),
              left: pos.arrow,
              transform: "translateX(-50%)",
              width: 11,
              height: 11,
              background: "#0B1220",
              ...(pos.below
                ? { borderLeft: "1px solid rgba(255,255,255,0.22)", borderTop: "1px solid rgba(255,255,255,0.22)", clipPath: "polygon(0 100%,100% 100%,50% 0)" }
                : {
                    borderRight: "1px solid rgba(255,255,255,0.22)",
                    borderBottom: "1px solid rgba(255,255,255,0.22)",
                    clipPath: "polygon(0 0,100% 0,50% 100%)",
                  }),
            }}
          />
        </div>
      )}
    </span>
  );
}

export function SmBtn({ active, onClick, label }: { active?: boolean; onClick: () => void; label: ReactNode }) {
  return (
    <button
      className="tap-sm"
      onClick={onClick}
      style={{
        padding: "2px 8px",
        borderRadius: 5,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 10,
        fontWeight: 700,
        border: "1px solid " + (active ? C.navy : C.border),
        background: active ? C.navy : C.white,
        color: active ? "#fff" : C.slate,
      }}
    >
      {label}
    </button>
  );
}

export function SecLabel({ text, right }: { text: ReactNode; right?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        fontWeight: 700,
        color: C.heading,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        borderBottom: "1px solid " + C.border,
        paddingBottom: 4,
        marginBottom: 8,
      }}
    >
      <span>{text}</span>
      {right && <span style={{ fontWeight: 400, color: C.slate, textTransform: "none", fontSize: 11 }}>{right}</span>}
    </div>
  );
}

export function PLRow({
  label,
  value,
  neg,
  pos,
  bold,
  hl,
  indent,
  note,
}: {
  label: ReactNode;
  value: ReactNode;
  neg?: boolean;
  pos?: boolean;
  bold?: boolean;
  hl?: boolean;
  indent?: boolean;
  note?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 8px 5px " + (indent ? "20px" : "8px"),
        background: hl ? "var(--c-hl)" : "transparent",
        borderBottom: "1px solid var(--c-rowline)",
        fontWeight: bold ? 600 : 400,
        fontSize: 12,
      }}
    >
      <span style={{ color: bold ? C.text : C.slate }}>
        {label}
        {note && <span style={{ fontSize: 10, color: C.muted, marginLeft: 5 }}>{note}</span>}
      </span>
      <span style={{ color: neg ? C.red : pos ? C.blueS : C.text, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

export function MBox({
  label,
  value,
  sub,
  lvl,
  bar,
  bMax,
  bGood,
  bWarn,
  bInv,
  tip,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  lvl?: Level;
  bar?: number;
  bMax?: number;
  bGood?: number;
  bWarn?: number;
  bInv?: boolean;
  tip?: string[];
}) {
  const col = ({ good: C.teal, warn: C.amber, bad: C.red } as Record<string, string>)[lvl || ""] || C.slate;
  return (
    <div style={{ background: C.white, border: "1px solid " + C.border, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 3, display: "flex", alignItems: "center" }}>
        {label}
        {tip && <Info lines={tip} />}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: col, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
      {bar !== undefined && <Bar val={bar} max={bMax!} good={bGood!} warn={bWarn!} inv={bInv} />}
    </div>
  );
}
