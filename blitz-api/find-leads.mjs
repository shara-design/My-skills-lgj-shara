#!/usr/bin/env node
// Blitz lead finder for Killua Energy — builds CA lists FROM SCRATCH via the real BlitzAPI.
// Preset wrapper around ./blitz-client.mjs (shared auth, 5-RPS gate, retries, pagination).
// For ad-hoc / any-client list building use the generic CLI instead: `node blitz.mjs help`.
// Docs: https://docs.blitz-api.ai  ·  reference: ./README.md
//
// Usage:
//   set -a; source ../../coldoutboundskills/.env; set +a     # loads BLITZ_API_KEY
//   node find-leads.mjs --segment=gc        --max=300 --out=../../profiles/taj-pamma/lists/gc_leads.csv
//   node find-leads.mjs --segment=solar     --max=300 --out=../../profiles/taj-pamma/lists/solar_leads.csv
//   node find-leads.mjs --segment=architects --max=300 --out=../../profiles/taj-pamma/lists/architects_leads.csv
//
// Flags:
//   --segment=gc|solar|architects   (required unless --enrich-file)
//   --max=N            target number of CA-state leads to collect (default 200)
//   --out=PATH         output CSV (default ./<segment>_leads.csv)
//   --email            ALSO enrich verified work emails (off by default — enrich after you review the list)
//   --page-size=N      results per search call, 1-50 (default 50)
//   --concurrency=N    parallel email enrichments (default 5)
//   --emp-max=N        company employee_count.max override (default per-segment)
//   --enrich-file=PATH resumable: enrich blank-email rows in an existing CSV
//   --target-emails=N  with --enrich-file: stop once N rows have emails (0 = all)
//   --dry-run          print the request body + first page diagnostics, then stop

import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { createClient, toCSV, parseCSV, BlitzError } from "./blitz-client.mjs";

// ---- args ----
const args = process.argv.slice(2);
const get = (k, d) => { const m = args.find(a => a.startsWith(`--${k}=`)); return m ? m.split("=").slice(1).join("=") : d; };
const has = (k) => args.includes(`--${k}`);
const segment = get("segment");
const maxLeads = parseInt(get("max", "200"), 10);
const pageSize = Math.min(50, Math.max(1, parseInt(get("page-size", "50"), 10)));
const concurrency = parseInt(get("concurrency", "5"), 10);
const empMaxArg = get("emp-max");
const empMaxOverride = empMaxArg != null ? parseInt(empMaxArg, 10) : null;
const doEmail = has("email");
const dryRun = has("dry-run");
const out = get("out", segment ? `./${segment}_leads.csv` : "./leads.csv");
const enrichFile = get("enrich-file");
const targetEmails = parseInt(get("target-emails", "0"), 10);

// Shared client (reads BLITZ_API_KEY / BLITZ_BASE_URL; handles the 5-RPS gate + retries for every call).
let blitz;
try { blitz = createClient({ rps: 5 }); }
catch (e) { console.error(e.message); process.exit(1); }

// Titles to exclude (substring) — strips the VP flood + off-ICP functions that broad matches pull in.
const EXCLUDE_TITLES = [
  "vice president", "communications", "marketing", "environmental",
  "human resources", "talent", "recruit", "sustainability",
  "business development", "public relations",
];

