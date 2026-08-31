---
name: refund-dispute-analysis
description: Analyze a client refund request end to end and build the internal defense case and client-facing response for a cold email or agency engagement. Use this whenever a client asks for a refund, disputes results, threatens a chargeback, or wants to cancel and be made whole, and someone needs to assess eligibility against the signed contract and the actual campaign record. Trigger it for phrases like "client wants a refund", "refund request", "he's disputing the results", "build a defense", "why he's not eligible for a refund", "gather everything to defend ourselves", or any request to reconcile a contract, an intake form, email history, and campaign data into a refund position. Pulls from the signed agreement, the strategy-call transcript and intake form (the agreed-strategy baseline), every email thread with the client (the running engagement thread and the separate termination/refund-demand thread), and the sending platform (Instantly or Bison) so the position rests on verified facts rather than assumptions.
---

# Refund Dispute Analysis

## What this skill is for

A client has asked for a refund (or is threatening a chargeback / cancellation). The job is to assess whether they are contractually eligible, assemble the evidence, and produce two deliverables: an internal defense file for the decision-maker, and a client-facing response. The single most important principle is that **the analysis is only useful if it is accurate**. A defense built on claims the client can rebut with their own emails is worse than no defense, because it destroys credibility on the points that actually hold. Your value here is separating the arguments that survive contact with the record from the ones that don't.

Work through the four phases below in order. Do not skip the verification in Phase 3, even when the requester tells you the conclusion they want.

## Phase 1: Gather the four sources

Every refund case rests on four sources. Collect all four before drafting anything.

1. **The signed contract.** Usually a PDF the user uploads or has in Drive. Read it in full. Extract verbatim: the guarantee terms, the refund policy, every condition that voids the guarantee, the industry benchmark that applies to this client's offer type, the support obligations, the fee schedule (what is non-refundable), any no-oral-amendment clause, and the dispute-resolution / venue / fee-shifting clauses.
2. **The strategy-call transcript and the intake form — together, the agreed-strategy baseline.** This is the baseline the guarantee's "changed the agreed strategy" condition is measured against; without it you cannot prove a departure. Two artifacts, usually in the client's Drive folder (the intake doc typically links the recording):
   - **The intake / onboarding form** (a Google Doc). The written recap: agreed ICP, offer pillars, positioning, targeting parameters, exclusions, and the homework/promised extras (e.g. a Consulti/tool plan).
   - **The strategy-call transcript / recording** (a Google Doc titled "Transcript - ..." and/or a Fathom share link inside the intake). Read it in full. This is the higher-authority source, and it resolves the one question that decides several void conditions: **who proposed each element.** A "client changed the agreed strategy / targeting / copy" void condition only holds if the *client* drove the change. The transcript routinely shows the *company* proposed the ICP, the local/geographic campaign, the calls-only vs lead-magnet call, and the mailbox/platform decision — which converts those from swords into waiver problems. Attribute each strategy element to whoever proposed it, with a timestamp, and note explicitly whether the strategy was co-built, company-led, or client-dictated. Also capture anything the company promised on the call that isn't in the signed contract (it becomes exposure if undelivered) and any client admissions ("I'll own that one").
3. **Every email thread with the client.** Search the client's address (`from:` OR `to:`) across the whole engagement and expect **more than one thread**. A refund dispute almost always spans at least two: the running day-to-day engagement thread, and a separate, formally-titled thread the client opens for the termination / refund demand itself (e.g. "Notice of Termination and Demand for Refund"). The decisive material is split across them: the client's contract citations live in the demand thread, while the admissions that back or rebut them ("that automation only sends when you're paid in full", a targeting mistake conceded in writing) are buried in the older engagement thread. List all threads first, then read each one in full. Do not analyze only the thread the demand arrived in.

   Read **whole message bodies, not snippets**, and get the mechanics right because the obvious call fails:
   - bridgekit `get_email_thread` returns snippets only — do not rely on it for verbatim quotes. Use Gmail `get_thread` with `messageFormat: FULL_CONTENT` (find thread IDs with `search_emails` / `search_threads`).
   - A long engagement thread can exceed the token limit outright (HTML plus repeated quote chains — one real thread was 5.3M characters). When `get_thread` overflows to a file, extract clean text with `jq -r '.messages[] | "===== FROM: \(.sender) | DATE: \(.date) =====\n\(.plaintextBody)\n"'`, then strip quoted reply lines (drop lines starting with `>`, `On ... wrote:`, and signature/tracking noise) so each message shows only its new content. Read every message after stripping.

   This is where the decisive quotes live: what the client insisted on, what they declined, what the company admitted, and every dated escalation.
4. **The sending platform (Instantly or Bison).** Use the connected connector (bridgekit `get_instantly_stats`, `list_instantly_campaigns`, `get_active_instantly_clients`, or the Bison equivalents). Never paste a raw API key into a tool call; use the connected account. If the user pastes a key, tell them to rotate it. Pull lifetime sends / replies / opportunities, the campaign list with statuses and dates, and any window-specific stats you need to back a claim (e.g. the post-clinic period).

