---
name: emailguard-api
description: Integrates with the EmailGuard (app.emailguard.io) deliverability monitoring API. Use when checking inbox placement, domain blacklists, spam scores, DNS authentication (SPF/DKIM/DMARC), Spamhaus reputation, SURBL checks, contact verification, or email host lookups. Triggers on mentions of EmailGuard, deliverability, inbox placement, blacklist check, spam score, domain reputation, or email authentication.
---

# EmailGuard API Integration

## When to use this skill
- Checking if emails are landing in inbox vs spam (inbox placement tests)
- Running blacklist checks on domains or email accounts
- Checking spam scores on email copy
- Validating SPF, DKIM, DMARC records on sending domains
- Running Spamhaus reputation checks (domain reputation, A record, context, senders, nameserver)
- Checking SURBL blacklist status
- Verifying contact lists before sending
- Looking up domain or email host providers
- Monitoring DMARC reports for sending domains
- Managing domain redirects and masking proxies

## Connection Details

- **Base URL:** `https://app.emailguard.io`
- **Auth:** `Authorization: Bearer 56325|Fbpz2Nu5zFJNKWYAtz9hbuNym5G0U182Rj30x0zL6ec5bac7`
- **Content-Type:** `application/json`
- **Response shape:** Always `{ data: ... }` wrapper

## Endpoint Quick Reference

### Domains

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/domains` | List all domains |
| `POST` | `/api/v1/domains` | Create domain (`name`) |
| `GET` | `/api/v1/domains/{uuid}` | Show domain details |
| `PATCH` | `/api/v1/domains/spf-record/{domain_uuid}` | Update SPF records |
| `PATCH` | `/api/v1/domains/dkim-records/{domain_uuid}` | Update DKIM records (`dkim_selectors[]`) |
| `PATCH` | `/api/v1/domains/dmarc-record/{domain_uuid}` | Update DMARC record |
| `DELETE` | `/api/v1/domains/delete/{domain_uuid}` | Delete domain |

### Email Accounts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/email-accounts` | List all email accounts (name, email, connected, provider) |
| `GET` | `/api/v1/email-accounts/{id}` | Show email account details |
| `POST` | `/api/v1/email-accounts/imap-smtp` | Create IMAP/SMTP account |
| `POST` | `/api/v1/email-accounts/test-imap-connection` | Test IMAP connection |
| `POST` | `/api/v1/email-accounts/test-smtp-connection` | Test SMTP connection |
| `DELETE` | `/api/v1/email-accounts/delete/{uuid}` | Delete email account |

### Inbox Placement Tests

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/inbox-placement-tests` | List all tests (with seed emails, status, scores) |
| `POST` | `/api/v1/inbox-placement-tests` | Create test (`name`). Returns seed email addresses + filter phrase to include in test email. |
| `GET` | `/api/v1/inbox-placement-tests/{uuid}` | Show test results (overall_score, per-email folder placement) |

**How inbox placement tests work:**
1. Create a test via POST — returns seed email addresses
2. Send your campaign email to those seed addresses (include the `filter_phrase` in the email)
3. Poll GET `/{uuid}` until status is "completed"
4. Results show which folder each seed email landed in (Inbox, Spam, Promotions, etc.)
5. `overall_score` is 0-100 (higher = better)

### Spam Filter Tests

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/spam-filter-tests` | List all tests (name, status, score, sent_from, sending_server_ip) |
| `POST` | `/api/v1/spam-filter-tests` | Create test (`name`). Returns a `spam_filter_email_address` to send your email to. |
| `GET` | `/api/v1/spam-filter-tests/{uuid}` | Show full results with `score_breakdown` (SPF, DKIM, DMARC, RBL symbols) |

**Score interpretation:**
- 0-3: Excellent (clean email)
- 3-7: Acceptable
- 7-8: Will get "add header" flag
- 8-15: Likely spam
- 15+: Will be rejected

