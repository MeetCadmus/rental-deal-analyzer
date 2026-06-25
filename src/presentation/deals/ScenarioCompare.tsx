import { useState } from "react";
import { C } from "../theme/tokens";
import { Icon } from "../ui/Icon";
import { fmtD, fmtP, lv } from "../../domain/money";
import { computeBase, computeYearly } from "../../domain";
import { calcDealScore } from "../../domain/finance/scoring";
import { fullState, dealTitle } from "../../domain/deal";
import { fmtWhen } from "../../domain/time";
import type { Deal } from "../../domain/types";

function ScenarioCompare({ deals, activeId, currentState }: { deals: Deal[]; activeId: string; currentState: Deal }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("irr");
  const [q, setQ] = useState("");
  const [gradeF, setGradeF] = useState("all");
  const [pickSort, setPickSort] = useState("grade");
  const pool = (deals || []).filter((d) => d._id !== activeId);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  // Compute metrics for each selectable deal (only while the modal is open) so we can
  // search, sort, filter by grade, and show grade + cash flow on each row.
  const info = open
    ? pool.map((d) => {
        const st = fullState(d);
        const R = computeBase(st);
        const Y = computeYearly(st, R);
        return { d, st, R, Y, score: calcDealScore(R, Y) };
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
    return { ...c, R, Y, score: calcDealScore(R, Y) };
  });
  const rows: any[] = [
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
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Compare deals side by side"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
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
        }}
      >
        <Icon name="scale" size={14} />
        Compare
      </button>
      {open && (
        <div
          className="no-print"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13,31,60,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "24px 12px",
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 14, maxWidth: 900, width: "100%", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "var(--c-head)" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--c-headfg)",
                  letterSpacing: "0.04em",
                }}
              >
                <Icon name="scale" size={16} />
                Compare deals
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--c-headborder)",
                  color: "var(--c-headfg)",
                  borderRadius: "calc(var(--c-rad) - 4px)",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: C.slate, marginBottom: 8 }}>
                Pick saved deals to compare against your current deal
                {pool.length === 0 ? " — no other deals saved yet. Add one with ＋ New deal." : ". Search, filter by grade, or sort to find them:"}
              </div>
              {pool.length > 0 && (
                <div style={{ border: "1px solid " + C.border, borderRadius: 10, padding: "10px", marginBottom: 12, background: C.bg }}>
                  <div style={{ display: "flex", gap: 7, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search by name / address…"
                      style={{
                        flex: "1 1 150px",
                        minWidth: 0,
                        padding: "6px 10px",
                        fontSize: 13,
                        border: "1px solid " + C.border,
                        borderRadius: 8,
                        background: C.white,
                        color: C.text,
                        outline: "none",
                      }}
                    />
                    <select
                      value={pickSort}
                      onChange={(e) => setPickSort(e.target.value)}
                      title="Sort the list"
                      style={{
                        padding: "6px 8px",
                        fontSize: 12,
                        border: "1px solid " + C.border,
                        borderRadius: 8,
                        fontFamily: "inherit",
                        color: C.text,
                        background: C.white,
                      }}
                    >
                      {Object.keys(PSORT).map((k) => (
                        <option key={k} value={k}>
                          Sort: {PSORT[k][0]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {["all", "A", "B", "C", "D"].map((g) => {
                      const on = gradeF === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setGradeF(g)}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 20,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            border: "1.5px solid " + (on ? C.navy : C.border),
                            background: on ? C.navy : C.white,
                            color: on ? "#fff" : C.slate,
                          }}
                        >
                          {g === "all" ? "All" : g}
                        </button>
                      );
                    })}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: C.slate }}>{sel.length} selected</span>
                  </div>
                  <div style={{ maxHeight: 240, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", gap: 5 }}>
                    {picks.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "16px 8px" }}>No deals match.</div>}
                    {picks.map((c) => {
                      const on = sel.includes(c.d._id!);
                      return (
                        <button
                          key={c.d._id}
                          onClick={() => toggle(c.d._id!)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            width: "100%",
                            textAlign: "left",
                            padding: "7px 9px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            border: "1.5px solid " + (on ? C.navy : C.border),
                            background: on ? C.hl : C.white,
                          }}
                        >
                          <span
                            style={{
                              flexShrink: 0,
                              width: 18,
                              height: 18,
                              borderRadius: 5,
                              border: "1.5px solid " + (on ? C.navy : C.border),
                              background: on ? C.navy : C.white,
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {on ? "✓" : ""}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.heading,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {dealTitle(c.d)}
                            </span>
                            <span style={{ display: "block", fontSize: 10, color: C.muted }}>
                              {fmtD(c.st.price)} · cap {fmtP(c.R.capRate)} · {fmtWhen(c.d._ts)}
                            </span>
                          </span>
                          <span style={{ flexShrink: 0, textAlign: "right" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 9, background: c.score.color, color: "#fff" }}>
                              {c.score.grade}
                            </span>
                            <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: c.R.cf >= 0 ? C.teal : C.red, marginTop: 2 }}>
                              {fmtD(c.R.cf / 12)}/mo
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={selectAll}
                      disabled={!picks.length}
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 7,
                        border: "1px solid " + C.border,
                        background: C.white,
                        cursor: picks.length ? "pointer" : "default",
                        color: C.slate,
                        fontFamily: "inherit",
                        opacity: picks.length ? 1 : 0.5,
                      }}
                    >
                      + Select all{ql || gradeF !== "all" ? " shown" : ""} ({picks.length})
                    </button>
                    {sel.length > 0 && (
                      <button
                        onClick={() => setSel([])}
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 7,
                          border: "1px solid " + C.border,
                          background: C.white,
                          cursor: "pointer",
                          color: C.slate,
                          fontFamily: "inherit",
                        }}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>
              )}
              {ordered.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: C.slate }}>Rank by</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      fontSize: 12,
                      border: "1px solid " + C.border,
                      borderRadius: 7,
                      fontFamily: "inherit",
                      color: C.text,
                      background: C.white,
                    }}
                  >
                    {Object.keys(SORTS).map((k) => (
                      <option key={k} value={k}>
                        {SORTS[k][0]}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 10, color: C.muted }}>best → worst · ★ = best in row</span>
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: "7px 10px",
                          textAlign: "left",
                          borderBottom: "2px solid " + C.border,
                          position: "sticky",
                          left: 0,
                          background: C.white,
                        }}
                      ></th>
                      {ordered.map((c: any, i: number) => (
                        <th key={i} style={{ padding: "7px 10px", textAlign: "right", borderBottom: "2px solid " + C.border, minWidth: 120 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: c.cur ? C.heading : C.text, whiteSpace: "nowrap" }}>
                            {c.name}
                            {c.cur && (
                              <span style={{ fontSize: 9, marginLeft: 4, padding: "1px 5px", background: C.hl, color: C.heading, borderRadius: 4 }}>
                                current
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 10, background: c.score.color, color: "#fff" }}>
                              {c.score.grade} · {c.score.label}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => {
                      const bi = bestIdx(row);
                      return (
                        <tr key={ri} style={{ background: ri % 2 ? C.bg : C.white }}>
                          <td
                            style={{
                              padding: "6px 10px",
                              color: C.slate,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              position: "sticky",
                              left: 0,
                              background: ri % 2 ? C.bg : C.white,
                            }}
                          >
                            {row.l}
                          </td>
                          {ordered.map((c: any, i: number) => {
                            const col = row.lvl ? lvlCol[row.lvl(c)] : row.col ? row.col(c) : C.text;
                            const win = i === bi;
                            return (
                              <td
                                key={i}
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "right",
                                  fontWeight: win ? 800 : 600,
                                  color: col,
                                  fontVariantNumeric: "tabular-nums",
                                  whiteSpace: "nowrap",
                                  background: win ? C.tealL : "transparent",
                                }}
                              >
                                {win ? "★ " : ""}
                                {row.f(c)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {computed.length === 1 && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 12, textAlign: "center" }}>
                  Select one or more saved deals above to see them side-by-side.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { ScenarioCompare };
