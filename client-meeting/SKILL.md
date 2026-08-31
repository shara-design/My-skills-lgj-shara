---
name: client-meeting
description: "Lightweight client meeting processor for LGJ. Takes a meeting transcript — either pulled from Fathom or provided directly by the user — for a named client, saves it to the client's Google Drive folder as a Google Doc and to the client repo as markdown, deploys per-person tasks to the repo, then delivers the general recap, the action items, and a concise client-facing recap email (with a week-based timeline) directly in the chat. No intake form, no action-items files. Use when someone says 'recap this meeting for [client]', 'process the [client] call', 'save this transcript for [client] and recap it', or provides a transcript and a client name. For an LGJ cold email STRATEGY call that needs a client-facing recap email with a launch timeline, use 'strategy-call-recap'. For full NEW CLIENT onboarding (intake form + per-member tasks), use 'new-client'."
---

# Client Meeting

Per-meeting workflow for an existing client: **transcript (Fathom or provided) to Drive Doc + repo .md, per-person tasks, then the general recap and action items in chat.**

## Golden rules (do not violate)

1. **Never fabricate.** Every line of the recap MUST come from the transcript. Do not infer offers, numbers, names, dates, or commitments that were not stated.
2. **If something can't be found or pulled, STOP and tell the user.** Examples: Fathom returns no matching meeting, the Drive folder is missing, the API key is rejected. Emit a clear message like:
   `⚠️ Could not pull the Fathom transcript for <client> — no meeting matched "<query>". Please confirm the meeting title or attendee email, or paste the transcript directly.` Do not invent placeholder content to keep going.
3. **Naming convention — always.** Name the saved transcript with the client's full name, the document type, **and the meeting date** (`YYYY-MM-DD`):
   - `<Client Name> - Transcript - <YYYY-MM-DD>` (Drive Doc) and `<Client Name> - Transcript - <YYYY-MM-DD>.md` (repo)
   - Use the meeting's actual date (from Fathom `created_at` or the user). Always include the date so multiple meetings never collide.
   - **The recap, the action items, and the recap email are NOT saved as local `.md` files. They are delivered directly in the chat** (see steps 5 to 7). Only the transcript and the tasks get written to disk.
4. **Quote your evidence.** Each recap line should trace to the transcript (timestamp/quote).
5. **Never use em dashes.** No `—` and no `–` anywhere in the recap or any client-facing copy. Use a period, a comma, a colon, or parentheses instead.
6. **Never create a Gmail draft.** Any client-facing copy is delivered in the chat as a copyable code block. Do not call `create_draft`, `create_email_draft`, or any send tool.

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

## Step 4 — Deploy per-person tasks
Identify everyone who spoke or was invited. For each, extract only the commitments they were assigned or volunteered on this call, with the timestamp. Someone with no commitments gets an explicit "no action items" line rather than invented work.

Append to `<repo>/tasks/tasks.json` with `id`, `description`, `assignedTo`, `status:"open"`, `priority`, `dueDate`, `createdAt`, `source:"meeting-transcript-<date>"`, `meetingTitle`, `notes:[{text:"Source (transcript <ts>): <quote>"}]`. Reuse the existing id prefix in the file so ids stay unique across meetings. Regenerate `<repo>/tasks.md` grouped by person, open items first.

Convert relative dates from the call ("by end of week") to absolute using the meeting date.

## Step 5 — Deliver the general recap in chat
**Write the recap directly in the chat. Do NOT save it as a local `.md` file.** Build it from the transcript (and Fathom `default_summary` if available): purpose, key topics discussed, decisions and agreements, and anything the call left unresolved. Every line must trace to the transcript. Add the disclaimer: *"Generated from the transcript on <date>. Verified-source only."*

## Step 6 — Deliver the action items in chat
Grouped by person, with checkboxes, task ids, timestamps, and the source quote, matching what was written to `tasks.json` in step 4.

## Step 7 — Deliver the client-facing recap email in chat
**Always draft this. A meeting recap is not finished until the client email exists.** Output it in a copyable code block in the chat. Never create a Gmail draft, never send.

