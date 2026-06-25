import { useState, type ReactNode } from "react";
import { C } from "../theme/tokens";
import { Icon } from "./Icon";
import { loadCardState, saveCardState } from "../../infrastructure/storage/preferences";
import s from "./Card.module.css";

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
    <div className={s.card}>
      <div
        {...(collapsible
          ? {
              role: "button",
              tabIndex: 0,
              "aria-expanded": isOpen,
              onClick: toggle,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              },
            }
          : {})}
        className={`${s.head}${isOpen ? " " + s.headOpen : ""}${collapsible ? " " + s.clickable : ""}`}
      >
        {icon && <Icon name={icon} size={15} style={{ color: C.gold }} />}
        <span className={s.title}>{title}</span>
        {summary != null && (
          <span className={s.summary} style={{ marginLeft: "auto" }}>
            {summary}
          </span>
        )}
        {right && (
          <div onClick={collapsible ? (e) => e.stopPropagation() : undefined} style={{ marginLeft: summary != null ? 10 : "auto" }}>
            {right}
          </div>
        )}
        {collapsible && (
          <span className={`${s.chev}${isOpen ? " " + s.chevOpen : ""}`} style={{ marginLeft: summary != null || right ? 10 : "auto" }}>
            ▾
          </span>
        )}
      </div>
      {isOpen && <div className={s.body}>{children}</div>}
    </div>
  );
}
