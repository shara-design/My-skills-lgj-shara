#!/usr/bin/env node
// blitz — one CLI for the entire BlitzAPI surface (search, enrichment, lookups, utils).
// Zero-dependency. Built on ./blitz-client.mjs. See ./README.md for the full API reference.
//
//   set -a; source ../../coldoutboundskills/.env; set +a   # loads BLITZ_API_KEY
//   node blitz.mjs <command> [flags]
//
// ── Discovery ────────────────────────────────────────────────────────────────
//   key-info                              Show plan, credits, rate limit, allowed endpoints.
//
// ── Search (people/companies → LinkedIn URLs) ────────────────────────────────
//   search-people     --icp=FILE.json [--max=1000] [--page-size=50] [--out=people.csv] [--enrich=email,phone]
//   search-companies  --icp=FILE.json [--max=500]  [--out=companies.csv]
//   employee-finder   --company=URL [--job-level=VP,Director] [--job-function="Sales & Business Development"]
//                                  [--country=US,CA | --sales-region=NORAM] [--min-connections=200]
//                                  [--max=500] [--out=...] [--enrich=email,phone]
//   waterfall         --company=URL --cascade=FILE.json [--max=5] [--out=...] [--enrich=email,phone]
//
// ── Enrichment (single value OR batch over a CSV column) ─────────────────────
//   enrich-email      --linkedin=URL            | --in=people.csv [--col=linkedin_url] [--out=...] [--target=N]
//   enrich-phone      --linkedin=URL            | --in=people.csv [--col=linkedin_url] [--out=...]   (US only)
//   enrich-company    --company=URL             | --in=companies.csv [--col=company_linkedin_url]
//   domain-to-linkedin --domain=acme.com        | --in=domains.csv [--col=company_domain]
//   linkedin-to-domain --company=URL
//   email-to-person   --email=a@b.com
//   phone-to-person   --phone=+15551234567
//
// ── Utils ────────────────────────────────────────────────────────────────────
//   employment-distribution --company=URL
//
// Global flags: --json (print raw JSON), --out=FILE (write CSV), --max=N, --page-size=N (1-50),
//               --concurrency=N (default 5), --dry-run (print request body, no calls), --quiet.

import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
  createClient, flattenPerson, flattenCompany, toCSV, readCSVObjects, BlitzError,
} from "./blitz-client.mjs";

// ---- arg parsing -----------------------------------------------------------
const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (k, d) => {
  const m = argv.find((a) => a.startsWith(`--${k}=`));
  return m ? m.split("=").slice(1).join("=") : d;
};
const has = (k) => argv.includes(`--${k}`);
const list = (k) => { const v = flag(k); return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined; };
const num = (k, d) => { const v = flag(k); return v != null ? Number(v) : d; };

const QUIET = has("quiet");
const JSON_OUT = has("json");
const DRY = has("dry-run");
const OUT = flag("out");
const MAX = num("max", 1000);
const PAGE_SIZE = Math.min(50, Math.max(1, num("page-size", 50)));
const CONCURRENCY = Math.max(1, num("concurrency", 5));
const log = (...a) => { if (!QUIET) console.error(...a); };

async function readJSON(path) {
  const { readFile } = await import("node:fs/promises");
  const obj = JSON.parse(await readFile(path, "utf8"));
  // Strip top-level "_comment"-style annotation keys so they're never sent on the wire.
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) if (k.startsWith("_")) delete obj[k];
  }
  return obj;
}
async function saveCSV(rows, columns) {
  if (!OUT) { console.log(toCSV(rows, columns)); return; }
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, toCSV(rows, columns), "utf8");
  log(`Wrote ${rows.length} rows -> ${OUT}`);
}
function printJSON(obj) { console.log(JSON.stringify(obj, null, 2)); }

