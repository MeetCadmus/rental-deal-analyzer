import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { C } from "../theme/tokens";
import { fmtD } from "../../domain/money";
import { computeBase, computeYearly } from "../../domain";
import { calcDealScore } from "../../domain/finance/scoring";
import { fullState, dealTitle } from "../../domain/deal";
import { fmtWhen, relTime } from "../../domain/time";
import type { Deal } from "../../domain/types";
import s from "./DealsDrawer.module.css";

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
  // Compute metrics once per deal so we can sort/filter and render without recomputing.
  // Guarded on `open` so the panel stays cheap (and Radix can manage focus) when closed.
  const enriched = open
    ? deals.map((d) => {
        const fs = fullState(d),
          R = computeBase(fs),
          Y = computeYearly(fs, R),
          sc = calcDealScore(R, Y, fs.price);
        return { d, R, Y, sc };
      })
    : [];
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
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={`no-print ${s.overlay}`} />
        <Dialog.Content className={`no-print ${s.panel}`} aria-describedby={undefined}>
          <div className={s.head}>
            <Dialog.Title asChild>
              <span className={s.title}>
                My deals <span className={s.titleCount}>({deals.length})</span>
              </span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className={s.close}>✕ Close</button>
            </Dialog.Close>
          </div>
          <div className={s.toolbar}>
            <div className={s.searchRow}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by address / name…" className={s.search} />
              <button onClick={onNew} className={s.newBtn}>
                + New
              </button>
            </div>
            <div className={s.filterRow}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Sort deals" className={s.sort}>
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
                    className={s.gradeBtn}
                    style={{ border: "1.5px solid " + (on ? C.navy : C.border), background: on ? C.navy : C.bg, color: on ? "#fff" : C.slate }}
                  >
                    {g === "all" ? "All" : g}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={s.list}>
            {list.length === 0 && (
              <div className={s.empty}>
                No deals match{ql ? " “" + q + "”" : ""}
                {gradeF !== "all" ? " · grade " + gradeF : ""}.
              </div>
            )}
            {list.map(({ d, R, sc }) => {
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
                  className={s.card}
                  style={{ border: "1px solid " + (isA ? C.navy : C.border), background: isA ? C.hl : C.white }}
                >
                  <div className={s.cardTop}>
                    <div className={s.cardMain}>
                      {editing ? (
                        <input
                          ref={(el) => el?.focus()}
                          value={editVal}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditId(null);
                          }}
                          onBlur={commitEdit}
                          placeholder="Name this deal…"
                          className={s.editInput}
                        />
                      ) : (
                        <div className={s.cardName}>{isA ? liveTitle || dealTitle(d) : dealTitle(d)}</div>
                      )}
                      <div className={s.cardMeta}>
                        {fmtD(d.price)} · {(d.units || []).length} units{isA ? " · open now" : ""}
                      </div>
                      <div className={s.cardMeta2}>
                        ✎ {fmtWhen(d._ts)} <span style={{ opacity: 0.6 }}>· {relTime(d._ts || 0)}</span>
                        {d.aiSource ? <span> · {d.aiSource}</span> : ""}
                      </div>
                    </div>
                    <div className={s.cardRight}>
                      <span className={s.gradeBadge} style={{ background: sc.color }}>
                        {sc.grade}
                      </span>
                      <div className={s.cfVal} style={{ color: R.cf >= 0 ? C.teal : C.red }}>
                        {fmtD(R.cf / 12)}/mo
                      </div>
                    </div>
                  </div>
                  <div className={s.cardActions} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => startEdit(d)} className={s.xbtn}>
                      ✎ Rename
                    </button>
                    <button onClick={() => onDuplicate(d._id!)} className={s.xbtn}>
                      ⧉ Duplicate
                    </button>
                    <button onClick={() => onDelete(d._id!)} className={s.xbtn} style={{ color: C.red, borderColor: C.redL }}>
                      Delete
                    </button>
                    {/^https?:\/\//i.test(d.listingUrl || "") && (
                      <a
                        href={d.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.xbtn}
                        style={{ color: C.heading, textDecoration: "none", marginLeft: "auto" }}
                      >
                        ↗︎ Listing
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={s.footer}>
            <div className={s.footerRow}>
              <button onClick={onExportAll} className={s.footBtn}>
                Export all ({deals.length})
              </button>
              <button onClick={onImportAll} className={s.footBtn}>
                Import all
              </button>
            </div>
            <div className={s.footNote}>Backs up every deal to one JSON file (your deals live only in this browser). Import adds them to your library.</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { DealsDrawer };
