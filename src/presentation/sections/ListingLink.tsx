import { useEffect, useRef, useState } from "react";
import s from "./sections.module.css";

// ── Listing link: compact Open + Edit (input only while editing) ──
function ListingLink({ url, onChange }: { url: string; onChange: (v: string) => void }) {
  const [edit, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valid = /^https?:\/\//i.test(url || "");
  // Focus the URL field when the user reveals it (replaces autoFocus, which is a11y-flagged).
  useEffect(() => {
    if (edit) inputRef.current?.focus();
  }, [edit]);
  return (
    <div className={s.listingWrap}>
      <div className={s.row}>
        <span className={s.fieldLabel}>Listing</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {valid && (
            <a href={url} target="_blank" rel="noopener noreferrer" className={`${s.linkBtn} ${s.linkBtnPrimary}`}>
              ↗︎ Open
            </a>
          )}
          <button onClick={() => setEdit((e) => !e)} className={`${s.linkBtn} ${s.linkBtnGhost}`}>
            {edit ? "Done" : valid ? "✎ Edit" : "+ Add link"}
          </button>
        </div>
      </div>
      {edit && (
        <input
          ref={inputRef}
          value={url || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") setEdit(false);
          }}
          placeholder="https://www.zillow.com/homedetails/…"
          inputMode="url"
          className={s.textInput}
          style={{ borderColor: "var(--c-navy)" }}
        />
      )}
    </div>
  );
}

export { ListingLink };
