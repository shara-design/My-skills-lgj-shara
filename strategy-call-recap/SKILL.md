---
name: strategy-call-recap
description: "Process an LGJ cold email STRATEGY call for a client. Pulls the transcript from Fathom, saves it to the client's Google Drive folder as a Google Doc and to the client repo as markdown, deploys per-person tasks, then delivers the action items and a client-facing strategy call recap email directly in the chat. The email follows a fixed format: what we aligned on (angle ideas, targeting, setup, sending identity), a quick confirmation block for domains and mailbox name, and a four week timeline. Use when someone says 'strategy call recap for [client]', 'recap the strategy call', 'process the [client] strategy call', 'send the strategy recap', or when a kickoff or strategy call needs a client-facing recap with a launch timeline. For a routine ongoing meeting, use 'client-meeting'. For full new client onboarding with the intake form, use 'new-client'."
---

# Strategy Call Recap

Post strategy call workflow: **transcript (Fathom) to Drive Doc + repo .md, per-person tasks, then action items + client-facing recap email delivered in chat.**

This is the call where the campaign gets scoped: the offer, the angles, the targeting, the infrastructure, and the launch timeline. The output email sets the client's expectations for the next four weeks, so the timeline block is mandatory.

## Golden rules (do not violate)

1. **Never fabricate.** Every fact in the recap, the tasks, and the email MUST come from the transcript or the client's own docs. Do not infer offers, numbers, names, dates, or commitments that were not stated. If the call did not settle something, say so rather than filling it in.
2. **If something can't be found or pulled, STOP and tell the user.** Fathom returns no matching meeting, the Drive folder is missing, the API key is rejected. Emit a clear message and do not invent placeholder content to keep going.
3. **Naming convention, always.** `<Client Name> - Transcript - <YYYY-MM-DD>` for the Drive Doc and `<Client Name> - Transcript - <YYYY-MM-DD>.md` for the repo. Always include the meeting date.
4. **Quote your evidence.** Every task and every recap line carries the transcript timestamp it came from.
5. **Never use em dashes.** No `—` and no `–` anywhere in the email, the recap, or the action items. Use a period, a comma, a colon, or parentheses.
6. **Never create a Gmail draft.** The email is delivered in the chat as a copyable code block. Do not call `create_draft`, `create_email_draft`, or any send tool.
7. **Action items and the recap email are NOT saved as local `.md` files.** They go in the chat. Only the transcript and the tasks get written to disk.

## Inputs to confirm first
- **Client name**, and the client repo path, usually `/Users/shararamirez/Desktop/LGJ Clients/<First_Last>/`.
- **Client Drive folder**, found by search (step 3). If absent, ask before creating one.
- **CSM name** for the sign off. Default to the user.

## Step 1 — Pull the transcript from Fathom

> Fathom API key (LGJ): `FnpeYdUWtC4CVqCQoWe1Mw.h3u2Q3U74K9UyybMEUIdb1zbrqdMgJwS06IXpclEUB8`
> Header: `X-Api-Key: <key>`

```bash
curl -s "https://api.fathom.ai/external/v1/meetings?include_transcript=true&include_summary=true&include_action_items=true&limit=100" \
  -H "X-Api-Key: $FATHOM_KEY" -o /tmp/fathom_all.json
```

**Strategy calls are often logged as "Impromptu Zoom Meeting" with no invitees beyond the recorder.** Do not give up when the title does not match. Match on the transcript's `speaker.display_name` values instead:

```bash
python3 -c "
import json
d=json.load(open('/tmp/fathom_all.json'))
for i in d.get('items',[]):
    t=i.get('transcript') or []
    spk=[]
    for s in t:
        n=(s.get('speaker') or {}).get('display_name')
        if n and n not in spk: spk.append(n)
    print(i.get('recording_id'),'|',i.get('created_at'),'|',i.get('title'),'| speakers:',spk)
"
```

If the user pasted a Fathom URL, the `url` field (`https://fathom.video/calls/<id>`) confirms the match.

Build a **verbatim** transcript: collapse consecutive same speaker segments into one turn, prefix each with `[timestamp] Speaker:`. Do not paraphrase.

**Check diarization.** Fathom regularly swaps speakers on two person calls. Skim for turns attributed to the client that are obviously the LGJ side talking. Note the affected timestamps in the transcript header and avoid sourcing a task from a line whose speaker is in doubt.

## Step 2 — Save the transcript to the repo
Write to `<repo>/<Client Name> - Transcript - <YYYY-MM-DD>.md` with a header carrying meeting title, date, recording id, Fathom call URL, share link, speakers, and the diarization caveat if any.

