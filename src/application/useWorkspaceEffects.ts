import { useEffect } from "react";
import type { Deal } from "../domain/types";
import {
  persistDeals, mergeDealStores, getTomb, setTomb, type DealStore,
} from "../infrastructure/storage/dealRepository";
import { createSupabase, fetchUserData, pushUserData, type User } from "../infrastructure/sync/supabase";
import { useWorkspace, cloudCfg, setSupa, getSupa, wasTouched, setTouched } from "./workspaceStore";

// Side-effects that wire the workspace store to the outside world. Mounted once by App.
// Kept out of the store so the store stays a pure-ish state container.
export function useWorkspaceEffects(): void {
  // ── Autosave: fold the working `state` back into its deal, persist, bump _ts if edited.
  useEffect(() => {
    const unsub = useWorkspace.subscribe((s, prev) => {
      if (s.state === prev.state) return; // only on working-deal edits, never on `deals` writes
      const touched = wasTouched();
      const { deals, activeId } = useWorkspace.getState();
      const n = deals.map((d) => d._id !== activeId ? d
        : { ...d, ...s.state, _id: d._id, _label: d._label, _created: d._created, _ts: touched ? Date.now() : d._ts });
      persistDeals(n, activeId);
      useWorkspace.setState({ deals: n });
      setTouched(true);
    });
    return unsub;
  }, []);

  // ── Open a shared #deal= link once on load.
  useEffect(() => { useWorkspace.getState().importShared(); }, []);

  // ── Cloud sync (Supabase) — dormant unless config.js provides keys.
  useEffect(() => {
    if (!cloudCfg) return;
    let unsub: { unsubscribe: () => void } | undefined;
    let cancelled = false;
    let syncedOnce = false;
    const store = useWorkspace;

    const cur = (): DealStore => { const { deals, activeId } = store.getState(); return { deals, activeId, deleted: getTomb() }; };
    const pushCloud = (uid: string, deals: Deal[], activeId: string | null) => {
      const c = getSupa(); if (!c || !uid) return; store.getState().setSync("syncing");
      pushUserData(c, uid, { deals, activeId, deleted: getTomb() }).then(({ error }) => store.getState().setSync(error ? "error" : "synced"));
    };
    const initialSync = async (u: User) => {
      const c = getSupa(); if (!c || !u) return; store.getState().setSync("syncing");
      try {
        const cloud = await fetchUserData(c, u.id);
        const local = cur();
        const merged = mergeDealStores(local, cloud);
        if (merged.deals.some((d) => d._id === local.activeId)) merged.activeId = local.activeId;
        store.getState().applyStore(merged);
        pushCloud(u.id, merged.deals, merged.activeId);
      } catch { store.getState().setSync("error"); }
    };
    const backgroundSync = async (u: User) => {
      const c = getSupa(); if (!c || !u) return;
      try {
        const cloud = await fetchUserData(c, u.id);
        const local = cur();
        const merged = mergeDealStores(local, cloud); setTomb(merged.deleted || {});
        const keep = local.activeId, localActive = local.deals.find((d) => d._id === keep);
        const deals2 = merged.deals.map((d) => (d._id === keep && localActive) ? localActive : d);
        const act = merged.deals.some((d) => d._id === keep) ? keep! : merged.activeId!;
        persistDeals(deals2, act);
        useWorkspace.setState({ deals: deals2, activeId: act });
        store.getState().setSync("synced");
      } catch { /* ignore */ }
    };
    const onAuthUser = (u: User | null) => {
      store.getState().setUser(u || null);
      if (!u) { syncedOnce = false; store.getState().setSync("idle"); return; }
      if (!syncedOnce) { syncedOnce = true; initialSync(u); } else backgroundSync(u);
    };

    (async () => {
      try {
        const c = await createSupabase(cloudCfg); // dynamic import — chunk loads only here
        if (cancelled) return;
        setSupa(c);
        c.auth.getSession().then(({ data }) => { const u = data && data.session && data.session.user; if (u) onAuthUser(u); });
        const sub = c.auth.onAuthStateChange((_e, session) => onAuthUser(session && session.user));
        unsub = sub && sub.data && sub.data.subscription;
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; try { unsub && unsub.unsubscribe(); } catch { /* ignore */ } };
  }, []);

  // ── Debounced push of the library to the cloud after edits.
  useEffect(() => {
    if (!cloudCfg) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useWorkspace.subscribe((s, prev) => {
      if (!s.user) return;
      if (s.deals === prev.deals && s.activeId === prev.activeId && s.user === prev.user) return;
      const c = getSupa(); if (!c) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        useWorkspace.getState().setSync("syncing");
        pushUserData(c, s.user!.id, { deals: s.deals, activeId: s.activeId, deleted: getTomb() })
          .then(({ error }) => useWorkspace.getState().setSync(error ? "error" : "synced"));
      }, 1500);
    });
    return () => { if (timer) clearTimeout(timer); unsub(); };
  }, []);
}
