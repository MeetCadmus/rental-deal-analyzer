import { useEffect, useId, useRef } from "react";
import { useWorkspace } from "../../application/workspaceStore";
import { Card } from "../ui/Card";
import { ListingLink } from "./ListingLink";
import s from "./sections.module.css";

// Address / listing link / notes for the working deal.
export function PropertyDetails() {
  const S = useWorkspace((st) => st.state);
  const set = useWorkspace((st) => st.set);
  const addrId = useId();
  const notesId = useId();
  // Auto-grow the notes field to fit its content. iOS Safari ignores the CSS resize
  // handle, so growing-to-content is the only way to expand notes on iPhone.
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const autosizeNotes = () => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 42) + "px";
  };
  useEffect(autosizeNotes, [S.notes]);
  return (
    <Card title="Property details" icon="pin" collapsible defaultOpen storeKey="prop">
      <div className={s.stack}>
        <div className={s.fieldCol}>
          <label htmlFor={addrId} className={s.fieldLabel}>
            Address / MLS #
          </label>
          <input
            id={addrId}
            value={S.address || ""}
            onChange={(e) => set("address", e.target.value)}
            placeholder="123 Maple St, Atlanta, GA 30308"
            className={s.textInput}
          />
        </div>
        <ListingLink url={S.listingUrl} onChange={(v) => set("listingUrl", v)} />
        <div className={s.fieldCol}>
          <label htmlFor={notesId} className={s.fieldLabel}>
            Notes / assumptions
          </label>
          <textarea
            ref={notesRef}
            id={notesId}
            value={S.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            onInput={autosizeNotes}
            placeholder="Seller motivated, rents below market, new roof 2022..."
            rows={2}
            className={s.textArea}
            style={{ resize: "none", overflow: "hidden", minHeight: 42 }}
          />
        </div>
      </div>
    </Card>
  );
}
