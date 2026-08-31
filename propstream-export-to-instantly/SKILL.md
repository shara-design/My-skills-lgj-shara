---
name: propstream-export-to-instantly
description: Turn a raw PropStream skip-traced contact export into a verified, deduped, Instantly-ready CSV. Trigger when the user has a PropStream export and wants to dedupe it, prepare a file for MillionVerifier / email verification, process verification results back into a final upload list, or asks "what columns should I keep", "which email should I use", "should I run enrichment on this", or has a CSV with Email 1 / Email 2 / Email 3 columns. Runs after propstream-list-builder finishes a leg.
---

# PropStream Export to Instantly

You take a raw PropStream skip-trace export and produce a sendable list. Three stages, and **stage 2 happens outside this session** (the user uploads to MillionVerifier and downloads results).

```
PropStream export  ──stage 1──►  VERIFY file  ──user uploads to MillionVerifier──►
FULL REPORT  ──stage 3──►  INSTANTLY UPLOAD + BATCH 2
```

Never skip verification. PropStream contact data is estimated and multi-match. Raw exports routinely carry 20-25% dead mailboxes, and sending to them burns the client's domain in week one.

## Before you touch anything

Read the export's header row first. PropStream column names shift between account types and export versions. The scripts detect columns, but confirm these exist and say what you found:

- `First Name`, `Last Name`
- `Email 1` … `Email N` (usually 4; the 4th is often entirely empty)
- `Litigator` — a serial-marketing-litigant flag
- `Property Address` / `City` / `State` / `Zip`
- `Phone 1-5` + type + DNC — kept in the archive, never in the upload

**Do not modify the raw export.** It is the only copy of the phones and mailing addresses, and re-pulling them costs skip-trace credits. Work on derived files.

## Stage 1 — build the verification file

```bash
python3 ~/.claude/skills/propstream-export-to-instantly/scripts/prepare_verify.py \
  "<raw export.csv>" "<output dir>" "<list name>"
```

It writes two files:

- `<list name> - VERIFY these emails.csv` — **this is what the user uploads**. One row per email address, carrying `owner_id` and `slot`.
- `<list name> - MAP.csv` — owner_id → name + property fields. Stage 3 joins on this. The user never touches it.

What it does, and why each rule exists:

1. **Drops rows with no email.** Nothing to send to.
2. **Drops unusable first names.** `{{firstName}}` is typically the only merge field; a broken one is a visible defect in every send.
3. **Drops Litigator-flagged rows.** Usually 3-4% of a list. Cheap insurance on cold email.
4. **Dedupes on (firstName, lastName).** One owner holding nine buildings is nine rows and one human. This is the single largest avoidable cost and the biggest spam signal — without it that person gets the same sequence nine times.
5. **Explodes to one row per email.** All slots go to verification, not just Email 1.

**Verify every slot, not just the first.** PropStream does not rank emails by quality; it lists them in vendor return order. Slot 1 is frequently a dead ISP address (AOL, Comcast, Earthlink) while slot 2 is the Gmail the person actually reads. Measured on Bloom leg A: verifying slot 1 only would have yielded ~1,500 sendable owners; verifying all three yielded 2,354. Verification runs about $0.001/email — the extra slots cost single-digit dollars and recover hundreds of owners.

## Stage 2 — the user verifies (tell them this exactly)

1. Upload the **VERIFY** file to MillionVerifier.
2. Map the **`email`** column as the one to verify. Leave `owner_id` and `slot` alone; they ride along.
3. On download, take the **full results / complete report**, not the "Good only" filter. Stage 3 needs to see `risky` and `bad` separately to decide who has nothing usable.

Quote cost as `rows × $0.001`. Never quote MillionVerifier per-email list price; bulk is far cheaper.

## Stage 3 — build the final list

```bash
python3 ~/.claude/skills/propstream-export-to-instantly/scripts/build_final.py \
  "<FULL_REPORT.csv>" "<MAP.csv>" "<output dir>" "<list name>"
```

Writes:

- `<list name> - INSTANTLY UPLOAD.csv` — **the deliverable.** One row per owner: `email, firstName, lastName, propertyCity, propertyState`.
- `<list name> - BATCH 2 (risky, hold).csv` — owners whose only surviving addresses are catch-all or unknown.

