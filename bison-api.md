---
name: bison-api
description: Integrates with the Bison (EmailBison) cold email platform API. Use when building features that need campaign data, reply management, lead operations, mailbox health, warmup stats, or workspace analytics from Bison. Triggers on mentions of Bison, EmailBison, send.leadgenjay.com, or cold email platform API.
---

# Bison API Integration

## When to use this skill
- Building or modifying code that calls the Bison API
- Fetching campaign stats, replies, leads, or mailbox data for Bison clients
- Creating new API routes that interact with Bison
- Debugging Bison API response shapes or field names
- Mapping Bison data to the HTM Portal data model

## Connection Details

- **Base URL:** `https://send.leadgenjay.com`
- **Auth:** `Authorization: Bearer <API_KEY>`
- **Rate Limit:** 3000 req/min (50 req/s) — much more generous than Instantly
- **Pagination:** Page-based (`?page=1`), 15 items per page
- **Response shape:** Always `{ data: ... }` wrapper

## Endpoint Quick Reference

### Campaigns

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| `GET` | `/api/campaigns` | Campaign list **with stats inline** | `emails_sent`, `opened`, `replied`, `bounced`, `interested`, `total_leads`, `total_leads_contacted` all included. No separate stats call needed. |
| `GET` | `/api/campaigns/{id}` | Single campaign with stats | Same fields as list |
| `POST` | `/api/campaigns/{id}/stats` | Summary + `sequence_step_stats[]` | Requires `start_date`, `end_date`. Per-step breakdown: sent, leads_contacted, unique_opens, unique_replies, bounced, interested. |
| `GET` | `/api/campaigns/{id}/replies` | Replies for this campaign | Supports `status` (interested/automated_reply/not_automated_reply), `folder`, `read`, `lead_id`, `tag_ids` |
| `GET` | `/api/campaigns/{id}/leads` | Leads with `lead_campaign_data` | Each lead has `{ status, emails_sent, replies, opens, interested }` per campaign |
| `GET` | `/api/campaigns/{id}/scheduled-emails` | Scheduled/sent emails | Includes lead + sender_email objects |
| `GET` | `/api/campaigns/{id}/sender-emails` | Sender accounts for campaign | |
| `GET` | `/api/campaigns/{id}/line-area-chart-stats` | Time series | Requires `start_date`, `end_date`. Returns Replied, Opens, Sent, Bounced, Unsubscribed, Interested series. |
| `GET` | `/api/campaigns/{id}/sequence-steps` | Deprecated | Use `v1.1` variant |
| `GET` | `/api/campaigns/v1.1/{id}/sequence-steps` | Email sequence steps | Subject, body, wait_in_days, variants |

### Replies

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| `GET` | `/api/replies` | All replies | Supports `campaign_id`, `status`, `folder`, `read`, `lead_id`, `tag_ids` filters |
| `GET` | `/api/replies/{id}` | Single reply | Full body (html_body, text_body) |
| `GET` | `/api/replies/{id}/conversation-thread` | Full thread | `current_reply`, `older_messages[]`, `newer_messages[]` |
| `POST` | `/api/replies/{id}/reply` | Send reply | Supports `reply_all`, `inject_previous_email_body`, attachments |
| `POST` | `/api/replies/{id}/forward` | Forward | |
| `PATCH` | `/api/replies/{id}/mark-as-interested` | Mark interested | |
| `PATCH` | `/api/replies/{id}/mark-as-not-interested` | Mark not interested | |
| `PATCH` | `/api/replies/{id}/mark-as-read-or-unread` | Toggle read | Requires `{ read: bool }` |
| `PATCH` | `/api/replies/{id}/mark-as-automated-or-not-automated` | Toggle auto | Requires `{ automated: bool }` |

### Leads

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| `GET` | `/api/leads` | All leads | Supports filters: lead_campaign_status, emails_sent, opens, replies, verification_statuses, tag_ids, created_at, updated_at |
| `GET` | `/api/leads/{id}` | Single lead | `id` can be numeric ID or email address |
| `GET` | `/api/leads/{id}/replies` | Lead's replies | |
| `GET` | `/api/leads/{id}/scheduled-emails` | Lead's scheduled emails | |
| `GET` | `/api/leads/{id}/sent-emails` | Lead's sent campaign emails | |
| `POST` | `/api/leads` | Create single lead | first_name, last_name, email required |
| `POST` | `/api/leads/multiple` | Bulk create (max 500) | |
| `POST` | `/api/leads/bulk/csv` | CSV upload | |

