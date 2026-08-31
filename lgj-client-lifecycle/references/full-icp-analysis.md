# Full ICP Analysis — methodology (post strategy call)

Run **after the strategy call**, once the transcript exists. Upgrades the pre-call **1st Client Analysis** (intake + research) into a **build-ready ICP list-building spec** by merging what was actually discussed and agreed on the call with the intake form, then attaching a concrete **Apollo filter set per ICP** — and routing the ICPs Apollo *cannot* reach to the correct tool.

**Inputs:** `{Full Name} - Transcript - <date>.md` (agreed ICPs, thresholds, confidence) + `{Full Name} - Intake Form.md` (avatar, industries, titles, states, proof) + the `1st Client Analysis`.
**Output file:** `{Full Name} - ICP List-Building Spec.md` (repo). Commit + push.
**Golden rule:** every ICP, industry, threshold, and quote traces to the transcript or the client's own docs. Do not invent segments, numbers, or geographies. Where the call and intake conflict, surface it — never silently pick one.

---

## Step A — Build the ICP hierarchy from the transcript

1. **Common denominator** — the one buyer-state the offer serves (e.g. "seller of a highly appreciated asset facing a large tax hit"). Everything hangs off this.
2. **Sort every target into two buckets:**
   - **Signal-based** — something just happened / is about to (listed for sale, raised, exited, recent IPO). Low volume, high intent.
   - **Master / broad bucket** — fits the profile, will *eventually* need it; email at scale, catch the in-window fraction. High volume, low intent.
3. **Group by natural class** (asset type, industry, role) and capture per group: who they are, qualifying thresholds, timing, and the **confidence the team expressed on the call** (sure-they-can-source vs. "needle in a haystack"). Keep de-prioritized / out-of-scope segments explicit — they matter for list hygiene.

## Step B — Nurture the hierarchy with the intake form

Layer in what the written intake adds that the call didn't:
- **Customer Avatar** → demographic/psychographic leans, net-worth band, target states, motivations, pains.
- **Industries to target** → concrete verticals, named micro-markets, new segments (e.g. broker/referral channels) not raised on the call.
- **Job titles** → the seniority/title list to filter on.
- **USP / Case studies / Social proof** → thresholds (deal size, days-from-close, gain exposure) and copy proof points.
- **Disclosure/compliance** → sending-domain and copy constraints.

**Reconcile call vs. intake.** When they disagree (different deal-size floors; brokers-as-channel vs. direct-to-seller; an avatar that excludes a segment the call prioritized), list each conflict in a "reconciliations to resolve" section for the human to decide **before scraping.**

## Step C — Route each ICP to the right source (before writing filters)

Apollo is a **B2B people/company database**. Decide per ICP whether it's even the right tool:

| If the target is… | Source | Apollo? |
|---|---|---|
| Employees at named/known companies (title, tenure, seniority) | **Apollo** (+ LinkedIn) | ✅ |
| Business owners in specific industries at scale | **Apollo** | ✅ |
| Brokers / advisors / channel partners | **Apollo** | ✅ |
| **Home / property owners** (residential or commercial) | **PropStream** / county / niche | ❌ |
| **In-contract / pending sellers** (live transaction signal) | Marketplaces + **Crunchbase** selling signals | ⚠️ supplement |
| **Crypto / social-signal holders** | **Social-bio scrape** (X / LinkedIn) | ❌ |

## Step D — What Apollo CANNOT filter on (never build these into a list)

Apollo has **no field** for **gender, age, personal net worth, home/property value, or "about to sell."** If the avatar leans on any of these ("primarily women 45–70, $3–30M net worth"), they are **copy/personalization levers and post-scrape enrichment — not list filters.** Building them in shrinks lists to zero or forces bad guesses. State this explicitly.

## Step E — Write the Apollo filter set per ICP

For each Apollo-reachable ICP, a paste-ready block using **real Apollo fields**:
- **Person:** Titles · Seniority (Owner/Founder/Partner/C-Suite/VP/Director…) · Person Location · **Years in Current Company** (tenure proxy for equity) · Email status = Verified
- **Company:** # Employees (small = single decision-maker) · Industry · Keywords (per vertical) · Company Location (HQ) · **Revenue** (proxy for deal size) · Founded Year (proxy for a long-tenured owner) · specific **Company-name lists** where the target is "employees of X"

Guidance:
- Approximate **deal size** only via **company revenue**; approximate **owner-nearing-exit** via **founded year / tenure** — flag both as proxies, not truth.
- Keep **headcount small** whenever the offer needs a single clean decision-maker.
- Run multi-vertical buckets as **separate saved searches per industry**, not one giant OR.
- For "employees sitting on equity," lead with **tenure + company list**, not seniority (early rank-and-file often hold the biggest gains).

## Step F — Assemble `{Full Name} - ICP List-Building Spec.md`

0. **Shared qualifiers** table (thresholds, states, avatar leans) with an *Apollo-filterable?* column.
1. **Data-source routing** table (ICP → tool → Apollo yes/no).
2. **Apollo ICPs** — one section each: who, why, paste-ready filter block.
3. **Non-Apollo ICPs** — one each: who, routed source, that source's key filters.
4. **Copy / enrichment levers** from the intake (pains, desires, proof, compliance) — labeled *not filters*.
5. **Open reconciliations** — the call-vs-intake conflicts to resolve before scraping.

Then commit/push and deliver a short chat summary: which ICPs are Apollo-buildable vs. routed elsewhere, and the open reconciliations.

---

## Lessons learned (first run — Mitchell Bloom, 2026-07-14)
- Call produced 3 agreed paths (stockholders, trophy-home owners, business sellers); intake added 2 broker/channel segments + expanded fast-selling industries and target states — the intake nearly doubled the ICP surface vs. the call alone.
- Trophy-home / commercial / mobile-home-park owners are **PropStream, not Apollo** — most commercial is veiled behind LLCs/trusts. Crypto is a **social-bio scrape**. Don't hand these Apollo filters.
- The intake avatar ("primarily women 45–70, $3–30M net worth") is **not Apollo-filterable** — kept as a copy lean. It also didn't cover the call's highest-confidence targets (SpaceX/NVIDIA stockholders) → logged as an open reconciliation.
- Deal-size floor conflicted: intake USP "$1M gain / ≤90 days" vs. call "$2M deal" → flagged, not silently merged.
