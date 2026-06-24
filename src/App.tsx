import { C } from "./presentation/theme/tokens";
import { fmtD, fmtP } from "./domain/money";
import { dealTitle } from "./domain/deal";
import { EXAMPLES } from "./domain/examples";
import { useDealWorkspace } from "./application/useDealWorkspace";
import { useTheme, useSkin, useToast, useViewTab } from "./application/uiState";
import { Card } from "./presentation/ui/Card";
import { MoneyInput, RentInput, Field } from "./presentation/ui/inputs";
import { Tog, SecLabel } from "./presentation/ui/primitives";
import { HeaderMenu } from "./presentation/ui/HeaderMenu";
import { QuickFill } from "./presentation/sections/QuickFill";
import { ListingLink } from "./presentation/sections/ListingLink";
import { ClosingCosts } from "./presentation/sections/ClosingCosts";
import { Expenses } from "./presentation/sections/Expenses";
import { AreaInsights } from "./presentation/sections/AreaInsights";
import { ComparablesCard } from "./presentation/sections/ComparablesCard";
import { OverviewTab } from "./presentation/results/OverviewTab";
import { IncomeTab } from "./presentation/results/IncomeTab";
import { ProjectionTab } from "./presentation/results/ProjectionTab";
import { AnalysisTab } from "./presentation/results/AnalysisTab";
import { DealsDrawer } from "./presentation/deals/DealsDrawer";
import { ScenarioCompare } from "./presentation/deals/ScenarioCompare";
import { SkinToggle } from "./presentation/deals/SkinToggle";

const TABS: [string, string][] = [["overview", "Overview"], ["income", "Income"], ["projection", "Projection"], ["analysis", "Analysis"]];

