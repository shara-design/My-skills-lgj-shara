---
name: lgj-client-lifecycle
description: Master skill for the full Lead Gen Jay cold-email client lifecycle — one project per client, from onboarding through contract close. Each stage is a numbered section below; run the stage that matches the request. Trigger on "we have a new client", "onboard [name]", "new client [name]", or any client-lifecycle stage ("strategy", "full ICP analysis", "ICP list-building spec", "Apollo filters", "copy", "deploy", "close") for an LGJ cold email client. Stage 1 (Onboarding) is the entry point for a brand-new client; Stage 2 (Post-Strategy-Call Deliverables) runs after the strategy call to produce the promises checklist (Meetings folder) and the build-ready ICP + Apollo filter spec.
---

# LGJ Client Lifecycle

One consolidated playbook for running a Lead Gen Jay cold-email client from first contact to contract close. **One project per client.** Stages are added here as we build them; run the stage that matches what the user is asking for.

## Global rules (apply to every stage)
- **Never fabricate.** Use only verified info from the client's own docs/intake and real research. If something can't be found or pulled, STOP that step and tell the user plainly — do not invent placeholder content.
- **Naming convention:** every doc is `{Full Name} - {Doc Type}.md` → e.g. `Mitchell Bloom - Intake Form.md`, `Mitchell Bloom - 1st Client Analysis.md`, `Mitchell Bloom - ICP List-Building Spec.md`, `Meetings/Mitchell Bloom - Promises Checklist.md`.
- **Commit + push after each artifact.** Small, descriptive commits.
- **Paths & org:**
  - Local clients folder: `/Users/shararamirez/Desktop/LGJ Clients`
  - GitHub org: `LGJ-Jonathan`
  - Skills repo: `/Users/shararamirez/.claude/skills/` (one folder per skill; NOT under git).

## Lifecycle map
1. **Onboarding** — clone repo, save intake, write 1st analysis (pre-call). ✅ built (below)
2. **Post-Strategy-Call Deliverables** — promises checklist (Meetings folder) + build-ready ICP/Apollo spec. ✅ built (below)
3. **Copywriting** — write the per-vertical cold-email sequences from all repo sources; on approval, publish a client-facing Google Doc to the client's Drive folder. ✅ built (below)
4. _Campaign deploy_ — TBD
5. _Reporting / close_ — TBD

---

# Stage 1 — Onboarding

The very first thing done when a new client comes in. Input needed: the client's **full name** (e.g. "Mitchell Bloom"). Everything else is derived. Produces two docs — the **intake form** (saved from Drive) and a **1st Client Analysis** (offer + ICP from research).

## Step 1 — Clone the client repo
1. Find the repo in the org. **Repo names use hyphens, not underscores**, and casing varies — search case-insensitively:
   ```
   gh repo list LGJ-Jonathan --limit 200 | grep -i "<firstname>"
   ```
   (Intake style may look like `First_Last`, but the actual repo is usually `First-Last`.)
2. Clone into the clients folder:
   ```
   cd "/Users/shararamirez/Desktop/LGJ Clients" && gh repo clone LGJ-Jonathan/<Repo-Name>
   ```
   A fresh repo often contains just a `README.md` — that's expected.
3. If no matching repo exists, the client may be brand new (intake done, repo not yet made). **Ask the user before creating it** — don't assume. On approval:
   ```
   gh repo create LGJ-Jonathan/{First_Last} --private --description "LGJ cold email buildout - {Full Name} ({Company})"
   gh repo clone LGJ-Jonathan/{First_Last}
   ```
   **Org naming convention is `First_Last` with underscores** (~125 of 128 repos; `Mitchell-Bloom` is the outlier). Use underscores for new repos.

## Step 2 — Pull the intake form from Drive
1. Find the client email from the Gmail thread titled `{Client Name} x LGJ Cold Email Buildout`:
   ```
   Gmail search_threads: subject:"{Client Name} x LGJ Cold Email Buildout"
   ```
   The client's email is in the recipients (a non-leadgenjay.com address).
