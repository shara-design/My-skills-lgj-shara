#!/usr/bin/env node
// Blitz API client — zero-dependency, Node 18+ (uses global fetch).
// One source of truth for every BlitzAPI v2 endpoint, the shared 5 RPS rate gate,
// retries, cursor/page pagination, and CSV helpers.
//
// Docs:  https://docs.blitz-api.ai   ·   local reference: ./README.md
// Base:  https://api.blitz-api.ai    ·   Auth: `x-api-key` header   ·   5 requests/sec (all plans)
//
// Search returns LinkedIn URLs, NOT emails/phones. The pattern is always:
//   search (people/companies/employee-finder/waterfall) -> linkedin_url -> enrichment (email/phone).
//
// Usage (as a library):
//   import { createClient } from "./blitz-client.mjs";
//   const blitz = createClient();                         // reads BLITZ_API_KEY (+ optional BLITZ_BASE_URL)
//   const info  = await blitz.account.keyInfo();
//   for await (const p of blitz.iterate.people({ company:{...}, people:{...} }, { maxItems: 500 })) { ... }

import { readFileSync } from "node:fs";

export const DEFAULT_BASE = "https://api.blitz-api.ai";

// Endpoint map (kept here so the reference doc and CLI stay in sync with the code).
export const ENDPOINTS = {
  keyInfo:                "/v2/account/key-info",                       // GET
  searchPeople:           "/v2/search/people",                         // POST  cursor
  searchCompanies:        "/v2/search/companies",                      // POST  cursor
  employeeFinder:         "/v2/search/employee-finder",                // POST  page
  waterfall:              "/v2/search/waterfall-icp-keyword",          // POST
  enrichEmail:            "/v2/enrichment/email",                      // POST  (Email plan+)
  enrichPhone:            "/v2/enrichment/phone",                      // POST  (Phone plan, US only)
  enrichCompany:          "/v2/enrichment/company",                    // POST
  domainToLinkedin:       "/v2/enrichment/domain-to-linkedin",         // POST
  linkedinToDomain:       "/v2/enrichment/linkedin-to-domain",         // POST
  emailToPerson:          "/v2/enrichment/email-to-person",            // POST  reverse
  phoneToPerson:          "/v2/enrichment/phone-to-person",            // POST  reverse
  employmentDistribution: "/v2/utils/company-employment-distribution", // POST
  currentDate:            "/v2/utils/current-date",                    // POST
};

