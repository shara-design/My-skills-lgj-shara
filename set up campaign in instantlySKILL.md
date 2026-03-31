---
name: instantly-campaign-builder
description: Use this skill when asked to create a new campaign in a client's Instantly account. It navigates Instantly, creates the campaign, and applies spintax formatting to email sequence variants. Triggers when the user provides a client name, campaign name, number of variants, and sequence content.
---

# Instantly Campaign Builder

## Overview

This skill automates the creation of email campaigns in a client's Instantly account. When invoked, Claude will:

1. Log into the correct client workspace in Instantly
2. Create a new campaign with the provided name
3. Apply spintax formatting to each sequence step
4. Add all variants to the campaign sequence

---

## Required Inputs (always provided in the prompt)

- **Client name** — the Instantly workspace/account to use
- **Campaign name** — exact name to give the new campaign
- **Number of variants** — how many email variants to create per sequence step (always ask the user if not specified)
- **Sequence content** — the raw email copy to transform with spintax

---

## Spintax Rules (Instantly Format)

Apply spintax to each variant using these strict rules:

### Syntax
```
{{RANDOM | option1 | option2}}
```

- Always capitalize `RANDOM`
- Always include a space after `RANDOM` before the pipe: `{{RANDOM |`
- Limit to **2 options per spintax block** (never 3+)
- Every option must be grammatically complete and interchangeable on its own
- No partial phrases or sentence fragments as options

### What to spin
Apply spintax to:
- Greetings / openers
- Action verbs (e.g. handle/manage, learn/understand)
- Transitional phrases
- CTAs and closing lines
- Sign-off words (Best/Regards/Cheers)

### What NOT to spin
- Variables: always preserve `{{firstName}}`, `{{companyName}}`, `{{senderName}}`, and any other `{{variable}}` exactly as-is
- Numbers, statistics, or specific claims (e.g. "20%")
- Proper nouns or brand names

### Spintax Example

Input:
```
Hi {{firstName}},
I'd love to learn how you handle sales at {{companyName}}.
One of our clients recently increased sales by 20% using this approach.
Open to a quick chat next week?
Best,
{{senderName}}
```

Output:
```
{{RANDOM |Hi |Hello |Hey}} {{firstName}},
I'd love to {{RANDOM |learn |hear}} how you {{RANDOM |handle |manage}} sales at {{companyName}}.
One of our clients {{RANDOM |recently |just recently}} increased sales by 20% using this approach.
{{RANDOM |Open to a quick chat next week? |Worth a short call to walk through it?}}
{{RANDOM |Best, |Regards,}}
{{senderName}}
```

---

## Variant Sanity Check

Before adding any variant to Instantly, verify:
- [ ] Every `{{RANDOM |...}}` block has exactly 2 options
- [ ] There is a space after `RANDOM` in every block
- [ ] All original `{{variables}}` are intact and unchanged
- [ ] Reading each option independently produces a grammatically correct, natural-sounding sentence
- [ ] No spintax block splits across a word boundary or creates a broken phrase

---

## Step-by-Step Workflow

1. **Navigate** to the client's Instantly workspace
2. **Create** a new campaign with the exact campaign name provided
3. **Open** the sequence editor
4. **For each sequence step:**
   - Apply spintax to the provided copy following the rules above
   - Create the number of variants requested by the user
   - Paste each variant into Instantly's sequence step
5. **Confirm** all steps are saved before finishing

---

## Error Handling

- If the client workspace is not found, stop and ask the user to confirm the client name
- If the campaign name already exists, stop and ask the user whether to rename or proceed
- If sequence content is missing, ask the user to provide it before continuing
- If the number of variants was not specified, always ask before proceeding

---

## Notes

- Do not invent sequence content — only transform what the user provides
- Keep spintax natural; if a word doesn't have a good synonym, leave it unspun rather than force an awkward alternative
- Always preview the final variant text mentally before submitting: read the sentence with each spintax option selected to confirm it makes sense
