---
name: propstream-list-builder
description: Build, filter, save, and skip trace property lists in PropStream (app.propstream.com) by driving the user's own logged-in Chrome. Trigger when the user wants to build a PropStream list, run a filter spec across many cities, enter cities and filters into PropStream, create a saved search, cap a list to a record count, add properties to a marketing list, skip trace a PropStream list, or asks about PropStream filters/quotas/export limits. Also trigger on "Bloom" campaign list specs, "C1/C2/C3" search specs, or any request to run a property-search filter spec against one or more cities.
---

# PropStream List Builder

You build property lists in PropStream by driving the user's own logged-in Chrome session.

There are two modes. **Pick one before you start.**

- **Spec mode** — a new or unverified filter spec. Apply filters, report the funnel, stop for approval. Use when the filters have never been run.
- **Bulk city loop** — a *verified* filter spec run across many cities. Set filters once, then loop cities with no per-city approval, no funnel, and no screenshots. Use when the user says "run these cities" and the filter set is already agreed.

Most long jobs are bulk loops. Do not run a bulk loop in spec mode, it is 10x the tokens and the user will run out mid-list.

## Approach: use the user's own Chrome, never Browserbase

Drive the existing logged-in session via the `claude-in-chrome` skill and `mcp__claude-in-chrome__*` tools.

**Do not use Browserbase or any cloud browser.** It would need to log in fresh from a datacenter IP with no cookies, which is far more likely to trip PropStream's account-sharing and fraud detection than reusing the session the user is already in. Driving their real Chrome at human pace produces the same traffic pattern as them clicking by hand. Verified across multiple full runs: zero CAPTCHAs, challenges, or rate-limit warnings.

If the user asks for Browserbase, explain this tradeoff before proceeding.

## Setup

1. Invoke the `claude-in-chrome` skill.
2. Load tools in ONE ToolSearch call:
   `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__browser_batch,mcp__claude-in-chrome__find,mcp__claude-in-chrome__get_page_text`
3. Navigate to `https://app.propstream.com/search`. An "Updates" modal usually appears, close it.

Use `browser_batch` for multi-step sequences. It is much faster than individual calls and far cheaper in tokens.

---

# BULK CITY LOOP

The high-volume path. Read this whole section before the first city.

## Token discipline — the thing that kills these runs

A 200-city loop dies from token burn long before it dies from anything PropStream does. Every rule below exists because it was violated in a prior run.

- **One `browser_batch` per city.** The entire per-city sequence is a single call.
- **No screenshots inside the loop.** Not to check the count, not to confirm the save. Screenshots are the single largest cost and none of them change what you do next.
- **Never read property cards.** Prices, addresses, equity, last-sale dates are all irrelevant to the loop. The filters already decided what qualifies.
- **Never call `get_page_text` inside the loop.** It returns the entire filter tree every time.
- **Do not report per-city counts unless asked.** Do not narrate. One line per batch of 20 cities is enough.
- **Do not re-verify filters per city.** Verify once at setup, then spot-check every 25 cities.

If the user says they burned tokens or credits on a prior run, these rules are why. Say so once and follow them.

## Restart the session every ~40 cities

The single largest cost in a long loop is not the work, it is the accumulated context. Every `claude-in-chrome` tool result stays in context for the rest of the session, so by city 100 the agent re-reads 99 cities' worth of browser output on every turn. Cost per city climbs steadily while the work per city stays identical.

Measured on a real run: **92% of usage was at >150k context, and 86% of usage came from the `claude-in-chrome` MCP server.**

**All run state lives in the run-log file, not in the conversation.** Nothing is lost by restarting. So:

- Tell the user up front to run `/clear` and re-paste the launch prompt every ~40 cities.
- If you notice you are deep into a long loop, say so and recommend it rather than pushing on.
- Prefer `/clear` over `/compact`. Compact keeps baggage that has no value here, because the file already holds everything that matters.
- After a restart, read the run log, find the first unmarked city, and continue. Never restart from the top.

This is why the loop writes progress to the file after every city rather than at the end. It makes the session disposable.

## Phase 1 — set filters once

Apply the full filter spec (see **Applying filters** below), then verify with a **single** `get_page_text` call and report the applied set as a short table. Then start the loop. This is the only verification of the whole run.

