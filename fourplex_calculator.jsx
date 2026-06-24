import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from "react";

const C={navy:"var(--c-navy)",navyM:"var(--c-navyM)",gold:"var(--c-gold)",goldL:"var(--c-goldL)",teal:"var(--c-teal)",tealL:"var(--c-tealL)",red:"var(--c-red)",redL:"var(--c-redL)",amber:"var(--c-amber)",amberL:"var(--c-amberL)",slate:"var(--c-slate)",border:"var(--c-border)",bg:"var(--c-bg)",white:"var(--c-white)",text:"var(--c-text)",heading:"var(--c-heading)",rowline:"var(--c-rowline)",grid:"var(--c-grid)",hl:"var(--c-hl)",tealS:"var(--c-tealS)",redS:"var(--c-redS)",amberS:"var(--c-amberS)",blueS:"var(--c-blueS)",muted:"var(--c-muted)"};
// ── Skins ──────────────────────────────────────────────────────────────────
// Four selectable looks. Each sets the colour tokens (light + dark) PLUS a few
// "treatment" vars (header background, corner radius, fonts, accent style) so the
// whole app re-skins from an html[data-skin] attribute. The bare :root is the
// "Classic" skin; the other three override via [data-skin="…"]. Treatment vars
// live in the light block and reference colour tokens, so they adapt to dark too.
const SKINS=[["calm","Calm"],["classic","Classic"],["ink","Ink"],["graphite","Graphite"],["heritage","Heritage"]];
const THEME_CSS=`
/* Classic — the original navy + gold (default) */
:root{--c-navy:#0D1F3C;--c-navyM:#1e3a6e;--c-gold:#C8922A;--c-goldL:#FDF3E3;--c-teal:#14705A;--c-tealL:#DFF2EC;--c-red:#9B2335;--c-redL:#FCEAEC;--c-amber:#8C5A0A;--c-amberL:#FDF3E3;--c-slate:#4A5568;--c-border:#E2E8F0;--c-bg:#F7F8FA;--c-white:#ffffff;--c-text:#1A202C;--c-heading:#0D1F3C;--c-page:#F7F8FA;--c-rowline:#F7FAFC;--c-grid:#EDF1F6;--c-hl:#EEF2FF;--c-tealS:#14705A;--c-redS:#9B2335;--c-amberS:#8C5A0A;--c-blueS:#185FA5;--c-muted:#718096;color-scheme:light;
  --c-rad:11px;--c-head:linear-gradient(90deg,var(--c-navy),var(--c-navyM));--c-fdisp:system-ui,-apple-system,sans-serif;--c-fui:system-ui,-apple-system,sans-serif;--c-headfg:#ffffff;--c-headborder:rgba(255,255,255,0.28);--c-ring:rgba(30,58,110,0.25);--c-emoji:inline;--c-bar:none;--c-deco:block;}
:root[data-theme="dark"]{--c-navy:#16325C;--c-navyM:#244a86;--c-gold:#E0A93C;--c-goldL:#33280F;--c-teal:#3FD0AE;--c-tealL:#123A30;--c-red:#F08699;--c-redL:#3A1A20;--c-amber:#E6B454;--c-amberL:#33280F;--c-slate:#9AA7BC;--c-border:#2C3A53;--c-bg:#161F33;--c-white:#1C2740;--c-text:#E6EAF2;--c-heading:#9CC0F2;--c-page:#0F1624;--c-rowline:#222C42;--c-grid:#222C42;--c-hl:#1B2A47;--c-tealS:#0E7A5F;--c-redS:#B53049;--c-amberS:#8A5A0E;--c-blueS:#2A63A6;--c-muted:#8593A8;color-scheme:dark;}

/* Ink & Ivory — editorial luxury (near-black ink on ivory, champagne accent) */
:root[data-skin="ink"]{--c-navy:#15120E;--c-navyM:#2A251D;--c-gold:#A6803F;--c-goldL:#F1E9D8;--c-teal:#4C6B55;--c-tealL:#E8EDE6;--c-red:#8C3A33;--c-redL:#F3E6E1;--c-amber:#8C6526;--c-amberL:#F1E8D6;--c-slate:#6B6258;--c-border:#E6DECF;--c-bg:#F2EBDD;--c-white:#FFFEFB;--c-text:#211C15;--c-heading:#15120E;--c-page:#F6F2EA;--c-rowline:#FBF8F1;--c-grid:#EFE8D9;--c-hl:#F3EDDF;--c-tealS:#4C6B55;--c-redS:#8C3A33;--c-amberS:#8C6526;--c-blueS:#3F5168;--c-muted:#9B9081;
  --c-rad:4px;--c-head:var(--c-navy);--c-fdisp:'Playfair Display',Georgia,serif;--c-fui:'Inter',system-ui,sans-serif;--c-headfg:#F6F2EA;--c-ring:rgba(166,128,63,0.35);--c-emoji:none;--c-bar:inline-block;--c-deco:none;}
:root[data-skin="ink"][data-theme="dark"]{--c-navy:#211C15;--c-navyM:#2E281F;--c-gold:#C9A45F;--c-goldL:#2E2616;--c-teal:#8AB492;--c-tealL:#1E2A21;--c-red:#E0998F;--c-redL:#2E1D19;--c-amber:#D2A458;--c-amberL:#2E2616;--c-slate:#A89E8E;--c-border:#373025;--c-bg:#1B1711;--c-white:#221D16;--c-text:#ECE5D7;--c-heading:#EAE0CF;--c-page:#16130E;--c-rowline:#221D16;--c-grid:#2A241C;--c-hl:#241F16;--c-tealS:#7CA585;--c-redS:#CC8077;--c-amberS:#C49A55;--c-blueS:#8195AE;--c-muted:#8C8270;}

/* Graphite Precision — BMW: cool graphite + steel-blue accent, crisp sans */
:root[data-skin="graphite"]{--c-navy:#1B1E23;--c-navyM:#2A2E35;--c-gold:#2C6FB3;--c-goldL:#E7EEF6;--c-teal:#2E7D74;--c-tealL:#E4EFEC;--c-red:#A23B36;--c-redL:#F3E5E3;--c-amber:#8A6D3B;--c-amberL:#EFE9DD;--c-slate:#5A636E;--c-border:#E3E7EC;--c-bg:#F4F6F8;--c-white:#FFFFFF;--c-text:#1B1E23;--c-heading:#1B1E23;--c-page:#F4F6F8;--c-rowline:#FAFBFC;--c-grid:#EDF1F5;--c-hl:#EAF1F8;--c-tealS:#2E7D74;--c-redS:#A23B36;--c-amberS:#8A6D3B;--c-blueS:#2C6FB3;--c-muted:#8A929C;
  --c-rad:6px;--c-head:var(--c-navy);--c-fdisp:'Inter',system-ui,sans-serif;--c-fui:'Inter',system-ui,sans-serif;--c-headfg:#FFFFFF;--c-ring:rgba(44,111,179,0.30);--c-emoji:none;--c-bar:inline-block;--c-deco:none;}
:root[data-skin="graphite"][data-theme="dark"]{--c-navy:#23272E;--c-navyM:#2E333B;--c-gold:#5B9BD8;--c-goldL:#16202B;--c-teal:#5FB3A8;--c-tealL:#142824;--c-red:#D98A84;--c-redL:#2B1A18;--c-amber:#C9A35E;--c-amberL:#262017;--c-slate:#A2ABB6;--c-border:#333A43;--c-bg:#15181C;--c-white:#1E2227;--c-text:#E6EAEF;--c-heading:#DCE6F2;--c-page:#101316;--c-rowline:#1E2227;--c-grid:#262C33;--c-hl:#1A222B;--c-tealS:#5FB3A8;--c-redS:#D98A84;--c-amberS:#C9A35E;--c-blueS:#5B9BD8;--c-muted:#8893A0;}

/* Heritage — Rolex: deep racing green + gold, classic serif */
:root[data-skin="heritage"]{--c-navy:#14342A;--c-navyM:#1E4A3B;--c-gold:#C2A24A;--c-goldL:#F4ECD6;--c-teal:#1F6B4F;--c-tealL:#E2EEE7;--c-red:#8A2E2E;--c-redL:#F1E3E1;--c-amber:#9A7B2E;--c-amberL:#F2EBD7;--c-slate:#5C5A4E;--c-border:#E2D9C5;--c-bg:#F1EBDD;--c-white:#FCFAF3;--c-text:#23271F;--c-heading:#14342A;--c-page:#F4EFE3;--c-rowline:#FAF6EC;--c-grid:#EBE3D2;--c-hl:#EFEAD9;--c-tealS:#1F6B4F;--c-redS:#8A2E2E;--c-amberS:#9A7B2E;--c-blueS:#2F6E5E;--c-muted:#928C7C;
  --c-rad:8px;--c-head:linear-gradient(90deg,var(--c-navy),var(--c-navyM));--c-fdisp:'Playfair Display',Georgia,serif;--c-fui:'Inter',system-ui,sans-serif;--c-headfg:#F4EFE3;--c-ring:rgba(194,162,74,0.35);--c-emoji:none;--c-bar:inline-block;--c-deco:none;}
:root[data-skin="heritage"][data-theme="dark"]{--c-navy:#143228;--c-navyM:#1C4435;--c-gold:#D4B45C;--c-goldL:#2C2614;--c-teal:#6FB58F;--c-tealL:#16271E;--c-red:#D98A86;--c-redL:#2C1B19;--c-amber:#CDA85A;--c-amberL:#2C2614;--c-slate:#A39E8C;--c-border:#313A30;--c-bg:#121A14;--c-white:#182019;--c-text:#E9E6D6;--c-heading:#E6DFC8;--c-page:#0E140E;--c-rowline:#182019;--c-grid:#212A22;--c-hl:#1A241B;--c-tealS:#6FB58F;--c-redS:#D98A86;--c-amberS:#CDA85A;--c-blueS:#7FA892;--c-muted:#8E8A78;}

/* Calm — Apple / Claude / Google: light neutral canvas, near-black text, ONE quiet
   clay accent, light section headers (no colour bars), soft corners, lots of air */
:root[data-skin="calm"]{--c-navy:#1F1E1C;--c-navyM:#2C2A27;--c-gold:#A86A47;--c-goldL:#F2E8E0;--c-teal:#4E7A5E;--c-tealL:#E9F0EB;--c-red:#A75A4D;--c-redL:#F4E7E4;--c-amber:#9A7B3F;--c-amberL:#F2ECDE;--c-slate:#6E6B64;--c-border:#E9E6DE;--c-bg:#F4F2EC;--c-white:#FFFFFF;--c-text:#2B2A28;--c-heading:#1F1E1C;--c-page:#FAF9F5;--c-rowline:#FBFAF6;--c-grid:#EFEBE2;--c-hl:#F3EFE7;--c-tealS:#4E7A5E;--c-redS:#A75A4D;--c-amberS:#9A7B3F;--c-blueS:#4C6585;--c-muted:#9C988E;
  --c-rad:12px;--c-head:var(--c-bg);--c-fdisp:'Inter',system-ui,-apple-system,sans-serif;--c-fui:'Inter',system-ui,-apple-system,sans-serif;--c-headfg:#1F1E1C;--c-headborder:rgba(0,0,0,0.13);--c-ring:rgba(168,106,71,0.30);--c-emoji:none;--c-bar:none;--c-deco:none;}
:root[data-skin="calm"][data-theme="dark"]{--c-navy:#1A1815;--c-navyM:#26231D;--c-gold:#C98A66;--c-goldL:#2C211A;--c-teal:#7FB48E;--c-tealL:#1C2A20;--c-red:#D9978B;--c-redL:#2C1C18;--c-amber:#CDA85A;--c-amberL:#2C2416;--c-slate:#A39E92;--c-border:#34302A;--c-bg:#211E18;--c-white:#1C1A15;--c-text:#ECE7DB;--c-heading:#F0EBDF;--c-page:#16140F;--c-rowline:#1C1A15;--c-grid:#262219;--c-hl:#221F17;--c-tealS:#7FB48E;--c-redS:#D9978B;--c-amberS:#CDA85A;--c-blueS:#8AA0BE;--c-muted:#8C8678;--c-headfg:#F0EBDF;--c-headborder:rgba(255,255,255,0.16);}

body{background:var(--c-page)!important;color:var(--c-text);font-family:var(--c-fui);transition:background .2s ease,color .2s ease;}
.skin-emoji{display:var(--c-emoji,inline)}
.skin-bar{display:var(--c-bar,none)}
.skin-deco{display:var(--c-deco,block)}
@media (pointer:coarse){
  .tap-sm{min-height:44px!important;min-width:44px!important}
  .del-row-cc{grid-template-columns:minmax(0,1fr) 110px 44px!important}
  .del-row-ex{grid-template-columns:minmax(0,1fr) 92px 86px 44px!important}
}
`;
const fmt =n=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(n||0);
const fmtD=n=>(n<0?"−$":"$")+fmt(Math.abs(Math.round(n||0)));
const fmtP=(n,d=1)=>isFinite(n)?n.toFixed(d)+"%":"—";
const fmtX=n=>isFinite(n)?n.toFixed(1)+"×":"—";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num =v=>parseFloat((v+"").replace(/,/g,""))||0;
function lv(v,g,w,inv=false){return !inv?(v>=g?"good":v>=w?"warn":"bad"):(v<=w?"good":v<=g?"warn":"bad");}

// Live thousands-grouping for number inputs, tolerant of partial typing ("", "1,", "7.").
function fmtGroup(raw,decimals){
  if(raw===null||raw===undefined)return "";
  let s=String(raw);
  const neg=/^\s*-/.test(s);
  s=s.replace(decimals?/[^0-9.]/g:/[^0-9]/g,"");
  let intp=s,dec=null;
  if(decimals){const i=s.indexOf(".");if(i>=0){intp=s.slice(0,i);dec=s.slice(i+1).replace(/\./g,"");}}
  intp=intp.replace(/^0+(?=\d)/,"");
  const g=intp===""?"":Number(intp).toLocaleString("en-US");
  let out=g;
  // While editing, keep a bare ".5" as ".5" — don't inject a leading "0". Injecting
  // it surprised users mid-edit and dropped the caret in front of the synthetic 0,
  // so pasting a digit produced e.g. "60.5". Committed values stringify with the 0
  // ("0.5"), and onBlur re-renders from the committed value, so it normalizes then.
  if(dec!==null)out=g+"."+dec;
  return out===""?(neg?"-":""):(neg?"-"+out:out);
}
// Pure editing step: given the raw input value + caret, return the grouped display,
// the new caret (kept relative to *significant* chars — digits, "." and "-", so it
// never lands on the wrong side of a decimal point), and the numeric value.
const SIG=/[0-9.\-]/;
function editNumber(raw,sel,decimals){
  const leftSig=(String(raw).slice(0,sel).match(/[0-9.\-]/g)||[]).length;
  const display=fmtGroup(raw,decimals);
  let pos=0,seen=0;
  while(pos<display.length&&seen<leftSig){if(SIG.test(display[pos]))seen++;pos++;}
  return {display,caret:pos,value:num(display)};
}
// Shared editing logic: shows grouped value, preserves caret across comma insertion,
// tolerates clearing/partials. Returns props to spread on <input>.
function useGrouped(value,onChange,decimals,idle){
  const ref=useRef(null);
  const[buf,setBuf]=useState(null);
  const caret=useRef(null);
  useLayoutEffect(()=>{if(caret.current!=null&&ref.current){try{ref.current.setSelectionRange(caret.current,caret.current);}catch(e){}caret.current=null;}});
  const display=buf!=null?buf:idle(value);
  const onInput=e=>{
    const r=editNumber(e.target.value,e.target.selectionStart||0,decimals);
    caret.current=r.caret;
    setBuf(r.display);onChange(r.value);
  };
  return {ref,display,onInput,clearBuf:()=>setBuf(null)};
}

