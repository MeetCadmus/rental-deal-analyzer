import { z } from "zod";

// Validation for untrusted import boundaries: AI JSON, CSV files, and shared links.
// Schemas are permissive on purpose — inputs are best-effort and downstream `applyAI`
// / `fullState` already coerce values — but they reject pure garbage with a clear,
// user-facing message instead of silently producing an empty or broken deal.

export type Validated<T> = { ok: true; data: T } | { ok: false; error: string };

// numbers may arrive as JSON numbers or numeric strings; applyAI coerces via num().
const numish = z.union([z.number(), z.string()]).optional();

const aiUnitSchema = z.object({ beds: numish, bath: numish, sqft: numish, rent: numish }).loose();

export const aiResultSchema = z
  .object({
    address: z.string().optional(),
    price: numish,
    units: z.array(aiUnitSchema).optional(),
    expenses: z.record(z.string(), z.unknown()).optional(),
    financing: z.record(z.string(), z.unknown()).optional(),
    closing: z.record(z.string(), z.unknown()).optional(),
    closingPct: numish,
    projection: z.record(z.string(), z.unknown()).optional(),
    insights: z.record(z.string(), z.unknown()).optional(),
    opinion: z.string().optional(),
    model: z.string().optional(),
  })
  .loose();

export type AIResult = z.infer<typeof aiResultSchema>;

// True if the validated AI object carries at least one field we can actually apply.
function aiHasUsableFields(d: AIResult): boolean {
  return Boolean(
    d.address || d.price != null || (d.units && d.units.length) || d.expenses || d.financing || d.closing || d.projection || d.insights || d.opinion,
  );
}

export function validateAIResult(obj: unknown): Validated<AIResult> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, error: "That isn't a JSON object — paste the AI's JSON answer." };
  }
  const r = aiResultSchema.safeParse(obj);
  if (!r.success) {
    const i = r.error.issues[0];
    const where = i?.path?.length ? " (" + i.path.join(".") + ")" : "";
    return { ok: false, error: "The AI response didn't match the expected shape" + where + "." };
  }
  if (!aiHasUsableFields(r.data)) {
    return { ok: false, error: "The AI response had no usable fields — make sure you pasted the JSON answer." };
  }
  return { ok: true, data: r.data };
}

// A deal export (CSV / shared link) — any recognizable deal field qualifies.
const DEAL_KEYS = [
  "address",
  "price",
  "units",
  "financing",
  "expenses",
  "projection",
  "closing",
  "repairs",
  "partnership",
  "notes",
  "listingUrl",
  "otherIncome",
  "insights",
];

export const dealImportSchema = z
  .object({
    address: z.string().optional(),
    price: z.union([z.number(), z.string()]).optional(),
    units: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .loose();

export function validateDealImport(obj: unknown): Validated<Record<string, unknown>> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, error: "This doesn't look like a deal export." };
  }
  const r = dealImportSchema.safeParse(obj);
  if (!r.success) return { ok: false, error: "This file doesn't look like a deal export." };
  if (!Object.keys(obj).some((k) => DEAL_KEYS.includes(k))) {
    return { ok: false, error: "This file doesn't look like a deal export — no recognizable fields." };
  }
  return { ok: true, data: r.data };
}
