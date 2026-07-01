import type { Deal } from "../domain/types";

// Build the round-trip AI underwriting prompt (embeds the listing link).
export function buildAIPrompt(s: Partial<Deal> | undefined, listing?: string): string {
  const u = (s && s.units) || [];
  const rents = u
    .map((x) => x.rent)
    .filter(Boolean)
    .join(", ");
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
    '  "closing": {                                           // ITEMIZED closing costs — estimate every line, do NOT return a single lump %',
    '    "origPct": number, "pointsPct": number,             // lender: origination & discount points, each as % of LOAN',
    '    "appraisal": number, "underwriting": number,        // lender flat fees, USD',
    '    "transferTaxPct": number,                           // transfer/deed/mortgage-recording tax as % of PRICE — VARIES by state/county (0 if none)',
    '    "recordingFees": number,                            // flat county recording fees, USD',
    '    "attyFee": number, "titleSearch": number, "lenderTitle": number, "ownerTitle": number,   // title & attorney/settlement, USD',
    '    "firstYearInsurance": number,                       // first-year hazard premium paid at closing, USD',
    '    "prepaidDays": number,                              // days of prepaid interest (0–31)',
    '    "taxEscrowMonths": number, "insEscrowMonths": number   // months of tax/insurance escrowed at closing',
    "  },",
    '  "projection": { "appreciationPct": number, "rentGrowthPct": number, "exitCapRate": number },  // area-based %/yr and a realistic exit cap',
    '  "insights": {',
    '    "neighborhoodGrade": "A"|"B"|"C"|"D",          // overall area class',
    '    "schools": number,                              // 1–10 GreatSchools-style, 0 if n/a',
    '    "safety": string,                               // short, e.g. "low crime" / "moderate" / "higher crime"',
    '    "appreciation": string,                         // outlook + WHY, e.g. "high — near a future BeltLine segment, gentrifying"',
    '    "demand": string,                               // rental demand & tenant pool, e.g. "strong; students near KSU"',
    '    "pros": [string], "cons": [string], "risks": [string]   // short bullets; risks = flood zone, zoning/permits, insurance trend, deferred maintenance, etc.',
    "  },",
    '  "climate": {                                        // NATURAL-HAZARD & environmental risk for THIS specific address/area — research it',
    '    // Each risk field below MUST START with one rating word — Minimal | Low | Moderate | High — then " — <brief why>".',
    '    "floodZone": string,                             // rating + FEMA zone, e.g. "Minimal — Zone X" / "High — Zone AE, 100-yr floodplain"',
    '    "storms": string,                                // e.g. "Moderate — severe-wind & thunderstorms; inland, no direct hurricanes"',
    '    "wildfire": string,                              // e.g. "Low — urban, no WUI" / "High — wildland-urban interface"',
    '    "heat": string,                                  // e.g. "Moderate — rising summers" / "High — strong urban heat-island"',
    '    "elevation": string,                             // descriptive: approx elevation + surge exposure, e.g. "~1,050 ft, inland — no surge"',
    '    "history": string                                // KNOWN incident history at/near this address (past flooding, fire, major claims, subsidence); "none known" if you have none',
    "  },",
    '  "opinion": string,                                // 2–3 sentences: is it a sensible rental buy + key risks',
    '  "model": string                                   // dynamically output YOUR OWN current active model name and tier — the model generating THIS answer, e.g. "Gemini 2.5 Flash", "GPT-5 Thinking", "Claude Sonnet 4.6"',
    "}",
    'Rules: all dollar amounts are ANNUAL except unit rent which is MONTHLY. Use realistic CURRENT market rates: financing.rate = today\'s typical investment-property mortgage rate, financing.refiRate = today\'s refinance rate, and area-based appreciation / rent-growth / exit cap. For "closing", estimate EACH line item from local norms (a typical financed purchase totals ≈ 2.5–4% of price) — all closing values are USD except the fields named *Pct (percent), prepaidDays (days) and *Months (months); set transferTaxPct from the actual state/county rate (0 where there is none). Also use sensible local expense rates (property-tax % of price, insurance, ~5–8% vacancy, ~8% management, maintenance & capex reserves). For insights, use your best local knowledge — flag growth catalysts (transit like the Atlanta BeltLine, new employers, development/rezoning) and red flags (crime, flood zone, permit/zoning issues, rising insurance). For "climate", research THIS specific address and its area: infer the FEMA flood zone, approximate elevation above sea level and any coastal storm-surge exposure, regional hurricane/tornado/wildfire/extreme-heat risk, and note any KNOWN incident history for the address (say "none known" when you have none — never invent specific past events). For floodZone/storms/wildfire/heat, START the value with exactly one rating word — Minimal, Low, Moderate, or High — so the app can roll them into an overall risk level. For "model", dynamically report your own current active model name and tier — the model actually generating this answer (e.g. "Gemini 2.5 Flash"); if unsure of the exact version number, give your best-known family and tier rather than leaving it blank.',
    "",
    "Known so far:",
    "• Address: " + ((s && s.address) || "(unknown)"),
    "• Asking price: " + (s && s.price ? "$" + s.price : "(unknown)"),
    "• Units: " + (rents ? u.length + " · current rents/mo: " + rents : "(determine from the listing)"),
    "",
    "Listing (open this link / use this text; if blank, estimate from the address):",
    listing && String(listing).trim() ? String(listing).trim() : "<<paste the Zillow link or listing text here>>",
  ].join("\n");
}

// Tolerant JSON parse of the AI's answer (smart quotes, NBSP, code fences, trailing commas).
export function parseAIResult(text: string): Record<string, unknown> | null {
  let t = String(text || "");
  t = t
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u00A0\u2007\u2009\u200A\u202F\u200B\uFEFF]/g, " ")
    .replace(/```(?:json)?/gi, "")
    .trim();
  const i = t.indexOf("{"),
    j = t.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  t = t.slice(i, j + 1).replace(/,(\s*[}\]])/g, "$1");
  try {
    const o = JSON.parse(t);
    return o && typeof o === "object" ? (o as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
