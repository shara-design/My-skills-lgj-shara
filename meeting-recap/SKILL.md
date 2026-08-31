---
name: meeting-recap
description: Draft concise client meeting recap messages from a transcript. Output is two parts - first a per-person action items breakdown (internal), then the client-facing recap email. Use this skill whenever the user wants to write a meeting recap, summarize a meeting, create a post-meeting email, send a follow-up after a call, pull out each person's tasks/action items, or turn a Fathom transcript into a client-facing summary. Trigger on phrases like "meeting recap", "recap this meeting", "summarize the call", "meeting summary", "follow-up email from the meeting", "send a recap", "pull out each person's tasks", or when a Fathom transcript or meeting transcript is provided and the user wants a summary message drafted.
---

# Meeting Recap Skill

You draft concise, action-oriented meeting recap messages for clients based on a transcript. The recap focuses on next steps and commitments rather than rehashing what was discussed.

## Output: Two Parts

Always deliver the output in this order:

PART 1 - Action Items by Person (internal)

A per-person breakdown of who committed to what. This is for the internal team, not sent to the client. Give action items for EVERYONE on the call who committed to a task - list every such attendee, each under their own plain text name header, with their tasks as bullets. Do not collapse it to a single person; if three people committed to things, all three get a header. Only include people who actually have action items. Apply the same Golden Rule here: only list tasks explicitly committed to in the transcript.

Make PART 1 detailed. This is the internal team's working list, so each task bullet should carry enough context to act on it without re-reading the transcript: the specific problem being solved, the reasoning or rationale behind the task, any concrete examples mentioned, and the deadline if one was given. Terse one-liners are not enough here. Detail lives in PART 1, brevity lives in PART 2.

PART 2 - Client Recap Email

The client-facing recap email, following the Message Structure below. This is the part that gets sent to the client.

Keep PART 2 the most concise part of the output. Tight sections, minimal bullets, forward-looking language. Strip anything the client does not strictly need to read. When in doubt, cut it. The internal detail belongs in PART 1, not here.

Separate the two parts clearly with a divider line (---) so the user can see where the internal breakdown ends and the sendable email begins.

## Before You Start

If the user hasn't provided both of these, ask for what's missing before drafting:

1. The meeting transcript (pasted text or Fathom link/content)
2. The client name(s) for the greeting

## The Golden Rule: Nothing Made Up

Every single point in the recap must be directly traceable to something explicitly said in the transcript. This is non-negotiable because the client was on the call and will immediately notice anything that wasn't discussed.

- If someone said they "might" do something, that is not a commitment. Do not list it as an action item.
- If something was discussed loosely but no one committed to doing it, do not include it as an action item.
- If you're unsure whether something was explicitly stated, leave it out. It's always better to be slightly incomplete than to include something fabricated.
- When the user asks you to verify a point, go back to the transcript and cite the approximate timestamp or quote.

## Formatting Rules

- Never use bold text (no ** markdown). Use plain text for everything including section headers.
- Never use em dashes. Use regular hyphens if needed.
- Use bullet points for items under each section.
- Keep everything concise. Each bullet should be one to two lines max.

## Message Structure

Follow this exact structure:

```
Hi [client names],


Great connecting today! Here's a quick summary of what was discussed and the action items moving forward:


[Topic Section 1]

- Bullet point
- Bullet point

[Topic Section 2]

- Bullet point
- Bullet point

[Optional closing line inviting the client to send additional input or context for next steps.]


Let us know if you have any questions!


Best,
```

Notes on the structure:

- Use plain text headers for each topic section (e.g., "Target Audience and ICP", "Timeline"). No bold, no colons.
- Leave a blank line between sections and between the header and its bullets, matching the spacing shown above.
- The closing invitation line is optional and only included if there's a specific, relevant ask (e.g., "Feel free to send us some other ideas for the copy in the following days as Michael will start working on it.").
- Always end with "Let us know if you have any questions!" followed by "Best,".

### Deadline / Timeline (Strategy Calls Only)

Include the Timeline ONLY when the meeting is a strategy call (e.g., a custom buildout strategy call, go-to-market strategy, campaign strategy kickoff). For any other meeting type (onboarding, check-in, performance review, troubleshooting, general catch-up), do NOT include the timeline at all.

When it is a strategy call, always place the Timeline as the last section at the end of the recap (right before the "Let us know if you have any questions!" line), under a "Timeline" header. Always use these exact four bullets, in this order:

- Week 1: tech setup and copywriting starts.
- Week 2: send first draft of copywriting for your review and approval; list building.
- Week 3: make adjustments on copy and lists.
- Week 4: usually launch week after warmup, but we can launch earlier depending on mailbox health.

Also always include this bullet (with the timeline, under the same section):

- Cost of mailboxes and platforms covered first 30 days, then passed along.

If you are unsure whether the meeting is a strategy call, ask the user before deciding whether to include the timeline.
- Do not include a "What We Need From You" section. Fold any requests into the optional closing line if needed.
- Do not append the Fathom recording link unless the user explicitly asks for it.

## How to Build the Output

1. Read the full transcript carefully.
2. Build PART 1 first: list every attendee who committed to a task, each under their own name header, with their tasks as bullets. Only include explicitly committed tasks.
3. Add the divider line (---).
4. Build PART 2, the client recap email: identify the key topics discussed and group related points under plain text section headers.
5. Focus on what's happening next rather than what was talked about. Use forward-looking language ("We'll do X" rather than "We discussed X"). The exception is when framing context is needed for the next steps to make sense, in which case keep it brief.
6. Fold any asks for the client into the optional closing invitation line rather than creating a separate requests section.
7. Review both parts and remove anything that cannot be traced to a specific moment in the transcript.

## After Drafting: Always Save and Push

Once the recap is drafted and shown in chat, always persist it. Do not stop at the chat message.

1. Identify the client repo (the working directory when it is that client's repo) and the client's Google Drive folder (search Drive for the client name + "folder").
2. Save the transcript and the full recap (PART 1 + PART 2) to the client repo as a markdown file, named to match the repo's existing convention (e.g. "<Meeting Type> Transcript x <Client Name> - <Month Day>.md").
3. Save the same content to the client's Google Drive folder as a Google Doc.
4. Then git commit and push the client repo with a clear message describing the recap that was added.

This save-and-push step is mandatory, not optional. Do it every time unless the user explicitly says not to.

## Tone

- Professional but warm
- Concise, not verbose
- Action-oriented
- Polite without being overly formal
- Include "please" and "thank you" naturally where appropriate

## What NOT to Do

- Do not summarize the entire meeting chronologically. Pick what matters for next steps.
- Do not include small talk, jokes, or tangential discussions.
- Do not add context or details that weren't in the transcript even if they seem helpful.
- Do not list action items that were only tentatively mentioned.
- Do not use bold text or em dashes anywhere in the message.
- Do not report on campaign performance or past results unless the user specifically asks for it. Focus on what's next.
