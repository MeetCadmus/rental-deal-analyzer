import { num } from "../domain/money";

export interface ParsedListing {
  price?: number; beds?: number; bath?: number; sqft?: number;
  units?: number; address?: string; url?: string;
}

// Pull a street address out of a Zillow (or similar) /homedetails/<slug>/ URL.
export function addressFromUrl(text: string): string | null {
  const m = String(text || "").match(/\/homedetails\/([^/?#]+)/i);
  if (!m) return null;
  const parts = m[1].replace(/_zpid.*/i, "").split("-").filter(Boolean);
  const zip = parts[parts.length - 1], st = parts[parts.length - 2];
  if (/^\d{5}$/.test(zip) && /^[A-Za-z]{2}$/.test(st)) {
    const rest = parts.slice(0, -2).join(" ");
    return rest ? rest + ", " + st.toUpperCase() + " " + zip : st.toUpperCase() + " " + zip;
  }
  return null;
}

export function parseListing(text: string): ParsedListing {
  const t = String(text || "");
  const out: ParsedListing = {};
  const money = t.match(/\$\s?[\d,]{4,}/g);
  if (money) { for (const m of money) { const n = num(m.replace(/[$\s]/g, "")); if (n >= 10000) { out.price = n; break; } } }
  let m: RegExpMatchArray | null;
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:bd|beds?|bedrooms?)\b/i))) out.beds = parseFloat(m[1]);
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:ba|baths?|bathrooms?)\b/i))) out.bath = parseFloat(m[1]);
  if ((m = t.match(/([\d,]{3,})\s*(?:sq\.?\s?ft|sqft|square\s?feet)/i))) out.sqft = num(m[1]);
  if ((m = t.match(/(\d+)\s*units?\b/i))) out.units = parseInt(m[1], 10);
  else if (/\b(fourplex|quadplex|4-?plex)\b/i.test(t)) out.units = 4;
  else if (/\b(triplex|3-?plex)\b/i.test(t)) out.units = 3;
  else if (/\b(duplex|2-?plex)\b/i.test(t)) out.units = 2;
  if ((m = t.match(/(\d{1,6}\s+[^,\n]+,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5})/))) out.address = m[1].replace(/\s+/g, " ").trim();
  else { const a = addressFromUrl(t); if (a) out.address = a; }
  const urlm = t.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlm) out.url = urlm[0];
  return out;
}