### Content Spam Check

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/content-spam-check` | Check email body for spam words. Returns `is_spam`, `spam_score`, `spam_words[]` |

### Blacklist Checks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/blacklist-checks/domains` | List domain blacklist checks (status, blacklists_count) |
| `GET` | `/api/v1/blacklist-checks/email-accounts` | List email account blacklist checks |
| `POST` | `/api/v1/blacklist-checks/ad-hoc` | Check any domain/IP (`domain_or_ip`) |
| `GET` | `/api/v1/blacklist-checks/{uuid}` | Show blacklist check details |

### SURBL Blacklist Checks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/surbl-blacklist-checks/domains` | List SURBL checks (domain, status, listed) |
| `POST` | `/api/v1/surbl-blacklist-checks` | Create SURBL check (`domain`) |
| `GET` | `/api/v1/surbl-blacklist-checks/{uuid}` | Show SURBL check details |

### DMARC Reports

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/dmarc-reports` | List domains with DMARC monitoring (spf, dkim, dmarc status) |
| `GET` | `/api/v1/dmarc-reports/domains/{uuid}/insights` | Stats: email_volume, dmarc_pass_count, spf/dkim aligned. Requires `start_date`, `end_date`. |
| `GET` | `/api/v1/dmarc-reports/domains/{uuid}/dmarc-sources` | Source IPs with pass rates |
| `GET` | `/api/v1/dmarc-reports/domains/{uuid}/dmarc-failures` | Failed DMARC records |

### Email Authentication (Lookups & Generators)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/email-authentication/spf-lookup` | Validate SPF record (`domain`) |
| `POST` | `/api/v1/email-authentication/spf-generator-wizard` | Generate SPF from providers (`providers[]`) |
| `POST` | `/api/v1/email-authentication/spf-raw-generator` | Generate raw SPF record |
| `GET` | `/api/v1/email-authentication/dkim-lookup` | Validate DKIM (`domain`, `selector`) |
| `POST` | `/api/v1/email-authentication/dkim-raw-generator` | Generate DKIM record (`keyLength`) |
| `GET` | `/api/v1/email-authentication/dmarc-lookup` | Validate DMARC (`domain`) |
| `POST` | `/api/v1/email-authentication/dmarc-connected-domain` | Generate DMARC for connected domain |
| `POST` | `/api/v1/email-authentication/dmarc-another-domain` | Generate DMARC for external domain |

### Spamhaus Intelligence

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/spamhaus-intelligence/domain-reputation` | List domain reputation checks |
| `POST` | `/api/v1/spamhaus-intelligence/domain-reputation/create` | Create check (`domain`). Costs 4 credits. Async — poll show endpoint. |
| `GET` | `/api/v1/spamhaus-intelligence/domain-reputation/{uuid}` | Show results: reputation score, dimensions (smtp, human, infra, malware, identity), blacklist status |
| `GET` | `/api/v1/spamhaus-intelligence/a-record-reputation` | List A record reputation checks |
| `POST` | `/api/v1/spamhaus-intelligence/a-record-reputation/create` | Create A record check (`domain`). Async. |
| `GET` | `/api/v1/spamhaus-intelligence/a-record-reputation/{uuid}` | Show results: IP scores, counters |
| `GET` | `/api/v1/spamhaus-intelligence/domain-contexts` | List domain context checks |
| `POST` | `/api/v1/spamhaus-intelligence/domain-contexts/create` | Create context check (`domain`). Shows where domain seen (helo, mailbody, osint, etc.) |
| `GET` | `/api/v1/spamhaus-intelligence/domain-contexts/{uuid}` | Show context results |
| `GET` | `/api/v1/spamhaus-intelligence/domain-senders` | List domain sender checks |
| `POST` | `/api/v1/spamhaus-intelligence/domain-senders/create` | Create sender check (`domain`). Shows IPs sending as this domain. |
| `GET` | `/api/v1/spamhaus-intelligence/domain-senders/{uuid}` | Show sender results |
| `GET` | `/api/v1/spamhaus-intelligence/nameserver-reputation` | List NS reputation checks |
| `POST` | `/api/v1/spamhaus-intelligence/nameserver-reputation/create` | Create NS check (`domain`) |
| `GET` | `/api/v1/spamhaus-intelligence/nameserver-reputation/{uuid}` | Show NS reputation results |

### Host Lookups

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/domain-host-lookup` | Find domain's email host (`domain`) — returns provider name (Google, Microsoft, etc.) |
| `POST` | `/api/v1/email-host-lookup` | Find email's host (`email`) — returns provider name |

