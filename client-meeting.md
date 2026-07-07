---
name: client-meeting
description: "Lightweight client meeting processor for LGJ. Takes a meeting transcript — either pulled from Fathom or provided directly by the user — for a named client, saves it to the client's Google Drive folder as a Google Doc and to the client repo as markdown, then delivers a meeting recap directly in the chat. No intake form, no task deployment, no action-items files. Use when someone says 'recap this meeting for [client]', 'process the [client] call', 'save this transcript for [client] and recap it', or provides a transcript and a client name. For full NEW CLIENT onboarding (intake form + per-member tasks), use the 'new-client' skill instead."
---

# Client Meeting

Lightweight per-meeting workflow for an existing client: **transcript (Fathom or provided) → Drive Doc + repo .md → meeting recap in chat.**

## Golden rules (do not violate)

1. **Never fabricate.** Every line of the recap MUST come from the transcript. Do not infer offers, numbers, names, dates, or commitments that were not stated.
2. **If something can't be found or pulled, STOP and tell the user.** Examples: Fathom returns no matching meeting, the Drive folder is missing, the API key is rejected. Emit a clear message like:
   `⚠️ Could not pull the Fathom transcript for <client> — no meeting matched "<query>". Please confirm the meeting title or attendee email, or paste the transcript directly.` Do not invent placeholder content to keep going.
3. **Naming convention — always.** Name the saved transcript with the client's full name, the document type, **and the meeting date** (`YYYY-MM-DD`):
   - `<Client Name> - Transcript - <YYYY-MM-DD>` (Drive Doc) and `<Client Name> - Transcript - <YYYY-MM-DD>.md` (repo)
   - Use the meeting's actual date (from Fathom `created_at` or the user). Always include the date so multiple meetings never collide.
   - **The meeting recap is NOT saved as a local `.md` file — it is delivered directly in the chat** (see step 4).
4. **Quote your evidence.** Each recap line should trace to the transcript (timestamp/quote).

## Inputs to confirm first
- **Client name** (e.g. "David Dewey") — the user provides this.
- **Transcript source** — either:
  - the user pastes/links the transcript directly, **or**
  - pull it from Fathom (step 1).
- **Client repo path** — usually `/Users/shararamirez/Desktop/LGJ Clients/<First_Last>/`.
- **Client Drive folder** — search Drive for it (see step 2). If absent, ask before creating one.

## Step 1 — Get the transcript

**If the user provided the transcript**, use it as-is and skip to step 2.

**Otherwise, pull from Fathom (API).** The bridgekit Fathom MCP tools may report "no API key configured." In that case use the **Fathom REST API directly** with the user's key.

> Fathom API key (LGJ): `FnpeYdUWtC4CVqCQoWe1Mw.h3u2Q3U74K9UyybMEUIdb1zbrqdMgJwS06IXpclEUB8`
> Store/rotate via the user if it stops working. Header: `X-Api-Key: <key>`.

```bash
# 1a. List meetings and find the one for this client (match by title or attendee)
curl -s "https://api.fathom.ai/external/v1/meetings?limit=100" \
  -H "X-Api-Key: $FATHOM_KEY" \
| python3 -c "import sys,json;[print(i['recording_id'],'|',i['created_at'],'|',i['title']) for i in json.load(sys.stdin)['items']]"

# 1b. Pull full details for the matched recording
curl -s "https://api.fathom.ai/external/v1/meetings?include_transcript=true&include_summary=true&limit=100" \
  -H "X-Api-Key: $FATHOM_KEY" -o /tmp/fathom_all.json
```
Then extract the matching `recording_id` from `/tmp/fathom_all.json`. Useful fields:
`transcript` (list of `{speaker.display_name, text, timestamp}`), `default_summary.markdown_formatted`,
`calendar_invitees` (names/emails/`is_external`), `share_url`.

**If no meeting matches → stop and ask the user (rule 2).**

Build a clean **verbatim** markdown transcript: collapse consecutive same-speaker segments into one turn, prefix each turn with `[timestamp] Speaker:`. Keep the words as spoken — this is the transcript of record, do not paraphrase.

## Step 2 — Save the transcript to the repo
Write the verbatim transcript to `<repo>/<Client Name> - Transcript - <YYYY-MM-DD>.md` (meeting date in the filename) with a header (meeting, date, recording id if from Fathom, attendees, share link if available).

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

## Step 4 — Deliver the meeting recap in chat
**Write the meeting recap directly in the chat — do NOT save it as a local `.md` file.** Build it from the transcript (and Fathom `default_summary` if available): purpose, key topics discussed, decisions/agreements, and any next steps mentioned. Every line must trace to the transcript. Add the disclaimer: *"Generated from the transcript on <date>. Verified-source only."*

## Step 5 — Report
Summarize to the user: link to the Drive Doc, the repo file written (transcript), and anything that couldn't be pulled (rule 2). The recap itself is delivered inline in chat (step 4), not as a file.

## Tools used
- Fathom: REST API via `curl` (key above) — bridgekit Fathom tools if/when connected.
- Drive/Docs: `search_drive_files`, `create_file` (Google_Drive), `move_drive_file`, `rename_drive_file`.
- Repo: Read/Write/Edit + Bash.