export default function App() {
  const { dark, setDark } = useTheme();
  const { skin, setSkin } = useSkin();
  const { toast, setToast } = useToast();
  const { tab, setTab } = useViewTab();
  const w = useDealWorkspace(setToast);
  const { S, R, Y, SEN, score, totalRent, numU } = w;
  const hb = { fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: "var(--c-rad)", border: "1px solid var(--c-headborder)", background: "transparent", color: "var(--c-headfg)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", letterSpacing: "0.02em" } as const;

  return (
    <div style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif", maxWidth: 1040, margin: "0 auto", padding: "0.5rem 0" }}>
      {/* Header */}
      <div style={{ background: "var(--c-head)", borderRadius: "var(--c-rad)", padding: "20px 22px", marginBottom: 14, overflow: "hidden", position: "relative", borderTop: "2px solid " + C.gold }} className="no-print">
        <div className="skin-deco" style={{ position: "absolute", right: -12, top: -12, width: 74, height: 74, border: "2px solid rgba(200,146,42,0.22)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.26em", color: C.gold, marginBottom: 7, textTransform: "uppercase" }}>Rental Property · Deal Analyzer</div>
            <div style={{ fontFamily: "var(--c-fdisp)", fontSize: 24, fontWeight: 600, color: "var(--c-headfg)", letterSpacing: "0.01em", lineHeight: 1.12 }}>Investment Property Analyzer</div>
            <div style={{ fontSize: 11, color: "var(--c-headfg)", opacity: 0.55, marginTop: 6, letterSpacing: "0.02em" }}>Unlimited deals · every change auto-saves · switch &amp; compare anytime</div>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <SkinToggle skin={skin} setSkin={setSkin} />
            <button onClick={() => w.setDealsOpen(true)} title="Browse, search & switch deals" style={{ ...hb, background: C.navy, border: "1px solid " + C.navy, color: "#fff", fontWeight: 600, maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis" }}>{w.activeTitle} <span style={{ opacity: 0.65, fontWeight: 500 }}>({w.deals.length})</span></button>
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
          <Card title="Property details" icon="pin" collapsible defaultOpen storeKey="prop">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>Address / MLS #</label>
                <input value={S.address || ""} onChange={(e) => w.set("address", e.target.value)} placeholder="123 Maple St, Atlanta, GA 30308" style={{ padding: "7px 10px", fontSize: 13, border: "1px solid " + C.border, borderRadius: 7, fontFamily: "inherit", color: C.text, outline: "none" }} />
              </div>
              <ListingLink url={S.listingUrl} onChange={(v) => w.set("listingUrl", v)} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>Notes / assumptions</label>
                <textarea value={S.notes || ""} onChange={(e) => w.set("notes", e.target.value)} placeholder="Seller motivated, rents below market, new roof 2022..." rows={2} style={{ padding: "7px 10px", fontSize: 12, border: "1px solid " + C.border, borderRadius: 7, fontFamily: "inherit", color: C.text, outline: "none", resize: "vertical", lineHeight: 1.5 }} />
              </div>
            </div>
          </Card>

          <Card title={"Units & Rents · " + numU + " unit" + (numU !== 1 ? "s" : "")} icon="home" collapsible defaultOpen storeKey="units" summary={fmtD(totalRent) + "/mo"}>
            <div style={{ marginBottom: 11 }}><MoneyInput label="Purchase price" value={S.price} onChange={(x) => w.set("price", x)} sub={"Loan: " + fmtD(S.price * (1 - S.financing.downPct / 100)) + " · Down: " + fmtD(S.price * S.financing.downPct / 100)} /></div>
            <div style={{ marginBottom: 9 }}><Tog checked={w.showUD} onChange={w.setShowUD} label="Show unit details (beds / bath / sq ft)" /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {S.units.map((u, i) => <div key={u.id} style={{ border: "1px solid " + C.border, borderRadius: 9, padding: "8px 10px", background: C.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: w.showUD ? 8 : 0 }}>
                  <input value={u.label} onChange={(e) => w.setUnit(i, "label", e.target.value)} style={{ fontSize: 12, fontWeight: 700, color: C.heading, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", flex: "0 1 72px", minWidth: 0 }} />
                  <RentInput value={u.rent} onChange={(v) => w.setUnit(i, "rent", v)} />
                  {numU > 1 && <button className="tap-sm" aria-label={"Remove " + (u.label || "unit")} onClick={() => w.remUnit(i)} style={{ padding: "5px 9px", background: C.redL, border: "1px solid " + C.border, borderRadius: 6, cursor: "pointer", fontSize: 12, color: C.red, fontFamily: "inherit", flexShrink: 0 }}>✕</button>}
                </div>
                {w.showUD && <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)", gap: 6 }}>
                  <Field label="Beds" value={u.beds || 0} onChange={(x) => w.setUnit(i, "beds", x)} min={0} max={10} xs />
                  <Field label="Baths" value={u.bath || 0} onChange={(x) => w.setUnit(i, "bath", x)} min={0} max={6} step={0.5} xs />
                  <Field label="Sq ft" value={u.sqft || 0} onChange={(x) => w.setUnit(i, "sqft", x)} min={0} step={50} xs />
                </div>}
              </div>)}
            </div>
            <button onClick={w.addUnit} style={{ marginTop: 8, width: "100%", padding: "7px", borderRadius: 8, border: "1px dashed " + C.border, background: C.white, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.slate, fontFamily: "inherit" }}>+ Add unit</button>
            <div style={{ marginTop: 10 }}><MoneyInput label="Other income / mo" value={S.otherIncome || 0} onChange={(x) => w.set("otherIncome", x)} sub="laundry · parking · pet · storage (added to EGI)" /></div>
            <div style={{ marginTop: 9, padding: "6px 9px", background: C.bg, borderRadius: 7, border: "1px solid " + C.border, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slate }}>Total monthly income</span>
              <span style={{ fontWeight: 700, color: C.heading }}>{fmtD(totalRent + (S.otherIncome || 0))}/mo · {fmtD((totalRent + (S.otherIncome || 0)) * 12)}/yr</span>
            </div>
          </Card>

          <Card title="Financing" icon="bank" collapsible defaultOpen storeKey="fin" summary={fmtD(R.pmt) + "/mo"}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9 }}>
              <Field label="Down payment" suffix="%" value={S.financing.downPct} onChange={(x) => w.setFin("downPct", x)} min={0} max={100} step={0.5} sub={"= " + fmtD(S.price * S.financing.downPct / 100)} showZero />
              <Field label="Interest rate" suffix="%" value={S.financing.rate} onChange={(x) => w.setFin("rate", x)} min={0} max={20} step={0.125} showZero />
              <Field label="Loan term" suffix="yrs" value={S.financing.loanYears} onChange={(x) => w.setFin("loanYears", x)} min={1} max={40} />
              <div style={{ padding: "7px 10px", background: C.bg, borderRadius: 8, border: "1px solid " + C.border }}>
                <div style={{ fontSize: 10, color: C.slate, marginBottom: 2 }}>Monthly payment</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.heading }}>{fmtD(R.pmt)}/mo</div>
                <div style={{ fontSize: 10, color: C.muted }}>Loan: {fmtD(R.loan)}</div>
              </div>
            </div>
            <div style={{ marginTop: 9 }}>
              <Field label="Cash reserves" suffix="mo PITI" value={S.financing.reserveMonths || 0} onChange={(x) => w.setFin("reserveMonths", x)} min={0} max={24} step={1}
                tip={["Liquid cash a lender wants you to keep AFTER closing — months of PITI (principal+interest+taxes+insurance).", "· Investment / multifamily: often 6 months", "· DSCR loans: ~3–12 months", "· Owner-occupied: 0–2 months", "· You keep this money — it's not spent, so it's not counted in cash-on-cash."]}
                sub={(S.financing.reserveMonths || 0) > 0 ? ("= " + fmtD(R.reserves) + " to keep on hand · PITI ≈ " + fmtD(R.pitiMo) + "/mo") : "0 = none. Investment loans often require ~6."} />
            </div>
            <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid " + C.border }}>
              <Tog checked={S.partnership?.enabled || false} onChange={(x) => w.setPart("enabled", x)} label="Partnership purchase" sub="Calculate my share of returns" />
              {S.partnership?.enabled && <div style={{ marginTop: 9 }}>
                <Field label="My equity share" suffix="%" value={S.partnership.myPct || 60} onChange={(x) => w.setPart("myPct", x)} min={1} max={99} step={1} sub={"Partner: " + (100 - (S.partnership.myPct || 60)) + "%"} />
              </div>}
            </div>
          </Card>

          <ClosingCosts cc={S.closing} setCC={w.setCC} price={S.price} loan={R.loan} annTax={S.expenses.taxes || 0} annIns={S.expenses.insurance || 0} rate={S.financing.rate} collapsible defaultOpen />
          <Expenses ex={S.expenses} setEx={w.setEx} units={numU} egi={R.egi} price={S.price} collapsible defaultOpen />

          <Card title="Repairs & Rehab" icon="wrench" collapsible defaultOpen storeKey="repairs" summary={S.repairs.include ? (S.repairs.unknown ? "TBD" : fmtD(S.repairs.amount)) : undefined}>
            <Tog checked={S.repairs.include} onChange={(x) => w.setRep("include", x)} label="Include repair / rehab budget" sub="Added to cash needed at close" />
            {S.repairs.include && <div style={{ marginTop: 9, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 9, alignItems: "end" }}>
              <MoneyInput label="Budget" value={S.repairs.unknown ? 0 : S.repairs.amount} onChange={(x) => w.setRep("amount", x)} sub={S.repairs.unknown ? "Marked as unknown" : fmtD(S.repairs.amount) + " added to cash in"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <label style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>Unknown?</label>
                <button onClick={() => w.setRep("unknown", !S.repairs.unknown)} style={{ padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, border: "1px solid " + (S.repairs.unknown ? C.amber : C.border), background: S.repairs.unknown ? C.amberL : C.white, color: S.repairs.unknown ? C.amber : C.slate }}>? TBD</button>
              </div>
            </div>}
            {S.repairs.include && S.repairs.unknown && <div style={{ marginTop: 6, fontSize: 10, color: C.amber }}>⚠︎ Get inspection quotes. Budget 5–15% of price for older buildings.</div>}
          </Card>

          <Card title="Projection & Growth" icon="trend" collapsible defaultOpen storeKey="proj" summary={S.projection.holdYears + "yr · " + fmtP(S.projection.appreciationPct)}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9, marginBottom: 12 }}>
              <Field label="Hold period" suffix="years" value={S.projection.holdYears} onChange={(x) => w.setProj("holdYears", x)} min={1} max={30} />
              <Field label="Appreciation/yr" suffix="%" value={S.projection.appreciationPct} onChange={(x) => w.setProj("appreciationPct", x)} min={0} max={12} step={0.25} sub="set your market's forecast" />
              <Field label="Rent growth/yr" suffix="%" value={S.projection.rentGrowthPct || 0} onChange={(x) => w.setProj("rentGrowthPct", x)} min={0} max={10} step={0.25} sub="Applied to all units each year" />
              <div style={{ padding: "7px 10px", background: C.tealL, borderRadius: 8, border: "1px solid " + C.border, fontSize: 11 }}>
                <div style={{ color: C.teal, fontWeight: 700, marginBottom: 2 }}>Rent in year {S.projection.holdYears}</div>
                <div style={{ fontWeight: 700, color: C.teal, fontSize: 14 }}>{fmtD(Math.round((totalRent / numU) * Math.pow(1 + (S.projection.rentGrowthPct || 0) / 100, (S.projection.holdYears || 5) - 1)))}/unit/mo</div>
              </div>
            </div>
            <SecLabel text="Exit assumptions" />
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9, marginBottom: 9 }}>
                <Field label="Selling costs" suffix="%" value={S.projection.sellingCostPct} onChange={(x) => w.setProj("sellingCostPct", x)} min={0} max={12} step={0.5} sub="agent + closing at sale" showZero />
                <div style={{ padding: "7px 10px", background: C.bg, borderRadius: 8, border: "1px solid " + C.border }}>
                  <div style={{ fontSize: 10, color: C.slate, marginBottom: 2 }}>Net sale proceeds (yr {S.projection.holdYears})</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.heading }}>{fmtD(Y.exitVal * (1 - (S.projection.sellingCostPct ?? 6) / 100) - (Y.yearly[Y.yearly.length - 1]?.balance || 0))}</div>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}><Tog checked={S.projection.exitCapEnabled || false} onChange={(x) => w.setProj("exitCapEnabled", x)} label="Value the exit on a cap rate" sub="Sale price = final-year NOI ÷ exit cap (instead of appreciation %)" /></div>
              {S.projection.exitCapEnabled && <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9 }}>
                <Field label="Exit cap rate" suffix="%" value={S.projection.exitCapRate} onChange={(x) => w.setProj("exitCapRate", x)} min={1} max={15} step={0.1} sub={"vs entry cap " + fmtP(R.capRate)} />
                <div style={{ padding: "7px 10px", background: C.goldL, borderRadius: 8, border: "1px solid " + C.border, fontSize: 10, color: C.amber }}>Higher exit cap than entry = conservative (value compresses); lower = optimistic.</div>
              </div>}
            </div>
            <SecLabel text="Value-add scenario" />
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 8 }}><Tog checked={S.projection.vaEnabled || false} onChange={(x) => w.setProj("vaEnabled", x)} label="Below-market rents — value-add potential" sub="Show metrics at stabilized market rents" /></div>
              {S.projection.vaEnabled && <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9 }}>
                <Field label="Market rent / unit" prefix="$" value={S.projection.vaMarketRentPerUnit || 1700} onChange={(x) => w.setProj("vaMarketRentPerUnit", x)} min={0} step={25} sub={"current: " + fmtD(totalRent / numU) + "/unit"} />
                <Field label="Stabilized by year" value={S.projection.vaYear || 2} onChange={(x) => w.setProj("vaYear", x)} min={1} max={10} />
              </div>}
            </div>
            <SecLabel text="Refinance scenario" />
            <div>
              <div style={{ marginBottom: 8 }}><Tog checked={S.projection.refiEnabled || false} onChange={(x) => w.setProj("refiEnabled", x)} label="Model a refinance in projection" sub="New rate applies from refi year onward" /></div>
              {S.projection.refiEnabled && <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9 }}>
                <Field label="Refi year" value={S.projection.refiYear || 3} onChange={(x) => w.setProj("refiYear", x)} min={1} max={S.projection.holdYears || 5} />
                <Field label="New rate" suffix="%" value={S.projection.refiRate || 6.5} onChange={(x) => w.setProj("refiRate", x)} min={1} max={15} step={0.125} />
              </div>}
            </div>
          </Card>

          <AreaInsights data={S.insights} onChange={w.setInsights} />
          <ComparablesCard comps={S.comparables || []} setComps={w.setComps} currentR={R} />
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
