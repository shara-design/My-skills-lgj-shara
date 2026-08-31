---
name: final-pre-launch
description: Use when auditing a cold email client's campaigns before launch on EITHER Bison OR Instantly. Checks mailbox health, mailbox count, warmup, sending volume, sequence-to-ICP alignment, spintax formatting, body readability (line spacing), spam-trigger words, subject/threading, wait day cadence, and open tracking. Trigger on "audit campaigns", "pre-launch check", "ready to launch", "check bison", "check instantly", or "campaign QA".
---

# Pre-Launch Campaign Audit (Bison + Instantly)

## Overview

Systematic QA checklist for cold email campaigns before going live. Works for **both Bison and Instantly** — each platform has its own data pulls and its own threading/settings mechanics, but the copy/sequence checks (ICP match, spintax, body spacing, cadence) are shared.

The audit validates: mailbox health, mailbox count, warmup, sending volume, sequence-to-ICP alignment, spintax integrity, body readability, spam-trigger words, subject/threading, and campaign settings in one pass.

## When to Use

- Before launching any Bison **or** Instantly campaign
- When a client asks "am I good to launch?"
- After creating or editing campaign sequences
- When onboarding a new client's campaigns into either platform

## Step 0: Identify the Platform (do this first)

Before pulling anything, determine which platform the client is on — **Bison, Instantly, or both.**

- If the user says which platform, use that.
- Otherwise check both client lists in parallel and see where the client exists:

```
mcp__claude_ai_bridgekit__get_active_bison_clients
mcp__claude_ai_bridgekit__get_active_instantly_clients
```

- If the client is on **Bison**, run **Section A (Bison)**.
- If the client is on **Instantly**, run **Section B (Instantly)**.
- If the client runs campaigns on **both**, run both sections and produce one report per platform.
- Both sections then feed the **Shared Sequence Checks** and the **Report Structure** below.

LGJ standards are the same on both platforms unless the client differs: **50 connected + warming mailboxes**, **30 emails/day per mailbox** (per-mailbox daily limit), and **1,000 emails/day per campaign**.

---

# Section A — Bison Audit

## A1: Pull Data (parallel)

```
mcp__claude_ai_bridgekit__list_bison_campaigns
  client_name: "{client name}"
  status: "all"

mcp__claude_ai_bridgekit__get_bison_mailbox_health
  client_name: "{client name}"
```

**Also pull every mailbox's `email_signature`.** `get_bison_mailbox_health` does not return the signature field, so fetch the full sender-email list and read `email_signature` on each. If the client is not connected to bridgekit, hit the Bison API directly with the workspace key:

```
GET https://send.leadgenjay.com/api/sender-emails?page={1..N}
  Authorization: Bearer {BISON_API_KEY}
```

Read `email_signature` on every mailbox and count how many are null/empty — this feeds the mandatory email-signature check below.

**Also pull warmup status for every mailbox.** `get_bison_mailbox_health` reports connection status but does NOT report whether warmup is enabled. Hit the warmup endpoint directly (7-day window) and read `warmup_enabled` on each mailbox:

```
GET https://send.leadgenjay.com/api/warmup/sender-emails?start_date={today-7}&end_date={today}&page={1..N}
  Authorization: Bearer {BISON_API_KEY}
```

Count how many mailboxes have `warmup_enabled = false`. (For a deeper deliverability read — warmup scores, spam-placement proxy, Safe/Throttle/Hold — run the separate `bison-mailbox-health` skill; this pre-launch check only confirms every mailbox is connected AND warming.)

## A2: Pull Campaign Details (parallel)

For every campaign returned in A1:

```
mcp__claude_ai_bridgekit__get_bison_campaign_details
  client_name: "{client name}"
  campaign_id: {each campaign id}
```

## A3: Bison-Specific Checks

**Mailbox count (LAUNCH BLOCKER):** exactly **50 connected mailboxes**, all status `Connected`, attached to every campaign that will launch. Flag if fewer, and list how many are missing.

**Connected AND warming (LAUNCH BLOCKER):** every mailbox must be both `Connected` AND `warmup_enabled = true`. Report both counts (e.g. "50/50 connected, 46/50 warming"). Flag any that are disconnected OR have warmup off, by email address.

**Email signature (LAUNCH BLOCKER):** every mailbox must have a non-empty `email_signature`. Bison sequences end with the `{SENDER_EMAIL_SIGNATURE}` variable — if the mailbox has no signature, the email sends with no sign-off. Flag any null/blank, report count (e.g. "0/50 have a signature set").

