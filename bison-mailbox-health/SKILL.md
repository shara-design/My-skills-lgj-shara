---
name: bison-mailbox-health
description: Run a full mailbox and domain health audit on a Bison workspace. Pulls every sender account, warmup score, bounce data, and spam-placement signal, reads the actual bounce-back messages to diagnose WHY mail is bouncing, and checks each sending domain's DNS auth (SPF/DKIM/DMARC) and SURBL blacklist status, then classifies each mailbox as Safe / Throttle / Hold and produces a domain-level report. Use when the user asks to "audit mailboxes", "check domain health", "domain health", "run mailbox health", "spam check", "deliverability audit", "why are we bouncing", "reason for the bounces", "are my domains blacklisted", or wants to know which mailboxes are safe to send from. Works as an EmailGuard substitute when credits are unavailable by using warmup spam-rescue counts as an inbox-placement proxy.
---

# Bison Mailbox & Domain Health Audit

## When to use this skill

- Before launching new campaigns (paired with `bison-audit` for the campaign side)
- Weekly or biweekly mailbox health review
- After a deliverability issue or reply-rate drop
- When EmailGuard credits are out and the client still needs a spam-placement read
- When the user asks "which mailboxes should I pause / throttle?"

## What this audit answers

1. Are all mailboxes connected and warming up?
2. Which mailboxes are landing in spam (proxy via warmup rescue count)?
3. Which domains are degrading?
4. Workspace-wide bounce rate and reply rate trend
5. **WHY** mail is bouncing — read from the actual bounce messages (blacklist vs dead
   address vs reputation vs temporary), so the fix is correct
6. Are the sending domains correctly configured (SPF/DKIM/DMARC) and free of blacklists (SURBL)?
7. Concrete Safe / Throttle / Hold list with daily-send recommendations

## Inputs needed

- Bison **client name** (e.g., "Phoebe Brown") OR Bison **workspace ID + API key** for direct API calls
- If using API directly: base URL `https://send.leadgenjay.com`

## Workflow

### Step 1: Pull mailbox data

**Preferred (MCP):**
```
mcp__claude_ai_bridgekit__get_bison_mailbox_health
  client_name: "{client name}"
```

**Direct API fallback (when MCP unavailable or for cross-check):**
```
GET https://send.leadgenjay.com/api/sender-emails?page={1..N}
Headers: Authorization: Bearer {api_key}
```
Paginate all pages. Default page size is 15. Check `meta.last_page`.

### Step 2: Pull warmup data (last 7 days)

```
GET https://send.leadgenjay.com/api/warmup/sender-emails?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&page={1..N}
```
Use today's date minus 7 for `start_date`, today for `end_date`. Paginate all pages.

### Step 3 (REQUIRED): Pull workspace stats + bounce-rate trend

Warmup score measures inbox *reputation*; it says nothing about how many addresses
you're emailing that don't exist. A workspace can show 99.9 avg warmup score and still
be self-destructing on a **14%+ live campaign bounce rate**. This step is not optional.

```
GET https://send.leadgenjay.com/api/workspaces/v1.1/stats?start_date=...&end_date=...
```
Returns `emails_sent`, `bounced`, `bounced_percentage`, `unique_replies_per_contact_percentage`.

**Pull the bounce rate across narrowing windows** so you can tell a historical spike
(old list, already stopped) from an ongoing leak (current list, still bouncing):

```
7-day:   start=today-7  end=today
3-day:   start=today-3  end=today
2-day:   start=today-2  end=today
today:   start=today    end=today
```

Read the trend, don't just the 7-day average:
- **Falling** (e.g. 17% two days ago -> 6% today) = old list already flushed; the new
  list is cleaner. Judge on the most recent window, not the smeared 7-day number.
- **Flat/rising** = the current list is the problem; sending must pause until re-verified.

Lifetime `bounced_count / emails_sent_count` on each sender (from Step 1) is a
*cumulative* number and lags reality — always cross-check it against the recent-window
workspace bounce rate before drawing a conclusion.

### Step 3b (REQUIRED when bounce rate is elevated): Diagnose bounce reasons from the actual messages

A bounce *rate* tells you there's a problem; the bounce *messages* tell you what it
actually is — and the fix is completely different depending on the answer. Do not
recommend "re-verify the list" until you have read real bounce-backs. A workspace can be
bouncing at 8%+ because its own **sending domains are blacklisted**, in which case
list re-verification fixes nothing.

