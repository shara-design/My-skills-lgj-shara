# Blitz API — Toolkit & Reference

The canonical, **verified-against-the-live-API** reference for BlitzAPI list building, plus a zero-dependency Node toolkit that exposes every endpoint.

- **Docs:** https://docs.blitz-api.ai · **Base:** `https://api.blitz-api.ai` · **Auth:** `x-api-key` header · **Rate limit:** 5 req/sec (all plans)
- **Account on file:** `Agency – Enterprise` → `unlimited` credits, every endpoint enabled (email + phone included).
- Full doc mirror (Markdown) cached at [`../../.firecrawl/blitz/`](../../.firecrawl/blitz/).

> **Mental model.** Blitz separates **search** (find the right people/companies → returns *LinkedIn URLs*) from **enrichment** (LinkedIn URL → *email/phone*). Search **never** returns emails. Every pipeline is: `search → linkedin_url → enrich`.

---

## Files

| File | What it is |
|---|---|
| [`blitz-client.mjs`](blitz-client.mjs) | Zero-dep client library: auth, shared 5-RPS gate, retries, all 13 endpoints, cursor/page iterators, CSV + flatten helpers. Import it. |
| [`blitz.mjs`](blitz.mjs) | One CLI over the whole API (search / enrich / lookups / utils). `node blitz.mjs help`. |
| [`find-leads.mjs`](find-leads.mjs) | Killua-Energy preset wrapper (CA construction/solar/architect segments) built on the client. |
| [`inspect.mjs`](inspect.mjs) | Quick CSV analyzer (state/title/company distributions). |
| [`examples/`](examples/) | Copy-paste request bodies: `icp-people.json`, `icp-companies.json`, `cascade.json`. |

## Setup

```bash
set -a; source "../../coldoutboundskills/.env"; set +a   # loads BLITZ_API_KEY (+ optional BLITZ_BASE_URL)
node blitz.mjs key-info                                  # verify plan / credits / rate limit
```

---

## The 13 endpoints

All `POST` except `key-info`. The CLI command and client method are listed for each.

### Account
| Endpoint | CLI | Client | Notes |
|---|---|---|---|
| `GET /v2/account/key-info` | `key-info` | `account.keyInfo()` | Plan, credits, RPS, allowed endpoints. |

### Search — returns LinkedIn URLs, not contact points
| Endpoint | CLI | Client | Scope & limits |
|---|---|---|---|
| `/v2/search/people` | `search-people` | `search.people()` / `iterate.people()` | **The list-building workhorse.** Company + person filters in one call. Cursor pagination. **Cap 50k results / 1,000 pages.** Page size 1–50. |
| `/v2/search/companies` | `search-companies` | `search.companies()` / `iterate.companies()` | Firmographic filters only → company list. Cursor. **Page size capped at 25**, 1,000-page cap. |
| `/v2/search/employee-finder` | `employee-finder` | `search.employeeFinder()` / `iterate.employees()` | All employees at **one** `company_linkedin_url`. Page-based. **Cap 10k results / 200 pages.** Page size 1–50. |
| `/v2/search/waterfall-icp-keyword` | `waterfall` | `search.waterfall()` | Single best decision-maker via priority **cascade (≤8 tiers)**. `max_results` 1–25. <600ms. |

### Enrichment
| Endpoint | CLI | Client | Notes |
|---|---|---|---|
| `/v2/enrichment/email` | `enrich-email` | `enrichment.email(url)` | profile URL → verified work email (`{found,email,all_emails[]}`). Already SMTP-verified, re-tested ≤30 days. |
| `/v2/enrichment/phone` | `enrich-phone` | `enrichment.phone(url)` | profile URL → direct mobile (`{found,phone}`). **US ONLY.** |
| `/v2/enrichment/company` | `enrich-company` | `enrichment.company(url)` | company URL → full firmographic profile. |
| `/v2/enrichment/domain-to-linkedin` | `domain-to-linkedin` | `enrichment.domainToLinkedin(domain)` | domain → Company LinkedIn URL (+ `other[]` candidates). **The bridge** when you only have domains. |
| `/v2/enrichment/linkedin-to-domain` | `linkedin-to-domain` | `enrichment.linkedinToDomain(url)` | company URL → verified email domain. |
| `/v2/enrichment/email-to-person` | `email-to-person` | `enrichment.emailToPerson(email)` | reverse: email → full profile. |
| `/v2/enrichment/phone-to-person` | `phone-to-person` | `enrichment.phoneToPerson(phone)` | reverse: phone → full profile. |

### Utils
| Endpoint | CLI | Client |
|---|---|---|
| `/v2/utils/company-employment-distribution` | `employment-distribution` | `utils.employmentDistribution(url)` |
| `/v2/utils/current-date` | — | `utils.currentDate(tz?)` |

> **Undocumented but enabled on our key** (seen in `key-info.allowed_apis`, use with caution — not in public docs): `/search/waterfall-icp` (non-keyword variant), `/enrichment/email_domain`, `/search/domain-to-linkedin-company`.

---

## The filter universe (Find People & Company Search)

Filters are **AND across fields, OR within a field**. **All enum values are CASE-SENSITIVE** — `"vp"` instead of `"VP"` silently returns 0 results. Keyword fields support `include`/`exclude`; wrap a value in `[brackets]` for exact match (`"[CEO]"` ≠ `"CEO Office"`).