See `references/evidence-checklist.md` for the full list of facts to pull from each source.

## Phase 2: Map contract clauses to facts

Build the case clause-first. For each potentially relevant contract condition, find the specific dated fact or verbatim quote that satisfies or fails it. The structure that works:

- **The refund clause's structure.** Most guarantees are conjunctive: refund applies only if the guarantee was not met within N months AND the client followed all recommendations. Point this out explicitly. Both prongs must fail for the client's claim to succeed, so you only need one prong to hold your position.
- **The window.** Calculate whether the guarantee period has elapsed from the signature date. If it is still open, the refund remedy is not yet triggered, which is a clean, blame-free ground.
- **The voiding conditions.** For each (client changed copy, changed targeting, changed the agreed strategy, target outside the guaranteed parameters, etc.), find the evidence. Anchor "changed the agreed strategy" to the agreed-strategy baseline from Phase 1, and check attribution in the transcript first: if the company proposed the very element now cited as a departure, the condition does not hold and becomes a waiver problem — do not use it as a sword.
- **The performance benchmark.** Compute the actual opportunity rate from platform data and compare to the contract's benchmark for this offer type. Be honest about the result (see Phase 3).
- **Non-refundable fees.** Note which fees are excluded regardless of outcome.

See `references/contract-clause-mapping.md` for the common clause types and how they typically map.

## Phase 3: The honesty pass (do not skip)

This is what makes the deliverable trustworthy. Before writing, sort every candidate argument into three buckets and be explicit about which is which.

- **Holds.** Grounded in contract text plus a verified fact or quote. These lead.
- **Weak or double-edged.** Technically available but easily rebutted, or cuts both ways. Flag each with the reason. Common examples: a voiding condition the company itself accepted at onboarding (waiver argument); a disclaimer the client *declined* and the company proceeded anyway (proceeding waives it); a "client relocated" address change dressed up as a strategy change (looks petty).
- **Contradicted / do not use.** The record actually disproves it. Common traps: "client didn't reply to leads" when the record shows they replied same-day; "client rejected our recommendations" when they actually deferred to them. If the requester specifically asked for one of these angles, say plainly that it does not hold and why, and give the supportable version instead.

Also surface **the company's own exposure**: documented execution failures, admissions in writing ("that one is on us"), compliance issues, and any performance shortfall against the benchmark. The decision-maker needs these to avoid being blindsided, and to decide how firm a line to take.

Critical accuracy rules:
- Every quote is verbatim from the actual record, with a date. Verify quotes and dates against the source before using them; do not reconstruct from memory. When in doubt, grep the source.
- Never claim the performance guarantee was met if the numbers are below benchmark. The position is "not yet due and/or void", never "we hit the standard".
- Never invent a fact to fill a gap. If a claimed action (e.g. a deliverability fix) is not in the record, say so and ask the user to confirm it is documented elsewhere.
- This is contract interpretation with legal stakes. Recommend the owner or counsel review before anything goes to the client, and note the dispute-resolution venue and any fee-shifting clause.

## Phase 4: Produce the deliverables

Default to two Google Docs (or the format the user requests). Keep them strictly consistent with each other on facts and dates.

**Internal defense file** (for the owner / decision-maker). Structure:
1. Purpose and the refund ask (amount, deadline).
2. Bottom line (the grounds, one sentence).
3. The contract language relied on (verbatim, only the clauses you use).
4. Each ground, one section, contract text then dated evidence.
5. The agreed-strategy baseline (from the transcript and intake), with each key strategy element attributed to whoever proposed it.
6. Goodwill delivered beyond obligation, and the delivery/remediation record.
7. Platform performance and campaign record.
8. Candid assessment: what will not work (the contradicted bucket).
9. Our documented exposure (what the client will raise).
10. Recommended position + legal-review note.
Mark it clearly INTERNAL - DO NOT SHARE WITH CLIENT.

**Client-facing response.** Same facts, different register: factual not combative, "we" voice, warm but firm. Include the agreed strategy, the dated delivery record, the client-directed changes stated neutrally, the contractual position, and an offer to use any remaining guarantee period. Exclude everything from the "weak", "contradicted", and "exposure" buckets. Never state anything the client could disprove from their own inbox. Close with an offer to talk, not a door-slam.

See `references/document-templates.md` for the full section-by-section templates and formatting guidance.

## Style notes

- Respect the user's established client-comms style: no em dashes, "we" voice in client copy, avoid naming the sending platform in client-facing copy where practical, close client emails with "Best, [name]".
- Present the internal file's grounds strongest-first.
- When formatting the Google Docs, use one clear heading level and bold the key dates, verbatim quotes, and the conjunctive-clause point so the reader can scan.
