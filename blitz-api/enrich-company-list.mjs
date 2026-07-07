#!/usr/bin/env node
// Enrich a COMPANY-ONLY list (e.g. CSLB license export: business_name + city, no people/email)
// into decision-maker work emails via the Blitz 3-hop chain:
//   company name (+city) -> Company Search (/v2/search/companies)        -> company_linkedin_url + domain
//                        -> Employee Finder (/v2/search/employee-finder) -> decision-maker linkedin_url
//                        -> Find Work Email (/v2/enrichment/email)       -> email
//
// Usage:
//   set -a; source ../../coldoutboundskills/.env; set +a
//   node enrich-company-list.mjs --in="/path/CA Solar Contractors.csv" --out=../../profiles/taj-pamma/lists/solar_enriched.csv \
//        --name-col=business_name --city-col=city --limit=40 --concurrency=3
//
// Flags:
//   --in=PATH          source CSV (required)
//   --out=PATH         output CSV (required)
//   --name-col=NAME    company-name column (default business_name)
//   --city-col=NAME    city column (default city)
//   --limit=N          process only first N data rows (0 = all)
//   --offset=N         skip first N data rows (default 0)
//   --concurrency=N    parallel chains (default 3)
//   --sample           pick rows spread evenly across the file instead of the first N (for representative pilots)
//   --dry-run          print the first company's request/response at each hop, then stop

import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";

const BASE = process.env.BLITZ_BASE_URL || "https://api.blitz-api.ai";
const KEY = process.env.BLITZ_API_KEY;
if (!KEY) { console.error("Missing env: BLITZ_API_KEY"); process.exit(1); }

const args = process.argv.slice(2);
const get = (k, d) => { const m = args.find(a => a.startsWith(`--${k}=`)); return m ? m.split("=").slice(1).join("=") : d; };
const has = (k) => args.includes(`--${k}`);
const IN = get("in"); const OUT = get("out");
const NAME_COL = get("name-col", "business_name");
const CITY_COL = get("city-col", "city");
const LIMIT = parseInt(get("limit", "0"), 10);
const OFFSET = parseInt(get("offset", "0"), 10);
const CONC = parseInt(get("concurrency", "3"), 10);
const SAMPLE = has("sample");
const DRY = has("dry-run");
if (!IN || !OUT) { console.error("--in and --out are required"); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let _lastStart = 0;
async function gate() { const MIN = 350; const now = Date.now(); const wait = Math.max(0, _lastStart + MIN - now); _lastStart = now + wait; if (wait) await sleep(wait); }

async function api(path, body, attempt = 0) {
  await gate();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const txt = await res.text().catch(() => ""); const e = new Error(`${path} -> ${res.status} ${txt.slice(0,200)}`); e.status = res.status; throw e; }
    return await res.json();
  } catch (e) {
    if (attempt < 7 && (e.status === 429 || e.status >= 500 || e.code === "ECONNRESET")) { await sleep(Math.min(20000, 1200 * 2 ** attempt)); return api(path, body, attempt + 1); }
    throw e;
  }
}

function parseCSV(t){const rows=[];let f=[],cur="",q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}else{if(c==='"')q=true;else if(c===','){f.push(cur);cur="";}else if(c==='\n'){f.push(cur);rows.push(f);f=[];cur="";}else if(c==='\r'){}else cur+=c;}}if(cur!==""||f.length){f.push(cur);rows.push(f);}return rows;}
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };

// Strip legal suffixes; split off DBA. Returns [primaryName, altName?] for the keyword search.
function nameCandidates(raw){
  const up = (raw||"").toUpperCase().replace(/\s+/g," ").trim();
  const parts = up.split(/\bDBA\b/);
  const clean = (s) => s.replace(/\b(INC|INCORPORATED|CORP|CORPORATION|LLC|L\.?L\.?C\.?|LP|L\.?P\.?|LTD|CO)\b\.?/g," ").replace(/[.,]/g," ").replace(/\s+/g," ").trim();
  const legal = clean(parts[0]);
  const dba = parts[1] ? clean(parts[1]) : "";
  const out = [];
  if (legal) out.push(legal);
  if (dba && dba !== legal) out.push(dba);
  return out.length ? out : [up];
}

