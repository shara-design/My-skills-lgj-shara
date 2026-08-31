---
name: spintax-campaign-relaunch
description: Analyze the copy of an existing Bison campaign, add heavy word-level spintax to it (subjects + bodies + signature) without changing the meaning, run a make-sense check so every possible variation reads naturally, then create a brand-new "relaunch" campaign with the densified copy. Use when the user wants to add more spintax to a campaign, re-spin existing copy, densify variants, "make a relaunch", clone a campaign with fresh spintax, or asks how many variations copy produces. Trigger on "add more spintax", "re-spin this campaign", "densify the copy", "make a relaunch of X", "spin the subjects/signature too", or "how many variations do we have".
---

# Spintax Campaign Relaunch

Take an existing Bison campaign, re-spin its copy with dense word-level spintax that never
changes meaning, prove every combination reads naturally, and ship it as a new **relaunch**
campaign. The original stays untouched. This is a four-phase workflow: **Analyze → Densify →
Make-sense check → Create**.

Sending platform is **Bison** (`https://send.leadgenjay.com`, `Authorization: Bearer <workspace_token>`).
Ask the user for the workspace API token if you don't have it.

## Golden rules (do not break these)

1. **Never change the copy's meaning.** You are adding synonym choices, not rewriting. Keep the
   offer, the facts, the proof numbers, the CTA intent, and the voice exactly as-is.
2. **Never spin a variable/merge tag.** `{FIRST_NAME}`, `{COMPANY}`, `{SENDER_EMAIL_SIGNATURE}`,
   `{CITY}`, etc. stay literal. Bison does not reliably parse nested braces — spin the words
   *around* a variable, never the variable itself. No `{more in {CITY}|in {CITY}}`.
3. **Never spin a fact.** Company names, people's names, numbers ("70+ CEOs"), dates, and the
   offer are facts. A brand name in spintax = a randomly wrong company on every send. Don't.
4. **Every combination must read naturally, not just be grammatically valid.** This is the whole
   job. A slot is only allowed if *every* option is a clean drop-in in *every* combination.
5. **Word-level, not sentence-level.** Swap individual words/short phrases for synonyms. Do not
   spin whole alternate sentences — that is fewer, lower-quality variations.

## The density philosophy (tell the user this)

Spintax exists for **deliverability**: each mailbox sends a slightly different string so spam
filters don't see identical copy. That benefit is **fully saturated by a few hundred
combinations** — every mailbox already sends a unique string long before the millions. Going
denser doesn't hurt (if every option stays natural) but it is *optional optionality*, not a
needle-mover. Offer three tiers and let the user pick:

- **Middle / sweet spot (~hundreds to ~30K combos):** recommended default. Full deliverability
  win, zero quality risk.
- **High-but-safe (~hundreds of thousands to millions):** more slots, still every option
  hand-checked. "Sure, why not," not a measurable gain.
- **Max:** spin nearly every word. Real risk of "synonym soup" that reads less human. Only if
  the user insists, and still verify naturalness.

Always state the honest tradeoff. Never sell density as a deliverability upgrade past the
saturation point.

---

## Phase 1 — Analyze current copy

Pull the live sequence from the source campaign and read every step.

```
GET /api/campaigns?page=1            # find the campaign id by name
GET /api/campaigns/v1.1/{id}/sequence-steps   # full copy: subject, body, wait_in_days, variant, variant_from_step_id, thread_reply, order
GET /api/campaigns/{id}              # settings: plain_text, open_tracking, max_emails_per_day
```

Record for each step: `order`, `email_subject`, `email_body`, `wait_in_days`, `thread_reply`,
`variant`, `variant_from_step_id`. This is the structure you will replicate exactly in the new
campaign (same variants, same threading, same cadence) — only the copy gets re-spun.

Note the A/B/C structure: opener variants are `variant: true` with `variant_from_step_id`
pointing at the base opener step. Follow-ups are `thread_reply: true`.

Report what's there before touching anything (angles, sequence shape, any existing spintax).

---

## Phase 2 — Densify (add word-level spintax)

For each step, keep one clean base phrasing per sentence (preserving meaning) and insert
`{option1|option2|...}` at safe synonym points.

**Where spintax goes:**
- **Body:** greeting through the CTA. Spin verbs, adjectives, connectors, short phrases. Several
  slots per paragraph is normal for high-but-safe.
- **Subjects:** spin **lighter** than the body. Subjects are short and drive opens; a weird
  subject tanks the open rate. 2 slots is usually plenty. For opener variants (A/B/C) each has
  its own subject spin family. Follow-up steps that thread (`thread_reply: true`) inherit the
  opener's subject automatically — don't spin them; pass a clean base subject and let Bison
  prepend `Re:`.
- **Signature:** the company/person name is a **fact** and stays literal. Spin only the sign-off
  word: `{Best|Thanks|Cheers|Best regards|Talk soon},`. If mailboxes have no signature set
  (`email_signature` null), hardcode the sign-off + name + company in the body instead of
  relying on `{SENDER_EMAIL_SIGNATURE}`, and make the signature name match the from-name and the
  copy's voice.

**Format (Bison):** single-brace pipe spintax `{a|b|c}`. Body is HTML — wrap paragraphs in
`<p>...</p>` and use `<p><br></p>` for blank lines. Do NOT use Instantly's `{{RANDOM|a|b}}`.