2. Find the intake doc in Drive:
   ```
   Drive search_files: title contains 'Custom Buildout Intake' and title contains '{FirstName}'
   ```
   Exact title format: `Custom Buildout Intake x {Client Name}`.
3. **If not found:** STOP and say exactly: `intake form not found in drive folder`.
4. **If found:** read full content (`read_file_content`) and write it verbatim as markdown to the repo as `{Full Name} - Intake Form.md`. Preserve all sections. Leave unfilled template tokens (e.g. `{{mailboxname}}`, `{{additional}}`, `{{AI}}`) as-is and flag them later.
5. `git add . && git commit -m "Add {name} intake form" && git push`.

## Step 3 — Research + 1st Client Analysis
1. Research the client beyond the intake:
   - Website (from intake). **Note:** many client sites 403 on `WebFetch` — if so, use `WebSearch` for the company + founder instead.
   - LinkedIn + general web search for the founder's background, origin story, credentials, social proof.
2. Write `{Full Name} - 1st Client Analysis.md` in the repo with:
   - **The offer in simple words** — plain-English explanation of what they sell and the core hook. Include founder story / timing constraints / compliance notes if relevant.
   - **ICP breakdown** — split into: Industries, Job titles, Location, Employee size (or the real qualifier if size-agnostic, e.g. deal value / net worth). Note distinct audiences if there's more than one (e.g. end-buyers vs. referral partners).
   - **Assets & proof** to reuse in copy (case studies, press, testimonials).
   - **Key things to flag** — timing constraints, compliance/legal framing, undecided positioning, pending items (lead magnet, mailbox name), data-availability challenges.
   - **Open items / next steps.**
   - A one-line sources note confirming nothing was fabricated.
3. `git add . && git commit -m "Add {name} 1st client analysis" && git push`.

## Finish (Stage 1)
Report to the user: repo cloned, intake saved (or "not found"), analysis written, and list the flagged open items to chase (lead magnet, mailbox name, strategy call date, positioning decisions).

## Lessons learned (first run — Mitchell Bloom, 2026-07-09)
- Repo was `LGJ-Jonathan/Mitchell-Bloom` (hyphen) even though intake style was `Mitchell_Bloom`.
- Website `taxfreeplan.com` returned 403 to WebFetch → LinkedIn + WebSearch filled the gaps (founder origin story, background).
- Intake had blank template tokens (`{{mailboxname}}`, `{{additional}}`, `{{AI}}`) → flagged as open items.
- Offer had TWO audiences (end sellers + broker referral partners) — worth calling out separately in the ICP.

## Lessons learned (Imran Tariq, 2026-07-29)
- **The repo did not exist yet** — intake was done but no repo in the org. Created `LGJ-Jonathan/Imran_Tariq` after asking. Expect this for genuinely new clients; don't dead-end on it.
- **Intake vs. website can describe two different offers.** Intake said "$2,000/month per AI employee"; the live site sold nine named systems at custom pricing behind a $500K+ revenue gate. Always fetch the website and diff it against the intake — the conflict is the most important thing to put on the strategy-call agenda.
- **Industry lists can conflict too.** Intake listed 4 industries, the site supported only 2 of them and added a 5th. Tabulate the disagreement rather than merging the lists.
- **Vet borrowed proof twice:** (a) a "#1 WSJ bestseller" claim that public sources tied to a co-authored book and a *different* author's #2 placement, and (b) impressive numbers that belonged to the founder's *other* company (Webmetrix), not the entity being marketed. Founder background ≠ product proof.
- **Check the buildout thread for unanswered client questions.** He had asked about domain count and email volume 0 days prior and was waiting on us — fastest available trust win, and easy to miss if you only read the intake.
- Worth checking the calendar for the strategy call during Stage 1; if it isn't booked, that's a blocking open item.

---

# Stage 2 — Post-Strategy-Call Deliverables

Runs **after the strategy call**, once the transcript is saved in the repo. Produces two artifacts: **2A** a promises checklist (in the Meetings folder) so nothing committed-to gets dropped, and **2B** the build-ready ICP list-building spec.