const pick = (r, ...keys) => { for (const k of keys) { const v = r?.[k]; if (Array.isArray(v) && v.length) return v; if (v && typeof v === "object" && (v.data||v.results)) return v.data||v.results; } return []; };
const items = (r) => r?.data ?? r?.results ?? r?.companies ?? r?.people ?? r?.employees ?? r?.items ?? [];

// Decision-maker title preference tiers + a hard exclude list (pilot pulled in marketing/foreman/compliance noise).
const TIER1 = /\b(owner|co-?founder|founder|president|principal|ceo|chief executive|proprietor|managing (member|partner|director|principal))\b/i;
const TIER2 = /\b(vice president|\bvp\b|general manager|\bgm\b|partner|chief|head of|director of (operations|construction|sales|preconstruction))\b/i;
const TIER3 = /\b(project manager|operations manager|estimator|preconstruction|purchasing|director)\b/i;
const BAD_TITLE = /\b(marketing|media|communications|recruit|talent|intern|student|human resources|\bhr\b|brand|social|content|customer experience|foreman|compliance|environmental|sustainability|accounts? payable|receptionist|apprentice|driver|installer|technician|laborer)\b/i;

async function searchCompany(name, city){
  // name-only keyword search (HQ city used to disambiguate client-side, not to filter — LinkedIn HQ city often differs from license city)
  const body = { company: { name: { include: [name] }, hq: { country_code: ["US"] } }, max_results: 5, cursor: null };
  if (DRY) console.log("HOP1 body:", JSON.stringify(body));
  const r = await api("/v2/search/companies", body);
  if (DRY) console.log("HOP1 resp keys:", Object.keys(r||{}), "n=", items(r).length, JSON.stringify(items(r)[0]||{}).slice(0,400));
  const list = items(r);
  if (!list.length) return null;
  const cityLc = (city||"").toLowerCase();
  const withCity = list.find(c => ((c.hq?.city||c.city||"")+"").toLowerCase() === cityLc);
  return withCity || list[0];
}

async function findDecisionMaker(companyLinkedinUrl){
  const body = { company_linkedin_url: companyLinkedinUrl, max_results: 15 };
  if (DRY) console.log("HOP2 body:", JSON.stringify(body));
  const r = await api("/v2/search/employee-finder", body);
  if (DRY) console.log("HOP2 resp keys:", Object.keys(r||{}), "n=", items(r).length, JSON.stringify(items(r)[0]||{}).slice(0,400));
  const list = items(r);
  if (!list.length) return null;
  const titleOf = (p) => p.job_title || (Array.isArray(p.experiences) ? (p.experiences.find(e=>e?.job_is_current)||p.experiences[0]||{}).job_title : "") || p.headline || "";
  const score = (t) => { if (BAD_TITLE.test(t)) return 0; if (TIER1.test(t)) return 4; if (TIER2.test(t)) return 3; if (TIER3.test(t)) return 2; return 1; };
  const cands = list.map(p => ({ p, t: titleOf(p), s: score(titleOf(p)) })).sort((a, b) => b.s - a.s);
  const best = cands[0];
  if (!best || best.s === 0) return null; // only off-target titles (marketing/foreman/intern) -> don't email
  const dm = best.p;
  return { url: dm.linkedin_url || dm.profile_url || "", name: dm.full_name || `${dm.first_name||""} ${dm.last_name||""}`.trim(), title: best.t,
           first_name: dm.first_name||"", last_name: dm.last_name||"" };
}

async function findEmail(personLinkedinUrl){
  const r = await api("/v2/enrichment/email", { person_linkedin_url: personLinkedinUrl });
  if (DRY) console.log("HOP3 resp:", JSON.stringify(r).slice(0,300));
  return (r?.found && r?.email) ? r.email : "";
}