---

## Phase 3 — Make-sense check (mandatory, this is the point)

Before creating anything, prove every combination reads naturally. Do all of these:

1. **Slot-by-slot interchangeability:** for each `{a|b|c}`, confirm every option drops into the
   surrounding sentence cleanly in *every* combination of the other slots. If one pairing reads
   off, remove that option or restructure.
2. **Watch the known traps:**
   - **Grammar-locking verbs:** e.g. "help X **build**" takes a bare infinitive; "guided/advised
     X build" is wrong (needs "to build"). Keep such verbs fixed.
   - **a / an:** if a slot follows "a"/"an", every option must start with the same
     article-sound, or spin the article too.
   - **Verb form agreement:** don't mix infinitive and gerund options ("looking to sell" vs
     "considering selling").
   - **Idiom integrity:** "runs through the owner" / "depends on the owner" both work; a swap
     that breaks the idiom doesn't.
3. **Run the spintax validator** (see `scripts/validate_spintax.py`): balanced braces, every spin
   block has a pipe, no nested braces, no empty options `{a|}`, no duplicate options `{same|same}`,
   and every brace-without-pipe is a known merge tag.
4. **Sample renders:** print 3+ random renders per step (mix of non-default options) and read
   them aloud. They must sound like a human wrote them.
5. **Count combinations** and report per step (`subject_combos × body_combos × signature_combos`).
   Remind the user a lead only ever gets one opener variant, so openers don't stack per lead.

Only proceed to Phase 4 once every step passes.

---

## Phase 4 — Create the relaunch campaign

Create a NEW campaign (never edit the original — Bison campaigns are not PATCH-editable anyway).
Name it the source name + a relaunch marker, e.g. `Sellability (Relaunch)`.

Validated API flow:

1. **Create campaign (draft):**
   ```
   POST /api/campaigns   {"name":"<Source> (Relaunch)"}   ->  data.id
   ```
   New campaigns default to `open_tracking:false` (good) but `plain_text:false` — cold email
   wants plain text ON, so flag/set it.

2. **Add the main steps in ONE call** (openers base + all follow-ups). Build the payload as a
   JSON file and `curl --data @file` to avoid shell-escaping the HTML/spintax:
   ```
   POST /api/campaigns/{id}/sequence-steps
   { "title":"<name>", "sequence_steps":[ {order,wait_in_days,thread_reply,email_subject,email_body}, ... ] }
   ```
   - `wait_in_days` must be **>= 1 on every step**, including the last (0 is rejected).
   - `thread_reply:true` auto-prepends **one** `Re:` — pass the base subject, never add `Re:`
     yourself (or you get `Re: Re:`).
   - Opener step 1: `thread_reply:false`. Every follow-up: `thread_reply:true`.

3. **GET the new step ids**, find the base opener's new id:
   ```
   GET /api/campaigns/v1.1/{id}/sequence-steps
   ```

4. **Append the opener variants in a SECOND call** — this endpoint **appends** (does not replace),
   so post the A/B/C variants referencing the base opener's *new* id:
   ```
   POST /api/campaigns/{id}/sequence-steps
   { "title":"<name>", "sequence_steps":[
       {order:5, wait_in_days:3, thread_reply:false, variant:true, variant_from_step_id:<base id>, email_subject, email_body},
       ...
   ] }
   ```
   (Verified: a second POST with `variant:true` + `variant_from_step_id` appends and links
   correctly. Verify the final structure with another GET.)

5. **Verify:** GET sequence-steps again and confirm 6 (or N) steps, variants linked to the base,
   threading correct, spintax intact, and `grep -i vistage`-style checks for any content the
   client asked removed.

**Leave it as a draft.** Do NOT attach mailboxes, set a schedule, or launch unless the user
explicitly asks — that is launch-prep, handled by the `final-pre-launch` skill. Report the new
campaign id and the pre-launch items still open.

---

## Report structure

1. **Source analysis** — sequence shape, angles, existing spintax.
2. **Densified copy** — per step: subject spintax, body spintax, signature; combo counts table.
3. **Make-sense proof** — validator result (clean/issues) + sample renders.
4. **New campaign** — id, structure table (step/role/threading/subject/combos), verification, and
   the open pre-launch items (plain text, mailboxes, schedule, leads).

## Common mistakes

| Mistake | Fix |
|---|---|
| Spinning a company/person name or a number | Keep facts literal; spin only wording around them |
| Spinning a merge tag or nesting braces | Variables stay outside braces; no `{{a|b}|c}` |
| Whole-sentence spintax | Convert to word-level synonyms for more, higher-quality variants |
| Heavy subject spin | Keep subjects light (≈2 slots); never spin threaded follow-up subjects |
| Claiming density boosts deliverability past a few hundred combos | State the honest saturation tradeoff |
| Adding `Re:` to a thread-reply subject | `thread_reply:true` already prepends one |
| `wait_in_days: 0` on the last step | Must be >= 1 everywhere |
| Second sequence-steps POST expected to replace | It appends — reference the base opener's real id for variants |
| Editing the original campaign | Always create a new relaunch campaign; originals aren't PATCH-editable |