**Never reload the page or navigate after this point.** A reload clears every filter and silently invalidates every city after it. If the tab dies, filters must be rebuilt from scratch and the user told which city it happened on.

For side quests (checking quotas, looking at Marketing Lists) **open a new tab**. Never navigate the working tab.

## Phase 2 — the per-city loop

One `browser_batch` per city, containing:

1. Click the **X** in the search bar to clear the current location
2. Click the search bar, type the city
3. Wait for autocomplete, click the **exact** match
4. Wait for results to load
5. Tick the **select-all** checkbox beside "N PROPERTIES"
6. **Actions** → **Save**
7. In the Add to Marketing List dialog, pick the **existing** list from the dropdown
8. Confirm **Skip Trace is unchecked**
9. **Save**

Verification is the **toast text only** (`N properties saved to '<name>'`). That one string confirms the search ran, the selection took, and the save landed. Nothing else needs checking.

If a batch fails, retry that city once. If it fails twice, log it and move to the next city. Never stall the loop on one city.

## Phase 3 — progress

Keep a running list of completed cities and append to it as you go, never at the end. If the user has a run-log file, write there. Otherwise keep a scratchpad file.

Report every 20 cities: cities done, cities remaining, current list total. That is the entire status update.

## Existing list vs new list

The Add to Marketing List dialog defaults to **"(Create as New List)"**. In a bulk loop the user almost always wants **one existing list** for every city, so PropStream dedupes across cities and the same owner is not paid for twice at skip trace.

**Select the existing list by name from the dropdown.** Creating 200 lists is a real failure mode: it defeats dedupe and makes skip trace bill for duplicates.

Confirm the list name with the user once before the first city, then never again.

## Stop conditions

Stop and report immediately if:
- Five consecutive cities return 0
- The toast stops appearing
- Any login or session-expiry screen shows
- A city returns a suspiciously round number (1,000 / 10,000) — that is a result cap, not a count

---

# APPLYING FILTERS

## Location

Click the search bar (`Enter County, City, Zip Code(s) or APN #`), type the city, wait for autocomplete, click the exact match.

**City autocomplete requires state disambiguation.** Typing "Austin" offers TX, MN, AR, IN, PA. Typing "San Francisco" offers both "San Francisco, CA" (city) and "San Francisco County, CA" (county) — different searches. Always collect the state, and pick city vs county deliberately.

**Counties are usually the better unit for big jobs.** A county covers every town inside it, including unincorporated land. Mobile-home parks in particular sit outside city limits and will barely appear in a city search. **PropStream does not support state-level search** — county is the largest available unit.

One search holds ONE location. Multiple cities means one pass per city.

## Filter order

Open **Filters** and apply in this order:

1. **Lead Lists** (High Equity, Vacant, etc.) — one-click presets with live counts
2. **Property Details** — Classification first, which reveals nested property-type chips. Click **Show All** to expose the full type list.
3. **Owner Information & Occupancy**
4. **Value & Equity**
5. **MLS**

In spec mode, record the count after each filter for the funnel. In bulk mode, don't.

## Critical UI quirks

**The filter panel's left rail is jump-navigation, NOT tabs.** The right pane is one continuous scrolling document containing every category. Clicking a category highlights it but does **not** scroll the pane. To reach any filter, use `find` with a natural-language query, then `computer` with `scroll_to` + `left_click` on the returned `ref`. This is the single most reliable technique in this workflow.

**Property Classification is SINGLE-SELECT.** All / Residential / Commercial / Vacant Land / Other is a tab row, not checkboxes. Picking Commercial *replaces* Residential. Property types spanning two classifications require two separate passes.

**Multi-Family lives under `Residential`.** Apartment buildings, duplexes and mobile-home parks are all filed there. This does not make the search "residential" in the segment sense. Go by property type, not tab name.

**Office lives under `Other`**, in a section titled *Office Property Types*, not under Commercial.

**`get_page_text` returns every category's filters at once**, including off-screen content. Use it to verify the whole filter tree in one call instead of screenshotting section by section. Once per run.

**Numeric range fields are preset dropdowns that also accept free text.** Typing a value and pressing Enter does **not** commit. Type the value, then **click elsewhere to blur the field**. Verify via the applied-filters panel.