### Email Accounts (Sender Emails)

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| `GET` | `/api/sender-emails` | All accounts with stats | emails_sent_count, total_replied_count, bounced_count, warmup_enabled, status |
| `GET` | `/api/sender-emails/{id}` | Single account | |
| `GET` | `/api/sender-emails/{id}/replies` | Account replies | |
| `GET` | `/api/sender-emails/{id}/campaigns` | Campaigns using this account | |

### Warmup

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| `GET` | `/api/warmup/sender-emails` | Accounts with warmup stats | warmup_score, warmup_emails_sent, warmup_replies_received, bounces. Requires start_date, end_date. |
| `GET` | `/api/warmup/sender-emails/{id}` | Single account warmup | |
| `PATCH` | `/api/warmup/sender-emails/enable` | Enable warmup | `{ sender_email_ids: [] }` |
| `PATCH` | `/api/warmup/sender-emails/disable` | Disable warmup | |

### Workspace

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| `GET` | `/api/workspaces/v1.1/stats` | Summary stats | Requires start_date, end_date |
| `GET` | `/api/workspaces/v1.1/line-area-chart-stats` | Time series | Same params |
| `GET` | `/api/workspaces/v1.1/{id}` | Workspace details | |

### Campaign Events

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| `GET` | `/api/campaign-events/stats` | Event breakdown by date | Filterable by campaign_ids, sender_email_ids. Requires start_date, end_date. |

## Key Data Shapes

### Campaign (from GET /api/campaigns)
```json
{
  "id": 1,
  "name": "Campaign Name",
  "status": "Active",
  "emails_sent": 7,
  "opened": 2,
  "unique_opens": 1,
  "replied": 2,
  "unique_replies": 1,
  "bounced": 1,
  "unsubscribed": 2,
  "interested": 3,
  "total_leads_contacted": 7,
  "total_leads": 10,
  "max_emails_per_day": 7,
  "plain_text": true,
  "open_tracking": false,
  "tags": [{ "id": 1, "name": "VIP" }]
}
```

### Reply (from GET /api/replies)
```json
{
  "id": 45,
  "folder": "Inbox",
  "subject": "Re: Subject",
  "read": true,
  "interested": false,
  "automated_reply": false,
  "text_body": "Reply text...",
  "html_body": "<div>Reply HTML...</div>",
  "date_received": "2024-09-21T02:10:42.000000Z",
  "campaign_id": 123,
  "lead_id": 990,
  "from_name": "John Doe",
  "from_email_address": "john@example.com",
  "to": [{ "name": "Sender", "address": "sender@domain.com" }],
  "attachments": [{ "id": 8, "file_name": "doc.pdf", "download_url": "..." }]
}
```

### Lead (from GET /api/leads)
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@doe.com",
  "title": "Engineer",
  "company": "Acme",
  "status": "verified",
  "custom_variables": [{ "name": "linkedin", "value": "https://..." }],
  "overall_stats": { "emails_sent": 3, "opens": 0, "replies": 1, "unique_replies": 1 }
}
```

## Codebase Integration

### Existing Bison lib: `frontend/lib/bison.ts`

Key functions:
- `listBisonCampaigns()` — `GET /api/campaigns` (now returns stats inline)
- `getBisonCampaignDetails()` — `GET /api/campaigns/{id}`
- `getBisonCampaignStats()` — `POST /api/campaigns/{id}/stats`
- `listBisonSenderEmails()` — `GET /api/warmup/sender-emails`
- `listBisonReplies()` — `GET /api/replies`
- `getBisonWorkspaceStats()` — `GET /api/workspaces/v1.1/stats`

### Helper: `makeBisonRequest()`
```typescript
makeBisonRequest<T>(endpoint, apiKey, { method, params, body })
```
- Handles auth header, rate limiting, error handling
- Base URL: `https://send.leadgenjay.com/api`

## Important Notes

- **Stats are inline on campaign list** — `GET /api/campaigns` returns emails_sent, opened, replied, bounced, interested, total_leads directly. No separate enrichment call needed (unlike Instantly).
- **Per-campaign replies** — `GET /api/campaigns/{id}/replies` filters replies by campaign natively. Much more efficient than fetching all replies and filtering.
- **Status values** are strings: `Active`, `Draft`, `Launching`, `Stopped`, `Completed`, `Paused`, `Failed`, `Queued`, `Archived`
- **Reply interest** is a boolean `interested: true/false` (not numeric like Instantly's i_status)
- **Reply auto-detection** uses `automated_reply: true/false`
- **Pagination** is page-based (15 per page), not cursor-based like Instantly
