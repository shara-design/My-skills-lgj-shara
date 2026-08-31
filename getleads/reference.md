# GetLeads MCP Reference

Server: `https://app.getleads.io/api/mcp` (streamable HTTP, MCP protocol 2025-06-18)
Auth: `Authorization: Bearer glb_live_...` from `GETLEADS_API_KEY`
serverInfo: `getleads` v1.0.0. 45 tools.

Most tools accept `context` and `conversation_id` (analytics only, ignored by the tool).
Some declare `context` as required but tolerate an empty argument object.

---

## 1. Account and health

| Tool | Params | Notes |
|---|---|---|
| `getleads_health` | none | No API key needed. Origin reachability. |
| `getleads_contacts_health` | none | Contact DB ping, approximate row count. |
| `get_fair_use` | none | 0 credits. Remaining daily/monthly unlimited-plan budget. |
| `get_wallet_balance` | none | Prepaid wallet cash in cents, saved card, auto top-up config. |

`get_fair_use` returns `daily` and `monthly` objects with `cap`, `used`, `remaining`,
`resets_at`, plus `binding` naming which cap is the limiter. Resets are UTC calendar
boundaries, not rolling 24h: daily at the next 00:00 UTC, monthly at 00:00 UTC on the 1st.
Paid/free plans return `applies: false` and `credits_remaining` instead.

---

## 2. Contact search and export

### `count_contacts` — free, exact, always call first
0 credits. Returns `total_matching` (uncapped exact) and `exportable_rows` (capped at
`max_export_rows`, default 50k). Accepts every `search_contacts` filter including keyword
fields.

### `search_contacts`
Default and max 100 rows per MCP call. Paginate with `offset`. Adds `columns`, `limit`,
`offset` on top of the shared filter set. Returns an `export_offer` when `has_more`.

### `export_contacts`
Requires `confirmed: true`. Async. Returns `export_id` immediately. Adds `columns`,
`max_per_company`, `max_rows`. Omit `max_rows` to export everything up to plan/credit/50k.
No `offset`.

### `check_contact_export`
Params: `export_id`. Poll until `job_status: completed`, then return `export_url`
(presigned CSV). If `rows_exported < rows_available`, `cap_reason` is one of
`per_company | max_rows | hard_ceiling | fair_use | credits | filtered` and `cap_message`
is human-readable. Relay `cap_message` verbatim. Never attribute a cap to credits on an
unlimited plan.

### Shared filter set (search / count / export)

**Person:** `first_name`, `last_name`, `email_address`, `linkedin_url`, `job_titles`,
`exclude_job_titles`, `seniority`, `job_functions`, `personas`, `require_email`,
`require_phone`, `email_status`

**Company:** `domains`, `exclude_domains`, `company_name`, `email_domain`, `industries`,
`exclude_industries`, `entity_types`, `revenue`, `revenue_min/max`, `company_size`,
`company_size_min/max`, `employees_min/max`, `employee_profiles_on_linkedin_min/max`,
`founded_year_min/max`, `total_funding_min/max`, `followers_min/max`, `domain_list_id`

**Geo:** `countries`, `exclude_countries`, `headquarters_countries`,
`exclude_headquarters_countries`, `office_countries`, `office_states`, `office_cities`,
`regions`, `continents`, `cities`, `states`, `job_location_country`, `job_location_state`,
`job_location_city`

**Keyword (substring, comma-separate to OR):** `company_description` (company LinkedIn
About), `person_description` (person bio), `linkedin_headline`, `company_headline`,
`specialties`, `job_description`, `skills`, `education`, `certifications`, `languages`

**Classification:** `naics_codes` (prefix match, `["5415"]` catches all 5415xx),
`naics_descriptions`, `sic_codes`, `sic_descriptions`, `uk_industry_codes`,
`uk_industry_descriptions`, `crunchbase_categories` (substring, free text)

