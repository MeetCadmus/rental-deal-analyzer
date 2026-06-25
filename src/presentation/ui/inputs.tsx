import { type ReactNode } from "react";
import { C } from "../theme/tokens";
import { fmtGroup } from "../../domain/money";
import { useGrouped } from "./useGrouped";
import { Info } from "./primitives";

export function MoneyInput({
  value,
  onChange,
  label,
  sub,
  small,
  hint,
}: {
  value: number;
  onChange: (n: number) => void;
  label?: ReactNode;
  sub?: ReactNode;
  small?: boolean;
  hint?: ReactNode;
}) {
  const g = useGrouped(value, onChange, false, (v) => (v > 0 ? fmtGroup(v, false) : ""));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {label && <label style={{ fontSize: small ? 10 : 11, color: C.slate, fontWeight: 600 }}>{label}</label>}
      <div style={{ display: "flex", alignItems: "center", border: "1px solid " + C.border, borderRadius: 7, overflow: "hidden", background: C.white }}>
        <span style={{ padding: "6px 7px 6px 9px", fontSize: 11, color: C.slate, background: C.bg, borderRight: "1px solid " + C.border, flexShrink: 0 }}>
          $
        </span>
        <input
          ref={g.ref}
          type="text"
          inputMode="numeric"
          value={g.display}
          placeholder="0"
          onChange={g.onInput}
          onBlur={g.clearBuf}
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: small ? 12 : 13,
            border: "none",
            background: "transparent",
            color: C.text,
            outline: "none",
            minWidth: 0,
          }}
        />
      </div>
      {(sub || hint) && <span style={{ fontSize: 10, color: hint ? "#0F6E56" : C.muted }}>{sub || hint}</span>}
    </div>
  );
}

export function RentInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const g = useGrouped(value, onChange, false, (v) => (v > 0 ? fmtGroup(v, false) : ""));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid " + C.border,
        borderRadius: 7,
        overflow: "hidden",
        background: C.white,
        flex: "1 1 auto",
        minWidth: 0,
      }}
    >
      <span style={{ padding: "6px 6px 6px 9px", fontSize: 12, color: C.slate, background: C.bg, borderRight: "1px solid " + C.border, flexShrink: 0 }}>$</span>
      <input
        ref={g.ref}
        type="text"
        inputMode="numeric"
        value={g.display}
        placeholder="0"
        onChange={g.onInput}
        onBlur={g.clearBuf}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "6px 8px",
          fontSize: 14,
          fontWeight: 600,
          border: "none",
          background: "transparent",
          color: C.heading,
          outline: "none",
        }}
      />
      <span style={{ padding: "6px 8px 6px 2px", fontSize: 11, color: C.slate, flexShrink: 0 }}>/mo</span>
    </div>
  );
}

interface FieldProps {
  label?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  sub?: ReactNode;
  disabled?: boolean;
  xs?: boolean;
  placeholder?: string;
  showZero?: boolean;
  tip?: string[];
}
export function Field({ label, prefix, suffix, value, onChange, min, max, sub, disabled, xs, placeholder, tip }: FieldProps) {
  const g = useGrouped(value, onChange, true, (v) => (v === null || v === undefined || v === 0 ? "" : fmtGroup(v, true)));
  const onBlur = () => {
    g.clearBuf();
    const n = value;
    if (min != null && n < min) onChange(min);
    else if (max != null && n > max) onChange(max);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {label && (
        <label style={{ fontSize: xs ? 10 : 11, color: C.slate, fontWeight: 600, display: "flex", alignItems: "center" }}>
          {label}
          {tip && <Info lines={tip} />}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid " + (disabled ? "#e8e8e8" : C.border),
          borderRadius: 7,
          overflow: "hidden",
          background: disabled ? "#F4F4F4" : C.white,
        }}
      >
        {prefix && (
          <span style={{ padding: "6px 7px 6px 9px", fontSize: 11, color: C.slate, background: C.bg, borderRight: "1px solid " + C.border, flexShrink: 0 }}>
            {prefix}
          </span>
        )}
        <input
          ref={g.ref}
          type="text"
          inputMode="decimal"
          value={g.display}
          disabled={!!disabled}
          placeholder={placeholder || "0"}
          onChange={g.onInput}
          onBlur={onBlur}
          style={{
            flex: 1,
            padding: "6px 8px",
            fontSize: xs ? 12 : 13,
            border: "none",
            background: "transparent",
            color: C.text,
            outline: "none",
            minWidth: 0,
          }}
        />
        {suffix && <span style={{ padding: "6px 8px 6px 4px", fontSize: 11, color: C.slate, flexShrink: 0 }}>{suffix}</span>}
      </div>
      {sub && <span style={{ fontSize: 10, color: C.muted }}>{sub}</span>}
    </div>
  );
}