export class BlitzError extends Error {
  constructor(message, { status, body, path } = {}) {
    super(message);
    this.name = "BlitzError";
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Account-wide 5 RPS limiter, shared across every concurrent caller of one client.
// Spaces request *starts* >= (1000/rps + margin) ms apart so bursts never trip a 429.
function makeGate(rps) {
  const MIN = Math.ceil(1000 / Math.max(1, rps)) + 20; // ~220ms at 5 RPS
  let last = 0;
  return async function gate() {
    const now = Date.now();
    const wait = Math.max(0, last + MIN - now);
    last = now + wait;
    if (wait) await sleep(wait);
  };
}

/**
 * Create a Blitz client.
 * @param {object} [opts]
 * @param {string} [opts.apiKey]   defaults to process.env.BLITZ_API_KEY
 * @param {string} [opts.baseUrl]  defaults to process.env.BLITZ_BASE_URL || DEFAULT_BASE
 * @param {number} [opts.rps]      client-side rate cap (default 5 — the account limit)
 * @param {number} [opts.maxRetries] retries on 429/5xx/network (default 7)
 * @param {(msg:string)=>void} [opts.log] optional progress logger
 */
export function createClient(opts = {}) {
  const apiKey = opts.apiKey || process.env.BLITZ_API_KEY;
  const baseUrl = (opts.baseUrl || process.env.BLITZ_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
  if (!apiKey) {
    throw new BlitzError(
      "Missing BLITZ_API_KEY. Run: set -a; source coldoutboundskills/.env; set +a"
    );
  }
  const gate = makeGate(opts.rps || 5);
  const maxRetries = opts.maxRetries ?? 7;
  const log = opts.log || (() => {});

  async function request(method, path, body, attempt = 0) {
    await gate();
    let res;
    try {
      res = await fetch(baseUrl + path, {
        method,
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: body != null ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      if (attempt < maxRetries) {
        await sleep(Math.min(20000, 800 * 2 ** attempt));
        return request(method, path, body, attempt + 1);
      }
      throw new BlitzError(`Network error on ${path}: ${e.message}`, { path });
    }

    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      // 429 guidance is "wait before retry"; back off exponentially.
      await sleep(Math.min(30000, 1200 * 2 ** attempt));
      return request(method, path, body, attempt + 1);
    }

    const text = await res.text().catch(() => "");
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

    if (!res.ok) {
      const msg = json?.message || res.statusText;
      throw new BlitzError(`${method} ${path} -> ${res.status} ${msg}`, {
        status: res.status, body: json, path,
      });
    }
    return json;
  }

  const post = (path, body) => request("POST", path, body);
  const get = (path) => request("GET", path);

  // ---- Account -------------------------------------------------------------
  const account = {
    /** Validity, remaining credits, rate limit, allowed endpoints, active plans. */
    keyInfo: () => get(ENDPOINTS.keyInfo),
  };

  // ---- Search (returns LinkedIn URLs, not contact points) ------------------
  const search = {
    /** Find People — two-stage (company + person filters). Cursor pagination. Cap 50k / 1000 pages. */
    people: (body) => post(ENDPOINTS.searchPeople, body),
    /** Company Search — firmographic filters only. Cursor pagination. Cap 1000 pages. */
    companies: (body) => post(ENDPOINTS.searchCompanies, body),
    /** Employee Finder — all matching employees at ONE company_linkedin_url. Page pagination. Cap 10k / 200 pages. */
    employeeFinder: (body) => post(ENDPOINTS.employeeFinder, body),
    /** Waterfall ICP — single best decision-maker via priority cascade (<=8 tiers). */
    waterfall: (body) => post(ENDPOINTS.waterfall, body),
  };

  // ---- Enrichment ----------------------------------------------------------
  const enrichment = {
    /** profile URL -> verified work email (+ all_emails[]). Requires Unlimited Email plan. */
    email: (personLinkedinUrl) => post(ENDPOINTS.enrichEmail, { person_linkedin_url: personLinkedinUrl }),
    /** profile URL -> direct mobile number. US ONLY. Requires Unlimited Phone plan. */
    phone: (personLinkedinUrl) => post(ENDPOINTS.enrichPhone, { person_linkedin_url: personLinkedinUrl }),
    /** company URL -> full firmographic profile (industry, size, hq, domain, website, ...). */
    company: (companyLinkedinUrl) => post(ENDPOINTS.enrichCompany, { company_linkedin_url: companyLinkedinUrl }),
    /** website domain -> Company LinkedIn URL (the key that unlocks every company-scoped endpoint). */
    domainToLinkedin: (domain) => post(ENDPOINTS.domainToLinkedin, { domain }),
    /** Company LinkedIn URL -> verified email domain. */
    linkedinToDomain: (companyLinkedinUrl) => post(ENDPOINTS.linkedinToDomain, { company_linkedin_url: companyLinkedinUrl }),
    /** verified work email -> full person profile (reverse lookup). */
    emailToPerson: (email) => post(ENDPOINTS.emailToPerson, { email }),
    /** phone number -> full person profile (reverse lookup). */
    phoneToPerson: (phone) => post(ENDPOINTS.phoneToPerson, { phone }),
  };

  // ---- Utils ---------------------------------------------------------------
  const utils = {
    /** company URL -> employee headcount grouped by ISO country code. */
    employmentDistribution: (companyLinkedinUrl) =>
      post(ENDPOINTS.employmentDistribution, { company_linkedin_url: companyLinkedinUrl }),
    /** current server date/time (debugging tz issues). */
    currentDate: (timezone) => post(ENDPOINTS.currentDate, timezone ? { timezone } : {}),
  };

  // ---- Pagination iterators ------------------------------------------------
  // Cursor-based (people, companies): stable across inserts, no duplicates.
  async function* iterateCursor(fn, body, { maxItems = Infinity, pageSize, onPage } = {}) {
    let cursor = body.cursor ?? null;
    let page = 0, count = 0;
    const base = { ...body };
    if (pageSize != null) base.max_results = pageSize;
    while (count < maxItems) {
      const resp = await fn({ ...base, cursor });
      const items = pickItems(resp);
      page++;
      if (onPage) onPage({ page, items: items.length, total: resp.total_results ?? null, resp });
      for (const it of items) {
        yield it;
        if (++count >= maxItems) return;
      }
      cursor = resp.cursor ?? null;
      if (!cursor || items.length === 0) break;
    }
  }

  // Page-based (employee finder): walk page 1..total_pages.
  async function* iteratePage(fn, body, { maxItems = Infinity, pageSize, onPage } = {}) {
    let page = body.page ?? 1, count = 0, totalPages = Infinity;
    const base = { ...body };
    if (pageSize != null) base.max_results = pageSize;
    while (count < maxItems && page <= totalPages) {
      const resp = await fn({ ...base, page });
      const items = pickItems(resp);
      totalPages = resp.total_pages ?? totalPages;
      if (onPage) onPage({ page, items: items.length, totalPages, resp });
      for (const it of items) {
        yield it;
        if (++count >= maxItems) return;
      }
      if (items.length === 0 || page >= totalPages) break;
      page++;
    }
  }

  const iterate = {
    people: (body, o) => iterateCursor(search.people, body, o),
    companies: (body, o) => iterateCursor(search.companies, body, o),
    employees: (body, o) => iteratePage(search.employeeFinder, body, o),
  };

  return {
    baseUrl, apiKey, log,
    account, search, enrichment, utils,
    iterate, iterateCursor, iteratePage,
    request, post, get,
  };
}

// ---- Response shape helpers ------------------------------------------------
/** Items array across the search endpoints (people/companies/employee-finder all use `results`). */
export function pickItems(resp) {
  return resp?.results ?? resp?.data ?? [];
}

/**
 * Flatten a Blitz person object (from Find People / Employee Finder `results[]`,
 * or Waterfall `results[].person`) into a flat row for CSV.
 */
export function flattenPerson(p, extra = {}) {
  const person = p?.person ?? p; // Waterfall nests under .person
  const exps = Array.isArray(person.experiences) ? person.experiences : [];
  const exp = exps.find((e) => e && e.job_is_current) || exps[0] || {};
  const loc = person.location || {};
  return {
    first_name: person.first_name || "",
    last_name: person.last_name || "",
    full_name: person.full_name || `${person.first_name || ""} ${person.last_name || ""}`.trim(),
    job_title: exp.job_title || person.headline || "",
    headline: person.headline || "",
    company_linkedin_url: exp.company_linkedin_url || "",
    linkedin_url: person.linkedin_url || "",
    city: loc.city || "",
    state_code: (loc.state_code || "").toUpperCase(),
    country_code: (loc.country_code || "").toUpperCase(),
    connections_count: person.connections_count ?? "",
    email: "",
    mobile_phone: "",
    ...(p?.icp != null ? { icp_tier: p.icp } : {}),
    ...(p?.ranking != null ? { ranking: p.ranking } : {}),
    ...extra,
  };
}

/** Flatten a Blitz company object from Company Search `results[]`. */
export function flattenCompany(c, extra = {}) {
  const hq = c.hq || {};
  return {
    name: c.name || "",
    linkedin_url: c.linkedin_url || "",
    website: c.website || "",
    industry: c.industry || "",
    employees_on_linkedin: c.employees_on_linkedin ?? "",
    hq_city: hq.city || "",
    hq_country: hq.country || hq.country_code || "",
    hq_country_code: hq.country_code || "",
    ...extra,
  };
}

// ---- CSV helpers -----------------------------------------------------------
export function toCSV(rows, columns) {
  const cols = columns || (rows.length ? Object.keys(rows[0]) : []);
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
}

export function parseCSV(text) {
  const rows = [];
  let field = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { field.push(cur); cur = ""; }
      else if (c === "\n") { field.push(cur); rows.push(field); field = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur !== "" || field.length) { field.push(cur); rows.push(field); }
  return rows;
}

/** Read a CSV file into an array of objects keyed by header row. */
export function readCSVObjects(path) {
  const rows = parseCSV(readFileSync(path, "utf8"));
  if (!rows.length) return { header: [], objects: [] };
  const header = rows[0];
  const objects = rows
    .slice(1)
    .filter((r) => r.length && r.some((v) => v !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
  return { header, objects };
}
