import { useWorkspace } from "../../application/workspaceStore";
import { fmtD } from "../../domain/money";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { MoneyInput } from "../ui/inputs";
import { Tog } from "../ui/primitives";
import s from "./sections.module.css";

// Optional repair / rehab budget, added to cash needed at close.
export function Repairs() {
  const S = useWorkspace((s) => s.state);
  const setRep = useWorkspace((s) => s.setRep);
  return (
    <Card
      title="Repairs & Rehab"
      icon="wrench"
      collapsible
      defaultOpen
      storeKey="repairs"
      summary={S.repairs.include ? (S.repairs.unknown ? "TBD" : fmtD(S.repairs.amount)) : undefined}
    >
      <Tog checked={S.repairs.include} onChange={(x) => setRep("include", x)} label="Include repair / rehab budget" sub="Added to cash needed at close" />
      {S.repairs.include && (
        <div style={{ marginTop: 9, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 9, alignItems: "end" }}>
          <MoneyInput
            label="Budget"
            value={S.repairs.unknown ? 0 : S.repairs.amount}
            onChange={(x) => setRep("amount", x)}
            sub={S.repairs.unknown ? "Marked as unknown" : fmtD(S.repairs.amount) + " added to cash in"}
          />
          <div className={s.col}>
            <label className={s.miniLabel}>Unknown?</label>
            <button
              onClick={() => setRep("unknown", !S.repairs.unknown)}
              className={s.toggleBtn}
              style={{
                border: "1px solid " + (S.repairs.unknown ? C.amber : C.border),
                background: S.repairs.unknown ? C.amberL : C.white,
                color: S.repairs.unknown ? C.amber : C.slate,
              }}
            >
              ? TBD
            </button>
          </div>
        </div>
      )}
      {S.repairs.include && S.repairs.unknown && <div className={s.warn}>⚠︎ Get inspection quotes. Budget 5–15% of price for older buildings.</div>}
    </Card>
  );
}
