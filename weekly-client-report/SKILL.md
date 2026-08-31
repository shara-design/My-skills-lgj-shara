---
name: weekly-client-report
description: Generate a weekly outbound report for a cold email client. Pulls Bison stats, reconciles against the client's positive replies tracker sheet, builds a Google Sheets dashboard, and drafts a client-facing message with feedback ask. Trigger on "weekly report", "weekly client report", "weekly outbound report", "generate report for [client]", "build this week's report", or any request to summarize a client's weekly campaign performance.
---

# Weekly Client Report

End-to-end workflow for producing a weekly cold email performance report for a Bison client. Three deliverables: reconciled stats, Google Sheets dashboard, client message.

## When to Use

- Weekly reporting cadence for any active Bison client
- Client asks for "the weekly report" or "this week's numbers"
- End-of-week summary of campaign performance
- Before a client check-in call

## Required Inputs

Ask the user for these if not provided:
1. **Client name** (e.g., "Phoebe Brown")
2. **Week range** (start and end date, e.g., April 10 to April 17). If the user says "this week" or "last 7 days", calculate from today's date.

Do NOT ask for workspace ID or API key, those live in memory per client.

## Workflow

### Step 1: Pull Bison stats (parallel)

Run both calls in a single tool batch:

```
mcp__claude_ai_bridgekit__get_bison_stats
  client_name: "{client}"
  start_date: "{start}"
  end_date: "{end}"

mcp__claude_ai_bridgekit__list_bison_campaigns
  client_name: "{client}"
  status: "all"
```

The list_bison_campaigns call returns stats inline per campaign (emails_sent, replied, unique_replies, interested, bounced, total_leads_contacted). No separate per-campaign stats call needed.

### Step 2: Reconcile positive replies against tracker

If the client has a "Positive Replies Tracker" sheet saved in memory, pull it and compare:

```
mcp__claude_ai_bridgekit__read_spreadsheet
  spreadsheet_id: "{tracker sheet id from memory}"
  range_name: "Positive Replies!A1:M200"
```

Cross-check:
- Count rows in tracker grouped by campaign
- Compare to Bison's interested count per campaign
- Flag discrepancies in two directions:
  - **Bison has more**: likely new replies not yet logged in tracker. Pull them via get_bison_campaign_replies with status="interested" and append the new rows.
  - **Bison has fewer**: investigate, may be false positives or outbound Phoebe replies mis-tagged by Bison in the thread.
- Opt-outs (subject line "STOP", "unsubscribe", etc.) should be counted in tracker as "Do not contact" but subtracted from the positive total.

**Authoritative rule:** the client sees Bison's dashboard. Report Bison's Interested count as "Positive Replies" in the dashboard and message unless the user has explicitly asked to exclude opt-outs (in which case use tracker count minus opt-outs and note the delta).

### Step 3: Build the dashboard (Google Sheets)

Create a new Google Sheet titled `{Client Name} - Weekly Dashboard (Week N: {Start} to {End}, {Year})`.

**Layout (columns A to E):**

| Row | Content |
|-----|---------|
| 1 | Title (merged A1:E1), navy background, white text, 22pt bold, centered |
| 2 | `Week N: {Start} to {End}, {Year}   |   Prepared by Lead Gen Jay` (merged A2:E2), navy-light bg, white text, 11pt italic, centered |
| 3 | blank spacer |
| 4 | KPI labels across A-D: EMAILS SENT, REPLY RATE, POSITIVE REPLIES, MEETINGS BOOKED. Muted grey, 10pt bold, uppercase, light background |
| 5 | KPI values across A-D, 28pt bold, navy text, light grey background, centered |
| 6 | blank spacer |
| 7 | "CAMPAIGN PERFORMANCE" heading (merged A7:E7), 14pt bold, navy text |
| 8 | Table headers: Campaign, Emails Sent, Reply Rate, Positive Replies, Meetings Booked. Navy bg, white text, 11pt bold, centered |
| 9 to N | Campaign data rows. Right-align columns B-E |
| N+1 | TOTAL row, light blue background, bold |
| N+2 | blank spacer |
| N+3 | "EXECUTIVE SUMMARY" heading (merged), 14pt bold, navy |
| N+4 to N+6 | Summary paragraphs (each merged A:E) |

