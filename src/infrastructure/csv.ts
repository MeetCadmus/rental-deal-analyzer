// Deal <-> CSV (flat key/value) serialization. Pure.
type Pair = [string, unknown];

export function flattenState(obj: unknown, prefix = "", out: Pair[] = []): Pair[] {
  if (Array.isArray(obj)) {
    if (obj.length === 0) out.push([prefix, "[]"]);
    else obj.forEach((v, i) => flattenState(v, prefix + "." + i, out));
  } else if (obj && typeof obj === "object") {
    const ks = Object.keys(obj as Record<string, unknown>);
    if (ks.length === 0) out.push([prefix, "{}"]);
    else ks.forEach((k) => flattenState((obj as Record<string, unknown>)[k], prefix ? prefix + "." + k : k, out));
  } else {
    out.push([prefix, obj === null || obj === undefined ? "" : obj]);
  }
  return out;
}

export function coerceVal(v: string): unknown {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "[]") return [];
  if (v === "{}") return {};
  if (v !== "" && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

export function unflattenState(pairs: Pair[]): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  pairs.forEach(([path, val]) => {
    const parts = path.split(".");
    let cur: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i], nextIdx = /^\d+$/.test(parts[i + 1]);
      if (cur[key] === undefined || cur[key] === null || typeof cur[key] !== "object") cur[key] = nextIdx ? [] : {};
      cur = cur[key] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = coerceVal(String(val));
  });
  return root;
}

export function csvCell(s: unknown): string {
  const str = String(s);
  return /[",\n\r]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

export function stateToCSV(state: Record<string, unknown>): string {
  const { _name, _ts, ...clean } = state as Record<string, unknown>;
  void _name; void _ts;
  return "key,value\n" + flattenState(clean).map(([k, v]) => csvCell(k) + "," + csvCell(v)).join("\n");
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0, field = "", row: string[] = [], inq = false;
  while (i < text.length) {
    const c = text[i];
    if (inq) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inq = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inq = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function csvToState(text: string): Record<string, unknown> {
  const rows = parseCSV(text).filter((r) => r.length >= 2 && r[0] !== "");
  const pairs = rows.filter((r, i) => !(i === 0 && r[0] === "key" && r[1] === "value")).map((r) => [r[0], r[1]] as Pair);
  if (!pairs.length) throw new Error("no rows found");
  return unflattenState(pairs);
}
