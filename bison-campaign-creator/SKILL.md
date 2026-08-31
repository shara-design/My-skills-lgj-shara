---
name: bison-campaign-creator
description: Create Bison email campaigns from a structured campaign sequences document. Use this skill whenever the user wants to create campaigns in Bison, upload campaign sequences, build email sequences from a document, or set up outbound campaigns for a client. Trigger when the user mentions creating campaigns, campaign sequences, Bison campaigns, email sequences from a doc, or loading campaigns into Bison — even if they don't say "Bison" explicitly but reference a campaign document or sequences file.
---

# Bison Campaign Creator

You create email campaigns in Bison by reading a structured campaign sequences document and creating each campaign with its full email sequence. This is a workflow that happens regularly for different clients and verticals, so precision and consistency matter.

## MANDATORY: every campaign ships with body spintax

**Spintax in the email body is not optional. Every campaign you create must include spintax throughout every email body — no exceptions.** This is a standing user instruction, not a per-job preference.

- **Subject lines get NO spintax.** Keep each subject as a single clean line. Spintax goes in the body only.
- If the source copy already contains body spintax, preserve it exactly (see "Spintax is sacred" below).
- If the source copy has **no** spintax, you generate it before creating the campaign. Spin the greeting (`{Hi|Hey}`) plus 1-2 phrases per paragraph — aim for several spin points per email.
- **Keep merge variables OUTSIDE spintax braces.** Bison does not reliably parse nested braces — spin the words around a variable, never the variable itself.
  - Good: `Are you {trying to add|looking to add} more jobs in {CITY}?`
  - Bad: `{more jobs in {CITY}?|jobs in {CITY}?}`  (nested braces break the parser)
- Spin only wording that does not change meaning. Never spin facts, offers, numbers, or the CTA's intent.
- Spintax format on Bison is `{option1|option2|option3}` (single braces, pipe-separated). Do **not** use Instantly's `{{RANDOM | a | b}}` format here.

If the user hands you finished copy with no body spintax, add it anyway and tell them you did. Do not ask permission to add body spintax — it is the default. Do not add spintax to subjects.

## How it works

The user will point you to a campaign sequences document (usually a markdown or text file). The document contains multiple campaigns, each with email steps that include spintax, subject lines, and send timing. Your job is to parse the document, confirm the details with the user, and create all campaigns in Bison.

## Step-by-step workflow

### 1. Read the document

Read the campaign sequences file the user provides. Parse out every campaign and its email steps.

For each campaign, extract:
- **Campaign name** (e.g., "CAMPAIGN 1: GYM GROWTH CAPITAL")
- **Subject line** for each email step
- **Email body** for each email step, preserving all spintax exactly as written (curly braces, pipes, variable placeholders like `{FIRST_NAME}`, `{{company}}`, `{{personalized_idea}}`)
- **Day number** for each email step (e.g., Day 0, Day 3)
- **Whether it's a thread reply** (indicated by "thread reply" in the step header)

### 2. Ask the user to confirm the Bison client

Before creating anything, ask: **"Which Bison client should I create these campaigns under?"**

If the document contains a "Prepared for" line, suggest that name but still ask for confirmation. Use `get_bison_clients` to verify the client exists in Bison.

### 3. Show a summary for validation

Present a summary table to the user before creating campaigns. This lets them catch any issues before anything is created. The summary should show:

| # | Campaign Name | # of Emails | Days |
|---|--------------|-------------|------|
| 1 | CAMPAIGN 1: GYM GROWTH CAPITAL 03/25/2026 | 2 | 0, 3 |
| 2 | CAMPAIGN 2: MED SPA EQUIPMENT & EXPANSION 03/25/2026 | 2 | 0, 3 |

Include:
- The total number of campaigns found
- Each campaign's name (with today's date appended in MM/DD/YYYY format)
- Number of email steps per campaign
- The day schedule for each step

Ask: **"Does this look correct? Should I proceed with creating all X campaigns?"**

### 4. Create the campaigns

Once confirmed, create all campaigns using `create_bison_sequence`. For each campaign:

- **campaign_name**: Use the exact campaign name from the document + today's date in MM/DD/YYYY format (e.g., `CAMPAIGN 1: GYM GROWTH CAPITAL 03/25/2026`)
- **sequence_title**: Same as campaign_name
- **client_name**: The confirmed client name
- **steps**: Array of email step objects, each with:
  - `day`: The day number from the document
  - `subject`: The subject line, exactly as written. For thread replies (Email 2+), prepend `Re: ` to the original subject
  - `body`: The full email body with all spintax preserved exactly — every `{option1|option2}`, `{FIRST_NAME}`, `{{company}}`, `{{personalized_idea}}` must be kept verbatim

