---
name: ai-ark-list-builder
description: Build lead lists from audience targeting documents using the AI ARK API. Trigger when the user wants to pull leads, build a prospect list, search for people/companies, use AI ARK, generate a contact list from an audience targeting document, or find people/companies matching specific criteria. Also trigger when the user mentions "list building," "lead generation," "prospect search," or references an audience targeting document for list building.
---

# AI ARK List Builder

You build lead lists by reading audience targeting documents and converting them into AI ARK API queries. The workflow is validation-first: parse the document, map criteria to AI ARK filters, build the query JSON, present it to the user for approval, then execute. Never call the API before the user sees and approves the query.

## How it works

The user provides an audience targeting document (usually a markdown file describing who they want to target — industries, job titles, locations, company types, etc.). You parse each segment, map the criteria to valid AI ARK API filters, build the query JSON, and present it for approval. After the user confirms, you execute the search, show results, and support iterative refinement and bulk export.

## AI ARK API Reference

**Base URL:** `https://api.ai-ark.com/api/developer-portal`
**Auth:** `X-TOKEN: 2e00d0d1716342f284002634b0ce1f56` header on every request
**Rate limits:** 5 requests/second, 300/minute, 18,000/hour

### Endpoints

| Endpoint | Method | Path |
|----------|--------|------|
| People Search | POST | `/v1/people` |
| Company Search | POST | `/v1/companies` |
| Reverse Lookup | POST | `/v1/people/reverse-lookup` |
| Mobile Phone Finder | POST | `/v1/people/mobile-phone-finder` |
| Personality Analysis | POST | `/v1/people/analysis` |
| Export People w/ Email | POST | `/v1/people/export` |
| Export Results | GET | `/v1/people/export/{trackId}/inquiries` |
| Export Statistics | GET | `/v1/people/export/{trackId}/inquiries/statistics` |
| Email Finder Results | GET | `/v1/people/email-finder/{trackId}/inquiries` |
| Credits | GET | `/v1/payments/credits` |

### Working Account Filters (Company-Level)

**`account.industries`** — 148 valid values from `industries.json`
```json
"industries": { "any": { "include": { "mode": "SMART", "content": ["wellness and fitness services"] } } }
```
Key mappings: gyms/fitness = `"wellness and fitness services"`, med spas = `"medical practices"`, chiro/yoga = `"alternative medicine"`, restaurants = `"restaurants"`

**`account.location`** — country, state, or city names
```json
"location": { "any": { "include": ["United States"], "exclude": ["Nevada", "Arizona"] } }
```

**`account.type`** — company type enum
```json
"type": { "any": { "include": ["PRIVATELY_HELD", "SELF_OWNED", "PARTNERSHIP"] } }
```
Valid values: `PRIVATELY_HELD` (105M), `PUBLIC_COMPANY` (71M), `EDUCATIONAL` (17M), `GOVERNMENT_AGENCY` (16M), `NON_PROFIT` (15M), `PARTNERSHIP` (10M), `SELF_OWNED` (6M), `SELF_EMPLOYED` (4M)

**`account.foundedYear`** — year range
```json
"foundedYear": { "type": "RANGE", "range": { "start": 1900, "end": 2023 } }
```

**`account.employeeSize`** — numeric range
```json
"employeeSize": { "type": "RANGE", "range": [{ "start": 1, "end": 50 }] }
```

**`account.revenue`** — numeric range in dollars
```json
"revenue": { "type": "RANGE", "range": [{ "start": 500000, "end": 50000000 }] }
```

**`account.geoLocation`** — radius search around coordinates
```json
"geoLocation": { "position": { "lat": 25.7617, "lng": -80.1918 }, "radius": 50, "unit": "mi" }
```

**`account.keyword`** — search company descriptions/industry/name
```json
"keyword": {
  "any": {
    "include": {
      "sources": [{"mode": "SMART", "source": "DESCRIPTION"}, {"mode": "SMART", "source": "INDUSTRY"}],
      "content": ["gym", "fitness", "CrossFit"]
    }
  }
}
```
Valid sources: `DESCRIPTION` (works), `INDUSTRY` (works), `NAME` (restrictive). **NEVER use source `KEYWORD` — always returns 0.**

