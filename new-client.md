---
name: new-client
description: "End-to-end NEW CLIENT onboarding processor for LGJ. Pulls a strategy/onboarding call transcript from Fathom, saves it to the client's Google Drive folder as a Google Doc and to the client repo as markdown, saves the intake form as markdown, analyzes the transcript to deploy per-member tasks, delivers the action items and meeting recap directly in chat, and drafts a client-facing recap email as a Gmail draft. Use when someone says 'onboard [client]', 'new client [name]', 'process the [client] onboarding call', 'pull the transcript and deploy tasks', or sets up a brand-new client from a Fathom recording. For an ongoing/recurring meeting that only needs transcript saved + a recap in chat (no intake, no tasks), use the 'client-meeting' skill instead."
---

# New Client

Run the full post-call workflow for a client: **transcript → Drive Doc + repo .md → intake .md → per-member tasks → action items + recap delivered in chat → client-facing recap email drafted in Gmail.**

## Golden rules (do not violate)

1. **Never fabricate.** Every fact in the recap, tasks, and any document MUST come from the client's transcript or their own docs (intake form, Drive files). Do not infer offers, numbers, names, dates, or commitments that were not stated.
2. **If something can't be found or pulled, STOP and tell the user.** Examples: Fathom returns no matching meeting, the Drive folder is missing, the intake doc isn't found, the API key is rejected. Emit a clear message like:
   `⚠️ Could not pull the Fathom transcript for <client> — no meeting matched "<query>". Please confirm the meeting title or attendee email.` Do not invent placeholder content to keep going.
3. **Naming convention — always.** Name every saved artifact with the client's full name followed by the document type:
   - `<Client Name> - Transcript - <YYYY-MM-DD>` (Drive Doc) and `<Client Name> - Transcript - <YYYY-MM-DD>.md` (repo) — always include the meeting date (from Fathom `created_at` or the user)
   - `<Client Name> - Intake Form.md`
   - **Action items and the meeting recap are NOT saved as local `.md` files — they are delivered directly in the chat** (see steps 5–6).
4. **Quote your evidence.** Each action item and recap line carries the transcript timestamp/quote it came from.

## Inputs to confirm first
- **Client name** (e.g. "David Dewey").
- **Client repo path** — usually `/Users/shararamirez/Desktop/LGJ Clients/<First_Last>/`.
- **Client Drive folder** — search Drive for it (see step 3). If absent, ask before creating one.

## Step 1 — Pull the transcript from Fathom (API)

The bridgekit Fathom MCP tools may report "no API key configured." In that case use the **Fathom REST API directly** with the user's key.

> Fathom API key (LGJ): `FnpeYdUWtC4CVqCQoWe1Mw.h3u2Q3U74K9UyybMEUIdb1zbrqdMgJwS06IXpclEUB8`
> Store/rotate via the user if it stops working. Header: `X-Api-Key: <key>`.

```bash
# 1a. List meetings and find the one for this client (match by title or attendee)
curl -s "https://api.fathom.ai/external/v1/meetings?limit=100" \
  -H "X-Api-Key: $FATHOM_KEY" \
| python3 -c "import sys,json;[print(i['recording_id'],'|',i['created_at'],'|',i['title']) for i in json.load(sys.stdin)['items']]"

# 1b. Pull full details for the matched recording
curl -s "https://api.fathom.ai/external/v1/meetings?include_transcript=true&include_summary=true&include_action_items=true&include_crm_matches=true&limit=100" \
  -H "X-Api-Key: $FATHOM_KEY" -o /tmp/fathom_all.json
```
Then extract the matching `recording_id` from `/tmp/fathom_all.json`. Useful fields:
`transcript` (list of `{speaker.display_name, text, timestamp}`), `default_summary.markdown_formatted`,
`action_items` (often empty — derive your own), `calendar_invitees` (names/emails/`is_external`), `share_url`.

**If no meeting matches → stop and ask the user (rule 2).**

Build a clean **verbatim** markdown transcript: collapse consecutive same-speaker segments into one turn, prefix each turn with `[timestamp] Speaker:`. Keep the words as spoken — this is the transcript of record, do not paraphrase.

## Step 2 — Save the transcript to the repo
Write the verbatim transcript to `<repo>/<Client Name> - Transcript - <YYYY-MM-DD>.md` (meeting date in the filename) with a header (meeting, date, recording id, attendees, share link).

