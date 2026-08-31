---
name: transcript-task-extractor
description: >-
  Extract action items and tasks from a meeting transcript and group them by
  person (attendee). Use this whenever the user shares a meeting transcript,
  Fathom/Zoom/Otter/Granola recording, call notes, or any multi-speaker
  conversation and asks for "tasks for each person," "action items," "who owns
  what," "next steps by person," "to-dos from this call," or "what is everyone
  responsible for." Trigger even when the user only says "give me the tasks for
  each person" or "break down the action items" and pastes or links a
  transcript. Also trigger when a Fathom transcript with ACTION ITEM markers is
  provided and the user wants those parsed and assigned to owners.
---

# Transcript Task Extractor

Turn a raw meeting transcript into a clean, owner-by-owner list of tasks. The
goal is that each attendee can read their section and know exactly what they
committed to, by when, without re-reading the call.

## When to use this

The user has a transcript (pasted text, a file path, a Fathom/Zoom/Otter link,
or a meeting they want pulled via the connected meeting tools) and wants the
work broken down per person. If they only gave a meeting name or attendee and no
text, pull the transcript first (e.g., via the Fathom/meeting tools available in
the session) before extracting.

## Core principle: assign by who *owns* the task, not who *said* it

People often state tasks on behalf of others ("I'll have Sarah send the deck")
or accept tasks said to them ("sure, I can do that"). Always attribute a task to
the person who is responsible for *doing* it, regardless of who spoke the words.
When ownership is genuinely ambiguous, list it under "Unassigned / Needs an
owner" rather than guessing — a wrong owner is worse than a flagged one.

## What counts as a task

Include:
- Explicit commitments ("I'll send the report by Friday").
- Action-item markers already in the transcript (e.g., Fathom's `ACTION ITEM:`
  lines) — parse these and assign an owner even if the line doesn't name one.
- Implied to-dos the person agreed to ("can you reconfigure the webhook?" → "yeah").
- Decisions that require a follow-up action from someone.

Exclude:
- Pure discussion, opinions, or context with no action.
- Things explicitly decided *against* ("we won't do X").
- Vague aspirations with no owner and no concrete step (note these separately
  only if the user wants a "parking lot").

## Extraction steps

1. **Identify the attendees.** List every distinct speaker. Collapse obvious
   duplicates (e.g., "Dor Shiff" and "Dor Shiff (Shifft)") into one person.
   Note their role/company if it's clear, since it disambiguates owners.
2. **Scan the whole transcript once for commitments and action markers.** Catch
   commitments, agreements, requests-accepted, and any `ACTION ITEM` / highlight
   lines. Don't stop at the first few — owners often appear late in a call.
3. **Resolve ownership** using the principle above. Re-read any "I'll have X do
   Y" or "can you…" / "sure" exchanges to pin the right owner.
4. **Capture timing.** Pull any deadline, cadence, or relative date ("next
   week," "in 1–1.5 weeks," "every two weeks"). If the transcript has an
   anchor/meeting date, convert relative dates to absolute and show both.
5. **Note dependencies and blockers** that change whether a task can start, and
   surface shared/mutual next steps (e.g., a touchpoint both agreed to).

## Output format

Use this structure. Keep each task to one line: a clear verb phrase, then a
short detail, then timing. Omit a column rather than padding it.

```
## <Person Name> (<role/company if known>)
| Task | Detail | Timing |
|---|---|---|
| <verb phrase> | <one-line context> | <deadline/cadence, or "—"> |

## Unassigned / Needs an owner
| Task | Detail | Raised by |
|---|---|---|
```

Then a short closing section:

```
### Shared next step
<Any mutual commitment, e.g., a follow-up meeting both parties agreed to.>

### Flags
<Anything the user should confirm: ambiguous owner, conflicting commitments,
a task that seems to contradict an earlier decision, or a timing conflict.>
```

Rules for a good output:
- Lead with the person who has the most/most-important tasks if there's a
  natural "owner" of the meeting's work; otherwise keep speaker order.
- Don't invent tasks, deadlines, or owners. If a deadline wasn't stated, write
  "—", not a guess.
- Mirror the transcript's own wording for the task where it's clear — don't
  re-pitch or editorialize.
- If the transcript is long or has many attendees, the table-per-person format
  still holds; just add more sections.

## Example

**Input (excerpt):** A call where Michael says he'll "check back next week and
see if there's any interested" and "schedule a touchpoint," and Dor agrees to
"reconfigure the webhook to interested-only" and "monitor the Slack channel."

**Output:**

```
## Michael Hernandez (LeadGenJay)
| Task | Detail | Timing |
|---|---|---|
| Review campaign stats & report back | Check variation-level stats for any interested leads | Next week |
| Schedule touchpoint | Set up check-in call with Dor | 1–1.5 weeks |

## Dor Shiff (Client)
| Task | Detail | Timing |
|---|---|---|
| Reconfigure webhook | Switch Bison webhook to "contact interested" only | Soon |
| Monitor Slack channel | Watch the N8N→Slack feed for interested replies | Ongoing |

### Shared next step
Touchpoint call in ~1–1.5 weeks to confirm campaigns are on track.

### Flags
None.
```

## Offer follow-ups

After delivering the breakdown, offer (don't auto-run) useful next actions that
fit the connected tools: drafting a recap message, creating calendar holds for
agreed touchpoints, or saving the task list to a doc/sheet.
