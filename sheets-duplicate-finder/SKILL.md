---
name: sheets-duplicate-finder
description: Identify and flag duplicate contacts (emails, phone numbers, names) between tabs in a Google Sheet by adding a "Duplicated" column powered by an ARRAYFORMULA + COUNTIF. Use whenever the user wants to compare two tabs for overlap, dedupe a contact list against a master list, find emails that appear in both tabs, flag duplicates between scrapes / Apollo / Bison / Instantly exports, or any prompt like "check duplicates between tab X and tab Y", "find overlaps", "flag rows that already exist in", "clean this list against", or shares a Google Sheets URL and mentions duplicates / overlap / dedupe / matching contacts.
---

# Sheets Duplicate Finder

Flag rows in one Google Sheet tab whose key column value (typically email) also appears in another tab. The output is a new column with the literal string "duplicated" on matching rows and empty cells on the rest, so the user can filter, sort, or delete in the UI.

## When to use this

Trigger on prompts like:
- "Check for duplicates between [tab A] and [tab B]"
- "Find overlaps in the email column"
- "Flag rows in this tab that already exist in [other tab]"
- "Clean this new scrape against our master list"
- "Mark duplicated contacts in [sheet]"

Also use when the user shares a Google Sheets URL and mentions duplicates, dedupe, overlap, or matching even if they don't explicitly say "find duplicates".

## Why an ARRAYFORMULA, not chunked writes

The tempting approach is to compute duplicates locally and write the results back as static values. For lists over a few hundred rows this fails: the bridgekit `update_spreadsheet` tool requires the entire `values` array to be passed inline, and large arrays exceed tool-call size limits or get hand-miscounted, producing "tried writing to row [N]" errors.

A single ARRAYFORMULA cell, written once, computes every row server-side and never hits those limits. It also stays live, so if the user adds rows or edits emails, the flags update automatically.

## Workflow

### 1. Identify the two tabs and the key column

Ask the user which tab is the **target** (gets the new Duplicated column) and which is the **reference** (the existing list to compare against). If unclear, default to: the newer / smaller / more recently scraped tab is the target, and the existing master list is the reference. Confirm before writing.

Read row 1 of both tabs to find the key column. Email is the default key, but accept Phone, LinkedIn URL, or whatever the user names. Both tabs must share the same kind of key, but the columns don't need to be in the same position.

```
read_spreadsheet(spreadsheet_id, "<tab name>!A1:Z1")
```

### 2. Find the data range

Call `list_sheets_in_spreadsheet` to get each tab's `rowCount`. That's the upper bound for the formula range. You don't need to find the exact last row of data, just an upper bound, since the formula skips empty cells.

### 3. Pick the output column

Use the first empty column to the right of the existing headers. Write `Duplicated` to row 1 and the ARRAYFORMULA to row 2.

### 4. Write the formula

Use one `update_spreadsheet` call writing two cells: the header and the formula.

```
range_name: "<target tab>!<col>1:<col>2"
values: [["Duplicated"], ["=ARRAYFORMULA(IF(<key>2:<key><N>=\"\",\"\",IF(COUNTIF('<reference tab>'!$<key>$2:$<key>$<M>,<key>2:<key><N>)>0,\"duplicated\",\"\")))"]]
```

Where:
- `<col>` = the new Duplicated column letter (e.g. `I`, `R`, `G`)
- `<key>` = the key column letter (usually `C` for Email)
- `<N>` = upper bound row count of the target tab
- `<M>` = upper bound row count of the reference tab

Example for target "Ready-PSpeakers" (Email in C, going to col I, 3631 rows) checked against reference "Gundi - Speakers" (Email in C, 7669 rows):

```json
{
  "range_name": "Ready-PSpeakers!I1:I2",
  "values": [
    ["Duplicated"],
    ["=ARRAYFORMULA(IF(C2:C3631=\"\",\"\",IF(COUNTIF('Gundi - Speakers'!$C$2:$C$7669,C2:C3631)>0,\"duplicated\",\"\")))"]
  ]
}
```

### 5. Verify

Spot-check by reading 5-10 rows from the new column. If the user wants an exact duplicate count, pull both key columns locally (large columns will go through the tool-results file, then `jq` + `awk` to count):

```bash
jq -r '.[0].text | fromjson | .values[][]' <tool-result-file> \
  | tr '[:upper:]' '[:lower:]' | awk 'NF' | sort -u > /tmp/keys.txt
awk 'NR==FNR{a[$0]=1;next} ($0!="" && ($0 in a))' /tmp/ref_keys.txt /tmp/target_keys.txt | wc -l
```

Report the count and a few sample duplicate values to the user.

## Sheet name quoting — the part that bites

Sheet names with apostrophes, spaces, or punctuation need careful handling, and the rules differ between the `range_name` parameter and the formula body:

**In `range_name`:** use the plain sheet name with a single apostrophe. `Gundi's 1st!I1:I10` works. The bridgekit tool wraps and escapes it internally. Do NOT pre-escape apostrophes or wrap in single quotes yourself for `range_name`.

**Inside the formula body:** sheet names with spaces or special characters must be wrapped in single quotes, and any internal apostrophe must be doubled. So `Gundi's 1st` becomes `'Gundi''s 1st'` inside the COUNTIF.

**Single-cell ranges:** `update_spreadsheet` rejects bare cell references like `I909`. Use `I909:I909`.

**If a write suddenly fails with "Unable to parse range":** the user may have renamed the tab mid-session. Re-fetch tab names with `list_sheets_in_spreadsheet` and retry.

## Case sensitivity

`COUNTIF` is case-insensitive by default, which matches what users want for emails. If the user needs a case-sensitive comparison (rare), swap COUNTIF for `SUMPRODUCT(EXACT(...))`:

```
=ARRAYFORMULA(IF(C2:C3631="","",IF(SUMPRODUCT(EXACT('Reference'!$C$2:$C$7669,C2:C3631))>0,"duplicated","")))
```

But default to COUNTIF.

## Comparing more than two tabs

If the user wants to flag rows duplicated against multiple reference tabs at once, nest COUNTIFs with addition:

```
=ARRAYFORMULA(IF(C2:C3631="","",IF((COUNTIF('Ref A'!$C$2:$C$7669,C2:C3631)+COUNTIF('Ref B'!$C$2:$C$5000,C2:C3631))>0,"duplicated","")))
```

## After flagging — common follow-ups

The user will often ask one of these next, so be ready:

- **"Delete the duplicates"** — they want the duplicated rows removed from the target tab. Use `delete_spreadsheet_rows` working bottom-up (highest row first) so indices don't shift. Confirm before deleting since it's destructive. Or simpler: tell them to filter the Duplicated column = "duplicated", select rows, right-click delete — usually faster than scripting it.

- **"How many duplicates?"** — give a count via COUNTIF in a helper cell, or via the local `jq`+`awk` verification from step 5.

- **"Show me the duplicates"** — filter or sort by the Duplicated column and read a sample back.

## What NOT to do

- Don't compute duplicates locally and write back 3,000+ static values via chunked `update_spreadsheet` calls. It's slow, fragile, and hand-counting JSON arrays leads to off-by-one errors that produce "tried writing to row [N]" failures.
- Don't use `clear_spreadsheet_range` on a tab with apostrophes in its name — the range parser fails. Just overwrite with `update_spreadsheet` instead.
- Don't pick a column index without first reading row 1 of the target tab. You'll clobber data.
- Don't assume the tab name from the URL fragment matches the actual tab title — call `list_sheets_in_spreadsheet` to get the real names.
