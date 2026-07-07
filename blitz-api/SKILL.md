---
name: blitz-api
description: Build and enrich B2B lead lists via the BlitzAPI (api.blitz-api.ai). Search people/companies by ICP, find employees/decision-makers at a company, run waterfall ICP cascades, and enrich LinkedIn URLs into verified work emails + mobile phones. Includes a zero-dependency Node client, a full CLI, and preset list-builders (CA contractors/solar/architects, CSLB company-name -> email chain). Trigger when the user wants to pull leads from Blitz, search by ICP, enrich LinkedIn URLs to emails/phones, domain<->linkedin lookups, or build/merge/export a prospect list with Blitz.
---

# Blitz API Toolkit

Zero-dependency (Node 18+, uses global `fetch`) tooling for the entire BlitzAPI v2 surface:
search -> LinkedIn URL -> enrichment (email/phone). Everything shares one 5 RPS rate gate,
retries on 429/5xx, and cursor/page pagination.

## Setup

```bash
# Load the API key into the environment first (every script reads BLITZ_API_KEY):
set -a; source <path-to>/.env; set +a      # must export BLITZ_API_KEY (+ optional BLITZ_BASE_URL)
```

Auth is the `x-api-key` header. Base URL defaults to `https://api.blitz-api.ai`. Limit: 5 req/sec, all plans.
Search endpoints return **LinkedIn URLs, not emails/phones** — always: search -> linkedin_url -> enrich.

## Files in this skill

| File | What it is |
|---|---|
| `blitz-client.mjs` | The library. `createClient()` + `account/search/enrichment/utils`, pagination iterators, CSV + person/company flatteners. Import this for anything custom. |
| `blitz.mjs` | The general CLI over the whole API. `node blitz.mjs help` for all commands. |
| `find-leads.mjs` | Preset list builder (segments: `gc`, `solar`, `architects`) — builds CA lists from scratch + resumable email enrichment. |
| `enrich-company-list.mjs` | Company-name-only list (e.g. CSLB license export) -> decision-maker email via the 3-hop chain (company search -> employee finder -> email). |
| `merge-solar.mjs` | Merge + dedupe native people-search and CSLB-chain outputs into one email-only handoff CSV. |
| `export-handoff.mjs` | Produce clean Bison-upload handoff CSVs (email-only) per segment + a combined file. |
| `inspect.mjs` | QA a lead CSV: state/company/title distribution, VP flood + off-ICP keyword counts. |
| `test-enrich.mjs` | Quick throughput/hit-rate probe for the email enrichment endpoint. |
| `examples/icp-people.json` | Find People request-body template. |
| `examples/icp-companies.json` | Company Search request-body template. |
| `examples/cascade.json` | Waterfall ICP priority-cascade template. |

## CLI quick reference (`node blitz.mjs <cmd>`)

- **Discovery:** `key-info` (plan, credits, rate limit, allowed endpoints)
- **Search:** `search-people --icp=FILE.json`, `search-companies --icp=FILE.json`,
  `employee-finder --company=URL`, `waterfall --company=URL --cascade=FILE.json`
  (all accept `--max`, `--out=FILE.csv`, `--enrich=email,phone`, `--dry-run`)
- **Enrichment (single value or `--in=CSV --col=...` batch):** `enrich-email`, `enrich-phone` (US only),
  `enrich-company`, `domain-to-linkedin`, `linkedin-to-domain`, `email-to-person`, `phone-to-person`
- **Utils:** `employment-distribution --company=URL`

Global flags: `--json`, `--out=FILE`, `--max=N`, `--page-size=N` (1-50), `--concurrency=N` (default 5),
`--dry-run`, `--quiet`.

## Typical flows

1. **ICP people list with emails:** edit `examples/icp-people.json`, then
   `node blitz.mjs search-people --icp=examples/icp-people.json --max=500 --out=people.csv --enrich=email`
2. **One company's decision-makers:** `node blitz.mjs employee-finder --company=<linkedin_url> --job-level=VP,Director --enrich=email,phone --out=dm.csv`
3. **Company-name-only list -> emails:** `node enrich-company-list.mjs --in=licenses.csv --out=enriched.csv --name-col=business_name --city-col=city`
4. **Single best contact:** `node blitz.mjs waterfall --company=<url> --cascade=examples/cascade.json --enrich=email`

Always start with `--dry-run` to inspect the request body and `key-info` to confirm plan/credits before a big run.
All enum values in request bodies are CASE-SENSITIVE.
