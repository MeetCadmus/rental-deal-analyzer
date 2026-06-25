import { C } from "./presentation/theme/tokens";
import { fmtD, fmtP } from "./domain/money";
import { dealTitle } from "./domain/deal";
import { EXAMPLES } from "./domain/examples";
import { useWorkspace, cloudCfg } from "./application/workspaceStore";
import { useWorkspaceEffects } from "./application/useWorkspaceEffects";
import { useMetrics } from "./application/useMetrics";
import { useTheme, useViewTab } from "./application/uiState";
import { HeaderMenu } from "./presentation/ui/HeaderMenu";
import { Icon } from "./presentation/ui/Icon";
import { QuickFill } from "./presentation/sections/QuickFill";
import { PropertyDetails } from "./presentation/sections/PropertyDetails";
import { Units } from "./presentation/sections/Units";
import { Financing } from "./presentation/sections/Financing";
import { ClosingCosts } from "./presentation/sections/ClosingCosts";
import { Expenses } from "./presentation/sections/Expenses";
import { Repairs } from "./presentation/sections/Repairs";
import { Projection } from "./presentation/sections/Projection";
import { AreaInsights } from "./presentation/sections/AreaInsights";
import { OverviewTab } from "./presentation/results/OverviewTab";
import { IncomeTab } from "./presentation/results/IncomeTab";
import { ProjectionTab } from "./presentation/results/ProjectionTab";
import { AnalysisTab } from "./presentation/results/AnalysisTab";
import { DealsDrawer } from "./presentation/deals/DealsDrawer";
import { ScenarioCompare } from "./presentation/deals/ScenarioCompare";

const TABS: [string, string][] = [["overview", "Overview"], ["income", "Income"], ["projection", "Projection"], ["analysis", "Analysis"]];

