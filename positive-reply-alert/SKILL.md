---
name: positive-reply-alert
description: Scan a cold email client's Bison account for POSITIVE replies that have not yet been responded to (hot leads sitting unanswered), then draft a client-facing email alerting them to the leads and asking how to proceed. The email is delivered in chat as copyable text, never drafted in Gmail and never sent. Trigger on "unreplied positive replies", "positive reply alert", "hot leads waiting", "who hasn't the client replied to", "leads sitting unanswered", "notify client of positive replies", "check for missed replies", or any request to surface interested leads a client has left hanging and tell the client about them.
---

# Positive Reply Alert

Find the positive replies in a client's Bison inbox that nobody has answered yet, and draft an email telling the client which hot leads are waiting on them. Built for the LGJ Phase 5 (Iterate & Optimize) loop: a positive reply that sits unanswered for days is lost revenue, so this skill surfaces them fast and hands the client a decision.

**This skill writes copy only. It never creates a Gmail draft and never sends.** Per LGJ rules, no email goes out without Pablo's explicit confirmation. The output is a copyable code block in the chat that the human pastes into Gmail and sends.

---

## When to Use

- Recurring check on an active Bison client to catch positive replies going stale
- Client asks "any hot leads I'm sitting on?" or "did we miss anyone?"
- After a reporting pull that shows interested count > replies the client actioned
- Part of the Phase 5 optimization cadence, alongside `weekly-client-report`

## Required Inputs

Ask only if not provided or not derivable from the client repo:
1. **Client name** — the Bison workspace client name (may differ from the repo/persona name; resolve it in Step 1).
2. **Lookback window** — default **30 days**. Widen for a first run on an established account.
3. **Recipient** — the client's email. Pull from the client repo `TASKS.md` (`client_email:`) if working inside a client repo; otherwise ask.

Do NOT ask for workspace ID or API key — those resolve through the Bison MCP layer by client name.

---

## Workflow

### Step 1 — Resolve the client in Bison

The Bison client name often differs from the repo folder or persona name (e.g. repo "Taj Pamma" / persona, but the Bison workspace may be listed under the company or account owner). Resolve it before anything else:

```
mcp__claude_ai_bridgekit__get_bison_clients
```

