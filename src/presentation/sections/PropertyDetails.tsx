import { useWorkspace } from "../../application/workspaceStore";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { ListingLink } from "./ListingLink";

// Address / listing link / notes for the working deal.
export function PropertyDetails() {
  const S = useWorkspace((s) => s.state);
  const set = useWorkspace((s) => s.set);
  return (
    <Card title="Property details" icon="pin" collapsible defaultOpen storeKey="prop">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>Address / MLS #</label>
          <input value={S.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="123 Maple St, Atlanta, GA 30308" style={{ padding: "7px 10px", fontSize: 13, border: "1px solid " + C.border, borderRadius: 7, fontFamily: "inherit", color: C.text, outline: "none" }} />
        </div>
        <ListingLink url={S.listingUrl} onChange={(v) => set("listingUrl", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>Notes / assumptions</label>
          <textarea value={S.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Seller motivated, rents below market, new roof 2022..." rows={2} style={{ padding: "7px 10px", fontSize: 12, border: "1px solid " + C.border, borderRadius: 7, fontFamily: "inherit", color: C.text, outline: "none", resize: "vertical", lineHeight: 1.5 }} />
        </div>
      </div>
    </Card>
  );
}
