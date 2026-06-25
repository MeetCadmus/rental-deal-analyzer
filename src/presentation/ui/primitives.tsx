import { useState, useRef, useEffect, useId, type ReactNode } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { C } from "../theme/tokens";
import { clamp } from "../../domain/money";
import type { Level } from "../../domain/types";
import s from "./primitives.module.css";

// Accessible toggle: Radix Switch (role="switch", keyboard, aria-checked) styled to
// match the original pill. Visuals are driven by the controlled `checked` prop.
export function Tog({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode }) {
  const id = useId();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          background: checked ? C.navy : C.border,
          transition: "background 0.2s",
          position: "relative",
          flexShrink: 0,
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <SwitchPrimitive.Thumb
          style={{
            display: "block",
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
      </SwitchPrimitive.Root>
      <label htmlFor={id} style={{ cursor: "pointer" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.slate }}>{sub}</div>}
      </label>
    </div>
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
  return (
    <span className={s.pill} style={{ background: bg, color: fg }}>
      {text}
    </span>
  );
}

export function Bar({ val, max, good, warn, inv = false }: { val: number; max: number; good: number; warn: number; inv?: boolean }) {
  const pct = clamp((val / (max || 1)) * 100, 0, 100);
  const col = !inv ? (val >= good ? C.teal : val >= warn ? C.gold : C.red) : val <= warn ? C.teal : val <= good ? C.gold : C.red;
  return (
    <div className={s.barTrack}>
      <div className={s.barFill} style={{ width: pct + "%", background: col }} />
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
  const [open, setOpen] = useState(false);
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
    setOpen(true);
  };
  const hide = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    document.addEventListener("click", h);
    document.addEventListener("scroll", h, true);
    return () => {
      document.removeEventListener("click", h);
      document.removeEventListener("scroll", h, true);
    };
  }, [open]);
  return (
    <span className={s.infoWrap}>
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label="More info"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => {
          e.stopPropagation();
          if (open) hide();
          else show();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            if (open) hide();
            else show();
          } else if (e.key === "Escape") hide();
        }}
        className={s.infoTrigger}
        style={{ color: tint || C.muted }}
      >
        ⓘ
      </span>
      {open && pos && (
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
    <button className={`tap-sm ${s.smbtn}${active ? " " + s.smbtnActive : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

export function SecLabel({ text, right }: { text: ReactNode; right?: ReactNode }) {
  return (
    <div className={s.secLabel}>
      <span>{text}</span>
      {right && <span className={s.secLabelRight}>{right}</span>}
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
    <div className={`${s.plRow}${indent ? " " + s.plRowIndent : ""}${hl ? " " + s.plRowHl : ""}${bold ? " " + s.plRowBold : ""}`}>
      <span style={{ color: bold ? C.text : C.slate }}>
        {label}
        {note && <span className={s.plNote}>{note}</span>}
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
    <div className={s.mbox}>
      <div className={s.mboxLabel}>
        {label}
        {tip && <Info lines={tip} />}
      </div>
      <div className={s.mboxValue} style={{ color: col }}>
        {value}
      </div>
      {sub && <div className={s.mboxSub}>{sub}</div>}
      {bar !== undefined && <Bar val={bar} max={bMax!} good={bGood!} warn={bWarn!} inv={bInv} />}
    </div>
  );
}
