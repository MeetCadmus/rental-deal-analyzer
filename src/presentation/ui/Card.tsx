import { useState, type ReactNode } from "react";
import { C } from "../theme/tokens";
import { Icon } from "./Icon";
import { loadCardState, saveCardState } from "../../infrastructure/storage/preferences";

interface CardProps {
  title: ReactNode;
  icon?: string;
  children?: ReactNode;
  right?: ReactNode;
  summary?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  storeKey?: string;
}

// Section card. Header background/radius/accent come from the active skin (CSS vars).
// `summary` = at-a-glance figure (toggles on click); `right` = interactive control.
export function Card({ title, icon, children, right, summary, collapsible, defaultOpen = true, storeKey }: CardProps) {
  const [open, setOpen] = useState<boolean>(() => {
    if (collapsible && storeKey) {
      const m = loadCardState();
      if (storeKey in m) return !!m[storeKey];
    }
    return defaultOpen;
  });
  const isOpen = collapsible ? open : true;
  const toggle = () =>
    setOpen((o) => {
      const n = !o;
      if (storeKey) saveCardState(storeKey, n);
      return n;
    });
  return (
    <div style={{ border: "1px solid " + C.border, borderRadius: "var(--c-rad)", overflow: "hidden", marginBottom: 12, background: C.white }}>
      <div
        onClick={collapsible ? toggle : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "10px 14px",
          background: "var(--c-head)",
          borderBottom: isOpen ? "1px solid " + C.border : "none",
          cursor: collapsible ? "pointer" : "default",
        }}
      >
        {icon && <Icon name={icon} size={15} style={{ color: C.gold }} />}
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-headfg)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</span>
        {summary != null && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11.5,
              fontWeight: 600,
              color: C.gold,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
            }}
          >
            {summary}
          </span>
        )}
        {right && (
          <div onClick={collapsible ? (e) => e.stopPropagation() : undefined} style={{ marginLeft: summary != null ? 10 : "auto" }}>
            {right}
          </div>
        )}
        {collapsible && (
          <span
            style={{
              marginLeft: summary != null || right ? 10 : "auto",
              flexShrink: 0,
              fontSize: 11,
              color: "var(--c-headfg)",
              opacity: 0.7,
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform .2s",
            }}
          >
            ▾
          </span>
        )}
      </div>
      {isOpen && <div style={{ padding: "15px", background: C.white }}>{children}</div>}
    </div>
  );
}