// concurrency pool
async function pool(items, n, fn) {
  const queue = items.map((it, i) => [it, i]);
  let done = 0;
  async function worker() {
    while (queue.length) {
      const [it, i] = queue.shift();
      await fn(it, i);
      done++;
      if (!QUIET && done % 25 === 0) log(`  ${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
}

// chain email/phone enrichment onto an array of flattened person rows
async function enrichRows(blitz, rows, kinds) {
  const wantEmail = kinds.includes("email");
  const wantPhone = kinds.includes("phone");
  let emails = 0, phones = 0;
  await pool(rows, CONCURRENCY, async (row) => {
    if (!row.linkedin_url) return;
    if (wantEmail) {
      try { const r = await blitz.enrichment.email(row.linkedin_url); if (r?.found && r?.email) { row.email = r.email; emails++; } } catch {}
    }
    if (wantPhone && row.country_code === "US") {
      try { const r = await blitz.enrichment.phone(row.linkedin_url); const ph = r?.phone || r?.mobile || ""; if (r?.found && ph) { row.mobile_phone = ph; phones++; } } catch {}
    }
  });
  if (wantEmail) log(`  emails: ${emails}/${rows.length}`);
  if (wantPhone) log(`  mobiles (US): ${phones}/${rows.length}`);
}

// ---- commands --------------------------------------------------------------
const commands = {
  async "key-info"(blitz) {
    printJSON(await blitz.account.keyInfo());
  },

  async "search-people"(blitz) {
    const icpPath = flag("icp");
    if (!icpPath) throw new Error("search-people needs --icp=FILE.json (the Find People request body)");
    const body = await readJSON(icpPath);
    body.max_results = PAGE_SIZE;
    if (DRY) return printJSON(body);
    const rows = [];
    for await (const p of blitz.iterate.people(body, {
      maxItems: MAX, pageSize: PAGE_SIZE,
      onPage: ({ page, items, total }) => log(`  page ${page}: +${items}  (collected ${rows.length}${total ? `, total_results ${total}` : ""})`),
    })) rows.push(flattenPerson(p));
    log(`Found ${rows.length} people.`);
    const enrich = list("enrich");
    if (enrich?.length) await enrichRows(blitz, rows, enrich);
    if (JSON_OUT) return printJSON(rows);
    await saveCSV(rows);
  },

  async "search-companies"(blitz) {
    const icpPath = flag("icp");
    if (!icpPath) throw new Error("search-companies needs --icp=FILE.json (the Company Search request body)");
    const body = await readJSON(icpPath);
    body.max_results = Math.min(25, PAGE_SIZE); // company search page cap is 25
    if (DRY) return printJSON(body);
    const rows = [];
    for await (const c of blitz.iterate.companies(body, {
      maxItems: MAX, pageSize: body.max_results,
      onPage: ({ page, items }) => log(`  page ${page}: +${items}  (collected ${rows.length})`),
    })) rows.push(flattenCompany(c));
    log(`Found ${rows.length} companies.`);
    if (JSON_OUT) return printJSON(rows);
    await saveCSV(rows);
  },

  async "employee-finder"(blitz) {
    const company = flag("company");
    if (!company) throw new Error("employee-finder needs --company=COMPANY_LINKEDIN_URL");
    const body = {
      company_linkedin_url: company,
      max_results: PAGE_SIZE,
      ...(list("job-level") ? { job_level: list("job-level") } : {}),
      ...(list("job-function") ? { job_function: list("job-function") } : {}),
      ...(list("country") ? { country_code: list("country") } : {}),
      ...(list("sales-region") ? { sales_region: list("sales-region") } : {}),
      ...(list("continent") ? { continent: list("continent") } : {}),
      ...(flag("min-connections") ? { min_connections_count: num("min-connections") } : {}),
    };
    if (DRY) return printJSON(body);
    const rows = [];
    for await (const p of blitz.iterate.employees(body, {
      maxItems: MAX, pageSize: PAGE_SIZE,
      onPage: ({ page, items, totalPages }) => log(`  page ${page}/${totalPages}: +${items}  (collected ${rows.length})`),
    })) rows.push(flattenPerson(p));
    log(`Found ${rows.length} employees.`);
    const enrich = list("enrich");
    if (enrich?.length) await enrichRows(blitz, rows, enrich);
    if (JSON_OUT) return printJSON(rows);
    await saveCSV(rows);
  },

  async "waterfall"(blitz) {
    const company = flag("company");
    const cascadePath = flag("cascade");
    if (!company || !cascadePath) throw new Error("waterfall needs --company=URL and --cascade=FILE.json");
    const cascade = await readJSON(cascadePath);
    const body = { company_linkedin_url: company, cascade, max_results: num("max", 5) };
    if (DRY) return printJSON(body);
    const resp = await blitz.search.waterfall(body);
    const rows = (resp.results || []).map((r) => flattenPerson(r));
    log(`Waterfall returned ${rows.length} contact(s).`);
    const enrich = list("enrich");
    if (enrich?.length) await enrichRows(blitz, rows, enrich);
    if (JSON_OUT) return printJSON(rows);
    await saveCSV(rows);
  },

  // ---- enrichment: single value or batch over a CSV column ----
  async "enrich-email"(blitz) { await batchOrSingle(blitz, "linkedin", "linkedin_url", "email", (v) => blitz.enrichment.email(v)); },
  async "enrich-phone"(blitz) { await batchOrSingle(blitz, "linkedin", "linkedin_url", "mobile_phone", (v) => blitz.enrichment.phone(v)); },
  async "enrich-company"(blitz) { await batchOrSingle(blitz, "company", "company_linkedin_url", null, (v) => blitz.enrichment.company(v)); },
  async "domain-to-linkedin"(blitz) { await batchOrSingle(blitz, "domain", "company_domain", "company_linkedin_url", (v) => blitz.enrichment.domainToLinkedin(v)); },

  async "linkedin-to-domain"(blitz) { printJSON(await blitz.enrichment.linkedinToDomain(reqFlag("company"))); },
  async "email-to-person"(blitz) { printJSON(await blitz.enrichment.emailToPerson(reqFlag("email"))); },
  async "phone-to-person"(blitz) { printJSON(await blitz.enrichment.phoneToPerson(reqFlag("phone"))); },
  async "employment-distribution"(blitz) { printJSON(await blitz.utils.employmentDistribution(reqFlag("company"))); },
};

function reqFlag(k) { const v = flag(k); if (!v) throw new Error(`Missing --${k}`); return v; }

// Single value (--<single>=X → print JSON) or batch (--in=CSV --col=COLUMN → enrich + write CSV).
// `writeBack` is the column to populate from the response (extracted heuristically), or null to just dump JSON.
async function batchOrSingle(blitz, singleFlag, defaultCol, writeBack, call) {
  const single = flag(singleFlag);
  if (single) return printJSON(await call(single));

  const inPath = flag("in");
  if (!inPath) throw new Error(`Provide --${singleFlag}=VALUE for one lookup, or --in=FILE.csv for batch.`);
  const col = flag("col", defaultCol);
  const target = num("target", 0); // stop after N successful (0 = all)
  const { header, objects } = readCSVObjects(inPath);
  if (!header.includes(col)) throw new Error(`Column "${col}" not in ${inPath}. Columns: ${header.join(", ")}`);
  if (writeBack && !header.includes(writeBack)) header.push(writeBack);

  const todo = objects.filter((o) => o[col] && (!writeBack || !o[writeBack]));
  log(`Batch ${cmd}: ${todo.length} rows to process from ${inPath} (col=${col}${writeBack ? `, writes ${writeBack}` : ""})`);
  let ok = 0, stop = false;
  const outPath = OUT || inPath; // default: enrich in place
  const persist = async () => { await mkdir(dirname(outPath), { recursive: true }); await writeFile(outPath, toCSV(objects, header), "utf8"); };

  let processed = 0;
  await pool(todo, CONCURRENCY, async (row) => {
    if (stop) return;
    if (target > 0 && ok >= target) { stop = true; return; }
    try {
      const r = await call(row[col]);
      const val = extractValue(cmd, r);
      if (val != null && val !== "") { if (writeBack) row[writeBack] = val; ok++; }
    } catch {}
    if (++processed % 200 === 0) await persist();
  });
  await persist();
  log(`Done. ${ok}/${todo.length} succeeded -> ${outPath}`);
}

// Pull the useful scalar out of each enrichment response for CSV write-back.
function extractValue(command, r) {
  if (!r) return "";
  switch (command) {
    case "enrich-email": return r.found ? (r.email || "") : "";
    case "enrich-phone": return r.found ? (r.phone || r.mobile || "") : "";
    case "domain-to-linkedin": return r.company_linkedin_url || r.linkedin_url || "";
    default: return "";
  }
}

// ---- main ------------------------------------------------------------------
(async () => {
  if (!cmd || cmd === "help" || cmd === "--help" || has("help")) {
    console.log(readUsage());
    process.exit(cmd ? 0 : 1);
  }
  const handler = commands[cmd];
  if (!handler) {
    console.error(`Unknown command: ${cmd}\nRun \`node blitz.mjs help\` for the list.`);
    process.exit(1);
  }
  const blitz = createClient({ log });
  await handler(blitz);
})().catch((e) => {
  if (e instanceof BlitzError && e.status) console.error(`Blitz error ${e.status}: ${e.message}`);
  else console.error("Error:", e.message);
  process.exit(1);
});

function readUsage() {
  // The header comment block of this file is the canonical usage text.
  try {
    const txt = readFileSync(fileURLToPath(import.meta.url), "utf8");
    return txt.split("\n").filter((l) => l.startsWith("//")).slice(1).map((l) => l.replace(/^\/\/ ?/, "")).join("\n");
  } catch {
    return "blitz <command> [flags] — see ./README.md";
  }
}