**Technographic:** `technologies`, `has_mobile_app`, `has_web_app`,
`monthly_traffic_min/max`, `monthly_google_adspend_min/max`

**Hiring and growth signals:** `employee_growth_rate_min/max` (percent, 5 = 5%),
`valid_email_count_min/max`, and min/max pairs for role counts
(`engineer_`, `sales_`, `marketing_`, `operations_`, `android_`, `ios_` + `role_count_`)
and open roles (`marketing_`, `sales_`, `operations_`, `account_executive_`,
`customer_success_`, `demand_generation_`, `business_development_`, `it_`, `security_`,
`grc_`, `devops_`, `network_infrastructure_` + `open_roles_`)

**Escape hatch:** `where_sql`, a WHERE predicate over searchable catalog fields, AND-combined
with the curated filters. Prefer named filters. Use `get_available_columns` to find valid
column names first.

### Headcount semantics
`company_size` takes exact LinkedIn band labels (`"51 to 200"`). `company_size_min/max` and
`employees_min/max` select every band that *overlaps* the bound, so they over-select at the
edges. For a hard numeric cutoff use `employee_profiles_on_linkedin_min/max`.

### `get_available_values`
Required: `field`. Supported: `seniority`, `job_functions`, `company_size`, `revenue`,
`regions`, `continents`, `countries`, `headquarters_countries`, `office_countries`,
`job_location_country`, `industries`, `personas`, `entity_types`, `email_status`.
Aliases: `company_size_min/max` and `employees_min/max` map to `company_size`,
`exclude_countries` to `countries`, `exclude_headquarters_countries` to
`headquarters_countries`.

### `get_available_columns`
Params: `group`, `searchable_only`, `exportable_only`. 0 credits. Returns per field:
`canonical_name`, `clickhouse_column`, `label`, `description`, `type`, `filter_mode`,
`searchable`, `exportable`, `filter_params`, `values_lookup`, `populated_count`,
`fill_share`. Check `fill_share` before filtering on a sparse field.

---

## 3. Decision makers

| Tool | Params | Credits |
|---|---|---|
| `lookup_decision_makers` | `domain` or `company_name`, `limit` (max 100), `offset`, `require_email` | 1/record, 0 if none |
| `create_decision_makers_batch_link` | `per_domain_limit`, `require_email` | returns upload link |
| `check_decision_makers_batch` | `upload_id` or `run_id` | poll every few seconds |
| `get_decision_makers_batch_result` | `run_id` | presigned CSV, 1h validity |

Matches C-Team, VP, Director seniority, and titles containing "Head".

**Rule of thumb:** roughly 25 domains or fewer, loop `lookup_decision_makers`, results are
immediate. More than that, use the batch link. The batch CSV carries a `source_domain`
column so rows map back to input domains.

`getleads_lookup_colleagues_by_domain` is the adjacent tool: params `email_domain`,
`limit_per_item` (default 100, max 5000), `offset`. Returns anyone at the domain rather
than only decision makers. 1 credit per record returned.

---

## 4. Enrichment

All batch tools charge 1 credit per row where `success` is true.

| Tool | Input | Output |
|---|---|---|
| `getleads_get_emails_from_linkedin_batch` | `items`: public LinkedIn profile URLs, `limit_per_item` | work email + provider data |
| `getleads_get_linkedin_urls_from_emails_batch` | `items`: work emails | LinkedIn URL + provider data |
| `getleads_enrich_person_batch` | `items`: first_name, last_name, company_name and/or email_domain | email, LinkedIn URL, provider data |
| `getleads_lookup_contact_by_phone` | `phone` | contact, 1 credit if found |
| `getleads_lookup_contacts_by_phone_batch` | `items`, `limit_per_item` | 1 credit per success |

### Async CSV enrichment (magic link)
For a file rather than an inline list. Modes: `linkedin`, `work_email`, `person`, `phone`.

