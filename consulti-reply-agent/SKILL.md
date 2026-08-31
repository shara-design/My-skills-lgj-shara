---
name: consulti-reply-agent
description: "Use when setting up, configuring, or building a reply agent, automated first-reply, or AI SDR in Consulti (Consultee / app.consulti.ai) for a cold email client — teaching the agent the client's offer, voice, tone, objections, and call-booking flow so interested leads get an instant grounded reply. Triggers: 'set up reply agent', 'consulti reply agent', 'automated reply in consulti', 'teach the agent your voice', 'configure the AI SDR', 'build the reply agent knowledge base', 'reply agent for [client]'."
---

# Consulti Reply Agent Setup

Configure Consulti's automated reply agent (AI SDR) for a cold email client so interested leads get an instant, on-brand first reply and follow-ups that push toward a booked call. The agent is only as good as what you feed it — this skill turns a client's repo (transcripts, intake, strategy) into a grounded agent config, then enters it into Consulti.

**Core principle:** the reply agent is grounded by its knowledge base. Every field must trace to a real source doc. Never let the agent invent pricing, stats, guarantees, or client names — a made-up number in a live reply burns a hot lead and the client's trust.

## Why this exists

Campaigns start 8am ET; many clients are Pacific and aren't in the inbox for hours, so interested leads sit cold. An automated first reply closes that gap (per Brett's onboarding: *"with an instant first reply in place, that no longer becomes an issue"*). The agent replies instantly, follows up until they answer, and books the call — but only if it's taught the offer correctly.

## Prerequisites

| Requirement | Check | Where to get it |
|---|---|---|
| Consulti login **with reply beta** | User can see the reply-agent / AI-SDR wizard at app.consulti.ai | LGJ grants beta access — a plain Consulti login does NOT include it (Brett had a login but not the beta) |
| Client repo with offer docs | `ls` the client folder for transcripts, `intake-form.md`, `strategy-call-transcript.md`, `README.md` | LGJ client repos under the clients directory |
| Chrome (for UI automation path) | `claude-in-chrome` skill available | optional — you can also generate the config for manual paste |

If the reply beta isn't visible, stop and tell the user to request beta access before continuing.

## Workflow

### 1. Read the client repo — build the offer profile

Read every offer-bearing doc in the client folder. Prioritize:
- Strategy call transcript (the offer, ICP, angles, pricing discussion)
- Onboarding call transcript (how they want replies handled, launch details)
- `intake-form.md`, `README.md` (platform, ICP, contact, live campaigns)

Extract into a profile — **cite the source for each fact, and mark anything undocumented as a gap** (do NOT fill gaps with guesses):
- **Company / brand name** and founder
- **Product one-liner** — what it does, plainly
- **ICP(s)** — one launched campaign may target several; capture each with its distinct angle
- **Mechanism** — what they actually deliver
- **Entry offer / lead magnet** — what the lead is replying *about*
- **Objections + answers** — pulled from how the client themselves talks about the offer
- **Pricing** — only if explicitly documented; otherwise mark as a gap and defer to a call
- **Proof points** — real client names/numbers ONLY if on file

> Only feed the agent the offer tied to the **launched campaigns**. If the client has other offers (e.g. a separate front-office / chatbot / content product), do NOT let the reply agent cross-sell them — different buyer, different message. Confirm which campaigns are live from `README.md` / the onboarding transcript.

### 2. Write the knowledge base

Fill in `knowledge-base-template.md` (in this skill folder) from the profile. This is the single most important field. Rules:
- Lead with the product one-liner and both/all ICPs with their angles.
- Give each top objection a one-line answer written the way the client talks.
- Include an explicit **DO NOT** block: no cross-selling other offers, no invented pricing/stats/client names, keep replies in-thread, steer to a booked call.
- Route pricing questions to "get the free audit / hop on a quick call" unless a real price is documented.

Save the finished config to the **client repo** as `consulti-reply-agent.md` so it's version-controlled and reusable if the agent is rebuilt.

### 3. Set tone + response length

The wizard's "Teach the agent your voice" step. Pick from the client's own style, don't default blindly:

| Field | Options | How to choose |
|---|---|---|
| Tone of voice | Friendly · Neutral · Matter-of-fact · Professional · Humorous | Match how the client describes themselves. Consultative/relationship-driven clients → **Friendly**. |
| Response length | Concise · Standard · Thorough | Cold-email replies should stay short and low-friction → **Concise** unless the client asks otherwise. |

State your picks and the reason in chat before entering them.

### 4. Set the SDR behavior (model, objections, follow-up, booking)

Consulti's agent is a full AI SDR, not just a canned first reply (from Brett's onboarding: it *"takes the offer, the conversation, the response style, the objections into account"*, chooses a model, checks a real calendar, proposes times, and follows up ~7–8 times until they reply). Configure, using the profile:
- **Model** — Claude unless the client prefers OpenAI.
- **Offer / context** — the knowledge base from Step 2.
- **Objection handling** — the objection→answer pairs.
- **Follow-up cadence** — enabled; multiple follow-ups until the lead replies.
- **Calendar / booking** — connect the client's real calendar if they want auto-booking; the agent's goal is a booked call.
- **Notifications / webhooks** — optional; Bison → GHL/Slack/email alerts via Zapier or N8N if requested.

Any field you can't ground from the repo → ask the client, don't guess.

### 5. Enter it into Consulti — confirmation-gated

**Automation path** (preferred when Chrome is available): invoke the `claude-in-chrome` skill, drive the user's own logged-in session to app.consulti.ai, find the reply-agent / AI-SDR builder, and fill each step. Read each screen with `get_page_text` / `find` before typing — the beta wizard's exact steps and labels change, so map fields by what's on screen rather than assuming a fixed order. Verify each field registered before advancing.

**Manual path** (beta UI not automatable, or user prefers): hand the user the finished `consulti-reply-agent.md` with each section labeled to the wizard field it fills, and walk them through paste-by-paste.

**Never activate/publish the agent without explicit approval in chat.** Show the assembled config, get a yes, then save/activate. This is a live agent that will email the client's real leads.

## Red flags — STOP

- About to type a price, stat, guarantee, or client name that isn't in a source doc → don't. Defer to a call or mark as a gap.
- About to include a second offer the launched campaigns don't sell → don't cross-sell.
- Filling a field from memory of "how these usually go" instead of this client's repo → re-read the repo or ask.
- Activating the agent before the user has seen and approved the full config → stop and show it first.

## Common mistakes

| Mistake | Fix |
|---|---|
| Knowledge base is generic AI-agency boilerplate | Ground every line in the client's actual transcript language and ICP angles |
| Agent quotes a price the client never set | Route pricing to a call; only quote documented numbers |
| Agent pitches all the client's offers | Restrict to the launched-campaign offer only |
| Config lives only in Consulti | Also save `consulti-reply-agent.md` to the client repo |
| Assumed the wizard's step order | Read each screen live; the beta changes |
