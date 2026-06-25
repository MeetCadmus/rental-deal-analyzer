import { useState, useEffect } from "react";
import { themePref, tabPref } from "../infrastructure/storage/preferences";

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => { const t = themePref.get(); return t ? t === "dark" : themePref.prefersDark(); });
  useEffect(() => { try { document.documentElement.setAttribute("data-theme", dark ? "dark" : "light"); } catch { /* */ } themePref.set(dark); }, [dark]);
  return { dark, setDark };
}

export function useToast() {
  const [toast, setToast] = useState("");
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);
  return { toast, setToast };
}

export function useViewTab() {
  const [tab, setTab] = useState<string>(() => tabPref.get());
  useEffect(() => { tabPref.set(tab); }, [tab]);
  return { tab, setTab };
}
