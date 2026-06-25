import { create } from "zustand";
import { fullState, makeDeal, dealTitle } from "../domain/deal";
import { INIT, BLANK, DCC, DEX } from "../domain/defaults";
import { num } from "../domain/money";
import type { Deal } from "../domain/types";
import type { Example } from "../domain/examples";
import { loadDealStore, persistDeals, getTomb, setTomb, type DealStore } from "../infrastructure/storage/dealRepository";
import { stateToCSV, csvToState } from "../infrastructure/csv";
import { validateDealImport } from "../infrastructure/validation";
import { downloadFile } from "../infrastructure/download";
import type { ParsedListing } from "../infrastructure/listing";
import { getCloudConfig, signInWithGoogle, signOut as sbSignOut, type SupabaseClient, type User } from "../infrastructure/sync/supabase";

export const cloudCfg = getCloudConfig();
export type SyncState = "idle" | "syncing" | "synced" | "error";
// The lazily-created Supabase client lives module-side (set by useWorkspaceEffects).
let supa: SupabaseClient | null = null;
export const setSupa = (c: SupabaseClient | null) => {
  supa = c;
};
export const getSupa = (): SupabaseClient | null => supa;

const mergeImported = (p: Partial<Deal>): Deal => ({
  ...INIT,
  ...p,
  financing: { ...INIT.financing, ...(p.financing || {}) },
  closing: { ...DCC, ...(p.closing || {}) },
  expenses: { ...DEX, ...(p.expenses || {}) },
  projection: { ...INIT.projection, ...(p.projection || {}) },
  repairs: { ...INIT.repairs, ...(p.repairs || {}) },
  partnership: { ...INIT.partnership, ...(p.partnership || {}) },
  units: Array.isArray(p.units) && p.units.length ? p.units : INIT.units,
  comparables: Array.isArray(p.comparables) ? p.comparables : [],
});

let _uid = 1000;
const uid = () => ++_uid;

// `touched` is intentionally non-reactive: the autosave subscriber reads it to decide
// whether to bump _ts. Switch/open actions reset it to false BEFORE changing `state`.
// Starts true so the first user edit of the loaded deal bumps its timestamp.
let touched = true;
export const wasTouched = (): boolean => touched;
export const setTouched = (v: boolean) => {
  touched = v;
};

let undoTimer: ReturnType<typeof setTimeout> | null = null;

const boot = loadDealStore();

export interface WorkspaceStore {
  deals: Deal[];
  activeId: string;
  state: Deal;
  undo: { deal: Deal; idx: number } | null;
  dealsOpen: boolean;
  showEx: boolean;
  showUD: boolean;
  selEx: string | null;
  isPrinting: boolean;
  toast: string;
  user: User | null;
  sync: SyncState;
  // cloud
  setUser: (u: User | null) => void;
  setSync: (s: SyncState) => void;
  applyStore: (st: Partial<DealStore>) => void;
  signIn: () => void;
  signOut: () => void;
  // ui setters
  setDealsOpen: (v: boolean) => void;
  setShowEx: (v: boolean) => void;
  setShowUD: (v: boolean) => void;
  setToast: (t: string) => void;
  setIsPrinting: (v: boolean) => void;
  setSelEx: (v: string | null) => void;
  // working-deal setters (typed)
  set: <K extends keyof Deal>(k: K, v: Deal[K]) => void;
  setFin: (k: keyof Deal["financing"], v: unknown) => void;
  setProj: (k: keyof Deal["projection"], v: unknown) => void;
  setRep: (k: keyof Deal["repairs"], v: unknown) => void;
  setPart: (k: keyof Deal["partnership"], v: unknown) => void;
  setCC: (fn: (p: Deal["closing"]) => Deal["closing"]) => void;
  setEx: (fn: (p: Deal["expenses"]) => Deal["expenses"]) => void;
  setUnit: (i: number, k: string, v: unknown) => void;
  addUnit: () => void;
  remUnit: (i: number) => void;
  setInsights: (v: unknown) => void;
  applyListing: (pl: ParsedListing) => void;
  applyAI: (o: Record<string, any>) => void;
  // deal actions
  addDeal: (data: Partial<Deal>, label?: string) => string;
  switchDeal: (id: string) => void;
  newDeal: () => void;
  duplicateDeal: (id: string) => void;
  renameDeal: (id: string, label: string) => void;
  deleteDeal: (id: string) => void;
  undoDelete: () => void;
  loadEx: (ex: Example) => void;
  exportCSV: () => void;
  importCSV: () => void;
  copyShareLink: () => void;
  exportAllDeals: () => void;
  importAllDeals: () => void;
  importShared: () => void;
  handlePrint: () => void;
}

