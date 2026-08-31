# Promises Checklist — methodology (post strategy call)

Produce a single markdown checklist capturing **everything LGJ promised the client** across the sales/deposit call and the strategy call, so nothing committed-to gets dropped during buildout. This is the accountability doc — the team works it until every box is checked.

**Inputs:** every meeting doc in `{repo}/Meetings/` — at minimum the **deposit/sales meeting** and the **strategy call**, plus any later meetings.
**Output file:** `{repo}/Meetings/{Full Name} - Promises Checklist.md`  (lives in the Meetings folder, not the repo root).
**Golden rule:** every item must trace to something actually said in a meeting. Do not invent deliverables, timelines, or inclusions that weren't promised. If a promise is vague, capture it verbatim and flag it rather than sharpening it.

## Step 1 — Read every meeting doc
Read all files in `{repo}/Meetings/`. The deposit/sales call and the strategy call carry different promises — the deposit call is where inclusions, pricing, timelines, and compliance commitments usually get made; the strategy call is where the build specifics (domains, warmup, tooling, targeting) get promised. Cover both.

## Step 2 — Extract every commitment
Pull anything LGJ (Jay or the team) **said they would do, provide, include, or deliver**. Capture, per item:
- the promise, in plain language;
- **who owns it** (LGJ vs. the client — track client "homework" too, in its own section);
- the **source** (which meeting + a short quote or timestamp);
- any **timeline** attached ("within 2 days", "~4 weeks", "60 days");
- any **at-no-cost / included** flag (these matter most — they're easy to forget and the client remembers them).

Look specifically for these promise types:
- **Deliverables / setup** — domains, mailboxes, warmup, CRM/GHL, logins, dashboards.
- **Inclusions** — what's bundled in the engagement (software, consulting, AI reply agents, nurture sequences).
- **At-no-cost promises** — anything Jay said he'd do personally or throw in for free.
- **Timelines** — setup, first leads, full optimization.
- **Compliance commitments** — archiving, disclaimers, ad-review, CAN-SPAM.
- **Client commitments** — materials, domains list, mechanism one-pager, approvals (their homework).

## Step 3 — Write the checklist
Write `{Full Name} - Promises Checklist.md` into `Meetings/`. Structure:
- Title + one-line purpose + source meetings (with dates).
- **LGJ Promises** grouped by category (Setup & Infrastructure · Inclusions · At-No-Cost · Timelines · Compliance), each as a `- [ ]` checkbox with owner + source quote/timestamp.
- **Client Commitments (their homework)** as its own `- [ ]` group.
- **Flags / to-confirm** — anything promised vaguely or that conflicts between the two meetings (e.g. a deal-size range stated differently on each call).

Use GitHub checkboxes (`- [ ]`) so the team can tick items as they're delivered.

## Step 4 — Commit
`git add . && git commit -m "Add {name} promises checklist" && git push`. Report the count of promises captured and any flagged conflicts between the meetings.

---

## Lessons learned (first run — Mitchell Bloom)
- The **deposit call** carried promises the strategy call never repeated — e.g. Jay building an **email-archive backend at no cost**, and the **email-archiving compliance** requirement. Miss the deposit call and you miss these entirely.
- Deal-size ranges **conflicted across the two meetings** (deposit: "$2–20M, sweet spot $5–50M"; strategy: "$2–10M, agreed $2–20M") — captured both and flagged rather than silently merging.
- At-no-cost / included items (GHL 12 months, archive backend, Jay's personal involvement) are the highest-value to track — they're what the client will hold LGJ to.