### Contact Verification

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/contact-verification` | List contact lists (name, status, total_contacts, valid_contacts) |
| `POST` | `/api/v1/contact-verification` | Upload CSV for verification (multipart/form-data: `csv` file + `name`) |
| `GET` | `/api/v1/contact-verification/show/{uuid}` | Show contact list details |
| `GET` | `/api/v1/contact-verification/download/{uuid}` | Download verified list |

### Hosted Domain Redirects

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/hosted-domain-redirects/ip` | Get redirect IP |
| `GET` | `/api/v1/hosted-domain-redirects` | List redirects (domain, redirect_domain, status) |
| `POST` | `/api/v1/hosted-domain-redirects` | Create redirect (`domain`, `redirect`) |
| `GET` | `/api/v1/hosted-domain-redirects/{uuid}` | Show redirect |
| `DELETE` | `/api/v1/hosted-domain-redirects/{uuid}` | Delete redirect |

### Domain Masking Proxies

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/domain-masking-proxies/ip` | Get proxy IP |
| `GET` | `/api/v1/domain-masking-proxies` | List proxies (masking_domain, primary_domain, status) |
| `POST` | `/api/v1/domain-masking-proxies` | Create proxy (`masking_domain`, `primary_domain`) |
| `GET` | `/api/v1/domain-masking-proxies/{uuid}` | Show proxy |
| `DELETE` | `/api/v1/domain-masking-proxies/{uuid}` | Delete proxy |

### Workspaces

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/workspaces` | List all workspaces (with credit/account limits) |
| `GET` | `/api/v1/workspaces/current` | Current workspace details |
| `POST` | `/api/v1/workspaces` | Create workspace (`name`) |
| `POST` | `/api/v1/workspaces/switch-workspace` | Switch workspace (`uuid`) |
| `PUT` | `/api/v1/workspaces/{team_id}` | Update workspace name |
| `POST` | `/api/v1/workspaces/invite-members` | Invite member (`email`, `role`) |

### Tags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tags` | List tags (uuid, name, color) |
| `POST` | `/api/v1/tags` | Create tag (`name`, `color`) |
| `GET` | `/api/v1/tags/{uuid}` | Show tag |
| `DELETE` | `/api/v1/tags/{uuid}` | Delete tag |

## Common Workflows

### Check deliverability for a client's domains
```bash
# 1. List domains
curl -s -H "Authorization: Bearer $TOKEN" https://app.emailguard.io/api/v1/domains

# 2. Check blacklists
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain_or_ip":"northernridge.com"}' \
  https://app.emailguard.io/api/v1/blacklist-checks/ad-hoc

# 3. Validate SPF
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"northernridge.com"}' \
  https://app.emailguard.io/api/v1/email-authentication/spf-lookup

# 4. Check spam score of email copy
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":"Hey {FIRST_NAME}, quick question about SBA financing..."}' \
  https://app.emailguard.io/api/v1/content-spam-check

# 5. Run Spamhaus domain reputation
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"northernridge.com"}' \
  https://app.emailguard.io/api/v1/spamhaus-intelligence/domain-reputation/create
```

### Weekly deliverability audit checklist
1. Run inbox placement tests on all active sender mailboxes
2. Check domain blacklist status for all sending domains
3. Check SURBL status for all sending domains
4. Review DMARC reports for pass/fail rates
5. Run content spam check on any new email copy
6. Check Spamhaus domain reputation if scores are declining

## Important Notes

- **Async endpoints:** Spamhaus checks (domain reputation, A record, context, senders, nameserver) are async. POST to create, then poll GET `/{uuid}` until `status` is `completed`.
- **Credits:** Spamhaus domain reputation costs 4 credits per check. Use sparingly.
- **Inbox placement tests** require sending an actual email to the seed addresses. The `filter_phrase` must be in the email so EmailGuard can identify it.
- **Contact verification** accepts CSV with an `email` column. Processing is async — poll until status is not "Processing".
- **Workspaces** scope all data. Switch workspace before querying if managing multiple clients.