### `company` filters
`linkedin_url[]` (exact accounts, bypasses other filters) · `name.include/exclude` · `industry.include/exclude` (**534 values**) · `keywords.include/exclude` (description/specialties/categories) · `type.include/exclude` (**10**: `Privately Held`, `Public Company`, `Nonprofit`, `Government Agency`, `Educational`, `Partnership`, `Self-Employed`, `Self-Owned`, `Sole Proprietorship`, `Educational Institution`) · `employee_range[]` (**8 buckets**: `1-10`,`11-50`,`51-200`,`201-500`,`501-1000`,`1001-5000`,`5001-10000`,`10001+`) · `employee_count.{min,max}` (numeric) · `min_linkedin_followers` · `revenue.{min,max}` (USD/yr, `0`=unset) · `web_traffic.{min,max}` (monthly visits) · `ad_spend.{min,max}` (USD/mo Google Ads) · `naics_code.include/exclude` (exact strings) · `sic_code.include/exclude` (exact strings) · `founded_year.{min,max}` · `hq.city.include/exclude` · `hq.country_code[]` (ISO-2) · `hq.continent[]` · `hq.sales_region[]` (`NORAM`,`LATAM`,`EMEA`,`APAC`)

### `people` filters
`job_title.include/exclude` (+ `include_linkedin_headline: true` to also match headline) · `job_function[]` (**22**: Advertising & Marketing, Sales & Business Development, Engineering, Information Technology, Operations, Finance & Accounting, Human Resources, Customer/Client Service, Research & Development, Purchasing, Supply Chain & Logistics, General Business & Management, Legal, Healthcare & Human Services, Manufacturing & Production, Construction, Education, Science, Public Administration & Safety, Art Culture and Creative Professionals, Writing/Editing, Other) · `job_level[]` (**6**: `C-Team`,`VP`,`Director`,`Manager`,`Staff`,`Other`) · `min_connections` (0–500) · `location.{city,country_code,continent,sales_region}` · `education.include/exclude` (phrase match, e.g. `"Stanford 2025"`)

**Geography:** continents = `Africa, Antarctica, Asia, Europe, North America, Oceania, South America`. Country codes = ISO 3166-1 alpha-2 (`US`,`GB`,`FR`,…). Use `"WORLD"` for global in Waterfall/Employee Finder.

> Full enum lists live at docs.blitz-api.ai/guide/reference/normalization (industries, job-levels, companies, geography) and are mirrored in [`../../.firecrawl/blitz/`](../../.firecrawl/blitz/). Copy-paste exact strings.

⚠️ **No native US-state filter.** Target a state by pre-filtering on `location.city` (a city list) and post-filtering rows on `state_code`. See `find-leads.mjs`.

---

## Recipes

### A. Build an ICP prospecting list from scratch (most common)
```bash
# 1. Edit examples/icp-people.json to your ICP, then search + enrich emails in one shot:
node blitz.mjs search-people --icp=examples/icp-people.json --max=1000 --enrich=email \
  --out=../../profiles/<client>/lists/leads.csv
```
`search-people` paginates with the cursor automatically, flattens each person to a CSV row, then (with `--enrich=email`) fills verified work emails. Add `phone` to also pull US mobiles: `--enrich=email,phone`.

### B. Account-based (you have named companies)
```bash
# domains.csv has a company_domain column → resolve to LinkedIn URLs:
node blitz.mjs domain-to-linkedin --in=domains.csv --col=company_domain --out=companies.csv
# then for each company, get the single best decision-maker via a cascade:
node blitz.mjs waterfall --company="https://www.linkedin.com/company/<x>" --cascade=examples/cascade.json --max=5 --enrich=email --out=buying-committee.csv
```

### C. Enrich an existing list (resumable, runs in place)
```bash
node blitz.mjs enrich-email --in=leads.csv --col=linkedin_url            # fills blank `email`
node blitz.mjs enrich-phone --in=leads.csv --col=linkedin_url            # fills `mobile_phone` (US)
node blitz.mjs enrich-email --in=leads.csv --target=300                  # stop after 300 found
```
Batch enrichment skips rows already populated, checkpoints every 200, and writes back to the same file (or `--out`).

### Two-line library use
```js
import { createClient, flattenPerson } from "./blitz-client.mjs";
const blitz = createClient();
for await (const p of blitz.iterate.people({ company:{industry:{include:["Construction"]}}, people:{job_level:["C-Team"]} }, { maxItems: 500 }))
  console.log(flattenPerson(p));
```

---

## Plans, scale & gotchas

- **Flat-rate unlimited** — no per-lead cost; enrich 100 or 100,000 for the same price. Re-run ICPs on a schedule to capture job-changers / net-new (diff by `linkedin_url`).
- **5 RPS hard cap, all plans.** The client's shared gate spaces requests ~220ms apart; default `--concurrency=5`. 429s are retried with backoff.
- **Search input is a Company LinkedIn URL, never a domain.** Have only domains? Run `domain-to-linkedin` first.
- **Phones are US-only** (~90–95% mobile coverage). Non-US rows return `found:false`.
- **Emails** are deterministic (no pattern-guessing), 97% accuracy, verified at source — safe to send without a separate validation pass.
- **Caps:** Find People 50k/query (split a huge ICP across narrower filter slices to exceed it) · Employee Finder 10k/company · Waterfall ≤8 tiers, ≤25 results.
- **`min_connections`** is the cheapest quality filter — drops inactive/fake profiles.
- Error codes: `401` bad key · `402` plan limit · `429` rate limit · `500` transient (retried).

---

*Last verified against the live API: 2026-06-16. Endpoint list cross-checked with `GET /v2/account/key-info`.*