export const useWorkspace = create<WorkspaceStore>((set, get) => ({
  deals: boot.deals,
  activeId: boot.activeId,
  state: fullState(boot.deals.find((d) => d._id === boot.activeId) || boot.deals[0]),
  undo: null,
  dealsOpen: false,
  showEx: false,
  showUD: false,
  selEx: null,
  isPrinting: false,
  toast: "",
  user: null,
  sync: "idle",

  setUser: (u) => set({ user: u }),
  setSync: (s) => set({ sync: s }),
  applyStore: (st) => {
    if (!st || !Array.isArray(st.deals) || !st.deals.length) return;
    setTomb(st.deleted || {});
    touched = false;
    const a = st.deals.find((d) => d._id === st.activeId) || st.deals[0];
    persistDeals(st.deals, a._id!);
    set({ deals: st.deals, activeId: a._id!, state: fullState(a), selEx: null });
  },
  signIn: () => {
    if (supa) signInWithGoogle(supa);
  },
  signOut: () => {
    if (supa) sbSignOut(supa);
    set({ user: null, sync: "idle" });
  },

  setDealsOpen: (v) => set({ dealsOpen: v }),
  setShowEx: (v) => set({ showEx: v }),
  setShowUD: (v) => set({ showUD: v }),
  setToast: (t) => set({ toast: t }),
  setIsPrinting: (v) => set({ isPrinting: v }),
  setSelEx: (v) => set({ selEx: v }),

  set: (k, v) => set((s) => ({ state: { ...s.state, [k]: v } })),
  setFin: (k, v) => set((s) => ({ state: { ...s.state, financing: { ...s.state.financing, [k]: v } } })),
  setProj: (k, v) => set((s) => ({ state: { ...s.state, projection: { ...s.state.projection, [k]: v } } })),
  setRep: (k, v) => set((s) => ({ state: { ...s.state, repairs: { ...s.state.repairs, [k]: v } } })),
  setPart: (k, v) => set((s) => ({ state: { ...s.state, partnership: { ...s.state.partnership, [k]: v } } })),
  setCC: (fn) => set((s) => ({ state: { ...s.state, closing: fn(s.state.closing || { ...DCC }) } })),
  setEx: (fn) => set((s) => ({ state: { ...s.state, expenses: fn(s.state.expenses || { ...DEX }) } })),
  setUnit: (i, k, v) =>
    set((s) => {
      const u = [...s.state.units];
      u[i] = { ...u[i], [k]: v };
      return { state: { ...s.state, units: u } };
    }),
  addUnit: () =>
    set((s) => {
      const next =
        s.state.units.reduce((m, u) => {
          const mm = /(\d+)\s*$/.exec(u.label || "");
          return Math.max(m, mm ? parseInt(mm[1], 10) : 0);
        }, 0) + 1;
      return { state: { ...s.state, units: [...s.state.units, { id: uid(), label: "Unit " + next, rent: 1400, beds: 1, bath: 1, sqft: 700 }] } };
    }),
  remUnit: (i) => set((s) => ({ state: { ...s.state, units: s.state.units.filter((_, j) => j !== i) } })),
  setInsights: (v) => set((s) => ({ state: { ...s.state, insights: v } })),

  applyListing: (pl) =>
    set((s) => {
      const p = s.state;
      const np: Deal = { ...p };
      if (pl.url) np.listingUrl = pl.url;
      if (pl.address) np.address = pl.address;
      if (num(pl.price) > 0) np.price = num(pl.price);
      if (pl.units && pl.units >= 1) {
        const cnt = Math.min(pl.units, 16);
        np.units = Array.from({ length: cnt }, (_, i) => {
          const ex = p.units[i] || ({ rent: 0 } as Deal["units"][number]);
          return {
            ...ex,
            id: ex.id || uid(),
            label: ex.label || "Unit " + (i + 1),
            beds: num(pl.beds) || ex.beds || 0,
            bath: num(pl.bath) || ex.bath || 0,
            sqft: num(pl.sqft) || ex.sqft || 0,
            rent: ex.rent || 0,
          };
        });
      } else if (pl.beds || pl.bath || pl.sqft) {
        np.units = p.units.map((u, i) => (i === 0 ? { ...u, beds: num(pl.beds) || u.beds, bath: num(pl.bath) || u.bath, sqft: num(pl.sqft) || u.sqft } : u));
      }
      return { state: np };
    }),
  applyAI: (o) =>
    set((s) => {
      const np: Deal = { ...s.state };
      if (typeof o.address === "string" && o.address.trim()) np.address = o.address.trim();
      if (num(o.price) > 0) np.price = num(o.price);
      if (Array.isArray(o.units) && o.units.length)
        np.units = o.units.slice(0, 16).map((x: any, i: number) => ({
          id: uid(),
          label: "Unit " + (i + 1),
          beds: num(x.beds) || 0,
          bath: num(x.bath) || 0,
          sqft: num(x.sqft) || 0,
          rent: num(x.rent) || 0,
        }));
      if (o.expenses && typeof o.expenses === "object") {
        const e = o.expenses;
        const ex = { ...np.expenses, mode: "detailed" as const, v: 2 };
        if (num(e.taxesAnnual) > 0) {
          ex.taxes = num(e.taxesAnnual);
          ex.taxMode = "fixed";
        }
        if (num(e.insuranceAnnual) > 0) ex.insurance = num(e.insuranceAnnual);
        if (e.vacancyPct != null && e.vacancyPct !== "") ex.vacancyPct = num(e.vacancyPct);
        if (e.mgmtPct != null && e.mgmtPct !== "") ex.mgmtPct = num(e.mgmtPct);
        if (num(e.maintenanceAnnual) > 0) {
          ex.maintenance = num(e.maintenanceAnnual);
          ex.maintMode = "fixed";
        }
        if (num(e.capexAnnual) > 0) {
          ex.capex = num(e.capexAnnual);
          ex.capexMode = "fixed";
        }
        if (e.utilitiesAnnual != null && e.utilitiesAnnual !== "") ex.utilities = num(e.utilitiesAnnual);
        if (e.landscapingAnnual != null && e.landscapingAnnual !== "") ex.landscaping = num(e.landscapingAnnual);
        np.expenses = ex;
      }
      if (o.financing && typeof o.financing === "object") {
        const fz = { ...np.financing };
        if (num(o.financing.rate) > 0) fz.rate = num(o.financing.rate);
        np.financing = fz;
        if (num(o.financing.refiRate) > 0) np.projection = { ...np.projection, refiRate: num(o.financing.refiRate) };
      }
      if (num(o.closingPct) > 0) np.closing = { ...np.closing, mode: "quick", quickPct: num(o.closingPct) };
      if (o.projection && typeof o.projection === "object") {
        const pz = { ...np.projection };
        const pp = o.projection;
        if (pp.appreciationPct != null && pp.appreciationPct !== "") pz.appreciationPct = num(pp.appreciationPct);
        if (pp.rentGrowthPct != null && pp.rentGrowthPct !== "") pz.rentGrowthPct = num(pp.rentGrowthPct);
        if (num(pp.exitCapRate) > 0) pz.exitCapRate = num(pp.exitCapRate);
        np.projection = pz;
      }
      if (o.insights && typeof o.insights === "object") {
        const x = o.insights,
          arr = (v: any) =>
            Array.isArray(v)
              ? v
                  .filter((t: any) => typeof t === "string" && t.trim())
                  .map((t: string) => t.trim())
                  .slice(0, 8)
              : [];
        np.insights = {
          neighborhoodGrade: String(x.neighborhoodGrade || "")
            .trim()
            .slice(0, 2)
            .toUpperCase(),
          schools: num(x.schools) || 0,
          safety: String(x.safety || "")
            .trim()
            .slice(0, 80),
          appreciation: String(x.appreciation || "")
            .trim()
            .slice(0, 220),
          demand: String(x.demand || "")
            .trim()
            .slice(0, 220),
          pros: arr(x.pros),
          cons: arr(x.cons),
          risks: arr(x.risks),
        };
      }
      if (typeof o.opinion === "string" && o.opinion.trim()) np.notes = (np.notes ? np.notes + "\n\n" : "") + "AI: " + o.opinion.trim();
      if (typeof o.model === "string" && o.model.trim()) {
        np.aiSource = o.model.trim().slice(0, 60);
        np.aiAt = Date.now();
      }
      return { state: np };
    }),

  addDeal: (data, label) => {
    touched = false;
    const d = makeDeal(data, label ? { label } : {});
    const n = [...get().deals, d];
    persistDeals(n, d._id!);
    set({ deals: n, activeId: d._id!, state: fullState(d) });
    return d._id!;
  },
  switchDeal: (id) => {
    if (id === get().activeId) return;
    const d = get().deals.find((x) => x._id === id);
    if (!d) return;
    touched = false;
    set({ activeId: id, state: fullState(d), selEx: null });
  },
  newDeal: () => {
    get().addDeal(BLANK);
    set({ selEx: null, dealsOpen: false });
  },
  duplicateDeal: (id) => {
    const src = get().deals.find((x) => x._id === id);
    if (src) get().addDeal(src, dealTitle(src) + " (copy)");
  },
  renameDeal: (id, label) => {
    const n = get().deals.map((d) => (d._id === id ? { ...d, _label: label } : d));
    persistDeals(n, get().activeId);
    set({ deals: n });
  },
  deleteDeal: (id) => {
    const deals = get().deals;
    const idx = deals.findIndex((d) => d._id === id);
    if (idx < 0) return;
    const removed = deals[idx];
    setTomb({ ...getTomb(), [id]: Date.now() });
    let n = deals.filter((d) => d._id !== id);
    let act = get().activeId;
    const patch: Partial<WorkspaceStore> = {};
    if (id === get().activeId) {
      if (!n.length) {
        n = [makeDeal(INIT, {})];
      }
      act = (n[Math.max(0, idx - 1)] || n[n.length - 1])._id!;
      touched = false;
      patch.activeId = act;
      patch.state = fullState(n.find((d) => d._id === act));
      patch.selEx = null;
    }
    persistDeals(n, act);
    set({ deals: n, undo: { deal: removed, idx }, ...patch });
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      if (get().undo?.deal === removed) set({ undo: null });
    }, 7000);
  },
  undoDelete: () => {
    const undo = get().undo;
    if (!undo) return;
    const d = undo.deal;
    {
      const t = { ...getTomb() };
      delete t[d._id!];
      setTomb(t);
    }
    const n = [...get().deals];
    n.splice(Math.min(undo.idx, n.length), 0, d);
    persistDeals(n, d._id!);
    touched = false;
    set({ deals: n, activeId: d._id!, state: fullState(d), undo: null });
    if (undoTimer) clearTimeout(undoTimer);
  },
  loadEx: (ex) => {
    touched = false;
    set({
      state: fullState({
        ...INIT,
        ...ex,
        closing: ex.closing || { ...DCC },
        expenses: ex.expenses || { ...DEX },
        projection: { ...INIT.projection, ...ex.projection },
      }),
      selEx: ex.id,
    });
  },

  exportCSV: () => {
    const S = get().state;
    const base =
      (S.address || "deal")
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 40) || "deal";
    downloadFile(base + ".csv", stateToCSV(S as unknown as Record<string, unknown>));
  },
  importCSV: () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".csv,text/csv";
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const v = validateDealImport(csvToState(rd.result as string));
          if (!v.ok) {
            set({ toast: v.error });
            return;
          }
          get().addDeal(mergeImported(v.data));
          set({ selEx: null });
        } catch (err) {
          set({ toast: "Couldn't import that CSV: " + (err as Error).message });
        }
      };
      rd.readAsText(f);
    };
    inp.click();
  },
  copyShareLink: () => {
    try {
      const url = location.origin + location.pathname + "#deal=" + encodeURIComponent(stateToCSV(get().state as unknown as Record<string, unknown>));
      const ok = () => set({ toast: "Link copied — anyone who opens it gets this deal" });
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, () => window.prompt("Copy this link:", url));
      else window.prompt("Copy this link:", url);
    } catch {
      set({ toast: "Couldn't build a share link for this deal." });
    }
  },
  importShared: () => {
    try {
      const m = (location.hash || "").match(/^#deal=([\s\S]*)$/);
      if (m) {
        const v = validateDealImport(csvToState(decodeURIComponent(m[1])));
        if (v.ok) {
          get().addDeal(mergeImported(v.data), (v.data.address as string) || "Shared deal");
          set({ selEx: null, toast: "Loaded a shared deal into your library" });
        } else set({ toast: v.error });
      }
    } catch {
      set({ toast: "That shared link couldn't be read." });
    }
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch {
      /* ignore */
    }
  },
  exportAllDeals: () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(
      "re-deals-backup-" + stamp + ".json",
      JSON.stringify({ app: "re-investment-analyzer", version: 1, exportedAt: Date.now(), deals: get().deals, activeId: get().activeId }, null, 2),
      "application/json",
    );
  },
  importAllDeals: () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json";
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const data = JSON.parse(rd.result as string);
          const incoming = Array.isArray(data) ? data : data && Array.isArray(data.deals) ? data.deals : null;
          if (!incoming || !incoming.length) throw new Error("no deals found in file");
          const imported = incoming.map((d: any) => makeDeal(d, { label: d._label || d._name || "", ts: d._ts, created: d._created }));
          const n = [...get().deals, ...imported];
          persistDeals(n, imported[0]._id);
          touched = false;
          set({
            deals: n,
            activeId: imported[0]._id,
            state: fullState(imported[0]),
            selEx: null,
            toast: "Imported " + imported.length + " deal" + (imported.length > 1 ? "s" : ""),
          });
        } catch (err) {
          set({ toast: "Couldn't import deals: " + (err as Error).message });
        }
      };
      rd.readAsText(f);
    };
    inp.click();
  },
  handlePrint: () => {
    set({ isPrinting: true });
    const prev = document.documentElement.getAttribute("data-theme");
    try {
      document.documentElement.setAttribute("data-theme", "light");
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        set({ isPrinting: false });
        try {
          document.documentElement.setAttribute("data-theme", prev || "light");
        } catch {
          /* ignore */
        }
      }, 300);
    }, 150);
  },
}));

export const activeTitle = (s: WorkspaceStore): string => {
  const active = s.deals.find((d) => d._id === s.activeId) || s.deals[0];
  return (active && active._label && active._label.trim()) || (s.state.address && s.state.address.trim()) || "Untitled deal";
};
