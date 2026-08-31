---
name: high-ticket-portal
description: CLI for the High Ticket Portal API. Create/manage tasks, list clients, check campaigns, mailbox health, and EmailGuard deliverability. Triggers on mentions of high ticket, portal, tasks, create task, client list, mailbox health, or portal API.
---

# HTM Portal CLI

Interact with the High Ticket Mastery Portal API directly from the terminal.

## Connection

- **Production:** `https://high-ticket-portal-production.up.railway.app`
- **Local:** `http://localhost:3000`
- **Auth:** Most routes (tasks, clients, campaigns, meetings) are open. EmailGuard/dashboard/admin routes require Supabase session cookies.

Default to production. Use local only if user specifies.

## How to Execute

Use `curl` via the Bash tool. Always parse JSON responses with `python3 -m json.tool` or `jq` for readability.

```bash
BASE="https://high-ticket-portal-production.up.railway.app"
curl -s "$BASE/api/endpoint" | python3 -m json.tool
```

---

## Commands

### Tasks (Primary)

#### Create Task
```bash
curl -s -X POST "$BASE/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Follow up with client about campaign results",
    "client_name": "Melissa DeRosier",
    "assigned_to": "Jonathan",
    "status": "open",
    "source": "manual",
    "due_date": "2026-04-01"
  }' | python3 -m json.tool
```

Fields:
- `description` (required) — task text
- `client_name` (optional) — must match a Notion client name
- `assigned_to` (optional) — strategist name
- `status` — `open` | `in-progress` | `done` (default: `open`)
- `source` — `manual` | `fathom` (default: `manual`)
- `due_date` (optional) — ISO date string
- `notion_page_id` (optional) — link to Notion page
- `fathom_recording_id`, `fathom_meeting_title` (optional) — for Fathom-sourced tasks

#### List Tasks
```bash
# All open tasks
curl -s "$BASE/api/tasks?status=open" | python3 -m json.tool

# Filter by client
curl -s "$BASE/api/tasks?client_name=Melissa%20DeRosier" | python3 -m json.tool

# Filter by assignee
curl -s "$BASE/api/tasks?assigned_to=Jonathan" | python3 -m json.tool

# All tasks (no filter)
curl -s "$BASE/api/tasks" | python3 -m json.tool
```

#### Task Summary
```bash
curl -s "$BASE/api/tasks/summary" | python3 -m json.tool
```
Returns: `{ success, overdue, dueToday, openCount, unprocessedMeetings }`

#### Update Task
```bash
curl -s -X PATCH "$BASE/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "task-uuid-here",
    "status": "done"
  }' | python3 -m json.tool
```

Updatable fields: `description`, `status`, `assigned_to`, `due_date`, `client_name`, `completed_at`

#### Delete Task
```bash
curl -s -X DELETE "$BASE/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"id": "task-uuid-here"}' | python3 -m json.tool
```

#### Log Task Activity
```bash
curl -s -X POST "$BASE/api/tasks/activity" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-uuid",
    "from_status": "open",
    "to_status": "in-progress",
    "changed_by": "Jonathan"
  }' | python3 -m json.tool
```

---

### Meetings & Task Extraction

#### List Meetings
```bash
curl -s "$BASE/api/meetings" | python3 -m json.tool
```

#### Extract Tasks from Meeting
```bash
curl -s -X POST "$BASE/api/tasks/extract" \
  -H "Content-Type: application/json" \
  -d '{"recording_id": "fathom-recording-id"}' | python3 -m json.tool
```
Uses Claude AI to parse Fathom transcript and extract action items matched to Notion clients.

---

### Clients

#### List All Clients
```bash
curl -s "$BASE/api/clients" | python3 -m json.tool
```

#### Get Client Details
```bash
curl -s "$BASE/api/clients?name=Melissa%20DeRosier" | python3 -m json.tool
```

#### List Team Members
```bash
curl -s "$BASE/api/team-members" | python3 -m json.tool
```

---

### Campaigns

#### List Campaigns for Client
Requires the client's Bison or Instantly API key from the Google Sheet credentials.
```bash
# Bison client
curl -s "$BASE/api/campaigns?apiKey=BISON_API_KEY&platform=bison" | python3 -m json.tool

# Instantly client
curl -s "$BASE/api/campaigns?apiKey=INSTANTLY_API_KEY&platform=instantly" | python3 -m json.tool
```

#### Campaign Analytics
```bash
curl -s "$BASE/api/campaigns/analytics?campaignId=CAMPAIGN_ID&apiKey=API_KEY&platform=bison&period=30" | python3 -m json.tool
```

---

### Mailbox Health

#### Full Mailbox Health Report
```bash
curl -s "$BASE/api/mailbox-health" | python3 -m json.tool
```
Returns all mailboxes across all Instantly + Bison clients with status (healthy/warning/critical), warmup scores, and issues. Cached for 60 seconds.

---

### EmailGuard Deliverability

**Note:** These routes require Supabase auth cookies. Use from the portal UI or pass session cookies.

#### Check DNS Auth (SPF/DKIM/DMARC)
```bash
curl -s -X POST "$BASE/api/emailguard/dns-check" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}' | python3 -m json.tool
```

#### Blacklist Check
```bash
curl -s -X POST "$BASE/api/emailguard/blacklist" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}' | python3 -m json.tool
```

#### Spamhaus Reputation (costs 4 credits)
```bash
# Create check
curl -s -X POST "$BASE/api/emailguard/spamhaus" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}' | python3 -m json.tool

# Poll for result
curl -s "$BASE/api/emailguard/spamhaus?uuid=RESULT_UUID" | python3 -m json.tool
```

#### Check Remaining Credits
```bash
curl -s "$BASE/api/emailguard/limits" | python3 -m json.tool
```

---

### Settings

#### Get/Set Benchmarks
```bash
# Get
curl -s "$BASE/api/settings?key=benchmarks" | python3 -m json.tool

# Set
curl -s -X POST "$BASE/api/settings" \
  -H "Content-Type: application/json" \
  -d '{"key": "benchmarks", "value": {"deliveryDays": 5, "sequences": 3}}' | python3 -m json.tool
```

---

## Response Patterns

All endpoints return JSON. Most follow:
```json
{ "success": true, "data": [...] }
{ "success": false, "error": "message" }
```

Task endpoints return:
```json
{ "success": true, "tasks": [...] }
{ "success": true, "task": {...} }
```

## Formatting Output

When displaying results to the user, format as clean tables or bullet lists:

**Tasks:**
```
| Status | Client | Description | Due | Assignee |
|--------|--------|-------------|-----|----------|
| open   | MAS Health | Review campaign metrics | Apr 1 | Jonathan |
```

**Task Summary:**
```
Overdue: 3 | Due Today: 1 | Open: 12 | Unprocessed Meetings: 2
```

**Mailbox Health:**
```
Total: 45 | Healthy: 38 | Warning: 5 | Critical: 2
```

## Error Handling

- 401/403 — Auth required (EmailGuard/admin routes). Tell user to use the portal UI.
- 404 — Resource not found
- 500 — Server error. Check if the env var is configured on Railway.
- Network error — Check if production is deployed (`railway status`)
