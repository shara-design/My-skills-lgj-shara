---
name: blacklist-check
description: Check whether client sending domains are blacklisted (burned) and produce a listed/clean report. Use when someone provides a list of domains, a mailbox list, a CSV export of sender emails, or an API/portal source of domains and wants to know which are blacklisted. Triggers on "blacklist check", "are these domains blacklisted", "check if domains are burned", "run domains against SURBL/MXToolbox", "check sending domains", "domain health check for [client]".
---

# Blacklist Check

Check any number of client sending domains against email blacklists and report which are
**LISTED (burned)** vs **CLEAN**. This runs the exact same DNS blacklist (DNSBL) lookups
MXToolbox performs — but locally, in bulk, with no rate limit or captcha — so you can check
hundreds of domains in seconds instead of pasting them one at a time.

## When to use this

- A coworker hands you a **domain list**, a **mailbox list** (`dor@getshifft.com`), or a **CSV
  export** of sender emails (e.g. from Bison, Instantly, or the portal) and asks which domains
  are blacklisted.
- You have **API/portal access** to a client's mailboxes and need to pull the domains and check them.
- Any "is this client's domains burned / blacklisted / listed on SURBL" question.

## The core idea (so you can explain results)

A blacklist check is just a **DNS lookup**. You take the domain, append the blacklist's zone,
and ask DNS to resolve it:

```
withshifft.com   →   query:  withshifft.com.multi.surbl.org
```

- Comes back with a `127.0.0.x` IP → the domain is **LISTED**. `127.0.0.64` = the "abuse" list.
- Comes back empty / NXDOMAIN → **CLEAN**.

No login, no scraping — a yes/no DNS question. That's the whole mechanism.

**The main list we check is SURBL multi.** For cold-email *domain* reputation it's the list
that matters, and it's the one that reliably answers from a normal network. (IP blacklists like
Spamcop/Barracuda are about the *sending IP*, not the domain, so we don't need them for a
"is this domain burned" check.)

## How to run it

The bundled script `dblcheck.sh` handles everything: extracting domains from whatever input
you give it, deduping, checking in parallel, and reporting.

```bash
cd ~/.claude/skills/blacklist-check

# Works on ANY of these input types — no preprocessing needed:
./dblcheck.sh domains.txt          # raw domains, one per line
./dblcheck.sh mailboxes.txt        # mailbox list (pulls domain after @)
./dblcheck.sh sender-export.csv    # full CSV export (pulls the Email column, dedupes)

# CSV output (for a master sheet):
./dblcheck.sh sender-export.csv csv > results.csv
```

If the coworker gives you the domains/mailboxes pasted in chat, save them to a file first
(scratchpad is fine), then run the script on that file.

### Reading the output

Each domain returns one of three states:

| Result | Meaning |
|--------|---------|
| `LISTED:127.0.0.64` | **Burned** — on SURBL's abuse list. Real listing. |
| `CLEAN` | Not listed (got a definitive not-listed answer from SURBL). |
| `UNKNOWN` | SURBL timed out or rate-limited — **not** confirmed clean. Re-run those. |

The script already retries and **never reports a timeout as CLEAN** — that's the #1 mistake
to avoid. A blocked/refused response (`127.0.0.1` = "query refused", `127.0.0.254` = "resolver
blocked") is treated as UNKNOWN, not as a listing and not as clean.

## Verify before reporting (do this every time)

DNS can misbehave, so confirm the run is trustworthy before you send a report:

1. **Spot-check a couple of LISTED domains' TXT records** — a real listing carries a text reason:
   ```bash
   dig +short getshifft.com.multi.surbl.org TXT
   # → "Blocked, getshifft.com on lists [abuse], ..."
   ```
   The TXT names the *exact* domain. If it does, the listing is real (not a wildcard/false positive).

2. **Check a known-clean control** returns CLEAN, so you know the checker discriminates:
   ```bash
   dig +short google.com.multi.surbl.org A     # → (empty = clean)
   ```

3. **Re-run any UNKNOWNs** — usually a transient SURBL timeout; they resolve on a second pass.

If a whole batch comes back CLEAN, double-check with a TXT + control before trusting it — that's
exactly when a silent resolver problem hides real listings.

## Coverage & limits (state these honestly in reports)

- **We check SURBL** (and Spamhaus DBL *if* a DQS key is set — see below). A **CLEAN** means
  "clean on SURBL," not "clean on every list in existence." So far, in this environment, SURBL
  is the list that catches burned cold-email domains, so it's the right primary check.
- **Spamhaus is blocked from normal networks** without a key. To add it: register a free
  **Spamhaus DQS key** at spamhaus.com, then `export SPAMHAUS_DQS_KEY=yourkey` before running —
  the script auto-adds Spamhaus DBL and, as a bonus, the private zone removes rate-limiting so
  big batches run faster and with fewer UNKNOWNs.
- **SORBS is dead** (shut down in 2024) — ignore any tool still listing it.

## Producing the report

Give the coworker/client a clean summary, not raw dig output. Per client:

- A **table**: domain → LISTED / CLEAN, with the abuse note for listed ones.
- A **count**: e.g. "17/17 domains LISTED on SURBL (abuse)".
- If checking many clients, keep a **running master CSV** (`client,domain,status`) so there's one
  sheet to act from — generate it with the `csv` output mode.

## What a SURBL listing means (so your report is actionable)

SURBL is a **domain/URI** blacklist — it lists domains that appear inside spam (From address,
links, signature). Receiving filters (SpamAssassin, Cloudmark, many corporate gateways) score
mail carrying a listed domain as spam → it lands in spam or gets blocked. For a cold-email
sending domain, a SURBL abuse listing is a **real deliverability problem**, not a minor flag.

**Standard recommendation for a burned sending domain:**
- **Pause sending on it** — every send deepens the listing, can escalate to Spamhaus, and hurts
  the shared sending-IP reputation (which can spill onto *other* clients on the same infrastructure).
- **Retire, don't rehabilitate.** These are disposable sending domains; delisting rarely sticks
  for a domain that got listed *because* of outbound. Replace it.
- **Fix the root cause before buying replacements.** Domains burn from the *sending inputs*, not
  the domain itself: never-sent domains stay clean, domains burn after only a couple hundred sends.
  Prime suspects: **list quality (spam traps / unverified data → high bounces)**, spammy copy, and
  too-fast warmup/volume. Replacing domains without fixing the cause just re-burns the new ones.
  Related skills for the audit: `bison-mailbox-health`, `mailmeteor-spam-check`, `list-optimize`.

**Note on "we still get replies from listed domains":** possible and normal — a blacklist is a
scoring signal, not a universal block. Not every receiver checks SURBL, and high send volume ×
a low inbox rate still yields some replies. It means the channel is working at a *fraction* of
its potential and degrading over time — not that the domains are fine.

## Quick end-to-end example

```bash
cd ~/.claude/skills/blacklist-check
# coworker pasted a Bison export → saved as client.csv
./dblcheck.sh client.csv
# spot-verify
dig +short <one-listed-domain>.multi.surbl.org TXT
dig +short google.com.multi.surbl.org A
# → report: "14/17 domains LISTED on SURBL (abuse); 3 clean. Recommend pausing the
#    listed domains and replacing after a list-quality audit."
```
