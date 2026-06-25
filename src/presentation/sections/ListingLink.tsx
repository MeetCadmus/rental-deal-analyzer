import { useEffect, useRef, useState } from "react";
import { C } from "../theme/tokens";

// ── Listing link: compact Open + Edit (input only while editing) ──
function ListingLink({ url, onChange }: { url: string; onChange: (v: string) => void }) {
  const [edit, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valid = /^https?:\/\//i.test(url || "");
  const b = { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" } as const;
  // Focus the URL field when the user reveals it (replaces autoFocus, which is a11y-flagged).
  useEffect(() => {
    if (edit) inputRef.current?.focus();
  }, [edit]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>Listing</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {valid && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...b, background: C.navy, color: "#fff", border: "1px solid " + C.navy, textDecoration: "none" }}
            >
              ↗︎ Open
            </a>
          )}
          <button onClick={() => setEdit((e) => !e)} style={{ ...b, background: C.white, color: C.slate, border: "1px solid " + C.border }}>
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
          style={{ padding: "7px 10px", fontSize: 13, border: "1px solid " + C.navy, borderRadius: 7, fontFamily: "inherit", color: C.text, outline: "none" }}
        />
      )}
    </div>
  );
}

export { ListingLink };