Create campaigns in parallel when possible to save time.

### 5. Report results

After creation, show a results table:

| # | Campaign Name | Campaign ID | Sequence ID | Status |
|---|--------------|-------------|-------------|--------|
| 1 | CAMPAIGN 1: GYM GROWTH CAPITAL 03/25/2026 | 409 | 336 | Created |

If any fail, note the failure and retry once. Report final status for all campaigns.

## Critical rules for parsing

- **Spintax is sacred.** Never modify, reformat, or "clean up" spintax. The `{option1|option2|option3}` format and `{{variable}}` placeholders must be preserved character-for-character.
- **Signatures are part of the body.** The sign-off block (name, company, address, license, remove line) is part of Email 1's body, not metadata.
- **Thread replies don't repeat the signature.** Email 2+ typically ends with just the sender's first name.
- **Escape characters are document artifacts.** Backslashes before underscores (`\_`) or hash signs (`\#`) in markdown are rendering escapes — strip them in the actual email body (use `_` and `#` respectively).
- **Empty spintax options are intentional.** `{Hey|Hi|}` means the third option is blank (no greeting). Preserve this.

## Document format

Campaign documents follow this structure:

```
**CAMPAIGN N: CAMPAIGN NAME**

Subject: {subject line}

Email 1 (Day 0):

{email body with spintax}

Email 2 (Day 3, thread reply):

{email body with spintax}
```

The day number and whether it's a thread reply are specified in the email step header. The number of emails per campaign may vary.

## Direct Bison API (use when you need to attach mailboxes or have a workspace token)

`create_bison_sequence` (MCP) creates the campaign + sequence but **cannot attach sender emails (mailboxes) to a campaign.** When the user wants specific mailboxes attached, or hands you a raw Bison workspace token, drive the REST API directly. Base URL `https://send.leadgenjay.com`, header `Authorization: Bearer <token>` (the token's `NNN|...` prefix already scopes it to one workspace — no client selection needed).

Validated flow (one campaign per sequence, one step per email):

1. **Create campaign:** `POST /api/campaigns` body `{"name":"..."}` → returns `data.id`. Status starts as `draft`.
2. **Add the sequence + steps (single call):** `POST /api/campaigns/{id}/sequence-steps` body:
   ```json
   { "title": "<campaign name>", "sequence_steps": [
     { "order":1, "wait_in_days":3, "thread_reply":false, "email_subject":"...", "email_body":"<p dir=\"ltr\">...</p>" }
   ] }
   ```
3. **Attach mailboxes:** `POST /api/campaigns/{id}/attach-sender-emails` body `{"sender_email_ids":[...]}` (remove with `DELETE /api/campaigns/{id}/remove-sender-emails`). Get sender IDs from `GET /api/sender-emails` (paginated 15/page; `email_signature` field reveals which brand/domain a mailbox belongs to — filter on that to attach only one domain's boxes).
4. **Schedule (optional):** `POST /api/campaigns/{id}/schedule` body needs `monday..sunday` (bool), `start_time`, `end_time`, `timezone`, `save_as_template`.

Gotchas learned the hard way:
- **`wait_in_days` must be ≥ 1 on every step**, including the last one (0 is rejected).
- **`thread_reply:true` auto-prepends one `Re:`** to the subject. Pass the *base* subject (no `Re:`); do not add `Re:` yourself or you get `Re: Re:`.
- **Body is HTML:** wrap each paragraph in `<p dir="ltr">...</p>` and use `<p dir="ltr"><br></p>` for blank lines between paragraphs. Sign-off renders as `<p dir="ltr">Best,</p><p dir="ltr">{SENDER_EMAIL_SIGNATURE}</p>`.
- **`{SENDER_EMAIL_SIGNATURE}`** is the Bison merge tag that pulls each mailbox's own signature — use it instead of a hardcoded name so the signature matches the sending domain automatically.
- Merge tags are single-brace uppercase: `{FIRST_NAME}`, `{CITY}`, `{COMPANY_NAME}`, `{SENDER_EMAIL_SIGNATURE}`.
- Campaigns are not editable via `PATCH /api/campaigns/{id}` (GET/DELETE only). To change copy, edit/replace sequence steps or delete + recreate the campaign.
- Build payloads as JSON files and `curl --data @file` to avoid shell-escaping HTML. Add `--max-time` to every curl; this API can be slow and parallel curls may hang.
