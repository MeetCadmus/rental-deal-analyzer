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
import s from "./App.module.css";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["income", "Income"],
  ["projection", "Projection"],
  ["analysis", "Analysis"],
];

export default function App() {
  useWorkspaceEffects();
  const { dark, setDark } = useTheme();
  const { tab, setTab } = useViewTab();
  const store = useWorkspace();
  const metrics = useMetrics();
  const w = { ...store, ...metrics, S: store.state, cloudCfg };
  const { S, R, Y, SEN, score, numU } = w;
  const toast = store.toast,
    setToast = store.setToast;
  // Shared header-button style object — passed by value to HeaderMenu's btnStyle prop,
  // so it stays an object rather than a CSS-module class.
  const hb = {
    fontSize: 11,
    fontWeight: 500,
    padding: "7px 13px",
    borderRadius: "var(--c-rad)",
    border: "1px solid var(--c-headborder)",
    background: "transparent",
    color: "var(--c-headfg)",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
  } as const;

  return (
    <div className={s.app}>
      {/* Header */}
      <div className={`no-print ${s.header}`}>
        <div className={s.headerRow}>
          <div>
            <div className={s.kicker}>Rental Property · Deal Analyzer</div>
            <div className={s.title}>Investment Property Analyzer</div>
            <div className={s.sub}>Unlimited deals · every change auto-saves · switch &amp; compare anytime</div>
          </div>
          <div className={s.actions}>
            <button
              onClick={() => w.setDealsOpen(true)}
              title="Browse, search & switch deals"
              style={{
                ...hb,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: C.navy,
                border: "1px solid " + C.navy,
                color: "#fff",
                fontWeight: 600,
                maxWidth: 250,
              }}
            >
              <Icon name="list" size={13} style={{ opacity: 0.85, flexShrink: 0 }} />
              <span className={s.dealTitle}>{w.activeTitle}</span>
              <span className={s.dealCount}>· {w.deals.length}</span>
              <span className={s.dealCaret}>▾</span>
            </button>
            <button onClick={w.newDeal} style={hb} title="Start a new blank deal">
              ＋ New deal
            </button>
            <ScenarioCompare deals={w.deals} activeId={w.activeId} currentState={S} />
            <HeaderMenu
              btnStyle={hb}
              items={[
                { label: dark ? "Light mode" : "Dark mode", onClick: () => setDark((d) => !d) },
                { label: "Print / Save PDF", onClick: w.handlePrint },
                { label: "Copy share link", onClick: w.copyShareLink },
                { label: "Export this deal (CSV)", onClick: w.exportCSV },
                { label: "Import a deal (CSV)", onClick: w.importCSV },
                w.cloudCfg
                  ? {
                      node: w.user ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 11, color: C.slate }}>
                            {w.sync === "syncing" ? "Saving…" : w.sync === "error" ? "Sync error" : "Synced"}
                          </span>
                          <button
                            onClick={w.signOut}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: C.slate,
                              background: C.bg,
                              border: "1px solid " + C.border,
                              borderRadius: 4,
                              padding: "5px 10px",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                            title={w.user.email || "Sign out"}
                          >
                            Sign out
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={w.signIn}
                          style={{
                            width: "100%",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#fff",
                            background: C.navy,
                            border: "none",
                            borderRadius: "var(--c-rad)",
                            padding: "9px 10px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            letterSpacing: "0.02em",
                          }}
                        >
                          Sign in with Google
                        </button>
                      ),
                    }
                  : null,
              ]}
            />
          </div>
        </div>
      </div>

      <DealsDrawer
        open={w.dealsOpen}
        onClose={() => w.setDealsOpen(false)}
        deals={w.deals}
        activeId={w.activeId}
        liveTitle={w.activeTitle}
        onSelect={w.switchDeal}
        onNew={w.newDeal}
        onRename={w.renameDeal}
        onDelete={w.deleteDeal}
        onDuplicate={w.duplicateDeal}
        onExportAll={w.exportAllDeals}
        onImportAll={w.importAllDeals}
      />

      {/* Examples */}
      <div className={`no-print ${s.examplesWrap}`}>
        <button onClick={() => w.setShowEx(!w.showEx)} className={s.examplesToggle}>
          <span>Load Atlanta example deal</span>
          <span className={s.caret} style={{ transform: w.showEx ? "rotate(180deg)" : "none" }}>
            ▾
          </span>
        </button>
        {w.showEx && (
          <div>
            <div className={`preset-grid ${s.exampleGridInner}`}>
              {EXAMPLES.map((ex) => {
                const on = w.selEx === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => w.loadEx(ex)}
                    className={s.exampleBtn}
                    style={{ border: "1.5px solid " + (on ? ex.col : C.border), background: on ? ex.col : C.white }}
                  >
                    <div className={s.exampleLabel} style={{ color: on ? "#fff" : C.text }}>
                      {ex.label}
                    </div>
                    <div className={s.exampleSub} style={{ color: on ? "rgba(255,255,255,0.7)" : C.slate }}>
                      {ex.sub}
                    </div>
                    <div className={s.exampleTag} style={{ color: on ? "rgba(255,255,255,0.85)" : ex.col }}>
                      {ex.tag}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className={s.exampleHint}>
              Loads into the current deal. Click <strong>＋ New deal</strong> first if you want to keep it as a separate saved deal.
            </div>
          </div>
        )}
      </div>

      <div className={`layout ${s.grid}`}>
        {/* LEFT: Inputs */}
        <div id="inputs-panel">
          <QuickFill key={w.activeId} state={S} onListing={w.applyListing} onAI={w.applyAI} onSource={(v: string) => w.set("aiSource", v)} />
          <PropertyDetails />
          <Units />
          <Financing R={R} />
          <ClosingCosts
            cc={S.closing}
            setCC={w.setCC}
            price={S.price}
            loan={R.loan}
            annTax={S.expenses.taxes || 0}
            annIns={S.expenses.insurance || 0}
            rate={S.financing.rate}
            collapsible
            defaultOpen
          />
          <Expenses ex={S.expenses} setEx={w.setEx} units={numU} egi={R.egi} price={S.price} collapsible defaultOpen />
          <Repairs />
          <Projection R={R} Y={Y} />

          <AreaInsights data={S.insights} onChange={w.setInsights} />
        </div>

        {/* RIGHT: Results */}
        <div id="results-panel" className={`sticky-col ${s.results}`}>
          {!w.isPrinting && (
            <div
              role="tablist"
              aria-label="Results"
              className={`no-print ${s.tabs}`}
              onKeyDown={(e) => {
                const i = TABS.findIndex(([id]) => id === tab);
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const n = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
                  setTab(TABS[n][0]);
                }
              }}
            >
              {TABS.map(([id, lbl]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={s.tab}
                  style={{ color: tab === id ? C.heading : C.slate, borderBottom: tab === id ? "2px solid " + C.gold : "2px solid transparent" }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}
          {w.isPrinting ? (
            <div>
              <OverviewTab R={R} Y={Y} S={S} />
              <div className={s.printSection}>
                <IncomeTab R={R} S={S} />
              </div>
              <div className={s.printSection}>
                <ProjectionTab R={R} Y={Y} S={S} />
              </div>
              <div className={s.printSection}>
                <AnalysisTab SEN={SEN} R={R} S={S} Y={Y} />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: tab === "overview" ? "block" : "none" }}>
                <OverviewTab R={R} Y={Y} S={S} />
              </div>
              <div style={{ display: tab === "income" ? "block" : "none" }}>
                <IncomeTab R={R} S={S} />
              </div>
              <div style={{ display: tab === "projection" ? "block" : "none" }}>
                <ProjectionTab R={R} Y={Y} S={S} />
              </div>
              <div style={{ display: tab === "analysis" ? "block" : "none" }}>
                <AnalysisTab SEN={SEN} R={R} S={S} Y={Y} />
              </div>
            </div>
          )}
        </div>
      </div>

      {w.undo && (
        <div className={`no-print ${s.undoBar}`}>
          <span className={s.undoText}>Deleted “{dealTitle(w.undo.deal)}”</span>
          <button onClick={w.undoDelete} className={s.undoBtn}>
            ↩︎ Undo
          </button>
        </div>
      )}

      {toast && (
        <div className={`no-print ${s.toast}`} onClick={() => setToast("")}>
          {toast}
        </div>
      )}

      <div
        className={`mobile-bar ${s.mobileBar}`}
        onClick={() => {
          try {
            const el = document.getElementById("results-panel")!;
            if (el.getBoundingClientRect().top > 80) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              (document.getElementById("inputs-panel") || document.body).scrollIntoView({ behavior: "smooth", block: "start" });
            }
          } catch {
            /* */
          }
        }}
        style={{ background: score.color }}
      >
        {(
          [
            ["Deal score", score.grade],
            ["CF/mo", fmtD(R.cf / 12)],
            ["Cap rate", fmtP(R.capRate)],
            ["DSCR", R.dscr.toFixed(2)],
          ] as [string, string][]
        ).map(([l2, v2]) => (
          <div key={l2} style={{ textAlign: "center" }}>
            <div className={s.mobileTileLabel}>{l2}</div>
            <div className={s.mobileTileValue}>{v2}</div>
          </div>
        ))}
        <div className={s.mobileHint}>tap ↕︎</div>
      </div>

      <div className={s.footer}>
        Built by{" "}
        <a href="https://www.linkedin.com/in/maksym--andreiev/" target="_blank" rel="noopener noreferrer" className={s.footerLink}>
          Maksym Andreiev
        </a>{" "}
        · Educational only — not financial, legal, or tax advice.
      </div>
    </div>
  );
}
