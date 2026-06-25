import { useEffect, useRef, useState } from "react";
import s from "./sections.module.css";

// ── Listing link: clearly shows it opens the external listing (and where). ──
function ListingLink({ url, onChange }: { url: string; onChange: (v: string) => void }) {
  const [edit, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valid = /^https?:\/\//i.test(url || "");
  // Show the destination host (e.g. "zillow.com") so it's obvious what "Open" does.
  let host = "";
  try {
    if (valid) host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }
  useEffect(() => {
    if (edit) inputRef.current?.focus();
  }, [edit]);
  return (
    <div className={s.listingWrap}>
      <div className={s.row}>
        <span className={s.fieldLabel}>Listing link</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {valid && !edit && (
            <a href={url} target="_blank" rel="noopener noreferrer" className={`${s.linkBtn} ${s.linkBtnPrimary}`} title={"Open listing in a new tab — " + url}>
              ↗ Open{host ? " · " + host : " listing"}
            </a>
          )}
          <button
            onClick={() => setEdit((e) => !e)}
            className={`${s.linkBtn} ${s.linkBtnGhost}`}
            title={valid ? "Edit the listing URL" : "Paste the property's listing URL"}
          >
            {edit ? "Done" : valid ? "✎ Edit" : "+ Add listing link"}
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
          placeholder="Paste a Zillow / Redfin / MLS listing URL"
          inputMode="url"
          className={s.textInput}
          style={{ borderColor: "var(--c-navy)" }}
        />
      )}
    </div>
  );
}

export { ListingLink };