**Brand colors:**
- Navy: `{"red": 0.13, "green": 0.2, "blue": 0.47}`
- Navy light: `{"red": 0.25, "green": 0.32, "blue": 0.6}`
- Light grey KPI bg: `{"red": 0.95, "green": 0.95, "blue": 0.97}`
- Total row bg: `{"red": 0.92, "green": 0.95, "blue": 1}`
- White text: `{"red": 1, "green": 1, "blue": 1}`
- Muted grey: `{"red": 0.45, "green": 0.45, "blue": 0.45}`

**Tool sequence:**
1. `create_spreadsheet` with a single "Dashboard" sheet
2. `update_spreadsheet` to populate all rows A1:E{final} in one call
3. `merge_spreadsheet_cells` for each merged region (title, subtitle, section headings, summary rows)
4. `format_spreadsheet_cells` for each styled region (in parallel where possible)
5. `create_spreadsheet_chart` type COLUMN showing Positive Replies by Campaign (data range: campaign rows, cols 0 and 3)
6. `auto_resize_spreadsheet_columns` A to E

### Step 4: Draft the client message

Use this template exactly, replacing only the bracketed slots:

```
Subject: Week {N} Outbound Report

Hi {Client First Name},

Your Week {N} report is ready. It includes reply rate, positive replies, and meetings booked as requested, plus a per-campaign breakdown.

Please find it here: {Sheet URL}

We'd love to hear your feedback on the leads we're getting to confirm we're heading in the right direction, and any adjustments you'd like us to consider for optimization once these campaigns have run longer.

Best,
{Sender first name}
```

**Message rules:**
- No em dashes (`,`) or en dashes (`,`) anywhere. Replace with commas, periods, colons, or "to" for date ranges.
- Keep the message general. Do NOT include specific numbers in the body, the report has them.
- Do NOT include methodology, funnel analysis, recommendations, or action items, those belong in the dashboard itself or a separate follow-up.

### Step 5: Sharing instructions

After delivering the message draft, remind the user to enable link sharing on the sheet before sending:

> Open the sheet, click Share (top right), change "General access" from Restricted to "Anyone with the link", set role to Viewer, then copy the link.

Do NOT try to toggle public sharing programmatically, the `share_drive_file` tool only supports specific-email grants.

## Constraints and Style

- **No em dashes or en dashes** in ANY output: sheet, message, commentary. Use comma / period / colon / hyphen with spaces / "to".
- **4-metric focus only**: Emails Sent, Reply Rate, Positive Replies, Meetings Booked. Do not add Contacted, Clean Reply Rate, Bounce Rate, or any other column unless the user explicitly asks for it.
- **Campaigns with zero sends or zero replies**: display "n/a" (not a dash character) in the Reply Rate column.
- **TOTAL row**: sum of emails sent, weighted reply rate (total replies / total contacted), sum of positive replies, sum of meetings booked.
- **Date format**: "April 10 to April 17, 2026". No dashes between dates.

## Verification Before Delivering

Before presenting the final message, verify:

1. Reply rate in the sheet equals Bison's dashboard value (pull `get_bison_stats` with matching date range and compare the `unique_replies_per_contact_percentage` field).
2. Positive Replies total matches Bison's Interested count (unless user explicitly opted out opt-out subtractions).
3. Meetings Booked count matches the Action column of the client's tracker sheet (look for rows with "meeting booked", "discovery meeting", "call held", etc.).
4. No em dashes or en dashes anywhere in the sheet or message. Grep the generated content for `,` and `,` characters.

If any of the three counts disagree with their sources, surface the discrepancy to the user before delivering.

## Client-Specific Notes

Check memory for per-client overrides before running:

- **Phoebe Brown**: uses workspace 235 in Bison. Tracker sheet ID `1eNj2CNTPmcF_lE07FCcjMJN_VTSaafxsOFLyKG-KOwI`. Report format locked per `feedback_phoebe_weekly_report_format.md`, exactly Executive Summary + Campaign Performance table.

## Output to User

At the end, present:

1. The dashboard URL (Google Sheet)
2. The verification summary (did Bison totals match tracker?)
3. The message draft, ready to copy into email or Slack
4. Any flagged discrepancies or mis-tagged leads

Keep commentary tight. The user's time is limited on weekly-report day.
