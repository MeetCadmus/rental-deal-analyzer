import { type CSSProperties, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { C } from "../theme/tokens";

export interface MenuItem {
  label?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  node?: ReactNode;
}

// Overflow "⋯ More" menu — Radix DropdownMenu gives keyboard nav, Escape, outside-click
// dismissal, focus return, and a portal so the header's overflow can't clip it.
export function HeaderMenu({ btnStyle, items }: { btnStyle: CSSProperties; items: (MenuItem | null | false)[] }) {
  const list = items.filter(Boolean) as MenuItem[];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button style={{ ...btnStyle }} title="More actions">
          ⋯ More
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          style={{
            width: 212,
            zIndex: 1201,
            background: C.white,
            border: "1px solid " + C.border,
            borderRadius: 12,
            boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
            padding: 6,
          }}
        >
          {list.map((it, i) =>
            it.node ? (
              // Custom content (e.g. cloud sign-in) — not a roving menu item.
              <div key={i} style={{ padding: "6px 8px", borderTop: i ? "1px solid " + C.grid : "none" }}>
                {it.node}
              </div>
            ) : (
              <DropdownMenu.Item
                key={i}
                onSelect={() => it.onClick?.()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  color: it.danger ? C.red : C.text,
                  outline: "none",
                }}
              >
                {it.label}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
