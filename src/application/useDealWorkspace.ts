import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { fullState, makeDeal, dealTitle } from "../domain/deal";
import { INIT, BLANK, DCC, DEX } from "../domain/defaults";
import { num } from "../domain/money";
import { computeBase } from "../domain/finance/computeBase";
import { computeYearly } from "../domain/finance/computeYearly";
import { computeSensitivity } from "../domain/finance/computeSensitivity";
import { calcDealScore } from "../domain/finance/scoring";
import type { Deal } from "../domain/types";
import type { Example } from "../domain/examples";
import {
  loadDealStore, persistDeals, mergeDealStores, getTomb, setTomb, type DealStore,
} from "../infrastructure/storage/dealRepository";
import { stateToCSV, csvToState } from "../infrastructure/csv";
import { downloadFile } from "../infrastructure/download";
import {
  getCloudConfig, createSupabase, fetchUserData, pushUserData, signInWithGoogle, signOut as sbSignOut,
  type SupabaseClient, type User,
} from "../infrastructure/sync/supabase";
import type { ParsedListing } from "../infrastructure/listing";

const mergeImported = (p: Partial<Deal>): Deal => ({
  ...INIT, ...p,
  financing: { ...INIT.financing, ...(p.financing || {}) },
  closing: { ...DCC, ...(p.closing || {}) },
  expenses: { ...DEX, ...(p.expenses || {}) },
  projection: { ...INIT.projection, ...(p.projection || {}) },
  repairs: { ...INIT.repairs, ...(p.repairs || {}) },
  partnership: { ...INIT.partnership, ...(p.partnership || {}) },
  units: Array.isArray(p.units) && p.units.length ? p.units : INIT.units,
  comparables: Array.isArray(p.comparables) ? p.comparables : [],
});

let _uid = 1000; const uid = () => ++_uid;

