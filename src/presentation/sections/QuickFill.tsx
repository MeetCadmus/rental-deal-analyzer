import { useState } from "react";
import { C } from "../theme/tokens";
import { Card } from "../ui/Card";
import { SecLabel } from "../ui/primitives";
import { num } from "../../domain/money";
import { parseListing } from "../../infrastructure/listing";
import { buildAIPrompt, parseAIResult } from "../../infrastructure/ai";
import { validateAIResult } from "../../infrastructure/validation";
import type { Deal } from "../../domain/types";
import s from "./sections.module.css";

interface Msg {
  t: string;
  e?: number;
  prompt?: string;
}

// ── Quick fill (paste a listing / round-trip an AI estimate) ──
function QuickFill({ state, onListing, onAI, onSource }: { state: Deal; onListing: (pl: any) => void; onAI: (o: any) => void; onSource: (v: string) => void }) {
  const [lt, setLt] = useState("");
  const [at, setAt] = useState("");
  const [msg, setMsg] = useState<Msg | null>(null);
  const [done, setDone] = useState(""); // transient in-button confirmation key
  const flash = (k: string) => {
    setMsg(null);
    setDone(k);
    setTimeout(() => setDone((d) => (d === k ? "" : d)), 1600);
  };
  // One step: grab what we can from the link to fill the form, then copy the prompt
  // (the link is baked into it) to paste into any chat AI. No separate "fill" button.
  const copyPrompt = () => {
    const pl: any = parseListing(lt) || {};
    if (pl.address || num(pl.price) > 0 || pl.units || pl.url) onListing(pl);
    const merged: any = { ...state };
    if (pl.address) merged.address = pl.address;
    if (num(pl.price) > 0) merged.price = num(pl.price);
    const txt = buildAIPrompt(merged, lt);
    try {
      navigator.clipboard.writeText(txt).then(
        () => flash("copy"),
        () => setMsg({ t: "Select the prompt below and copy it manually.", prompt: txt }),
      );
    } catch (e) {
      setMsg({ t: "Copy not supported here — select & copy the prompt below:", prompt: txt });
    }
  };
  const doAI = () => {
    const o = parseAIResult(at);
    if (!o) {
      setMsg({ e: 1, t: "Couldn't read JSON — paste the AI's JSON answer." });
      return;
    }
    const v = validateAIResult(o);
    if (!v.ok) {
      setMsg({ e: 1, t: v.error });
      return;
    }
    onAI(v.data);
    flash("ai");
  };
  return (
    <Card title="Auto-fill — paste a listing & round-trip AI" icon="bolt" collapsible defaultOpen={false} storeKey="quickfill">
      <div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
          Paste a Zillow link to grab the address, then let any chat AI estimate rents, taxes &amp; expenses. Tip: hit <strong>＋ New deal</strong> first to
          keep this as its own saved property.
        </div>
        <SecLabel text="1 · Paste the Zillow link & copy the prompt" />
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
          No need to select text — just copy the page link.{" "}
          <span style={{ color: C.slate }}>
            iPhone: in the Zillow app tap <strong>Share → Copy</strong>; in Safari tap the address bar → <strong>Copy</strong>.
          </span>{" "}
          (You can paste full listing text instead if you have it.)
        </div>
        <textarea
          value={lt}
          onChange={(e) => setLt(e.target.value)}
          rows={2}
          placeholder="https://www.zillow.com/homedetails/…  (or paste listing text)"
          className={s.qfTextarea}
        />
        <div style={{ fontSize: 11, color: C.slate, margin: "6px 0" }}>
          One click grabs the address &amp; price from the link <em>and</em> copies a prompt with the link baked in — paste it into any chat AI.
        </div>
        <div style={{ marginBottom: 14 }}>
          <button onClick={copyPrompt} className={s.primaryBtn}>
            {done === "copy" ? "✓ Copied" : "Copy AI prompt"}
          </button>
        </div>

        <SecLabel text="2 · Paste the AI's answer" />
        <div style={{ fontSize: 11, color: C.slate, marginBottom: 6 }}>Run that prompt in your AI, then paste its JSON answer back here.</div>
        <textarea
          value={at}
          onChange={(e) => setAt(e.target.value)}
          rows={3}
          placeholder='Paste the AI&#39;s JSON answer here, e.g. {"price":620000,"units":[…],"expenses":{…},"opinion":"…"}'
          className={s.qfTextarea}
        />
        <div style={{ marginTop: 6 }}>
          <button onClick={doAI} className={s.primaryBtn}>
            {done === "ai" ? "✓ Applied" : "Apply AI estimate"}
          </button>
        </div>
        <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, color: C.slate, whiteSpace: "nowrap" }}>AI source</span>
          <input value={state.aiSource || ""} onChange={(e) => onSource(e.target.value)} placeholder="e.g. Gemini 2.5 Pro" className={s.smallTextInput} />
        </div>
        <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>
          Auto-set from the AI's answer — correct it here if it was vague (models often misname their version).
        </div>

        {msg && (
          <div className={s.msgBox} style={{ background: msg.e ? C.redL : C.tealL, color: msg.e ? C.red : C.teal }}>
            {msg.t}
            {msg.prompt && (
              <textarea
                readOnly
                value={msg.prompt}
                rows={5}
                onFocus={(e) => e.target.select()}
                className={s.qfTextarea}
                style={{ marginTop: 6, fontSize: 10 }}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export { QuickFill };
