// Local UI preferences (theme, skin, active tab, collapsed cards). Browser-only.

const safeGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string): void => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

export const themePref = {
  get(): "dark" | "light" | null {
    const t = safeGet("re_theme");
    return t === "dark" || t === "light" ? t : null;
  },
  prefersDark(): boolean {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch {
      return false;
    }
  },
  set(dark: boolean): void {
    safeSet("re_theme", dark ? "dark" : "light");
  },
};

export const tabPref = {
  get(): string {
    return safeGet("re_tab") || "overview";
  },
  set(tab: string): void {
    safeSet("re_tab", tab);
  },
};

// Generic persisted boolean flag (remembers a UI toggle across reloads).
export function boolPref(key: string, dflt: boolean) {
  return {
    get(): boolean {
      const v = safeGet(key);
      return v === null ? dflt : v === "1";
    },
    set(on: boolean): void {
      safeSet(key, on ? "1" : "0");
    },
  };
}

// Year-by-year table: compact ($1.2k) vs exact ($1,234) numbers. Defaults to compact.
export const yearTableCompactPref = boolPref("re_yeartable_compact", true);

const CARDS_KEY = "re_cards_v1";
export function loadCardState(): Record<string, boolean> {
  try {
    return JSON.parse(safeGet(CARDS_KEY) || "null") || {};
  } catch {
    return {};
  }
}
export function saveCardState(key: string, open: boolean): void {
  const m = loadCardState();
  m[key] = open;
  safeSet(CARDS_KEY, JSON.stringify(m));
}
