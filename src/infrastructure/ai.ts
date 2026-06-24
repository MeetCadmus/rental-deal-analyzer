import type { Deal } from "../domain/types";

// Build the round-trip AI underwriting prompt (embeds the listing link).
export function buildAIPrompt(s: Partial<Deal> | undefined, listing?: string): string {
  const u = (s && s.units) || [];
  const rents = u.map((x) => x.rent).filter(Boolean).join(", ");
  return [
    "You are a US rental-property underwriting assistant. Estimate realistic numbers for the property below and return ONLY a JSON object — no prose, no code fences — with exactly this shape:",
    "{",
    '  "address": string,',
    '  "price": number,                                  // purchase price, USD',
    '  "units": [ { "beds": number, "bath": number, "sqft": number, "rent": number } ],   // one per unit; rent = MARKET monthly rent',
    '  "expenses": {',
    '    "taxesAnnual": number, "insuranceAnnual": number,',
    '    "vacancyPct": number, "mgmtPct": number,',
    '    "maintenanceAnnual": number, "capexAnnual": number,',
    '    "utilitiesAnnual": number, "landscapingAnnual": number',
    "  },",
    '  "financing": { "rate": number, "refiRate": number },   // TODAY\x27s market % for an investment purchase loan & a refinance',
    '  "closingPct": number,                                  // estimated closing costs as % of price (e.g. 3)',
    '  "projection": { "appreciationPct": number, "rentGrowthPct": number, "exitCapRate": number },  // area-based %/yr and a realistic exit cap',
    '  "insights": {',
    '    "neighborhoodGrade": "A"|"B"|"C"|"D",          // overall area class',
    '    "schools": number,                              // 1–10 GreatSchools-style, 0 if n/a',
    '    "safety": string,                               // short, e.g. "low crime" / "moderate" / "higher crime"',
    '    "appreciation": string,                         // outlook + WHY, e.g. "high — near a future BeltLine segment, gentrifying"',
    '    "demand": string,                               // rental demand & tenant pool, e.g. "strong; students near KSU"',
    '    "pros": [string], "cons": [string], "risks": [string]   // short bullets; risks = flood zone, zoning/permits, insurance trend, deferred maintenance, etc.',
    "  },",
    '  "opinion": string,                                // 2–3 sentences: is it a sensible rental buy + key risks',
    '  "model": string                                   // dynamically output YOUR OWN current active model name and tier — the model generating THIS answer, e.g. "Gemini 2.5 Flash", "GPT-5 Thinking", "Claude Sonnet 4.6"',
    "}",
    "Rules: all dollar amounts are ANNUAL except unit rent which is MONTHLY. Use realistic CURRENT market rates: financing.rate = today's typical investment-property mortgage rate, financing.refiRate = today's refinance rate, closingPct ≈ 3, and area-based appreciation / rent-growth / exit cap. Also use sensible local expense rates (property-tax % of price, insurance, ~5–8% vacancy, ~8% management, maintenance & capex reserves). For insights, use your best local knowledge — flag growth catalysts (transit like the Atlanta BeltLine, new employers, development/rezoning) and red flags (crime, flood zone, permit/zoning issues, rising insurance). For \"model\", dynamically report your own current active model name and tier — the model actually generating this answer (e.g. \"Gemini 2.5 Flash\"); if unsure of the exact version number, give your best-known family and tier rather than leaving it blank.",
    "",
    "Known so far:",
    "• Address: " + ((s && s.address) || "(unknown)"),
    "• Asking price: " + (s && s.price ? "$" + s.price : "(unknown)"),
    "• Units: " + (rents ? u.length + " · current rents/mo: " + rents : "(determine from the listing)"),
    "",
    "Listing (open this link / use this text; if blank, estimate from the address):",
    (listing && String(listing).trim()) ? String(listing).trim() : "<<paste the Zillow link or listing text here>>",
  ].join("\n");
}

// Tolerant JSON parse of the AI's answer (smart quotes, NBSP, code fences, trailing commas).
export function parseAIResult(text: string): Record<string, unknown> | null {
  let t = String(text || "");
  t = t.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u00A0\u2007\u2009\u200A\u202F\u200B\uFEFF]/g, " ")
    .replace(/```(?:json)?/gi, "").trim();
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  t = t.slice(i, j + 1).replace(/,(\s*[}\]])/g, "$1");
  try { const o = JSON.parse(t); return (o && typeof o === "object") ? o as Record<string, unknown> : null; } catch { return null; }
}
