---
name: client-thread-reply
description: Review the latest email thread with a client and draft a reply to their most recent message, grounded in the client repo's full context. Pulls the client's email from the intake form, finds the newest Gmail thread with that address, reads the last ~4 messages, and delivers the reply in chat as a copyable code block (never drafts in Gmail, never sends). Trigger on "review the latest email thread with [client]", "draft a reply to [client]", "check my email with [client] and reply", "reply to the client's last email", or any request to catch up on and respond to a client's email thread.
---

# Client Thread Reply

Catch up on the newest email thread with a client and hand back a ready-to-review reply to their latest message. The skill reads the client's own repo (TASKS, messaging playbook, strategy, call notes) so the draft speaks with full context, not from a cold read of the thread alone.

**This skill writes copy only. It never creates a Gmail draft and never sends.** Per LGJ rules, no email goes out without Pablo's explicit confirmation. The output is a copyable code block in the chat that the human pastes into Gmail and sends.

---

## When to Use

- A client emailed and someone needs to reply with the full account context loaded
- Recurring "did the client say anything I need to answer?" check
- Catching up on a thread that's gone a few rounds and needs a considered response

## Required Inputs

Ask only if not provided or not derivable:
1. **Client** — which client. Used to locate the client repo (the working directory is usually already the client repo).
2. **Client email** — **the address on the intake form is authoritative.** Read it from `01_strategy/intake_form.md` (the `**Email:**` field). Do NOT use the contact CSV or any other file for this. Only fall back to `TASKS.md` `client_email:` if the intake form has no email.

Do not ask for a thread ID or Gmail account unless resolution genuinely fails.

---

## Workflow

### Step 1 — Resolve the client email from the intake form

Read `01_strategy/intake_form.md` and take the `**Email:**` value under Contact. This is the address to search Gmail for. The intake-form email is the source of truth even if a contact CSV or other file lists a different address.

Then load context so the draft is grounded. Read, in this order:
- `TASKS.md` — current phase, client name, company, what's in flight
- `01_strategy/messaging_playbook.md` — voice, positioning, ICP language
- `01_strategy/campaign_strategy.md` — what's being pitched
- most recent file in `calls/` — what was said live, tone, commitments
- `context/*.yaml` — infra/timeline facts if relevant to the reply

You do not need to read everything end to end; skim for anything that bears on what the client actually asked.

### Step 2 — Find the newest thread with that address

Search the connected Gmail for the latest thread involving the client's email:

```
mcp__claude_ai_Gmail__search_threads
  q: "from:{client_email} OR to:{client_email}"
```

Pick the thread with the most recent message. If several threads match and it's ambiguous which one the user means, list the top 2-3 by subject + date and ask which one. If zero threads match, report that plainly (search may be on the wrong Gmail account) and stop — do not fabricate a thread.

### Step 3 — Read the thread, analyze the last ~4 messages

```
mcp__claude_ai_Gmail__get_thread
  thread_id: {id}
```

Focus on the most recent ~4 messages (fewer if the thread is shorter). Establish:
- **Who sent the latest message** and whether it actually needs a reply (a bare "thanks" may not).
- **What they asked or raised** — every open question, request, or objection.
- **Commitments already made** by either side earlier in the thread.
- **Tone** — match the client's register (formal/casual, warm/brisk).

If the latest message is from the LGJ side (client hasn't replied yet), say so and ask whether the user still wants a follow-up drafted rather than assuming.

### Step 4 — Write the reply and deliver it in chat

**The chat IS the deliverable. Never create a Gmail draft, never send.** Order is strict:
1. Write the reply and output it in chat: state the to and subject above a copyable code block holding the body.
2. Wait for the user to approve or edit, then revise in chat.
3. Never call `create_draft`, `create_email_draft`, or any send tool. The user copies the approved text into Gmail themselves.

Rules for the copy:
- **No em-dashes.** Anywhere, including the subject.
- **Answer what was actually asked.** Address every open question from Step 3; do not dodge or defer without saying why.
- **Match the thread's tone and language.** If the client writes in French, or mixes languages, mirror them. Keep LGJ voice: warm, direct, competent, no filler.
- **Ground every claim in real context.** Only state things supported by the repo or the thread. If a question needs info you don't have, say the honest version ("let me confirm X and come back to you") rather than inventing an answer.
- **Never over-promise.** No timelines, prices, or commitments that aren't already on record in TASKS/calls/strategy.
- **Reply to the latest message in the thread** (preserve subject/threading), and keep it as tight as the situation allows.

### Step 5 — Output format

Deliver it so the body can be copied in one action, and note the thread it belongs to:

> **Reply on thread:** `{existing subject}` · **To:** `{client_email}` · **Subject:** `Re: {existing subject}`
>
> ```
> {reply body}
> ```

Tell the user to paste it as a reply on that thread so it threads correctly. Ending state is approved copy in the chat, nothing in Gmail.

### Step 6 — (Optional) log it

If the reply is substantive, note it in the client repo where thread history is tracked (e.g. a line in `TASKS.md` activity or a dated note), then follow the repo Git Sync Protocol. Skip for trivial replies.

---

## Guardrails

- **Never create a Gmail draft and never send.** Chat delivery only. The user copies and sends (LGJ hard rule).
- **No em-dashes** anywhere in the drafted email.
- **Intake-form email is authoritative** for which address to search — not the CSV, not guesses.
- **Never fabricate** thread contents, client questions, or facts to answer them. Everything comes from the actual Gmail thread and the client repo.
- **Never answer for another client.** If the email or thread can't be resolved for the requested client, stop and report — do not fall back to different data.
- **Don't over-commit.** Keep the draft inside what's already promised on record.
