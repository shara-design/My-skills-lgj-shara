---
name: bizbuysell-broker-list-builder
description: Use when building a business-broker or M&A-advisor list from BizBuySell, scraping the BizBuySell broker directory, or hitting HTTP 403 / anti-bot blocks on bizbuysell.com. Also use when asked for broker counts by state, broker phone/website data, or a broker list for a capital-gains, exit-planning, or business-sale campaign.
---

# BizBuySell Broker List Builder

You build business-broker lists from BizBuySell's public broker directory by driving a real Chrome over CDP, **signed out**, reading an embedded JSON blob instead of parsing HTML.

## The one thing that makes this work

**Every directory page embeds the full broker records as JSON.** Do not parse the DOM.

```js
const j = JSON.parse(document.getElementById('BBS-state').textContent);
const k = Object.keys(j).find(x => x.includes('brokerSearch'));
const brokers = j[k].value.brokerSearchResult.value;   // 30 full objects
```

This is the whole technique. It carries `telephone`, `companyUrl`, `city`, `zip` and listing counts that the rendered page hides behind buttons and profile clicks — so a 10-state build is **~81 page loads instead of ~2,000**. Fewer requests is the anti-block strategy; there is no stealth trick beyond not making the request.

## Approach: real Chrome, never signed in

Use the `browser-harness` skill (CDP into local Chrome). **Never sign in.**

This is the *opposite* of the PropStream rule, and the reason is different: PropStream is a paid account where reusing the logged-in session looks human. BizBuySell is **CoStar** — litigious about data scraping — and signing in converts anonymous traffic into an attributable ToS breach with a bannable account attached. Signing in also unlocks nothing: emails are never exposed because mediating broker contact is their revenue model.

- **Probe / bulk sweep:** local Chrome, signed out
- **Anything over ~300 loads:** Browser Use Cloud (`browser-harness auth login` → `start_remote_daemon`) for proxies + stealth off the user's IP
- A plain `curl`/WebFetch returns **HTTP 403**. That is server-side fetch only. Real Chrome loads it fine.

## Two modes — pick one before starting

- **Probe mode** — new site, unverified selectors, or an unmeasured funnel. 3-5 pages, report field fill rates, stop for approval.
- **Bulk sweep** — verified extraction, run all states. No per-page narration, no screenshots.

Never run a bulk sweep in probe mode.

## URL structure

| Level | Pattern |
|---|---|
| State (main seed) | `/business-brokers/{state-slug}/` |
| Paged | `/business-brokers/{state-slug}/{page}/` — **30 per page** |
| County | `/business-brokers/{state}/{county}-county/` |
| Profile | `/business-broker/{person}/{firm}/{brokerId}/` |

Page count = `ceil(total / 30)`. Get `total` from the page's own `"Showing 1-30 of N brokers"` string.

## Fields in the JSON blob

| Field | Notes |
|---|---|
| `firstName` / `lastName` | often carries certifications: `"Fialkovich, CBI, CM&AA"` |
| `companyName` | |
| `telephone` | **~99% fill** — present even behind "Show Phone Number" |
| `companyUrl` | **~60% fill** — the domain enrichment needs |
| `city` / `zip` | **~74% fill** — **there is NO top-level `state` field** |
| `forSaleListingsCount` | live deal flow — the primary quality filter |
| `soldListingsCount` | track record |
| `messageResponseScore` | responsiveness |
| `url` | profile path; `brokerId` is the trailing number |

**Derive state from `zip`.** `areasServed[].region` is where they are *licensed*, not where they sit.

## Gotchas that will silently corrupt the list

1. **No `state` field.** Using `b.state` returns empty for every record and your geo filter silently passes nothing. Map `zip` → state.
2. **"Serving this area" ≠ headquartered.** State pages return brokers who *serve* the market. ~32% are HQ'd elsewhere. Verified: a Phoenix AZ broker on the California page; a zip-53066 (WI) broker on the Minnesota page.
3. **Result order is not stable** between loads. Paging 1→N can repeat and reorder. **Always dedupe on `brokerId`**, then reconcile unique count against the site's own "of N".
4. **Three card tiers** if you ever fall back to DOM parsing: `app-bfs-elite-`, `app-bfs-premium-`, `app-bfs-basic-brokercard-search-result`. Elite-only returns **1 of 18** on a thin state. Reading `BBS-state` avoids this entirely.
5. **Profile pages have no `BBS-state`.** They render differently. City/state there lives in JSON-LD: `script[type="application/ld+json"]` → `address.addressLocality` / `addressRegion`.
6. **Cross-state duplicates are expected.** Per-state "shortfalls" against the site count should sum to exactly `(sum of state totals) − (unique captured)`. If they do, capture was complete. If not, re-sweep the short states.

## Expansion dead ends — measured, do not re-test

Once a state sweep reconciles against the site's own "of N", **the directory is exhausted for that state.** All of these were tested and yielded nothing:

| Route | Result |
|---|---|
| **County pages** (`/business-brokers/california/los-angeles-county/`) | Pure subsets. LA County (392) and San Diego County (225) returned **0 brokers** not already captured by the state sweep. |
| **Pagination past the stated end** (CA page 32, page 40 when N=926) | Returns **0 records**. No hidden overflow. |
| **Listing detail pages** (`/Business-Opportunity/...`) | 18 sampled: 39% carry a broker profile link, 56% have none at all, and **0 were new**. Yield: **0.00 new brokers per page load.** |

The only real lever left is **geography**. If the client wants more, it is a targeting decision about which states qualify, not a scraping problem.

### Competing platforms — tested 2026-08-05