**Thread reply (LAUNCH BLOCKER — Bison mechanic):** on Bison, in-thread follow-ups are controlled by the **"Thread reply" checkbox**.
- New-thread openers (Step 1, or any step that starts a fresh thread): `thread_reply` should be `false`.
- Every follow-up step (replies within an existing thread): `thread_reply` should be `true` — checkbox marked.
- With Thread reply checked, the follow-up auto-inherits the exact subject/variant that was actually sent, so spintax in a follow-up subject is fine and will NOT cause a thread mismatch (Bison tooltip: *"subject is required, but if using variants, the subject will be taken automatically from the variant sent."*).
- Any follow-up with Thread reply unchecked goes out as a brand-new email with a re-spun subject — breaking the thread. Treat as a blocker; name the campaign and step number.

**Per-mailbox daily limit (LAUNCH BLOCKER):** every mailbox's `daily_limit` must be set to **30**. Pull the per-sender daily limit for every mailbox and flag any not equal to 30 (Bison default is 10, which throttles the campaign). If bridgekit does not expose the field, hit the API directly:

```
GET https://send.leadgenjay.com/api/sender-emails?page={1..N}
  Authorization: Bearer {BISON_API_KEY}
```

Read `daily_limit` on every mailbox and report the count set to 30 (e.g. "50/50 at 30/day"). To fix any that are off, PATCH them in bulk to 30:

```
PATCH https://send.leadgenjay.com/api/sender-emails/daily-limits/bulk
  Authorization: Bearer {BISON_API_KEY}
  Body: {"sender_email_ids": [...], "daily_limit": 30}
```

Note: daily-limit changes are workspace-global — they affect every campaign the senders are attached to.

**Sending volume (Mandatory):** every campaign's `max_emails_per_day` must equal **1,000**. Also verify `max_new_leads_per_day` aligns with 1,000/day so the campaign fills its capacity. Flag any above or below 1,000.

---

# Section B — Instantly Audit

## B1: Pull Data (parallel)

```
mcp__claude_ai_bridgekit__list_instantly_campaigns
  client_name: "{client name}"

mcp__claude_ai_bridgekit__get_instantly_mailbox_health
  client_name: "{client name}"
```

`get_instantly_mailbox_health` returns account status, warmup status, and per-account daily limits. Read warmup status on every account — Instantly warmup is a per-account toggle, so count how many accounts have warmup disabled. Also read the **per-account daily limit** on every account — this feeds the mandatory 30/day check below.

## B2: Pull Campaign Details (parallel)

For every campaign returned in B1:

```
mcp__claude_ai_bridgekit__get_instantly_campaign_details
  client_name: "{client name}"
  campaign_id: {each campaign id}
```

## B3: Instantly-Specific Checks

**Account count (LAUNCH BLOCKER):** exactly **50 connected sending accounts**, all connected and attached to every campaign that will launch. Flag if fewer, and list how many are missing.

**Connected AND warming (LAUNCH BLOCKER):** every account must be connected AND have warmup enabled. Report both counts (e.g. "50/50 connected, 48/50 warming"). Flag any disconnected OR with warmup off, by email address.

**Threading via BLANK subject (LAUNCH BLOCKER — Instantly mechanic):** Instantly does NOT use a "Thread reply" checkbox. Instead:
- A follow-up step threads into the previous email **only when its subject line is left BLANK/empty**.
- A follow-up with a filled-in subject starts a **new thread** — breaking the "real reply" illusion.
- So the check is the OPPOSITE of Bison: **Step 1 (opener) has a subject; every follow-up step's subject must be empty.**
- Flag any follow-up step that has a non-empty subject line. Name the campaign and step number. Flag any opener (Step 1) with a blank subject too.

**Signature:** confirm a sign-off exists — either a signature configured on each sending account or explicit sign-off text in the body. If the sequence relies on an account-level signature, verify it is actually set. Flag bodies that end abruptly after the CTA with no sign-off.

**Per-account daily limit (LAUNCH BLOCKER):** every sending account's daily limit must be set to **30**. Report the count set to 30 (e.g. "50/50 at 30/day") and flag any account not equal to 30. Fix by setting the daily send limit to 30 on each account in the workspace.

**Sending volume (Mandatory):** target **1,000 emails/day per campaign**. Check the campaign daily send limit and the per-account daily limit × account count so the campaign can actually reach 1,000/day. Flag any campaign configured above or below 1,000.

**Open / link tracking:** Instantly has both "Open tracking" and "Link tracking" toggles. Both should be **off** for cold-email deliverability. Flag any campaign with either enabled.

---

# Shared Sequence Checks (both platforms)

Run these on every step of every campaign, regardless of platform.