## Step 3 — Save the transcript to Drive as a Google Doc
```
mcp__claude_ai_Google_Drive__search_files(query="title contains '<Client surname>' and mimeType = 'application/vnd.google-apps.folder'")
mcp__claude_ai_Google_Drive__create_file(
  title="<Client Name> - Transcript - <YYYY-MM-DD>",
  parentId="<folder id>",
  contentMimeType="text/plain",
  textContent="<verbatim transcript, markdown bold stripped>"
)
```
The API may report `fileSize: 1` on creation. **Read the file back to confirm the content landed** before reporting success.

## Step 4 — Deploy per-person tasks
Identify everyone who spoke or was invited. For each, extract only what they were assigned or volunteered, with the timestamp. Someone with no commitments gets an explicit "no action items" line rather than invented work.

Append to `<repo>/tasks/tasks.json` with `id`, `description`, `assignedTo`, `status:"open"`, `priority`, `dueDate`, `createdAt`, `source:"strategy-call-transcript-<date>"`, `meetingTitle`, `notes:[{text:"Source (transcript <ts>): <quote>"}]`. Regenerate `<repo>/tasks.md` grouped by person. Convert relative dates ("within 30 days") to absolute using the meeting date.

## Step 5 — Deliver action items in chat
Grouped by person, with checkboxes, task ids, timestamps, and the source quote.

## Step 6 — Audit what the call did NOT settle
Before writing the email, check the transcript explicitly for each of these. They decide what goes in the confirmation block, and they are the items that silently block the build:

| Item | Where it usually comes from |
|---|---|
| Mailbox sender name | Often verbal only, and the intake form field is blank |
| Domain root | Frequently never discussed. Confirm the client actually owns a root domain rather than a subdomain on a partner's site |
| Number of domains | Rarely stated. Roughly 3 mailboxes per domain |
| Mailbox count and daily volume | Usually stated by the LGJ side |
| Platform, Instantly or Bison | Usually never discussed. This is an internal decision, not a client question |

Report the gaps to the user. Client-facing gaps go in the email's confirmation block. Internal gaps stay out of the email.

## Step 7 — Deliver the client-facing recap email in chat

Output in a copyable code block. **No em dashes. No Gmail draft.** Keep it short enough to read in under thirty seconds.

```
Hi {First name},

Thanks for hopping on today.

What we aligned on:

• Angle ideas: {three or four angles from the call, comma separated, one line}. We'll split-test to see what lands.

• Who we're targeting: {job titles}, {geography}.

• The setup: {N} inboxes sending {X} to {Y} emails a day.

• Sending identity: Emails go out under {name}'s name, with {who} managing the inbox and booking the calls.

Quick confirmation:

We'll use "{root}" as the root for the sending domains and register a set of variations on it. Interested {audience} will be pointed to {destination URL}. Please confirm that works for you, along with {any open detail, e.g. the exact spelling of the mailbox name}.

Timeline:

• Week 1 ({dates}): Technical setup and copywriting begins
• Week 2 ({dates}): First draft of the copy sent for your review and approval, list building underway
• Week 3 ({dates}): Adjustments to the copy and lists based on your feedback
• Week 4 ({dates}): Launch

I've started this thread as your direct line to us. Please reply here any time.

Best,
{CSM name}
Client Success Manager, LeadGen Jay
```

State the recipient above the block: `**To:** <client email> · **Subject:** <Client Company> x LeadGen Jay — Strategy Call Recap`.

Rules for filling it in:

- **Angle ideas, not the offer.** The client knows their own offer. List the hooks the campaign will test. Name three or four, keep it to one line. Flag any angle the client declined on the call so it never reaches the copy.
- **Week 1 starts the Monday after the call**, never the day of. Compute the four Monday to Sunday ranges and check that launch week ends inside whatever timeline was promised on the call.
  ```bash
  python3 -c "
  import datetime as d
  t=d.date(YYYY,M,D)
  mon=t+d.timedelta(days=(7-t.weekday()))
  for i in range(4):
      s=mon+d.timedelta(days=7*i); e=s+d.timedelta(days=6)
      print(f'Week {i+1}: {s:%b %-d} to {e:%b %-d}')
  "
  ```
- **The confirmation block is the client-facing half of step 6.** Only ask what blocks the build and only what the client can answer. Never ask which sending platform to use.
- **Professional register.** No "just shout", no "quick one". Concise is not casual.
- **Never promise what was not said on the call.** No lead counts, no reply rates, no revenue.

## Step 8 — Report
Give the user: the Drive Doc link, the repo files written, the task count per person, the open decisions from step 6 split into client-facing and internal, and anything that could not be pulled. The action items and the email live in the chat, not in files.

## Tools used
- Fathom: REST API via `curl`.
- Drive/Docs: `search_files`, `create_file`, `read_file_content` (to verify the upload).
- Repo: Bash (python for tasks.json).
- Email: **none.** Chat delivery only.