**Winner selection is not "take slot 1".** Among an owner's Good addresses the script scores each on whether the local part actually contains the owner's surname (+3) or forename (+2), and pushes role accounts like `sales@` and `billing@` to the bottom (-5). Skip trace returns household members, co-owners and former occupants mixed in with the target. `dralph87@gmail.com` and `rspieker@gmail.com` are not equally likely to reach Richard Spieker.

**Junk-name cleanup runs automatically.** PropStream sometimes writes the *property address* into the owner-name field. The script drops rows whose last name is non-alphabetic (`Bedford / 1059`, `Prospect / 337` — these are street addresses, the owner's real name is unknown) and blanks trust-vehicle abbreviations in the last-name slot (`Fml`, `Fmly`, `Lvg`, `Prpty`, `Revocabl`, `Survivors`) while keeping the row, since the first name is fine and last name is not merged.

## Reporting back

Give counts as owners, not addresses, and lead with the number that matters:

| | Owners |
|---|---|
| At least one Good email | **N** ← the deliverable |
| Risky only | N |
| All dead | N |

State the per-address Good rate separately and explain the gap: roughly half of *addresses* verify, but ~75% of *owners* have at least one good one, because each had multiple tries. That contrast is the argument for verifying every slot.

## Deliverability rules, non-negotiable

- **Send Good only.** Bad addresses are hard bounces; a 20%+ bounce rate blacklists the sending domain within days.
- **Hold Risky.** Catch-all domains accept everything and confirm nothing. They don't bounce, so they feel safe, but a dead catch-all generates zero opens and zero replies and drags engagement down just as hard. Run them as a separate low-volume batch on separate inboxes after 2-3 weeks of clean reply data.
- **One row per human, never one row per email.** Loading all three of someone's addresses means they get the sequence three times.
- **Suppress against the client's other active campaigns** before upload.
- **Watch the first ~200 sends.** Bounces above 2% despite verification means stop and re-verify, don't push volume.

## Columns

Upload file: `email`, `firstName`, `lastName`, `propertyCity`, `propertyState`. Nothing else. City and state are for send scheduling and segmentation, not merge.

Strip from the upload but **keep in the raw archive**: all phone columns, phone types, DNC flags, Litigator, Status, Company Name, and the Mail address block. The mail block has real later value — when mailing address ≠ property address you've confirmed an absentee owner, which is the thesis for most investment-property offers, and it's the input for any direct-mail or cold-call follow-up layer.

## On enrichment (Clay, waterfalls)

Default answer: **no, and say why specifically.** Clay's value is B2B — work-email waterfalls, firmographics, titles, intent — and every provider behind it is built on company data. A PropStream owner list is private individuals at personal consumer mailboxes (Gmail, Yahoo, AOL, Comcast). Waterfall providers will return almost nothing, and you pay per row for the miss.

More importantly the qualification already happened at the level that matters. For a tax-deferral or acquisition offer the question is not "who is this person" but "does this person own an appreciated, long-held, low-basis asset." PropStream answered that with owner type, years owned, equity and value band. Clay has no property records and cannot improve on it.

The one honest exception: enrichment can flag whether an owner is *also* a business owner or licensed professional, which is a cross-sell signal for a different campaign. That is not a reason to enrich before this launch.

## Worked example — Bloom Campaign 1, leg A (2026-07-31)

| Stage | Result |
|---|---|
| Raw export | 4,320 rows |
| Had ≥1 email | 3,590 (83%) |
| After name filter, litigator drop, owner dedupe | 3,213 owners / 7,753 addresses |
| Verification cost | ~$8 |
| Addresses Good | 3,761 (49%) |
| Addresses Risky / Bad | 2,104 / 1,827 |
| **Owners with ≥1 Good** | **2,354 (74%)** |
| Owners risky-only → batch 2 | 596 |
| Owners fully dead | 240 |
| After junk-name cleanup | **2,333 sendable** |

Skip trace of all 4,320 records cost **$0.00** — free credits absorbed it. Always read PropStream's Order Details panel before quoting cost; `count × $0.10` badly overstates it.