Fuzzy-match the requested name against `client_name` values (try the persona name, the company name, and the account owner's name). 

**If no match is found**, the workspace may exist in Bison but not be wired into the MCP client roster yet (this is the case for some LGJ clients, e.g. Taj Pamma / workspace 330). Two paths:
- **Preferred:** report which names you tried + closest candidates, and ask the user to confirm the workspace or connect it. Do NOT guess or fall back to a different client's data.
- **Direct-API fallback (only with an explicit token):** if the user provides the workspace's Bison API token, call the Bison REST API directly instead of the MCP tools. Base URL `https://send.leadgenjay.com`, header `Authorization: Bearer <token>`. Endpoints: `GET /api/campaigns` (stats inline), `GET /api/campaigns/{id}/replies?status=interested&folder=inbox`, and `GET /api/replies/{id}/conversation-thread` (use `newer_messages` length to decide unreplied). Use the token in-memory only: never write it to a file, a report, or a commit.

### Step 2 — Pull the campaigns and their interested replies

Get every campaign (include paused/draft so nothing is missed):

```
mcp__claude_ai_bridgekit__list_bison_campaigns
  client_name: "{resolved}"
  status: "all"
```

If `total_campaigns` is 0 or every campaign shows `emails_sent: 0`, there are no replies possible. Report "account has not sent yet, no positive replies to surface" and stop — this is a valid, honest result, not a failure.

For each campaign with sends, pull the interested replies (paginate — 15/page):

```
mcp__claude_ai_bridgekit__get_bison_campaign_replies
  client_name: "{resolved}"
  campaign_id: {id}
  status: "interested"
  folder: "inbox"
  page: {1..N}
```

### Step 3 — Catch positives Bison did not tag (missed opportunities)

Bison's `interested` flag misses soft-positive language ("send info", "not now but Q3", "who is this"). Run the missed-opportunity sweep to catch them:

```
mcp__claude_ai_bridgekit__find_missed_opportunities_bison
  client_name: "{resolved}"
  days: {lookback}
  exclude_auto_replies: true
```

This returns a `job_id`. Poll until done:

```
mcp__claude_ai_bridgekit__check_job_status
  job_id: "{job_id}"
```

Merge its results with Step 2, de-duplicating by lead email.

### Step 4 — Filter to UNREPLIED only

The point of this skill is leads *waiting on a response*. From the merged interested set, keep only those the client/team has NOT already answered. Determine "unreplied" using, in order of preference:

1. **Thread direction** — if the reply object exposes the last message's direction/sender, keep it only when the **last message in the thread is inbound** (from the prospect). Drop any thread whose last message is outbound (already answered).
2. **Read state fallback** — if thread direction is unavailable, treat `read: false` (unread) interested replies as unreplied candidates, and flag read ones as "possibly handled, confirm."
3. **Alert-log de-dupe** — exclude any lead already listed in this client's prior alert log (see Step 6) so you never re-notify on the same lead. If a lead was alerted before and is STILL unreplied after 3+ days, mark it **ESCALATED** rather than dropping it.

Also drop clear opt-outs / "not interested" / auto-replies that slipped through.

Sort the survivors by reply date, oldest first (longest-waiting = most urgent).

### Step 5 — Write the client-facing email, show it in chat FIRST

**The chat IS the deliverable. Never create a Gmail draft, never send.** Order of operations is strict:
1. Write the copy and output it in chat: state the to, from, and subject above a copyable code block holding the body.
2. Wait for the user to approve or edit, then revise in chat.
3. Never call `create_email_draft`, `create_draft`, `send_email`, or `reply_to_email`. The user copies the approved text into Gmail and sends it themselves.

Rules for the copy:
- **Be brief. Only relevant info.** A busy client reads it in 10 seconds. No preamble, no filler, no restating the obvious.
- **No em-dashes.** Plain, warm, direct.
- **This is a reminder, nothing more.** Its only job is to nudge the client to respond to their own leads. NEVER offer to reply on their behalf, book the call for them, or take over the thread. No "want us to handle it?" close.
- Open with the count and stakes in one line ("N interested leads are waiting on you").
- One line per lead: **name, company, email address. Nothing else.** No dates, no description of what they want, no quotes, no summary of their reply. The client can read their own inbox; this email only points them to who is waiting so they can search the address.
- **No em-dashes anywhere**, including between the name and the date. Use plain commas and parentheses.
- Close with a soft, polite nudge to respond, e.g. "Please take a moment to reply when you get a chance." No urgency-pressure, no offer to take over.
- Keep housekeeping (opt-outs, list scrubs) OUT of the client email — those go in the internal report only.

Output format (no em-dashes anywhere, including the subject):

> **To:** `{client_email}` · **From:** `{the LGJ sending account, e.g. the CSM's, confirm if unsure}` · **Subject:** `{N} hot leads waiting on your reply ({client})`
>
> ```
> {body}
> ```

Body template (keep it this tight):

```
Hi {first name},

{N} leads replied interested and are waiting on you:

1. {Name}, {Company}, {email}
2. {Name}, {Company}, {email}

Please take a moment to reply when you get a chance.

{signature}
```

**Present the copy in chat and confirm before the user sends it.** Do not call any draft or send tool. Ending state is approved copy in the chat, nothing in Gmail.

### Step 6 — Log and report

Write a dated report into the client repo `05_optimization/` (when running inside a client repo):

`05_optimization/positive_reply_alert_{YYYY-MM-DD}.md` containing:
- Run date, client, lookback window, campaigns scanned
- Table of unreplied positive leads (name, company, campaign, reply date, quote, status: NEW / ESCALATED)
- Counts: total interested found, already-answered, unreplied surfaced, opt-outs dropped
- The client-facing email copy that was delivered in chat

Maintain a running alert log so Step 4 de-dupe works across runs: append every alerted lead email + first-alert date to `05_optimization/positive_reply_alert_log.md`.

Then give the user a 3-line chat summary: how many waiting, the single oldest/hottest one, and "copy is above, ready for you to paste and send."

Follow the repo Git Sync Protocol (commit + push the new report and log).

---

## Guardrails

- **Never create a Gmail draft and never send.** Chat delivery only. The user copies and sends (LGJ hard rule).
- **No em-dashes** anywhere in the drafted email or report.
- **Never fabricate a reply or a quote.** Every lead and quote must come from a Bison MCP call. If you have no reply text, say "no snippet available," do not invent one.
- **Never fall back to another client's data** if the requested client can't be resolved. Stop and report instead.
- De-dupe against the alert log so the client is never pinged twice about the same lead (escalate instead).