1. `create_csv_enrichment_upload_link` with `mode`, optional `mapping`, `max_rows`
2. Give the user `upload_url`. They open it in a browser and upload a CSV or paste a
   public Google Sheet URL.
3. Poll `check_enrichment_upload` with `upload_id` until it returns `run_id`
4. Poll `check_enrichment_status` with `run_id`
5. `get_enrichment_result` with `run_id` for a presigned download, valid 1 hour

---

## 5. Signals

| Tool | Params |
|---|---|
| `list_funding_signals` | `limit`, `since`, `min_confidence`, `region` |
| `list_acquisition_signals` | `limit`, `since`, `min_confidence`, `acquirer`, `target`, `has_amount`, `min_amount` |

US and EU news. Facts and a source link only, no article text. 1 credit per record
returned, 0 if none. Funding gives company, amount, round. Acquisitions give acquirer,
target, optional deal amount.

---

## 6. Paid scrapes (prepaid wallet cash)

`estimate_scrape_cost` first. Required `scraper`, one of `profile_monitor`, `post_scrape`,
`company_followers`, plus the matching identifier params.

Pricing: profile monitoring $0.012/engager, company followers $0.0035/follower with a
2,500 lead / $8.75 minimum.

Wallet: `get_wallet_balance`, `create_topup_link` (required `amount_cents`, minimum $10,
link valid 24h), `configure_auto_topup` (required `enabled`, plus `amount_cents`,
`threshold_cents`, `monthly_cap_cents`; needs a saved card to enable).

### LinkedIn profile monitoring (post engagers)
`add_monitored_profile` (`linkedin_profile_url`, `billing_choice`, `engagers_last_month`)
debits wallet cash and captures likers and commenters. Then `list_monitored_profiles`,
`set_monitored_profile_active` (`profile_id`, `active`), `remove_monitored_profile`
(captured leads are kept), `list_profile_monitoring_leads` (`limit`), and
`get_profile_monitoring_handoff_prompt` which builds a follow-on enrichment prompt.

### Company followers
1. `lookup_company_linkedin_followers` with `linkedin_company_url`, optional
   `company_sizes`, `seniorities`, `countries` filters
2. Confirm delivery email, company URL, and follower count with the user
3. `prepare_company_followers_checkout` (`linkedin_company_url`, `delivery_email`,
   `requested_count`) returns an app link where the user pays

Companies under 2,500 followers are billed the $8.75 minimum for all available followers.

### Website visitor identification
Ordered setup, requires wallet auto top-up enabled:

1. `start_website_visitor_tracking` with `domain`, returns the install script. Does not go
   live yet.
2. Give the user `install_snippet` for their `<head>`. Do not verify or test the script.
3. `configure_website_pixel` with `domain`, `webhook_url`, `privacy_confirmed`
4. `complete_website_pixel_setup` with `domain`. Requires `privacy_confirmed` and auto
   top-up on, else returns `top_up_link`. Marks the pixel live, hourly identification
   starts. Setup ends here, do not test the script afterward.

Then: `list_website_pixels` (counts by total/live/pending/paused),
`set_website_pixel_status` (`domain`, `status`, live vs paused; pending pixels cannot be
resumed until setup completes), `delete_website_pixel` (past leads kept),
`list_website_visitor_leads` (`domain`, `search`, `limit` max 200 default 50, `view`),
`export_website_visitor_leads` (`domain`, `format` json or csv, `limit` max 1000).

---

## 7. Raw HTTP (no MCP client registered)

Streamable HTTP with JSON-RPC. Initialize, capture `mcp-session-id` from the response
headers, then send it on every subsequent call.

```bash
curl -sS -X POST https://app.getleads.io/api/mcp \
  -H "Authorization: Bearer $GETLEADS_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"count_contacts","arguments":{"industries":["Accounting"]}}}'
```

Methods: `initialize`, `tools/list`, `tools/call`. Results arrive as
`result.content[0].text` holding a JSON string, so parse twice.