**`account.technologies`** — 16,041 values from `technologies.json`
```json
"technologies": { "any": { "include": { "mode": "SMART", "content": ["wordpress.org"] } } }
```

**`account.naics`** — NAICS industry codes
```json
"naics": { "any": { "include": ["713940"] } }
```

**`account.funding`** — funding round type
```json
"funding": { "type": ["SEED", "SERIES_A"] }
```
Valid: PRE_SEED, SEED, SERIES_A through SERIES_J, VENTURE_ROUND, ANGEL, PRIVATE_EQUITY, DEBT_FINANCING, CONVERTIBLE_NOTE, GRANT, CORPORATE_ROUND, EQUITY_CROWDFUNDING, PRODUCT_CROWDFUNDING, SECONDARY_MARKET, POST_IPO_EQUITY, POST_IPO_DEBT, POST_IPO_SECONDARY, NON_EQUITY_ASSISTANCE, INITIAL_COIN_OFFERING, UNDISCLOSED, SERIES_UNKNOWN, FUNDING_ROUND

**`account.domain`** — company website domain
```json
"domain": { "any": { "include": ["orangetheory.com"] } }
```

**`account.name`** — company name search
```json
"name": { "any": { "include": { "mode": "SMART", "content": ["Orangetheory Fitness"] } } }
```

**`account.productAndServices`** — products/services text search
```json
"productAndServices": { "any": { "include": { "mode": "SMART", "content": ["personal training"] } } }
```

**`account.socialMedia`** — has social media presence
```json
"socialMedia": { "any": { "include": ["LINKEDIN"] } }
```
Valid: `FACEBOOK`, `INSTAGRAM`, `TWITTER`, `LINKEDIN`

**`account.language`** — company language
44 valid languages: English, Spanish, French, Portuguese, German, Dutch, Italian, Chinese, Turkish, Polish, Russian, Swedish, Arabic, Indonesian, Danish, Czech, Norwegian, Japanese, Korean, Romanian, Ukrainian, Thai, Hindi, Malay, Tagalog, Vietnamese, Finnish, Persian, Greek, Hungarian, Bengali, Marathi, Telugu, Panjabi, Serbian, Slovak, Croatian, Lithuanian, Latvian, Albanian, Icelandic, Armenian, Bosnian, Tamil

**`account.metric`** — growth metrics
```json
"metric": { "employee": [{ "function": ["sales"], "start": 5, "end": 100, "timeFrame": "TWELVE" }] }
```
TimeFrame values: `ONE`, `THREE`, `SIX`, `TWELVE`, `TWENTY_FOUR`

**`lookalikeDomains`** — find similar companies (up to 5 domains, root level parameter)

### Working Contact Filters (Person-Level)

**`contact.seniority`** — the primary filter for finding decision makers
```json
"seniority": { "any": { "include": ["Owner", "Founder", "VP", "Director"] } }
```
Valid values with counts:
- `Senior` (235M), `Entry` (117M), `Manager` (88M), `Director` (14M), `Owner` (12M), `Intern` (10M), `Founder` (9M), `Head` (4M), `VP` (2M), `Partner` (1M)
- **`CXO` and `President` return 0 — do NOT use them**

**`contact.location`** — person's location
```json
"location": { "any": { "include": ["Miami, Florida"] } }
```

**`contact.fullName`** — search by person name
```json
"fullName": { "any": { "include": { "mode": "WORD", "content": ["Justin Ashcraft"] } } }
```

**`contact.linkedin`** — search by LinkedIn URL
```json
"linkedin": { "any": { "include": ["https://www.linkedin.com/in/profile-slug"] } }
```

### BROKEN Filters — NEVER Use