## Step 3 — Save the transcript to the client's Drive folder as a Google Doc
```
# find the folder
mcp__claude_ai_bridgekit__search_drive_files(query="<Client Name>", file_type="folder")
```
Create a **native** Google Doc directly in that folder (text/plain auto-converts to a Doc):
```
mcp__claude_ai_Google_Drive__create_file(
  title="<Client Name> - Transcript - <YYYY-MM-DD>",
  parentId="<folder id>",
  contentMimeType="text/plain",
  textContent="<verbatim transcript text>"
)
```
If the folder isn't found → stop and ask (rule 2). (`create_google_doc` makes the doc in My Drive root then needs `move_drive_file`; prefer `create_file` with `parentId`.)

## Step 4 — Save the intake form as markdown
Locate the client's intake doc (Drive link is usually in the repo `README.md`, or search Drive for "<Client> intake"). Read it and save to `<repo>/<Client Name> - Intake Form.md`. If no intake doc exists → note it to the user; do not fabricate one.

Tools: `mcp__claude_ai_bridgekit__read_google_doc` / `mcp__claude_ai_Google_Drive__read_file_content`.

## Step 5 — Analyze the transcript & deliver action items in chat
1. Identify the **meeting members** from `calendar_invitees` (and speakers).
2. For **each member**, extract only the commitments/next-steps **they were assigned or volunteered in the call**. Cite the timestamp. If a member made no commitments, say so — don't invent tasks.
3. Deploy into the repo task system `<repo>/tasks/tasks.json` (append objects with `id`, `description`, `assignedTo`, `status:"open"`, `priority`, `dueDate`, `createdAt`, `source:"strategy-call-transcript-<date>"`, `meetingTitle`, `notes:[{text:"Source (transcript): <quote>"}]`), then regenerate `<repo>/tasks.md` grouped by status.
4. **Present the action items directly in the chat** — grouped by member, with checkboxes, timestamps, and the source quote. **Do NOT write a `<Client Name> - Action Items.md` file.**

Convert relative dates from the call ("starting tomorrow") to absolute using the meeting date.

## Step 6 — Deliver the meeting recap in chat
**Write the meeting recap directly in the chat — do NOT save it as a local `.md` file.** Build it from the transcript + Fathom `default_summary`: purpose, the offer in the client's words, agreed campaign angles, infrastructure plan, commercials/notes, and a "Next Steps" section (the action items from step 5). Every line must trace to the transcript. Add the disclaimer: *"Generated from the Fathom transcript on <date>. Verified-source only."*

## Step 7 — Draft the client-facing recap email (Gmail draft)
Turn the recap into a warm, **client-facing** email and save it as a **Gmail draft** — **never send it.** Sending is outward-facing; the human reviews and sends.

This email is NOT the internal chat recap. Rewrite it for the client:
- **To:** the client's communication email (from the intake form / `calendar_invitees` — confirm which address they said to use). **From:** the CSM.
- **Subject:** `<Client Name> x LeadGen Jay — Strategy Call Recap` (or similar).
- **Greeting** by first name, one warm line thanking them for the call.
- **"Here's what we aligned on"** — 3–6 short bullets in plain language: the offer/positioning, the ICP & angles, the infrastructure plan, and any commercials that were stated. Client-facing tone — **no internal timestamps, no per-member task assignments, no internal jargon.**
- **"What happens next"** — what LGJ is doing now (framed as "we'll…"), and a short **"What we need from you"** list (only the client's own action items from step 5).
- Friendly sign-off from the CSM. Keep it tight — this is a confidence-builder, not a report.

Still obey rule 1: every claim traces to the transcript — do not promise numbers, timelines, or deliverables that weren't stated on the call.

```
mcp__claude_ai_bridgekit__create_email_draft(
  to="<client email>",
  subject="<subject>",
  body="<client-facing recap>"
)
```
If bridgekit's draft tool isn't available, use `mcp__claude_ai_Gmail__create_draft`. **Confirm the recipient address with the user if there's any ambiguity** (clients often have multiple emails — see Charles's `cpesince66@` vs `cpe666@`). Paste the drafted email into chat too so the user can review before sending.

## Step 8 — Report
Summarize to the user: links to the Drive Doc, the repo files written (transcript + intake form), the count of tasks deployed per member, the Gmail draft created (step 7, unsent), and anything that couldn't be pulled (rule 2). The action items and recap themselves are delivered inline in chat (steps 5–6), not as files.

## Tools used
- Fathom: REST API via `curl` (key above) — bridgekit Fathom tools if/when connected.
- Drive/Docs: `search_drive_files`, `create_file` (Google_Drive), `read_google_doc`, `move_drive_file`, `trash_drive_file`, `rename_drive_file`.
- Email: `create_email_draft` (bridgekit) or `create_draft` (Gmail) — **draft only, never send.**
- Repo: Read/Write/Edit + Bash (python for tasks.json).