**Estimated Value's preset list caps at 5,000,000.** For anything higher, type it as free text and blur. Confirm it reads e.g. `2000000 to 25000000`.

**Estimated Value is empty on Commercial and Office records.** Applying a value floor to those classifications returns 0 across the board — the field does not exist, it is not a market fact. Verified: San Francisco has 205 qualifying commercial properties that a value filter cannot see. Substitutes: `MLS Listing Amount` works but only covers on-market records. **Do not substitute Assessed Total Value** — under California's Prop 13 it tracks 1990s purchase price on long-held property, so a floor would exclude exactly the highest-gain targets.

**The right pane auto-scrolls unpredictably**, which can land a click on the wrong control. In spec mode, read back applied filters before saving. A stray Absentee Owner Location filter has appeared this way.

**Applying a record range CLEARS the property selection.** After "Show Property Range" you MUST re-tick select-all. Confirm the header reads "N SELECTED".

**Include/Exclude renders as "No" in the applied-filters panel.** Pre-Probate: Exclude shows as "Pre-Probate (Deceased Owners) — No". Correct, not a bug.

**Filter chips do not shift layout when toggled**, so consecutive chip clicks can be safely batched.

**Page reloads clear all filters.** See Phase 1.

## The MLS trap

Only ~1.3% of properties in a city are listed at any moment. An MLS On-Market filter cuts any filtered set by ~99%. Verified: 509 qualified owners → 6 properties.

**For an outbound list of owners to contact, leave the MLS block fully neutral:** On/Off Market = `All`, Listing Type = `Any`, MLS Status = nothing selected. That returns both market states in one search, and folds Pending in automatically.

Two related traps, both avoided by staying neutral:
- **Off Market + any MLS Status = 0 records**, always. A property cannot be off market and actively listed.
- **Listing Type silently resets to "Any" or "For Rent"** whenever the On/Off Market toggle is flipped. Every flip needs a re-check.

If a client specifically asks for just-listed or pending, the honest answer is usually that the neutral search already contains them, and they can be segmented after export rather than filtered upfront at a 99% cost.

---

# SAVING

## Saved search (optional — skip in bulk loops)

**Save** button → dialog with Name, Details, Include on Home Screen, email frequency.

- The **Details** field renders concatenated onto the Name in the Saved Searches list. Keep it short or blank.
- **Include on Home Screen** defaults OFF, so the search appears only in the Saved Searches dropdown, not as a dashboard tile. Say so, or the user will think the save failed.
- Default email alerts to **Never** unless asked.

A bulk loop does not need saved searches. The marketing list is the artifact. Creating 200 saved searches is noise.

## Marketing list

**Actions** → **Save** → "Add to Marketing List" dialog → pick the list → **Save**. A toast confirms `N properties saved to '<name>'`.

**Leave "Skip Trace Selected Properties" UNCHECKED.** It sits one click from Save and triggers a paid per-record service.

## Skip trace (paid, gated)

My Properties → Marketing Lists → tick the list → **Skip Trace**. The dialog shows Name Your List, a Re-Skip Trace checkbox, and Order Details: Selected Contacts, Eligible Contacts, Price Per Match ($0.10), Subtotal, Free Skip Trace Credits, Total.

**Never click "Place Order" without the user's explicit confirmation in chat**, even when free credits bring the total to $0.00. It authorizes their card on file and consumes a finite monthly credit pool.

**Default "Re-Skip Trace" to OFF.** On thousands of records it re-bills for data already owned.

---

# QUOTAS

Check at **Account** (gear icon in the left rail; the `/account` URL may render blank, click the icon instead). Quotas reset monthly.

Four separate pools, each typically 50,000/month:
- **Skip Traces** — consumed by skip trace orders
- **Exports** — consumed by CSV exports
- **Saves** — consumed by saving properties to marketing lists
- **Monitored Properties** — Lead Automator

**The Saves pool is the one that bites on bulk loops.** Every property added to a marketing list consumes one Save. A 30,000-record target burns 30,000 of a 50,000 monthly allowance before a single contact is skip traced. **Check the Saves balance before starting any run over ~10,000 records**, and tell the user the number. Running out mid-list is silent and looks like the loop broke.

Because skip trace credits are plentiful, a few-hundred-record list usually costs **$0**, not `count × $0.10`. Check the balance before quoting a price.

---

