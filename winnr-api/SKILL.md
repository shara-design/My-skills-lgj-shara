---
name: winnr-api
description: Integrates with the Winnr email infrastructure API. Use when building features that need domain management, mailbox provisioning, email sending/receiving, inbox operations, warming control, or DNS verification. Triggers on mentions of Winnr, domains, mailboxes, email accounts, warming, sending infrastructure, or email deliverability.
---

# Winnr API Integration

Winnr is the invisible email infrastructure behind OffMarket. Agents never see Winnr — they only see OffMarket. Use this skill when working with any email infrastructure feature.

## Authentication

```
Base URL: https://api.winnr.app
Token: wnr_tUE3La3uxRUpFDsdLF9s_wtOfT9yYnBGKXRE6PcToJFoA
Header: Authorization: Bearer {token}
```

## Service Layer

All Winnr functions live in `src/lib/winnr.js` — 36 functions covering the full API. Import from `@/lib/winnr`.

## Quick Reference

### Domains

```js
import { listDomains, getDomain, searchDomain, searchDomainsBulk, suggestDomains, setupDomain, connectDomains, deleteDomain, getDnsStatus, getDnsRecords, verifyDns, checkNameservers, setupRedirect, setupForward } from '@/lib/winnr'
```

| Function | Endpoint | Use Case |
|----------|----------|----------|
| `listDomains(limit, cursor)` | GET `/v1/domains` | List all account domains |
| `getDomain(domainId)` | GET `/v1/domains/{id}` | Get domain details + status |
| `searchDomain(domain)` | GET `/v1/domains/search?q=` | Check single domain availability |
| `searchDomainsBulk(domains[])` | POST `/v1/domains/search-bulk` | Check up to 100 domains at once |
| `suggestDomains(keywords)` | POST `/v1/domains/search-bulk` | Generate 8 variations + check availability |
| `setupDomain(domain)` | POST `/v1/domains/setup` | Purchase + provision domain (**charges Stripe**) |
| `connectDomains(domains[], cfToken?)` | POST `/v1/domains/connect` | Connect external domains |
| `deleteDomain(domainId)` | DELETE `/v1/domains/{id}` | Delete domain (async) |
| `getDnsStatus(domainId)` | GET `/v1/domains/{id}/dns-status` | Check MX/SPF/DKIM propagation |
| `getDnsRecords(domainId)` | GET `/v1/domains/{id}/dns-records` | Get expected DNS records |
| `verifyDns(domainId)` | POST `/v1/domains/{id}/verify-dns` | Live DNS verification |
| `checkNameservers(domains[])` | POST `/v1/domains/check-ns` | Verify NS pointing |
| `setupRedirect(domainId, url)` | POST `/v1/domains/{id}/redirect` | Domain redirect |
| `setupForward(domainId, address)` | POST `/v1/domains/{id}/forward` | Email forwarding (BCC) |

**Important:** `/v1/domains/suggest` returns 404 on our plan. Use `suggestDomains()` which generates variations and checks via `search-bulk`.

### Email Users (Mailboxes)

```js
import { listEmailUsers, listDomainEmailUsers, getEmailUser, createEmailUser, bulkCreateEmailUsers, updateEmailUser, deleteEmailUser, bulkDeleteEmailUsers } from '@/lib/winnr'
```

| Function | Endpoint | Use Case |
|----------|----------|----------|
| `listEmailUsers(domain?, limit, cursor)` | GET `/v1/email-users` | List all mailboxes |
| `listDomainEmailUsers(domainId, limit, cursor)` | GET `/v1/domains/{id}/email-users` | List mailboxes for domain |
| `getEmailUser(userId)` | GET `/v1/email-users/{id}` | Get mailbox details |
| `createEmailUser({ username, domain, name })` | POST `/v1/email-users` | Create single mailbox |
| `bulkCreateEmailUsers(users[])` | POST `/v1/email-users/bulk` | Create up to 100 mailboxes |
| `updateEmailUser(userId, { name, password })` | PATCH `/v1/email-users/{id}` | Update mailbox |
| `deleteEmailUser(userId)` | DELETE `/v1/email-users/{id}` | Delete mailbox |
| `bulkDeleteEmailUsers(userIds[])` | DELETE `/v1/email-users/bulk` | Bulk delete |

### Inbox (Sending & Receiving)

```js
import { listInbox, sendEmail, refreshInbox, getMessageBody, markMessageRead, deleteMessage } from '@/lib/winnr'
```

