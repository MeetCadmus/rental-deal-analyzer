import type { CSSProperties } from "react";

// Minimal line-icon set (Lucide-style, stroke=currentColor) — keeps chrome monochrome
// and tints with the active accent.
export const ICONS: Record<string, string> = {
  pin: '<path d="M20 10c0 6-8 11-8 11s-8-5-8-11a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  home: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 10h5a1 1 0 0 1 1 1v10"/><path d="M3 21h18"/><path d="M7.5 8h2M7.5 12h2M7.5 16h2"/>',
  bank: '<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M12 3l8 5H4z"/>',
  file: '<path d="M13 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z"/><path d="M13 3v5h5"/><path d="M9 13h6M9 17h5"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>',
  wrench: '<path d="M14.6 6.4a3.6 3.6 0 0 0-4.9 4.9L3 18v3h3l6.7-6.7a3.6 3.6 0 0 0 4.9-4.9l-2.3 2.3-2.2-.5-.5-2.2 2.5-2.2Z"/>',
  trend: '<path d="M3 17 9 11l4 4 8-8"/><path d="M16 7h5v5"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v-3M12 15V8M17 15v-5"/>',
  bolt: '<path d="M13 2 4 13h6l-1 9 9-11h-6l1-8Z"/>',
  scale: '<path d="M12 4v17M7 21h10M5 7h14"/><path d="M5 7 2.6 12.5a3 3 0 0 0 4.8 0L5 7Z"/><path d="M19 7l-2.4 5.5a3 3 0 0 0 4.8 0L19 7Z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
};

export function Icon({ name, size = 15, style }: { name?: string; size?: number; style?: CSSProperties }) {
  const p = name ? ICONS[name] : undefined;
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block", ...style }} dangerouslySetInnerHTML={{ __html: p }} />
  );
}