// Application service for the deal workspace: the library, the working deal, all
// edit/CRUD actions, CSV/share I/O, and cloud sync. Keeps the App a thin view.
export function useDealWorkspace(setToast: (s: string) => void) {
  const [boot] = useState(loadDealStore);
  const [deals, setDeals] = useState<Deal[]>(boot.deals);
  const [activeId, setActiveId] = useState<string>(boot.activeId);
  const [state, setState] = useState<Deal>(() => fullState(boot.deals.find((d) => d._id === boot.activeId) || boot.deals[0]));
  const touchRef = useRef(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [undo, setUndo] = useState<{ deal: Deal; idx: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showEx, setShowEx] = useState(false);
  const [showUD, setShowUD] = useState(false);
  const [selEx, setSelEx] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // ── Cloud sync (Supabase) — dormant unless config.js provides keys ──
  const cloudCfg = getCloudConfig();
  const supa = useRef<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sync, setSync] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storeRef = useRef({ deals, activeId });
  useEffect(() => { storeRef.current = { deals, activeId }; }, [deals, activeId]);
  const syncedOnce = useRef(false);

  const applyStore = (st: DealStore) => {
    touchRef.current = false; setTomb(st.deleted || {}); setDeals(st.deals); setActiveId(st.activeId!);
    persistDeals(st.deals, st.activeId);
    const a = st.deals.find((d) => d._id === st.activeId) || st.deals[0];
    if (a) setState(fullState(a)); setSelEx(null);
  };
  const pushCloud = (uid2: string, deals2: Deal[], activeId2: string) => {
    const c = supa.current; if (!c || !uid2) return; setSync("syncing");
    pushUserData(c, uid2, { deals: deals2, activeId: activeId2, deleted: getTomb() }).then(({ error }) => setSync(error ? "error" : "synced"));
  };
  const fetchCloud = (u: User) => fetchUserData(supa.current!, u.id);
  const initialSync = async (u: User) => {
    if (!supa.current || !u) return; setSync("syncing");
    try {
      const cloud = await fetchCloud(u); const cur = { ...storeRef.current, deleted: getTomb() };
      const merged = mergeDealStores(cur, cloud);
      if (merged.deals.some((d) => d._id === cur.activeId)) merged.activeId = cur.activeId;
      applyStore(merged); pushCloud(u.id, merged.deals, merged.activeId!);
    } catch { setSync("error"); }
  };
  const backgroundSync = async (u: User) => {
    if (!supa.current || !u) return;
    try {
      const cloud = await fetchCloud(u); const cur = { ...storeRef.current, deleted: getTomb() };
      const merged = mergeDealStores(cur, cloud); setTomb(merged.deleted || {});
      const keep = cur.activeId, localActive = cur.deals.find((d) => d._id === keep);
      const deals2 = merged.deals.map((d) => (d._id === keep && localActive) ? localActive : d);
      setDeals(deals2); setActiveId(merged.deals.some((d) => d._id === keep) ? keep : merged.activeId!);
      persistDeals(deals2, keep); setSync("synced");
    } catch { /* ignore */ }
  };
  const onAuthUser = (u: User | null) => {
    setUser(u || null);
    if (!u) { syncedOnce.current = false; setSync("idle"); return; }
    if (!syncedOnce.current) { syncedOnce.current = true; initialSync(u); } else backgroundSync(u);
  };
  useEffect(() => {
    if (!cloudCfg) return;
    let unsub: { unsubscribe: () => void } | undefined;
    try {
      const c = createSupabase(cloudCfg); supa.current = c;
      c.auth.getSession().then(({ data }) => { const u = data && data.session && data.session.user; if (u) onAuthUser(u); });
      const sub = c.auth.onAuthStateChange((_e, session) => onAuthUser(session && session.user));
      unsub = sub && sub.data && sub.data.subscription;
    } catch { /* ignore */ }
    return () => { try { unsub && unsub.unsubscribe(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!cloudCfg || !user) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => pushCloud(user.id, deals, activeId), 1500);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, activeId]);
  const signIn = () => { try { supa.current && signInWithGoogle(supa.current); } catch { /* ignore */ } };
  const signOut = () => { try { supa.current && sbSignOut(supa.current); } catch { /* ignore */ } setUser(null); setSync("idle"); };

  // ── Working-deal setters ──
  const S = state;
  const set = <K extends keyof Deal>(k: K, v: Deal[K]) => setState((p) => ({ ...p, [k]: v }));
  const setFin = (k: string, v: unknown) => setState((p) => ({ ...p, financing: { ...p.financing, [k]: v } }));
  const setProj = (k: string, v: unknown) => setState((p) => ({ ...p, projection: { ...p.projection, [k]: v } }));
  const setRep = (k: string, v: unknown) => setState((p) => ({ ...p, repairs: { ...p.repairs, [k]: v } }));
  const setPart = (k: string, v: unknown) => setState((p) => ({ ...p, partnership: { ...p.partnership, [k]: v } }));
  const setCC = useCallback((fn: (p: Deal["closing"]) => Deal["closing"]) => setState((p) => ({ ...p, closing: fn(p.closing || { ...DCC }) })), []);
  const setEx = useCallback((fn: (p: Deal["expenses"]) => Deal["expenses"]) => setState((p) => ({ ...p, expenses: fn(p.expenses || { ...DEX }) })), []);
  const setUnit = (i: number, k: string, v: unknown) => setState((p) => { const u = [...p.units]; u[i] = { ...u[i], [k]: v }; return { ...p, units: u }; });
  const addUnit = () => setState((p) => { const next = p.units.reduce((m, u) => { const mm = /(\d+)\s*$/.exec(u.label || ""); return Math.max(m, mm ? parseInt(mm[1], 10) : 0); }, 0) + 1; return { ...p, units: [...p.units, { id: uid(), label: "Unit " + next, rent: 1400, beds: 1, bath: 1, sqft: 700 }] }; });
  const remUnit = (i: number) => setState((p) => ({ ...p, units: p.units.filter((_, j) => j !== i) }));
  const setInsights = (v: unknown) => setState((p) => ({ ...p, insights: v }));

  // ── Quick-fill ──
  const applyListing = (pl: ParsedListing) => setState((p) => {
    const np: Deal = { ...p };
    if (pl.url) np.listingUrl = pl.url;
    if (pl.address) np.address = pl.address;
    if (num(pl.price) > 0) np.price = num(pl.price);
    if (pl.units && pl.units >= 1) { const cnt = Math.min(pl.units, 16); np.units = Array.from({ length: cnt }, (_, i) => { const ex = p.units[i] || ({ rent: 0 } as Deal["units"][number]); return { ...ex, id: ex.id || uid(), label: ex.label || ("Unit " + (i + 1)), beds: num(pl.beds) || ex.beds || 0, bath: num(pl.bath) || ex.bath || 0, sqft: num(pl.sqft) || ex.sqft || 0, rent: ex.rent || 0 }; }); }
    else if (pl.beds || pl.bath || pl.sqft) { np.units = p.units.map((u, i) => i === 0 ? { ...u, beds: num(pl.beds) || u.beds, bath: num(pl.bath) || u.bath, sqft: num(pl.sqft) || u.sqft } : u); }
    return np;
  });
  const applyAI = (o: Record<string, any>) => setState((p) => {
    const np: Deal = { ...p };
    if (typeof o.address === "string" && o.address.trim()) np.address = o.address.trim();
    if (num(o.price) > 0) np.price = num(o.price);
    if (Array.isArray(o.units) && o.units.length) np.units = o.units.slice(0, 16).map((x: any, i: number) => ({ id: uid(), label: "Unit " + (i + 1), beds: num(x.beds) || 0, bath: num(x.bath) || 0, sqft: num(x.sqft) || 0, rent: num(x.rent) || 0 }));
    if (o.expenses && typeof o.expenses === "object") {
      const e = o.expenses; const ex = { ...np.expenses, mode: "detailed" as const, v: 2 };
      if (num(e.taxesAnnual) > 0) { ex.taxes = num(e.taxesAnnual); ex.taxMode = "fixed"; }
      if (num(e.insuranceAnnual) > 0) ex.insurance = num(e.insuranceAnnual);
      if (e.vacancyPct != null && e.vacancyPct !== "") ex.vacancyPct = num(e.vacancyPct);
      if (e.mgmtPct != null && e.mgmtPct !== "") ex.mgmtPct = num(e.mgmtPct);
      if (num(e.maintenanceAnnual) > 0) { ex.maintenance = num(e.maintenanceAnnual); ex.maintMode = "fixed"; }
      if (num(e.capexAnnual) > 0) { ex.capex = num(e.capexAnnual); ex.capexMode = "fixed"; }
      if (e.utilitiesAnnual != null && e.utilitiesAnnual !== "") ex.utilities = num(e.utilitiesAnnual);
      if (e.landscapingAnnual != null && e.landscapingAnnual !== "") ex.landscaping = num(e.landscapingAnnual);
      np.expenses = ex;
    }
    if (o.financing && typeof o.financing === "object") { const fz = { ...np.financing }; if (num(o.financing.rate) > 0) fz.rate = num(o.financing.rate); np.financing = fz; if (num(o.financing.refiRate) > 0) np.projection = { ...np.projection, refiRate: num(o.financing.refiRate) }; }
    if (num(o.closingPct) > 0) np.closing = { ...np.closing, mode: "quick", quickPct: num(o.closingPct) };
    if (o.projection && typeof o.projection === "object") { const pz = { ...np.projection }; const pp = o.projection; if (pp.appreciationPct != null && pp.appreciationPct !== "") pz.appreciationPct = num(pp.appreciationPct); if (pp.rentGrowthPct != null && pp.rentGrowthPct !== "") pz.rentGrowthPct = num(pp.rentGrowthPct); if (num(pp.exitCapRate) > 0) pz.exitCapRate = num(pp.exitCapRate); np.projection = pz; }
    if (o.insights && typeof o.insights === "object") { const x = o.insights, arr = (v: any) => Array.isArray(v) ? v.filter((s: any) => typeof s === "string" && s.trim()).map((s: string) => s.trim()).slice(0, 8) : []; np.insights = { neighborhoodGrade: String(x.neighborhoodGrade || "").trim().slice(0, 2).toUpperCase(), schools: num(x.schools) || 0, safety: String(x.safety || "").trim().slice(0, 80), appreciation: String(x.appreciation || "").trim().slice(0, 220), demand: String(x.demand || "").trim().slice(0, 220), pros: arr(x.pros), cons: arr(x.cons), risks: arr(x.risks) }; }
    if (typeof o.opinion === "string" && o.opinion.trim()) np.notes = (np.notes ? np.notes + "\n\n" : "") + "AI: " + o.opinion.trim();
    if (typeof o.model === "string" && o.model.trim()) { np.aiSource = o.model.trim().slice(0, 60); np.aiAt = Date.now(); }
    return np;
  });

  // ── Deal portfolio actions ──
  const addDeal = (data: Partial<Deal>, label?: string): string => { touchRef.current = false; const d = makeDeal(data, label ? { label } : {}); setDeals((ds) => { const n = [...ds, d]; persistDeals(n, d._id!); return n; }); setActiveId(d._id!); setState(fullState(d)); return d._id!; };
  const switchDeal = (id: string) => { if (id === activeId) return; const d = deals.find((x) => x._id === id); if (!d) return; touchRef.current = false; setActiveId(id); setState(fullState(d)); setSelEx(null); };
  const newDeal = () => { addDeal(BLANK); setSelEx(null); setDealsOpen(false); };
  const duplicateDeal = (id: string) => { const src = deals.find((x) => x._id === id); if (src) addDeal(src, dealTitle(src) + " (copy)"); };
  const renameDeal = (id: string, label: string) => setDeals((ds) => { const n = ds.map((d) => d._id === id ? { ...d, _label: label } : d); persistDeals(n, activeId); return n; });
  const deleteDeal = (id: string) => {
    const idx = deals.findIndex((d) => d._id === id); if (idx < 0) return;
    const removed = deals[idx]; setTomb({ ...getTomb(), [id]: Date.now() });
    setDeals((ds) => {
      let n = ds.filter((d) => d._id !== id); let act = activeId;
      if (id === activeId) { if (!n.length) { const blank = makeDeal(INIT, {}); n = [blank]; } act = (n[Math.max(0, idx - 1)] || n[n.length - 1])._id!; touchRef.current = false; setActiveId(act); setState(fullState(n.find((d) => d._id === act))); setSelEx(null); }
      persistDeals(n, act); return n;
    });
    setUndo({ deal: removed, idx });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 7000);
  };
  const undoDelete = () => {
    if (!undo) return; const d = undo.deal;
    { const t = { ...getTomb() }; delete t[d._id!]; setTomb(t); }
    setDeals((ds) => { const n = [...ds]; n.splice(Math.min(undo.idx, n.length), 0, d); persistDeals(n, d._id!); return n; });
    touchRef.current = false; setActiveId(d._id!); setState(fullState(d)); setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };
  const loadEx = (ex: Example) => { touchRef.current = false; setState(fullState({ ...INIT, ...ex, closing: ex.closing || { ...DCC }, expenses: ex.expenses || { ...DEX }, projection: { ...INIT.projection, ...ex.projection } })); setSelEx(ex.id); };

  const exportCSV = () => { const base = (S.address || "deal").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").slice(0, 40) || "deal"; downloadFile(base + ".csv", stateToCSV(S as unknown as Record<string, unknown>)); };
  const importCSV = () => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".csv,text/csv";
    inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { try { addDeal(mergeImported(csvToState(rd.result as string))); setSelEx(null); } catch (err) { alert("Could not import this CSV: " + (err as Error).message); } };
      rd.readAsText(f); };
    inp.click();
  };
  const copyShareLink = () => {
    try {
      const url = location.origin + location.pathname + "#deal=" + encodeURIComponent(stateToCSV(S as unknown as Record<string, unknown>));
      const ok = () => setToast("Link copied — anyone who opens it gets this deal");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, () => window.prompt("Copy this link:", url));
      else window.prompt("Copy this link:", url);
    } catch { alert("Couldn't build a share link for this deal."); }
  };
  // Open a shared link once on load.
  useEffect(() => {
    try {
      const m = (location.hash || "").match(/^#deal=([\s\S]*)$/);
      if (m) { const st = csvToState(decodeURIComponent(m[1])); if (st && Object.keys(st).length) { addDeal(mergeImported(st), (st.address as string) || "Shared deal"); setSelEx(null); setToast("Loaded a shared deal into your library"); } }
    } catch { alert("That shared link couldn't be read."); }
    try { history.replaceState(null, "", location.pathname + location.search); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const exportAllDeals = () => { const stamp = new Date().toISOString().slice(0, 10); downloadFile("re-deals-backup-" + stamp + ".json", JSON.stringify({ app: "re-investment-analyzer", version: 1, exportedAt: Date.now(), deals, activeId }, null, 2), "application/json"); };
  const importAllDeals = () => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,application/json";
    inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { try {
        const data = JSON.parse(rd.result as string);
        const incoming = Array.isArray(data) ? data : (data && Array.isArray(data.deals) ? data.deals : null);
        if (!incoming || !incoming.length) throw new Error("no deals found in file");
        const imported = incoming.map((d: any) => makeDeal(d, { label: d._label || d._name || "", ts: d._ts, created: d._created }));
        setDeals((ds) => { const n = [...ds, ...imported]; persistDeals(n, imported[0]._id); return n; });
        touchRef.current = false; setActiveId(imported[0]._id); setState(fullState(imported[0])); setSelEx(null);
        alert("Imported " + imported.length + " deal" + (imported.length > 1 ? "s" : "") + " into your library.");
      } catch (err) { alert("Could not import deals: " + (err as Error).message); } };
      rd.readAsText(f); };
    inp.click();
  };

  // Auto-save: capture `touched` BEFORE setDeals (the functional updater runs lazily).
  useEffect(() => {
    const touched = touchRef.current;
    setDeals((ds) => { const n = ds.map((d) => d._id !== activeId ? d : { ...d, ...state, _id: d._id, _label: d._label, _created: d._created, _ts: touched ? Date.now() : d._ts }); persistDeals(n, activeId); return n; });
    touchRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const R = useMemo(() => computeBase(state), [state]);
  const Y = useMemo(() => computeYearly(state, R), [state, R]);
  const SEN = useMemo(() => computeSensitivity(state, R), [state, R]);
  const score = useMemo(() => calcDealScore(R, Y), [R, Y]);
  const totalRent = S.units.reduce((s, u) => s + u.rent, 0);
  const numU = S.units.length;
  const activeDeal = deals.find((d) => d._id === activeId) || deals[0];
  const activeTitle = (activeDeal && activeDeal._label && activeDeal._label.trim()) || (S.address && S.address.trim()) || "Untitled deal";

  const handlePrint = () => { setIsPrinting(true); const prev = document.documentElement.getAttribute("data-theme"); try { document.documentElement.setAttribute("data-theme", "light"); } catch { /* ignore */ } setTimeout(() => { window.print(); setTimeout(() => { setIsPrinting(false); try { document.documentElement.setAttribute("data-theme", prev || "light"); } catch { /* ignore */ } }, 300); }, 150); };

  return {
    deals, activeId, S, R, Y, SEN, score, totalRent, numU, activeTitle,
    set, setFin, setProj, setRep, setPart, setCC, setEx, setUnit, addUnit, remUnit, setInsights,
    applyListing, applyAI,
    addDeal, switchDeal, newDeal, duplicateDeal, renameDeal, deleteDeal, undo, undoDelete, loadEx,
    exportCSV, importCSV, copyShareLink, exportAllDeals, importAllDeals,
    dealsOpen, setDealsOpen, showEx, setShowEx, showUD, setShowUD, selEx, isPrinting, handlePrint,
    cloudCfg, user, sync, signIn, signOut,
  };
}
