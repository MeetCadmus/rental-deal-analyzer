// Colour tokens map to the CSS variables defined in theme.css (per skin/mode).
export const C = {
  navy: "var(--c-navy)", navyM: "var(--c-navyM)", gold: "var(--c-gold)", goldL: "var(--c-goldL)",
  teal: "var(--c-teal)", tealL: "var(--c-tealL)", red: "var(--c-red)", redL: "var(--c-redL)",
  amber: "var(--c-amber)", amberL: "var(--c-amberL)", slate: "var(--c-slate)", border: "var(--c-border)",
  bg: "var(--c-bg)", white: "var(--c-white)", text: "var(--c-text)", heading: "var(--c-heading)",
  rowline: "var(--c-rowline)", grid: "var(--c-grid)", hl: "var(--c-hl)", tealS: "var(--c-tealS)",
  redS: "var(--c-redS)", amberS: "var(--c-amberS)", blueS: "var(--c-blueS)", muted: "var(--c-muted)",
} as const;

// Selectable skins (id, label) — order = switcher order.
export const SKINS: [string, string][] = [
  ["calm", "Calm"], ["classic", "Classic"], ["ink", "Ink"], ["graphite", "Graphite"], ["heritage", "Heritage"],
];
