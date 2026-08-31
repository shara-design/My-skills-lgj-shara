---
name: pc-formula
description: "Write or rewrite cold emails using the pain-first formulas — P.C. (Pain point + Call to action, 2 lines), P.E.C. (Pain/Personalization + Evidence/Case study + CTA, 3 lines), and P.P.C. (Pain point + Partial solution + CTA, value-first give). Use when the user says 'P.C. formula', 'P.E.C. formula', 'P.P.C. formula', 'pain point + CTA', 'pain + evidence + CTA', 'pain + partial solution', 'give a free tip email', 'value-first cold email', 'two-line cold email', 'short pain-first email', 'case study email', or pastes copy and asks to make it pain-point-first / punchier / evidence-backed / value-first in this style."
risk: unknown
source: user
date_added: "2026-08-19"
---

# Pain-First Formulas: P.C., P.E.C., P.P.C.

Three cold email shapes from the same family. All open on the prospect's pain, all close on a
single question. They differ in what sits between — and in what that middle beat earns you.

| | **P.C.** | **P.E.C.** | **P.P.C.** |
|---|---|---|---|
| Beats | Pain → CTA | Pain/Personalization → Evidence → CTA | Pain → **Partial solution** → CTA |
| Length | 2 paras, 35–60 words | 3 paras, 80–120 words | 2 paras, 70–95 words |
| Pain source | **Hard signal** you observed | A **fear or desire** you inferred | **Hard signal** you observed |
| Middle beat | None | A **named case study** (someone else's result) | **Real, usable advice** they can act on today, free |
| Ask | Interest only — "Want more info?" | Permission to book — "Mind if I send times?" | Direct call — "Let's do a call this week?" |
| Use when | You have per-prospect data. High volume, low-consideration offer. | No hard signal, but a strong comparable case study. | Your **expertise is the product** (agency, consulting, done-for-you) and the buyer is skeptical of claims. |

**Pick by what you actually have.**

- A real per-prospect signal, nothing to give away yet → **P.C.**
- A named, comparable case study + a defensible read on their fear → **P.E.C.**
- A real per-prospect signal **and** a genuinely useful tip you're willing to hand over free
  → **P.P.C.** (strongest ask of the three, because you paid for it first)
- None of those → don't use these formulas. Use a value-first or referral angle instead.

**The through-line:** the middle beat is what buys the size of the ask. No middle beat → you
may only ask for interest. Someone else's result → you may ask permission to book. Your own
free work → you may ask for the call directly.

---

## Before you pick: the fit check

**Read `references/when-to-use.md`** whenever you are choosing a formula for a *campaign*
(as opposed to rewriting one email). It holds the benchmark data on hook type, offer size,
ICP, length, and CTA — plus this account's own C1/C2 and Consulti numbers — and it is what
decides whether a pain-first email is the right shape at all.

Three findings from it that override everything else in this file:

**1. A generic pain statement is the worst-performing hook in cold email — 4.39% reply, vs
10.01% for a timeline hook and 8.57% for a numbers hook.** Pain-first only wins when the pain
is *timestamped* or *measured*. "Are you struggling with lead flow?" loses. "Your team was
spending on a Clutch sponsorship" wins. So: **every pain line must carry a number, a recency
marker, or both.** If you can attach neither, you do not have a pain-first campaign — say so
and pick a different angle rather than shipping a generic problem hook.

**2. Signal availability picks the formula, not preference.** Per-prospect trigger or
measurable defect → P.C. or P.P.C. (signal-triggered outreach runs 5–18%, up to 25%). No
signal but a named comparable client → P.E.C. Neither → fix the list before writing copy;
generic templates sit under 3%.

**3. Match the middle beat to the size of the ask.** A two-line P.C. under-sells a $10k DFY
engagement; a case study over-builds a $97 signup. In this account specifically, value-first
has beaten ask-first ~2.4× on identical infrastructure, and deep per-lead personalization
produced a 6× lift (1.44% vs 0.23%) on the same offer — which makes **P.P.C. the default for
LGJ's core agency/founder ICP.**

---

# Formula 1 — P.C. (Pain point + Call to action)

The shortest working cold email. No intro, no credentials, no "hope you're well," no calendar
link.

## Reference examples

**Trigger/event pain**

> Hey Andrew, noticed that Workday still hasn't found a digital sales manager - bummer.
>
> I run a cold email automation tool that can make this role irrelevant and flood you with meetings. Want me to send more info?

**Data/audit pain**

> Hey Mike, your website speed is worse than 87.6% of your competitors based on a test our dev team just conducted.
>
> We developed AI software that can drastically improve this so you can increase your sales and make more money. Want to try it out?

## Skeleton

```
Hey {{first_name}}, [specific observed pain about their company, stated as fact].

[What you have] that [kills that exact pain] so you can [outcome they want]. [One-question CTA]?
```

### Line 1 — the Pain point

- **About them, never about you.** The first 8 words = their name + their problem. Zero words
  about who you are.
- **Specific and checkable.** Something you could only know by looking. Two sources:
  - **Trigger/event** — stale job posting, recent hire, launch, funding round, expired
    listing, filing, closed location.
  - **Data/audit** — a number you measured about them.
- **Carry a number or a recency marker — this is not optional.** "still hasn't" (timeline) or "87.6%" (numbers) are the two highest-replying hook types in cold email; a pain line with neither is the lowest. See `references/when-to-use.md` §1.
- **Odd, decimal-level numbers.** `87.6%` reads as a measurement; `90%` reads as marketing.
- **Attribute measured claims.** "based on a test our dev team just conducted" pre-answers
  "says who?"
- **One human tag on frustration pain** — `- bummer.`, `- rough.` Skip it on data pain; the
  number carries the sting alone.
- **State it, don't ask it.** "noticed that X still hasn't…" not "are you struggling with…?"
- **Never fabricate.** No signal → no email. Insert `[placeholder]` and tell the user what
  data to pull.

### Line 2 — the Call to action

One sentence, three parts, then the question:

1. **What you have** — plain, first person. "I run a cold email automation tool." No "we're a
   leading provider of."
2. **The kill** — how it erases *the exact pain from line 1*, literally. Can't fill the role →
   "make this role irrelevant."
3. **The outcome** — in their language. "keep your calendar full."

Then **one interest-based question**: "Want me to send more info?" / "Want to try it out?" /
"Worth a look?"

The ask is for **interest, not time**. No call, no 15 minutes, no demo, no booking link — that
is the *reply*, not the first email.

---

# Formula 2 — P.E.C. (Pain/Personalization + Evidence + Call to action)

For when you can't measure a per-prospect number but you *can* name their fear and prove you
solved it for someone like them. Evidence buys you the meeting ask.

## Reference example

> **Subject:** Quick question
>
> Julia, I know you're worried about missing out on building personal connections and trust with your clients and prospects by solely relying on text-based emails, instead of utilizing the power of video messaging through BombBomb to humanize and strengthen your business communication.
>
> With that in mind I created a tool that will help BombBomb qualify leads faster and better connect with Real Estate Agents, Mortgage Brokers, Insurance Agents etc that come to your site like we just did for MailChimp. This could be a gamechanger for your sales team.
>
> Mind if I send over some times for a quick call?

## Skeleton

```
Subject: [1–3 plain words, sentence case]

{{first_name}}, I know you're worried about [losing/missing out on DESIRED OUTCOME] by
[their current approach], instead of [the better way — ideally framed in their own product's
language].

With that in mind I [built/created X] that will help [their company] [outcome] for
[their exact customer segments, named] like we just did for [named comparable company].
[Stakes line naming the internal beneficiary.]

[One permission-framed question]?
```

### Paragraph 1 — Pain + Personalization (their desire or fear)

- **Name only, no "Hey."** `Julia,` — direct address, slightly more serious register than P.C.
- **Mind-read the fear, don't observe a fact.** "I know you're worried about…" states their
  anxiety back to them. The alternative framing is desire: "I know you want to…"
  - Use **fear** to shake a status quo. Use **desire** for an aspirational buyer.
- **Frame it as loss, not as a problem.** "worried about *missing out on* building personal
  connections" beats "your emails aren't personal enough." Loss aversion does the work.
- **Personalize with their own vocabulary.** The example names their brand, their product, and
  their own value proposition ("the power of video messaging through BombBomb"). Using a
  prospect's marketing language back at them is the proof-of-research beat — it's what
  replaces P.C.'s hard data point.
- **One long sentence is acceptable here.** This is a fear narrative, not a data point. But
  cap it around 45 words — past that it stops being readable on a phone.
- **Only claim a fear you can defend.** A wrong mind-read reads as presumptuous and kills the
  email. Infer from their category, their business model, and what they publicly sell — not
  from imagination.

### Paragraph 2 — Evidence / Case study

Four parts:

1. **The bridge** — "With that in mind I created…" ties the solution to the fear you just
   named. Never start a new topic.
2. **The fix, named for their company** — "help BombBomb qualify leads faster." Their name in
   the solution sentence, not a generic "help companies like yours."
3. **Their ICP, spelled out** — "Real Estate Agents, Mortgage Brokers, Insurance Agents." You
   know who *their* customers are. This is the highest-signal personalization in the email;
   nobody blasting a list gets this right.
4. **The case study** — "like we just did for **MailChimp**."
   - **Named and comparable.** Same category or same buyer as the prospect. MailChimp for
     BombBomb works because both sell email software.
   - **Recent.** "just did" > "did." Freshness implies the offer is live and working.
   - **Add a number when you have one** — "cut their response time 4x." Not required; the
     name alone carries weight.
   - **Never fabricate a client.** If you can't name one, anonymize but stay specific — "a
     Series-B email SaaS with a similar agent-heavy customer base." If you have neither, use
     P.C. instead. Do not invent logos.

Close with a **stakes line** naming the internal beneficiary: "This could be a gamechanger
for your sales team." It tells them who inside their org wins, which is what they need to
forward it.

### Paragraph 3 — Call to action

- **Its own paragraph. One question. No link.**
- **Permission-framed, not a booking.** "Mind if I send over some times for a quick call?"
  asks permission to *send times* — a lower-friction yes than "grab 15 minutes here."
- P.E.C. **earns** the meeting ask because you paid for it with evidence. P.C. does not — that
  is the structural difference between the two formulas.
- Alternatives: "Mind if I send over the case study?" / "Open to a quick look?" / "Worth a
  conversation?"

### Subject line

1–3 plain words, sentence case, no hype, no personalization tokens. The body does the work.

One honest note on the example: **"Quick question" is heavily burned** — it's one of the most
sent subject lines in cold email and many buyers pattern-match it instantly. It still tests
fine in some markets, so it's usable, but treat it as a baseline to beat, not a best practice.
Prefer something that reads like internal mail: "video + inbound", "your agents", "one idea".

---

# Formula 3 — P.P.C. (Pain point + Partial solution + Call to action)

The value-first play. You spot the pain, then **actually solve a piece of it for free, in the
email, with no strings** — and only then ask for the call. The give is what earns the biggest
ask of the three formulas.

Use it when **your expertise is the product** (agency, consultant, done-for-you service) and
the buyer has heard every claim before. Demonstrating beats asserting.

## Reference example

> Hey Scott, noticed your team was spending a ton of money to sponsor Clutch - did you know that by tweaking the wording on your profile every day you can rank higher organically? The clients I've done this for have seen NO reduction in lead flow even after they stopped their sponsorships saving them thousands each month.
>
> If you like that I've got 3 more ideas for you to implement to increase your agency lead flow. Let's do a call this week?

## Skeleton

```
Hey {{first_name}}, noticed [specific observed pain — usually a cost, waste, or effort they
visibly carry] - did you know that by [SPECIFIC ACTIONABLE TIP] you can [result]? [Proof: what
happened when you did this for others, ideally counterintuitive.]

If you like that I've got [N] more ideas for you to implement to [bigger outcome].
[Direct call ask]?
```

### Paragraph 1a — the Pain point

Same rules as P.C.'s line 1 — observed, specific, checkable, stated as fact, never fabricated.

P.P.C. pain skews toward **visible spend, waste, or manual effort**: a paid directory
sponsorship, running ads on a bad landing page, a job posting for work you automate, a tool
in their stack they're clearly underusing. Those are pains where a free tip can produce
immediate, provable relief.

### Paragraph 1b — the Partial solution (the whole point of this formula)

This beat is either the strongest thing in your sequence or the thing that destroys your
credibility. There is no middle.

**Give a real lever, complete enough to act on today.**

- "by tweaking the wording on your profile every day you can rank higher organically" — that
  is a thing Scott can go do this afternoon without hiring anyone.
- Generic advice kills the email dead. "Post more on LinkedIn" / "optimize your funnel" /
  "improve your SEO" reads as filler and tells them you have nothing.
- Test it: **could they execute it without you?** If no, it's a tease, not a partial solution.

**"Partial" means one complete lever, not one withheld secret.**

- Right: hand over lever #1 in full, hold levers #2–4 for the call.
- Wrong: "there's a trick to this, get on a call and I'll tell you." Coyness reverses the
  reciprocity — you've now taken something instead of given it.
- You are not giving away the business. Execution, prioritization, and doing it consistently
  are what they'd hire you for. One tip proves you have the map; it doesn't hand them the map.

**Frame the tip as a question: "did you know that…?"**

- Opens a knowledge gap and invites a "no — tell me more" reflex.
- Reads as collegial. "You should tweak your profile wording" reads as a lecture from a
  stranger.

**Attach your own proof to the tip, immediately.**

- "The clients I've done this for have seen NO reduction in lead flow even after they stopped
  their sponsorships saving them thousands each month."
- This is *your* result from *this exact tip* — not a general case study. That is the
  difference from P.E.C.'s Evidence beat: P.E.C. proves you're credible, P.P.C. proves the
  specific advice works.
- One emphasis word in caps (`NO`) is allowed here and only here — it marks the
  counterintuitive part. More than one reads as shouting.

**Prefer the counterintuitive tip — especially one that costs them less.**

The example's tip tells Scott he can *stop paying Clutch*. Advice that reduces the prospect's
spend, argues against an obvious upsell, or contradicts what the category preaches reads as
honest in a way no testimonial can. Ask yourself: what would I tell them if I weren't selling
anything? Lead with that.

### Paragraph 2 — the Call to action

Two moves in one:

1. **The open loop with a countable number** — "I've got **3** more ideas."
   - A number beats "more ideas." Countable makes it feel like a real, finite list that
     exists.
   - Keep it 3–5. One more is thin; ten is a content library and strains belief.
   - **You must actually have them.** The call opens with those ideas or the trust you just
     built inverts. Write them down before you send.
2. **The conditional bridge** — "If you like that…" makes the ask contingent on the value
   having landed. It's a low-pressure yes-ladder: they've already agreed the first idea was
   good.

Then the **direct call ask**: "Let's do a call this week?"

- P.P.C. is the one formula that earns a straight meeting ask in email 1, because you gave
  before you asked.
- Still a question, still casual, still no link. "Let's do a call this week?" not "book time
  here."
- Alternatives: "Want the other 3?" (softest — sends the ideas, books later), "Free for 15
  this week?", "Worth walking through the rest?"

**Always A/B this CTA.** The direct call ask is the one element in these formulas that runs
against the benchmark: interest-based CTAs beat time-requests ~2× on cold first touches (12%
vs 7% reply, 68% vs 41% positive), and direct calendar asks only win *later*, once the
prospect is engaged. P.P.C.'s bet is that the free tip does that warming inside a single
email — a real bet, not a settled fact. Run "Let's do a call this week?" against "Want the
other 3?" and let the data decide. Given this account's 2.4× value-first advantage, bet on
the soft variant first.

### Why it works

Reciprocity. You did unpaid work for a stranger before asking for anything, which flips the
default posture from "what do you want from me" to "what else do you know." It also
pre-qualifies: replies come from people who read a tactical tip and wanted more, which is
exactly the buyer for an expertise-led offer.

---

# Shared rules (all three formulas)

| Rule | Why |
|---|---|
| Their name in the first 3 words | Proves it's not a blast |
| Exactly one question mark in the email — except P.P.C., where the tip's "did you know…?" makes two | Two *CTAs* = no CTA. A rhetorical setup question doesn't count as an ask. |
| Zero links, zero attachments, zero calendar embeds | Link in email 1 tanks deliverability and reply rate |
| No "I hope this finds you well," no bio, no P.S. | Every non-pain word is a cost |
| First person, plain sentences | Reads like a human, not a brochure |
| Nothing fabricated — no invented signals, numbers, clients, or tips you can't back | One caught lie ends the account |

## Deliverability check before shipping

All three reference examples lean on words that trip spam filters — "make more money," "flood
you with meetings," "drastically," "AI software," "increase your sales," "gamechanger," "a ton
of money," "saving them thousands," "free," "guarantee." The examples are teaching
illustrations, not spam-safe production copy.

Swap flagged phrasing for plain equivalents that keep the meaning:

- "make more money" → "so more of those visitors actually buy"
- "flood you with meetings" → "keep your calendar full"
- "drastically improve" → "fix"
- "this could be a gamechanger for your sales team" → "your sales team would feel it first"
- "spending a ton of money to sponsor Clutch" → "paying for a Clutch sponsorship"
- "saving them thousands each month" → "and they dropped the sponsorship line item"

Note P.P.C.'s all-caps `NO` also raises spam scores — lowercase it, or carry the emphasis with
sentence structure instead.

When the copy is going live, run it through the `mailmeteor-spam-check` skill and rewrite
anything scoring Poor — keeping the beat structure intact.

---

# Process

1. **Inventory what you actually have** before writing a word (for a whole campaign, read
   `references/when-to-use.md` first):
   - Per-prospect signal, nothing to give yet → **P.C.**
   - Named comparable case study + defensible fear read → **P.E.C.**
   - Per-prospect signal + a real tip you'll hand over free (and N more ready for the call)
     → **P.P.C.**
   - None of those → say so and recommend a different angle. Do not manufacture a signal, a
     logo, or a tip.
2. **Write the beats in order.** Pain first, always. Never start from the offer.
3. **Make the link literal.** Every later beat must reference the specific pain from beat one.
   If the middle paragraph would survive a swap of the first, the email isn't personalized.
4. **For P.P.C., pressure-test the tip.** Could they execute it today without you? Is it
   specific to their situation, not the category? Do you have the promised N follow-ups
   written down? If any answer is no, fix it or switch formulas.
5. **Cut.** Delete every word that isn't pain, personalization, evidence/tip, outcome, or the
   question. Read it aloud.
6. **Spam-pass.** Swap flagged words per above.
7. **Mark the variables.** Show which parts are merge fields with safe fallbacks, e.g.
   `{{pain_line|fallback: "your site loads slower than most of your competitors"}}`.
   For P.E.C., vary the case study per segment. For P.P.C., vary the tip per segment — one
   tip per ICP, never one tip for the whole list.

## When rewriting existing copy

Strip to the single strongest pain the copy implies, pick the formula by what evidence or
give-able value exists, rebuild from the skeleton, drop the rest. Then show the user:

1. **The rewritten email** — ready to paste, formula labeled.
2. **What got cut and why** — one line per removed element.
3. **What it depends on** — the per-prospect data (P.C.), the case study and fear read
   (P.E.C.), or the tip plus the N queued ideas (P.P.C.) that must be real, plus any
   `[placeholder]` to fill.

## When none of them fit

- No signal, no case study, no give-able tip → every opener goes generic and all three
  collapse.
- Enterprise/regulated buyers who need credibility framing before any claim.
- Follow-ups in a sequence — all three are email-1 shapes. Later steps carry new angles, the
  remaining ideas, and the harder ask.
