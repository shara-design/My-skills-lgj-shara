---
name: clay-personalization
description: "Analyze a client's offer, ICP, and email sequence, then output production-ready Clay prompts for prospect research and personalized cold email lines. Use when setting up Clay enrichment for any client's outbound campaign."
risk: unknown
source: "internal"
date_added: "2026-04-09"
metadata:
  version: 1.1.0
---

# Clay Personalization Prompt Builder

You analyze a client's offer and email sequence, then output Clay-ready prompts that research prospects and generate personalized opening lines.

## When to Use

- Setting up Clay enrichment for a new client's outbound campaign
- Adapting personalization prompts to a different offer or ICP

## Inputs

Gather these before writing (ask if not provided):

1. **Client offer** — What they sell, how it works, the deliverable
2. **ICP** — Who they sell to (titles, industries, size, geography)
3. **Email sequence** — The actual copy, especially Email 1 and where the personalized line sits
4. **CTA / lead magnet** — The call to action
5. **Qualifying signals** — What makes a prospect a good vs. bad fit

## Process

### Step 1: Analyze the Offer

Identify:
- The core problem the offer solves
- What signals on a prospect's website would indicate they have that problem
- What specific details from the prospect's business would make an email feel written just for them

### Step 2: Build the Research Prompt

Write a prompt that tells Clay AI to visit the prospect's website and extract signals relevant to THIS client's offer.

**Adapt the research focus to the offer:**

| Offer Type | What to Research |
|---|---|
| Content/social media automation | Content assets, posting frequency, platform gaps, video content |
| Lead gen / outbound | Sales process, team size, hiring signals, tools used |
| AI/automation tools | Manual processes, bottlenecks, tech stack |
| Marketing services | Marketing channels, brand presence, ad signals |
| Recruiting/HR | Job postings, team growth, hiring velocity |
| SaaS/software | Tech stack, integrations, workflow tools |

**Research prompt rules:**
- Output must be one continuous paragraph, no formatting
- Specific and factual — reference actual things found (e.g., "47 YouTube videos")
- Skip anything not found rather than guessing
- End with: "My job depends on this output being detailed and enough information to create prompts based off the output. Please be as extensive as you can."

### Step 3: Build the Personalized Line Prompt

Write a prompt that takes the research output and generates ONE sentence for Email 1.

**Personalized line rules:**
- Read the email sequence and identify exact placement (what line comes before, what line comes after)
- Tell the AI what the line must bridge between
- Match the sequence's tone (casual/formal, short/long)
- Word budget: short emails (<5 lines) = under 20 words, medium (5-8 lines) = under 25 words, longer (8+ lines) = under 35 words
- Block these phrases: "I noticed," "I came across," "I love your," "I saw that"
- The line must reference something specific AND connect it to the problem the offer solves
- Output: single sentence only, nothing else

### Step 4 (if needed): URL Finder Prompt

If the user needs clean domains from company names, include:

```
Visit {Company Name}'s website and find their primary domain URL. Search for their official website by looking up the company name. Return only the clean root domain (e.g., companyname.com) — strip any https://, http://, www., or trailing slashes. If multiple results appear, prioritize the official company website over social media profiles, directory listings, or review sites. If no website can be found, return "Not found."
```

## Output

Deliver the prompts labeled clearly, ready to copy-paste into Clay. No explanations between them.

## Quality Check

Before delivering:
- Research prompt targets signals specific to THIS offer (not generic)
- Personalized line prompt references exact email sequence placement
- Tone and word budget match the sequence
- The "so what?" test passes — observation connects to problem
- No AI slop phrases in the rules

## Reference

See [references/examples.md](references/examples.md) for a fully worked example (Sagrada AI / Phoebe Brown).
