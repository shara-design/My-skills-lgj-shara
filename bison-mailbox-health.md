---
name: bison-mailbox-health
description: Run a full mailbox and domain health audit on a Bison workspace. Pulls every sender account, warmup score, bounce data, and spam-placement signal, then classifies each mailbox as Safe / Throttle / Hold and produces a domain-level report. Use when the user asks to "audit mailboxes", "check domain health", "run mailbox health", "spam check", "deliverability audit", or wants to know which mailboxes are safe to send from. Works as an EmailGuard substitute when credits are unavailable by using warmup spam-rescue counts as an inbox-placement proxy.
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
5. Concrete Safe / Throttle / Hold list with daily-send recommendations

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

### Step 3 (optional but recommended): Pull workspace stats

```
GET https://send.leadgenjay.com/api/workspaces/v1.1/stats?start_date=...&end_date=...
```
For period-level send/reply/bounce totals.

### Step 4: Save raw JSON locally for analysis

Save each page response to `/tmp/{client}-mbx-audit/senders_p{N}.json` and `/tmp/{client}-mbx-audit/warmup_p{N}.json` so the Python analysis below can re-read them without re-fetching.

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

# Domain-level aggregation
dom = defaultdict(lambda: {'mbx':0, 'wu_sent':0, 'spam':0, 'score_sum':0, 'bnc_rcvd':0, 'bnc_caused':0})
for s in senders:
    w = warmup_by_id.get(s['id'], {})
    d = s['email'].split('@')[1]
    dom[d]['mbx'] += 1
    dom[d]['wu_sent'] += w.get('warmup_emails_sent', 0)
    dom[d]['spam'] += w.get('warmup_emails_saved_from_spam', 0)
    dom[d]['score_sum'] += w.get('warmup_score', 0)
    dom[d]['bnc_rcvd'] += w.get('warmup_bounces_received_count', 0)
    dom[d]['bnc_caused'] += w.get('warmup_bounces_caused_count', 0)

# Workspace inbox-placement proxy
total_wu_sent = sum(w['warmup_emails_sent'] for w in warmup)
total_spam_saved = sum(w['warmup_emails_saved_from_spam'] for w in warmup)
inbox_rate = (total_wu_sent - total_spam_saved) / total_wu_sent * 100 if total_wu_sent else 0
spam_rate = total_spam_saved / total_wu_sent * 100 if total_wu_sent else 0
```

### Step 6: Produce the report

Follow the exact structure below.

## Report Structure

### Headline
One-sentence verdict + a 4-row comparison table vs the prior audit if available (avg warmup score, warmup enabled count, under-80 count, under-70 count).

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

### Domain Health Table
Sort by spam %, highest first. Columns: Domain | Mbx | Avg Score | Spam % | Bounces Rcvd | Status.

Status labels:
- **Excellent** — spam < 1% AND avg score > 98
- **Healthy** — spam < 5% AND avg score > 90
- **Watch** — spam 5-8% OR avg score 85-90
- **Act** — spam > 8% OR avg score < 85

### Mailboxes to Watch
Table of every mailbox with score < 80 OR spam_saves >= 10. Columns: Mailbox | Score | Spam Saves | Recommended action.

### Final Verdict — Should You Pause Any?
- **Pause (full hold):** mailboxes with warmup off, disconnected, or score < 70
- **Throttle to 15/day:** mailboxes with score 70-79 OR spam_saves >= 15
- **Light throttle to 20/day:** mailboxes with score 80-89 OR spam_saves 10-14
- **Safe at full 30/day:** everything else

State the total clean daily capacity (sum of recommended daily limits across the Safe bucket + reduced limits across Throttle buckets).

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

## What this skill does NOT do

- Real-time inbox placement testing (that's EmailGuard's job)
- DNS / SPF / DKIM / DMARC record validation (use a separate skill or manual check)
- Blacklist checking (Spamhaus, SURBL — use EmailGuard or manual)
- Campaign-level audit (use the `bison-audit` skill)

## Notes

- Always pull warmup with a **7-day window** — shorter windows under-sample, longer windows smooth over current issues
- The bridgekit `get_bison_mailbox_health` tool returns lifetime stats but does NOT include warmup score — direct API call to `/api/warmup/sender-emails` is required for that
- Cross-reference any prior audit memory for this client so you can show recovery / decline trends
- Never report "all healthy" if you see warmup_enabled=false on any account — that mailbox is silently degrading
- Daily limits are usually 30 for Google Workspace, 15-20 for Outlook
- Save a fresh memory entry summarizing the workspace state after each audit, so the next audit can compute deltas
