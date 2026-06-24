import { useState, useRef, type CSSProperties, type ReactNode } from "react";
import { C } from "../theme/tokens";

export interface MenuItem { label?: ReactNode; onClick?: () => void; danger?: boolean; node?: ReactNode }

// Overflow "⋯ More" menu — panel is position:fixed (anchored) so the header's
// overflow/stacking context can't clip it.
export function HeaderMenu({ btnStyle, items }: { btnStyle: CSSProperties; items: (MenuItem | null | false)[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; W: number } | null>(null);
  const ref = useRef<HTMLButtonElement>(null);
  const toggle = () => {
    if (open) { setOpen(false); return; }
    const W = 212;
    try { const r = ref.current!.getBoundingClientRect(); const vw = window.innerWidth; const left = Math.max(8, Math.min(r.right - W, vw - W - 8)); setPos({ left, top: r.bottom + 6, W }); }
    catch { setPos({ left: 8, top: 52, W }); }
    setOpen(true);
  };
  return (
    <div style={{ position: "relative" }}>
      <button ref={ref} onClick={toggle} style={{ ...btnStyle }} title="More actions">⋯ More</button>
      {open && pos && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1200 }} />
          <div style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.W, zIndex: 1201, background: C.white, border: "1px solid " + C.border, borderRadius: 12, boxShadow: "0 14px 36px rgba(0,0,0,0.22)", padding: 6 }}>
            {(items.filter(Boolean) as MenuItem[]).map((it, i) => it.node
              ? <div key={i} style={{ padding: "6px 8px", borderTop: i ? "1px solid " + C.grid : "none" }}>{it.node}</div>
              : <button key={i} onClick={() => { setOpen(false); it.onClick && it.onClick(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: it.danger ? C.red : C.text }}>{it.label}</button>)}
          </div>
        </>
      )}
    </div>
  );
}
