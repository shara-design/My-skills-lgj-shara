---
name: instantly-cli
description: Instantly.ai cold email platform CLI — campaigns, leads, accounts, analytics, deliverability, inbox, enrichment. 156+ commands wrapping the full V2 API.
triggers:
  - instantly
  - cold email campaigns
  - email accounts warmup
  - lead management instantly
  - campaign analytics instantly
  - inbox placement
  - email deliverability
  - instantly api
---

# /instantly-cli: Instantly.ai Cold Email Platform CLI

You have access to `instantly-cli`, a comprehensive CLI wrapping the entire Instantly.ai V2 API (156+ commands across 31 API groups).

## Authentication

Three-tier resolution (checked top to bottom):
1. `--api-key <key>` flag on any command
2. `INSTANTLY_API_KEY` environment variable
3. Stored config at `~/.instantly/config.json` (created by `instantly login`)

```bash
# Login (saves to ~/.instantly/config.json)
instantly login --api-key <your-key>

# Or set env var
export INSTANTLY_API_KEY=<your-key>
```

## Global Options

| Flag | Description |
|------|-------------|
| `--api-key <key>` | Override API key for this command |
| `--output <format>` | `json` (default) or `pretty` |
| `--pretty` | Shorthand for `--output pretty` |
| `--quiet` | Suppress output, exit codes only |
| `--fields <fields>` | Comma-separated field selection |

## Command Reference

### Campaigns (13 commands)
```bash
instantly campaigns list [--limit N] [--status 0|1|2|3] [--search term]
instantly campaigns get <id>
instantly campaigns create --name "Campaign Name" [--schedule '{}']
instantly campaigns update <id> [--name "New Name"]
instantly campaigns delete <id>
instantly campaigns activate <id>
instantly campaigns pause <id>
instantly campaigns duplicate <id>
instantly campaigns search-by-contact <email>
instantly campaigns count-launched
instantly campaigns sending-status <id>
instantly campaigns bulk-activate --ids "id1,id2"
instantly campaigns bulk-pause --ids "id1,id2"
```
Status codes: 0=Draft, 1=Active, 2=Paused, 3=Completed

### Leads (13 commands)
```bash
instantly leads list [--campaign-id X] [--limit N] [--search term] [--interest-status N]
instantly leads get <id>
instantly leads create --email "x@y.com" --campaign-id X [--first-name "Name"]
instantly leads update <id> [--first-name "Name"]
instantly leads delete <id>
instantly leads bulk-add --campaign-id X --leads '[{"email":"a@b.com"}]' [--skip-if-in-workspace] [--skip-if-in-campaign]
instantly leads bulk-delete --campaign-id X [--delete-all]
instantly leads bulk-assign --lead-ids "id1,id2" --account-id X
instantly leads move --lead-ids "id1,id2" --to-campaign-id X
instantly leads merge --lead-ids "id1,id2"
instantly leads update-interest-status --lead-id X --interest-status N
instantly leads remove-from-subsequence --lead-id X --subsequence-id X
instantly leads subsequence-move
```

### Email Accounts (12 commands)
```bash
instantly accounts list [--limit N]
instantly accounts get <id>
instantly accounts create --email X --smtp-host X --smtp-port N --imap-host X
instantly accounts update <email> [--daily-limit N]
instantly accounts delete <id>
instantly accounts warmup-enable --account-ids "id1,id2"
instantly accounts warmup-disable --account-ids "id1,id2"
instantly accounts test-vitals <email>
instantly accounts pause <email>
instantly accounts resume <email>
instantly accounts mark-fixed <email>
instantly accounts ctd-status [--host X]
```

### Analytics (6 commands)
```bash
instantly analytics campaign --id X [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD]
instantly analytics campaign --ids "id1,id2"
instantly analytics campaign-overview [--start-date X] [--end-date X]
instantly analytics daily-campaign --campaign-id X [--start-date X] [--end-date X]
instantly analytics campaign-steps --campaign-id X
instantly analytics daily-account [--start-date X] [--end-date X]
instantly analytics warmup --emails "a@b.com,c@d.com"
```

### Emails / Unified Inbox (8 commands)
```bash
instantly emails list [--campaign-id X] [--is-read true|false] [--email-type reply] [--eaccount X] [--limit N]
instantly emails get <id>
instantly emails update <id> [--is-read true]
instantly emails delete <id>
instantly emails reply --reply-to-uuid X --to X --eaccount X --subject X --body-text "text"
instantly emails forward --forward-uuid X --eaccount X --to X
instantly emails mark-read <thread-id>
instantly emails unread-count
```

### Webhooks (8 commands)
```bash
instantly webhooks list
instantly webhooks get <id>
instantly webhooks create --url X --event-type X
instantly webhooks update <id>
instantly webhooks delete <id>
instantly webhooks test <id>
instantly webhooks event-types
instantly webhooks resume <id>
```

### Webhook Events (4 commands)
```bash
instantly webhook-events list
instantly webhook-events get <id>
instantly webhook-events summary
instantly webhook-events summary-by-date
```

