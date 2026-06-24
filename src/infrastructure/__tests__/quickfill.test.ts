// @ts-nocheck — 1:1 port of legacy JS test; production code is strictly typed
import { test } from "vitest";
import assert from "node:assert";
import * as M from "../../test/barrel";

test("parseListing: pulls price, beds/baths, sqft, units, address from listing text", () => {
  const txt = `Charming fourplex for sale\n$620,000\n8 bd · 4 ba · 3,200 sqft\n123 Maple St, Atlanta, GA 30317\nGreat investment, 4 units fully rented.`;
  const p = M.parseListing(txt);
  assert.equal(p.price, 620000);
  assert.equal(p.beds, 8);
  assert.equal(p.bath, 4);
  assert.equal(p.sqft, 3200);
  assert.equal(p.units, 4);
  assert.match(p.address, /123 Maple St, Atlanta, GA 30317/);
});

test("addressFromUrl / parseListing: pull address from a Zillow URL", () => {
  const url = "https://www.zillow.com/homedetails/123-Maple-St-Atlanta-GA-30317/12345678_zpid/";
  assert.equal(M.addressFromUrl(url), "123 Maple St Atlanta, GA 30317");
  assert.equal(M.parseListing(url).address, "123 Maple St Atlanta, GA 30317");
  assert.equal(M.addressFromUrl("https://example.com/foo"), null);
});

test("parseListing: captures the listing URL", () => {
  const p = M.parseListing("Check it: https://www.zillow.com/homedetails/x/12_zpid/ — $500,000");
  assert.equal(p.url, "https://www.zillow.com/homedetails/x/12_zpid/");
});

test("buildAIPrompt: embeds the pasted listing/link", () => {
  const p = M.buildAIPrompt({ units: [] }, "https://www.zillow.com/homedetails/x/1_zpid/");
  assert.match(p, /zillow\.com\/homedetails/);
});

test("parseListing: infers unit count from 'duplex'/'triplex' words", () => {
  assert.equal(M.parseListing("Lovely duplex, $300,000").units, 2);
  assert.equal(M.parseListing("triplex investment").units, 3);
});

test("parseListing: ignores small dollar amounts as price", () => {
  // $1,800/mo rent shouldn't be picked as the price; $450,000 should
  const p = M.parseListing("Rent $1,800/mo. Asking $450,000.");
  assert.equal(p.price, 450000);
});

test("buildAIPrompt: embeds known fields and the JSON schema", () => {
  const s = { address: "5 Oak Ave", price: 500000, units: [{ rent: 1500 }, { rent: 1600 }] };
  const prompt = M.buildAIPrompt(s);
  assert.match(prompt, /5 Oak Ave/);
  assert.match(prompt, /\$500000/);
  assert.match(prompt, /maintenanceAnnual/);
  assert.match(prompt, /MARKET monthly rent/);
});

test("buildAIPrompt: asks the model to self-report its active name + tier", () => {
  const prompt = M.buildAIPrompt({ units: [] });
  assert.match(prompt, /current active model name and tier/i);
  assert.doesNotMatch(prompt, /blank model is correct/i);   // old "leave it blank" guidance is gone
});

test("parseAIResult: parses plain JSON", () => {
  const o = M.parseAIResult('{"price":620000,"units":[{"rent":1800}],"opinion":"ok"}');
  assert.equal(o.price, 620000);
  assert.equal(o.units[0].rent, 1800);
});

test("parseAIResult: tolerates code fences and surrounding prose", () => {
  const o = M.parseAIResult('Sure! Here you go:\n```json\n{ "price": 410000 }\n```\nHope that helps.');
  assert.equal(o.price, 410000);
});

test("parseAIResult: tolerates smart quotes, NBSP and trailing commas (copy-paste artifacts)", () => {
  const dirty = "{“price”: 620000, “units”:[{“rent”:1550,}],}";
  const o = M.parseAIResult(dirty);
  assert.ok(o, "should parse despite smart quotes/NBSP/trailing commas");
  assert.equal(o.price, 620000);
  assert.equal(o.units[0].rent, 1550);
});

test("parseAIResult: returns null on non-JSON", () => {
  assert.equal(M.parseAIResult("no json here"), null);
  assert.equal(M.parseAIResult(""), null);
});
