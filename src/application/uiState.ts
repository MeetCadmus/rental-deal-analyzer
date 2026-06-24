import { useState, useEffect } from "react";
import { themePref, skinPref, tabPref } from "../infrastructure/storage/preferences";

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => { const t = themePref.get(); return t ? t === "dark" : themePref.prefersDark(); });
  useEffect(() => { try { document.documentElement.setAttribute("data-theme", dark ? "dark" : "light"); } catch { /* */ } themePref.set(dark); }, [dark]);
  return { dark, setDark };
}

export function useSkin() {
  const [skin, setSkin] = useState<string>(() => skinPref.get());
  useEffect(() => { try { document.documentElement.setAttribute("data-skin", skin); } catch { /* */ } skinPref.set(skin); }, [skin]);
  return { skin, setSkin };
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