**Sequence-to-ICP match:**
- Read the email body content across all steps.
- Identify ICP-specific language (e.g., "talks" for speakers, "coaches" for coaching, "consultants" for consulting).
- Confirm the language matches the audience implied by the campaign name.
- Flag cross-contamination (e.g., a coaching campaign referencing "consultants").

**Spintax formatting:**
- Every `{` has a matching `}`
- Every spintax block has at least one `|` pipe separator
- No nested spintax `{outer {inner|b}|c}`
- No empty options `{option A|}` or `{|option B}`
- Flag duplicate options where both sides of the pipe are identical `{same text|same text}`

**Email body formatting / readability (line spacing):**
- Every email body must be **broken up with line spacing** — it must NOT be one big wall of text.
- Read the raw body of every step and check for blank lines (paragraph breaks) between blocks of text. There should be spacing between lines/sentences so the email is skimmable, not a dense paragraph.
- Flag any step whose body is a single large block of text with no line breaks (or only a single run-on paragraph). Name the campaign and step number.
- Rough guide: if a body has 3+ sentences with no blank line separating them into short paragraphs, flag it as a wall of text that needs spacing added between lines.
- This is a readability check, not a hard launch blocker, but always report it so the copy gets spaced out before launch.

**Spam-trigger words (deliverability):**
- Scan every step's **subject and body** for words/phrases that commonly trip spam filters in a cold-email context. Report each hit with campaign name, step number, field (subject/body), and the offending term.
- This is a deliverability check, not a hard launch blocker, but always report hits so the copy can be softened before launch.
- Watch for these categories (not exhaustive — flag anything that reads salesy/scammy):
  - **Money / urgency:** free, guarantee(d), risk-free, no cost, no obligation, act now, urgent, limited time, expires, don't miss, once in a lifetime, cash, $$$, cheap, discount, save big, best price, order now, buy now.
  - **Hype / claims:** 100%, amazing, incredible, revolutionary, miracle, unbelievable, exclusive deal, congratulations, winner, you've been selected, click here, click below, apply now, sign up free.
  - **Marketing / spam-flag phrasing:** this is not spam, no spam, opt in, unsubscribe (in the opener), dear friend, dear sir, to whom it may concern, increase sales, extra income, make money, work from home, double your, get paid.
  - **All-caps words and excessive punctuation** (e.g. `FREE`, `ACT NOW!!!`, multiple `!` or `$`).
- Note: a single mild term (e.g. one "free check") is usually fine — flag it so it's a conscious choice, but call out clusters or high-risk terms (guarantee, act now, $$$, click here) as the ones that actually matter. If a dedicated `spam-word-checker` skill exists, prefer running that for the authoritative list; this is the fast inline pass.

**Wait day cadence:**
- Report the cadence for each campaign (e.g., 3 > 5 > 5 > 7).
- Flag inconsistencies across campaigns (all should typically match).

**Plain text:**
- Report whether plain text is on or off. Plain text generally performs better for cold email deliverability.

---

## Report Structure

Present findings in this structure. If the client runs both platforms, produce one report per platform and label each clearly.

### 1. Mailbox / Account Health

| Check | What to report |
|-------|---------------|
| Total mailboxes/accounts | **Must be 50/50 connected** — flag if fewer or any not Connected |
| Warmup enabled | **All must be warming** — report X/50 warming, flag any off |
| At-risk accounts | List by email address if any |
| Account type | Google Workspace, Outlook, etc. |
| Daily limit per mailbox | **Must be 30/mailbox** — report X/50 at 30/day, flag any not set to 30 |
| Total daily sending capacity | mailboxes × daily limit |
| Unique domains | Count distinct domains |
| Emails sent | Should be 0 for pre-launch |
| Signature set | **Bison:** every mailbox must have `email_signature`. **Instantly:** confirm account signature or in-body sign-off exists |

### 2. Campaign Overview

Table format. Always identify each campaign by its full **name**, never by its ID/code. Campaign IDs are used only for the underlying tool/API calls, never shown in the report.

| Campaign | Leads | Steps | Status | Daily Send Cap | Mailboxes Attached |
|----------|-------|-------|--------|----------------|---------------------|

### 3. Sequence-to-ICP Match

One bullet per campaign with keywords found and match verdict.

### 4. Sequence Consistency

Report spintax, body spacing, subject/threading, spam-trigger words, and wait cadence per campaign (using the platform-specific threading mechanic — Thread reply checkbox for Bison, blank follow-up subjects for Instantly). For spam triggers, list each hit as campaign / step / field / term, or "none found".

### 5. Sending Volume (Mandatory)