// ---- California targeting (no native state filter → city pre-filter + state_code post-filter) ----
const CA_CITIES = [
  "Los Angeles","San Diego","San Jose","San Francisco","Fresno","Sacramento","Long Beach","Oakland",
  "Bakersfield","Anaheim","Santa Ana","Riverside","Stockton","Irvine","Chula Vista","Fremont",
  "San Bernardino","Modesto","Fontana","Oxnard","Moreno Valley","Huntington Beach","Glendale","Santa Clarita",
  "Garden Grove","Oceanside","Rancho Cucamonga","Ontario","Elk Grove","Corona","Hayward","Lancaster",
  "Palmdale","Salinas","Pomona","Sunnyvale","Escondido","Torrance","Pasadena","Fullerton","Visalia",
  "Clovis","Roseville","Concord","Santa Rosa","Temecula","Murrieta","Santa Clara","Victorville","Berkeley",
  "Fairfield","Vallejo","Thousand Oaks","El Monte","Carlsbad","Richmond","Costa Mesa","Antioch","Daly City",
  "Burbank","Inglewood","San Mateo","Rialto","Vacaville","Norwalk","Chico","Redding","Merced","Madera",
  "San Marcos","Vista","Tracy","Hesperia","Citrus Heights","Livermore","Mission Viejo","Redwood City","Napa",
  "Folsom","Tulare","Yuba City","Manteca","Turlock","Milpitas","Redondo Beach","San Ramon","Pleasanton",
  "Walnut Creek","Mountain View","Alameda","Newport Beach","Palo Alto","Petaluma","Camarillo","Simi Valley",
];

// ---- segment ICP filters (industries from Blitz normalization; titles are free-text, [brackets]=exact) ----
const SEGMENTS = {
  gc: {
    label: "General Contractors / Developers",
    empMax: 500,
    industry: ["Construction","Building Construction","Residential Building Construction","Nonresidential Building Construction","Specialty Trade Contractors","Civil Engineering"],
    job_title: ["owner","president","founder","[project manager]","estimator","preconstruction","purchasing manager"],
  },
  solar: {
    label: "Solar companies / EPCs",
    empMax: 500,
    industry: ["Solar Electric Power Generation","Renewable Energy Power Generation","Services for Renewable Energy","Renewables and Environment","Building Equipment Contractors"],
    job_title: ["owner","president","founder","operations manager","[project manager]","estimator"],
  },
  architects: {
    label: "Architects / Roofing",
    empMax: 1000,
    industry: ["Architecture and Planning","Building Structure and Exterior Contractors","Building Finishing Contractors"],
    job_title: ["owner","principal","president","founder","[project manager]","estimator"],
  },
};

if (!enrichFile && (!segment || !SEGMENTS[segment])) {
  console.error(`--segment must be one of: ${Object.keys(SEGMENTS).join(", ")}  (or use --enrich-file=PATH)`);
  process.exit(1);
}
const cfg = SEGMENTS[segment] || {};
const cap = empMaxOverride ?? cfg.empMax ?? 500;

function buildBody(cursor) {
  return {
    company: {
      industry: { include: cfg.industry },
      hq: { country_code: ["US"] },
      ...(cap > 0 ? { employee_count: { max: cap } } : {}),
    },
    people: {
      job_title: { include: cfg.job_title, exclude: EXCLUDE_TITLES },
      location: { country_code: ["US"], city: CA_CITIES },
    },
    max_results: pageSize,
    cursor: cursor ?? null,
  };
}

// Per-call wrapper: returns null instead of throwing so the search/enrich loops continue on a bad call.
async function safe(promise) { try { return await promise; } catch (e) { return { _err: e.status || e.message }; } }

const COLS = ["first_name","last_name","full_name","job_title","company_name","company_domain","company_linkedin_url","linkedin_url","city","state_code","email"];

function normalize(p) {
  const exps = Array.isArray(p.experiences) ? p.experiences : [];
  const exp = exps.find(e => e && e.job_is_current) || exps[0] || {};
  const loc = p.location || {};
  return {
    first_name: p.first_name || "",
    last_name: p.last_name || "",
    full_name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
    job_title: exp.job_title || p.job_title || p.headline || "",
    company_name: exp.company_name || p.company_name || "",
    company_domain: exp.company_domain || "",
    company_linkedin_url: exp.company_linkedin_url || "",
    linkedin_url: p.linkedin_url || "",
    city: loc.city || "",
    state_code: (loc.state_code || "").toUpperCase(),
    country_code: (loc.country_code || "").toUpperCase(),
    email: "",
  };
}