| Platform | Verdict |
|---|---|
| **BizQuest** (`/{state}-business-brokers/`) | ❌ **Same CoStar broker database.** CA shows 38 brokers vs BizBuySell's 926, and 20/25 sampled names matched BizBuySell exactly (the 5 "misses" were cert-suffix mangling). Effectively 100% overlap. |
| **BusinessesForSale.com** (`/servicesdirectory/`) | ❌ Not a directory. It is a **referral lead form** ("SellerMart will match you"). Nothing to enumerate. Cookie wall on top. |
| **BusinessBroker.net** (`/brokers/{state}.aspx`) | ⚠️ **HTTP 403 even in real Chrome** — a harder block than BizBuySell, which only 403s server-side fetches. Independent of CoStar, so the roster is likely genuinely different. Worth a retry through Browser Use Cloud with residential proxies. |
| **BusinessMart** | ⚠️ Cloudflare interstitial ("Just a moment..."). Untested beyond that. |
| **IBBA** | ✅ Best untested option. ~2,800 certified brokers, independent of CoStar, and **publishes emails**. |
| Sunbelt / Transworld / First Choice office locators | ⚠️ Franchise networks whose agents already appear in BizBuySell in volume (33 Transworld Colorado brokers were in one sweep). Expect heavy overlap. |

## Anti-block rules

1. Never sign in.
2. **Single tab, sequential.** `new_tab()` once, then `goto_url()`. Never one tab per page.
3. **Randomized 4-8s delays.** Fixed intervals are the clearest bot signal.
4. Checkpoint the CSV every 10 pages; resume by skipping known `brokerId`s.
5. Do not call `/api/bff/v2/brokerSearch` directly. Reading what the page already returned is defensible; crafting calls to an internal API is not.

**Abort the run immediately if any fire:**
- body text matches `/access denied|unusual traffic|captcha|are you a human/i`
- two consecutive pages return 0 records
- `#BBS-state` missing, or body text < 1500 chars
- URL redirected away from the request

On abort: stop, keep the partial CSV, report. **Never retry in a tight loop** — that converts a soft throttle into a hard ban.

## Phases

1. **Sweep** — `scripts/sweep_directory.py`. All states, all pages, JSON extraction, dedupe, checkpoint.
2. **Filter (no network)** — dedupe `brokerId` → HQ state from zip → `forSaleListingsCount >= 1` → cap **3 per firm** (large franchises list a dozen agents at one office).
3. **Enrich emails** — BizBuySell has **none**. Chain via `blitz-api`: `domain-to-linkedin` → `employee-finder` (paginate, not just page 1) → name-match → `enrich-email`. **Measured 36% end-to-end**; every successful name-match converted to an email.
4. **Verify** — MillionVerifier. Blitz emails are not pre-verified.
5. **Export** — hand off to the same Instantly upload shape used by `propstream-export-to-instantly`.

## Name parsing for enrichment matching

Naive matching is what kills the Blitz hit rate (17% → 36% just from fixing this).

- Strip everything after the first comma: `"Fialkovich, CBI, CM&AA"` → `Fialkovich`
- Strip cert tokens: CBI, CBB, CEPA, CABB, IBBA, MBA, M&AMI, LCBB, LCBI, FIBBA, CCIM, CVA
- Surname = **last remaining token**; forename = first token
- Handle `"Jeff & Linda Nyman"` (two people, one field)
- ~3% of records are **company profiles, not people** (`"Hedgestone Business Advisors"`). Detect and route those to any decision-maker at the firm instead of name-matching.

## Inclusive by default

Do not drop records for missing fields unless asked. Emit every record with flag columns — `in_target_state` (Y/N/?), `has_deal_flow`, `completeness` (0-5) — and let the user filter. A dropped broker with a phone number is still a usable contact.

## Reality check before quoting numbers

- Median asking price on a state listings page runs **~$350K**; only **~11%** clear $2M. A "$2M+ deals only" tier is far thinner than the broker count suggests.
- Listing **counts** are in the directory blob; listing **prices** are not. Price tiers need a second pass over survivors only.
- Broker attribution on listings-search pages is **~3%** — you cannot join listings to brokers from there. Go the other direction, off each broker's "For Sale" tab.

## Worked example — Bloom, Aug 2026

10 high-tax markets (CA NY NJ CO MA MN WI DC HI VT), 81 pages, ~14 min, zero blocks.

| Stage | Count |
|---|---:|
| Raw state-page sum | 2,335 |
| Unique after dedupe | 2,170 |
| HQ inside the 10 markets | 1,409 (64.9%) |
| + live listings → qualified | 1,164 (53.6%) |
| after 3-per-firm cap | **1,053** |
| with phone | 1,053 (100%) |
| with domain | 546 (52%) |

National context (for "can we get more"): FL 995, TX 673, NC 282, GA 256, PA 255, IL 231, OH 214, WA 197, VA 193, AZ 185, MI 154, MD 138, CT 129, NV 98. **The constraint is the geography map, not the scrape.** The two largest pools (FL, TX) are no-income-tax states, excluded by the offer's own logic.

## Common mistakes

| Mistake | Consequence |
|---|---|
| Parsing the DOM instead of `BBS-state` | Lose Premium/Basic tiers; lose phone, domain, zip, listing counts |
| Using `b.state` | Geo filter silently matches nothing |
| Treating the state page as "brokers in that state" | ~32% are HQ'd elsewhere |
| Not deduping on `brokerId` | Inflated counts from unstable ordering |
| Loading profile pages for phone/website | 2,000 needless requests; it was in the blob |
| Signing in | Attributable ToS breach, bannable account, unlocks nothing |
| Quoting the raw state sum as "contacts" | It is pre-dedupe, pre-geo, pre-enrichment |
