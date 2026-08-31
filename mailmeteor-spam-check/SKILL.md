---
name: mailmeteor-spam-check
description: >
  Local, offline port of the Mailmeteor spam checker (mailmeteor.com/spam-checker) — the exact
  769-keyword wordlist and scoring algorithm extracted from their client-side JS, verified 1:1
  against the live tool. Run it on any cold email copy to get the same Poor/Okay/Great rating,
  the flagged words by category, and an inline-annotated version of the copy. Use when writing,
  reviewing, or rewording cold email copy. Trigger on "mailmeteor check", "spam score this",
  "check this copy for spam words", "why is this scoring Poor", "reword to pass the spam checker",
  or before finalizing any outbound sequence. Complements the spam-word-checker guardrail skill:
  that one is judgment rules for writing; this one is a deterministic scorer you can re-run
  until the copy passes.
---

# Mailmeteor Spam Check (local port)

A faithful, offline reimplementation of https://mailmeteor.com/spam-checker. Their checker runs entirely client-side, so the full wordlist and scoring were extracted from `spam-checker.js` (v=20260510) and ported to a zero-dependency Python script. Output is verified identical to the live tool.

## How the scoring works (exact)

**Wordlist**: 769 case-insensitive regex keywords in 5 categories — shady (399), overpromise (103), money (101), urgency (91), unnatural (75). Includes Cyrillic homoglyph traps (e.g. `сialis`).

```
score = total keyword hits
      + 20 if ANY money or shady hit
      + 10 if ANY urgency or overpromise hit

score > 20 → Poor | score > 5 → Okay | else → Great
```

Key implication: **a single money or shady word costs 21+ points and is an instant Poor.** Killing those two categories entirely is the highest-leverage rewording move. To reach Great you also need zero urgency/overpromise words and ≤5 total hits.

## Usage

```bash
python scripts/spam_check.py --file copy.txt
python scripts/spam_check.py --text "Act now for your free bonus"
python scripts/spam_check.py --file copy.txt --json
cat copy.txt | python scripts/spam_check.py
```

Output: overall rating, numeric score, word count, flagged words grouped by category, and the copy annotated inline with `[CATEGORY]` markers after each flagged word. `--json` returns everything machine-readable (including exact character offsets per hit).

## Reword workflow

1. Run the checker on the draft.
2. Reword flagged terms, in priority order: **money/shady first** (+20), then urgency/overpromise (+10), then unnatural (+1 each).
3. Re-run until the target rating is hit.

Example swaps that took a real draft from Poor (38) to Great (1):
- "never stops" → "doesn't slow down"
- "call at all hours" → "leave voicemails at odd hours" (note: "phone" is also shady)
- "get a vendor moving" → "line up a vendor"
- "every request" → "every ticket"
- "work order" → "the job"
- "15 minute call" → "quick 15 minutes"

**Judgment call**: the wordlist flags extremely common words (`all`, `get`, `call`, `now`, `open`, `leave`). Don't contort copy into robotic phrasing just to score Great — natural spoken cadence wins replies. The realistic bar for cold email: **zero money/shady hits, Okay or better overall.**

## Files

- `scripts/spam_check.py` — the checker (Python 3 stdlib only, no dependencies)
- `scripts/mailmeteor_spam_words.json` — extracted wordlist: `{pattern, flags, keyword, category}` per entry