# SAFETY RULES

1. **Never change a filter after the initial setup without explicit approval in chat.** Once the filter set is agreed and verified, it is frozen for the rest of the run. This covers loosening a filter to fix a thin city, adding a property type, adjusting a value floor, and **diagnostic funnels** — a funnel test is a filter change and needs its own approval, even though it saves nothing. "Run these cities" is not approval to touch the panel. Ask, wait, then change.
2. **After any approved filter change, restore and prove it.** Before running the next city, state the four left-nav badge numbers (Lead Lists / Property Details / Owner Information / MLS) and the Estimated Value min and max in the chat message. Do not proceed to a city until that readback is on screen. A diagnostic left un-restored silently corrupts every city after it, and nothing in the UI flags it.
3. **Never click "Place Order"** without explicit chat confirmation. Not covered by "run the whole process."
4. **Never check Skip Trace or Re-Skip Trace** unless asked.
5. **In spec mode, stop and report the funnel** before saving, so bad specs are caught before they become saved artifacts. In bulk mode this gate has already been passed.
6. **Don't disturb existing saved searches or marketing lists.** Read them, don't modify.
7. **Never navigate or reload the working tab** once filters are set. New tab for side quests.
8. **Never loosen a filter to hit a number** without asking. Volume problems are geography problems, not filter problems.

---

# NAMING

Follow the user's template exactly when given, e.g. `V1 - {City} {ST} - Apartments`. Prefix throwaways with `TEST - ` so they're obviously deletable.

---

# WORKED EXAMPLE — Bloom Campaign 1, leg A

Verified 2026-07-31. This is a bulk-loop spec: filters below are already agreed, so run them once and loop cities without per-city approval.

**Marketing list (existing, select from dropdown):** `V1-Apartment Rental Commercial Sellers`

```
Property Classification:  Residential

Multi-Family Property Types (8):
  Multi-Family 5+
  Apartment house (5+ units)
  Apartment house (100+ units)
  Apartments (generic)
  High-rise Apartments
  Garden Apt, Court Apt (5+ units)
  Multi-Family Dwellings (Generic, 2+)
  Residential Income (General) (Multi-Family)

Owner Occupied:           Any
Vacant:                   No
Years of Ownership:       Min 15    Max blank
Owner Type:               Individual   (only)
Absentee Owner Location:  nothing selected

Estimated Value:          Min 2000000    Max 25000000
All other Value & Equity fields: blank

Lead List:                High Equity
Pre-Probate:              Exclude
Intra-Family Transfer:    Exclude
Include Unknown Sales:    Any
Tax Exemption Status:     nothing selected

On or Off Market:         All
Listing Type:             Any
MLS Status:               nothing selected
MLS Status Date / Days on Market / MLS Listing Amount: blank

Everything else blank: Last Sale Price, Year Built, Estimated Equity %,
MLS Keywords, PropStream Intelligence, Pre-Foreclosure, Lien/Bankruptcy/Divorce
```

**Verification shortcut:** when correctly set, the left-nav badges read **Lead Lists 1**, **Property Details 2**, **Owner Information & Occupancy 5**, and **MLS carries no badge**. Four numbers confirm the whole build without a screenshot.

**Reference counts on this spec:** San Francisco 366, San Jose 75, Brooklyn 1,248.

**Related legs**, same filters, property types swapped:
- **Leg B, Rentals + MHP:** Multi-Family 2-4, Duplex, Triplex (3 units, any combination), Quadruplex (4 units, any combination), Mobile Home or Trailer Park
- **Leg C, Commercial:** Commercial classification, retail and mixed-use. Estimated Value must be left blank on this leg, see the commercial data note above.

## Funnel reference (spec mode only)

San Francisco, earlier variant of this spec at 10-year ownership:

| Step | Count |
|---|---|
| San Francisco, all | 217,150 |
| + High Equity | 161,717 |
| + Residential | 146,508 |
| + 5 multi-family types | 10,824 |
| + Owner Type Individual | 2,992 |
| + 10yr ownership | 1,102 |
| + Vacant / Pre-Probate / Intra-Family | 1,062 |
| + $2M-$25M | 509 |
| + MLS On Market | **6** |

Diagnosis: MLS On Market cut 99%. Leaving the MLS block neutral yields the usable outbound list.