Pull the Bounced folder from the replies endpoint and read the diagnostic text:
```
GET https://send.leadgenjay.com/api/replies?type=bounced&page={1..N}
```
Each item carries `text_body` / `html_body` with the raw DSN. Pull ~10-15 pages (150+
messages) for a representative sample; note `meta.total` for the true count. Classify by
what the receiving server actually said:

| Bucket | Signature in the message | Fix |
|---|---|---|
| **Sending domain blacklisted** | `A URL in this email (yourdomain.com) is listed on surbl.org` / `uribl` / `spamhaus` / `listed on` | **Delist the domain + find what listed it. List re-verification will NOT help.** |
| Dead domain (list quality) | `NXDOMAIN`, `DNS type 'mx' lookup ... NXDOMAIN`, `no such domain`, `5.4.x` | Re-verify list; strip dead domains |
| Dead recipient (list quality) | `user unknown`, `does not exist`, `mailbox unavailable`, `5.1.1` | Re-verify list; strip catch-alls |
| Spam/policy/reputation | `spam`, `blocked`, `reputation`, `5.7.x`, `unsolicited` | Warmup + content + volume; not a list problem |
| Soft / temporary | `Delivery incomplete`, `will retry`, `temporary problem`, `4.x.x` | Self-resolves; exclude from the "real bounce" count |
| Not a bounce (misfoldered) | `out of office`, `auto-reply`, `please remove`, `retired` | Ignore — Bison misfiled an auto-reply into Bounced |

Report the **percentage breakdown** and name the specific offending domains when the cause
is a blacklist (count SURBL rejects per sending domain). The lead-with cause is whichever
bucket dominates — if blacklisting is #1, the headline is a domain-reputation problem, NOT
a list problem, even if some dead addresses also exist.

### Step 3c (REQUIRED): Domain DNS & blacklist health

Warmup score and bounce rate say nothing about whether the domains are correctly
configured or blacklisted. Check every unique sending domain directly (fast `dig`, short
timeouts — SURBL lookups are slow, always pass `+time=2 +tries=1`):

```bash
for d in $(domains); do
  # URI blacklist (the one that shows up in "A URL in this email ... is listed" bounces)
  dig +short +time=2 +tries=1 "${d}.multi.surbl.org" A        # any 127.0.0.x answer = LISTED
  dig +short MX "$d"                                            # provider (Google / MS365 / none)
  dig +short TXT "$d" | grep -i 'v=spf1'                        # SPF present?
  dig +short TXT "google._domainkey.$d"                         # DKIM (adjust selector per provider)
  dig +short TXT "_dmarc.$d" | grep -oi 'p=[a-z]*'              # DMARC policy: none/quarantine/reject
done
```

Flag: any domain **LISTED** on SURBL (critical — directly causes 550 rejects), missing
SPF/DKIM, or DMARC at `p=none` (weak — recommend `p=quarantine`). Cross-check SURBL hits
against the Step 3b bounce messages; they should corroborate. Note that new domains get
SURBL-listed fast when the email body contains a link/mention of the sending domain — flag
that as the likely trigger to investigate.

### Step 4: Save raw JSON locally for analysis

Save each page response to `/tmp/{client}-mbx-audit/senders_p{N}.json`, `/tmp/{client}-mbx-audit/warmup_p{N}.json`, and `/tmp/{client}-mbx-audit/bounced_p{N}.json` so the Python analysis below can re-read them without re-fetching.

### Step 5: Run analysis

Use this Python pattern (adapt paths). It builds the classification, domain table, and spam-placement proxy.