**Prerequisites:** the strategy-call transcript (`{Full Name} - Transcript - <date>.md`) and the intake form are both in the repo. If the transcript isn't there yet, STOP — this is a post-call stage (pre-call, you only have Stage 1's 1st Client Analysis).

## 2A — Promises checklist (Meetings folder)
Read and follow **`references/promises-checklist.md`**. Read every meeting doc in `{repo}/Meetings/` — at minimum the **deposit/sales call** and the **strategy call** (they carry different promises) — extract everything LGJ committed to deliver, provide, include, or do at no cost, plus the client's own homework, and write `{Full Name} - Promises Checklist.md` **into the `Meetings/` folder** as GitHub checkboxes grouped by category, each item tracing to a meeting quote. Flag any promises that conflict between the two meetings. Commit + push.

## 2B — Full ICP Analysis
Upgrades the pre-call 1st Client Analysis into a **build-ready ICP list-building spec**: the ICP hierarchy (from the transcript) nurtured with the intake, routed to the right data source per ICP, with a concrete **Apollo filter set** for every Apollo-reachable segment. This is the doc the list-builders scrape from.

1. **Follow the methodology** — read and follow **`references/full-icp-analysis.md`** end to end (two-bucket hierarchy from the transcript, nurtured with intake, per-ICP source routing across Apollo/PropStream/Crunchbase-marketplaces/social-bio scrape, what Apollo can and cannot filter, paste-ready Apollo filter blocks).
2. **Write the spec** — produce `{Full Name} - ICP List-Building Spec.md` in the repo root with the six sections from the reference (shared qualifiers → data-source routing → Apollo ICPs → non-Apollo ICPs → copy/enrichment levers → open reconciliations). Every ICP and threshold traces to the transcript or intake.
3. **Commit + report** — `git add . && git commit -m "Add {name} ICP list-building spec" && git push`. Deliver a short chat summary: which ICPs are Apollo-buildable vs. routed elsewhere, and the open reconciliations to resolve before scraping.

---

# Stage 3 — Copywriting

Write the client's cold-email sequences. **Trigger:** any copywriting request for the client ("copywriting", "copy writing strats", "write the sequences", "give me the first sequences", "start copy for [name]").

## Step 0 — ALWAYS analyze all sources first (mandatory, no exceptions)
Before writing a single line of copy, read and analyze **everything** that grounds the copy. Never write from memory or from a single doc:
1. **The strategy-call transcript(s)** in `Meetings/` — the source of truth for strategy decisions, ICPs, banned items, angles, tone.
2. **The intake form** (`{Full Name} - Intake Form.md`) — offer, avatar, proof, assets.
3. **Every source doc in the `Copy/` folder** — this is the copy working directory. It typically holds:
   - the 2nd analysis / strategy doc (the campaign blueprint with ICPs, pain points, objections, source ledger),
   - a compliance standard (e.g. CAN-SPAM / disclaimer rules) — copy MUST obey it,
   - client-supplied playbooks/brochures + any "Playbook Insights for Copy" analysis (usable angles, flagged/banned proof),
   - any already-written verticals (match their house format exactly; do not duplicate or contradict them),
   - notes files with operator decisions.
4. Cross-check the compliance/CAN-SPAM doc and the transcript's banned list, and honor every one. If a required input is missing (e.g. no transcript, no compliance doc), STOP and tell the user what's missing rather than guessing.

Only after this analysis do you write copy. Every claim, number, proof point, and angle must trace to one of these sources (Global rules: never fabricate).

## Step 1 — Write per-vertical sequences
- One file per ICP/vertical in `Copy/`, named `Vertical N. {Descriptor}.md`. Split a vertical into signal vs. no-signal variants when the data source provides a selling signal (e.g. PropStream listed homes).
- Follow the house pattern already in the `Copy/` folder (header block with campaign type/sequencer/merge field/cadence/angle/banned/open-items, then subject lines, then E1 3 variants / E2 2 / E3 2 = the **3/2/2 gate**).
- **Sequences are 3 emails, not 4.** Cadence: E1 (day 0) → E2 (day 3, reply on the E1 thread) → E3 (day 7). Never write a fourth "breakup" email. If an older strategy doc specifies a 4-email structure with an E4 at day 12, drop the E4 and flag it rather than silently including it. (Operator decision, 2026-07.)
- Use the sequencer chosen on the call (Instantly `{{firstName}}` + `{{RANDOM | a | b | c}}`, or Bison format). Apply the `cold-email-copywriting` skill's copy constraints: under 100 words, plain text, no links in E1, **zero em/en dashes or double hyphens**, no spam-trigger words, first-name-only personalization, conversational opt-out, compliance footer on every email.
- E3/E4 are usually a shared library across verticals; adapt the asset noun per ICP.

