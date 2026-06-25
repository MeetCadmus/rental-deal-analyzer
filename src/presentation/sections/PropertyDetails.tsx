import { useId } from "react";
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
            id={notesId}
            value={S.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Seller motivated, rents below market, new roof 2022..."
            rows={2}
            className={s.textArea}
          />
        </div>
      </div>
    </Card>
  );
}
