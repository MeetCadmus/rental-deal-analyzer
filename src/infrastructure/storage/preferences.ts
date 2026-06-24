// Local UI preferences (theme, skin, active tab, collapsed cards). Browser-only.

const safeGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export const themePref = {
  get(): "dark" | "light" | null {
    const t = safeGet("re_theme");
    return t === "dark" || t === "light" ? t : null;
  },
  prefersDark(): boolean {
    try { return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); } catch { return false; }
  },
  set(dark: boolean): void { safeSet("re_theme", dark ? "dark" : "light"); },
};

export const skinPref = {
  get(): string { return safeGet("re_skin") || "calm"; },
  set(skin: string): void { safeSet("re_skin", skin); },
};

export const tabPref = {
  get(): string { return safeGet("re_tab") || "overview"; },
  set(tab: string): void { safeSet("re_tab", tab); },
};

const CARDS_KEY = "re_cards_v1";
export function loadCardState(): Record<string, boolean> {
  try { return JSON.parse(safeGet(CARDS_KEY) || "null") || {}; } catch { return {}; }
}
export function saveCardState(key: string, open: boolean): void {
  const m = loadCardState(); m[key] = open; safeSet(CARDS_KEY, JSON.stringify(m));
}