| Filter | Issue |
|--------|-------|
| `contact.title` (include) | Returns 525M regardless of value — does not filter |
| `contact.skills` | Returns 525M regardless of value — does not filter |
| `contact.currentCompany` | Returns 525M regardless of value — does not filter |
| `contact.department` | Returns 525M regardless of value — does not filter |
| `account.keyword` source `KEYWORD` | Always returns 0 results |
| `contact.seniority` values `CXO`, `President` | Return 0 results |

### Search Modes

| Mode | Behavior |
|------|----------|
| `SMART` | Fuzzy matching — broadest results, use as default |
| `WORD` | Word-level matching — moderate precision |
| `STRICT` | Exact string match — most restrictive |

### Filter Reference Files

| File | Entries | Path |
|------|---------|------|
| Industries | 148 | `/Users/USUARIO/Documents/LGJ/Clients/Justin Ashcraft/AI ARK Filters/industries.json` |
| Industry Tags | 797 | `/Users/USUARIO/Documents/LGJ/Clients/Justin Ashcraft/AI ARK Filters/industry tags.json` |
| Countries & States | 244 countries | `/Users/USUARIO/Documents/LGJ/Clients/Justin Ashcraft/AI ARK Filters/country&state.jsonl` |
| Technologies | 16,041 | `/Users/USUARIO/Documents/LGJ/Clients/Justin Ashcraft/AI ARK Filters/technologies.json` |
| Cities | 244,342 | `/Users/USUARIO/Documents/LGJ/Clients/Justin Ashcraft/AI ARK Filters/person-location-city.json` |

Always read `industries.json` to validate industry names before building queries.

## Step-by-step workflow

### 1. Read the audience targeting document

Read the file the user provides. Parse out:

- **Global filters** — geography, seniority, titles to include/exclude, company age, revenue, company type
- **Individual segments** — Segment A, B, C etc. with their specific industries, keywords, employee size, geographic priorities
- **Exclusions** — states to exclude, company types to exclude, titles to exclude

### 2. Check API credits

Before building queries, verify credits are available:
```bash
curl -s -X GET "https://api.ai-ark.com/api/developer-portal/v1/payments/credits" \
  -H "Content-Type: application/json" \
  -H "X-TOKEN: 2e00d0d1716342f284002634b0ce1f56"
```
Report the remaining credit balance to the user.

### 3. Map criteria to AI ARK filters

For each segment, map the targeting criteria to valid AI ARK filter values:

1. **Read `industries.json`** and match the document's industry descriptions to valid AI ARK industry names
2. **Map seniority** from document titles (Owner, Founder, CEO, President) to working seniority values (Owner, Founder, VP, Director, Manager, Head, Partner). Remember: CXO and President return 0.
3. **Map location** — validate country/state names against `country&state.jsonl` if needed
4. **Map company type** to valid enum values
5. **Build numeric ranges** for employee size, revenue, founded year
6. **Add keywords** only if the document specifies niche sub-industries that don't map to the 148 industry values. Use `DESCRIPTION` + `INDUSTRY` sources only.

### 4. Build the API query JSON

Construction rules:
- **Start broad.** Default combo: `industries` + `location` + `seniority` + `type`
- Only add `keyword`, `employeeSize`, `revenue`, `foundedYear` if the document explicitly specifies those criteria
- **Warn if 4+ filter categories are active** — this often returns very few or 0 results
- Use `page: 0, size: 25` for initial preview (saves credits)
- Omit filter blocks that have no values — don't include empty arrays

### 5. Present the query for user validation (FIRST OUTPUT)

This is the most important step. For each segment, show:

1. **Segment name** and description from the document
2. **Filter summary table:**

| Filter | Values |
|--------|--------|
| Industries | wellness and fitness services |
| Location Include | United States |
| Location Exclude | Nevada, Arizona |
| Seniority | Owner, Founder, VP, Director |
| Company Type | PRIVATELY_HELD, SELF_OWNED, PARTNERSHIP |
| Employee Size | 1-50 |
| Founded Year | before 2023 |

3. **Full JSON query** in a code block
4. **Narrowness warning** if the query uses many filters
5. Ask: **"Does this look correct? Should I run this query? Any filters you want to add, remove, or adjust?"**