| Function | Endpoint | Use Case |
|----------|----------|----------|
| `listInbox(userId, limit, cursor)` | GET `/v1/email-users/{id}/inbox` | List inbox messages |
| `sendEmail(userId, { to, subject, body, inReplyTo, references })` | POST `/v1/email-users/{id}/inbox/send` | Send email (supports threading) |
| `refreshInbox(userId)` | POST `/v1/email-users/{id}/inbox/refresh` | Trigger inbox sync |
| `getMessageBody(uid, mailbox)` | GET `/v1/inbox/{uid}/body` | Get full email body |
| `markMessageRead(uid, mailbox, isRead)` | PATCH `/v1/inbox/{uid}` | Mark read/unread |
| `deleteMessage(userId, messageId)` | DELETE `/v1/email-users/{id}/inbox/{id}` | Delete message |

**Threading:** When replying, pass `inReplyTo` (the original message's `message_id`) and `references` (space-separated message IDs) to maintain thread continuity.

### Warming (Admin-only)

```js
import { listWarming, getWarmingOverview, enableWarming, disableWarming, pauseWarming, resumeWarming, updateWarmingSettings, getWarmingMetrics } from '@/lib/winnr'
```

| Function | Endpoint | Use Case |
|----------|----------|----------|
| `listWarming()` | GET `/v1/warming` | List warming mailboxes |
| `getWarmingOverview()` | GET `/v1/warming/overview` | Aggregate stats |
| `enableWarming(userIds[], settings?)` | POST `/v1/warming/enable` | Enable warming ($0.60/mo) |
| `disableWarming(userIds[])` | POST `/v1/warming/disable` | Disable warming |
| `pauseWarming(userId)` | POST `/v1/warming/{id}/pause` | Pause warming |
| `resumeWarming(userId)` | POST `/v1/warming/{id}/resume` | Resume warming |
| `updateWarmingSettings(userId, settings)` | PATCH `/v1/warming/{id}/settings` | Update volume/ramp |
| `getWarmingMetrics(userId, days?)` | GET `/v1/warming/{id}/metrics` | Daily metrics |

**Agent never sees warming.** It's controlled by admin on the backend. Agent only sees "daily send limit: 10 emails/day".

### Jobs & Export

```js
import { listJobs, getJob, exportEmailUsers } from '@/lib/winnr'
```

| Function | Endpoint | Use Case |
|----------|----------|----------|
| `listJobs(limit, cursor)` | GET `/v1/jobs` | List async jobs |
| `getJob(jobId)` | GET `/v1/jobs/{id}` | Check job status |
| `exportEmailUsers(format, domains?, getAll?)` | POST `/v1/export` | Export to CSV (instantly, smartlead, etc.) |

## Database Tables

Supabase tables for email accounts:

- `agent_domains` — domain per agent (name, status, DNS, Winnr ID)
- `agent_mailboxes` — mailboxes (email, display name, daily limit, health, Winnr ID)
- `winnr_mappings` — maps local IDs to Winnr + Instantly IDs (admin-only)

RLS: agents see only their own. `winnr_*` fields hidden from agents.

## Architecture Rules

1. **Agent never sees Winnr** — OffMarket is the only brand
2. **Agent never sees warming** — admin controls it, agent sees "daily send limit"
3. **Winnr IDs stored in DB** — `winnr_domain_id`, `winnr_user_id` fields, plus `winnr_mappings` table
4. **API token is server-side only** — never expose to client (current implementation is temporary for demo)
5. **Domain purchase charges Stripe** — `setupDomain()` will bill the Winnr account
6. **Rate limit: 300 req/min** — batch operations where possible

## Common Flows

### Agent buys domain
1. `suggestDomains(keywords)` → show results
2. Agent picks one → `setupDomain(domain)` → returns job ID
3. `getJob(jobId)` → poll until complete
4. Save to `agent_domains` + `winnr_mappings`

### Agent creates mailboxes
1. Agent fills table (name + username)
2. `bulkCreateEmailUsers([{ username, domain: domainId, name }])`
3. Save to `agent_mailboxes` + `winnr_mappings`
4. Admin enables warming: `enableWarming([winnrUserIds])`

### Sequence sends
1. Agent approves sequence → upload leads to Instantly/Bison campaign
2. Instantly sends from Winnr mailbox
3. Replies arrive in Winnr inbox
4. `listInbox(winnrUserId)` → write to Supabase `inbox_threads` + `inbox_messages`
5. Agent sees reply in OffMarket Inbox

### Agent replies
1. Agent writes reply in OffMarket
2. `sendEmail(winnrUserId, { to, subject, body, inReplyTo })` via Winnr
3. Save to `inbox_messages`
