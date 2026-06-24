import { useRef, useState, useLayoutEffect } from "react";
import { editNumber } from "../../domain/money";

// Live thousands-grouping input logic: grouped display, caret preserved across comma
// insertion, tolerant of clearing/partials. Returns props to spread on <input>.
export function useGrouped(value: number, onChange: (n: number) => void, decimals: boolean, idle: (v: number) => string) {
  const ref = useRef<HTMLInputElement>(null);
  const [buf, setBuf] = useState<string | null>(null);
  const caret = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (caret.current != null && ref.current) {
      try { ref.current.setSelectionRange(caret.current, caret.current); } catch { /* ignore */ }
      caret.current = null;
    }
  });
  const display = buf != null ? buf : idle(value);
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const r = editNumber(e.target.value, e.target.selectionStart || 0, decimals);
    caret.current = r.caret;
    setBuf(r.display);
    onChange(r.value);
  };
  return { ref, display, onInput, clearBuf: () => setBuf(null) };
}