async function searchAll() {
  const collected = [];
  let cursor = null, page = 0, scanned = 0;
  while (collected.length < maxLeads) {
    const body = buildBody(cursor);
    if (dryRun && page === 0) console.log("Request body:\n", JSON.stringify(body, null, 2));
    const resp = await blitz.search.people(body);
    if (dryRun && page === 0) console.log("Response top-level keys:", Object.keys(resp || {}));
    const items = resp?.results ?? resp?.data ?? [];
    if (page === 0 && typeof resp?.total_results === "number") console.log(`  total_results (matches, pre-CA post-filter): ${resp.total_results}`);
    scanned += items.length;
    for (const it of items) {
      const n = normalize(it);
      if (n.state_code === "CA") collected.push(n);
    }
    cursor = resp?.cursor ?? null;
    page++;
    console.log(`  page ${page}: +${items.length} scanned, ${collected.length}/${maxLeads} CA collected`);
    if (dryRun) break;
    if (!cursor || items.length === 0) break;
  }
  console.log(`Search done: ${collected.length} CA leads from ${scanned} scanned across ${page} page(s).`);
  return collected.slice(0, maxLeads);
}

async function enrichEmails(leads) {
  let done = 0, found = 0;
  const queue = [...leads];
  async function worker() {
    while (queue.length) {
      const lead = queue.shift();
      if (!lead.linkedin_url) { done++; continue; }
      const r = await safe(blitz.enrichment.email(lead.linkedin_url));
      if (r?.found && r?.email) { lead.email = r.email; found++; }
      done++;
      if (done % 25 === 0) console.log(`  enriched ${done}/${leads.length} (${found} emails)`);
      if (done % 200 === 0) await save(leads);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`Email enrichment done: ${found}/${leads.length} verified emails.`);
}

async function save(rows) { await mkdir(dirname(out), { recursive: true }); await writeFile(out, toCSV(rows, COLS), "utf-8"); }

// Resumable: enrich blank-email rows in an existing CSV until `target` rows have emails (0 = all). Re-runnable.
async function enrichFromFile(path, target) {
  const rows = parseCSV(readFileSync(path, "utf8"));
  const hdr = rows[0];
  const objs = rows.slice(1).filter(r => r.length >= hdr.length).map(r => Object.fromEntries(hdr.map((h, i) => [h, r[i] ?? ""])));
  let withEmail = objs.filter(o => o.email).length;
  const blanks = objs.filter(o => !o.email && o.linkedin_url);
  console.log(`Loaded ${objs.length} rows; ${withEmail} already enriched; ${blanks.length} blanks to try; target_emails=${target || "all"}`);
  const persist = async () => { await writeFile(path, toCSV(objs, hdr), "utf8"); };
  let done = 0, found = 0, stop = false;
  const queue = [...blanks];
  async function worker() {
    while (queue.length && !stop) {
      if (target > 0 && withEmail >= target) { stop = true; break; }
      const lead = queue.shift();
      const r = await safe(blitz.enrichment.email(lead.linkedin_url));
      if (r?.found && r?.email) { lead.email = r.email; found++; withEmail++; }
      done++;
      if (done % 25 === 0) console.log(`  tried ${done}/${blanks.length} (+${found} new, ${withEmail} total emails)`);
      if (done % 200 === 0) await persist();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  await persist();
  console.log(`Enrich-from-file done. ${withEmail} total emails in ${path} (added ${found} this run).`);
}

(async () => {
  if (enrichFile) { await enrichFromFile(enrichFile, targetEmails); return; }
  console.log(`Segment: ${segment} (${cfg.label})  target=${maxLeads}  email=${doEmail}  page-size=${pageSize}  emp-cap<=${cap}`);
  const leads = await searchAll();
  if (dryRun) { console.log("Dry run complete."); return; }
  await save(leads); // checkpoint after search, before long enrichment
  console.log(`Checkpoint: ${leads.length} leads saved -> ${out}`);
  if (doEmail && leads.length) await enrichEmails(leads);
  await save(leads);
  const withEmail = leads.filter(l => l.email).length;
  console.log(`\nSaved ${leads.length} leads -> ${out}${doEmail ? `  (${withEmail} with email)` : "  (no emails yet; re-run with --email)"}`);
})().catch(e => { console.error("Fatal:", e instanceof BlitzError ? e.message : e.message); process.exit(1); });
