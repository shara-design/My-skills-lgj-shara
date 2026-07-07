#!/usr/bin/env node
// Merge + dedupe the two solar sources into one handoff CSV:
//   1) native Blitz people-search  (find-leads.mjs schema)
//   2) CSLB company-chain enrichment (enrich-company-list.mjs schema; only clean=="yes" rows)
// Dedupe by email (case-insensitive) and by person linkedin_url. Output only rows WITH an email.
//
// Usage: node merge-solar.mjs <native.csv> <cslb.csv> <out.csv>

import { readFileSync, writeFileSync } from "node:fs";

const [nativePath, cslbPath, outPath] = process.argv.slice(2);
if (!nativePath || !cslbPath || !outPath) { console.error("usage: merge-solar.mjs <native.csv> <cslb.csv> <out.csv>"); process.exit(1); }

function pc(t){const R=[];let f=[],c="",q=false;for(let i=0;i<t.length;i++){const x=t[i];if(q){if(x==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=x}else{if(x==='"')q=true;else if(x===','){f.push(c);c=""}else if(x==='\n'){f.push(c);R.push(f);f=[];c=""}else if(x==='\r'){}else c+=x}}if(c!==""||f.length){f.push(c);R.push(f)}return R}
const rd = (p) => { try { const r = pc(readFileSync(p, "utf8")); const h = r[0]; return r.slice(1).filter(x => x.length >= h.length).map(x => Object.fromEntries(h.map((k,i)=>[k, x[i] ?? ""]))); } catch(e){ console.error(`skip ${p}: ${e.message}`); return []; } };
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };

const COLS = ["first_name","last_name","full_name","job_title","company_name","company_domain","linkedin_url","city","state_code","email","source"];
const out = [];
const seenEmail = new Set(), seenLi = new Set();
let dupes = 0;

function add(rec){
  const em = (rec.email||"").toLowerCase().trim();
  if (!em) return;
  const li = (rec.linkedin_url||"").toLowerCase().trim();
  if (seenEmail.has(em) || (li && seenLi.has(li))) { dupes++; return; }
  seenEmail.add(em); if (li) seenLi.add(li);
  out.push(rec);
}

// native
let nNative = 0;
for (const r of rd(nativePath)) {
  if (!r.email) continue; nNative++;
  add({ first_name:r.first_name, last_name:r.last_name, full_name:r.full_name, job_title:r.job_title, company_name:r.company_name, company_domain:r.company_domain, linkedin_url:r.linkedin_url, city:r.city, state_code:r.state_code||"CA", email:r.email, source:"native" });
}
// cslb (clean only)
let nCslb = 0;
for (const r of rd(cslbPath)) {
  if (!r.email || (r.clean && r.clean !== "yes")) continue; nCslb++;
  const nm = (r.person_name||"").trim().split(/\s+/);
  add({ first_name:nm[0]||"", last_name:nm.slice(1).join(" ")||"", full_name:r.person_name, job_title:r.person_title, company_name:r.matched_company||r.business_name, company_domain:r.company_domain, linkedin_url:r.person_linkedin_url, city:r.city, state_code:"CA", email:r.email, source:"cslb" });
}

writeFileSync(outPath, [COLS.join(","), ...out.map(o => COLS.map(c => esc(o[c])).join(","))].join("\n") + "\n", "utf8");
console.log(`native emails: ${nNative} | cslb clean emails: ${nCslb} | merged unique: ${out.length} | dropped dupes: ${dupes}`);
console.log(`-> ${outPath}`);