### Lead Lists (6 commands)
```bash
instantly lead-lists list
instantly lead-lists get <id>
instantly lead-lists create --name X
instantly lead-lists update <id> --name X
instantly lead-lists delete <id>
instantly lead-lists verification-stats <id>
```

### Enrichment (10 commands)
```bash
instantly enrichment enrich --email X
instantly enrichment count
instantly enrichment get <id>
instantly enrichment run --id X
instantly enrichment create
instantly enrichment update-settings <id>
instantly enrichment ai --prompt X
instantly enrichment ai-progress <id>
instantly enrichment history <id>
instantly enrichment preview
```

### Blocklist (5 commands)
```bash
instantly blocklist list
instantly blocklist get <id>
instantly blocklist create --entry X
instantly blocklist delete <id>
instantly blocklist bulk-add --entries '["domain.com"]'
```

### Custom Tags (6 commands)
```bash
instantly tags list
instantly tags get <id>
instantly tags create --name X
instantly tags update <id> --name X
instantly tags delete <id>
instantly tags search --query X
```

### Subsequences (8 commands)
```bash
instantly subsequences list [--campaign-id X]
instantly subsequences get <id>
instantly subsequences create --campaign-id X --name X
instantly subsequences update <id>
instantly subsequences delete <id>
instantly subsequences activate <id>
instantly subsequences pause <id>
instantly subsequences duplicate <id>
```

### Workspace (6 commands)
```bash
instantly workspace get
instantly workspace update
instantly workspace members list
instantly workspace members invite --email X
instantly workspace members remove <id>
instantly workspace billing get
```

### Inbox Placement (6 + 5 analytics + 2 reports = 13 commands)
```bash
instantly inbox-placement list
instantly inbox-placement get <id>
instantly inbox-placement create
instantly inbox-placement delete <id>
instantly inbox-placement run <id>
instantly inbox-placement results <id>
instantly inbox-placement-analytics overview
instantly inbox-placement-analytics by-provider
instantly inbox-placement-analytics by-domain
instantly inbox-placement-analytics trends
instantly inbox-placement-analytics history
instantly inbox-placement-reports list
instantly inbox-placement-reports get <id>
```

### Additional Groups
```bash
# Email Verification
instantly email-verification verify --email X
instantly email-verification bulk-verify --emails '["a@b.com"]'

# Background Jobs
instantly background-jobs get <id>
instantly background-jobs list

# Audit Logs
instantly audit-logs list

# API Keys
instantly api-keys list
instantly api-keys create --name X
instantly api-keys delete <id>

# CRM Actions
instantly crm-actions list
instantly crm-actions create

# Custom Prompt Templates
instantly custom-prompts list|get|create|update|delete

# Sales Flow
instantly sales-flow list|get|create|update|delete

# Email Templates
instantly email-templates list|get|create|update|delete

# DFY Orders
instantly dfy-orders list|get|create|update|delete|cancel|resume
```

## API Details

- **Base URL**: `https://api.instantly.ai/api/v2`
- **Auth**: Bearer token (`Authorization: Bearer <key>`)
- **Rate limit**: 100 requests/10s, 600 requests/min (workspace-wide)
- **Pagination**: Cursor-based using `--starting-after` (UUID or datetime cursors)
- **Auto-retry**: Exponential backoff on 429 and 5xx (max 3 retries)
- **Timeout**: 30s reads, 15s writes

## MCP Server Mode

The CLI can also run as an MCP server for AI agent integration:

```json
{
  "mcpServers": {
    "instantly": {
      "command": "npx",
      "args": ["instantly-cli", "mcp"],
      "env": { "INSTANTLY_API_KEY": "your-key" }
    }
  }
}
```

## Common Workflows

### Check campaign performance
```bash
instantly analytics campaign-overview --start-date 2026-03-15 --end-date 2026-03-22 --pretty
```

### Find interested leads
```bash
instantly leads list --campaign-id X --interest-status 1 --pretty
```

### Check warmup health
```bash
instantly analytics warmup --emails "sender1@domain.com,sender2@domain.com" --pretty
```

### Pause underperforming campaign
```bash
instantly campaigns pause <campaign-id>
```

### Get unread replies
```bash
instantly emails list --email-type reply --is-read false --pretty
```

### Bulk add leads to campaign
```bash
instantly leads bulk-add --campaign-id X --leads '[{"email":"a@b.com","first_name":"John","company_name":"Acme"}]' --skip-if-in-workspace
```

### Test email deliverability
```bash
instantly accounts test-vitals sender@domain.com --pretty
```

### Check inbox placement
```bash
instantly inbox-placement create --from sender@domain.com
instantly inbox-placement results <test-id> --pretty
```

## Integration with HTM Portal

When working with the HTM Portal app, use this CLI alongside the Bison API skill:
- **Instantly clients**: Use `--api-key` with each client's stored API key from Supabase
- **Campaign health**: `instantly analytics campaign --ids "id1,id2"` for bulk stats
- **Warmup monitoring**: `instantly analytics warmup --emails "..."` for mailbox health
- **Lead management**: `instantly leads bulk-add` for campaign submissions
- **Reply tracking**: `instantly emails list --email-type reply` for communications page
