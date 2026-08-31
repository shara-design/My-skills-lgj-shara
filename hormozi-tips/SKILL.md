---
name: hormozi-tips
description: "Improve marketing/cold-email copy by applying Alex Hormozi's principles — the Value Equation, lead-magnet CTA, list-is-king targeting, human-first personalization, and low-friction offers. Use when the user pastes copy and wants it rewritten, tightened, or 'made more Hormozi', or says 'apply Hormozi', 'hormozi tips', 'run this through Hormozi', or asks to improve a cold email/subject line/offer using Hormozi's frameworks. Takes copy as input, applies the tips, and returns the upgraded copy in chat."
risk: unknown
source: user
date_added: "2026-07-17"
---

# Hormozi's Tips

Take copy the user provides, apply Alex Hormozi's cold-email/copywriting principles, and
return the **upgraded copy in chat**. This is an editing skill — enhance the user's copy,
don't invent a new offer or fabricate claims.

## Input

The copy to improve — a cold email, sequence, subject line, offer, opener, or CTA — pasted
by the user or pointed to in a file. If no copy is given, ask for it before proceeding.

## The Hormozi principles to apply

### 1. Value Equation (the core lens)
Score and improve every line against:

**Value = (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice)**

- **Dream Outcome ↑** — Lead with the specific result the reader wants. Cut vague benefits.
- **Perceived Likelihood ↑** — Add proof it works *for them*: a specific number, case, or
  named result. Specificity beats adjectives.
- **Time Delay ↓** — Make it feel fast. Name a short timeframe.
- **Effort & Sacrifice ↓** — Make it feel done-for-them and low-lift.

Maximize the top half in the opener/hook; minimize the bottom half in the offer and CTA.

### 2. Lead with a lead magnet, not a call
The single biggest lever. If the CTA asks for a meeting/call, propose reframing it to **give
away something of real perceived value first** (audit, diagnostic, tool, template, teardown —
"something that obviously costs money," not a generic PDF). Shift from *requesting* to
*providing*. Keep the call as the second step, not the first ask.

### 3. Be human first
The opener should reference something **specific and real** about the recipient (a hire,
launch, funding, post, listing, filing) — not a pitch. Kill generic "Hope you're well" and
one-to-many "billboard" phrasing.

### 4. The list is king
If the copy reads generic, flag that great copy on a mistargeted list fails. Tighten angle,
offer, and personalization to the specific segment. Note where a merge/personalization
variable should carry a real detail (with a safe fallback).

### 5. Low friction & one clear CTA
One ask per email. Make saying yes trivial (a reply, a "want it?", a yes/no). Remove
multi-step asks, calendar-link walls of friction, and competing CTAs.

### 6. Tighten & humanize
- Short, plain sentences. Cut hype, jargon, and filler.
- Write like one human to another, not a brochure.
- No fabricated stats, names, or claims — if a proof point is missing, insert a clearly
  marked `[placeholder]` for the user to fill, never a made-up number.

## Preserve (do not strip)
- Any required legal/compliance text or disclaimer already in the copy (e.g. IRS Circular
  230 disclosures on tax-related cold email). Keep it verbatim.
- The user's core offer, product, and any real facts/claims they provided.
- Spintax syntax and merge/personalization variables if present.

## Output format

Deliver in chat, in this order:

1. **Upgraded copy** — the full rewritten version, ready to paste. If it's a sequence,
   rewrite each email.
2. **What changed & why** — a short bullet list mapping each major edit to the principle
   behind it (e.g. "Opener now names their recent listing → Be human first / Perceived
   Likelihood").
3. **Open questions / placeholders** — any `[placeholder]` proof points or targeting details
   the user needs to supply, and one or two optional further improvements.

Keep it tight. Lead with the copy — the user wants the deliverable first, the rationale second.
