import { C, SKINS } from "../theme/tokens";

// Segmented style picker for the (dark) header bar — switches the whole skin.
function SkinToggle({ skin, setSkin }: { skin: string; setSkin: (s: string) => void }) {
  return <div style={{ display: "inline-flex", gap: 2, padding: 2, borderRadius: "var(--c-rad)", background: "transparent", border: "1px solid var(--c-headborder)" }}>
    {SKINS.map(([id, lbl]) => { const on = skin === id; return <button key={id} onClick={() => setSkin(id)} title={"Style: " + lbl} style={{ fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: "calc(var(--c-rad) - 2px)", border: "none", cursor: "pointer", fontFamily: "inherit", background: on ? C.gold : "transparent", color: on ? "#fff" : "var(--c-headfg)", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{lbl}</button>; })}
  </div>;
}

export { SkinToggle };