Per campaign: `daily send cap = X` → ✅ correct (1,000) or ❌ flag (current value vs expected 1,000).

### 6. Summary Table

| Check | Status |
|-------|--------|
| Mailboxes/accounts connected (must be 50/50) | X/50 connected |
| Mailboxes/accounts warming (warmup on all) (BLOCKER) | X/50 warming |
| Signature / sign-off present (BLOCKER on Bison) | X/50 have signature |
| Per-mailbox daily limit (must be 30) (BLOCKER) | X/50 at 30/day |
| Daily send cap (must be 1,000) | All at 1,000 / Flag issues |
| ICP match | All correct / Flag issues |
| Spintax formatting | Clean / Flag issues |
| Body formatting (spacing between lines, not a wall of text) | Spaced / Flag issues |
| Spam-trigger words (subject + body) | Clean / Flag terms |
| Threading — Bison: Thread reply checked / Instantly: follow-up subjects blank (BLOCKER) | All correct / Flag issues |
| Wait day cadence | Consistent / Flag issues |
| Open tracking (and link tracking on Instantly) | Off on all / Flag issues |

### 7. Final Verdict

Either:
- **"No issues found. Good to launch."**
- **List specific issues** with campaign name, step number, and what needs fixing.

## Common Issues

| Issue | Where to look | Fix |
|-------|--------------|-----|
| Fewer than 50 mailboxes/accounts | Mailbox/account list | Add the missing mailboxes and connect them |
| Warmup disabled (BLOCKER) | Bison: `warmup_enabled` (`GET /api/warmup/sender-emails`). Instantly: account warmup status | Re-enable warmup so it's actively warming before sending |
| Missing signature/sign-off (BLOCKER on Bison) | Bison: `email_signature` per sender-email. Instantly: account signature / body sign-off | Set a signature so the email has a real sign-off |
| Mailboxes not attached to campaign | Campaign sending accounts | Attach all 50 to every campaign |
| Per-mailbox daily limit not 30 (BLOCKER) | Bison: `daily_limit` per sender-email (`PATCH /sender-emails/daily-limits/bulk`). Instantly: per-account daily send limit | Set every mailbox to 30/day |
| Daily send cap not 1,000 | Campaign daily limit (`max_emails_per_day` on Bison) | Set to 1,000 |
| Follow-up not threading (BLOCKER) | Bison: "Thread reply" checkbox unchecked. Instantly: follow-up has a non-empty subject | Bison: check Thread reply. Instantly: clear the follow-up subject so it replies in-thread |
| Wall of text (no line spacing) | Email body is one dense block with no blank lines | Break the body into short paragraphs with spacing between lines |
| Broken spintax | Unclosed braces in body | Fix matching braces |
| Cross-ICP language | Wrong audience keywords in body | Rewrite to match campaign audience |
| Open / link tracking on | Campaign settings | Disable for deliverability |
| At-risk mailboxes | Mailbox health check | Reconnect or replace |
| Duplicate spintax | Both pipe options identical | Write a real variant |

## Notes

- **Identify the platform first (Step 0).** Bison and Instantly have different threading mechanics and different tools/fields — never apply Bison's "Thread reply" logic to an Instantly campaign or vice versa.
- **Bison threads via the "Thread reply" checkbox; Instantly threads via a BLANK follow-up subject.** These are opposite mechanics. On Bison a checked box threads the email; on Instantly an empty subject threads it and a filled subject breaks it.
- **Always refer to campaigns by their full name, never by campaign ID/code.** IDs are used only inside tool/API calls — keep them out of the report.
- **Mailbox count, warmup, per-mailbox daily limit, threading, and daily send cap are launch blockers on both platforms.** 50 connected + warming mailboxes, every mailbox at 30/day, correct threading, and exactly 1,000/day per campaign. Never report "good to launch" if any blocker fails.
- **Every mailbox must be set to 30 emails/day (per-mailbox daily limit).** This is separate from the campaign-level 1,000/day cap. Bison defaults new mailboxes to 10/day, which silently throttles the campaign — always confirm all 50 are at 30.
- **Missing Bison signatures are a launch blocker.** If sequences use `{SENDER_EMAIL_SIGNATURE}` and mailboxes have no signature set, every email sends with no sign-off.
- Maximize parallel tool calls for speed.
- Tone should be direct and factual like a QA checklist.
- Do not editorialize or suggest strategy changes unless asked.
- Focus on whether things are set up correctly, not whether the copy is good.
- If a campaign has personalization variables like `{PERSONALIZATION 1}` (Bison) or `{{firstName}}` (Instantly), note their presence but do not flag unless malformed.