## Step 2 — Present for review, then commit
Show the new sequences in chat for the user to review. Once approved, `git add . && git commit -m "Add {name} {vertical} sequences" && git push`. Do not commit before the user has reviewed unless they say so.

## Step 3 — On approval, publish the client-facing Google Doc to the client's Drive folder
**Only after the user approves a sequence in Step 2.** This is the version the client actually sees and signs off on (their ad-review), so it must read like a clean, professional deliverable — not an internal working doc. One Google Doc per approved vertical (or a combined doc if the user asks).

1. **Locate the client's Drive folder.** Find where the client's buildout docs already live: `search_drive_files` for the intake or transcript (e.g. `Custom Buildout Intake x {Client Name}`) and use its **parent folder**, or find a folder named `{Client Name}`. If the folder can't be confidently identified, **STOP and ask the user which Drive folder to use** — never drop it in root or a guessed location. (Use `list_connected_google_accounts` first if the account is ambiguous.)
2. **Create the doc** with `create_google_doc` **inside that folder**, titled `{Client Name} - Cold Email Sequences - {Vertical}`.
3. **Include only client-facing content.** Per campaign, present:
   - one plain-English intro line (who it targets + cadence, e.g. "Four emails sent over about two weeks"),
   - the subject line options,
   - each step E1–E4 with variants labeled **Version A / B / C**, showing subject + full body.
   **Strip everything internal:** angle nicknames ("poke-the-bear", "CPA-hero"), the banned-items list, source ledger, ICP/data-source routing, "open items", and operator notes. The client sees polished copy, not the strategy scaffolding. Spintax may stay inline (they need the exact language for ad-review) but present it cleanly.
4. **Formatting (client-facing house style):**
   - **No emojis. No decorative special characters. No em dashes or en dashes** anywhere — use commas, periods, or rewrite. Keep punctuation simple.
   - **Very organized:** clear document title, a heading per campaign and per email step, generous spacing between sections.
   - Use **real Google Docs formatting** via the doc tools (heading styles, bold, font size) — never literal markdown characters (`#`, `**`). Play with **bolding and letter size** to build hierarchy: large title, bold section headings, bold email/version labels, normal-weight body. `format_google_doc_professional` / `format_google_doc_section` and `add_heading_to_google_doc` handle this.
   - Keep the compliance footer (address + unsubscribe + disclaimer line) with each email, per the compliance standard.
5. **Do not auto-share or send the doc to the client.** Creating it in their folder is the deliverable; sharing/sending is the operator's separate decision.
6. **Report the Google Doc link** to the user.

## Lessons learned (Mitchell Bloom, 2026-07-17)
- The `Copy/` folder is the real brief — the "2nd Analysis by Jay" doc carried the full campaign blueprint (ICPs, pains, objections, source ledger) and a separate "Playbook Insights for Copy" surfaced the strongest compliant angle (liquidity/diversification) that wasn't in the transcript. Missing either would have weakened the copy.
- A client-supplied "playbook" was actually a re-skinned third-party (ECGS) doc — its case study was NOT the client's to cite. Always vet supplied proof against ownership before putting it in copy.
- Compliance lives in its own doc (CAN-SPAM standard) and dictates the footer + "defer not avoid" + non-promissory rules verbatim.

---

# Stage 4+ — (to be built)

As we run more of the lifecycle, add each new stage as a `# Stage N — <name>` section here, following the same format: purpose, numbered steps, finish/report, lessons learned. Keep everything in this one skill.
