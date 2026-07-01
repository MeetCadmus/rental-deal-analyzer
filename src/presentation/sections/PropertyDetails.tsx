import { useEffect, useId, useRef } from "react";
import { useWorkspace } from "../../application/workspaceStore";
import { Card } from "../ui/Card";
import { ListingLink } from "./ListingLink";
import s from "./sections.module.css";

// Address / listing link / notes for the working deal.
export function PropertyDetails() {
  const S = useWorkspace((st) => st.state);
  const set = useWorkspace((st) => st.set);
  const activeId = useWorkspace((st) => st.activeId);
  const addrId = useId();
  const notesId = useId();
  // Notes auto-grow to fit their content (iOS Safari ignores the drag handle, so this is
  // the only way to expand on iPhone) — UNTIL you drag the resize handle, after which we
  // leave your chosen height alone. Switching deals re-enables auto-fit for the new deal.
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const userSized = useRef(false);
  const lastAutoH = useRef(0);
  const autosizeNotes = () => {
    const el = notesRef.current;
    if (!el || userSized.current) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 42) + "px";
    lastAutoH.current = el.offsetHeight;
  };
  // A drag on the resize handle changes the height outside our autosize → respect it.
  const detectResize = () => {
    const el = notesRef.current;
    if (el && Math.abs(el.offsetHeight - lastAutoH.current) > 2) userSized.current = true;
  };
  useEffect(autosizeNotes, [S.notes]);
  useEffect(() => {
    userSized.current = false;
    autosizeNotes();
  }, [activeId]);
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
            onMouseUp={detectResize}
            placeholder="Seller motivated, rents below market, new roof 2022..."
            rows={2}
            className={s.textArea}
            style={{ resize: "vertical", overflow: "auto", minHeight: 42 }}
          />
        </div>
      </div>
    </Card>
  );
}