```python
import json, glob
from collections import defaultdict

senders = []
for f in sorted(glob.glob('/tmp/CLIENT-mbx-audit/senders_p*.json')):
    senders.extend(json.load(open(f))['data'])

warmup = []
for f in sorted(glob.glob('/tmp/CLIENT-mbx-audit/warmup_p*.json')):
    warmup.extend(json.load(open(f))['data'])

warmup_by_id = {w['id']: w for w in warmup}

# Classification thresholds
HOLD_SCORE      = 70   # < 70 = HOLD (do not use)
THROTTLE_SCORE  = 80   # 70-79 = THROTTLE
WATCH_SCORE     = 90   # 80-89 = light throttle / monitor
HEALTHY_SCORE   = 90   # >= 90 = safe

# Build buckets
hold, throttle, watch, safe = [], [], [], []
for s in senders:
    w = warmup_by_id.get(s['id'], {})
    score = w.get('warmup_score', 0)
    spam_saves = w.get('warmup_emails_saved_from_spam', 0)
    bnc_rcvd = w.get('warmup_bounces_received_count', 0)
    sent = s.get('emails_sent_count', 0)
    bounced = s.get('bounced_count', 0)
    lifetime_br = (bounced/sent*100) if sent else 0
    row = {
        'email': s['email'],
        'score': score,
        'spam_saves': spam_saves,
        'bnc_rcvd': bnc_rcvd,
        'lifetime_br': lifetime_br,
        'warmup_on': s.get('warmup_enabled'),
        'status': s.get('status'),
    }
    if not row['warmup_on'] or row['status'] != 'Connected':
        hold.append(row)
    elif score < HOLD_SCORE:
        hold.append(row)
    elif score < THROTTLE_SCORE:
        throttle.append(row)
    elif score < WATCH_SCORE:
        watch.append(row)
    else:
        safe.append(row)

# Domain-level aggregation (warmup + LIVE campaign bounce)
dom = defaultdict(lambda: {'mbx':0, 'wu_sent':0, 'spam':0, 'score_sum':0, 'bnc_rcvd':0,
                           'bnc_caused':0, 'lsent':0, 'lbounced':0})
for s in senders:
    w = warmup_by_id.get(s['id'], {})
    d = s['email'].split('@')[1]
    dom[d]['mbx'] += 1
    dom[d]['wu_sent'] += w.get('warmup_emails_sent', 0)
    dom[d]['spam'] += w.get('warmup_emails_saved_from_spam', 0)
    dom[d]['score_sum'] += w.get('warmup_score', 0)
    dom[d]['bnc_rcvd'] += w.get('warmup_bounces_received_count', 0)
    dom[d]['bnc_caused'] += w.get('warmup_bounces_caused_count', 0)
    dom[d]['lsent'] += s.get('emails_sent_count', 0) or 0        # live campaign sends
    dom[d]['lbounced'] += s.get('bounced_count', 0) or 0         # live campaign bounces
# per-domain live bounce rate = dom[d]['lbounced'] / dom[d]['lsent'] * 100

# Workspace inbox-placement proxy (warmup)
total_wu_sent = sum(w['warmup_emails_sent'] for w in warmup)
total_spam_saved = sum(w['warmup_emails_saved_from_spam'] for w in warmup)
inbox_rate = (total_wu_sent - total_spam_saved) / total_wu_sent * 100 if total_wu_sent else 0
spam_rate = total_spam_saved / total_wu_sent * 100 if total_wu_sent else 0

# LIVE campaign bounce rate (the number warmup score hides). Prefer the recent-window
# workspace-stats figure from Step 3; this lifetime roll-up is the fallback / cross-check.
lt_sent = sum(s.get('emails_sent_count', 0) or 0 for s in senders)
lt_bounced = sum(s.get('bounced_count', 0) or 0 for s in senders)
lifetime_bounce_rate = lt_bounced / lt_sent * 100 if lt_sent else 0
# THRESHOLDS: <3% healthy, 3-5% watch, 5-8% act soon, 8%+ pause sending now.
```

### Step 6: Produce the report

Follow the exact structure below.

## Report Structure

### Headline
One-sentence verdict + a 4-row comparison table vs the prior audit if available (avg warmup score, warmup enabled count, under-80 count, under-70 count). **If warmup is clean but live bounce rate is elevated, the headline must lead with the bounce problem** — do not bury it under a "mailboxes healthy" summary.

### Live Campaign Bounce Rate (report BEFORE the spam check)
This is the signal warmup score hides. Show the recent-window trend from Step 3:

| Window | Sent | Bounced | Bounce rate |
|---|---|---|---|
| Last 7 days | X | X | XX.XX% |
| Last 3 days | X | X | XX.XX% |
| Last 2 days | X | X | XX.XX% |
| Today | X | X | XX.XX% |

Verdict thresholds (judge on the most recent representative window, not the 7-day smear):
- **< 3%** — healthy, clear to send
- **3-5%** — watch; tighten list, keep sending
- **5-8%** — act soon; scrub catch-all / accept-all addresses
- **8%+** — **pause sending now**; the list must be re-verified before more volume

