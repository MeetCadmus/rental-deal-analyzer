import { useState } from "react";
import { C } from "../theme/tokens";
import { Icon } from "../ui/Icon";
import { fmtD, fmtP, lv } from "../../domain/money";
import { computeBase, computeYearly } from "../../domain";
import { calcDealScore } from "../../domain/finance/scoring";
import { fullState, dealTitle } from "../../domain/deal";
import { fmtWhen } from "../../domain/time";
import type { Deal } from "../../domain/types";
import s from "./ScenarioCompare.module.css";

function ScenarioCompare({ deals, activeId, currentState }: { deals: Deal[]; activeId: string; currentState: Deal }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("irr");
  const [q, setQ] = useState("");
  const [gradeF, setGradeF] = useState("all");
  const [pickSort, setPickSort] = useState("grade");
  const [diffOnly, setDiffOnly] = useState(false);
  const pool = (deals || []).filter((d) => d._id !== activeId);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  // Compute metrics for each selectable deal (only while the modal is open) so we can
  // search, sort, filter by grade, and show grade + cash flow on each row.
  const info = open
    ? pool.map((d) => {
        const st = fullState(d);
        const R = computeBase(st);
        const Y = computeYearly(st, R);
        return { d, st, R, Y, score: calcDealScore(R, Y, st.price) };
      })
    : [];
  const PSORT: Record<string, [string, (c: any) => any]> = {
    grade: ["Grade", (c) => c.score.pct],
    cf: ["Cash flow", (c) => c.R.cf],
    cap: ["Cap rate", (c) => c.R.capRate],
    irr: ["IRR", (c) => c.Y.irr],
    price: ["Price", (c) => c.st.price],
    recent: ["Recently edited", (c) => c.d._ts || 0],
    name: ["Name (A–Z)", (c) => c.d],
  };
  const ql = q.trim().toLowerCase();
  let picks = info.filter((c) => (gradeF === "all" || c.score.grade === gradeF) && (!ql || dealTitle(c.d).toLowerCase().includes(ql)));
  picks =
    pickSort === "name"
      ? picks.sort((a, b) => dealTitle(a.d).localeCompare(dealTitle(b.d)))
      : picks.sort((a, b) => PSORT[pickSort][1](b) - PSORT[pickSort][1](a));
  const filteredIds = picks.map((c) => c.d._id!);
  const selectAll = () => setSel((s) => Array.from(new Set([...s, ...filteredIds])));
  const cols = [
    { name: "Current deal", st: currentState, cur: true },
    ...pool.filter((d) => sel.includes(d._id!)).map((d) => ({ name: dealTitle(d), st: fullState(d) })),
  ];
  const computed = cols.map((c: any) => {
    const R = computeBase(c.st);
    const Y = computeYearly(c.st, R);
    return { ...c, R, Y, score: calcDealScore(R, Y, c.st.price) };
  });
  const metricRows: any[] = [
    { l: "Purchase price", f: (c: any) => fmtD(c.st.price), v: (c: any) => c.st.price },
    { l: "Monthly CF", f: (c: any) => fmtD(c.R.cf / 12) + "/mo", col: (c: any) => (c.R.cf >= 0 ? C.teal : C.red), v: (c: any) => c.R.cf, best: "max" },
    {
      l: "CF / unit / mo",
      f: (c: any) => fmtD(c.R.cf / c.R.numU / 12),
      col: (c: any) => (c.R.cf >= 0 ? C.teal : C.red),
      v: (c: any) => c.R.cf / c.R.numU / 12,
      best: "max",
    },
    { l: "Cap rate", f: (c: any) => fmtP(c.R.capRate), lvl: (c: any) => lv(c.R.capRate, 7, 4.5), v: (c: any) => c.R.capRate, best: "max" },
    { l: "Cash-on-cash", f: (c: any) => fmtP(c.R.coc), lvl: (c: any) => lv(c.R.coc, 8, 4), v: (c: any) => c.R.coc, best: "max" },
    { l: "DSCR", f: (c: any) => c.R.dscr.toFixed(2), lvl: (c: any) => lv(c.R.dscr, 1.25, 1.0), v: (c: any) => c.R.dscr, best: "max" },
    { l: "Break-even occ.", f: (c: any) => fmtP(c.R.beOcc), lvl: (c: any) => lv(c.R.beOcc, 70, 85, true), v: (c: any) => c.R.beOcc, best: "min" },
    { l: "Est. IRR", f: (c: any) => fmtP(c.Y.irr), lvl: (c: any) => lv(c.Y.irr, 15, 10), v: (c: any) => c.Y.irr, best: "max" },
    { l: "Cash needed", f: (c: any) => fmtD(c.R.cashIn), v: (c: any) => c.R.cashIn, best: "min" },
    { l: "Total return", f: (c: any) => fmtD(c.Y.totRet), v: (c: any) => c.Y.totRet, best: "max" },
    { l: "AI source", f: (c: any) => c.st.aiSource || "—" },
  ];
  // Input assumptions behind the metrics — this is what differs when the same property
  // is filled by different AIs. `ei` reads an itemized expense line (null in quick mode).
  const ei = (c: any, k: string) => (c.R.expItems ? c.R.expItems[k] : null);
  const inputRows: any[] = [
    { l: "Gross rent / mo", f: (c: any) => fmtD(c.R.gpi / 12), v: (c: any) => c.R.gpi },
    { l: "Avg rent / unit / mo", f: (c: any) => fmtD(c.R.gpi / c.R.numU / 12), v: (c: any) => c.R.gpi / c.R.numU },
    { l: "Other income / yr", f: (c: any) => fmtD(c.R.otherInc || 0), v: (c: any) => c.R.otherInc || 0 },
    { l: "Vacancy", f: (c: any) => fmtP(c.st.expenses?.vacancyPct || 0), v: (c: any) => c.st.expenses?.vacancyPct || 0 },
    { l: "Down payment", f: (c: any) => fmtD(c.R.down) + " · " + fmtP(c.st.financing.downPct), v: (c: any) => c.st.financing.downPct },
    { l: "Interest rate", f: (c: any) => fmtP(c.st.financing.rate), v: (c: any) => c.st.financing.rate },
    { l: "Loan term", f: (c: any) => (c.st.financing.loanYears || 0) + " yrs", v: (c: any) => c.st.financing.loanYears || 0 },
    { l: "Loan amount", f: (c: any) => fmtD(c.R.loan), v: (c: any) => c.R.loan },
    { l: "Property taxes / yr", f: (c: any) => (ei(c, "taxes") == null ? "—" : fmtD(ei(c, "taxes"))), v: (c: any) => ei(c, "taxes") },
    { l: "Insurance / yr", f: (c: any) => (ei(c, "insurance") == null ? "—" : fmtD(ei(c, "insurance"))), v: (c: any) => ei(c, "insurance") },
    { l: "Management / yr", f: (c: any) => (ei(c, "mgmt") == null ? "—" : fmtD(ei(c, "mgmt"))), v: (c: any) => ei(c, "mgmt") },
    { l: "Maintenance / yr", f: (c: any) => (ei(c, "maint") == null ? "—" : fmtD(ei(c, "maint"))), v: (c: any) => ei(c, "maint") },
    { l: "CapEx / yr", f: (c: any) => (ei(c, "capex") == null ? "—" : fmtD(ei(c, "capex"))), v: (c: any) => ei(c, "capex") },
    { l: "Utilities / yr", f: (c: any) => (ei(c, "util") == null ? "—" : fmtD(ei(c, "util"))), v: (c: any) => ei(c, "util") },
    { l: "Total op. expenses / yr", f: (c: any) => fmtD(c.R.totExp), v: (c: any) => c.R.totExp },
    { l: "Expense ratio", f: (c: any) => fmtP(c.R.expRatio), v: (c: any) => c.R.expRatio },
    { l: "Closing costs", f: (c: any) => fmtD(c.R.ccTotal), v: (c: any) => c.R.ccTotal },
    { l: "Repairs / rehab", f: (c: any) => fmtD(c.R.repairCost), v: (c: any) => c.R.repairCost },
  ];
  const lvlCol: Record<string, string> = { good: C.teal, warn: C.amber, bad: C.red };
  const SORTS: Record<string, [string, (c: any) => any]> = {
    irr: ["IRR", (c) => c.Y.irr],
    grade: ["Grade", (c) => c.score.pct],
    cf: ["Cash flow", (c) => c.R.cf],
    cap: ["Cap rate", (c) => c.R.capRate],
    coc: ["Cash-on-cash", (c) => c.R.coc],
    dscr: ["DSCR", (c) => c.R.dscr],
    totRet: ["Total return", (c) => c.Y.totRet],
  };
  const sortV = (SORTS[sortBy] || SORTS.irr)[1];
  // keep the current deal pinned first; rank the rest best -> worst by the chosen metric
  const ordered = [...computed.filter((c: any) => c.cur), ...computed.filter((c: any) => !c.cur).sort((a: any, b: any) => sortV(b) - sortV(a))];
  const bestIdx = (row: any) => {
    if (!row.best || ordered.length < 2) return -1;
    let bi = 0;
    for (let i = 1; i < ordered.length; i++) {
      const better = row.best === "max" ? row.v(ordered[i]) > row.v(ordered[bi]) : row.v(ordered[i]) < row.v(ordered[bi]);
      if (better) bi = i;
    }
    return bi;
  };
  // Do the columns disagree on this row? (used to flag differing inputs). Numbers compare
  // with a small relative tolerance; nulls/strings compare exactly.
  const approxEq = (a: any, b: any) =>
    typeof a === "number" && typeof b === "number" ? Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b), 1) * 0.005 : a === b;
  const rowDiffers = (row: any) => ordered.length > 1 && ordered.some((c: any) => !approxEq(row.v(c), row.v(ordered[0])));
  const shownInputs = diffOnly ? inputRows.filter(rowDiffers) : inputRows;
  return (
    <>
      <button onClick={() => setOpen(true)} title="Compare deals side by side" className={s.trigger}>
        <Icon name="scale" size={14} />
        Compare
      </button>
      {open && (
        <div className={`no-print ${s.overlay}`} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className={s.modal}>
            <div className={s.modalHead}>
              <span className={s.modalTitle}>
                <Icon name="scale" size={16} />
                Compare deals
              </span>
              <button onClick={() => setOpen(false)} className={s.modalClose}>
                ✕ Close
              </button>
            </div>
            <div className={s.body}>
              <div className={s.intro}>
                Pick saved deals to compare against your current deal
                {pool.length === 0 ? " — no other deals saved yet. Add one with ＋ New deal." : ". Search, filter by grade, or sort to find them:"}
              </div>
              {pool.length > 0 && (
                <div className={s.picker}>
                  <div className={s.pickerRow}>
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name / address…" className={s.search} />
                    <select value={pickSort} onChange={(e) => setPickSort(e.target.value)} title="Sort the list" className={s.select}>
                      {Object.keys(PSORT).map((k) => (
                        <option key={k} value={k}>
                          Sort: {PSORT[k][0]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={s.gradeRow}>
                    {["all", "A", "B", "C", "D"].map((g) => {
                      const on = gradeF === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setGradeF(g)}
                          className={s.gradeBtn}
                          style={{ border: "1.5px solid " + (on ? C.navy : C.border), background: on ? C.navy : C.white, color: on ? "#fff" : C.slate }}
                        >
                          {g === "all" ? "All" : g}
                        </button>
                      );
                    })}
                    <span className={s.selCount}>{sel.length} selected</span>
                  </div>
                  <div className={s.pickList}>
                    {picks.length === 0 && <div className={s.noMatch}>No deals match.</div>}
                    {picks.map((c) => {
                      const on = sel.includes(c.d._id!);
                      return (
                        <button
                          key={c.d._id}
                          onClick={() => toggle(c.d._id!)}
                          className={s.pickItem}
                          style={{ border: "1.5px solid " + (on ? C.navy : C.border), background: on ? C.hl : C.white }}
                        >
                          <span className={s.checkbox} style={{ border: "1.5px solid " + (on ? C.navy : C.border), background: on ? C.navy : C.white }}>
                            {on ? "✓" : ""}
                          </span>
                          <span className={s.pickMain}>
                            <span className={s.pickName}>{dealTitle(c.d)}</span>
                            <span className={s.pickSub}>
                              {fmtD(c.st.price)} · cap {fmtP(c.R.capRate)} · {fmtWhen(c.d._ts)}
                            </span>
                          </span>
                          <span className={s.pickRight}>
                            <span className={s.pickGrade} style={{ background: c.score.color }}>
                              {c.score.grade}
                            </span>
                            <span className={s.pickCf} style={{ color: c.R.cf >= 0 ? C.teal : C.red }}>
                              {fmtD(c.R.cf / 12)}/mo
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className={s.pickActions}>
                    <button
                      onClick={selectAll}
                      disabled={!picks.length}
                      className={s.smallBtn}
                      style={{ cursor: picks.length ? "pointer" : "default", opacity: picks.length ? 1 : 0.5 }}
                    >
                      + Select all{ql || gradeF !== "all" ? " shown" : ""} ({picks.length})
                    </button>
                    {sel.length > 0 && (
                      <button onClick={() => setSel([])} className={s.smallBtn}>
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>
              )}
              {ordered.length > 1 && (
                <div className={s.rankRow}>
                  <span className={s.rankLabel}>Rank by</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={s.select} style={{ padding: "4px 8px", borderRadius: 7 }}>
                    {Object.keys(SORTS).map((k) => (
                      <option key={k} value={k}>
                        {SORTS[k][0]}
                      </option>
                    ))}
                  </select>
                  <span className={s.rankNote}>best → worst · ★ = best · ≠ = input differs</span>
                  <button
                    onClick={() => setDiffOnly((v) => !v)}
                    title="Show only the input rows whose values differ across deals"
                    className={s.smallBtn}
                    style={{ marginLeft: "auto", borderColor: diffOnly ? C.navy : C.border, color: diffOnly ? C.navy : C.slate }}
                  >
                    {diffOnly ? "✓ " : ""}Only inputs that differ
                  </button>
                </div>
              )}
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th className={s.thBlank}></th>
                      {ordered.map((c: any, i: number) => (
                        <th key={i} className={s.th}>
                          <div className={s.colName} style={{ color: c.cur ? C.heading : C.text }}>
                            {c.name}
                            {c.cur && <span className={s.currentChip}>current</span>}
                          </div>
                          <div style={{ marginTop: 3 }}>
                            <span className={s.colGrade} style={{ background: c.score.color }}>
                              {c.score.grade} · {c.score.label}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={ordered.length + 1} className={s.groupHead}>
                        Returns &amp; metrics
                      </td>
                    </tr>
                    {metricRows.map((row, ri) => {
                      const bi = bestIdx(row);
                      return (
                        <tr key={"m" + ri} style={{ background: ri % 2 ? C.bg : C.white }}>
                          <td className={s.rowLabel} style={{ background: ri % 2 ? C.bg : C.white }}>
                            {row.l}
                          </td>
                          {ordered.map((c: any, i: number) => {
                            const col = row.lvl ? lvlCol[row.lvl(c)] : row.col ? row.col(c) : C.text;
                            const win = i === bi;
                            return (
                              <td key={i} className={s.cell} style={{ fontWeight: win ? 800 : 600, color: col, background: win ? C.tealL : "transparent" }}>
                                {win ? "★ " : ""}
                                {row.f(c)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr>
                      <td colSpan={ordered.length + 1} className={s.groupHead}>
                        Inputs — rent, financing &amp; expenses
                      </td>
                    </tr>
                    {shownInputs.map((row, ri) => {
                      const differs = rowDiffers(row);
                      const stripe = ri % 2 ? C.bg : C.white;
                      const base = row.v(ordered[0]);
                      return (
                        <tr key={"i" + ri} style={{ background: stripe }}>
                          <td className={s.rowLabel} style={{ background: stripe, borderLeft: "3px solid " + (differs ? C.amber : "transparent") }}>
                            {row.l}
                            {differs && (
                              <span title="values differ across these deals" style={{ color: C.amber, fontWeight: 800, marginLeft: 5 }}>
                                ≠
                              </span>
                            )}
                          </td>
                          {ordered.map((c: any, i: number) => {
                            const diffCell = i > 0 && !approxEq(row.v(c), base);
                            return (
                              <td key={i} className={s.cell} style={{ fontWeight: 600, color: C.text, background: diffCell ? C.amberL : "transparent" }}>
                                {row.f(c)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {diffOnly && shownInputs.length === 0 && (
                      <tr>
                        <td colSpan={ordered.length + 1} style={{ padding: "8px 10px", fontSize: 11, color: C.muted }}>
                          All inputs match across these deals.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {computed.length === 1 && <div className={s.emptyHint}>Select one or more saved deals above to see them side-by-side.</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { ScenarioCompare };
