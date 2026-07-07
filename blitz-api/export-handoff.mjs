#!/usr/bin/env node
// Produce clean Bison-upload handoff CSVs (email-only rows) per segment + a combined file.
// Output columns lead with email + first_name (used in copy) and city (used in signature: "{{city}}, CA").
//
// Usage: node export-handoff.mjs <outDir>

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const LIST = "/Users/pablogaviria/Projects/Cold Email Marketing/profiles/taj-pamma/lists";
const outDir = process.argv[2] || join(LIST, "handoff");
mkdirSync(outDir, { recursive: true });

function pc(t){const R=[];let f=[],c="",q=false;for(let i=0;i<t.length;i++){const x=t[i];if(q){if(x==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=x}else{if(x==='"')q=true;else if(x===','){f.push(c);c=""}else if(x==='\n'){f.push(c);R.push(f);f=[];c=""}else if(x==='\r'){}else c+=x}}if(c!==""||f.length){f.push(c);R.push(f)}return R}
const rd = (p) => { try { const r = pc(readFileSync(p, "utf8")); const h = r[0]; return r.slice(1).filter(x => x.length >= h.length).map(x => Object.fromEntries(h.map((k,i)=>[k, x[i] ?? ""]))); } catch(e){ console.error(`skip ${p}: ${e.message}`); return []; } };
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
const COLS = ["email","first_name","last_name","company_name","company_domain","job_title","city","state_code","segment","verification_status"];
const write = (path, rows) => writeFileSync(path, [COLS.join(","), ...rows.map(o => COLS.map(c => esc(o[c])).join(","))].join("\n") + "\n", "utf8");

const SOURCES = [
  { seg: "gc",         file: "gc_leads.csv" },
  { seg: "architects", file: "architects_leads.csv" },
  { seg: "solar",      file: "solar_combined_leads.csv" },
];

const all = [];
const seen = new Set();
for (const { seg, file } of SOURCES) {
  const rows = rd(join(LIST, file)).filter(r => r.email && /@/.test(r.email));
  const out = [];
  for (const r of rows) {
    const em = r.email.toLowerCase().trim();
    if (seen.has(em)) continue; seen.add(em);
    const rec = { email: r.email.trim(), first_name: r.first_name, last_name: r.last_name, company_name: r.company_name, company_domain: (r.company_domain || (em.split("@")[1] || "")), job_title: r.job_title, city: r.city, state_code: r.state_code || "CA", segment: seg, verification_status: "ok" };
    out.push(rec); all.push(rec);
  }
  write(join(outDir, `${seg}_handoff.csv`), out);
  console.log(`${seg}: ${out.length} email rows -> ${seg}_handoff.csv`);
}
write(join(outDir, "all_segments_handoff.csv"), all);
console.log(`ALL (cross-segment deduped): ${all.length} -> all_segments_handoff.csv`);