**Style:**
- **Shara is always the sender.** Sign every recap email "Shara", never Jay or anyone else on the call, even when the commitments in it belong to Jay. Refer to the team as "we" and name individuals only where the call assigned something specifically to them.
- Professional, warm, and polite. Write it the way an account manager writes to a valued client. Open with a brief thank you for their time, phrase asks as requests ("whenever you get a chance", "if you could send over"), and always close with exactly this line: "Please let me know if you have any questions." Do not extend it with offers to adjust, reassurances that nothing is blocking, or any other trailing clause. No slang, no hype, no exclamation points.
- Polite does not mean padded. Skip "Hope you're well" and similar filler, and keep the courtesy to a short opening line and a short closing line.
- Concise. Short labelled blocks, not paragraphs. It should read in under thirty seconds.
- **No em dashes and no en dashes.** Use a period, a comma, a colon, or parentheses.
- Skip anything the client already knows or that reads as internal chatter.
- **Never hard-wrap the text.** Each paragraph, bullet, and timeline row is one unbroken line that runs the full width. Manual line breaks inside a paragraph paste into Gmail as broken ragged text. Only break lines between blocks.

**Shape:**
```
Subject: <short and specific>

Hi <Client first name>,

<One line thanking them for their time and framing the recap.>

<Labelled blocks covering what was decided. Typical labels for a cold email build: Offer, Positioning, Targeting, Social proof, Infrastructure. One or two sentences each, each block a single unbroken line no matter how long it runs.>

Whenever you get a chance, could you send over:
1. <most important first, with a short parenthetical if it gates the build>
2. ...

Timeline
Week 1: domains and mailboxes are set
Week 2: copy sent to you for approval
Weeks 2 to 4: warmup runs while we build and validate the lists
Weeks 4 to 5: launch with A/B tests running
<any later phase, e.g. LinkedIn, as a trailing line>

Please let me know if you have any questions.
Shara
```

**Timeline rules:**
- Always include the timeline block, always last before the close.
- **Phrase it in weeks (Week 1, Weeks 2 to 4), never calendar dates.** Week 1 is the week of the call.
- The four block cadence above is the LGJ default. Only deviate if the call stated something different, and then follow the call.

Still obey rule 1: every claim traces to the transcript. Do not promise numbers, deliverables, or dates that were not stated on the call.

**Worked example** (Imran Tariq, 2026-08-11 strategy call). This is the target tone, length, and formatting. Note the courteous opener and close, the sender, and that every block is one unbroken line:
```
Subject: Strategy call recap and next steps

Hi Imran,

Thank you for your time today. Here is a summary of what we aligned on.

Offer: AI workforce positioning. Agents are rented as AI employees, with a new one deployed each month. We will not reference "SDK" in any client-facing copy.

Positioning: reverse lead magnet. We offer to configure a personalized agent for the prospect's business, delivered drag-to-install. Low friction first step, with the retainer conversation following.

Targeting: medical, legal, home services, plus coaches and speakers. US and Canada only, excluding the UK. Tech founders are on hold for now. Copy will lead with HIPAA and legal compliance, since all data stays within the client's system.

Social proof: Time Magazine once published, your WSJ bestseller, and one named home services result to test against the media angle.

Infrastructure: 17 domains off Prime Movers AI, built on our isolated name server and domain masking setup, Google mailboxes, running on Email Bison.

Whenever you get a chance, could you send over:
1. The list of your 30 agents with a one-line description of each (this drives the ICP and campaign build, so it would be the most helpful one to have first)
2. Your book with a link
3. One or two home services clients we can name, and what the agent delivered
4. The Time Magazine feature once it is live

Timeline
Week 1: domains and mailboxes are set
Week 2: copy sent to you for approval
Weeks 2 to 4: warmup runs while we build and validate the lists
Weeks 4 to 5: launch with A/B tests running
LinkedIn is layered in once we have a proven ICP and angle.

Please let me know if you have any questions.

Shara
```

## Step 8 — Report
Summarize to the user: link to the Drive Doc, the repo files written (transcript + tasks), the task count per person, and anything that couldn't be pulled (rule 2). The recap, the action items, and the recap email are delivered inline in chat (steps 5 to 7), not as files.

## Tools used
- Fathom: REST API via `curl` (key above) — bridgekit Fathom tools if/when connected.
- Drive/Docs: `search_drive_files`, `create_file` (Google_Drive), `move_drive_file`, `rename_drive_file`.
- Repo: Read/Write/Edit + Bash (python for tasks.json).
- Email: **draft only, in chat.** Step 7 always produces a client-facing recap email as a copyable code block. Never call `create_draft`, `create_email_draft`, or any send tool.