(async () => {
  const rows = parseCSV(readFileSync(IN, "utf8"));
  const hdr = rows[0];
  const ni = hdr.indexOf(NAME_COL), ci = hdr.indexOf(CITY_COL);
  if (ni < 0) { console.error(`name-col "${NAME_COL}" not found. Columns: ${hdr.join(", ")}`); process.exit(1); }
  let data = rows.slice(1).filter(r => r.length >= hdr.length && r[ni]);
  // build company records
  let companies = data.map(r => ({ name: r[ni], city: ci>=0 ? r[ci] : "", type: hdr.indexOf("business_type")>=0 ? r[hdr.indexOf("business_type")] : "", classifications: hdr.indexOf("classifications")>=0 ? r[hdr.indexOf("classifications")] : "" }));
  if (OFFSET) companies = companies.slice(OFFSET);
  if (LIMIT > 0) {
    if (SAMPLE) { const step = Math.max(1, Math.floor(companies.length / LIMIT)); companies = companies.filter((_,i)=> i % step === 0).slice(0, LIMIT); }
    else companies = companies.slice(0, LIMIT);
  }
  console.log(`Source: ${data.length} companies; processing ${companies.length} (offset=${OFFSET}, limit=${LIMIT||"all"}, sample=${SAMPLE}).`);

  const OUT_COLS = ["business_name","city","business_type","classifications","matched_company","company_domain","company_linkedin_url","person_name","person_title","person_linkedin_url","email","clean","stage"];
  const results = [];
  const stats = { company: 0, employee: 0, email: 0 };
  const persist = async () => { await mkdir(dirname(OUT), { recursive: true }); await writeFile(OUT, [OUT_COLS.join(","), ...results.map(o => OUT_COLS.map(c => esc(o[c])).join(","))].join("\n") + "\n", "utf8"); };

  let done = 0;
  const queue = [...companies];
  async function worker(){
    while (queue.length){
      const co = queue.shift();
      const rec = { business_name: co.name, city: co.city, business_type: co.type, classifications: co.classifications, matched_company:"", company_domain:"", company_linkedin_url:"", person_name:"", person_title:"", person_linkedin_url:"", email:"", clean:"", stage:"no_company" };
      try {
        let comp = null;
        for (const cand of nameCandidates(co.name)) { comp = await searchCompany(cand, co.city); if (comp) break; }
        if (comp) {
          rec.matched_company = comp.name || comp.company_name || "";
          rec.company_domain = comp.domain || "";
          rec.company_linkedin_url = comp.linkedin_url || comp.company_linkedin_url || "";
          if (rec.company_linkedin_url) { stats.company++; rec.stage = "no_employee";
            const dm = await findDecisionMaker(rec.company_linkedin_url);
            if (dm && dm.url) { stats.employee++; rec.stage = "no_email";
              rec.person_name = dm.name; rec.person_title = dm.title; rec.person_linkedin_url = dm.url;
              const email = await findEmail(dm.url);
              if (email) {
                rec.email = email;
                const ed = (email.split("@")[1] || "").toLowerCase();
                const cd = (rec.company_domain || "").toLowerCase();
                const match = !cd || ed === cd || ed.endsWith("." + cd) || cd.endsWith("." + ed);
                rec.clean = match ? "yes" : "no";
                if (match) { stats.email++; rec.stage = "email"; } else { rec.stage = "email_domain_mismatch"; }
              }
            }
          }
        }
      } catch (e) { rec.stage = "error:" + (e.status || e.message?.slice(0,40)); }
      results.push(rec); done++;
      if (done % 10 === 0) { console.log(`  ${done}/${companies.length}  company=${stats.company} employee=${stats.employee} email=${stats.email}`); await persist(); }
      if (DRY) break;
    }
  }
  await Promise.all(Array.from({ length: DRY ? 1 : CONC }, worker));
  await persist();
  const n = results.length;
  console.log(`\nDone ${n} companies -> ${OUT}`);
  console.log(`  resolved to LinkedIn company : ${stats.company} (${Math.round(stats.company/n*100)}%)`);
  console.log(`  decision-maker found         : ${stats.employee} (${Math.round(stats.employee/n*100)}%)`);
  console.log(`  EMAIL found (end-to-end)     : ${stats.email} (${Math.round(stats.email/n*100)}%)`);
})().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