State explicitly whether the trend is **falling** (old list already flushed -> judge on
today's number) or **flat/rising** (current list is the leak -> pause). Note that
catch-all / accept-all domains pass most verifiers but still bounce, so a residual 5-7%
after re-verification usually means catch-alls slipped through.

Critical framing: **healthy mailboxes + a dirty list still burns the domains.** Clean
warmup does not make an elevated bounce rate safe.

### Spam-Placement Check
| Metric | Value |
|---|---|
| Warmup emails sent (last 7d) | X |
| Landed in inbox first try | X (XX.XX%) |
| Hit spam folder (rescued by warmup) | X (XX.XX%) |
| Warmup bounces received | X |
| Auto-disabled for bouncing | X |

State the verdict: **under 5% spam = safe, 5-8% = watch, 8%+ = act**.

Caveat that this is a proxy and a real EmailGuard test should still be run when credits are available.

### Bounce Reason Breakdown (from Step 3b — report whenever bounce rate is elevated)
Percentage table across the classification buckets, most common first. Lead with the
dominant cause and state what it means for the fix:
- If **sending-domain blacklisted** dominates → headline is a **domain-reputation problem**;
  name the listed domains and the count of rejects each caused. Re-verifying the list will
  NOT fix it — the domains must be delisted.
- If **dead domain / dead recipient** dominates → it's a **list-quality problem**; re-verify.
- Always separate soft/temporary and misfoldered auto-replies out of the "real bounce" count
  so the number isn't inflated.

### Domain DNS & Blacklist Health (from Step 3c)
Table: Domain (or domain group) | SURBL | MX provider | SPF | DKIM | DMARC policy.
Call out, in priority order:
1. **SURBL / blacklist listings** — critical; these directly cause `550 ... is listed` rejects.
2. Missing SPF or DKIM.
3. DMARC at `p=none` — recommend tightening to `p=quarantine`.
Cross-reference against the Bounce Reason Breakdown — blacklisted domains here should match
the blacklist bounces there.

### Domain Health Table
Sort by **live bounce %**, highest first (that is the domain-killing signal — not warmup spam). Columns: Domain | Mbx | Avg Score | Spam % | **Live Bounce %** | Bounces Rcvd | **Blacklist** | Status.

Status labels (a domain fails on a spam problem, a bounce problem, OR a blacklist listing):
- **Excellent** — spam < 1% AND live bounce < 3% AND avg score > 98 AND not blacklisted
- **Healthy** — spam < 5% AND live bounce < 5% AND avg score > 90 AND not blacklisted
- **Watch** — spam 5-8% OR live bounce 5-8% OR avg score 85-90
- **Act** — spam > 8% OR live bounce > 8% OR avg score < 85 OR **listed on any blacklist**

### Mailboxes to Watch
Table of every mailbox with score < 80 OR spam_saves >= 10 OR lifetime bounce >= 8%. Columns: Mailbox | Score | Spam Saves | Lifetime Bounce % | Recommended action.

If bounces are smeared evenly across most/all mailboxes (rather than concentrated in a
few), that is the fingerprint of a **shared list-quality problem**, not per-mailbox
degradation — say so, and point the fix upstream at list verification, not at throttling.

### Final Verdict — Should You Pause Any?

**First, the workspace-level bounce gate (overrides per-mailbox capacity):**
- Live bounce rate **8%+ and not falling** -> recommend pausing ALL campaign sends, even if
  every mailbox is warmup-perfect. **Then name the fix from the Step 3b bounce reasons, not
  by default:** if domains are blacklisted, the fix is delisting (re-verification alone will
  not help); if dead addresses dominate, the fix is list re-verification. Do not reflexively
  say "re-verify the list" — read the bounce messages first.
- Live bounce **5-8%** -> keep sending but scrub catch-all / accept-all addresses now (and
  delist any blacklisted domains).
- Live bounce **< 5% (or falling into that range on the latest window)** -> the list is
  fine; judge purely on the per-mailbox warmup buckets below.
- **Any sending domain blacklisted (SURBL/URIBL/Spamhaus)** -> pause that domain regardless
  of bounce rate; a listed domain gets `550` rejects on otherwise-valid addresses.

Be explicit that a bounce-driven pause is separate from mailbox health: "the mailboxes
are all safe to send from; the *list* is what needs fixing." Do not conflate the two.

**Then, per-mailbox (warmup / spam) capacity:**
- **Pause (full hold):** mailboxes with warmup off, disconnected, or score < 70
- **Throttle to 15/day:** mailboxes with score 70-79 OR spam_saves >= 15
- **Light throttle to 20/day:** mailboxes with score 80-89 OR spam_saves 10-14
- **Safe at full 30/day:** everything else

State the total clean daily capacity (sum of recommended daily limits across the Safe bucket + reduced limits across Throttle buckets) — but note it is only usable if the bounce gate above is green.

### EmailGuard Follow-up Note
List the top 3 domains by spam % as priority targets for the next EmailGuard test.

## Classification Thresholds (cheat sheet)

| Score | Bucket | Action |
|---|---|---|
| 95-100 | Excellent | Full 30/day |
| 90-94 | Healthy | Full 30/day |
| 80-89 | Monitor | Optional throttle to 20/day |
| 70-79 | At-risk | Throttle to 15/day |
| <70 | Critical | HOLD, do not use |
| Warmup off | Critical | HOLD until re-enabled |
| Disconnected | Critical | HOLD, reconnect first |

Spam saves (warmup_emails_saved_from_spam) signal:
- 0-5: normal
- 6-10: monitor
- 11-15: throttle
- 16+: hold or investigate

Live campaign bounce rate (bounced / emails_sent — the domain-killer warmup hides):
- < 3%: healthy, clear to send
- 3-5%: watch, tighten the list
- 5-8%: act soon, scrub catch-all / accept-all addresses
- 8%+: PAUSE sending, re-verify the list before more volume

Note: warmup score and live bounce are **independent** axes. A mailbox can be 100/100
warmup and still be on a list bouncing at 15%. Always report both; never let a perfect
warmup score suppress a bounce warning.

## What this skill DOES cover (as of the domain-health additions)

- DNS auth check — SPF present, DKIM present, DMARC policy (Step 3c)
- Blacklist check — SURBL/URIBL via `dig` (Step 3c); the listing that shows up as
  `A URL in this email ... is listed on surbl.org` in real bounces
- Bounce-reason diagnosis from the actual Bounced-folder messages (Step 3b)

## What this skill does NOT do

- Real-time inbox placement testing (that's EmailGuard's job) — the SURBL/DNS checks here
  are a static-config read, not a live inbox-placement test
- Full multi-list blacklist coverage (Spamhaus/Barracuda/etc.) — Step 3c checks SURBL, the
  one that appears in Bison bounce messages; run EmailGuard for full blacklist coverage
- Campaign-level audit (use the `bison-audit` skill)

## Notes

- Always pull warmup with a **7-day window** — shorter windows under-sample, longer windows smooth over current issues
- The bridgekit `get_bison_mailbox_health` tool returns lifetime stats but does NOT include warmup score — direct API call to `/api/warmup/sender-emails` is required for that
- Cross-reference any prior audit memory for this client so you can show recovery / decline trends
- Never report "all healthy" if you see warmup_enabled=false on any account — that mailbox is silently degrading
- Never report "all healthy" / "clear to send" on warmup scores alone. **Always check the live campaign bounce rate first** — a workspace can be 99.9 avg warmup and still be burning its domains at 14%+ bounce. Warmup measures reputation; bounce rate measures list quality. Both must pass.
- When the live bounce rate is elevated, distinguish historical vs ongoing with the narrowing-window trend (Step 3) before recommending a pause — a falling trend means the old list already flushed and today's number is what matters
- **Bounce rate tells you THAT; bounce messages tell you WHY.** Never prescribe the fix from the rate alone — a workspace bouncing at 8%+ because its own domains are SURBL-listed will not improve one bit from list re-verification. Read the Bounced folder (Step 3b) and check SURBL (Step 3c) before recommending anything.
- A `550 A URL in this email (sendingdomain.com) is listed on surbl.org` bounce means the SENDING domain is blacklisted, not that the recipient is bad. New domains get listed fast when the email body links to / mentions the sending domain — flag that as the likely trigger.
- Daily limits are usually 30 for Google Workspace, 15-20 for Outlook
- Save a fresh memory entry summarizing the workspace state after each audit, so the next audit can compute deltas
