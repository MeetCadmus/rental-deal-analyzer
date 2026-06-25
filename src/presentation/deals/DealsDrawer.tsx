import { useState } from "react";
import { C } from "../theme/tokens";
import { fmtD } from "../../domain/money";
import { computeBase, computeYearly } from "../../domain";
import { calcDealScore } from "../../domain/finance/scoring";
import { fullState, dealTitle } from "../../domain/deal";
import { fmtWhen, relTime } from "../../domain/time";
import type { Deal } from "../../domain/types";

function DealsDrawer({
  open,
  onClose,
  deals,
  activeId,
  liveTitle,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onDuplicate,
  onExportAll,
  onImportAll,
}: {
  open: boolean;
  onClose: () => void;
  deals: Deal[];
  activeId: string;
  liveTitle: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExportAll: () => void;
  onImportAll: () => void;
}) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [gradeF, setGradeF] = useState("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  if (!open) return null;
  // Compute metrics once per deal so we can sort/filter and render without recomputing.
  const enriched = deals.map((d) => {
    const fs = fullState(d),
      R = computeBase(fs),
      Y = computeYearly(fs, R),
      sc = calcDealScore(R, Y);
    return { d, R, Y, sc };
  });
  const SORTS: Record<string, [string, ((c: any) => any) | null]> = {
    recent: ["Recently edited", (c) => c.d._ts || 0],
    grade: ["Grade", (c) => c.sc.pct],
    cf: ["Cash flow", (c) => c.R.cf],
    cap: ["Cap rate", (c) => c.R.capRate],
    irr: ["IRR", (c) => c.Y.irr],
    price: ["Price", (c) => c.d.price],
    name: ["Name (A–Z)", null],
  };
  const ql = q.trim().toLowerCase();
  let list = enriched.filter((c) => (gradeF === "all" || c.sc.grade === gradeF) && (!ql || dealTitle(c.d).toLowerCase().includes(ql)));
  list =
    sortBy === "name" ? list.sort((a, b) => dealTitle(a.d).localeCompare(dealTitle(b.d))) : list.sort((a, b) => SORTS[sortBy][1]!(b) - SORTS[sortBy][1]!(a));
  const startEdit = (d: Deal) => {
    setEditId(d._id ?? null);
    setEditVal(d._label || d.address || "");
  };
  const commitEdit = () => {
    if (editId != null) onRename(editId, editVal.trim());
    setEditId(null);
  };
  const xbtn = {
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid " + C.border,
    background: C.bg,
    color: C.slate,
    cursor: "pointer",
    fontFamily: "inherit",
  } as const;
  return (
    <div
      className="no-print"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px,100%)",
          height: "100%",
          background: C.bg,
          borderLeft: "1px solid " + C.border,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            background: "var(--c-head)",
            borderBottom: "1px solid " + C.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-headfg)", letterSpacing: "0.04em" }}>
            My deals <span style={{ opacity: 0.55, fontWeight: 400 }}>({deals.length})</span>
          </span>
          <button
            onClick={onClose}
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
        <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid " + C.border, background: C.white, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by address / name…"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "7px 10px",
                fontSize: 13,
                border: "1px solid " + C.border,
                borderRadius: 8,
                background: C.bg,
                color: C.text,
                outline: "none",
              }}
            />
            <button
              onClick={onNew}
              style={{
                padding: "7px 13px",
                borderRadius: 8,
                background: C.navy,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              + New
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Sort deals"
              style={{
                padding: "5px 8px",
                fontSize: 12,
                border: "1px solid " + C.border,
                borderRadius: 8,
                fontFamily: "inherit",
                color: C.text,
                background: C.bg,
              }}
            >
              {Object.keys(SORTS).map((k) => (
                <option key={k} value={k}>
                  Sort: {SORTS[k][0]}
                </option>
              ))}
            </select>
            {["all", "A", "B", "C", "D"].map((g) => {
              const on = gradeF === g;
              return (
                <button
                  key={g}
                  onClick={() => setGradeF(g)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 9px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    border: "1.5px solid " + (on ? C.navy : C.border),
                    background: on ? C.navy : C.bg,
                    color: on ? "#fff" : C.slate,
                  }}
                >
                  {g === "all" ? "All" : g}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px", WebkitOverflowScrolling: "touch" }}>
          {list.length === 0 && (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: "28px 12px" }}>
              No deals match{ql ? " “" + q + "”" : ""}
              {gradeF !== "all" ? " · grade " + gradeF : ""}.
            </div>
          )}
          {list.map(({ d, R, Y, sc }) => {
            const isA = d._id === activeId,
              editing = editId === d._id;
            return (
              <div
                key={d._id}
                onClick={() => {
                  if (!editing) {
                    onSelect(d._id!);
                    onClose();
                  }
                }}
                style={{
                  border: "1px solid " + (isA ? C.navy : C.border),
                  background: isA ? C.hl : C.white,
                  borderRadius: 10,
                  padding: "9px 11px",
                  marginBottom: 7,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editing ? (
                      <input
                        autoFocus
                        value={editVal}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditId(null);
                        }}
                        onBlur={commitEdit}
                        placeholder="Name this deal…"
                        style={{
                          width: "100%",
                          padding: "3px 6px",
                          fontSize: 13,
                          border: "1px solid " + C.navy,
                          borderRadius: 6,
                          fontFamily: "inherit",
                          color: C.text,
                          background: C.white,
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isA ? liveTitle || dealTitle(d) : dealTitle(d)}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      {fmtD(d.price)} · {(d.units || []).length} units{isA ? " · open now" : ""}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>
                      ✎ {fmtWhen(d._ts)} <span style={{ opacity: 0.6 }}>· {relTime(d._ts || 0)}</span>
                      {d.aiSource ? <span> · {d.aiSource}</span> : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 9, background: sc.color, color: "#fff" }}>{sc.grade}</span>
                    <div style={{ fontSize: 11, fontWeight: 700, color: R.cf >= 0 ? C.teal : C.red, marginTop: 3 }}>{fmtD(R.cf / 12)}/mo</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => startEdit(d)} style={xbtn}>
                    ✎ Rename
                  </button>
                  <button onClick={() => onDuplicate(d._id!)} style={xbtn}>
                    ⧉ Duplicate
                  </button>
                  <button onClick={() => onDelete(d._id!)} style={{ ...xbtn, color: C.red, borderColor: C.redL }}>
                    Delete
                  </button>
                  {/^https?:\/\//i.test(d.listingUrl || "") && (
                    <a
                      href={d.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...xbtn, color: C.heading, textDecoration: "none", marginLeft: "auto" }}
                    >
                      ↗︎ Listing
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flexShrink: 0, borderTop: "1px solid " + C.border, background: C.white, padding: "10px 12px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onExportAll}
              style={{
                flex: 1,
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid " + C.border,
                background: C.bg,
                color: C.slate,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Export all ({deals.length})
            </button>
            <button
              onClick={onImportAll}
              style={{
                flex: 1,
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid " + C.border,
                background: C.bg,
                color: C.slate,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Import all
            </button>
          </div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
            Backs up every deal to one JSON file (your deals live only in this browser). Import adds them to your library.
          </div>
        </div>
      </div>
    </div>
  );
}

export { DealsDrawer };