export default function App() {
  useWorkspaceEffects();
  const { dark, setDark } = useTheme();
  const { tab, setTab } = useViewTab();
  const store = useWorkspace();
  const metrics = useMetrics();
  const w = { ...store, ...metrics, S: store.state, cloudCfg };
  const { S, R, Y, SEN, score, numU } = w;
  const toast = store.toast, setToast = store.setToast;
  const hb = { fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: "var(--c-rad)", border: "1px solid var(--c-headborder)", background: "transparent", color: "var(--c-headfg)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", letterSpacing: "0.02em" } as const;

  return (
    <div style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif", maxWidth: 1040, margin: "0 auto", padding: "0.5rem 0" }}>
      {/* Header */}
      <div style={{ background: "var(--c-head)", borderRadius: "var(--c-rad)", padding: "20px 22px", marginBottom: 14, overflow: "hidden", position: "relative", borderTop: "2px solid " + C.gold }} className="no-print">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.26em", color: C.gold, marginBottom: 7, textTransform: "uppercase" }}>Rental Property · Deal Analyzer</div>
            <div style={{ fontFamily: "var(--c-fdisp)", fontSize: 24, fontWeight: 600, color: "var(--c-headfg)", letterSpacing: "0.01em", lineHeight: 1.12 }}>Investment Property Analyzer</div>
            <div style={{ fontSize: 11, color: "var(--c-headfg)", opacity: 0.55, marginTop: 6, letterSpacing: "0.02em" }}>Unlimited deals · every change auto-saves · switch &amp; compare anytime</div>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={() => w.setDealsOpen(true)} title="Browse, search & switch deals" style={{ ...hb, display: "inline-flex", alignItems: "center", gap: 7, background: C.navy, border: "1px solid " + C.navy, color: "#fff", fontWeight: 600, maxWidth: 250 }}>
              <Icon name="list" size={13} style={{ opacity: 0.85, flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.activeTitle}</span>
              <span style={{ opacity: 0.6, fontWeight: 500, flexShrink: 0 }}>· {w.deals.length}</span>
              <span style={{ opacity: 0.7, flexShrink: 0, fontSize: 10 }}>▾</span>
            </button>
            <button onClick={w.newDeal} style={hb} title="Start a new blank deal">＋ New deal</button>
            <ScenarioCompare deals={w.deals} activeId={w.activeId} currentState={S} />
            <HeaderMenu btnStyle={hb} items={[
              { label: dark ? "Light mode" : "Dark mode", onClick: () => setDark((d) => !d) },
              { label: "Print / Save PDF", onClick: w.handlePrint },
              { label: "Copy share link", onClick: w.copyShareLink },
              { label: "Export this deal (CSV)", onClick: w.exportCSV },
              { label: "Import a deal (CSV)", onClick: w.importCSV },
              w.cloudCfg ? {
                node: (w.user
                  ? <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.slate }}>{w.sync === "syncing" ? "Saving…" : w.sync === "error" ? "Sync error" : "Synced"}</span>
                      <button onClick={w.signOut} style={{ fontSize: 12, fontWeight: 600, color: C.slate, background: C.bg, border: "1px solid " + C.border, borderRadius: 4, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }} title={w.user.email || "Sign out"}>Sign out</button>
                    </div>
                  : <button onClick={w.signIn} style={{ width: "100%", fontSize: 12, fontWeight: 700, color: "#fff", background: C.navy, border: "none", borderRadius: "var(--c-rad)", padding: "9px 10px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em" }}>Sign in with Google</button>),
              } : null,
            ]} />
          </div>
        </div>
      </div>

      <DealsDrawer open={w.dealsOpen} onClose={() => w.setDealsOpen(false)} deals={w.deals} activeId={w.activeId} liveTitle={w.activeTitle}
        onSelect={w.switchDeal} onNew={w.newDeal} onRename={w.renameDeal} onDelete={w.deleteDeal} onDuplicate={w.duplicateDeal}
        onExportAll={w.exportAllDeals} onImportAll={w.importAllDeals} />

      {/* Examples */}
      <div style={{ marginBottom: 11 }} className="no-print">
        <button onClick={() => w.setShowEx(!w.showEx)} style={{ fontSize: 11, fontWeight: 700, color: C.slate, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "0 0 6px", display: "flex", alignItems: "center", gap: 5 }}>
          <span>Load Atlanta example deal</span><span style={{ transition: "transform 0.2s", display: "inline-block", transform: w.showEx ? "rotate(180deg)" : "none" }}>▾</span>
        </button>
        {w.showEx && <div>
          <div className="preset-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 5 }}>
            {EXAMPLES.map((ex) => { const on = w.selEx === ex.id; return (
              <button key={ex.id} onClick={() => w.loadEx(ex)} style={{ padding: "7px 5px", borderRadius: 9, border: "1.5px solid " + (on ? ex.col : C.border), background: on ? ex.col : C.white, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: on ? "#fff" : C.text }}>{ex.label}</div>
                <div style={{ fontSize: 9, color: on ? "rgba(255,255,255,0.7)" : C.slate, lineHeight: 1.3 }}>{ex.sub}</div>
                <div style={{ marginTop: 3, fontSize: 9, fontWeight: 700, color: on ? "rgba(255,255,255,0.85)" : ex.col }}>{ex.tag}</div>
              </button>); })}
          </div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 5 }}>Loads into the current deal. Click <strong>＋ New deal</strong> first if you want to keep it as a separate saved deal.</div>
        </div>}
      </div>

      <div className="layout" style={{ display: "grid", gridTemplateColumns: "minmax(0,0.92fr) minmax(0,1.08fr)", gap: 11, alignItems: "start" }}>
        {/* LEFT: Inputs */}
        <div id="inputs-panel">
          <QuickFill key={w.activeId} state={S} onListing={w.applyListing} onAI={w.applyAI} onSource={(v: string) => w.set("aiSource", v)} />
          <PropertyDetails />
          <Units />
          <Financing R={R} />
          <ClosingCosts cc={S.closing} setCC={w.setCC} price={S.price} loan={R.loan} annTax={S.expenses.taxes || 0} annIns={S.expenses.insurance || 0} rate={S.financing.rate} collapsible defaultOpen />
          <Expenses ex={S.expenses} setEx={w.setEx} units={numU} egi={R.egi} price={S.price} collapsible defaultOpen />
          <Repairs />
          <Projection R={R} Y={Y} />

          <AreaInsights data={S.insights} onChange={w.setInsights} />
        </div>

        {/* RIGHT: Results */}
        <div id="results-panel" className="sticky-col" style={{ position: "sticky", top: 8 }}>
          {!w.isPrinting && <div role="tablist" aria-label="Results" className="no-print" onKeyDown={(e) => { const i = TABS.findIndex(([id]) => id === tab); if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length; setTab(TABS[n][0]); } }} style={{ display: "flex", gap: 0, borderBottom: "2px solid " + C.border, marginBottom: 11 }}>
            {TABS.map(([id, lbl]) => <button key={id} role="tab" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} style={{ padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "none", color: tab === id ? C.heading : C.slate, borderBottom: tab === id ? "2px solid " + C.gold : "2px solid transparent", marginBottom: -2, fontFamily: "inherit", letterSpacing: "0.01em" }}>{lbl}</button>)}
          </div>}
          {w.isPrinting ? (
            <div>
              <OverviewTab R={R} Y={Y} S={S} />
              <div style={{ borderTop: "2px solid " + C.border, marginTop: 16, paddingTop: 16 }}><IncomeTab R={R} S={S} /></div>
              <div style={{ borderTop: "2px solid " + C.border, marginTop: 16, paddingTop: 16 }}><ProjectionTab R={R} Y={Y} S={S} /></div>
              <div style={{ borderTop: "2px solid " + C.border, marginTop: 16, paddingTop: 16 }}><AnalysisTab SEN={SEN} R={R} S={S} Y={Y} /></div>
            </div>
          ) : (
            <div>
              <div style={{ display: tab === "overview" ? "block" : "none" }}><OverviewTab R={R} Y={Y} S={S} /></div>
              <div style={{ display: tab === "income" ? "block" : "none" }}><IncomeTab R={R} S={S} /></div>
              <div style={{ display: tab === "projection" ? "block" : "none" }}><ProjectionTab R={R} Y={Y} S={S} /></div>
              <div style={{ display: tab === "analysis" ? "block" : "none" }}><AnalysisTab SEN={SEN} R={R} S={S} Y={Y} /></div>
            </div>
          )}
        </div>
      </div>

      {w.undo && <div className="no-print" style={{ position: "fixed", left: "50%", bottom: 70, transform: "translateX(-50%)", zIndex: 1100, background: C.navy, color: "#fff", padding: "10px 16px", borderRadius: 10, display: "flex", gap: 16, alignItems: "center", boxShadow: "0 6px 24px rgba(0,0,0,0.35)", maxWidth: "92vw" }}>
        <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Deleted “{dealTitle(w.undo.deal)}”</span>
        <button onClick={w.undoDelete} style={{ fontSize: 12, fontWeight: 700, color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>↩︎ Undo</button>
      </div>}

      {toast && <div className="no-print" onClick={() => setToast("")} style={{ position: "fixed", left: "50%", bottom: 110, transform: "translateX(-50%)", zIndex: 1100, background: C.teal, color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, boxShadow: "0 6px 24px rgba(0,0,0,0.35)", maxWidth: "92vw", textAlign: "center", cursor: "pointer" }}>{toast}</div>}

      <div className="mobile-bar" onClick={() => { try { const el = document.getElementById("results-panel")!; if (el.getBoundingClientRect().top > 80) { el.scrollIntoView({ behavior: "smooth", block: "start" }); } else { (document.getElementById("inputs-panel") || document.body).scrollIntoView({ behavior: "smooth", block: "start" }); } } catch { /* */ } }} style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: score.color, padding: "8px 16px", zIndex: 200, alignItems: "center", justifyContent: "space-around", cursor: "pointer" }}>
        {([["Deal score", score.grade], ["CF/mo", fmtD(R.cf / 12)], ["Cap rate", fmtP(R.capRate)], ["DSCR", R.dscr.toFixed(2)]] as [string, string][]).map(([l2, v2]) => <div key={l2} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{l2}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v2}</div>
        </div>)}
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", alignSelf: "center" }}>tap ↕︎</div>
      </div>

      <div style={{ marginTop: 10, fontSize: 9, color: C.muted, borderTop: "1px solid " + C.border, paddingTop: 8, marginBottom: 60 }}>
        Built by <a href="https://www.linkedin.com/in/maksym--andreiev/" target="_blank" rel="noopener noreferrer" style={{ color: C.heading, fontWeight: 600, textDecoration: "none" }}>Maksym Andreiev</a> · Educational only — not financial, legal, or tax advice.
      </div>
    </div>
  );
}