// ── CSV round-trip (export / import full deal state) ───────────
function flattenState(obj,prefix,out){
  out=out||[];prefix=prefix||"";
  if(Array.isArray(obj)){if(obj.length===0)out.push([prefix,"[]"]);else obj.forEach((v,i)=>flattenState(v,prefix+"."+i,out));}
  else if(obj&&typeof obj==="object"){const ks=Object.keys(obj);if(ks.length===0)out.push([prefix,"{}"]);else ks.forEach(k=>flattenState(obj[k],prefix?prefix+"."+k:k,out));}
  else out.push([prefix,obj===null||obj===undefined?"":obj]);
  return out;
}
function coerceVal(v){
  if(v==="true")return true;if(v==="false")return false;
  if(v==="[]")return [];if(v==="{}")return {};
  if(v!==""&&/^-?\d+(\.\d+)?$/.test(v))return Number(v);
  return v;
}
function unflattenState(pairs){
  const root={};
  pairs.forEach(([path,val])=>{
    const parts=path.split(".");let cur=root;
    for(let i=0;i<parts.length-1;i++){
      const key=parts[i],nextIdx=/^\d+$/.test(parts[i+1]);
      if(cur[key]===undefined||cur[key]===null||typeof cur[key]!=="object")cur[key]=nextIdx?[]:{};
      cur=cur[key];
    }
    cur[parts[parts.length-1]]=coerceVal(val);
  });
  return root;
}
function csvCell(s){s=String(s);return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function stateToCSV(state){
  const{_name,_ts,...clean}=state;
  return "key,value\n"+flattenState(clean).map(([k,v])=>csvCell(k)+","+csvCell(v)).join("\n");
}
function parseCSV(text){
  const rows=[];let i=0,field="",row=[],inq=false;
  while(i<text.length){const c=text[i];
    if(inq){if(c==='"'){if(text[i+1]==='"'){field+='"';i+=2;continue;}inq=false;i++;continue;}field+=c;i++;continue;}
    if(c==='"'){inq=true;i++;continue;}
    if(c===','){row.push(field);field="";i++;continue;}
    if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field="";i++;continue;}
    field+=c;i++;
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  return rows;
}
function csvToState(text){
  const rows=parseCSV(text).filter(r=>r.length>=2&&r[0]!=="");
  const pairs=rows.filter((r,i)=>!(i===0&&r[0]==="key"&&r[1]==="value")).map(r=>[r[0],r[1]]);
  if(!pairs.length)throw new Error("no rows found");
  return unflattenState(pairs);
}
function downloadFile(name,text,type){
  const blob=new Blob([text],{type:type||"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),0);
}

// ── Quick fill: parse a pasted listing, build an AI prompt, parse the AI's JSON ──
// Pull a street address out of a Zillow (or similar) /homedetails/<slug>/ URL.
function addressFromUrl(text){
  const m=String(text||"").match(/\/homedetails\/([^/?#]+)/i);
  if(!m)return null;
  const parts=m[1].replace(/_zpid.*/i,"").split("-").filter(Boolean);
  const zip=parts[parts.length-1],st=parts[parts.length-2];
  if(/^\d{5}$/.test(zip)&&/^[A-Za-z]{2}$/.test(st)){
    const rest=parts.slice(0,-2).join(" ");
    return rest?rest+", "+st.toUpperCase()+" "+zip:st.toUpperCase()+" "+zip;
  }
  return null;
}
function parseListing(text){
  const t=String(text||"");const out={};
  const money=t.match(/\$\s?[\d,]{4,}/g);
  if(money){for(const m of money){const n=num(m.replace(/[$\s]/g,""));if(n>=10000){out.price=n;break;}}}
  let m;
  if((m=t.match(/(\d+(?:\.\d+)?)\s*(?:bd|beds?|bedrooms?)\b/i)))out.beds=parseFloat(m[1]);
  if((m=t.match(/(\d+(?:\.\d+)?)\s*(?:ba|baths?|bathrooms?)\b/i)))out.bath=parseFloat(m[1]);
  if((m=t.match(/([\d,]{3,})\s*(?:sq\.?\s?ft|sqft|square\s?feet)/i)))out.sqft=num(m[1]);
  if((m=t.match(/(\d+)\s*units?\b/i)))out.units=parseInt(m[1],10);
  else if(/\b(fourplex|quadplex|4-?plex)\b/i.test(t))out.units=4;
  else if(/\b(triplex|3-?plex)\b/i.test(t))out.units=3;
  else if(/\b(duplex|2-?plex)\b/i.test(t))out.units=2;
  if((m=t.match(/(\d{1,6}\s+[^,\n]+,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5})/)))out.address=m[1].replace(/\s+/g," ").trim();
  else {const a=addressFromUrl(t);if(a)out.address=a;}
  const urlm=t.match(/https?:\/\/[^\s"'<>]+/i);if(urlm)out.url=urlm[0];
  return out;
}
function buildAIPrompt(s,listing){
  const u=(s&&s.units)||[];const rents=u.map(x=>x.rent).filter(Boolean).join(", ");
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
'  },',
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
'  },',
'  "opinion": string,                                // 2–3 sentences: is it a sensible rental buy + key risks',
'  "model": string                                   // dynamically output YOUR OWN current active model name and tier — the model generating THIS answer, e.g. "Gemini 2.5 Flash", "GPT-5 Thinking", "Claude Sonnet 4.6"',
"}",
"Rules: all dollar amounts are ANNUAL except unit rent which is MONTHLY. Use realistic CURRENT market rates: financing.rate = today's typical investment-property mortgage rate, financing.refiRate = today's refinance rate, closingPct ≈ 3, and area-based appreciation / rent-growth / exit cap. Also use sensible local expense rates (property-tax % of price, insurance, ~5–8% vacancy, ~8% management, maintenance & capex reserves). For insights, use your best local knowledge — flag growth catalysts (transit like the Atlanta BeltLine, new employers, development/rezoning) and red flags (crime, flood zone, permit/zoning issues, rising insurance). For \"model\", dynamically report your own current active model name and tier — the model actually generating this answer (e.g. \"Gemini 2.5 Flash\"); if unsure of the exact version number, give your best-known family and tier rather than leaving it blank.",
"",
"Known so far:",
"• Address: "+((s&&s.address)||"(unknown)"),
"• Asking price: "+(s&&s.price?("$"+s.price):"(unknown)"),
"• Units: "+(rents?(u.length+" · current rents/mo: "+rents):"(determine from the listing)"),
"",
"Listing (open this link / use this text; if blank, estimate from the address):",
(listing&&String(listing).trim())?String(listing).trim():"<<paste the Zillow link or listing text here>>"
  ].join("\n");
}
function parseAIResult(text){
  let t=String(text||"");
  // Normalize copy-paste artifacts that break JSON.parse: smart quotes, unicode
  // spaces (NBSP etc.), code fences, and trailing commas.
  t=t.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g,'"')
     .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g,"'")
     .replace(/[\u00A0\u2007\u2009\u200A\u202F\u200B\uFEFF]/g," ")
     .replace(/```(?:json)?/gi,"").trim();
  const i=t.indexOf("{"),j=t.lastIndexOf("}");
  if(i<0||j<=i)return null;
  t=t.slice(i,j+1).replace(/,(\s*[}\]])/g,"$1");
  try{const o=JSON.parse(t);return (o&&typeof o==="object")?o:null;}catch(e){return null;}
}

// ── Atoms ─────────────────────────────────────────────────────
function MoneyInput({value,onChange,label,sub,small,hint}){
  const g=useGrouped(value,onChange,false,v=>v>0?fmtGroup(v,false):"");
  return <div style={{display:"flex",flexDirection:"column",gap:2}}>
    {label&&<label style={{fontSize:small?10:11,color:C.slate,fontWeight:600}}>{label}</label>}
    <div style={{display:"flex",alignItems:"center",border:"1px solid "+C.border,borderRadius:7,overflow:"hidden",background:C.white}}>
      <span style={{padding:"6px 7px 6px 9px",fontSize:11,color:C.slate,background:C.bg,borderRight:"1px solid "+C.border,flexShrink:0}}>$</span>
      <input ref={g.ref} type="text" inputMode="numeric" value={g.display} placeholder="0"
        onChange={g.onInput} onBlur={g.clearBuf}
        style={{flex:1,padding:"6px 10px",fontSize:small?12:13,border:"none",background:"transparent",color:C.text,outline:"none",minWidth:0}}/>
    </div>
    {(sub||hint)&&<span style={{fontSize:10,color:hint?"#0F6E56":C.muted}}>{sub||hint}</span>}
  </div>;
}
// Per-unit rent box ($ … /mo). Edit buffer so it clears cleanly and doesn't caret-jump.
function RentInput({value,onChange}){
  const g=useGrouped(value,onChange,false,v=>v>0?fmtGroup(v,false):"");
  return <div style={{display:"flex",alignItems:"center",border:"1px solid "+C.border,borderRadius:7,overflow:"hidden",background:C.white,flex:"1 1 auto",minWidth:0}}>
    <span style={{padding:"6px 6px 6px 9px",fontSize:12,color:C.slate,background:C.bg,borderRight:"1px solid "+C.border,flexShrink:0}}>$</span>
    <input ref={g.ref} type="text" inputMode="numeric" value={g.display} placeholder="0"
      onChange={g.onInput} onBlur={g.clearBuf}
      style={{flex:1,minWidth:0,padding:"6px 8px",fontSize:14,fontWeight:600,border:"none",background:"transparent",color:C.heading,outline:"none"}}/>
    <span style={{padding:"6px 8px 6px 2px",fontSize:11,color:C.slate,flexShrink:0}}>/mo</span>
  </div>;
}
function Field({label,prefix,suffix,value,onChange,min,max,step=1,sub,disabled,xs,placeholder,showZero,tip}){
  // Live thousands-grouping with decimals; tolerant of clearing/partials; clamps on blur.
  // value 0 shows as an empty field with the "0" placeholder (not a literal 0 you'd type into).
  const g=useGrouped(value,onChange,true,v=>(v===null||v===undefined||v===0)?"":fmtGroup(v,true));
  const onBlur=()=>{g.clearBuf();let n=value;if(min!=null&&n<min)onChange(min);else if(max!=null&&n>max)onChange(max);};
  return <div style={{display:"flex",flexDirection:"column",gap:2}}>
    {label&&<label style={{fontSize:xs?10:11,color:C.slate,fontWeight:600,display:"flex",alignItems:"center"}}>{label}{tip&&<Info lines={tip}/>}</label>}
    <div style={{display:"flex",alignItems:"center",border:"1px solid "+(disabled?"#e8e8e8":C.border),borderRadius:7,overflow:"hidden",background:disabled?"#F4F4F4":C.white}}>
      {prefix&&<span style={{padding:"6px 7px 6px 9px",fontSize:11,color:C.slate,background:C.bg,borderRight:"1px solid "+C.border,flexShrink:0}}>{prefix}</span>}
      <input ref={g.ref} type="text" inputMode="decimal" value={g.display} disabled={!!disabled} placeholder={placeholder||"0"}
        onChange={g.onInput} onBlur={onBlur}
        style={{flex:1,padding:"6px 8px",fontSize:xs?12:13,border:"none",background:"transparent",color:C.text,outline:"none",minWidth:0}}/>
      {suffix&&<span style={{padding:"6px 8px 6px 4px",fontSize:11,color:C.slate,flexShrink:0}}>{suffix}</span>}
    </div>
    {sub&&<span style={{fontSize:10,color:C.muted}}>{sub}</span>}
  </div>;
}
function Tog({checked,onChange,label,sub}){
  return <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
    <div onClick={()=>onChange(!checked)} style={{width:32,height:18,borderRadius:9,background:checked?C.navy:C.border,transition:"background 0.2s",position:"relative",flexShrink:0}}>
      <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:checked?16:2,transition:"left 0.2s"}}/>
    </div>
    <div><div style={{fontSize:11,fontWeight:600,color:C.text}}>{label}</div>
    {sub&&<div style={{fontSize:10,color:C.slate}}>{sub}</div>}</div>
  </label>;
}
function Pill({text,lvl}){
  const m={good:["#DFF2EC","#14705A"],warn:["#FDF3E3","#8C5A0A"],bad:["#FCEAEC","#9B2335"],n:["#F7F8FA","#4A5568"]};
  const[bg,fg]=m[lvl]||m.n;
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:bg,color:fg,fontWeight:700,whiteSpace:"nowrap"}}>{text}</span>;
}
// Minimal line-icon set (Lucide-style, stroke=currentColor) — replaces emoji so the
// chrome stays monochrome/refined and tints with the active accent.
const ICONS={
  pin:'<path d="M20 10c0 6-8 11-8 11s-8-5-8-11a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  home:'<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 10h5a1 1 0 0 1 1 1v10"/><path d="M3 21h18"/><path d="M7.5 8h2M7.5 12h2M7.5 16h2"/>',
  bank:'<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M12 3l8 5H4z"/>',
  file:'<path d="M13 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z"/><path d="M13 3v5h5"/><path d="M9 13h6M9 17h5"/>',
  percent:'<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>',
  wrench:'<path d="M14.6 6.4a3.6 3.6 0 0 0-4.9 4.9L3 18v3h3l6.7-6.7a3.6 3.6 0 0 0 4.9-4.9l-2.3 2.3-2.2-.5-.5-2.2 2.5-2.2Z"/>',
  trend:'<path d="M3 17 9 11l4 4 8-8"/><path d="M16 7h5v5"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 15v-3M12 15V8M17 15v-5"/>',
  bolt:'<path d="M13 2 4 13h6l-1 9 9-11h-6l1-8Z"/>',
  scale:'<path d="M12 4v17M7 21h10M5 7h14"/><path d="M5 7 2.6 12.5a3 3 0 0 0 4.8 0L5 7Z"/><path d="M19 7l-2.4 5.5a3 3 0 0 0 4.8 0L19 7Z"/>',
};
function Icon({name,size=15,style}){const p=ICONS[name];if(!p)return null;return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block",...style}} dangerouslySetInnerHTML={{__html:p}}/>;}
function Bar({val,max,good,warn,inv=false}){
  const pct=clamp((val/(max||1))*100,0,100);
  const col=!inv?(val>=good?C.teal:val>=warn?C.gold:C.red):(val<=warn?C.teal:val<=good?C.gold:C.red);
  return <div style={{height:4,background:C.grid,borderRadius:3,overflow:"hidden",marginTop:4}}>
    <div style={{width:pct+"%",height:"100%",background:col,transition:"width 0.4s"}}/>
  </div>;
}
function Info({lines,tint}){
  const[s,setS]=useState(false);
  const[pos,setPos]=useState(null);   // fixed coords, clamped to viewport so it never clips
  const ref=useRef(null);
  const show=()=>{const el=ref.current;try{const r=el.getBoundingClientRect();const vw=window.innerWidth;const W=Math.min(240,vw-16);let left=r.left+r.width/2-W/2;left=Math.max(8,Math.min(left,vw-W-8));const arrow=Math.max(12,Math.min(W-12,r.left+r.width/2-left));
    // Flip below the icon when there isn't room above (otherwise it clips off the top).
    const below=r.top<150;setPos({left,top:below?r.bottom+8:r.top-8,W,arrow,below});}catch(e){setPos(null);}setS(true);};
  const hide=()=>setS(false);
  // After a tap-to-open (touch), dismiss on any outside click or scroll — the panel
  // is position:fixed so it won't follow the page.
  useEffect(()=>{if(!s)return;const h=()=>setS(false);document.addEventListener("click",h);document.addEventListener("scroll",h,true);return ()=>{document.removeEventListener("click",h);document.removeEventListener("scroll",h,true);};},[s]);
  return <span style={{position:"relative",display:"inline-block",marginLeft:4}}>
    <span ref={ref} role="button" tabIndex={0} aria-label="More info" onMouseEnter={show} onMouseLeave={hide} onClick={e=>{e.stopPropagation();s?hide():show();}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();s?hide():show();}else if(e.key==="Escape")hide();}} style={{cursor:"pointer",color:tint||C.muted,fontSize:13,fontWeight:700,userSelect:"none",padding:"0 2px"}}>ⓘ</span>
    {s&&pos&&<div role="tooltip" style={{position:"fixed",left:pos.left,top:pos.top,transform:pos.below?"none":"translateY(-100%)",width:pos.W,background:"#0B1220",color:"#fff",padding:"10px 14px",borderRadius:10,fontSize:11,zIndex:1200,boxShadow:"0 10px 30px rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.22)",whiteSpace:"normal",pointerEvents:"none"}}>
      {lines.map((l,i)=><div key={i} style={{lineHeight:1.6,color:l.startsWith("=")?"#68D391":l.startsWith("·")?"#C2CCDA":"#fff",fontWeight:l.startsWith("=")?"700":"400"}}>{l}</div>)}
      <div style={{position:"absolute",...(pos.below?{top:-6}:{bottom:-6}),left:pos.arrow,transform:"translateX(-50%)",width:11,height:11,background:"#0B1220",...(pos.below?{borderLeft:"1px solid rgba(255,255,255,0.22)",borderTop:"1px solid rgba(255,255,255,0.22)",clipPath:"polygon(0 100%,100% 100%,50% 0)"}:{borderRight:"1px solid rgba(255,255,255,0.22)",borderBottom:"1px solid rgba(255,255,255,0.22)",clipPath:"polygon(0 0,100% 0,50% 100%)"})}}/>
    </div>}
  </span>;
}
function SmBtn({active,onClick,label}){
  return <button className="tap-sm" onClick={onClick} style={{padding:"2px 8px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:700,border:"1px solid "+(active?C.navy:C.border),background:active?C.navy:C.white,color:active?"#fff":C.slate}}>{label}</button>;
}
// Section card: gradient header with an emoji icon and an uppercase label. `right`
// renders an action on the header. When `collapsible`, the whole header toggles the
// body (with a chevron) so every section heading stays scannable while details hide.
// Remember a collapsible card's open/closed state across reloads (a view preference,
// app-wide — not per deal). Cards opt in by passing a stable `storeKey`.
const CARDS_KEY="re_cards_v1";
function loadCardState(){try{return JSON.parse(localStorage.getItem(CARDS_KEY))||{};}catch(e){return {};}}
function saveCardState(k,v){try{const m=loadCardState();m[k]=v;localStorage.setItem(CARDS_KEY,JSON.stringify(m));}catch(e){}}
function Card({title,icon,children,right,sub,summary,collapsible,defaultOpen=true,storeKey}){
  // Ink & Ivory skin: flat ink header with a champagne accent rule (no emoji),
  // hairline border. Optionally collapsible — the header toggles, a chevron shows
  // state. `summary` is an at-a-glance figure on the right (champagne); clicking it
  // still toggles. `right` is for interactive controls (it swallows the toggle click).
  const[open,setOpen]=useState(()=>{if(collapsible&&storeKey){const m=loadCardState();if(storeKey in m)return !!m[storeKey];}return defaultOpen;});
  const isOpen=collapsible?open:true;
  const toggle=()=>setOpen(o=>{const n=!o;if(storeKey)saveCardState(storeKey,n);return n;});
  return <div style={{border:"1px solid "+C.border,borderRadius:"var(--c-rad)",overflow:"hidden",marginBottom:12,background:C.white}}>
    <div onClick={collapsible?toggle:undefined} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 14px",background:"var(--c-head)",borderBottom:isOpen?"1px solid "+C.border:"none",cursor:collapsible?"pointer":"default"}}>
      {icon&&<Icon name={icon} size={15} style={{color:C.gold}}/>}
      <span style={{fontSize:11,fontWeight:600,color:"var(--c-headfg)",letterSpacing:"0.1em",textTransform:"uppercase"}}>{title}</span>
      {summary!=null&&<span style={{marginLeft:"auto",fontSize:11.5,fontWeight:600,color:C.gold,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums",letterSpacing:"0.02em"}}>{summary}</span>}
      {right&&<div onClick={collapsible?e=>e.stopPropagation():undefined} style={{marginLeft:summary!=null?10:"auto"}}>{right}</div>}
      {collapsible&&<span style={{marginLeft:(summary!=null||right)?10:"auto",flexShrink:0,fontSize:11,color:"var(--c-headfg)",opacity:0.7,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>}
    </div>
    {isOpen&&<div style={{padding:"15px",background:C.white}}>{children}</div>}
  </div>;
}
function SecLabel({text,right}){
  return <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:700,color:C.heading,letterSpacing:"0.07em",textTransform:"uppercase",borderBottom:"1px solid "+C.border,paddingBottom:4,marginBottom:8}}>
    <span>{text}</span>{right&&<span style={{fontWeight:400,color:C.slate,textTransform:"none",fontSize:11}}>{right}</span>}
  </div>;
}
function PLRow({label,value,neg,pos,bold,hl,indent,note}){
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px 5px "+(indent?"20px":"8px"),background:hl?"var(--c-hl)":"transparent",borderBottom:"1px solid var(--c-rowline)",fontWeight:bold?600:400,fontSize:12}}>
    <span style={{color:bold?C.text:C.slate}}>{label}{note&&<span style={{fontSize:10,color:C.muted,marginLeft:5}}>{note}</span>}</span>
    <span style={{color:neg?C.red:pos?"#2563EB":C.text,fontVariantNumeric:"tabular-nums"}}>{value}</span>
  </div>;
}
function MBox({label,value,sub,lvl,bar,bMax,bGood,bWarn,bInv,tip}){
  const col={good:C.teal,warn:C.amber,bad:C.red}[lvl]||C.slate;
  return <div style={{background:C.white,border:"1px solid "+C.border,borderRadius:10,padding:"10px 12px"}}>
    <div style={{fontSize:10,color:C.slate,fontWeight:700,letterSpacing:"0.04em",marginBottom:3,display:"flex",alignItems:"center"}}>{label}{tip&&<Info lines={tip}/>}</div>
    <div style={{fontSize:17,fontWeight:700,color:col,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>}
    {bar!==undefined&&<Bar val={bar} max={bMax} good={bGood} warn={bWarn} inv={bInv}/>}
  </div>;
}
// ── Closing costs ─────────────────────────────────────────────
const DCC={mode:"quick",quickPct:3,origPct:0.5,pointsPct:0,appraisal:800,creditReport:30,underwriting:750,attyFee:1200,titleSearch:275,lenderTitle:900,ownerTitle:1200,recordingFees:75,firstYearInsurance:1500,prepaidDays:15,taxEscrowMonths:3,insEscrowMonths:2,inspection:550,termite:100,survey:600,enviro:0,customItems:[]};
function calcCC(cc,price,loan,annTax,annIns,rate){
  if(!cc||cc.mode==="quick")return(price||0)*((cc?.quickPct||3)/100);
  const r=rate??7.25,l=loan||0,p=price||0;
  return l*(cc.origPct||0)/100+l*(cc.pointsPct||0)/100+(cc.appraisal||0)+(cc.creditReport||0)+(cc.underwriting||0)+Math.ceil(l/500)*1.5+Math.round(p/1000)+10+(cc.recordingFees||0)+(cc.attyFee||0)+(cc.titleSearch||0)+(cc.lenderTitle||0)+(cc.ownerTitle||0)+(cc.firstYearInsurance||0)+(cc.prepaidDays||0)*(l*r/100/365)+((annTax||0)/12)*(cc.taxEscrowMonths||0)+((annIns||0)/12)*(cc.insEscrowMonths||0)+(cc.inspection||0)+(cc.termite||0)+(cc.survey||0)+(cc.enviro||0)+(cc.customItems||[]).reduce((s,x)=>s+num(x.amt),0);
}
function ClosingCosts({cc,setCC,price,loan,annTax,annIns,rate,collapsible,defaultOpen}){
  const sf=(k,v)=>setCC(p=>({...p,[k]:v}));
  const l=loan||0,p=price||0,r=rate??7.25,aT=annTax||0,aI=annIns||0;
  const intangible=Math.ceil(l/500)*1.5,transfer=Math.round(p/1000),prepInt=(cc.prepaidDays||0)*(l*r/100/365);
  const taxEsc=(aT/12)*(cc.taxEscrowMonths||0),insEsc=(aI/12)*(cc.insEscrowMonths||0);
  const lT=l*(cc.origPct||0)/100+l*(cc.pointsPct||0)/100+(cc.appraisal||0)+(cc.creditReport||0)+(cc.underwriting||0);
  const gaT=intangible+transfer+10,titleT=(cc.attyFee||0)+(cc.titleSearch||0)+(cc.lenderTitle||0)+(cc.ownerTitle||0)+(cc.recordingFees||0);
  const prepT=(cc.firstYearInsurance||0)+prepInt+taxEsc+insEsc,ddT=(cc.inspection||0)+(cc.termite||0)+(cc.survey||0)+(cc.enviro||0);
  const custT=(cc.customItems||[]).reduce((s,x)=>s+num(x.amt),0),grand=lT+gaT+titleT+prepT+ddT+custT;
  const total=cc.mode==="quick"?p*(cc.quickPct||3)/100:grand;
  const addI=()=>setCC(p=>({...p,customItems:[...(p.customItems||[]),{name:"",amt:0}]}));
  const remI=i=>setCC(p=>({...p,customItems:p.customItems.filter((_,j)=>j!==i)}));
  const setI=(i,k,v)=>setCC(p=>{const a=[...p.customItems];a[i]={...a[i],[k]:v};return{...p,customItems:a};});
  return <Card title="Closing costs" icon="file" collapsible={collapsible} defaultOpen={defaultOpen} storeKey="closing" summary={collapsible?fmtD(total):undefined}>
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
      {[["quick","Quick %"],["detailed","Itemized"]].map(([id,lbl])=>{const on=cc.mode===id;return <button key={id} onClick={()=>sf("mode",id)} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,border:"1.5px solid "+(on?C.navy:C.border),background:on?C.navy:C.white,color:on?"#fff":C.slate}}>{lbl}</button>;})}
      <span style={{marginLeft:"auto",fontSize:12,color:C.slate}}>Total: <strong style={{color:C.heading}}>{fmtD(total)}</strong></span>
    </div>
    {cc.mode==="quick"&&<div>
      <Field label="Closing cost %" suffix="%" value={cc.quickPct||3} onChange={x=>sf("quickPct",x)} min={1} max={8} step={0.1} sub={fmtD(p*(cc.quickPct||3)/100)+" estimated"}/>
      <div style={{marginTop:9,background:C.bg,borderRadius:8,padding:"9px 12px",border:"1px solid "+C.border,fontSize:11}}>
        <div style={{fontWeight:700,color:C.heading,marginBottom:4}}>Atlanta buyer ranges</div>
        {[["Cash, no inspection","1.5–2%"],["Standard (financed)","2.5–3.5%"],["With inspection + survey","3–4%"],["Investment / multifamily","3–4.5%"]].map(([l2,r2])=><div key={l2} style={{display:"flex",justifyContent:"space-between",color:C.slate,marginBottom:2}}><span>{l2}</span><span style={{fontWeight:600,color:C.text}}>{r2}</span></div>)}
      </div>
    </div>}
    {cc.mode==="detailed"&&<div>
      <SecLabel text="Lender fees" right={"= "+fmtD(lT)}/>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:8,marginBottom:12}}>
        <Field label="Origination fee" suffix="% of loan" value={cc.origPct||0} onChange={x=>sf("origPct",x)} min={0} max={3} step={0.125} sub={fmtD(l*(cc.origPct||0)/100)} xs/>
        <Field label="Discount points" suffix="% of loan" value={cc.pointsPct||0} onChange={x=>sf("pointsPct",x)} min={0} max={4} step={0.125} sub={fmtD(l*(cc.pointsPct||0)/100)} xs/>
        <Field label="Appraisal" prefix="$" value={cc.appraisal||0} onChange={x=>sf("appraisal",x)} min={0} step={50} sub="$600–1,200" xs/>
        <Field label="Underwriting" prefix="$" value={cc.underwriting||0} onChange={x=>sf("underwriting",x)} min={0} step={50} sub="$500–1,500" xs/>
      </div>
      <SecLabel text="Georgia taxes (auto)" right={"= "+fmtD(gaT)}/>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
        {[["GA Intangible Tax",intangible,"$1.50/$500 of loan"],["GA Transfer Tax",transfer,"$1/$1,000 price"],["GA Mortgage Fee",10,"Flat $10"]].map(([l2,v2,n2])=><div key={l2} style={{display:"flex",justifyContent:"space-between",background:C.bg,padding:"5px 9px",borderRadius:7,border:"1px solid "+C.border,fontSize:11}}><span style={{color:C.slate,fontWeight:600}}>{l2} <span style={{fontSize:9,background:C.goldL,color:C.amber,borderRadius:3,padding:"1px 4px",fontWeight:700}}>AUTO</span> · <span style={{color:C.muted,fontWeight:400}}>{n2}</span></span><span style={{color:C.heading,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmtD(v2)}</span></div>)}
        <Field label="Recording fees" prefix="$" value={cc.recordingFees||0} onChange={x=>sf("recordingFees",x)} min={0} step={5} sub="~$75–100" xs/>
      </div>
      <SecLabel text="Title & attorney" right={"= "+fmtD(titleT)}/>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:8,marginBottom:12}}>
        <Field label="Closing attorney" prefix="$" value={cc.attyFee||0} onChange={x=>sf("attyFee",x)} min={0} step={50} sub="Required in GA" xs/>
        <Field label="Title search" prefix="$" value={cc.titleSearch||0} onChange={x=>sf("titleSearch",x)} min={0} step={25} xs/>
        <Field label="Lender's title ins." prefix="$" value={cc.lenderTitle||0} onChange={x=>sf("lenderTitle",x)} min={0} step={50} xs/>
        <Field label="Owner's title ins." prefix="$" value={cc.ownerTitle||0} onChange={x=>sf("ownerTitle",x)} min={0} step={50} xs/>
      </div>
      <SecLabel text="Prepaids & escrow" right={"= "+fmtD(prepT)}/>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:8,marginBottom:12}}>
        <MoneyInput label="First-year insurance" value={cc.firstYearInsurance||0} onChange={x=>sf("firstYearInsurance",x)} small/>
        <Field label="Prepaid interest" suffix="days" value={cc.prepaidDays||0} onChange={x=>sf("prepaidDays",x)} min={0} max={31} sub={fmtD(prepInt)+" auto"} xs/>
        <Field label="Tax escrow" suffix="mo" value={cc.taxEscrowMonths||0} onChange={x=>sf("taxEscrowMonths",x)} min={0} max={6} sub={fmtD(taxEsc)+" auto"} xs/>
        <Field label="Insurance escrow" suffix="mo" value={cc.insEscrowMonths||0} onChange={x=>sf("insEscrowMonths",x)} min={0} max={6} sub={fmtD(insEsc)+" auto"} xs/>
      </div>
      <SecLabel text="Inspection & DD" right={"= "+fmtD(ddT)}/>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:8,marginBottom:12}}>
        <Field label="Property inspection" prefix="$" value={cc.inspection||0} onChange={x=>sf("inspection",x)} min={0} step={50} sub="$400–700" xs/>
        <Field label="Pest / termite" prefix="$" value={cc.termite||0} onChange={x=>sf("termite",x)} min={0} step={25} xs/>
        <Field label="Survey" prefix="$" value={cc.survey||0} onChange={x=>sf("survey",x)} min={0} step={50} xs/>
        <Field label="Environmental" prefix="$" value={cc.enviro||0} onChange={x=>sf("enviro",x)} min={0} step={100} xs/>
      </div>
      {(cc.customItems||[]).length>0&&<SecLabel text="Other"/>}
      {(cc.customItems||[]).map((item,i)=><div key={i} className="del-row-cc" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 110px 28px",gap:7,marginBottom:7,alignItems:"end"}}>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>{i===0&&<label style={{fontSize:10,color:C.slate,fontWeight:600}}>Description</label>}<input value={item.name||""} onChange={e=>setI(i,"name",e.target.value)} placeholder="e.g. HOA fee" style={{padding:"6px 8px",fontSize:12,border:"1px solid "+C.border,borderRadius:7,fontFamily:"inherit",color:C.text,outline:"none"}}/></div>
        <Field label={i===0?"Amount":undefined} prefix="$" value={item.amt||0} onChange={x=>setI(i,"amt",x)} min={0} step={10} xs/>
        <button className="tap-sm" aria-label="Remove item" onClick={()=>remI(i)} style={{padding:"6px",background:C.redL,border:"1px solid "+C.border,borderRadius:7,cursor:"pointer",fontSize:12,color:C.red,marginTop:i===0?17:0}}>✕</button>
      </div>)}
      <button onClick={addI} style={{fontSize:11,padding:"5px 11px",borderRadius:7,border:"1px dashed "+C.border,background:C.white,cursor:"pointer",color:C.slate,fontFamily:"inherit"}}>+ Add item</button>
      <div style={{background:"linear-gradient(90deg,"+C.navy+","+C.navyM+")",borderRadius:9,padding:"10px 14px",color:"#fff",marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:11,opacity:0.7}}><span>Total closing costs</span><span>{p>0?(grand/p*100).toFixed(2):0}% of price</span></div>
        <div style={{fontSize:20,fontWeight:700,color:C.gold,marginBottom:7}}>{fmtD(grand)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:5}}>
          {[["Lender",lT],["GA taxes",gaT],["Title/atty",titleT],["Prepaids",prepT]].map(([l2,v2])=><div key={l2} style={{background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"4px 7px"}}><div style={{fontSize:9,opacity:0.65}}>{l2}</div><div style={{fontSize:11,fontWeight:700,color:C.gold}}>{fmtD(v2)}</div></div>)}
        </div>
      </div>
    </div>}
  </Card>;
}
// ── Expenses ──────────────────────────────────────────────────
const CLASS_PRESETS={
  new:{ratio:35,maintenance:75,capex:150,insurance:1200,label:"New build",hint:"<2yr, minimal issues"},
  B:{ratio:45,maintenance:250,capex:400,insurance:1300,label:"B-class",hint:"10–25yr"},
  C:{ratio:52,maintenance:350,capex:500,insurance:1800,label:"C-class",hint:"Old stock"},
  fixer:{ratio:55,maintenance:450,capex:600,insurance:2000,label:"Fixer-upper",hint:"Needs rehab"},
};
// Itemized expenses are all stored as ANNUAL dollars (v:2). maintMode/capexMode/taxMode
// "pct" variants express a % that yields an annual dollar amount.
const DEX={mode:"quick",ratio:45,vacancyPct:5.5,taxes:7800,taxMode:"fixed",taxPct:1.2,insurance:4600,mgmtPct:8,maintenance:6000,maintMode:"fixed",capex:6000,capexMode:"fixed",utilities:1800,landscaping:1200,accounting:800,misc:500,customExpenses:[],propertyClass:"B",v:2};
// Convert a pre-v2 expenses object (maintenance/capex as $/unit/mo, utilities/landscaping
// as $/mo) into annual dollars so saved deals keep the same numbers.
function migrateExpenses(raw,unitCount){
  if(!raw)return null;
  if(raw.v===2)return raw;
  const u=unitCount||1;
  return {...raw,
    maintenance:Math.round((raw.maintenance||0)*u*12),
    capex:Math.round((raw.capex||0)*u*12),
    utilities:Math.round((raw.utilities||0)*12),
    landscaping:Math.round((raw.landscaping||0)*12),
    v:2};
}

function calcExp(ex,units,egi,price){
  if(!ex||ex.mode==="quick")return{totExp:egi*((ex?.ratio||45)/100),items:null};
  const p=price||0;
  const taxAmt=ex.taxMode==="pct"?Math.round(p*(ex.taxPct||1.2)/100):(ex.taxes||0);
  const maintAmt=ex.maintMode==="pct"?Math.round(p*(ex.maintPct||1)/100):(ex.maintenance||0);
  const capexAmt=ex.capexMode==="pct"?Math.round(p*(ex.capexPct||0.5)/100):(ex.capex||0);
  const items={taxes:taxAmt,insurance:ex.insurance||0,mgmt:Math.round(egi*(ex.mgmtPct||0)/100),maint:maintAmt,capex:capexAmt,util:ex.utilities||0,landscape:ex.landscaping||0,acctg:ex.accounting||0,misc:ex.misc||0,custom:(ex.customExpenses||[]).reduce((s,e)=>s+(e.period==="monthly"?e.amt*12:e.amt),0)};
  return{totExp:Object.values(items).reduce((s,x)=>s+x,0),items};
}
function Expenses({ex,setEx,units,egi,price,collapsible,defaultOpen}){
  const sf=(k,v)=>setEx(p=>({...p,[k]:v}));
  const u=units||1;
  const{totExp,items}=calcExp(ex,units,egi,price);
  // Presets store per-unit/mo (maint/capex) & per-unit/yr (insurance); applied as annual totals.
  const applyClass=cls=>{const p=CLASS_PRESETS[cls];if(!p)return;if(ex.mode==="quick"){setEx(prev=>({...prev,ratio:p.ratio,propertyClass:cls}));}else{setEx(prev=>({...prev,propertyClass:cls,ratio:p.ratio,insurance:p.insurance*u,maintenance:p.maintenance*u*12,capex:p.capex*u*12,taxes:Math.round((price||0)*1.2/100),taxMode:"fixed",maintMode:"fixed",capexMode:"fixed",v:2}));}};
  // A class is "active" only while the current values still match it — edit a field
  // (or drag the ratio) and it falls back to "Custom".
  const activeCls=(()=>{for(const[cls,p]of Object.entries(CLASS_PRESETS)){
    if(ex.mode==="quick"){if((ex.ratio||45)===p.ratio)return cls;}
    else if((ex.maintenance||0)===p.maintenance*u*12&&(ex.capex||0)===p.capex*u*12&&(ex.insurance||0)===p.insurance*u)return cls;
  }return null;})();
  const addCE=()=>setEx(p=>({...p,customExpenses:[...(p.customExpenses||[]),{name:"",amt:0,period:"annual"}]}));
  const remCE=i=>setEx(p=>({...p,customExpenses:p.customExpenses.filter((_,j)=>j!==i)}));
  const setCE=(i,k,v)=>setEx(p=>{const a=[...p.customExpenses];a[i]={...a[i],[k]:v};return{...p,customExpenses:a};});
  return <Card title="Vacancy & Expenses" icon="percent" collapsible={collapsible} defaultOpen={defaultOpen} storeKey="expenses" summary={collapsible?fmtD(totExp)+"/yr":undefined}>
    {/* Property class preset (a starting point — clears to "Custom" once edited) */}
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:10,fontWeight:700,color:C.slate}}>Start from a property class</span>
        <span style={{fontSize:10,fontWeight:700,padding:"1px 8px",borderRadius:10,background:activeCls?C.tealL:C.bg,color:activeCls?C.teal:C.muted,border:"1px solid "+C.border}}>{activeCls?CLASS_PRESETS[activeCls].label:"Custom"}</span>
      </div>
      <div style={{display:"flex",gap:5}}>
        {Object.entries(CLASS_PRESETS).map(([cls,p])=>{const on=activeCls===cls;return <button key={cls} onClick={()=>applyClass(cls)} style={{flex:1,padding:"5px 4px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid "+(on?C.navy:C.border),background:on?C.navy:C.white,color:on?"#fff":C.slate}}>
          <div style={{fontSize:10,fontWeight:700}}>{p.label}</div>
          <div style={{fontSize:9,opacity:0.7}}>{p.hint}</div>
        </button>;})}
      </div>
      <div style={{fontSize:9,color:C.muted,marginTop:4}}>{activeCls
        ?(ex.mode==="quick"?"Sets the expense ratio. Drag the ratio below to customize.":"Filled all expense fields. Edit any to customize.")
        :"Custom values — tap a class to prefill "+(ex.mode==="quick"?"its typical ratio.":"typical expense fields.")}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
      {[["quick","Quick %"],["detailed","Itemized"]].map(([id,lbl])=>{const on=ex.mode===id;return <button key={id} onClick={()=>sf("mode",id)} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,border:"1.5px solid "+(on?C.navy:C.border),background:on?C.navy:C.white,color:on?"#fff":C.slate}}>{lbl}</button>;})}
      <span style={{marginLeft:"auto",fontSize:11,color:C.slate}}>Total: <strong style={{color:C.heading}}>{fmtD(totExp)}/yr</strong></span>
    </div>
    <div style={{marginBottom:ex.mode==="quick"?10:12}}>
      <Field label="Vacancy rate" suffix="%" value={ex.vacancyPct||0} onChange={x=>sf("vacancyPct",x)} min={0} max={30} step={0.5} sub="ATL avg ~5.9%"/>
    </div>
    {ex.mode==="quick"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <label style={{fontSize:11,fontWeight:600,color:C.slate}}>Expense ratio (% of EGI/yr)</label>
        <span style={{fontSize:14,fontWeight:700,color:C.heading}}>{ex.ratio||45}% = {fmtD(egi*(ex.ratio||45)/100)}/yr</span>
      </div>
      <input type="range" min={30} max={60} step={1} value={ex.ratio||45} onChange={e=>sf("ratio",parseInt(e.target.value))} style={{width:"100%",accentColor:C.navy,cursor:"pointer"}}/>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.slate,marginTop:2}}><span>30% new/stable</span><span>45% typical ATL</span><span>60% old/C-class</span></div>
      <div style={{marginTop:8,padding:"7px 10px",background:C.goldL,borderRadius:7,border:"1px solid "+C.border,fontSize:10,color:C.amber}}>Covers all costs: taxes, insurance, management, repairs, CapEx, utilities. Switch to Itemized for full control.</div>
    </div>}
    {ex.mode==="detailed"&&items&&(()=>{
      const perMo=v=>"≈ "+fmtD(v/12)+"/mo";
      const perUnitMo=v=>u>0?"≈ "+fmtD(v/u/12)+"/unit/mo":"";
      const taxIns=items.taxes+items.insurance, maintRes=items.maint+items.capex, other=items.util+items.landscape+items.acctg+items.misc+items.custom;
      const sub2={display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:9,marginBottom:13};
      return <div>
      <div style={{fontSize:10,color:C.muted,marginBottom:10}}>Enter every cost as an annual amount. Each section totals on the right; the grand total is at the bottom.</div>

      <SecLabel text="Taxes & insurance" right={"= "+fmtD(taxIns)+"/yr"}/>
      <div style={sub2}>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><label style={{fontSize:10,color:C.slate,fontWeight:600,display:"flex",alignItems:"center"}}>Property taxes<Info lines={["Annual property tax bill.","· GA est ≈ 1.0–1.5% of price/yr","· Check the county assessor for the real figure"]}/></label><SmBtn active={ex.taxMode!=="pct"} onClick={()=>sf("taxMode","fixed")} label="$/yr"/><SmBtn active={ex.taxMode==="pct"} onClick={()=>sf("taxMode","pct")} label="% price"/></div>
          {ex.taxMode==="pct"?<Field suffix="% of price" value={ex.taxPct||1.2} onChange={x=>sf("taxPct",x)} min={0} max={5} step={0.05} sub={"= "+fmtD(items.taxes)+"/yr"} xs/>:<Field prefix="$" suffix="/yr" value={ex.taxes||0} onChange={x=>sf("taxes",x)} min={0} step={100} sub={"auto est "+fmtD(Math.round((price||0)*1.2/100))} xs/>}
        </div>
        <Field label="Insurance" prefix="$" suffix="/yr" value={ex.insurance||0} onChange={x=>sf("insurance",x)} min={0} step={100} sub={perMo(items.insurance)} tip={["Landlord / hazard insurance per year.","· Small multifamily ≈ $1,000–2,000/unit/yr","· ATL premiums rising — get a real quote"]} xs/>
      </div>

      <SecLabel text="Management" right={"= "+fmtD(items.mgmt)+"/yr"}/>
      <div style={sub2}>
        <Field label="Management fee" suffix="% of rent" value={ex.mgmtPct||0} onChange={x=>sf("mgmtPct",x)} min={0} max={15} step={0.5} sub={"= "+fmtD(items.mgmt)+"/yr"} tip={["Property-management fee, % of collected rent (EGI).","· Typical 8–10%","· Include ~8% even if self-managing — it values your time and keeps the deal honest"]} xs/>
        <div/>
      </div>

      <SecLabel text="Maintenance & reserves" right={"= "+fmtD(maintRes)+"/yr"}/>
      <div style={sub2}>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><label style={{fontSize:10,color:C.slate,fontWeight:600,display:"flex",alignItems:"center"}}>Maintenance<Info lines={["Routine repairs & turnover.","· Rule of thumb ≈ $100–250/unit/mo","· or ≈ 1% of property value /yr","· Older buildings: budget more"]}/></label><SmBtn active={ex.maintMode!=="pct"} onClick={()=>sf("maintMode","fixed")} label="$/yr"/><SmBtn active={ex.maintMode==="pct"} onClick={()=>sf("maintMode","pct")} label="% value"/></div>
          {ex.maintMode==="pct"?<Field suffix="% of value/yr" value={ex.maintPct||1} onChange={x=>sf("maintPct",x)} min={0} max={5} step={0.1} sub={"= "+fmtD(items.maint)+"/yr"} xs/>:<Field prefix="$" suffix="/yr" value={ex.maintenance||0} onChange={x=>sf("maintenance",x)} min={0} step={100} sub={perUnitMo(items.maint)} xs/>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><label style={{fontSize:10,color:C.slate,fontWeight:600,display:"flex",alignItems:"center"}}>CapEx reserve<Info lines={["Savings for big-ticket replacements (roof, HVAC, etc.).","· ≈ $100–200/unit/mo","· or ≈ 0.5–1% of value /yr","· Not a monthly bill — money you set aside"]}/></label><SmBtn active={ex.capexMode!=="pct"} onClick={()=>sf("capexMode","fixed")} label="$/yr"/><SmBtn active={ex.capexMode==="pct"} onClick={()=>sf("capexMode","pct")} label="% value"/></div>
          {ex.capexMode==="pct"?<Field suffix="% of value/yr" value={ex.capexPct||0.5} onChange={x=>sf("capexPct",x)} min={0} max={3} step={0.1} sub={"= "+fmtD(items.capex)+"/yr"} xs/>:<Field prefix="$" suffix="/yr" value={ex.capex||0} onChange={x=>sf("capex",x)} min={0} step={100} sub={perUnitMo(items.capex)} xs/>}
        </div>
      </div>

      <SecLabel text="Other operating" right={"= "+fmtD(other-items.custom)+"/yr"}/>
      <div style={sub2}>
        <Field label="Utilities" prefix="$" suffix="/yr" value={ex.utilities||0} onChange={x=>sf("utilities",x)} min={0} step={100} sub={perMo(items.util)} tip={["Owner-paid utilities (water/sewer, common-area power, trash).","· Often $0 if tenants pay their own","· Water/sewer & trash are commonly owner-paid"]} xs/>
        <Field label="Landscaping" prefix="$" suffix="/yr" value={ex.landscaping||0} onChange={x=>sf("landscaping",x)} min={0} step={100} sub={perMo(items.landscape)} tip={["Lawn / grounds / snow.","· Single-family or small MF often $0–1,500/yr"]} xs/>
        <Field label="Accounting & legal" prefix="$" suffix="/yr" value={ex.accounting||0} onChange={x=>sf("accounting",x)} min={0} step={100} sub="bookkeeping, tax prep" tip={["Bookkeeping, tax prep, LLC/registration fees.","· Often $500–1,500/yr"]} xs/>
        <Field label="Misc / other" prefix="$" suffix="/yr" value={ex.misc||0} onChange={x=>sf("misc",x)} min={0} step={100} sub="advertising, supplies" tip={["Catch-all: advertising, supplies, bank fees, software, HOA dues if any."]} xs/>
      </div>

      <SecLabel text="Custom line items" right={(ex.customExpenses||[]).length?("= "+fmtD(items.custom)+"/yr"):undefined}/>
      {(ex.customExpenses||[]).map((e,i)=><div key={i} className="del-row-ex" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 92px 86px 26px",gap:6,marginBottom:6,alignItems:"end"}}>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>{i===0&&<label style={{fontSize:10,color:C.slate,fontWeight:600}}>Name</label>}<input value={e.name||""} onChange={ev=>setCE(i,"name",ev.target.value)} placeholder="e.g. pest control" style={{padding:"6px 8px",fontSize:12,border:"1px solid "+C.border,borderRadius:7,fontFamily:"inherit",color:C.text,outline:"none"}}/></div>
        <Field label={i===0?"Amount":undefined} prefix="$" value={e.amt||0} onChange={x=>setCE(i,"amt",x)} min={0} step={10} xs/>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>{i===0&&<label style={{fontSize:10,color:C.slate,fontWeight:600}}>Period</label>}<select value={e.period||"annual"} onChange={ev=>setCE(i,"period",ev.target.value)} style={{padding:"6px 7px",fontSize:12,border:"1px solid "+C.border,borderRadius:7,fontFamily:"inherit",color:C.text,background:C.white}}><option value="annual">/yr</option><option value="monthly">/mo</option></select></div>
        <button className="tap-sm" aria-label="Remove expense" onClick={()=>remCE(i)} style={{padding:"6px",background:C.redL,border:"1px solid "+C.border,borderRadius:7,cursor:"pointer",fontSize:12,color:C.red,marginTop:i===0?17:0}}>✕</button>
      </div>)}
      <button onClick={addCE} style={{fontSize:11,padding:"5px 11px",borderRadius:7,border:"1px dashed "+C.border,background:C.white,cursor:"pointer",color:C.slate,fontFamily:"inherit"}}>+ Add expense</button>

      <div style={{background:"linear-gradient(90deg,"+C.navy+","+C.navyM+")",borderRadius:9,padding:"10px 14px",color:"#fff",marginTop:13}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:11,opacity:0.75}}><span>Total operating expenses</span><span>{egi>0?(totExp/egi*100).toFixed(0):0}% of EGI · {fmtD(totExp/u/12)}/unit/mo</span></div>
        <div style={{fontSize:20,fontWeight:700,color:C.gold,marginBottom:7}}>{fmtD(totExp)}/yr</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:5}}>
          {[["Tax & ins",taxIns],["Mgmt",items.mgmt],["Maint & reserves",maintRes],["Other",other]].map(([l2,v2])=><div key={l2} style={{background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"4px 7px"}}><div style={{fontSize:9,opacity:0.65}}>{l2}</div><div style={{fontSize:11,fontWeight:700,color:C.gold}}>{fmtD(v2)}</div></div>)}
        </div>
      </div>
    </div>;})()}
  </Card>;
}
// ── Compute functions ─────────────────────────────────────────
function computeBase(state){
  const{units,financing,closing,expenses,projection,repairs}=state;
  const gpi=units.reduce((s,u)=>s+u.rent,0)*12;
  const vacAmt=gpi*((expenses.vacancyPct||0)/100);
  const egi=gpi-vacAmt;
  const price=state.price||0;
  const{totExp,items:expItems}=calcExp(expenses,units.length,egi,price);
  const noi=egi-totExp;
  const down=price*(financing.downPct??25)/100;
  const loan=price-down;
  const mr=(financing.rate??7.25)/100/12;
  const n=(financing.loanYears||30)*12;
  const pmt=mr===0?loan/n:loan*mr*Math.pow(1+mr,n)/(Math.pow(1+mr,n)-1);
  const annPmt=pmt*12;
  const ccTotal=calcCC(closing,price,loan,expenses.taxes||0,expenses.insurance||0,financing.rate??7.25);
  const repairCost=repairs.include&&!repairs.unknown?(repairs.amount||0):0;
  const cashIn=down+ccTotal+repairCost;
  // Lender cash reserves: months of PITI you must keep on hand (not spent → excluded from CoC).
  const pitiMo=pmt+((expenses.taxes||0)+(expenses.insurance||0))/12;
  const reserveMonths=financing.reserveMonths||0;
  const reserves=reserveMonths*pitiMo;
  const cashOnHand=cashIn+reserves;
  const cf=noi-annPmt;
  const capRate=price>0?(noi/price)*100:0;
  const coc=cashIn>0?(cf/cashIn)*100:0;
  const dscr=annPmt>0?noi/annPmt:0;
  const beOcc=gpi>0?((totExp+annPmt)/gpi)*100:0;
  const grm=gpi>0?price/gpi:0;
  const monRent=units.reduce((s,u)=>s+u.rent,0);
  const pct1=price>0?(monRent/price)*100:0;
  const adjThresh=price>800000?0.65:price>500000?0.75:price>300000?0.85:1.0;
  const expRatio=egi>0?(totExp/egi)*100:0;
  const numU=Math.max(units.length,1);
  const beRent=numU>0&&(1-(expenses.vacancyPct||0)/100)>0?(totExp+annPmt)/(numU*12*(1-(expenses.vacancyPct||0)/100)):0;
  // Value-add
  const vaEnabled=projection.vaEnabled;
  const vaMonthlyRent=projection.vaMarketRentPerUnit||(monRent/numU);
  const vaGPI=(vaMonthlyRent*numU)*12,vaEGI=vaGPI*(1-(expenses.vacancyPct||0)/100);
  const{totExp:vaExp}=calcExp(expenses,numU,vaEGI,price);
  const vaNOI=vaEGI-vaExp,vaCF=vaNOI-annPmt;
  const vaCapRate=price>0?(vaNOI/price)*100:0,vaCoc=cashIn>0?(vaCF/cashIn)*100:0;
  // Partnership
  const myPct=(state.partnership?.myPct||100)/100;
  const myCF=cf*myPct,myCoc=cashIn>0?(myCF/cashIn)*100:0;
  return{gpi,vacAmt,egi,totExp,expItems,noi,down,loan,pmt,annPmt,ccTotal,repairCost,cashIn,pitiMo,reserveMonths,reserves,cashOnHand,cf,capRate,coc,dscr,beOcc,grm,pct1,adjThresh,expRatio,beRent,monRent,numU,vaEnabled,vaCF,vaCapRate,vaCoc,myCF,myCoc,myPct};
}

function computeYearly(state,R){
  const{financing,expenses,projection}=state;
  const years=projection.holdYears||5;
  const rentGrowth=(projection.rentGrowthPct||0)/100;
  const vacPct=(expenses.vacancyPct||0)/100;
  const vaEnabled=projection.vaEnabled,vaYear=projection.vaYear||2;
  const vaMonthlyRent=projection.vaMarketRentPerUnit||(R.monRent/R.numU);
  const refiEnabled=projection.refiEnabled,refiYear=projection.refiYear||3;
  const appPct=(projection.appreciationPct||0)/100,price=state.price||0;
  const exitCapEnabled=projection.exitCapEnabled,exitCap=(projection.exitCapRate||6)/100;
  let balance=R.loan,mr=(financing.rate??7.25)/100/12,pmt=R.pmt;
  const origN=(financing.loanYears||30)*12;let monthsElapsed=0,cumCF=0;
  const yearly=[];
  for(let y=1;y<=years;y++){
    let mRent=R.monRent*Math.pow(1+rentGrowth,y-1);
    if(vaEnabled&&y>=vaYear)mRent=Math.max(mRent,vaMonthlyRent*R.numU);
    const gpiY=mRent*12,egiY=gpiY*(1-vacPct);
    const expY=expenses.mode==="quick"?egiY*((expenses.ratio||45)/100):R.totExp*Math.pow(1.02,y-1);
    const noiY=egiY-expY;
    if(refiEnabled&&y===refiYear&&balance>0){
      const nr=(projection.refiRate||6.5)/100/12,rem=Math.max(1,origN-monthsElapsed);
      pmt=balance*nr*Math.pow(1+nr,rem)/(Math.pow(1+nr,rem)-1);mr=nr;
    }
    const annDebt=pmt*12;
    for(let m=0;m<12;m++){const i=balance*mr;balance-=(pmt-i);}
    monthsElapsed+=12;
    const cfY=noiY-annDebt,propVal=exitCapEnabled&&exitCap>0?Math.max(0,noiY/exitCap):price*Math.pow(1+appPct,y);
    cumCF+=cfY;
    yearly.push({year:y,monthlyRent:Math.round(mRent/R.numU),gpi:Math.round(gpiY),noi:Math.round(noiY),debtService:Math.round(annDebt),cf:Math.round(cfY),propVal:Math.round(propVal),balance:Math.round(Math.max(0,balance)),equity:Math.round(propVal-Math.max(0,balance)),cumCF:Math.round(cumCF)});
  }
  const last=yearly[yearly.length-1]||{};
  const sellCostPct=(projection.sellingCostPct??6)/100;
  const sellProc=(last.propVal||0)*(1-sellCostPct)-last.balance;
  const flows=[-R.cashIn,...yearly.map((y,i)=>i<years-1?y.cf:y.cf+sellProc)];
  let irr=0.1;
  for(let i=0;i<200;i++){let npv=0,d=0;flows.forEach((f,j)=>{npv+=f/Math.pow(1+irr,j);d-=j*f/Math.pow(1+irr,j+1);});if(Math.abs(d)<1e-10)break;irr-=npv/d;if(irr<-0.99){irr=-0.99;break;}}
  const totCF=yearly.reduce((s,y)=>s+y.cf,0),deprBen=(price*0.85/27.5)*0.28*years;
  const appGain=(last.propVal||0)-price,equityBuild=R.loan-(last.balance||0);
  const totRet=appGain+equityBuild+totCF+deprBen;
  return{yearly,irr:irr*100,totCF,deprBen,appGain,equityBuild,totRet,exitVal:last.propVal||0};
}

function computeSensitivity(state,R){
  const pVars=[-0.10,-0.05,0,+0.05,+0.10];
  const rVars=[-1.0,-0.5,0,+0.5,+1.0];
  return{
    priceRate:pVars.map(pv=>{const np=Math.round((state.price||0)*(1+pv));return{label:pv===0?"Current":(pv>0?"+":"")+Math.round(pv*100)+"%",price:np,cells:rVars.map(rv=>{const nr=Math.max(1,(state.financing.rate??7.25)+rv);const ns={...state,price:np,financing:{...state.financing,rate:nr}};const rb=computeBase(ns);return{label:rv===0?"Current":(rv>0?"+":"")+rv.toFixed(1)+"%",cf:rb.cf,capRate:rb.capRate};})};})
    ,rentCells:[-300,-200,-100,0,100,200,300].map(d=>{const nu=state.units.map(u=>({...u,rent:Math.max(0,u.rent+d)}));const rb=computeBase({...state,units:nu});return{delta:d,cf:rb.cf,capRate:rb.capRate};})
  };
}

function calcDealScore(R,Y){
  const ms=[lv(R.capRate,7,4.5),lv(R.coc,8,4),lv(R.dscr,1.25,1.0),lv(R.cf/R.numU/12,200,0),lv(R.beOcc,70,85,true),lv(Y?.irr||0,15,10)];
  const pts=ms.reduce((s,m)=>s+(m==="good"?2:m==="warn"?1:0),0);
  const pct=pts/(ms.length*2);
  const grade=pct>=0.75?"A":pct>=0.5?"B":pct>=0.25?"C":"D";
  const colors={A:C.tealS,B:C.blueS,C:C.amberS,D:C.redS};
  const labels={A:"Great deal",B:"Good deal",C:"Weak deal",D:"Risky deal"};
  const descs={A:"All key metrics in the green zone.",B:"Most metrics solid — some room to improve.",C:"Several red flags. Need a clear exit strategy.",D:"Critical issues. Renegotiate price or walk away."};
  return{grade,pct,color:colors[grade],label:labels[grade],desc:descs[grade],metrics:ms};
}

function calcKillers(R,S){
  const k=[];
  if(R.dscr<1.0)k.push(["critical","DSCR "+R.dscr.toFixed(2)+" < 1.0 — NOI does not cover mortgage. Lender will likely decline."]);
  if(R.beOcc>95)k.push(["critical","Break-even "+R.beOcc.toFixed(0)+"% — almost no vacancy buffer. One empty unit = losses."]);
  if(R.dscr>=1.0&&R.dscr<1.15)k.push(["warn","DSCR "+R.dscr.toFixed(2)+" — below most lender minimums (1.20–1.25). Financing may be difficult."]);
  if(R.cf/R.numU/12<-500)k.push(["warn","CF "+fmtD(R.cf/R.numU/12)+"/unit/mo — significant negative. Requires substantial cash reserves."]);
  if(R.pct1<R.adjThresh*0.55)k.push(["warn","1% rule "+fmtP(R.pct1)+" — very low rent-to-price ratio for this market."]);
  if(R.beRent>R.monRent/R.numU*1.25)k.push(["info","Break-even rent "+fmtD(R.beRent)+"/unit — "+Math.round((R.beRent/(R.monRent/R.numU)-1)*100)+"% above current rent."]);
  return k;
}

function whatNeedsToBeTrue(state,R,targetCFmonthly){
  const{units,financing,expenses}=state;
  const numU=Math.max(units.length,1);
  const vac=(expenses.vacancyPct||0)/100,ratio=(expenses.ratio||45)/100;
  const mr=(financing.rate??7.25)/100/12,n=(financing.loanYears||30)*12;
  const pmtF=mr>0?mr*Math.pow(1+mr,n)/(Math.pow(1+mr,n)-1):1/n;
  const loanF=1-(financing.downPct??25)/100;
  const targetAnn=targetCFmonthly*12;
  const neededRentPU=(targetAnn+R.annPmt)/(numU*12*(1-vac)*(1-ratio));
  const neededPrice=R.noi>targetAnn?Math.round((R.noi-targetAnn)/(12*loanF*pmtF)):null;
  let lo=1,hi=20;
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;const mm=mid/100/12;const mp=mm===0?R.loan/n:R.loan*mm*Math.pow(1+mm,n)/(Math.pow(1+mm,n)-1);if(R.noi-mp*12>targetAnn)lo=mid;else hi=mid;}
  return{neededRentPU:Math.round(neededRentPU),neededPrice,neededRate:Math.round(lo*100)/100};
}

function calcLoanOptions(price,downPct,currentRate,loanYears){
  const loan=price*(1-(downPct??25)/100),n30=(loanYears||30)*12,n15=15*12;
  const pmt=(l,r,n)=>{const mr=r/100/12;return mr===0?l/n:l*mr*Math.pow(1+mr,n)/(Math.pow(1+mr,n)-1);};
  return[
    {name:"30yr fixed",rate:currentRate,monthly:pmt(loan,currentRate,n30),totalInt:pmt(loan,currentRate,n30)*n30-loan,note:"Current option"},
    {name:"15yr fixed",rate:Math.max(1,currentRate-0.5),monthly:pmt(loan,Math.max(1,currentRate-0.5),n15),totalInt:pmt(loan,Math.max(1,currentRate-0.5),n15)*n15-loan,note:"Less interest, higher payment"},
    {name:"5/1 ARM",rate:Math.max(1,currentRate-0.75),monthly:pmt(loan,Math.max(1,currentRate-0.75),n30),totalInt:null,note:"Rate fixed 5 years"},
    {name:"DSCR loan",rate:currentRate+0.5,monthly:pmt(loan,currentRate+0.5,n30),totalInt:null,note:"No income verification"},
    {name:"Interest only",rate:Math.max(1,currentRate-0.25),monthly:loan*(Math.max(1,currentRate-0.25))/100/12,totalInt:null,note:"10yr IO period — interest only"},
  ];
}
// ── CalcTrace ─────────────────────────────────────────────────
function CalcTrace({R,S}){
  const[open,setOpen]=useState(false);
  const numU=S.units.length||1;
  const rows=[
    {l:"Gross potential income",v:fmtD(R.gpi)+"/yr",f:"= "+fmtD(R.monRent)+"/mo × 12 = "+fmtD(R.gpi)+"/yr",c:C.blueS,b:true},
    {l:"(−) Vacancy ("+S.expenses.vacancyPct+"%)",v:"−"+fmtD(R.vacAmt)+"/yr",f:"= GPI × "+S.expenses.vacancyPct+"%",c:C.red},
    {l:"= Effective gross income",v:fmtD(Math.round(R.egi))+"/yr",f:"= GPI − vacancy",c:C.blueS,b:true},
    {l:"(−) Total expenses",v:"−"+fmtD(R.totExp)+"/yr",f:S.expenses.mode==="quick"?S.expenses.ratio+"% of EGI":"sum of itemized expenses",c:C.red},
    {l:"= Net operating income (NOI)",v:fmtD(Math.round(R.noi))+"/yr",f:"= EGI − expenses",c:C.teal,b:true},
    {l:"(−) Debt service",v:"−"+fmtD(Math.round(R.annPmt))+"/yr",f:fmtD(R.pmt)+"/mo × 12",c:C.red},
    {l:"= Annual cashflow",v:fmtD(R.cf)+"/yr",f:"= NOI − debt service",c:R.cf>=0?C.teal:C.red,b:true},
    {l:"= Monthly cashflow",v:fmtD(R.cf/12)+"/mo",f:"= annual ÷ 12",c:R.cf>=0?C.teal:C.red,b:true},
    {l:"= Per unit cashflow",v:fmtD(R.cf/numU/12)+"/unit/mo",f:"= monthly ÷ "+numU+" units",c:R.cf>=0?C.teal:C.red},
  ];
  return <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginTop:8}}>
    <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 13px",background:open?"var(--c-hl)":C.bg,border:"none",cursor:"pointer",fontFamily:"inherit",borderBottom:open?"1px solid "+C.border:"none"}}>
      <span style={{fontSize:12,fontWeight:700,color:C.heading}}>How cashflow is calculated — step by step</span>
      <span style={{fontSize:14,color:C.slate,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
    </button>
    {open&&<div style={{padding:"10px 13px",background:C.white}}>
      {rows.map((row,i)=><div key={i} style={{marginBottom:8,borderLeft:"3px solid "+(row.b?row.c:C.grid),paddingLeft:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:12,fontWeight:row.b?600:400,color:row.b?row.c:C.slate}}>{row.l}</span>
          <span style={{fontSize:13,fontWeight:700,color:row.c,marginLeft:8,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{row.v}</span>
        </div>
        <div style={{fontSize:10,color:C.muted,marginTop:1}}>{row.f}</div>
      </div>)}
      <div style={{padding:"7px 9px",background:C.goldL,borderRadius:7,fontSize:10,color:C.amber,border:"1px solid "+C.border,marginTop:6}}>
        Cap rate: {fmtD(R.noi)} ÷ ${fmt(S.price)} = <strong>{fmtP(R.capRate)}</strong> &nbsp;·&nbsp; CoC: {fmtD(R.cf)} ÷ {fmtD(R.cashIn)} = <strong>{fmtP(R.coc)}</strong> &nbsp;·&nbsp; DSCR: {fmtD(R.noi)} ÷ {fmtD(R.annPmt)} = <strong>{R.dscr.toFixed(2)}</strong> &nbsp;·&nbsp; Break-even rent: <strong>{fmtD(R.beRent)}/unit/mo</strong>
      </div>
    </div>}
  </div>;
}

// ── Result Tabs ───────────────────────────────────────────────
function OverviewTab({R,Y,S,compact}){
  const score=calcDealScore(R,Y);
  const killers=calcKillers(R,S);
  const pct1Pass=R.pct1>=R.adjThresh;
  const adjLbl=S.price>800000?"≥0.65% HCOL":S.price>500000?"≥0.75%":S.price>300000?"≥0.85%":"≥1.0%";
  const partnerEnabled=S.partnership?.enabled;
  return <div>
    {/* Deal score (hidden in compact mode — the verdict hero shows the grade & headline CF) */}
    {!compact&&<div style={{display:"flex",gap:10,marginBottom:11}}>
      <div style={{background:score.color,borderRadius:11,padding:"12px 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:80}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.75)",marginBottom:2}}>Deal score</div>
        <div style={{fontSize:42,fontWeight:700,color:"#fff",lineHeight:1}}>{score.grade}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.8)",marginTop:2}}>{Math.round(score.pct*100)}%</div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:score.color,marginBottom:4}}>{score.label}</div>
        <div style={{fontSize:12,color:C.slate,marginBottom:8}}>{score.desc}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {["Cap rate","CoC","DSCR","CF/unit","Break-even","IRR"].map((l,i)=><span key={l} style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:score.metrics[i]==="good"?C.tealL:score.metrics[i]==="warn"?C.amberL:C.redL,color:score.metrics[i]==="good"?C.teal:score.metrics[i]==="warn"?C.amber:C.red,fontWeight:600}}>{l}</span>)}
        </div>
      </div>
    </div>}
    {/* Deal killers */}
    {killers.length>0&&<div style={{marginBottom:11}}>
      {killers.map(([lvl,msg],i)=>{
        const cfg={critical:[C.redL,C.red],warn:[C.amberL,C.amber],info:[C.hl,C.heading]};
        const[bg,col]=cfg[lvl]||cfg.info;
        return <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",padding:"8px 11px",background:bg,border:"1px solid "+C.border,borderRadius:"calc(var(--c-rad) - 2px)",marginBottom:5,fontSize:11,color:col}}>
          <span style={{flexShrink:0,width:6,height:6,borderRadius:"50%",background:col,marginTop:4}}/><span>{msg}</span>
        </div>;
      })}
    </div>}
    {/* Verdict banner (compact hero shows the same headline CF up top) */}
    {!compact&&<div style={{borderRadius:"var(--c-rad)",padding:"4px 0 0",marginBottom:11}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
        {[["Monthly CF",fmtD(R.cf/12)+"/mo",R.cf>=0],["Per unit",fmtD(R.cf/R.numU/12)+"/unit/mo",R.cf>=0],["Annual CF",fmtD(R.cf)+"/yr",R.cf>=0],["Cash needed",fmtD(R.cashIn),true]].map(([l2,val,pos])=><div key={l2} style={{background:C.white,border:"1px solid "+C.border,borderRadius:"calc(var(--c-rad) - 2px)",padding:"9px 11px"}}>
          <div style={{fontSize:9,color:C.muted,letterSpacing:"0.04em",textTransform:"uppercase"}}>{l2}</div><div style={{fontSize:14,fontWeight:700,color:pos?C.heading:C.red,fontVariantNumeric:"tabular-nums",marginTop:2}}>{val}</div>
        </div>)}
      </div>
    </div>}
    {/* Partnership split */}
    {partnerEnabled&&<div style={{padding:"9px 11px",background:C.hl,border:"1px solid "+C.border,borderRadius:"var(--c-rad)",marginBottom:11}}>
      <div style={{fontSize:10,fontWeight:700,color:C.blueS,marginBottom:5,letterSpacing:"0.04em"}}>MY SHARE ({S.partnership.myPct}%)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
        {[["My CF/mo",fmtD(R.myCF/12)+"/mo"],["My CoC",fmtP(R.myCoc)],["Invested",fmtD(R.cashIn*(S.partnership.myPct/100))]].map(([l2,v2])=><div key={l2} style={{textAlign:"center"}}><div style={{fontSize:10,color:C.slate}}>{l2}</div><div style={{fontSize:14,fontWeight:700,color:C.blueS,fontVariantNumeric:"tabular-nums"}}>{v2}</div></div>)}
      </div>
    </div>}
    {/* Cash required */}
    <div style={{padding:"9px 11px",background:C.white,border:"1px solid "+C.border,borderRadius:10,marginBottom:11}}>
      <div style={{fontSize:10,fontWeight:700,color:C.heading,marginBottom:6}}>CASH REQUIRED AT CLOSE</div>
      {[["Down payment",fmtD(R.down)],["Closing costs",fmtD(R.ccTotal)],...(S.repairs.include&&!S.repairs.unknown&&S.repairs.amount>0?[["Repairs",fmtD(S.repairs.amount)]]:[])]
        .map(([l2,v2])=><div key={l2} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid var(--c-rowline)",fontSize:12,color:C.slate}}><span>{l2}</span><span style={{fontWeight:600,color:C.text}}>{v2}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontWeight:700,color:C.heading,fontSize:13}}><span>Total to close</span><span>{fmtD(R.cashIn)}</span></div>
      {R.reserves>0&&<div style={{marginTop:7,paddingTop:7,borderTop:"1px dashed "+C.border}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.slate}}><span>+ Lender reserves <span style={{fontSize:10,color:C.muted}}>({R.reserveMonths} mo PITI · kept, not spent)</span></span><span style={{fontWeight:600,color:C.text}}>{fmtD(R.reserves)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontWeight:700,color:C.heading,fontSize:13}}><span>Total cash on hand</span><span>{fmtD(R.cashOnHand)}</span></div>
      </div>}
    </div>
    {/* Key metrics */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:8,marginBottom:11}}>
      <MBox label="Cap rate" value={fmtP(R.capRate)} sub="≥5% (A) · ≥7% (B)" lvl={lv(R.capRate,7,4.5)} bar={R.capRate} bMax={12} bGood={7} bWarn={4.5} tip={["Cap rate = NOI ÷ Price","= "+fmtD(R.noi)+" ÷ $"+fmt(S.price),"= "+fmtP(R.capRate)]}/>
      <MBox label="Cash-on-cash" value={fmtP(R.coc)} sub="Good ≥8%" lvl={lv(R.coc,8,4)} bar={R.coc} bMax={20} bGood={8} bWarn={4} tip={["CoC = Annual CF ÷ Cash in","= "+fmtD(R.cf)+" ÷ "+fmtD(R.cashIn),"= "+fmtP(R.coc)]}/>
      <MBox label="DSCR" value={R.dscr.toFixed(2)} sub="Lenders need ≥1.25" lvl={lv(R.dscr,1.25,1.0)} bar={R.dscr} bMax={2.5} bGood={1.25} bWarn={1.0} tip={["DSCR = NOI ÷ Debt service","= "+fmtD(R.noi)+" ÷ "+fmtD(R.annPmt),"= "+R.dscr.toFixed(2)]}/>
      <MBox label="Break-even occ." value={fmtP(R.beOcc)} sub="Lower = safer" lvl={lv(R.beOcc,70,85,true)} bar={R.beOcc} bMax={110} bGood={70} bWarn={85} bInv tip={["Break-even = (Exp+Debt) ÷ GPI","= "+fmtP(R.beOcc),"·","<70% = comfortable buffer"]}/>
    </div>
    {/* Break-even rent */}
    <div style={{padding:"9px 11px",background:R.beRent<=R.monRent/R.numU?C.tealL:C.redL,border:"1px solid "+(R.beRent<=R.monRent/R.numU?C.border:C.border),borderRadius:10,marginBottom:11}}>
      <div style={{fontSize:10,fontWeight:700,color:R.beRent<=R.monRent/R.numU?C.teal:C.red,marginBottom:3}}>Break-even rent / unit</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <div><div style={{fontSize:18,fontWeight:700,color:R.beRent<=R.monRent/R.numU?C.teal:C.red}}>{fmtD(R.beRent)}/unit/mo</div>
        <div style={{fontSize:10,color:C.slate,marginTop:2}}>min rent to cover all costs + mortgage</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:11,color:C.slate}}>Current rent</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{fmtD(R.monRent/R.numU)}/unit</div>
        <div style={{fontSize:10,color:R.beRent<=R.monRent/R.numU?C.teal:C.red}}>{R.beRent<=R.monRent/R.numU?"+"+fmtD(R.monRent/R.numU-R.beRent)+" buffer":"−"+fmtD(R.beRent-R.monRent/R.numU)+" shortfall"}</div></div>
      </div>
    </div>
    {/* Quick checks (no GRM) */}
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden"}}>
      <div style={{padding:"8px 13px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border}}>Quick checks</div>
      <div style={{padding:"6px 13px"}}>
        {[{l:"1% rule ("+adjLbl+")",v:fmtP(R.pct1),pill:pct1Pass?"Passes":R.pct1>=R.adjThresh*0.85?"Close":"Below",lvl:pct1Pass?"good":R.pct1>=R.adjThresh*0.85?"warn":"bad",note:"Monthly rent ÷ price"}].map(m=><div key={m.l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",gap:6}}>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.l}</div><div style={{fontSize:10,color:C.slate}}>{m.note}</div></div>
          <div style={{fontSize:13,fontWeight:700,color:C.text,margin:"0 8px",flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{m.v}</div>
          <Pill text={m.pill} lvl={m.lvl}/>
        </div>)}
      </div>
    </div>
    {R.vaEnabled&&<div style={{padding:"9px 11px",background:C.goldL,border:"1px solid "+C.border,borderRadius:10,marginTop:8}}>
      <div style={{fontSize:10,fontWeight:700,color:C.amber,marginBottom:5}}>VALUE-ADD AT STABILIZATION</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
        {[["Cap rate",fmtP(R.vaCapRate)],["Cash-on-cash",fmtP(R.vaCoc)],["Monthly CF",fmtD(R.vaCF/12)+"/mo"]].map(([l2,v2])=><div key={l2} style={{textAlign:"center"}}><div style={{fontSize:10,color:C.amber}}>{l2}</div><div style={{fontSize:14,fontWeight:700,color:C.amber}}>{v2}</div></div>)}
      </div>
    </div>}
  </div>;
}

function IncomeTab({R,S}){
  return <div>
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:8}}>
      <div style={{padding:"8px 13px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border}}>P&L statement (annual)</div>
      <div style={{paddingBottom:4}}>
        <PLRow label="Gross potential income" value={fmtD(R.gpi)+"/yr"} pos note={R.numU+" units × "+fmtD(R.monRent/R.numU)+" avg"}/>
        <PLRow label={"(−) Vacancy ("+S.expenses.vacancyPct+"%)"}  value={"−"+fmtD(R.vacAmt)+"/yr"} neg indent/>
        <PLRow label="= Effective gross income (EGI)" value={fmtD(Math.round(R.egi))+"/yr"} bold hl/>
        {S.expenses.mode==="quick"?<PLRow label={"(−) Expenses ("+S.expenses.ratio+"% of EGI)"}  value={"−"+fmtD(Math.round(R.totExp))+"/yr"} neg indent/>
          :R.expItems&&Object.entries({Taxes:R.expItems.taxes,Insurance:R.expItems.insurance,Management:R.expItems.mgmt,Maintenance:R.expItems.maint,"CapEx":R.expItems.capex,Utilities:R.expItems.util,Landscaping:R.expItems.landscape,Accounting:R.expItems.acctg,Misc:R.expItems.misc,Custom:R.expItems.custom}).filter(([,v2])=>v2>0).map(([l2,v2])=><PLRow key={l2} label={"(−) "+l2} value={"−"+fmtD(v2)+"/yr"} neg indent/>)}
        <PLRow label="= Total expenses" value={"−"+fmtD(Math.round(R.totExp))+"/yr"} neg bold/>
        <PLRow label="= Net operating income (NOI)" value={fmtD(Math.round(R.noi))+"/yr"} bold hl pos/>
        <PLRow label={"(−) Debt service ("+S.financing.loanYears+"yr @ "+S.financing.rate+"%)"}  value={"−"+fmtD(Math.round(R.annPmt))+"/yr"} neg indent note={fmtD(R.pmt)+"/mo × 12"}/>
        <PLRow label="= Annual cashflow" value={fmtD(R.cf)+"/yr"} bold hl neg={R.cf<0} pos={R.cf>=0}/>
        <div style={{padding:"5px 8px",background:C.bg,fontSize:11,color:C.slate,display:"flex",gap:12,flexWrap:"wrap"}}>
          <span>Monthly: <strong style={{color:R.cf>=0?C.teal:C.red}}>{fmtD(R.cf/12)}/mo</strong></span>
          <span>Per unit: <strong style={{color:R.cf>=0?C.teal:C.red}}>{fmtD(R.cf/R.numU/12)}/mo</strong></span>
          <span>Exp ratio: <strong>{fmtP(R.expRatio)}/yr</strong></span>
        </div>
      </div>
    </div>
    <CalcTrace R={R} S={S}/>
  </div>;
}

// ── Charts (dependency-free SVG) ───────────────────────────────
const _pol=(cx,cy,r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];
function _donutArc(cx,cy,R,r,a1,a2){
  const large=(a2-a1)>Math.PI?1:0;
  const[x1,y1]=_pol(cx,cy,R,a1),[x2,y2]=_pol(cx,cy,R,a2);
  const[x3,y3]=_pol(cx,cy,r,a2),[x4,y4]=_pol(cx,cy,r,a1);
  return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
}
function ChartBox({title,children,note}){
  return <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:11}}>
    <div style={{padding:"7px 12px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border}}>{title}</div>
    <div style={{padding:"12px 13px",background:C.white}}>{children}{note&&<div style={{fontSize:10,color:C.muted,marginTop:8,lineHeight:1.5}}>{note}</div>}</div>
  </div>;
}
// Cumulative cash position (starts at −cash in) → shows years-to-payback
function CashflowChart({yearly,cashIn}){
  const[hi,setHi]=useState(null);
  const W=540,H=170,pad={l:52,r:18,t:12,b:24};
  const pts=[{x:0,y:-cashIn},...yearly.map(r=>({x:r.year,y:-cashIn+r.cumCF}))];
  const ys=pts.map(p=>p.y),minY=Math.min(0,...ys),maxY=Math.max(0,...ys),spanY=(maxY-minY)||1;
  const px=i=>pad.l+(pts.length<=1?0:(i/(pts.length-1))*(W-pad.l-pad.r));
  const py=v=>pad.t+(1-(v-minY)/spanY)*(H-pad.t-pad.b);
  const line=pts.map((p,i)=>(i?"L":"M")+px(i).toFixed(1)+" "+py(p.y).toFixed(1)).join(" ");
  const area=line+` L${px(pts.length-1).toFixed(1)} ${py(minY).toFixed(1)} L${px(0).toFixed(1)} ${py(minY).toFixed(1)} Z`;
  const zeroY=py(0);
  // payback year (first crossing >= 0)
  let payback=null;
  for(let i=1;i<pts.length;i++){if(pts[i-1].y<0&&pts[i].y>=0){const t=(0-pts[i-1].y)/(pts[i].y-pts[i-1].y);payback=(pts[i-1].x+t).toFixed(1);break;}}
  const ticks=[maxY,minY+spanY/2,minY].filter((v,i,a)=>a.indexOf(v)===i);
  // thin out markers/labels as the hold period grows so 30yr stays legible
  const yrs=yearly.length,step=yrs<=10?1:yrs<=20?2:5;
  const showAt=i=>i===0||i===pts.length-1||(pts[i].x%step===0);
  return <ChartBox title="Cumulative cash position" note={payback?`Crosses break-even at ~year ${payback} (cumulative cash flow recovers your ${fmtD(cashIn)} invested).`:"Does not recover initial investment from cash flow alone within the hold period — most of the return is at sale."}>
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}} onMouseLeave={()=>setHi(null)}>
      {ticks.map((v,i)=><g key={i}><line x1={pad.l} y1={py(v)} x2={W-pad.r} y2={py(v)} strokeWidth="1" style={{stroke:"var(--c-grid)"}}/><text x={pad.l-6} y={py(v)+3} textAnchor="end" style={{fontSize:9,fill:C.slate}}>{fmtD(v)}</text></g>)}
      <line x1={pad.l} y1={zeroY} x2={W-pad.r} y2={zeroY} strokeWidth="1" strokeDasharray="3 3" style={{stroke:C.muted}}/>
      <path d={area} style={{fill:C.teal,opacity:0.10}}/>
      <path d={line} fill="none" strokeWidth="2.5" strokeLinejoin="round" style={{stroke:C.teal}}/>
      {pts.map((p,i)=>showAt(i)?<circle key={i} cx={px(i)} cy={py(p.y)} r="3" style={{fill:p.y>=0?C.teal:C.red}}/>:null)}
      {pts.map((p,i)=>showAt(i)?<text key={i} x={px(i)} y={H-8} textAnchor="middle" style={{fontSize:9,fill:C.slate}}>{p.x===0?"Now":"Y"+p.x}</text>:null)}
      {pts.map((p,i)=>{const w=(W-pad.l-pad.r)/Math.max(1,pts.length-1);return <rect key={"h"+i} x={px(i)-w/2} y={pad.t} width={w} height={H-pad.t-pad.b} fill="transparent" style={{cursor:"crosshair"}} onMouseEnter={()=>setHi(i)} onMouseMove={()=>setHi(i)} onClick={()=>setHi(i)}/>;})}
      {hi!=null&&(()=>{const p=pts[hi],tx=Math.min(Math.max(px(hi)-48,2),W-98);return <g pointerEvents="none">
        <line x1={px(hi)} y1={pad.t} x2={px(hi)} y2={H-pad.b} strokeWidth="1" strokeDasharray="3 3" style={{stroke:C.slate}} opacity="0.5"/>
        <circle cx={px(hi)} cy={py(p.y)} r="4.5" strokeWidth="1.5" style={{fill:p.y>=0?C.teal:C.red,stroke:"#fff"}}/>
        <rect x={tx} y={6} width="96" height="32" rx="6" opacity="0.96" style={{fill:C.navy}}/>
        <text x={tx+8} y={19} style={{fontSize:9,fill:"#fff",opacity:0.7}}>{p.x===0?"Today (cash in)":"Year "+p.x}</text>
        <text x={tx+8} y={32} style={{fontSize:11,fontWeight:700,fill:"#fff"}}>{fmtD(p.y)}</text>
      </g>;})()}
    </svg>
  </ChartBox>;
}
// Equity vs loan balance, stacked per year
function EquityChart({yearly,loan}){
  const[hi,setHi]=useState(null);
  const W=540,H=180,pad={l:52,r:14,t:12,b:24};
  const maxV=Math.max(...yearly.map(r=>r.propVal),loan)||1;
  const n=yearly.length,gap=n>20?2:n>12?3:n>6?6:10;
  const bw=Math.max(2,(W-pad.l-pad.r-gap*(n-1))/n),rx=bw<5?1:2;
  const py=v=>pad.t+(1-v/maxV)*(H-pad.t-pad.b);
  const x=i=>pad.l+i*(bw+gap);
  const ticks=[maxV,maxV/2,0];
  const step=n<=10?1:n<=20?2:5;
  const showLbl=(r,i)=>i===n-1||r.year%step===0;
  return <ChartBox title="Equity vs. loan balance" note="Each bar = property value, split into your equity (gold) and remaining loan balance (navy). Equity grows from appreciation + principal paydown.">
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}} onMouseLeave={()=>setHi(null)}>
      {ticks.map((v,i)=><g key={i}><line x1={pad.l} y1={py(v)} x2={W-pad.r} y2={py(v)} strokeWidth="1" style={{stroke:"var(--c-grid)"}}/><text x={pad.l-6} y={py(v)+3} textAnchor="end" style={{fontSize:9,fill:C.slate}}>{fmtD(v)}</text></g>)}
      {yearly.map((r,i)=>{const eqTop=py(r.propVal),balTop=py(r.balance),base=py(0);return <g key={i}>
        <rect x={x(i)} y={balTop} width={bw} height={Math.max(0,base-balTop)} rx={rx} style={{fill:C.navy,opacity:hi==null||hi===i?1:0.5}}/>
        <rect x={x(i)} y={eqTop} width={bw} height={Math.max(0,balTop-eqTop)} rx={rx} style={{fill:C.gold,opacity:hi==null||hi===i?1:0.5}}/>
        {showLbl(r,i)&&<text x={x(i)+bw/2} y={H-8} textAnchor="middle" style={{fontSize:9,fill:C.slate}}>{"Y"+r.year}</text>}
      </g>;})}
      {yearly.map((r,i)=><rect key={"h"+i} x={x(i)-gap/2} y={pad.t} width={bw+gap} height={H-pad.t-pad.b} fill="transparent" style={{cursor:"pointer"}} onMouseEnter={()=>setHi(i)} onMouseMove={()=>setHi(i)} onClick={()=>setHi(i)}/>)}
      {hi!=null&&(()=>{const r=yearly[hi],tx=Math.min(Math.max(x(hi)+bw/2-60,2),W-122);return <g pointerEvents="none">
        <rect x={tx} y={6} width="120" height="50" rx="6" opacity="0.96" style={{fill:C.navy}}/>
        <text x={tx+8} y={19} style={{fontSize:9,fill:"#fff",opacity:0.7}}>Year {r.year} · value {fmtD(r.propVal)}</text>
        <text x={tx+8} y={33} style={{fontSize:10,fontWeight:700,fill:C.gold}}>Equity {fmtD(r.equity)}</text>
        <text x={tx+8} y={47} style={{fontSize:10,fontWeight:700,fill:"rgba(255,255,255,0.82)"}}>Loan {fmtD(r.balance)}</text>
      </g>;})()}
    </svg>
    <div style={{display:"flex",gap:14,marginTop:8,fontSize:10,color:C.slate}}>
      <span><span style={{display:"inline-block",width:9,height:9,background:C.gold,borderRadius:2,marginRight:4}}/>Equity</span>
      <span><span style={{display:"inline-block",width:9,height:9,background:C.navy,borderRadius:2,marginRight:4}}/>Loan balance</span>
    </div>
  </ChartBox>;
}
// Return components donut
function ReturnDonut({segs}){
  const pos=segs.filter(s=>s.value>0),tot=pos.reduce((s,x)=>s+x.value,0)||1;
  let a=-Math.PI/2;
  const arcs=pos.map(s=>{const a2=a+(s.value/tot)*2*Math.PI;const path=_donutArc(64,64,58,38,a,a2);a=a2;return{path,color:s.color,label:s.label,value:s.value};});
  const grand=segs.reduce((s,x)=>s+x.value,0);
  return <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
    <svg viewBox="0 0 128 128" style={{width:128,height:128,flexShrink:0}}>
      {arcs.map((a2,i)=><path key={i} d={a2.path} style={{fill:a2.color}}/>)}
      <text x="64" y="60" textAnchor="middle" style={{fontSize:10,fill:C.muted}}>Total</text>
      <text x="64" y="76" textAnchor="middle" style={{fontSize:13,fontWeight:700,fill:C.text}}>{fmtD(grand)}</text>
    </svg>
    <div style={{flex:1,minWidth:160}}>
      {segs.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"3px 0",fontSize:12}}>
        <span style={{display:"flex",alignItems:"center",gap:6,color:C.slate}}><span style={{width:10,height:10,background:s.color,borderRadius:2,opacity:s.value>0?1:0.3}}/>{s.label}</span>
        <span style={{fontWeight:700,color:s.value>=0?C.text:C.red,fontVariantNumeric:"tabular-nums"}}>{fmtD(s.value)}</span>
      </div>)}
    </div>
  </div>;
}

// Plain-language, show-the-math explainer for the projection's headline numbers
function ProjTrace({R,Y,S}){
  const[open,setOpen]=useState(false);
  const hold=S.projection.holdYears||5;
  const last=Y.yearly[Y.yearly.length-1]||{};
  const sc=(S.projection.sellingCostPct??6);
  const netSale=Math.round((Y.exitVal||0)*(1-sc/100)-(last.balance||0));
  const exitMethod=S.projection.exitCapEnabled?("final-year NOI ÷ "+(S.projection.exitCapRate||6)+"% exit cap"):((S.projection.appreciationPct||0)+"%/yr appreciation");
  const sections=[
    {t:"Total return ("+hold+"yr) — total dollars gained, four parts added up",rows:[
      {l:"Appreciation",v:fmtD(Y.appGain),f:"exit value "+fmtD(Y.exitVal)+" − price "+fmtD(S.price)+"  ("+exitMethod+")",c:Y.appGain>=0?C.teal:C.red},
      {l:"+ Principal paydown",v:fmtD(Y.equityBuild),f:"loan "+fmtD(R.loan)+" − balance still owed "+fmtD(last.balance),c:C.teal},
      {l:"+ Net cash flow",v:fmtD(Y.totCF),f:"every year's cash flow, summed",c:Y.totCF>=0?C.teal:C.red},
      {l:"+ Depreciation benefit (est.)",v:fmtD(Y.deprBen),f:"(price × 85% ÷ 27.5 yrs) × 28% tax × "+hold+" yrs — rough tax saving",c:C.teal},
      {l:"= Total return",v:fmtD(Y.totRet),f:"that's "+fmtP(Y.totRet/(R.cashIn||1)*100)+" of your "+fmtD(R.cashIn)+" cash in (not annualized)",bold:true,c:Y.totRet>=0?C.teal:C.red},
    ]},
    {t:"Est. IRR = "+fmtP(Y.irr)+" — annualized, timing-aware return",rows:[
      {l:"What it is",v:"yearly % return",f:"the rate at which all the cash flows below net to $0. Unlike total return, it accounts for WHEN cash arrives, so it's comparable to other investments."},
      {l:"Year 0",v:fmtD(-R.cashIn),f:"cash invested at close",c:C.red},
      {l:"Years 1–"+Math.max(1,hold-1),v:"each year's cash flow",f:"straight from the year-by-year table"},
      {l:"Year "+hold,v:fmtD((last.cf||0)+netSale),f:"final-year CF "+fmtD(last.cf)+" + net sale "+fmtD(netSale),c:C.teal},
      {l:"Net sale proceeds",v:fmtD(netSale),f:"exit value "+fmtD(Y.exitVal)+" − "+sc+"% selling costs − loan payoff "+fmtD(last.balance)},
    ]},
    {t:"Cumulative cash position (the line chart)",rows:[
      {l:"Starts at",v:fmtD(-R.cashIn),f:"minus your cash invested at close — down payment + closing"+(R.repairCost?" + repairs":"")},
      {l:"Each year adds",v:"that year's cash flow",f:"the line rises by CF/yr from the year-by-year table"},
      {l:"Crosses $0 when",v:"rent has repaid your cash",f:"= the payback point (years to get your money back)",c:C.teal},
      {l:"Final year also adds",v:fmtD(netSale),f:"net proceeds from selling (see IRR section)"},
    ]},
  ];
  return <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:11}}>
    <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 13px",background:open?"var(--c-hl)":C.bg,border:"none",cursor:"pointer",fontFamily:"inherit",borderBottom:open?"1px solid "+C.border:"none"}}>
      <span style={{fontSize:12,fontWeight:700,color:C.heading}}>How total return, IRR & the cash chart are calculated</span>
      <span style={{fontSize:14,color:C.slate,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
    </button>
    {open&&<div style={{padding:"10px 13px",background:C.white}}>
      {sections.map((sec,si)=><div key={si} style={{marginBottom:si<sections.length-1?14:2}}>
        <div style={{fontSize:11,fontWeight:700,color:C.heading,marginBottom:6}}>{sec.t}</div>
        {sec.rows.map((row,i)=><div key={i} style={{marginBottom:7,borderLeft:"3px solid "+(row.bold?(row.c||C.heading):"var(--c-grid)"),paddingLeft:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
            <span style={{fontSize:12,fontWeight:row.bold?700:400,color:row.bold?(row.c||C.heading):C.slate}}>{row.l}</span>
            <span style={{fontSize:12,fontWeight:700,color:row.c||C.text,flexShrink:0,fontVariantNumeric:"tabular-nums",textAlign:"right"}}>{row.v}</span>
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:1,lineHeight:1.5}}>{row.f}</div>
        </div>)}
      </div>)}
      <div style={{padding:"7px 9px",background:C.goldL,borderRadius:7,fontSize:10,color:C.amber,border:"1px solid "+C.border}}>
        Estimates only — appreciation, rent growth, vacancy and exit are assumptions you set in “Projection &amp; Growth”. Depreciation benefit is a rough figure; consult a CPA.
      </div>
    </div>}
  </div>;
}

function ProjectionTab({R,Y,S}){
  const hold=S.projection.holdYears||5;
  const last=Y.yearly[Y.yearly.length-1]||{};
  const sc=(S.projection.sellingCostPct??6);
  const netSale=Math.round((Y.exitVal||0)*(1-sc/100)-(last.balance||0));
  const totRetTip=["Total return = sum of 4 parts:","· Appreciation "+fmtD(Y.appGain),"· Principal paydown "+fmtD(Y.equityBuild),"· Net cash flow "+fmtD(Y.totCF),"· Depreciation est. "+fmtD(Y.deprBen),"= "+fmtD(Y.totRet)+"  ("+fmtP(Y.totRet/(R.cashIn||1)*100)+" of cash in)","Full detail below ↓"];
  const irrTip=["IRR = annual rate where all cash flows net to $0:","· Year 0: "+fmtD(-R.cashIn)+" (cash in)","· Years 1–"+Math.max(1,hold-1)+": each year's CF","· Year "+hold+": CF + net sale "+fmtD(netSale),"= "+fmtP(Y.irr)+" / yr","Full detail below ↓"];
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:8,marginBottom:11}}>
      <div style={{background:C.white,border:"1px solid "+C.border,borderRadius:"var(--c-rad)",padding:"11px 13px"}}>
        <div style={{fontSize:9,marginBottom:3,display:"flex",alignItems:"center",color:C.muted,letterSpacing:"0.04em",textTransform:"uppercase"}}><span>Total return ({hold}yr)</span><Info lines={totRetTip}/></div>
        <div style={{fontSize:19,fontWeight:700,color:Y.totRet>=0?C.heading:C.red,fontVariantNumeric:"tabular-nums"}}>{fmtD(Y.totRet)}</div>
        <div style={{fontSize:10,color:C.muted}}>{fmtP(Y.totRet/(R.cashIn||1)*100)} on cash in</div>
      </div>
      <div style={{background:C.white,border:"1px solid "+C.border,borderRadius:"var(--c-rad)",padding:"11px 13px"}}>
        <div style={{fontSize:9,marginBottom:3,display:"flex",alignItems:"center",color:C.muted,letterSpacing:"0.04em",textTransform:"uppercase"}}><span>Est. IRR</span><Info lines={irrTip}/></div>
        <div style={{fontSize:19,fontWeight:700,color:Y.irr>=15?C.tealS:Y.irr>=10?C.amberS:C.redS,fontVariantNumeric:"tabular-nums"}}>{fmtP(Y.irr)}</div>
        <div style={{fontSize:10,color:C.muted}}>{Y.irr>=15?"Excellent":Y.irr>=10?"Good":"Below target"}</div>
      </div>
    </div>
    <CashflowChart yearly={Y.yearly} cashIn={R.cashIn}/>
    <EquityChart yearly={Y.yearly} loan={R.loan}/>
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:11}}>
      <div style={{padding:"7px 12px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between"}}><span>Year-by-year</span>{hold>12&&<span style={{fontWeight:400,color:C.muted}}>scroll ↓ · {hold} yrs</span>}</div>
      <div className={"ytable-scroll"+(hold>12?" cap":"")} style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr>{["Yr","Rent/unit","NOI/yr","CF/yr","CF/mo","Equity","Value"].map(h=><th key={h} style={{padding:"5px 8px",fontWeight:600,color:C.slate,textAlign:"right",borderBottom:"1px solid "+C.border,whiteSpace:"nowrap",position:"sticky",top:0,background:C.bg,zIndex:1}}>{h}</th>)}</tr></thead>
          <tbody>{Y.yearly.map((row,i)=><tr key={row.year} style={{background:i%2===0?C.white:C.bg}}>
            <td style={{padding:"5px 8px",fontWeight:600,color:C.heading,textAlign:"right"}}>{row.year}</td>
            <td style={{padding:"5px 8px",textAlign:"right"}}>{fmtD(row.monthlyRent)}</td>
            <td style={{padding:"5px 8px",textAlign:"right"}}>{fmtD(row.noi)}</td>
            <td style={{padding:"5px 8px",textAlign:"right",fontWeight:600,color:row.cf>=0?C.teal:C.red}}>{fmtD(row.cf)}</td>
            <td style={{padding:"5px 8px",textAlign:"right",fontWeight:600,color:row.cf>=0?C.teal:C.red}}>{fmtD(row.cf/12)}</td>
            <td style={{padding:"5px 8px",textAlign:"right",color:C.teal}}>{fmtD(row.equity)}</td>
            <td style={{padding:"5px 8px",textAlign:"right"}}>{fmtD(row.propVal)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden"}}>
      <div style={{padding:"7px 12px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border}}>Return components</div>
      <div style={{padding:"12px"}}>
        <ReturnDonut segs={[{label:"Appreciation",value:Y.appGain,color:C.teal},{label:"Principal paydown",value:Y.equityBuild,color:C.heading},{label:"Net cashflow",value:Y.totCF,color:C.gold},{label:"Depreciation benefit (est.)",value:Y.deprBen,color:"#185FA5"}]}/>
        <div style={{fontSize:9,color:C.muted,marginTop:10}}>Exit: {fmtD(Y.exitVal)} · {S.projection.exitCapEnabled?(S.projection.exitCapRate+"% exit cap"):(S.projection.appreciationPct+"%/yr appreciation")} · {(S.projection.sellingCostPct??6)}% selling costs · consult CPA. Donut shows positive contributors only.</div>
      </div>
    </div>
    <div style={{marginTop:11}}><ProjTrace R={R} Y={Y} S={S}/></div>
  </div>;
}
// ── Analysis tab (sensitivity + what needs to be true + loans + comps) ──
function AnalysisTab({SEN,R,S,Y}){
  const[targetCF,setTargetCF]=useState(0);
  const wnt=useMemo(()=>whatNeedsToBeTrue(S,R,targetCF),[S,R,targetCF]);
  const loans=useMemo(()=>calcLoanOptions(S.price,S.financing.downPct,S.financing.rate,S.financing.loanYears),[S.price,S.financing.downPct,S.financing.rate,S.financing.loanYears]);
  const cfColor=v=>v>0?C.teal:v>-500?C.amber:C.red;
  const cfBg=v=>v>0?C.tealL:v>-500?C.amberL:C.redL;
  const rVars=[-1.0,-0.5,0,+0.5,+1.0];

  return <div>
    {/* What needs to be true */}
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:11}}>
      <div style={{padding:"8px 13px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border,letterSpacing:"0.02em"}}>What needs to be true</div>
      <div style={{padding:"12px 13px",background:C.white}}>
        <div style={{fontSize:11,color:C.slate,marginBottom:10}}>Enter your target monthly CF — see what needs to change to hit it</div>
        <div style={{display:"flex",gap:9,alignItems:"end",marginBottom:12}}>
          <div style={{flex:1}}><Field label="Target CF/mo" prefix="$" value={targetCF} onChange={setTargetCF} min={-5000} max={10000} step={50} sub="0 = break-even, positive = cash flow"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",gap:9}}>
          {[
            {label:"Needed rent/unit",val:fmtD(wnt.neededRentPU)+"/mo",curr:fmtD(R.monRent/R.numU)+"/mo current",delta:wnt.neededRentPU-(R.monRent/R.numU),good:wnt.neededRentPU<=R.monRent/R.numU},
            {label:"Max purchase price",val:wnt.neededPrice?fmtD(wnt.neededPrice):"Not possible",curr:fmtD(S.price)+" current",delta:wnt.neededPrice?wnt.neededPrice-S.price:null,good:wnt.neededPrice>=S.price},
            {label:"Needed rate",val:wnt.neededRate+"%",curr:S.financing.rate+"% current",delta:wnt.neededRate-S.financing.rate,good:wnt.neededRate>=S.financing.rate},
          ].map(item=><div key={item.label} style={{padding:"10px 11px",background:C.white,borderRadius:"calc(var(--c-rad) - 2px)",border:"1px solid "+C.border}}>
            <div style={{fontSize:10,color:C.slate,marginBottom:2,letterSpacing:"0.03em",textTransform:"uppercase"}}>{item.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:item.good?C.teal:C.red}}>{item.val}</div>
            <div style={{fontSize:10,color:C.slate,marginTop:2}}>{item.curr}</div>
            {item.delta!==null&&<div style={{fontSize:10,fontWeight:600,color:item.good?C.teal:C.red,marginTop:2}}>{item.delta>=0?"+":""}{item.label.includes("Rate")?(item.delta.toFixed(2)+"%"):(item.label.includes("rent")?fmtD(item.delta):fmtD(item.delta))} vs current</div>}
          </div>)}
        </div>
      </div>
    </div>

    {/* Sensitivity table */}
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:11}}>
      <div style={{padding:"7px 12px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border}}>Monthly CF — price vs rate</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:C.bg}}>
            <th style={{padding:"5px 10px",fontWeight:600,color:C.slate,textAlign:"left",borderBottom:"1px solid "+C.border}}>Price</th>
            {rVars.map(r=><th key={r} style={{padding:"5px 8px",fontWeight:600,color:C.slate,textAlign:"center",borderBottom:"1px solid "+C.border,whiteSpace:"nowrap"}}>{r===0?"Current":(r>0?"+":"")+r.toFixed(1)+"%"}</th>)}
          </tr></thead>
          <tbody>{SEN.priceRate.map((row,ri)=><tr key={ri}>
            <td style={{padding:"5px 10px",fontWeight:600,color:row.label==="Current"?C.heading:C.text,background:row.label==="Current"?"var(--c-hl)":C.white,whiteSpace:"nowrap"}}>
              {row.label==="Current"?"Current":row.label} {row.label!=="Current"&&<span style={{fontSize:9,color:C.slate}}>({fmtD(row.price)})</span>}
            </td>
            {row.cells.map((cell,ci)=>{const isCur=row.label==="Current"&&cell.label==="Current";return <td key={ci} style={{padding:"5px 8px",textAlign:"center",background:cfBg(cell.cf),fontWeight:isCur?800:500,color:cfColor(cell.cf),fontVariantNumeric:"tabular-nums",outline:isCur?"2px solid "+C.heading:"none",outlineOffset:-2}}>{fmtD(cell.cf/12)}/mo</td>;})}
          </tr>)}</tbody>
        </table>
      </div>
    </div>

    {/* Rent sensitivity */}
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:11}}>
      <div style={{padding:"7px 12px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border}}>CF sensitivity — rent/unit</div>
      <div style={{padding:"8px 12px",display:"flex",gap:6,flexWrap:"wrap"}}>
        {SEN.rentCells.map(cell=><div key={cell.delta} style={{flex:1,minWidth:80,padding:"8px",background:cfBg(cell.cf),borderRadius:8,textAlign:"center",border:"1px solid "+(cell.delta===0?C.gold:"transparent")}}>
          <div style={{fontSize:10,color:C.slate,marginBottom:2}}>{cell.delta===0?"Current":(cell.delta>0?"+":"")+fmtD(cell.delta)+"/unit"}</div>
          <div style={{fontSize:13,fontWeight:700,color:cfColor(cell.cf),fontVariantNumeric:"tabular-nums"}}>{fmtD(cell.cf/12)}/mo</div>
          <div style={{fontSize:10,color:C.slate,marginTop:1}}>{fmtP(cell.capRate)} cap</div>
        </div>)}
      </div>
    </div>

    {/* Loan comparison */}
    <div style={{border:"1px solid "+C.border,borderRadius:11,overflow:"hidden",marginBottom:11}}>
      <div style={{padding:"7px 12px",background:C.bg,fontSize:11,fontWeight:700,color:C.heading,borderBottom:"1px solid "+C.border}}>Loan type comparison</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:C.bg}}>{["Type","Rate","Payment/mo","CF/mo","Notes"].map(h=><th key={h} style={{padding:"5px 8px",fontWeight:600,color:C.slate,textAlign:"right",borderBottom:"1px solid "+C.border,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{loans.map((loan,i)=>{
            const loanCF=R.noi-loan.monthly*12;
            const isCurrent=i===0;
            return <tr key={loan.name} style={{background:isCurrent?"var(--c-hl)":i%2===0?C.white:C.bg}}>
              <td style={{padding:"5px 8px",fontWeight:isCurrent?600:400,color:isCurrent?C.heading:C.text,textAlign:"right",whiteSpace:"nowrap"}}>{loan.name}{isCurrent&&<span style={{fontSize:9,marginLeft:4,padding:"1px 5px",background:C.hl,color:C.heading,borderRadius:4}}>current</span>}</td>
              <td style={{padding:"5px 8px",textAlign:"right"}}>{loan.rate.toFixed(3)}%</td>
              <td style={{padding:"5px 8px",textAlign:"right",fontWeight:600}}>{fmtD(loan.monthly)}/mo</td>
              <td style={{padding:"5px 8px",textAlign:"right",fontWeight:600,color:loanCF>=0?C.teal:C.red}}>{fmtD(loanCF/12)}/mo</td>
              <td style={{padding:"5px 8px",textAlign:"right",color:C.slate,fontSize:10}}>{loan.note}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  </div>;
}
// ── Deal comparison (side-by-side) ────────────────────────────
function ScenarioCompare({deals,activeId,currentState}){
  const[open,setOpen]=useState(false);
  const[sel,setSel]=useState([]);
  const[sortBy,setSortBy]=useState("irr");
  const[q,setQ]=useState("");
  const[gradeF,setGradeF]=useState("all");
  const[pickSort,setPickSort]=useState("grade");
  const pool=(deals||[]).filter(d=>d._id!==activeId);
  const toggle=id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  // Compute metrics for each selectable deal (only while the modal is open) so we can
  // search, sort, filter by grade, and show grade + cash flow on each row.
  const info=open?pool.map(d=>{const st=fullState(d);const R=computeBase(st);const Y=computeYearly(st,R);return {d,st,R,Y,score:calcDealScore(R,Y)};}):[];
  const PSORT={grade:["Grade",c=>c.score.pct],cf:["Cash flow",c=>c.R.cf],cap:["Cap rate",c=>c.R.capRate],irr:["IRR",c=>c.Y.irr],price:["Price",c=>c.st.price],recent:["Recently edited",c=>c.d._ts||0],name:["Name (A–Z)",c=>c.d]};
  const ql=q.trim().toLowerCase();
  let picks=info.filter(c=>(gradeF==="all"||c.score.grade===gradeF)&&(!ql||dealTitle(c.d).toLowerCase().includes(ql)));
  picks=pickSort==="name"?picks.sort((a,b)=>dealTitle(a.d).localeCompare(dealTitle(b.d))):picks.sort((a,b)=>(PSORT[pickSort][1](b))-(PSORT[pickSort][1](a)));
  const filteredIds=picks.map(c=>c.d._id);
  const selectAll=()=>setSel(s=>Array.from(new Set([...s,...filteredIds])));
  const cols=[{name:"Current deal",st:currentState,cur:true},...pool.filter(d=>sel.includes(d._id)).map(d=>({name:dealTitle(d),st:fullState(d)}))];
  const computed=cols.map(c=>{const R=computeBase(c.st);const Y=computeYearly(c.st,R);return{...c,R,Y,score:calcDealScore(R,Y)};});
  const rows=[
    {l:"Purchase price",f:c=>fmtD(c.st.price),v:c=>c.st.price},
    {l:"Monthly CF",f:c=>fmtD(c.R.cf/12)+"/mo",col:c=>c.R.cf>=0?C.teal:C.red,v:c=>c.R.cf,best:"max"},
    {l:"CF / unit / mo",f:c=>fmtD(c.R.cf/c.R.numU/12),col:c=>c.R.cf>=0?C.teal:C.red,v:c=>c.R.cf/c.R.numU/12,best:"max"},
    {l:"Cap rate",f:c=>fmtP(c.R.capRate),lvl:c=>lv(c.R.capRate,7,4.5),v:c=>c.R.capRate,best:"max"},
    {l:"Cash-on-cash",f:c=>fmtP(c.R.coc),lvl:c=>lv(c.R.coc,8,4),v:c=>c.R.coc,best:"max"},
    {l:"DSCR",f:c=>c.R.dscr.toFixed(2),lvl:c=>lv(c.R.dscr,1.25,1.0),v:c=>c.R.dscr,best:"max"},
    {l:"Break-even occ.",f:c=>fmtP(c.R.beOcc),lvl:c=>lv(c.R.beOcc,70,85,true),v:c=>c.R.beOcc,best:"min"},
    {l:"Est. IRR",f:c=>fmtP(c.Y.irr),lvl:c=>lv(c.Y.irr,15,10),v:c=>c.Y.irr,best:"max"},
    {l:"Cash needed",f:c=>fmtD(c.R.cashIn),v:c=>c.R.cashIn,best:"min"},
    {l:"Total return",f:c=>fmtD(c.Y.totRet),v:c=>c.Y.totRet,best:"max"},
    {l:"AI source",f:c=>c.st.aiSource||"—"},
  ];
  const lvlCol={good:C.teal,warn:C.amber,bad:C.red};
  const SORTS={irr:["IRR",c=>c.Y.irr],grade:["Grade",c=>c.score.pct],cf:["Cash flow",c=>c.R.cf],cap:["Cap rate",c=>c.R.capRate],coc:["Cash-on-cash",c=>c.R.coc],dscr:["DSCR",c=>c.R.dscr],totRet:["Total return",c=>c.Y.totRet]};
  const sortV=(SORTS[sortBy]||SORTS.irr)[1];
  // keep the current deal pinned first; rank the rest best -> worst by the chosen metric
  const ordered=[...computed.filter(c=>c.cur),...computed.filter(c=>!c.cur).sort((a,b)=>sortV(b)-sortV(a))];
  const bestIdx=row=>{if(!row.best||ordered.length<2)return -1;let bi=0;for(let i=1;i<ordered.length;i++){const better=row.best==="max"?row.v(ordered[i])>row.v(ordered[bi]):row.v(ordered[i])<row.v(ordered[bi]);if(better)bi=i;}return bi;};
  return <>
    <button onClick={()=>setOpen(true)} title="Compare deals side by side" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11,fontWeight:500,padding:"7px 13px",borderRadius:"var(--c-rad)",border:"1px solid var(--c-headborder)",background:"transparent",color:"var(--c-headfg)",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",letterSpacing:"0.02em"}}><Icon name="scale" size={14}/>Compare</button>
    {open&&<div className="no-print" onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(13,31,60,0.55)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 12px",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:14,maxWidth:900,width:"100%",boxShadow:"0 12px 40px rgba(0,0,0,0.3)",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:"var(--c-head)"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600,color:"var(--c-headfg)",letterSpacing:"0.04em"}}><Icon name="scale" size={16}/>Compare deals</span>
          <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"1px solid var(--c-headborder)",color:"var(--c-headfg)",borderRadius:"calc(var(--c-rad) - 4px)",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>✕ Close</button>
        </div>
        <div style={{padding:"14px 16px"}}>
          <div style={{fontSize:11,color:C.slate,marginBottom:8}}>Pick saved deals to compare against your current deal{pool.length===0?" — no other deals saved yet. Add one with ＋ New deal.":". Search, filter by grade, or sort to find them:"}</div>
          {pool.length>0&&<div style={{border:"1px solid "+C.border,borderRadius:10,padding:"10px",marginBottom:12,background:C.bg}}>
            <div style={{display:"flex",gap:7,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name / address…" style={{flex:"1 1 150px",minWidth:0,padding:"6px 10px",fontSize:13,border:"1px solid "+C.border,borderRadius:8,background:C.white,color:C.text,outline:"none"}}/>
              <select value={pickSort} onChange={e=>setPickSort(e.target.value)} title="Sort the list" style={{padding:"6px 8px",fontSize:12,border:"1px solid "+C.border,borderRadius:8,fontFamily:"inherit",color:C.text,background:C.white}}>
                {Object.keys(PSORT).map(k=><option key={k} value={k}>Sort: {PSORT[k][0]}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
              {["all","A","B","C","D"].map(g=>{const on=gradeF===g;return <button key={g} onClick={()=>setGradeF(g)} style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid "+(on?C.navy:C.border),background:on?C.navy:C.white,color:on?"#fff":C.slate}}>{g==="all"?"All":g}</button>;})}
              <span style={{marginLeft:"auto",fontSize:11,color:C.slate}}>{sel.length} selected</span>
            </div>
            <div style={{maxHeight:240,overflowY:"auto",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column",gap:5}}>
              {picks.length===0&&<div style={{fontSize:12,color:C.muted,textAlign:"center",padding:"16px 8px"}}>No deals match.</div>}
              {picks.map(c=>{const on=sel.includes(c.d._id);return <button key={c.d._id} onClick={()=>toggle(c.d._id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",textAlign:"left",padding:"7px 9px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid "+(on?C.navy:C.border),background:on?C.hl:C.white}}>
                <span style={{flexShrink:0,width:18,height:18,borderRadius:5,border:"1.5px solid "+(on?C.navy:C.border),background:on?C.navy:C.white,color:"#fff",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{on?"✓":""}</span>
                <span style={{flex:1,minWidth:0}}>
                  <span style={{display:"block",fontSize:12,fontWeight:700,color:C.heading,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dealTitle(c.d)}</span>
                  <span style={{display:"block",fontSize:10,color:C.muted}}>{fmtD(c.st.price)} · cap {fmtP(c.R.capRate)} · {fmtWhen(c.d._ts)}</span>
                </span>
                <span style={{flexShrink:0,textAlign:"right"}}>
                  <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:9,background:c.score.color,color:"#fff"}}>{c.score.grade}</span>
                  <span style={{display:"block",fontSize:11,fontWeight:700,color:c.R.cf>=0?C.teal:C.red,marginTop:2}}>{fmtD(c.R.cf/12)}/mo</span>
                </span>
              </button>;})}
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button onClick={selectAll} disabled={!picks.length} style={{fontSize:11,padding:"4px 10px",borderRadius:7,border:"1px solid "+C.border,background:C.white,cursor:picks.length?"pointer":"default",color:C.slate,fontFamily:"inherit",opacity:picks.length?1:0.5}}>+ Select all{ql||gradeF!=="all"?" shown":""} ({picks.length})</button>
              {sel.length>0&&<button onClick={()=>setSel([])} style={{fontSize:11,padding:"4px 10px",borderRadius:7,border:"1px solid "+C.border,background:C.white,cursor:"pointer",color:C.slate,fontFamily:"inherit"}}>Clear selection</button>}
            </div>
          </div>}
          {ordered.length>1&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:11,color:C.slate}}>Rank by</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"4px 8px",fontSize:12,border:"1px solid "+C.border,borderRadius:7,fontFamily:"inherit",color:C.text,background:C.white}}>
              {Object.keys(SORTS).map(k=><option key={k} value={k}>{SORTS[k][0]}</option>)}
            </select>
            <span style={{fontSize:10,color:C.muted}}>best → worst · ★ = best in row</span>
          </div>}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>
                <th style={{padding:"7px 10px",textAlign:"left",borderBottom:"2px solid "+C.border,position:"sticky",left:0,background:C.white}}></th>
                {ordered.map((c,i)=><th key={i} style={{padding:"7px 10px",textAlign:"right",borderBottom:"2px solid "+C.border,minWidth:120}}>
                  <div style={{fontSize:11,fontWeight:700,color:c.cur?C.heading:C.text,whiteSpace:"nowrap"}}>{c.name}{c.cur&&<span style={{fontSize:9,marginLeft:4,padding:"1px 5px",background:C.hl,color:C.heading,borderRadius:4}}>current</span>}</div>
                  <div style={{marginTop:3}}><span style={{fontSize:11,fontWeight:700,padding:"1px 8px",borderRadius:10,background:c.score.color,color:"#fff"}}>{c.score.grade} · {c.score.label}</span></div>
                </th>)}
              </tr></thead>
              <tbody>{rows.map((row,ri)=>{const bi=bestIdx(row);return <tr key={ri} style={{background:ri%2?C.bg:C.white}}>
                <td style={{padding:"6px 10px",color:C.slate,fontWeight:600,whiteSpace:"nowrap",position:"sticky",left:0,background:ri%2?C.bg:C.white}}>{row.l}</td>
                {ordered.map((c,i)=>{const col=row.lvl?lvlCol[row.lvl(c)]:row.col?row.col(c):C.text;const win=i===bi;return <td key={i} style={{padding:"6px 10px",textAlign:"right",fontWeight:win?800:600,color:col,fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap",background:win?C.tealL:"transparent"}}>{win?"★ ":""}{row.f(c)}</td>;})}
              </tr>;})}</tbody>
            </table>
          </div>
          {computed.length===1&&<div style={{fontSize:11,color:C.muted,marginTop:12,textAlign:"center"}}>Select one or more saved deals above to see them side-by-side.</div>}
        </div>
      </div>
    </div>}
  </>;
}

// ── Comparables ───────────────────────────────────────────────
let _cid=100;function cuid(){return ++_cid;}
function ComparablesCard({comps,setComps,currentR}){
  const add=()=>setComps(p=>[...p,{id:cuid(),label:"Comp "+(p.length+1),price:550000,rent:5600,capRate:5.5}]);
  const rem=i=>setComps(p=>p.filter((_,j)=>j!==i));
  const setC=(i,k,v)=>setComps(p=>{const a=[...p];a[i]={...a[i],[k]:v};return a;});
  if(comps.length===0)return <Card title="Comparable properties" icon="chart">
    <div style={{fontSize:12,color:C.slate,marginBottom:10}}>Add nearby comparable sales to benchmark this deal against the market.</div>
    <button onClick={add} style={{fontSize:12,padding:"7px 16px",borderRadius:8,border:"1px dashed "+C.border,background:C.white,cursor:"pointer",color:C.slate,fontFamily:"inherit"}}>+ Add comparable</button>
  </Card>;
  const avgCapRate=comps.reduce((s,c)=>s+c.capRate,0)/comps.length;
  const avgPPU=comps.reduce((s,c)=>s+(c.price/(c.rent*12/12)),0)/comps.length;
  return <Card title={"Comparables ("+comps.length+")"} icon="chart">
    <div style={{display:"flex",gap:12,marginBottom:10,padding:"7px 10px",background:C.bg,borderRadius:8,border:"1px solid "+C.border,fontSize:11}}>
      <div><div style={{color:C.slate}}>Avg cap rate comps</div><div style={{fontWeight:700,color:C.text}}>{fmtP(avgCapRate)}</div></div>
      <div><div style={{color:C.slate}}>This deal</div><div style={{fontWeight:700,color:currentR.capRate>=avgCapRate?C.teal:C.red}}>{fmtP(currentR.capRate)} {currentR.capRate>=avgCapRate?"✓ above avg":"↓ below avg"}</div></div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {comps.map((c,i)=><div key={c.id} style={{border:"1px solid "+C.border,borderRadius:9,padding:"8px 10px",background:C.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
          <input value={c.label} onChange={e=>setC(i,"label",e.target.value)} style={{fontSize:12,fontWeight:700,color:C.heading,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",flex:"1 1 auto",minWidth:0,maxWidth:160}}/>
          <button onClick={()=>rem(i)} style={{fontSize:11,color:C.red,background:C.redL,border:"none",borderRadius:5,cursor:"pointer",padding:"3px 8px",flexShrink:0,marginLeft:8}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",gap:7}}>
          <MoneyInput label="Price" value={c.price} onChange={x=>setC(i,"price",x)} small/>
          <MoneyInput label="Total rent/mo" value={c.rent} onChange={x=>setC(i,"rent",x)} small/>
          <Field label="Cap rate" suffix="%" value={c.capRate} onChange={x=>setC(i,"capRate",x)} min={0} max={20} step={0.1} xs/>
        </div>
        <div style={{marginTop:5,fontSize:10,color:C.slate}}>GRM: {fmtX(c.price/(c.rent*12))} · 1% rule: {fmtP(c.rent/c.price*100)}</div>
      </div>)}
    </div>
    <button onClick={add} style={{marginTop:8,fontSize:11,padding:"5px 11px",borderRadius:7,border:"1px dashed "+C.border,background:C.white,cursor:"pointer",color:C.slate,fontFamily:"inherit"}}>+ Add comp</button>
  </Card>;
}
// ── Init state & examples ──────────────────────────────────────
const INIT={
  address:"",notes:"",listingUrl:"",insights:null,aiSource:"",aiAt:0,
  price:620000,
  units:[{id:1,label:"Unit 1",rent:1550,beds:2,bath:1,sqft:900},{id:2,label:"Unit 2",rent:1550,beds:2,bath:1,sqft:900},{id:3,label:"Unit 3",rent:1150,beds:1,bath:1,sqft:650},{id:4,label:"Unit 4",rent:1150,beds:1,bath:1,sqft:650}],
  financing:{downPct:25,rate:7.25,loanYears:30,reserveMonths:0},
  closing:{...DCC},expenses:{...DEX},
  projection:{appreciationPct:4.5,holdYears:5,rentGrowthPct:3,sellingCostPct:6,exitCapEnabled:false,exitCapRate:6,vaEnabled:false,vaMarketRentPerUnit:1750,vaYear:2,refiEnabled:false,refiYear:3,refiRate:6.5},
  repairs:{include:false,unknown:false,amount:0},
  partnership:{enabled:false,myPct:60},
  comparables:[],
};
// A genuinely empty deal for "+ New deal": keeps sensible financing/expense defaults
// but zeroes the property-specific fields so nothing misleads you or the AI prompt.
const BLANK={...INIT,price:0,address:"",notes:"",listingUrl:"",insights:null,comparables:[],units:[{id:1,label:"Unit 1",rent:0,beds:0,bath:0,sqft:0}]};
const EXAMPLES=[
  {id:"en",label:"English Ave",sub:"SW ATL · C/D",tag:"Disaster",col:C.red,address:"English Ave, Atlanta, GA 30314",notes:"Distressed SW Atlanta block. Below-market rents but deferred maintenance, high vacancy and crime drag. Riskier-area financing pushes the rate higher. NOI can't cover the mortgage — a money pit unless bought all-cash at a deep discount.",price:250000,units:[{id:1,label:"Unit 1",rent:700,beds:2,bath:1,sqft:780},{id:2,label:"Unit 2",rent:700,beds:2,bath:1,sqft:780},{id:3,label:"Unit 3",rent:650,beds:1,bath:1,sqft:560},{id:4,label:"Unit 4",rent:650,beds:1,bath:1,sqft:560}],financing:{downPct:25,rate:8.75,loanYears:30},closing:{...DCC,quickPct:3},expenses:{...DEX,mode:"quick",ratio:56,vacancyPct:14,propertyClass:"C"},projection:{...INIT.projection,appreciationPct:1,rentGrowthPct:1},repairs:{include:false,unknown:true,amount:0},partnership:{...INIT.partnership},comparables:[]},
  {id:"cp",label:"College Park",sub:"South ATL · C",tag:"Bad",col:C.red,address:"College Park, GA 30337",notes:"Near the airport, steady C-class demand. Priced too high for the rents it produces — cap rate sits below the mortgage rate, so it bleeds cash every month. Lender DSCR also falls short of 1.0. Needs a price cut to work.",price:410000,units:[{id:1,label:"Unit 1",rent:1150,beds:2,bath:1,sqft:880},{id:2,label:"Unit 2",rent:1150,beds:2,bath:1,sqft:880},{id:3,label:"Unit 3",rent:1050,beds:1,bath:1,sqft:680},{id:4,label:"Unit 4",rent:1050,beds:1,bath:1,sqft:680}],financing:{downPct:25,rate:7.5,loanYears:30},closing:{...DCC,quickPct:3},expenses:{...DEX,mode:"quick",ratio:49,vacancyPct:8,propertyClass:"C"},projection:{...INIT.projection,appreciationPct:2.5,rentGrowthPct:2},repairs:{include:false,unknown:false,amount:0},partnership:{...INIT.partnership},comparables:[]},
  {id:"cl",label:"Clarkston",sub:"DeKalb · B−",tag:"Mixed",col:C.amber,address:"Clarkston, GA 30021",notes:"Stable, diverse DeKalb rental market with reliable demand. Roughly breaks even today with a thin DSCR — the return is mostly a bet on modest appreciation and rent growth. Workable but no margin for error.",price:520000,units:[{id:1,label:"Unit 1",rent:1500,beds:2,bath:1,sqft:930},{id:2,label:"Unit 2",rent:1500,beds:2,bath:1,sqft:930},{id:3,label:"Unit 3",rent:1325,beds:1,bath:1,sqft:700},{id:4,label:"Unit 4",rent:1325,beds:1,bath:1,sqft:700}],financing:{downPct:25,rate:7.25,loanYears:30},closing:{...DCC,quickPct:3},expenses:{...DEX,mode:"quick",ratio:45,vacancyPct:6,propertyClass:"B"},projection:{...INIT.projection,appreciationPct:3.2,rentGrowthPct:3},repairs:{include:false,unknown:false,amount:0},partnership:{...INIT.partnership},comparables:[]},
  {id:"sm",label:"Smyrna",sub:"Cobb · B+",tag:"Good",col:C.teal,address:"Smyrna, GA 30080",notes:"Strong Cobb County submarket — low vacancy, good schools, steady appreciation. Bought at a fair price with a relationship rate, it clears a 1.2 DSCR and cash-flows from day one. A solid, financeable hold.",price:620000,units:[{id:1,label:"Unit 1",rent:1800,beds:2,bath:1,sqft:950},{id:2,label:"Unit 2",rent:1800,beds:2,bath:1,sqft:950},{id:3,label:"Unit 3",rent:1550,beds:1,bath:1,sqft:700},{id:4,label:"Unit 4",rent:1550,beds:1,bath:1,sqft:700}],financing:{downPct:25,rate:6.9,loanYears:30},closing:{...DCC,quickPct:3},expenses:{...DEX,mode:"quick",ratio:42,vacancyPct:5,propertyClass:"B"},projection:{...INIT.projection,appreciationPct:4,rentGrowthPct:3.5},repairs:{include:false,unknown:false,amount:0},partnership:{...INIT.partnership},comparables:[]},
  {id:"kw",label:"Kirkwood",sub:"Intown · Value-add",tag:"Home run",col:C.teal,address:"Kirkwood, Atlanta, GA 30317",notes:"Off-market intown fourplex with below-market rents and light cosmetic needs. Bought right, it already cash-flows and clears every metric. Turn the units and push rents to market (≈$2,050) for forced appreciation and a true home run.",price:550000,units:[{id:1,label:"Unit 1",rent:1850,beds:2,bath:1,sqft:950},{id:2,label:"Unit 2",rent:1850,beds:2,bath:1,sqft:950},{id:3,label:"Unit 3",rent:1600,beds:1,bath:1,sqft:680},{id:4,label:"Unit 4",rent:1600,beds:1,bath:1,sqft:680}],financing:{downPct:25,rate:6.75,loanYears:30},closing:{...DCC,quickPct:3.5},expenses:{...DEX,mode:"quick",ratio:40,vacancyPct:5,propertyClass:"B"},projection:{...INIT.projection,appreciationPct:5,rentGrowthPct:4,vaEnabled:true,vaMarketRentPerUnit:2050,vaYear:2},repairs:{include:true,unknown:false,amount:25000},partnership:{...INIT.partnership},comparables:[]},
];
let _uid=10;function uid(){return ++_uid;}

// ── Deal portfolio (many deals, auto-saved to localStorage) ───
const DEALS_KEY="re_deals_v1";
let _dseq=0;
function newDealId(){return "d"+Date.now().toString(36)+(_dseq++).toString(36);}
function fullState(d){d=d||{};
  const units=Array.isArray(d.units)&&d.units.length?d.units:INIT.units;
  return {...INIT,...d,
  financing:{...INIT.financing,...(d.financing||{})},
  closing:{...DCC,...(d.closing||{})},
  expenses:{...DEX,...(migrateExpenses(d.expenses,units.length)||{})},
  projection:{...INIT.projection,...(d.projection||{})},
  repairs:{...INIT.repairs,...(d.repairs||{})},
  partnership:{...INIT.partnership,...(d.partnership||{})},
  units,
  comparables:Array.isArray(d.comparables)?d.comparables:[]};}
function makeDeal(data,meta){const ts=Date.now();meta=meta||{};const{_id,_name,_label,_ts,_created,...d}=fullState(data);return {...d,_id:newDealId(),_label:meta.label||_label||_name||"",_ts:meta.ts||ts,_created:meta.created||ts};}
function dealTitle(d){return (d&&d._label&&d._label.trim())||(d&&d.address&&d.address.trim())||"Untitled deal";}
// Tombstones: id -> deletion timestamp. Kept module-level so persistDeals/sync always
// include them, so a deleted deal stays deleted (and the delete propagates to the cloud).
let TOMB={};
function persistDeals(deals,activeId){try{localStorage.setItem(DEALS_KEY,JSON.stringify({deals,activeId,deleted:TOMB}));}catch{}}
// Merge two deal libraries (local + cloud) for cross-device sync: union by _id (newest
// edit wins), minus tombstoned deals (a delete wins unless the deal was edited after it).
// Returns {deals, activeId, deleted}. Pure & testable.
function mergeDealStores(localStore,cloudStore){
  localStore=localStore||{};cloudStore=cloudStore||{};
  const tomb={};
  const addTomb=t=>{if(t)for(const id in t){if(!(id in tomb)||t[id]>tomb[id])tomb[id]=t[id];}};
  addTomb(localStore.deleted);addTomb(cloudStore.deleted);
  const byId=new Map();
  const add=d=>{if(!d||!d._id)return;const ex=byId.get(d._id);if(!ex||(d._ts||0)>(ex._ts||0))byId.set(d._id,d);};
  (localStore.deals||[]).forEach(add);
  (cloudStore.deals||[]).forEach(add);
  const deals=[...byId.values()].filter(d=>!(d._id in tomb)||(d._ts||0)>tomb[d._id]).sort((a,b)=>(a._created||0)-(b._created||0));
  const survive=new Set(deals.map(d=>d._id));
  const deleted={};for(const id in tomb){if(!survive.has(id))deleted[id]=tomb[id];}
  const has=id=>survive.has(id);
  const activeId=has(localStore.activeId)?localStore.activeId:has(cloudStore.activeId)?cloudStore.activeId:(deals.length?deals[deals.length-1]._id:null);
  return {deals,activeId,deleted};
}
function loadDealStore(){
  try{const r=JSON.parse(localStorage.getItem(DEALS_KEY));if(r&&Array.isArray(r.deals)&&r.deals.length){TOMB=r.deleted&&typeof r.deleted==="object"?r.deleted:{};return {deals:r.deals,activeId:r.deals.some(d=>d._id===r.activeId)?r.activeId:r.deals[r.deals.length-1]._id};}}catch{}
  const deals=[];
  try{const sc=JSON.parse(localStorage.getItem("re_scenarios")||"[]");if(Array.isArray(sc))sc.forEach(s=>deals.push(makeDeal(s,{label:s._name,ts:s._ts,created:s._ts})));}catch{}
  try{const a=JSON.parse(localStorage.getItem("re_autosave"));if(a&&typeof a==="object"&&Object.keys(a).length)deals.push(makeDeal(a,{}));}catch{}
  if(!deals.length)deals.push(makeDeal(INIT,{}));
  persistDeals(deals,deals[deals.length-1]._id);
  return {deals,activeId:deals[deals.length-1]._id};
}
function relTime(ts){
  if(!ts)return "";
  const d=Math.floor((Date.now()-ts)/86400000);
  if(d<=0)return "today";if(d===1)return "yesterday";
  if(d<7)return d+" days ago";if(d<30)return Math.floor(d/7)+"w ago";
  if(d<365)return Math.floor(d/30)+"mo ago";return Math.floor(d/365)+"y ago";
}
// Compact absolute last-modified stamp (mobile-friendly):
// today -> "3:45p" · yesterday -> "Yest 3:45p" · this year -> "Jun 22, 3:45p" · older -> "Jun 22 '24"
const _MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtWhen(ts){
  if(!ts)return "";
  const d=new Date(ts),now=new Date();
  let h=d.getHours();const ap=h<12?"a":"p";h=h%12||12;
  const time=h+":"+String(d.getMinutes()).padStart(2,"0")+ap;
  const day=d.toDateString(),today=now.toDateString();
  const yest=new Date(now.getTime()-86400000).toDateString();
  if(day===today)return time;
  if(day===yest)return "Yest "+time;
  const md=_MON[d.getMonth()]+" "+d.getDate();
  return d.getFullYear()===now.getFullYear()?md+", "+time:md+" '"+String(d.getFullYear()).slice(2);
}

function DealsDrawer({open,onClose,deals,activeId,liveTitle,onSelect,onNew,onRename,onDelete,onDuplicate,onExportAll,onImportAll}){
  const[q,setQ]=useState("");
  const[sortBy,setSortBy]=useState("recent");
  const[gradeF,setGradeF]=useState("all");
  const[editId,setEditId]=useState(null);
  const[editVal,setEditVal]=useState("");
  if(!open)return null;
  // Compute metrics once per deal so we can sort/filter and render without recomputing.
  const enriched=deals.map(d=>{const fs=fullState(d),R=computeBase(fs),Y=computeYearly(fs,R),sc=calcDealScore(R,Y);return {d,R,Y,sc};});
  const SORTS={recent:["Recently edited",c=>c.d._ts||0],grade:["Grade",c=>c.sc.pct],cf:["Cash flow",c=>c.R.cf],cap:["Cap rate",c=>c.R.capRate],irr:["IRR",c=>c.Y.irr],price:["Price",c=>c.d.price],name:["Name (A–Z)",null]};
  const ql=q.trim().toLowerCase();
  let list=enriched.filter(c=>(gradeF==="all"||c.sc.grade===gradeF)&&(!ql||dealTitle(c.d).toLowerCase().includes(ql)));
  list=sortBy==="name"?list.sort((a,b)=>dealTitle(a.d).localeCompare(dealTitle(b.d))):list.sort((a,b)=>SORTS[sortBy][1](b)-SORTS[sortBy][1](a));
  const startEdit=d=>{setEditId(d._id);setEditVal(d._label||d.address||"");};
  const commitEdit=()=>{if(editId!=null)onRename(editId,editVal.trim());setEditId(null);};
  const xbtn={fontSize:10,padding:"3px 8px",borderRadius:6,border:"1px solid "+C.border,background:C.bg,color:C.slate,cursor:"pointer",fontFamily:"inherit"};
  return <div className="no-print" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(2px)",WebkitBackdropFilter:"blur(2px)",zIndex:1000,display:"flex",justifyContent:"flex-end"}}>
    <div onClick={e=>e.stopPropagation()} style={{width:"min(440px,100%)",height:"100%",background:C.bg,borderLeft:"1px solid "+C.border,display:"flex",flexDirection:"column",boxShadow:"-12px 0 40px rgba(0,0,0,0.55)"}}>
      <div style={{padding:"14px 16px",background:"var(--c-head)",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:600,color:"var(--c-headfg)",letterSpacing:"0.04em"}}>My deals <span style={{opacity:0.55,fontWeight:400}}>({deals.length})</span></span>
        <button onClick={onClose} style={{background:"transparent",border:"1px solid var(--c-headborder)",color:"var(--c-headfg)",borderRadius:"calc(var(--c-rad) - 4px)",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>✕ Close</button>
      </div>
      <div style={{padding:"10px 12px 8px",borderBottom:"1px solid "+C.border,background:C.white,flexShrink:0}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by address / name…" style={{flex:1,minWidth:0,padding:"7px 10px",fontSize:13,border:"1px solid "+C.border,borderRadius:8,background:C.bg,color:C.text,outline:"none"}}/>
          <button onClick={onNew} style={{padding:"7px 13px",borderRadius:8,background:C.navy,color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,whiteSpace:"nowrap"}}>+ New</button>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} title="Sort deals" style={{padding:"5px 8px",fontSize:12,border:"1px solid "+C.border,borderRadius:8,fontFamily:"inherit",color:C.text,background:C.bg}}>
            {Object.keys(SORTS).map(k=><option key={k} value={k}>Sort: {SORTS[k][0]}</option>)}
          </select>
          {["all","A","B","C","D"].map(g=>{const on=gradeF===g;return <button key={g} onClick={()=>setGradeF(g)} style={{fontSize:11,fontWeight:700,padding:"4px 9px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid "+(on?C.navy:C.border),background:on?C.navy:C.bg,color:on?"#fff":C.slate}}>{g==="all"?"All":g}</button>;})}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px",WebkitOverflowScrolling:"touch"}}>
        {list.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:12,padding:"28px 12px"}}>No deals match{ql?" “"+q+"”":""}{gradeF!=="all"?" · grade "+gradeF:""}.</div>}
        {list.map(({d,R,Y,sc})=>{
          const isA=d._id===activeId,editing=editId===d._id;
          return <div key={d._id} onClick={()=>{if(!editing){onSelect(d._id);onClose();}}} style={{border:"1px solid "+(isA?C.navy:C.border),background:isA?C.hl:C.white,borderRadius:10,padding:"9px 11px",marginBottom:7,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                {editing
                  ? <input autoFocus value={editVal} onClick={e=>e.stopPropagation()} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")commitEdit();if(e.key==="Escape")setEditId(null);}} onBlur={commitEdit} placeholder="Name this deal…" style={{width:"100%",padding:"3px 6px",fontSize:13,border:"1px solid "+C.navy,borderRadius:6,fontFamily:"inherit",color:C.text,background:C.white}}/>
                  : <div style={{fontSize:13,fontWeight:700,color:C.heading,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isA?(liveTitle||dealTitle(d)):dealTitle(d)}</div>}
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{fmtD(d.price)} · {(d.units||[]).length} units{isA?" · open now":""}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:1}}>✎ {fmtWhen(d._ts)} <span style={{opacity:0.6}}>· {relTime(d._ts)}</span>{d.aiSource?<span> · {d.aiSource}</span>:""}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:9,background:sc.color,color:"#fff"}}>{sc.grade}</span>
                <div style={{fontSize:11,fontWeight:700,color:R.cf>=0?C.teal:C.red,marginTop:3}}>{fmtD(R.cf/12)}/mo</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>startEdit(d)} style={xbtn}>✎ Rename</button>
              <button onClick={()=>onDuplicate(d._id)} style={xbtn}>⧉ Duplicate</button>
              <button onClick={()=>onDelete(d._id)} style={{...xbtn,color:C.red,borderColor:C.redL}}>Delete</button>
              {/^https?:\/\//i.test(d.listingUrl||"")&&<a href={d.listingUrl} target="_blank" rel="noopener noreferrer" style={{...xbtn,color:C.heading,textDecoration:"none",marginLeft:"auto"}}>↗ Listing</a>}
            </div>
          </div>;
        })}
      </div>
      <div style={{flexShrink:0,borderTop:"1px solid "+C.border,background:C.white,padding:"10px 12px"}}>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onExportAll} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.bg,color:C.slate,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>Export all ({deals.length})</button>
          <button onClick={onImportAll} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.bg,color:C.slate,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>Import all</button>
        </div>
        <div style={{fontSize:9,color:C.muted,marginTop:6,lineHeight:1.5}}>Backs up every deal to one JSON file (your deals live only in this browser). Import adds them to your library.</div>
      </div>
    </div>
  </div>;
}
// ── Area & due-diligence: qualitative context (AI-filled + editable). Non-math.
// Stays a slim "add" bar when empty; doesn't affect any formula.
function AreaInsights({data,onChange}){
  const d=(data&&typeof data==="object")?data:{};
  const has=d.neighborhoodGrade||d.schools||d.safety||d.appreciation||d.demand||(d.pros||[]).length||(d.cons||[]).length||(d.risks||[]).length;
  const[edit,setEdit]=useState(false);
  if(!has&&!edit)return <button onClick={()=>setEdit(true)} className="no-print" style={{width:"100%",padding:"9px 12px",borderRadius:11,border:"1px dashed "+C.border,background:"transparent",color:C.slate,fontSize:12,fontFamily:"inherit",cursor:"pointer",marginBottom:11,textAlign:"left"}}>Add area &amp; due-diligence notes <span style={{color:C.muted}}>— neighborhood, schools, safety, pros/cons (optional; or let Quick-fill AI fill it)</span></button>;
  const set=(k,v)=>onChange({...d,[k]:v});
  const setList=(k,text)=>onChange({...d,[k]:String(text).split("\n").map(s=>s.trim()).filter(Boolean)});
  const gCol={A:C.teal,B:C.blueS,C:C.amber,D:C.red}[String(d.neighborhoodGrade||"").charAt(0)]||C.slate;
  const Badge=({label,val,col})=>val?<div style={{textAlign:"center",padding:"6px 10px",borderRadius:8,background:C.bg,border:"1px solid "+C.border,minWidth:0}}>
    <div style={{fontSize:9,color:C.muted,marginBottom:2}}>{label}</div>
    <div style={{fontSize:13,fontWeight:700,color:col||C.heading,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
  </div>:null;
  const line=(label,val)=>val?<div style={{marginBottom:6}}><span style={{fontSize:10,fontWeight:700,color:C.slate}}>{label}: </span><span style={{fontSize:11,color:C.text}}>{val}</span></div>:null;
  const list=(label,items,col,mark)=>(items&&items.length)?<div style={{marginTop:8}}>
    <div style={{fontSize:10,fontWeight:700,color:col,marginBottom:3}}>{label}</div>
    {items.map((s,i)=><div key={i} style={{fontSize:11,color:C.text,display:"flex",gap:6,marginBottom:2}}><span style={{color:col,flexShrink:0}}>{mark}</span><span>{s}</span></div>)}
  </div>:null;
  const inp={width:"100%",boxSizing:"border-box",padding:"6px 8px",fontSize:12,border:"1px solid "+C.border,borderRadius:7,fontFamily:"inherit",color:C.text,background:C.white,outline:"none"};
  const lbl={fontSize:10,fontWeight:700,color:C.slate,marginBottom:3,display:"block"};
  const ta=t=>({...inp,resize:"vertical",lineHeight:1.4});
  const toggle=<button onClick={()=>setEdit(e=>!e)} style={{fontSize:11,fontWeight:700,color:C.slate,background:C.bg,border:"1px solid "+C.border,borderRadius:7,padding:"4px 11px",cursor:"pointer",fontFamily:"inherit"}}>{edit?"Done":"Edit"}</button>;
  return <Card title="Area & due-diligence" icon="pin" right={toggle} collapsible defaultOpen storeKey="area">
    <div style={{fontSize:10,color:C.muted,marginBottom:9}}>Context only — does not affect the math. AI fills it via Quick-fill; edit anything. Verify schools/crime/flood independently.</div>
    {edit?<div style={{display:"flex",flexDirection:"column",gap:9}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
        <div><label style={lbl}>Neighborhood</label><select value={d.neighborhoodGrade||""} onChange={e=>set("neighborhoodGrade",e.target.value)} style={inp}><option value="">—</option>{["A","B","C","D"].map(g=><option key={g} value={g}>{g}</option>)}</select></div>
        <div><label style={lbl}>Schools /10</label><input value={d.schools||""} onChange={e=>set("schools",num(e.target.value))} inputMode="numeric" placeholder="0" style={inp}/></div>
        <div><label style={lbl}>Safety</label><input value={d.safety||""} onChange={e=>set("safety",e.target.value)} placeholder="low crime" style={inp}/></div>
      </div>
      <div><label style={lbl}>Appreciation outlook</label><input value={d.appreciation||""} onChange={e=>set("appreciation",e.target.value)} placeholder="e.g. high — near BeltLine extension" style={inp}/></div>
      <div><label style={lbl}>Rental demand</label><input value={d.demand||""} onChange={e=>set("demand",e.target.value)} placeholder="e.g. strong; students nearby" style={inp}/></div>
      <div><label style={lbl}>Pros (one per line)</label><textarea rows={2} value={(d.pros||[]).join("\n")} onChange={e=>setList("pros",e.target.value)} style={ta()}/></div>
      <div><label style={lbl}>Cons (one per line)</label><textarea rows={2} value={(d.cons||[]).join("\n")} onChange={e=>setList("cons",e.target.value)} style={ta()}/></div>
      <div><label style={lbl}>Risks / red flags (one per line)</label><textarea rows={2} value={(d.risks||[]).join("\n")} onChange={e=>setList("risks",e.target.value)} style={ta()}/></div>
    </div>:<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7,marginBottom:11}}>
        <Badge label="Neighborhood" val={d.neighborhoodGrade} col={gCol}/>
        <Badge label="Schools" val={d.schools>0?d.schools+"/10":""}/>
        <Badge label="Safety" val={d.safety}/>
      </div>
      {line("Appreciation",d.appreciation)}
      {line("Rental demand",d.demand)}
      {list("Pros",d.pros,C.teal,"✓")}
      {list("Cons",d.cons,C.amber,"•")}
      {list("Risks / red flags",d.risks,C.red,"⚠")}
    </div>}
  </Card>;
}
// ── Listing link: compact Open + Edit (input only while editing) ──
function ListingLink({url,onChange}){
  const[edit,setEdit]=useState(false);
  const valid=/^https?:\/\//i.test(url||"");
  const b={fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"};
  return <div style={{display:"flex",flexDirection:"column",gap:5}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <label style={{fontSize:11,color:C.slate,fontWeight:600}}>Listing</label>
      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
        {valid&&<a href={url} target="_blank" rel="noopener noreferrer" style={{...b,background:C.navy,color:"#fff",border:"1px solid "+C.navy,textDecoration:"none"}}>↗ Open</a>}
        <button onClick={()=>setEdit(e=>!e)} style={{...b,background:C.white,color:C.slate,border:"1px solid "+C.border}}>{edit?"Done":(valid?"✎ Edit":"+ Add link")}</button>
      </div>
    </div>
    {edit&&<input autoFocus value={url||""} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape")setEdit(false);}} placeholder="https://www.zillow.com/homedetails/…" inputMode="url"
      style={{padding:"7px 10px",fontSize:13,border:"1px solid "+C.navy,borderRadius:7,fontFamily:"inherit",color:C.text,outline:"none"}}/>}
  </div>;
}
// ── Quick fill (paste a listing / round-trip an AI estimate) ──
function QuickFill({state,onListing,onAI,onSource}){
  const[lt,setLt]=useState("");
  const[at,setAt]=useState("");
  const[msg,setMsg]=useState(null);
  const[done,setDone]=useState("");           // transient in-button confirmation key
  const flash=k=>{setMsg(null);setDone(k);setTimeout(()=>setDone(d=>d===k?"":d),1600);};
  const ta={width:"100%",boxSizing:"border-box",padding:"7px 9px",fontSize:12,border:"1px solid "+C.border,borderRadius:8,fontFamily:"inherit",color:C.text,background:C.white,outline:"none",resize:"vertical",lineHeight:1.45};
  const btn={padding:"6px 12px",borderRadius:8,background:C.navy,color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700};
  // One step: grab what we can from the link to fill the form, then copy the prompt
  // (the link is baked into it) to paste into any chat AI. No separate "fill" button.
  const copyPrompt=()=>{
    const pl=parseListing(lt)||{};
    if(pl.address||num(pl.price)>0||pl.units||pl.url)onListing(pl);
    const merged={...state};if(pl.address)merged.address=pl.address;if(num(pl.price)>0)merged.price=num(pl.price);
    const txt=buildAIPrompt(merged,lt);
    try{navigator.clipboard.writeText(txt).then(()=>flash("copy"),()=>setMsg({t:"Select the prompt below and copy it manually.",prompt:txt}));}catch(e){setMsg({t:"Copy not supported here — select & copy the prompt below:",prompt:txt});}
  };
  const doAI=()=>{const o=parseAIResult(at);if(!o){setMsg({e:1,t:"Couldn't read JSON — paste the AI's JSON answer."});return;}onAI(o);flash("ai");};
  return <Card title="Auto-fill — paste a listing & round-trip AI" icon="bolt" collapsible defaultOpen={false} storeKey="quickfill">
    <div>
      <div style={{fontSize:11,color:C.muted,marginBottom:10}}>Paste a Zillow link to grab the address, then let any chat AI estimate rents, taxes &amp; expenses. Tip: hit <strong>＋ New deal</strong> first to keep this as its own saved property.</div>
      <SecLabel text="1 · Paste the Zillow link & copy the prompt"/>
      <div style={{fontSize:11,color:C.muted,marginBottom:6}}>No need to select text — just copy the page link. <span style={{color:C.slate}}>iPhone: in the Zillow app tap <strong>Share → Copy</strong>; in Safari tap the address bar → <strong>Copy</strong>.</span> (You can paste full listing text instead if you have it.)</div>
      <textarea value={lt} onChange={e=>setLt(e.target.value)} rows={2} placeholder="https://www.zillow.com/homedetails/…  (or paste listing text)" style={ta}/>
      <div style={{fontSize:11,color:C.slate,margin:"6px 0"}}>One click grabs the address &amp; price from the link <em>and</em> copies a prompt with the link baked in — paste it into any chat AI.</div>
      <div style={{marginBottom:14}}><button onClick={copyPrompt} style={btn}>{done==="copy"?"✓ Copied":"Copy AI prompt"}</button></div>

      <SecLabel text="2 · Paste the AI's answer"/>
      <div style={{fontSize:11,color:C.slate,marginBottom:6}}>Run that prompt in your AI, then paste its JSON answer back here.</div>
      <textarea value={at} onChange={e=>setAt(e.target.value)} rows={3} placeholder='Paste the AI&#39;s JSON answer here, e.g. {"price":620000,"units":[…],"expenses":{…},"opinion":"…"}' style={ta}/>
      <div style={{marginTop:6}}><button onClick={doAI} style={btn}>{done==="ai"?"✓ Applied":"Apply AI estimate"}</button></div>
      <div style={{marginTop:9,display:"flex",alignItems:"center",gap:7}}>
        <span style={{fontSize:11,color:C.slate,whiteSpace:"nowrap"}}>AI source</span>
        <input value={state.aiSource||""} onChange={e=>onSource(e.target.value)} placeholder="e.g. Gemini 2.5 Pro" style={{flex:1,minWidth:0,boxSizing:"border-box",padding:"6px 9px",fontSize:12,border:"1px solid "+C.border,borderRadius:8,fontFamily:"inherit",color:C.text,background:C.white,outline:"none"}}/>
      </div>
      <div style={{fontSize:9,color:C.muted,marginTop:3}}>Auto-set from the AI's answer — correct it here if it was vague (models often misname their version).</div>

      {msg&&<div style={{marginTop:10,padding:"7px 10px",borderRadius:8,fontSize:11,background:msg.e?C.redL:C.tealL,color:msg.e?C.red:C.teal,border:"1px solid "+(msg.e?C.border:C.border)}}>{msg.t}{msg.prompt&&<textarea readOnly value={msg.prompt} rows={5} onFocus={e=>e.target.select()} style={{...ta,marginTop:6,fontSize:10}}/>}</div>}
    </div>
  </Card>;
}
// Header overflow menu — keeps the top bar to a couple of primary actions.
// The panel is rendered position:fixed (anchored to the trigger) so the header's
// overflow:hidden / stacking context can't clip it.
function HeaderMenu({btnStyle,items}){
  const[open,setOpen]=useState(false);
  const[pos,setPos]=useState(null);
  const ref=useRef(null);
  const toggle=()=>{
    if(open){setOpen(false);return;}
    const W=212;
    try{const r=ref.current.getBoundingClientRect();const vw=window.innerWidth;const left=Math.max(8,Math.min(r.right-W,vw-W-8));setPos({left,top:r.bottom+6,W});}catch(e){setPos({left:8,top:52,W});}
    setOpen(true);
  };
  return <div style={{position:"relative"}}>
    <button ref={ref} onClick={toggle} style={{...btnStyle}} title="More actions">⋯ More</button>
    {open&&pos&&<>
      <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:1200}}/>
      <div style={{position:"fixed",left:pos.left,top:pos.top,width:pos.W,zIndex:1201,background:C.white,border:"1px solid "+C.border,borderRadius:12,boxShadow:"0 14px 36px rgba(0,0,0,0.22)",padding:6}}>
        {items.filter(Boolean).map((it,i)=>it.node
          ? <div key={i} style={{padding:"6px 8px",borderTop:i?"1px solid "+C.grid:"none"}}>{it.node}</div>
          : <button key={i} onClick={()=>{setOpen(false);it.onClick&&it.onClick();}} style={{display:"flex",alignItems:"center",gap:9,width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:it.danger?C.red:C.text}}>{it.label}</button>)}
      </div>
    </>}
  </div>;
}
// Segmented style picker for the (dark) header bar — switches the whole skin.
function SkinToggle({skin,setSkin}){
  return <div style={{display:"inline-flex",gap:2,padding:2,borderRadius:"var(--c-rad)",background:"transparent",border:"1px solid var(--c-headborder)"}}>
    {SKINS.map(([id,lbl])=>{const on=skin===id;return <button key={id} onClick={()=>setSkin(id)} title={"Style: "+lbl} style={{fontSize:10,fontWeight:700,padding:"4px 9px",borderRadius:"calc(var(--c-rad) - 2px)",border:"none",cursor:"pointer",fontFamily:"inherit",background:on?C.gold:"transparent",color:on?"#fff":"var(--c-headfg)",letterSpacing:"0.02em",whiteSpace:"nowrap"}}>{lbl}</button>;})}
  </div>;
}
// ── App ────────────────────────────────────────────────────────
export default function App(){
  const[boot]=useState(loadDealStore);
  const[deals,setDeals]=useState(boot.deals);
  const[activeId,setActiveId]=useState(boot.activeId);
  const[state,setState]=useState(()=>fullState(boot.deals.find(d=>d._id===boot.activeId)||boot.deals[0]));
  const touchRef=useRef(false);
  const[dealsOpen,setDealsOpen]=useState(false);
  const[undo,setUndo]=useState(null);
  const undoTimer=useRef(null);
  const[showEx,setShowEx]=useState(false);
  const[showUD,setShowUD]=useState(false);
  const[selEx,setSelEx]=useState(null);
  const[tab,setTab]=useState(()=>{try{return localStorage.getItem("re_tab")||"overview";}catch(e){return "overview";}});
  useEffect(()=>{try{localStorage.setItem("re_tab",tab);}catch(e){}},[tab]);
  const[isPrinting,setIsPrinting]=useState(false);
  const[toast,setToast]=useState("");   // transient bottom confirmation (e.g. "Link copied")
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),2600);return ()=>clearTimeout(t);},[toast]);
  const[dark,setDark]=useState(()=>{try{const t=localStorage.getItem("re_theme");if(t)return t==="dark";return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;}catch{return false;}});
  useEffect(()=>{try{document.documentElement.setAttribute("data-theme",dark?"dark":"light");localStorage.setItem("re_theme",dark?"dark":"light");}catch{}},[dark]);
  const[skin,setSkin]=useState(()=>{try{return localStorage.getItem("re_skin")||"calm";}catch(e){return "calm";}});
  useEffect(()=>{try{document.documentElement.setAttribute("data-skin",skin);localStorage.setItem("re_skin",skin);}catch(e){}},[skin]);

  // ── Cloud sync (Supabase) — dormant unless config.js + the CDN client exist ──
  const cloudCfg=(typeof window!=="undefined"&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY&&window.supabase)?{url:window.SUPABASE_URL,key:window.SUPABASE_ANON_KEY}:null;
  const supa=useRef(null);
  const[user,setUser]=useState(null);
  const[sync,setSync]=useState("idle"); // idle | syncing | synced | error
  const pushTimer=useRef(null);
  const storeRef=useRef({deals,activeId});           // always-current snapshot (avoids stale closures in sync)
  useEffect(()=>{storeRef.current={deals,activeId};},[deals,activeId]);
  const syncedOnce=useRef(false);                    // full merge-and-open happens once per load, not on every focus
  const applyStore=st=>{touchRef.current=false;TOMB=st.deleted||{};setDeals(st.deals);setActiveId(st.activeId);persistDeals(st.deals,st.activeId);const a=st.deals.find(d=>d._id===st.activeId)||st.deals[0];if(a)setState(fullState(a));setSelEx(null);};
  const pushCloud=(uid,deals2,activeId2)=>{const c=supa.current;if(!c||!uid)return;setSync("syncing");c.from("user_data").upsert({user_id:uid,data:{deals:deals2,activeId:activeId2,deleted:TOMB},updated_at:new Date().toISOString()}).then(({error})=>setSync(error?"error":"synced"));};
  const fetchCloud=async u=>{const{data,error}=await supa.current.from("user_data").select("data").eq("user_id",u.id).maybeSingle();if(error)throw error;return (data&&data.data)||{deals:[],activeId:null,deleted:{}};};
  // Initial sync (sign-in / page load): merge cloud in and keep the deal you had open.
  const initialSync=async u=>{if(!supa.current||!u)return;setSync("syncing");try{const cloud=await fetchCloud(u);const cur={...storeRef.current,deleted:TOMB};const merged=mergeDealStores(cur,cloud);if(merged.deals.some(d=>d._id===cur.activeId))merged.activeId=cur.activeId;applyStore(merged);pushCloud(u.id,merged.deals,merged.activeId);}catch(e){setSync("error");}};
  // Re-sync (returning to the tab / token refresh): pull other devices' changes WITHOUT
  // touching the deal you're currently editing or the active selection.
  const backgroundSync=async u=>{if(!supa.current||!u)return;try{const cloud=await fetchCloud(u);const cur={...storeRef.current,deleted:TOMB};const merged=mergeDealStores(cur,cloud);TOMB=merged.deleted||{};const keep=cur.activeId,localActive=cur.deals.find(d=>d._id===keep);const deals2=merged.deals.map(d=>(d._id===keep&&localActive)?localActive:d);setDeals(deals2);setActiveId(merged.deals.some(d=>d._id===keep)?keep:merged.activeId);persistDeals(deals2,keep);setSync("synced");}catch(e){}};
  const onAuthUser=u=>{setUser(u||null);if(!u){syncedOnce.current=false;setSync("idle");return;}if(!syncedOnce.current){syncedOnce.current=true;initialSync(u);}else backgroundSync(u);};
  useEffect(()=>{if(!cloudCfg)return;let unsub;try{const c=window.supabase.createClient(cloudCfg.url,cloudCfg.key);supa.current=c;
    c.auth.getSession().then(({data})=>{const u=data&&data.session&&data.session.user;if(u)onAuthUser(u);});
    const sub=c.auth.onAuthStateChange((_e,session)=>onAuthUser(session&&session.user));
    unsub=sub&&sub.data&&sub.data.subscription;}catch(e){}
    return ()=>{try{unsub&&unsub.unsubscribe();}catch(e){}};
  },[]);
  // debounced push whenever the library changes while signed in
  useEffect(()=>{if(!cloudCfg||!user)return;if(pushTimer.current)clearTimeout(pushTimer.current);pushTimer.current=setTimeout(()=>pushCloud(user.id,deals,activeId),1500);return ()=>{if(pushTimer.current)clearTimeout(pushTimer.current);};},[deals,activeId]);
  const signIn=()=>{try{supa.current&&supa.current.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.href.split("#")[0]}});}catch(e){}};
  const signOut=()=>{try{supa.current&&supa.current.auth.signOut();}catch(e){}setUser(null);setSync("idle");};
  const S=state;
  const set=(k,v)=>setState(p=>({...p,[k]:v}));
  const setFin=(k,v)=>setState(p=>({...p,financing:{...p.financing,[k]:v}}));
  const setProj=(k,v)=>setState(p=>({...p,projection:{...p.projection,[k]:v}}));
  const setRep=(k,v)=>setState(p=>({...p,repairs:{...p.repairs,[k]:v}}));
  const setPart=(k,v)=>setState(p=>({...p,partnership:{...p.partnership,[k]:v}}));
  const setCC=useCallback(fn=>setState(p=>({...p,closing:fn(p.closing||{...DCC})})),[]);
  const setEx=useCallback(fn=>setState(p=>({...p,expenses:fn(p.expenses||{...DEX})})),[]);
  const setUnit=(i,k,v)=>setState(p=>{const u=[...p.units];u[i]={...u[i],[k]:v};return{...p,units:u};});
  const addUnit=()=>setState(p=>{const next=p.units.reduce((m,u)=>{const mm=/(\d+)\s*$/.exec(u.label||"");return Math.max(m,mm?parseInt(mm[1],10):0);},0)+1;return{...p,units:[...p.units,{id:uid(),label:"Unit "+next,rent:1400,beds:1,bath:1,sqft:700}]};});
  const remUnit=i=>setState(p=>({...p,units:p.units.filter((_,j)=>j!==i)}));
  const setComps=useCallback(fn=>setState(p=>({...p,comparables:typeof fn==="function"?fn(p.comparables||[]):fn})),[]);
  const setInsights=v=>setState(p=>({...p,insights:v}));
  // Quick-fill: apply parsed listing fields / AI JSON estimate into the working deal.
  const applyListing=pl=>setState(p=>{const np={...p};if(pl.url)np.listingUrl=pl.url;if(pl.address)np.address=pl.address;if(num(pl.price)>0)np.price=num(pl.price);
    if(pl.units>=1){const cnt=Math.min(pl.units,16);np.units=Array.from({length:cnt},(_,i)=>{const ex=p.units[i]||{rent:0};return {...ex,id:ex.id||uid(),label:ex.label||("Unit "+(i+1)),beds:num(pl.beds)||ex.beds||0,bath:num(pl.bath)||ex.bath||0,sqft:num(pl.sqft)||ex.sqft||0,rent:ex.rent||0};});}
    else if(pl.beds||pl.bath||pl.sqft){np.units=p.units.map((u,i)=>i===0?{...u,beds:num(pl.beds)||u.beds,bath:num(pl.bath)||u.bath,sqft:num(pl.sqft)||u.sqft}:u);}
    return np;});
  const applyAI=o=>setState(p=>{const np={...p};
    if(typeof o.address==="string"&&o.address.trim())np.address=o.address.trim();
    if(num(o.price)>0)np.price=num(o.price);
    if(Array.isArray(o.units)&&o.units.length)np.units=o.units.slice(0,16).map((x,i)=>({id:uid(),label:"Unit "+(i+1),beds:num(x.beds)||0,bath:num(x.bath)||0,sqft:num(x.sqft)||0,rent:num(x.rent)||0}));
    if(o.expenses&&typeof o.expenses==="object"){const e=o.expenses;const ex={...np.expenses,mode:"detailed",v:2};
      if(num(e.taxesAnnual)>0){ex.taxes=num(e.taxesAnnual);ex.taxMode="fixed";}
      if(num(e.insuranceAnnual)>0)ex.insurance=num(e.insuranceAnnual);
      if(e.vacancyPct!=null&&e.vacancyPct!=="")ex.vacancyPct=num(e.vacancyPct);
      if(e.mgmtPct!=null&&e.mgmtPct!=="")ex.mgmtPct=num(e.mgmtPct);
      if(num(e.maintenanceAnnual)>0){ex.maintenance=num(e.maintenanceAnnual);ex.maintMode="fixed";}
      if(num(e.capexAnnual)>0){ex.capex=num(e.capexAnnual);ex.capexMode="fixed";}
      if(e.utilitiesAnnual!=null&&e.utilitiesAnnual!=="")ex.utilities=num(e.utilitiesAnnual);
      if(e.landscapingAnnual!=null&&e.landscapingAnnual!=="")ex.landscaping=num(e.landscapingAnnual);
      np.expenses=ex;}
    if(o.financing&&typeof o.financing==="object"){const fz={...np.financing};if(num(o.financing.rate)>0)fz.rate=num(o.financing.rate);np.financing=fz;
      if(num(o.financing.refiRate)>0)np.projection={...np.projection,refiRate:num(o.financing.refiRate)};}
    if(num(o.closingPct)>0)np.closing={...np.closing,mode:"quick",quickPct:num(o.closingPct)};
    if(o.projection&&typeof o.projection==="object"){const pz={...np.projection};const pp=o.projection;
      if(pp.appreciationPct!=null&&pp.appreciationPct!=="")pz.appreciationPct=num(pp.appreciationPct);
      if(pp.rentGrowthPct!=null&&pp.rentGrowthPct!=="")pz.rentGrowthPct=num(pp.rentGrowthPct);
      if(num(pp.exitCapRate)>0)pz.exitCapRate=num(pp.exitCapRate);
      np.projection=pz;}
    if(o.insights&&typeof o.insights==="object"){const x=o.insights,arr=v=>Array.isArray(v)?v.filter(s=>typeof s==="string"&&s.trim()).map(s=>s.trim()).slice(0,8):[];
      np.insights={neighborhoodGrade:String(x.neighborhoodGrade||"").trim().slice(0,2).toUpperCase(),schools:num(x.schools)||0,safety:String(x.safety||"").trim().slice(0,80),appreciation:String(x.appreciation||"").trim().slice(0,220),demand:String(x.demand||"").trim().slice(0,220),pros:arr(x.pros),cons:arr(x.cons),risks:arr(x.risks)};}
    if(typeof o.opinion==="string"&&o.opinion.trim())np.notes=(np.notes?np.notes+"\n\n":"")+"AI: "+o.opinion.trim();
    if(typeof o.model==="string"&&o.model.trim()){np.aiSource=o.model.trim().slice(0,60);np.aiAt=Date.now();}
    return np;});
  // ── Deal portfolio actions ──────────────────────────────────
  const addDeal=(data,label)=>{touchRef.current=false;const d=makeDeal(data,label?{label}:{});setDeals(ds=>{const n=[...ds,d];persistDeals(n,d._id);return n;});setActiveId(d._id);setState(fullState(d));return d._id;};
  const switchDeal=id=>{if(id===activeId)return;const d=deals.find(x=>x._id===id);if(!d)return;touchRef.current=false;setActiveId(id);setState(fullState(d));setSelEx(null);};
  const newDeal=()=>{addDeal(BLANK);setSelEx(null);setDealsOpen(false);};
  const duplicateDeal=id=>{const src=deals.find(x=>x._id===id);if(src)addDeal(src,dealTitle(src)+" (copy)");};
  const renameDeal=(id,label)=>setDeals(ds=>{const n=ds.map(d=>d._id===id?{...d,_label:label}:d);persistDeals(n,activeId);return n;});
  const deleteDeal=id=>{
    const idx=deals.findIndex(d=>d._id===id);if(idx<0)return;
    const removed=deals[idx];
    TOMB={...TOMB,[id]:Date.now()};   // tombstone so the delete sticks & propagates
    setDeals(ds=>{let n=ds.filter(d=>d._id!==id);let act=activeId;
      if(id===activeId){if(!n.length){const blank=makeDeal(INIT,{});n=[blank];}act=(n[Math.max(0,idx-1)]||n[n.length-1])._id;touchRef.current=false;setActiveId(act);setState(fullState(n.find(d=>d._id===act)));setSelEx(null);}
      persistDeals(n,act);return n;});
    setUndo({deal:removed,idx});
    if(undoTimer.current)clearTimeout(undoTimer.current);
    undoTimer.current=setTimeout(()=>setUndo(null),7000);
  };
  const undoDelete=()=>{
    if(!undo)return;const d=undo.deal;
    {const t={...TOMB};delete t[d._id];TOMB=t;}   // lift the tombstone so it isn't re-deleted on sync
    setDeals(ds=>{const n=[...ds];n.splice(Math.min(undo.idx,n.length),0,d);persistDeals(n,d._id);return n;});
    touchRef.current=false;setActiveId(d._id);setState(fullState(d));setUndo(null);
    if(undoTimer.current)clearTimeout(undoTimer.current);
  };
  const loadEx=ex=>{touchRef.current=false;setState(fullState({...INIT,...ex,closing:ex.closing||{...DCC},expenses:ex.expenses||{...DEX},projection:{...INIT.projection,...ex.projection}}));setSelEx(ex.id);};
  const mergeImported=p=>({...INIT,...p,
    financing:{...INIT.financing,...(p.financing||{})},
    closing:{...DCC,...(p.closing||{})},
    expenses:{...DEX,...(p.expenses||{})},
    projection:{...INIT.projection,...(p.projection||{})},
    repairs:{...INIT.repairs,...(p.repairs||{})},
    partnership:{...INIT.partnership,...(p.partnership||{})},
    units:Array.isArray(p.units)&&p.units.length?p.units:INIT.units,
    comparables:Array.isArray(p.comparables)?p.comparables:[]});
  const exportCSV=()=>{const base=(S.address||"deal").replace(/[^a-z0-9]+/gi,"_").replace(/^_|_$/g,"").slice(0,40)||"deal";downloadFile(base+".csv",stateToCSV(S));};
  const importCSV=()=>{
    const inp=document.createElement("input");inp.type="file";inp.accept=".csv,text/csv";
    inp.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
      rd.onload=()=>{try{addDeal(mergeImported(csvToState(rd.result)));setSelEx(null);}catch(err){alert("Could not import this CSV: "+err.message);}};
      rd.readAsText(f);};
    inp.click();
  };
  // Shareable link — encodes this deal into the URL (no account needed). The
  // recipient opens it and gets the deal added to their own library.
  const copyShareLink=()=>{
    try{
      const url=location.origin+location.pathname+"#deal="+encodeURIComponent(stateToCSV(S));
      const ok=()=>setToast("Link copied — anyone who opens it gets this deal");
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(ok,()=>window.prompt("Copy this link:",url));
      else window.prompt("Copy this link:",url);
    }catch(e){alert("Couldn't build a share link for this deal.");}
  };
  // Open a shared link once on load: #deal=<csv> -> add it as a new deal, then
  // strip the hash so a refresh doesn't re-import. (OAuth uses #access_token, skipped.)
  useEffect(()=>{
    try{
      const m=(location.hash||"").match(/^#deal=([\s\S]*)$/);
      if(!m)return;
      const st=csvToState(decodeURIComponent(m[1]));
      if(st&&Object.keys(st).length){addDeal(mergeImported(st),st.address||"Shared deal");setSelEx(null);setToast("Loaded a shared deal into your library");}
    }catch(e){alert("That shared link couldn't be read.");}
    try{history.replaceState(null,"",location.pathname+location.search);}catch(e){}
  },[]);
  // Whole-portfolio backup (JSON) — export/import every deal at once
  const exportAllDeals=()=>{
    const stamp=new Date().toISOString().slice(0,10);
    downloadFile("re-deals-backup-"+stamp+".json",JSON.stringify({app:"re-investment-analyzer",version:1,exportedAt:Date.now(),deals,activeId},null,2),"application/json");
  };
  const importAllDeals=()=>{
    const inp=document.createElement("input");inp.type="file";inp.accept=".json,application/json";
    inp.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
      rd.onload=()=>{try{
        const data=JSON.parse(rd.result);
        const incoming=Array.isArray(data)?data:(data&&Array.isArray(data.deals)?data.deals:null);
        if(!incoming||!incoming.length)throw new Error("no deals found in file");
        const imported=incoming.map(d=>makeDeal(d,{label:d._label||d._name||"",ts:d._ts,created:d._created}));
        setDeals(ds=>{const n=[...ds,...imported];persistDeals(n,imported[0]._id);return n;});
        touchRef.current=false;setActiveId(imported[0]._id);setState(fullState(imported[0]));setSelEx(null);
        alert("Imported "+imported.length+" deal"+(imported.length>1?"s":"")+" into your library.");
      }catch(err){alert("Could not import deals: "+err.message);}};
      rd.readAsText(f);};
    inp.click();
  };

  // Auto-save: sync the working state into its deal. Only bump "edited" time on a real
  // edit — NOT when merely switching/opening a deal. Capture `touched` BEFORE setDeals:
  // the functional updater runs lazily (after the line below sets touchRef=true), so
  // reading touchRef.current inside it would always see true and bump on every open.
  useEffect(()=>{
    const touched=touchRef.current;
    setDeals(ds=>{const n=ds.map(d=>d._id!==activeId?d:{...d,...state,_id:d._id,_label:d._label,_created:d._created,_ts:touched?Date.now():d._ts});persistDeals(n,activeId);return n;});
    touchRef.current=true;
  },[state]);

  const R=useMemo(()=>computeBase(state),[state]);
  const Y=useMemo(()=>computeYearly(state,R),[state,R]);
  const SEN=useMemo(()=>computeSensitivity(state,R),[state,R]);

  const totalRent=S.units.reduce((s,u)=>s+u.rent,0);
  const numU=S.units.length;
  const score=useMemo(()=>calcDealScore(R,Y),[R,Y]);

  const TABS=[["overview","Overview"],["income","Income"],["projection","Projection"],["analysis","Analysis"]];

  const handlePrint=()=>{setIsPrinting(true);const prev=dark;try{document.documentElement.setAttribute("data-theme","light");}catch{}setTimeout(()=>{window.print();setTimeout(()=>{setIsPrinting(false);try{document.documentElement.setAttribute("data-theme",prev?"dark":"light");}catch{}},300);},150);};

  const activeDeal=deals.find(d=>d._id===activeId)||deals[0];
  const activeTitle=(activeDeal&&activeDeal._label&&activeDeal._label.trim())||(S.address&&S.address.trim())||"Untitled deal";

  const renderClassic=()=>(
    <div style={{fontFamily:"'Inter',system-ui,-apple-system,sans-serif",maxWidth:1040,margin:"0 auto",padding:"0.5rem 0"}}>
      <style>{THEME_CSS}</style>
      <style>{`
        .ytable-scroll.cap{max-height:340px;overflow-y:auto}
        @media print{.no-print{display:none!important}.layout{display:block!important}.sticky-col{position:static!important;margin-top:20px}.ytable-scroll{max-height:none!important;overflow:visible!important}body{background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}:root{color-scheme:light}}
        @media (max-width:680px){
          html,body{overflow-x:hidden;max-width:100%}
          .layout{grid-template-columns:1fr!important}
          .layout,.layout>div,.sticky-col{min-width:0!important}
          .sticky-col{position:static!important}
          .mobile-bar{display:flex!important;padding-bottom:calc(8px + env(safe-area-inset-bottom))!important}
          .preset-grid{grid-template-columns:repeat(3,1fr)!important}
          input,select,textarea{font-size:16px!important}}
        input:focus,select:focus,textarea:focus{outline:none;box-shadow:0 0 0 2px var(--c-ring)}
      `}</style>

      {/* Header */}
      <div style={{background:"var(--c-head)",borderRadius:"var(--c-rad)",padding:"20px 22px",marginBottom:14,overflow:"hidden",position:"relative",borderTop:"2px solid "+C.gold}} className="no-print">
        <div className="skin-deco" style={{position:"absolute",right:-12,top:-12,width:74,height:74,border:"2px solid rgba(200,146,42,0.22)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:9,fontWeight:600,letterSpacing:"0.26em",color:C.gold,marginBottom:7,textTransform:"uppercase"}}>Rental Property · Deal Analyzer</div>
            <div style={{fontFamily:"var(--c-fdisp)",fontSize:24,fontWeight:600,color:"var(--c-headfg)",letterSpacing:"0.01em",lineHeight:1.12}}>Investment Property Analyzer</div>
            <div style={{fontSize:11,color:"var(--c-headfg)",opacity:0.55,marginTop:6,letterSpacing:"0.02em"}}>Unlimited deals · every change auto-saves · switch &amp; compare anytime</div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
            {(() => {const hb={fontSize:11,fontWeight:500,padding:"7px 13px",borderRadius:"var(--c-rad)",border:"1px solid var(--c-headborder)",background:"transparent",color:"var(--c-headfg)",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",letterSpacing:"0.02em"};return <>
              <SkinToggle skin={skin} setSkin={setSkin}/>
              <button onClick={()=>setDealsOpen(true)} title="Browse, search & switch deals" style={{...hb,background:C.navy,border:"1px solid "+C.navy,color:"#fff",fontWeight:600,maxWidth:230,overflow:"hidden",textOverflow:"ellipsis"}}>{activeTitle} <span style={{opacity:0.65,fontWeight:500}}>({deals.length})</span></button>
              <button onClick={newDeal} style={hb} title="Start a new blank deal">＋ New deal</button>
              <ScenarioCompare deals={deals} activeId={activeId} currentState={S}/>
              <HeaderMenu btnStyle={hb} items={[
                {label:dark?"Light mode":"Dark mode",onClick:()=>setDark(d=>!d)},
                {label:"Print / Save PDF",onClick:handlePrint},
                {label:"Copy share link",onClick:copyShareLink},
                {label:"Export this deal (CSV)",onClick:exportCSV},
                {label:"Import a deal (CSV)",onClick:importCSV},
                cloudCfg?{node:(user
                  ?<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                     <span style={{fontSize:11,color:C.slate}}>{sync==="syncing"?"Saving…":sync==="error"?"Sync error":"Synced"}</span>
                     <button onClick={signOut} style={{fontSize:12,fontWeight:600,color:C.slate,background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit"}} title={user.email||"Sign out"}>Sign out</button>
                   </div>
                  :<button onClick={signIn} style={{width:"100%",fontSize:12,fontWeight:700,color:"#fff",background:C.navy,border:"none",borderRadius:"var(--c-rad)",padding:"9px 10px",cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.02em"}}>Sign in with Google</button>)}:null,
              ]}/>
            </>;})()}
          </div>
        </div>
      </div>

      <DealsDrawer open={dealsOpen} onClose={()=>setDealsOpen(false)} deals={deals} activeId={activeId} liveTitle={activeTitle}
        onSelect={switchDeal} onNew={newDeal} onRename={renameDeal} onDelete={deleteDeal} onDuplicate={duplicateDeal}
        onExportAll={exportAllDeals} onImportAll={importAllDeals}/>

      {/* Presets */}
      <div style={{marginBottom:11}} className="no-print">
        <button onClick={()=>setShowEx(!showEx)} style={{fontSize:11,fontWeight:700,color:C.slate,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"0 0 6px",display:"flex",alignItems:"center",gap:5}}>
          <span>Load Atlanta example deal</span><span style={{transition:"transform 0.2s",display:"inline-block",transform:showEx?"rotate(180deg)":"none"}}>▾</span>
        </button>
        {showEx&&<div>
          <div className="preset-grid" style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:5}}>
            {EXAMPLES.map(ex=>{const on=selEx===ex.id;return <button key={ex.id} onClick={()=>loadEx(ex)} style={{padding:"7px 5px",borderRadius:9,border:"1.5px solid "+(on?ex.col:C.border),background:on?ex.col:C.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all 0.15s"}}>
              <div style={{fontSize:10,fontWeight:700,color:on?"#fff":C.text}}>{ex.label}</div>
              <div style={{fontSize:9,color:on?"rgba(255,255,255,0.7)":C.slate,lineHeight:1.3}}>{ex.sub}</div>
              <div style={{marginTop:3,fontSize:9,fontWeight:700,color:on?"rgba(255,255,255,0.85)":ex.col}}>{ex.tag}</div>
            </button>;})}
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:5}}>Loads into the current deal. Click <strong>＋ New deal</strong> first if you want to keep it as a separate saved deal.</div>
        </div>}
      </div>

      <div className="layout" style={{display:"grid",gridTemplateColumns:"minmax(0,0.92fr) minmax(0,1.08fr)",gap:11,alignItems:"start"}}>
        {/* LEFT: Inputs */}
        <div id="inputs-panel">
          <QuickFill key={activeId} state={S} onListing={applyListing} onAI={applyAI} onSource={v=>set("aiSource",v)}/>
          {/* Address + Notes */}
          <Card title="Property details" icon="pin" collapsible defaultOpen storeKey="prop">
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                <label style={{fontSize:11,color:C.slate,fontWeight:600}}>Address / MLS #</label>
                <input value={S.address||""} onChange={e=>set("address",e.target.value)} placeholder="123 Maple St, Atlanta, GA 30308"
                  style={{padding:"7px 10px",fontSize:13,border:"1px solid "+C.border,borderRadius:7,fontFamily:"inherit",color:C.text,outline:"none"}}/>
              </div>
              <ListingLink url={S.listingUrl} onChange={v=>set("listingUrl",v)}/>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                <label style={{fontSize:11,color:C.slate,fontWeight:600}}>Notes / assumptions</label>
                <textarea value={S.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Seller motivated, rents below market, new roof 2022..."
                  rows={2} style={{padding:"7px 10px",fontSize:12,border:"1px solid "+C.border,borderRadius:7,fontFamily:"inherit",color:C.text,outline:"none",resize:"vertical",lineHeight:1.5}}/>
              </div>
            </div>
          </Card>

          {/* Units */}
          <Card title={"Units & Rents · "+numU+" unit"+(numU!==1?"s":"")} icon="home" collapsible defaultOpen storeKey="units" summary={fmtD(totalRent)+"/mo"}>
            <div style={{marginBottom:11}}><MoneyInput label="Purchase price" value={S.price} onChange={x=>set("price",x)} sub={"Loan: "+fmtD(S.price*(1-S.financing.downPct/100))+" · Down: "+fmtD(S.price*S.financing.downPct/100)}/></div>
            <div style={{marginBottom:9}}><Tog checked={showUD} onChange={setShowUD} label="Show unit details (beds / bath / sq ft)"/></div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {S.units.map((u,i)=><div key={u.id} style={{border:"1px solid "+C.border,borderRadius:9,padding:"8px 10px",background:C.bg}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:showUD?8:0}}>
                  <input value={u.label} onChange={e=>setUnit(i,"label",e.target.value)} style={{fontSize:12,fontWeight:700,color:C.heading,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",flex:"0 1 72px",minWidth:0}}/>
                  <RentInput value={u.rent} onChange={v=>setUnit(i,"rent",v)}/>
                  {numU>1&&<button className="tap-sm" aria-label={"Remove "+(u.label||"unit")} onClick={()=>remUnit(i)} style={{padding:"5px 9px",background:C.redL,border:"1px solid "+C.border,borderRadius:6,cursor:"pointer",fontSize:12,color:C.red,fontFamily:"inherit",flexShrink:0}}>✕</button>}
                </div>
                {showUD&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",gap:6}}>
                  <Field label="Beds" value={u.beds||0} onChange={x=>setUnit(i,"beds",x)} min={0} max={10} xs/>
                  <Field label="Baths" value={u.bath||0} onChange={x=>setUnit(i,"bath",x)} min={0} max={6} step={0.5} xs/>
                  <Field label="Sq ft" value={u.sqft||0} onChange={x=>setUnit(i,"sqft",x)} min={0} step={50} xs/>
                </div>}
              </div>)}
            </div>
            <button onClick={addUnit} style={{marginTop:8,width:"100%",padding:"7px",borderRadius:8,border:"1px dashed "+C.border,background:C.white,cursor:"pointer",fontSize:12,fontWeight:600,color:C.slate,fontFamily:"inherit"}}>+ Add unit</button>
            <div style={{marginTop:9,padding:"6px 9px",background:C.bg,borderRadius:7,border:"1px solid "+C.border,fontSize:12,display:"flex",justifyContent:"space-between"}}>
              <span style={{color:C.slate}}>Total monthly</span>
              <span style={{fontWeight:700,color:C.heading}}>{fmtD(totalRent)}/mo · {fmtD(totalRent*12)}/yr</span>
            </div>
          </Card>

          {/* Financing */}
          <Card title="Financing" icon="bank" collapsible defaultOpen storeKey="fin" summary={fmtD(R.pmt)+"/mo"}>
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:9}}>
              <Field label="Down payment" suffix="%" value={S.financing.downPct} onChange={x=>setFin("downPct",x)} min={0} max={100} step={0.5} sub={"= "+fmtD(S.price*S.financing.downPct/100)} showZero/>
              <Field label="Interest rate" suffix="%" value={S.financing.rate} onChange={x=>setFin("rate",x)} min={0} max={20} step={0.125} showZero/>
              <Field label="Loan term" suffix="yrs" value={S.financing.loanYears} onChange={x=>setFin("loanYears",x)} min={1} max={40}/>
              <div style={{padding:"7px 10px",background:C.bg,borderRadius:8,border:"1px solid "+C.border}}>
                <div style={{fontSize:10,color:C.slate,marginBottom:2}}>Monthly payment</div>
                <div style={{fontSize:14,fontWeight:700,color:C.heading}}>{fmtD(R.pmt)}/mo</div>
                <div style={{fontSize:10,color:C.muted}}>Loan: {fmtD(R.loan)}</div>
              </div>
            </div>
            <div style={{marginTop:9}}>
              <Field label="Cash reserves" suffix="mo PITI" value={S.financing.reserveMonths||0} onChange={x=>setFin("reserveMonths",x)} min={0} max={24} step={1}
                tip={["Liquid cash a lender wants you to keep AFTER closing — months of PITI (principal+interest+taxes+insurance).","· Investment / multifamily: often 6 months","· DSCR loans: ~3–12 months","· Owner-occupied: 0–2 months","· You keep this money — it's not spent, so it's not counted in cash-on-cash."]}
                sub={(S.financing.reserveMonths||0)>0?("= "+fmtD(R.reserves)+" to keep on hand · PITI ≈ "+fmtD(R.pitiMo)+"/mo"):"0 = none. Investment loans often require ~6."}/>
            </div>
            {/* Partnership */}
            <div style={{marginTop:11,paddingTop:11,borderTop:"1px solid "+C.border}}>
              <Tog checked={S.partnership?.enabled||false} onChange={x=>setPart("enabled",x)} label="Partnership purchase" sub="Calculate my share of returns"/>
              {S.partnership?.enabled&&<div style={{marginTop:9}}>
                <Field label="My equity share" suffix="%" value={S.partnership.myPct||60} onChange={x=>setPart("myPct",x)} min={1} max={99} step={1} sub={"Partner: "+(100-(S.partnership.myPct||60))+"%"}/>
              </div>}
            </div>
          </Card>

          <ClosingCosts cc={S.closing} setCC={setCC} price={S.price} loan={R.loan} annTax={S.expenses.taxes||0} annIns={S.expenses.insurance||0} rate={S.financing.rate} collapsible defaultOpen/>
          <Expenses ex={S.expenses} setEx={setEx} units={numU} egi={R.egi} price={S.price} collapsible defaultOpen/>

          {/* Repairs */}
          <Card title="Repairs & Rehab" icon="wrench" collapsible defaultOpen storeKey="repairs" summary={S.repairs.include?(S.repairs.unknown?"TBD":fmtD(S.repairs.amount)):undefined}>
            <Tog checked={S.repairs.include} onChange={x=>setRep("include",x)} label="Include repair / rehab budget" sub="Added to cash needed at close"/>
            {S.repairs.include&&<div style={{marginTop:9,display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:9,alignItems:"end"}}>
              <MoneyInput label="Budget" value={S.repairs.unknown?0:S.repairs.amount} onChange={x=>setRep("amount",x)} sub={S.repairs.unknown?"Marked as unknown":fmtD(S.repairs.amount)+" added to cash in"}/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <label style={{fontSize:10,color:C.slate,fontWeight:600}}>Unknown?</label>
                <button onClick={()=>setRep("unknown",!S.repairs.unknown)} style={{padding:"6px 12px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,border:"1px solid "+(S.repairs.unknown?C.amber:C.border),background:S.repairs.unknown?C.amberL:C.white,color:S.repairs.unknown?C.amber:C.slate}}>? TBD</button>
              </div>
            </div>}
            {S.repairs.include&&S.repairs.unknown&&<div style={{marginTop:6,fontSize:10,color:C.amber}}>⚠ Get inspection quotes. Budget 5–15% of price for older buildings.</div>}
          </Card>

          {/* Projection */}
          <Card title="Projection & Growth" icon="trend" collapsible defaultOpen storeKey="proj" summary={S.projection.holdYears+"yr · "+fmtP(S.projection.appreciationPct)}>
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:9,marginBottom:12}}>
              <Field label="Hold period" suffix="years" value={S.projection.holdYears} onChange={x=>setProj("holdYears",x)} min={1} max={30}/>
              <Field label="Appreciation/yr" suffix="%" value={S.projection.appreciationPct} onChange={x=>setProj("appreciationPct",x)} min={0} max={12} step={0.25} sub="ATL forecast 4.1% in 2026"/>
              <Field label="Rent growth/yr" suffix="%" value={S.projection.rentGrowthPct||0} onChange={x=>setProj("rentGrowthPct",x)} min={0} max={10} step={0.25} sub="Applied to all units each year"/>
              <div style={{padding:"7px 10px",background:C.tealL,borderRadius:8,border:"1px solid "+C.border,fontSize:11}}>
                <div style={{color:C.teal,fontWeight:700,marginBottom:2}}>Rent in year {S.projection.holdYears}</div>
                <div style={{fontWeight:700,color:C.teal,fontSize:14}}>{fmtD(Math.round((totalRent/numU)*Math.pow(1+(S.projection.rentGrowthPct||0)/100,(S.projection.holdYears||5)-1)))}/unit/mo</div>
              </div>
            </div>
            <SecLabel text="Exit assumptions"/>
            <div style={{marginBottom:12}}>
              <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:9,marginBottom:9}}>
                <Field label="Selling costs" suffix="%" value={S.projection.sellingCostPct} onChange={x=>setProj("sellingCostPct",x)} min={0} max={12} step={0.5} sub="agent + closing at sale" showZero/>
                <div style={{padding:"7px 10px",background:C.bg,borderRadius:8,border:"1px solid "+C.border}}>
                  <div style={{fontSize:10,color:C.slate,marginBottom:2}}>Net sale proceeds (yr {S.projection.holdYears})</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.heading}}>{fmtD(Y.exitVal*(1-(S.projection.sellingCostPct??6)/100)-(Y.yearly[Y.yearly.length-1]||{}).balance)}</div>
                </div>
              </div>
              <div style={{marginBottom:8}}><Tog checked={S.projection.exitCapEnabled||false} onChange={x=>setProj("exitCapEnabled",x)} label="Value the exit on a cap rate" sub="Sale price = final-year NOI ÷ exit cap (instead of appreciation %)"/></div>
              {S.projection.exitCapEnabled&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:9}}>
                <Field label="Exit cap rate" suffix="%" value={S.projection.exitCapRate} onChange={x=>setProj("exitCapRate",x)} min={1} max={15} step={0.1} sub={"vs entry cap "+fmtP(R.capRate)}/>
                <div style={{padding:"7px 10px",background:C.goldL,borderRadius:8,border:"1px solid "+C.border,fontSize:10,color:C.amber}}>Higher exit cap than entry = conservative (value compresses); lower = optimistic.</div>
              </div>}
            </div>
            <SecLabel text="Value-add scenario"/>
            <div style={{marginBottom:12}}>
              <div style={{marginBottom:8}}><Tog checked={S.projection.vaEnabled||false} onChange={x=>setProj("vaEnabled",x)} label="Below-market rents — value-add potential" sub="Show metrics at stabilized market rents"/></div>
              {S.projection.vaEnabled&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:9}}>
                <Field label="Market rent / unit" prefix="$" value={S.projection.vaMarketRentPerUnit||1700} onChange={x=>setProj("vaMarketRentPerUnit",x)} min={0} step={25} sub={"current: "+fmtD(totalRent/numU)+"/unit"}/>
                <Field label="Stabilized by year" value={S.projection.vaYear||2} onChange={x=>setProj("vaYear",x)} min={1} max={10}/>
              </div>}
            </div>
            <SecLabel text="Refinance scenario"/>
            <div>
              <div style={{marginBottom:8}}><Tog checked={S.projection.refiEnabled||false} onChange={x=>setProj("refiEnabled",x)} label="Model a refinance in projection" sub="New rate applies from refi year onward"/></div>
              {S.projection.refiEnabled&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:9}}>
                <Field label="Refi year" value={S.projection.refiYear||3} onChange={x=>setProj("refiYear",x)} min={1} max={S.projection.holdYears||5}/>
                <Field label="New rate" suffix="%" value={S.projection.refiRate||6.5} onChange={x=>setProj("refiRate",x)} min={1} max={15} step={0.125}/>
              </div>}
            </div>
          </Card>

          <AreaInsights data={S.insights} onChange={setInsights}/>
          <ComparablesCard comps={S.comparables||[]} setComps={setComps} currentR={R}/>
        </div>

        {/* RIGHT: Results */}
        <div id="results-panel" className="sticky-col" style={{position:"sticky",top:8}}>
          {/* Tab bar */}
          {!isPrinting&&<div role="tablist" aria-label="Results" className="no-print" onKeyDown={e=>{const i=TABS.findIndex(([id])=>id===tab);if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const n=(i+(e.key==="ArrowRight"?1:TABS.length-1))%TABS.length;setTab(TABS[n][0]);}}} style={{display:"flex",gap:0,borderBottom:"2px solid "+C.border,marginBottom:11}}>
            {TABS.map(([id,lbl])=><button key={id} role="tab" aria-selected={tab===id} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} style={{padding:"8px 12px",fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:"none",color:tab===id?C.heading:C.slate,borderBottom:tab===id?"2px solid "+C.gold:"2px solid transparent",marginBottom:-2,fontFamily:"inherit",letterSpacing:"0.01em"}}>{lbl}</button>)}
          </div>}
          {isPrinting?(
            <div>
              <OverviewTab R={R} Y={Y} S={S}/>
              <div style={{borderTop:"2px solid "+C.border,marginTop:16,paddingTop:16}}><IncomeTab R={R} S={S}/></div>
              <div style={{borderTop:"2px solid "+C.border,marginTop:16,paddingTop:16}}><ProjectionTab R={R} Y={Y} S={S}/></div>
              <div style={{borderTop:"2px solid "+C.border,marginTop:16,paddingTop:16}}><AnalysisTab SEN={SEN} R={R} S={S} Y={Y}/></div>
            </div>
          ):(
            <div>
              <div style={{display:tab==="overview"?"block":"none"}}><OverviewTab R={R} Y={Y} S={S}/></div>
              <div style={{display:tab==="income"?"block":"none"}}><IncomeTab R={R} S={S}/></div>
              <div style={{display:tab==="projection"?"block":"none"}}><ProjectionTab R={R} Y={Y} S={S}/></div>
              <div style={{display:tab==="analysis"?"block":"none"}}><AnalysisTab SEN={SEN} R={R} S={S} Y={Y}/></div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating bar */}
      {undo&&<div className="no-print" style={{position:"fixed",left:"50%",bottom:70,transform:"translateX(-50%)",zIndex:1100,background:C.navy,color:"#fff",padding:"10px 16px",borderRadius:10,display:"flex",gap:16,alignItems:"center",boxShadow:"0 6px 24px rgba(0,0,0,0.35)",maxWidth:"92vw"}}>
        <span style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Deleted “{dealTitle(undo.deal)}”</span>
        <button onClick={undoDelete} style={{fontSize:12,fontWeight:700,color:C.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>↩ Undo</button>
      </div>}

      {toast&&<div className="no-print" onClick={()=>setToast("")} style={{position:"fixed",left:"50%",bottom:110,transform:"translateX(-50%)",zIndex:1100,background:C.teal,color:"#fff",padding:"10px 16px",borderRadius:10,fontSize:12,fontWeight:600,boxShadow:"0 6px 24px rgba(0,0,0,0.35)",maxWidth:"92vw",textAlign:"center",cursor:"pointer"}}>{toast}</div>}

      <div className="mobile-bar" onClick={()=>{try{const el=document.getElementById("results-panel");if(el.getBoundingClientRect().top>80){el.scrollIntoView({behavior:"smooth",block:"start"});}else{(document.getElementById("inputs-panel")||document.body).scrollIntoView({behavior:"smooth",block:"start"});}}catch{}}} style={{display:"none",position:"fixed",bottom:0,left:0,right:0,background:score.color,padding:"8px 16px",zIndex:200,alignItems:"center",justifyContent:"space-around",cursor:"pointer"}}>
        {[["Deal score",score.grade],["CF/mo",fmtD(R.cf/12)],["Cap rate",fmtP(R.capRate)],["DSCR",R.dscr.toFixed(2)]].map(([l2,v2])=><div key={l2} style={{textAlign:"center"}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.7)"}}>{l2}</div>
          <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{v2}</div>
        </div>)}
        <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",alignSelf:"center"}}>tap ↕</div>
      </div>

      <div style={{marginTop:10,fontSize:9,color:C.muted,borderTop:"1px solid "+C.border,paddingTop:8,marginBottom:60}}>
        Built by <a href="https://www.linkedin.com/in/maksym--andreiev/" target="_blank" rel="noopener noreferrer" style={{color:C.heading,fontWeight:600,textDecoration:"none"}}>Maksym Andreiev</a> · Educational only — not financial, legal, or tax advice.
      </div>
    </div>
  );

  return renderClassic();
}