**Do NOT make any API calls until the user approves.**

### 6. Execute the search

Once the user approves, execute with curl:
```bash
curl -s -X POST "https://api.ai-ark.com/api/developer-portal/v1/people" \
  -H "Content-Type: application/json" \
  -H "X-TOKEN: 2e00d0d1716342f284002634b0ce1f56" \
  -d '<query_json>'
```

If running multiple segments, add a 1-second delay between calls to respect rate limits.

### 7. Show results summary

Present:
- **Total results count** per segment (from `totalElements`)
- **Sample of first 10-15 leads** in a table: Name | Title | Location | LinkedIn URL
- **Per-segment breakdown** if multiple segments were queried

If total results is 0:
- Suggest removing the most restrictive filter (usually `keyword` or `employeeSize`)
- Offer to re-run with broader filters

If total results is low (under 500 for a segment expected to have thousands):
- Warn the user
- Suggest which specific filters to relax

### 8. Iterate and refine

The user can:
- Adjust filters ("remove the employee size filter", "add keyword 'CrossFit'", "exclude California")
- Re-run the query
- Move to the next segment
- Proceed to export

Rebuild the query with changes, show the updated query, and re-execute after confirmation.

### 9. Export with emails (optional)

When the user is satisfied and wants to pull the full list with verified emails:

1. Use `POST /v1/people/export` with the same filters (up to 10,000 results). Include a `webhook` URL if the user has one. This returns a `trackId` and `state: PENDING`.
2. Poll progress with `GET /v1/people/export/{trackId}/inquiries/statistics` every 30 seconds until `state` indicates completion.
3. Retrieve results with `GET /v1/people/export/{trackId}/inquiries` using pagination (`page` and `size` params).
4. Present final count and a sample of results with email addresses.

## Critical rules

- **Query first, API second.** The first output is always the built query JSON for user validation. Never call the API before showing the query.
- **Validate industry names.** Always read `industries.json` and confirm that industry names in the query are exact matches from the 148 valid values.
- **Start broad.** Default filter combo: `industries` + `location` + `seniority` + `type`. Add more filters only when the document explicitly requires them.
- **Use seniority, not title.** The `contact.title` include filter is broken (returns 525M regardless). Always use `contact.seniority` for finding decision makers.
- **CXO and President are broken.** These seniority values return 0 results. Map "CEO" and "President" from documents to `Owner`, `Founder`, `VP`, `Director`, or `Head` as appropriate.
- **Keywords use DESCRIPTION + INDUSTRY sources only.** Never use `source: "KEYWORD"` — it always returns 0.
- **Department, skills, currentCompany filters are broken.** They return 525M regardless of input. Never use them.
- **Handle segments independently.** Each segment in the targeting document becomes its own API query. Never merge segments.
- **Preview before full pull.** Initial queries use `size: 25`. Use `size: 100` or the export endpoint only after the user confirms results look good.
- **Warn about filter stacking.** Combining `keyword` + `employeeSize` + `type` + `industries` often returns 0. Warn the user if a query has 4+ active filter categories.
- **Respect rate limits.** Maximum 5 requests/second. Add 1-second delays between sequential API calls.

## Document format

Audience targeting documents typically follow this structure:

```
**GLOBAL FILTERS**
Geography: [countries, state exclusions]
Titles to Include: [Owner, Founder, CEO, etc.]
Titles to Exclude: [Personal Trainer, Assistant, etc.]
Company Age: [X+ years]
Revenue: [$X+ annually]

**SEGMENT A: [SEGMENT NAME]**
Priority: [HIGH/HIGHEST]
Sub-Industries: [list of sub-industries]
Company Size: [X to Y employees]
Revenue: [override if different from global]
Campaigns to Send: [which campaigns get this segment]

**SEGMENT B: [SEGMENT NAME]**
...
```

The format may vary. The key is to identify segments, their industries, and all filtering criteria regardless of how the document is structured.
