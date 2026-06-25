import { C } from "../theme/tokens";
import { MBox, Pill } from "../ui/primitives";
import { fmt, fmtD, fmtP, fmtX, lv } from "../../domain/money";
import { calcDealScore, calcKillers } from "../../domain/finance/scoring";
import type { BaseMetrics, YearlyResult, Deal } from "../../domain/types";
import s from "./results.module.css";

export function OverviewTab({ R, Y, S, compact }: { R: BaseMetrics; Y: YearlyResult; S: Deal; compact?: boolean }) {
  const score = calcDealScore(R, Y, S.price);
  const killers = calcKillers(R);
  const pct1Pass = R.pct1 >= R.adjThresh;
  const adjLbl = S.price > 800000 ? "≥0.65% HCOL" : S.price > 500000 ? "≥0.75%" : S.price > 300000 ? "≥0.85%" : "≥1.0%";
  const partnerEnabled = S.partnership?.enabled;
  return (
    <div>
      {/* Deal score (hidden in compact mode — the verdict hero shows the grade & headline CF) */}
      {!compact && (
        <div style={{ display: "flex", gap: 10, marginBottom: 11 }}>
          <div
            style={{
              background: score.color,
              borderRadius: 11,
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 80,
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>Deal score</div>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{score.grade}</div>
            {!score.incomplete && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{Math.round(score.pct * 100)}%</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: score.color, marginBottom: 4 }}>{score.label}</div>
            <div style={{ fontSize: 12, color: C.slate, marginBottom: 8 }}>{score.desc}</div>
            {!score.incomplete && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Cap rate", "CoC", "DSCR", "CF/unit", "Break-even", "IRR"].map((l, i) => (
                  <span
                    key={l}
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 10,
                      background: score.metrics[i] === "good" ? C.tealL : score.metrics[i] === "warn" ? C.amberL : C.redL,
                      color: score.metrics[i] === "good" ? C.teal : score.metrics[i] === "warn" ? C.amber : C.red,
                      fontWeight: 600,
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Deal killers */}
      {killers.length > 0 && (
        <div style={{ marginBottom: 11 }}>
          {killers.map(([lvl, msg], i) => {
            const cfg: Record<string, [string, string]> = { critical: [C.redL, C.red], warn: [C.amberL, C.amber], info: [C.hl, C.heading] };
            const [bg, col] = cfg[lvl] || cfg.info;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems: "flex-start",
                  padding: "8px 11px",
                  background: bg,
                  border: "1px solid " + C.border,
                  borderRadius: "calc(var(--c-rad) - 2px)",
                  marginBottom: 5,
                  fontSize: 11,
                  color: col,
                }}
              >
                <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: col, marginTop: 4 }} />
                <span>{msg}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* Verdict banner (compact hero shows the same headline CF up top) */}
      {!compact && (
        <div style={{ borderRadius: "var(--c-rad)", padding: "4px 0 0", marginBottom: 11 }}>
          <div className={s.cols2} style={{ gap: 8 }}>
            {(
              [
                ["Monthly CF", fmtD(R.cf / 12) + "/mo", R.cf >= 0],
                ["Per unit", fmtD(R.cf / R.numU / 12) + "/unit/mo", R.cf >= 0],
                ["Annual CF", fmtD(R.cf) + "/yr", R.cf >= 0],
                ["Cash needed", fmtD(R.cashIn), true],
              ] as [string, string, boolean][]
            ).map(([l2, val, pos]) => (
              <div key={l2} style={{ background: C.white, border: "1px solid " + C.border, borderRadius: "calc(var(--c-rad) - 2px)", padding: "9px 11px" }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>{l2}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: pos ? C.heading : C.red, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Partnership split */}
      {partnerEnabled && (
        <div style={{ padding: "9px 11px", background: C.hl, border: "1px solid " + C.border, borderRadius: "var(--c-rad)", marginBottom: 11 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.blueS, marginBottom: 5, letterSpacing: "0.04em" }}>MY SHARE ({S.partnership.myPct}%)</div>
          <div className={s.cols3} style={{ gap: 8 }}>
            {[
              ["My CF/mo", fmtD(R.myCF / 12) + "/mo"],
              ["My CoC", fmtP(R.myCoc)],
              ["Invested", fmtD(R.cashIn * (S.partnership.myPct / 100))],
            ].map(([l2, v2]) => (
              <div key={l2} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.slate }}>{l2}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.blueS, fontVariantNumeric: "tabular-nums" }}>{v2}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Cash required */}
      <div style={{ padding: "9px 11px", background: C.white, border: "1px solid " + C.border, borderRadius: 10, marginBottom: 11 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.heading, marginBottom: 6 }}>CASH REQUIRED AT CLOSE</div>
        {(
          [
            ["Down payment", fmtD(R.down)],
            ["Closing costs", fmtD(R.ccTotal)],
            ...(S.repairs.include && !S.repairs.unknown && S.repairs.amount > 0 ? [["Repairs", fmtD(S.repairs.amount)]] : []),
          ] as [string, string][]
        ).map(([l2, v2]) => (
          <div
            key={l2}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "3px 0",
              borderBottom: "1px solid var(--c-rowline)",
              fontSize: 12,
              color: C.slate,
            }}
          >
            <span>{l2}</span>
            <span style={{ fontWeight: 600, color: C.text }}>{v2}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontWeight: 700, color: C.heading, fontSize: 13 }}>
          <span>Total to close</span>
          <span>{fmtD(R.cashIn)}</span>
        </div>
        {R.reserves > 0 && (
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: "1px dashed " + C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.slate }}>
              <span>
                + Lender reserves <span style={{ fontSize: 10, color: C.muted }}>({R.reserveMonths} mo PITI · kept, not spent)</span>
              </span>
              <span style={{ fontWeight: 600, color: C.text }}>{fmtD(R.reserves)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontWeight: 700, color: C.heading, fontSize: 13 }}>
              <span>Total cash on hand</span>
              <span>{fmtD(R.cashOnHand)}</span>
            </div>
          </div>
        )}
      </div>
      {/* Key metrics */}
      <div className={s.cols2} style={{ gap: 8, marginBottom: 11 }}>
        <MBox
          label="Cap rate"
          value={fmtP(R.capRate)}
          sub="≥5% (A) · ≥7% (B)"
          lvl={lv(R.capRate, 7, 4.5)}
          bar={R.capRate}
          bMax={12}
          bGood={7}
          bWarn={4.5}
          tip={["Cap rate = NOI ÷ Price", "= " + fmtD(R.noi) + " ÷ $" + fmt(S.price), "= " + fmtP(R.capRate)]}
        />
        <MBox
          label="Cash-on-cash"
          value={fmtP(R.coc)}
          sub="Good ≥8%"
          lvl={lv(R.coc, 8, 4)}
          bar={R.coc}
          bMax={20}
          bGood={8}
          bWarn={4}
          tip={["CoC = Annual CF ÷ Cash in", "= " + fmtD(R.cf) + " ÷ " + fmtD(R.cashIn), "= " + fmtP(R.coc)]}
        />
        <MBox
          label="DSCR"
          value={R.dscr.toFixed(2)}
          sub="Lenders need ≥1.25"
          lvl={lv(R.dscr, 1.25, 1.0)}
          bar={R.dscr}
          bMax={2.5}
          bGood={1.25}
          bWarn={1.0}
          tip={["DSCR = NOI ÷ Debt service", "= " + fmtD(R.noi) + " ÷ " + fmtD(R.annPmt), "= " + R.dscr.toFixed(2)]}
        />
        <MBox
          label="Break-even occ."
          value={fmtP(R.beOcc)}
          sub="Lower = safer"
          lvl={lv(R.beOcc, 70, 85, true)}
          bar={R.beOcc}
          bMax={110}
          bGood={70}
          bWarn={85}
          bInv
          tip={["Break-even = (Exp+Debt) ÷ GPI", "= " + fmtP(R.beOcc), "·", "<70% = comfortable buffer"]}
        />
      </div>
      {/* Break-even rent */}
      <div
        style={{
          padding: "9px 11px",
          background: R.beRent <= R.monRent / R.numU ? C.tealL : C.redL,
          border: "1px solid " + (R.beRent <= R.monRent / R.numU ? C.border : C.border),
          borderRadius: 10,
          marginBottom: 11,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: R.beRent <= R.monRent / R.numU ? C.teal : C.red, marginBottom: 3 }}>Break-even rent / unit</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: R.beRent <= R.monRent / R.numU ? C.teal : C.red }}>{fmtD(R.beRent)}/unit/mo</div>
            <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>min rent to cover all costs + mortgage</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.slate }}>Current rent</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtD(R.monRent / R.numU)}/unit</div>
            <div style={{ fontSize: 10, color: R.beRent <= R.monRent / R.numU ? C.teal : C.red }}>
              {R.beRent <= R.monRent / R.numU
                ? "+" + fmtD(R.monRent / R.numU - R.beRent) + " buffer"
                : "−" + fmtD(R.beRent - R.monRent / R.numU) + " shortfall"}
            </div>
          </div>
        </div>
      </div>
      {/* Acquisition snapshot — the per-door / per-sqft metrics pros scan first */}
      {(() => {
        const numU = R.numU || 1,
          tsf = S.units.reduce((s, u) => s + (u.sqft || 0), 0);
        const cells: [string, string][] = [
          ["Price / unit", fmtD(S.price / numU)],
          ["Price / sq ft", tsf ? fmtD(S.price / tsf) : "—"],
          ["Rent / sq ft", tsf ? "$" + (R.monRent / tsf).toFixed(2) + "/mo" : "—"],
          ["GRM", fmtX(R.grm)],
        ];
        return (
          <div className={`${s.panel} ${s.panelRad}`} style={{ marginBottom: 8 }}>
            <div className={s.panelHead} style={{ padding: "8px 13px", letterSpacing: "0.02em" }}>
              Acquisition
            </div>
            <div className={s.cols4} style={{ padding: "11px 13px", gap: 10 }}>
              {cells.map(([l2, v2]) => (
                <div key={l2}>
                  <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{l2}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.heading, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{v2}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {/* Quick checks */}
      <div className={s.panel}>
        <div className={s.panelHead} style={{ padding: "8px 13px" }}>
          Quick checks
        </div>
        <div style={{ padding: "6px 13px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {"1% rule (" + adjLbl + ")"}
              </div>
              <div style={{ fontSize: 10, color: C.slate }}>Monthly rent ÷ price</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 8px", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
              {fmtP(R.pct1)}
            </div>
            <Pill
              text={pct1Pass ? "Passes" : R.pct1 >= R.adjThresh * 0.85 ? "Close" : "Below"}
              lvl={pct1Pass ? "good" : R.pct1 >= R.adjThresh * 0.85 ? "warn" : "bad"}
            />
          </div>
        </div>
      </div>
      {R.vaEnabled && (
        <div style={{ padding: "9px 11px", background: C.goldL, border: "1px solid " + C.border, borderRadius: 10, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, marginBottom: 5 }}>VALUE-ADD AT STABILIZATION</div>
          <div className={s.cols3} style={{ gap: 8 }}>
            {[
              ["Cap rate", fmtP(R.vaCapRate)],
              ["Cash-on-cash", fmtP(R.vaCoc)],
              ["Monthly CF", fmtD(R.vaCF / 12) + "/mo"],
            ].map(([l2, v2]) => (
              <div key={l2} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.amber }}>{l2}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.amber }}>{v2}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
