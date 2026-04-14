# Clay Personalization Prompt Builder

Analyzes a client's offer, ICP, and email sequence, then outputs production-ready Clay prompts for prospect research and personalized cold email lines.

---

## When to Use

- Setting up Clay enrichment for a new client's outbound campaign
- Adapting personalization prompts to a different offer or ICP

---

## Inputs Needed

1. **Client offer** — What they sell, how it works, the deliverable
2. **ICP** — Who they sell to (titles, industries, size, geography)
3. **Email sequence** — The actual copy, especially Email 1 and where the personalized line sits
4. **CTA / lead magnet** — The call to action
5. **Qualifying signals** — What makes a prospect a good vs. bad fit

---

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

Write a prompt that takes the research output and generates the personalized opening for Email 1.

**Personalized line rules:**
- Read the email sequence and identify exact placement (what line comes before, what line comes after)
- Tell the AI what the line must bridge between
- Match the sequence's tone (casual/formal, short/long)
- Word budget: short emails (<5 lines) = under 20 words, medium (5-8 lines) = under 25 words, longer (8+ lines) = under 35 words
- Block these phrases: "I noticed," "I came across," "I love your," "I saw that," "I was impressed"
- The line must reference something specific AND connect it to the problem the offer solves
- Do NOT imply or assume the prospect has any problem, struggle, gap, or weakness
- Do NOT mention content repurposing, automation, or anything related to the offer itself — the body of the email handles that
- Only reference information actually found in the research input — do not fabricate details
- Output: personalized opening only, nothing else

### Step 4 (if needed): URL Finder Prompt

If the Clay table needs clean domains from company names:

```
Visit {Company Name}'s website and find their primary domain URL. Search for their official website by looking up the company name. Return only the clean root domain (e.g., companyname.com) — strip any https://, http://, www., or trailing slashes. If multiple results appear, prioritize the official company website over social media profiles, directory listings, or review sites. If no website can be found, return "Not found."
```

### Step 5 (if needed): Website-to-Company Mismatch Check

If leads were sourced from Apollo and the website may reflect the lead's employer rather than their actual business:

```
Compare the company name "{company_name}" with the website domain "{website}". Determine whether the website actually belongs to this company. Return one of:
- MATCH — the website clearly belongs to {company_name}
- MISMATCH — the website belongs to a different company (e.g., an employer, parent company, or unrelated business)
- UNCLEAR — not enough information to tell
Return only one word.
```

### Step 6 (if needed): Personalization Accuracy Verifier

To verify the personalized line references the correct company and doesn't fabricate details:

```
You are checking whether a personalized cold email line is about the correct company.

Inputs:
- Company name: {{company_name}}
- Website: {{website}}
- Research output: {{research_output}}
- Personalized line: {{personalized_line}}

Your ONLY job is to determine whether the personalized line is actually about {{company_name}} / {{website}}, or whether it appears to be about a different company entirely.

IMPORTANT: Do NOT grade whether the line's claims are perfectly defensible against the research. Only flag a line if it is clearly about the WRONG COMPANY.

Return one of:
- MATCH — The line references {{company_name}} or details consistent with that company's business.
- MISMATCH — The line references a completely different company than {{company_name}}.
- UNCLEAR — The line is too generic to tell which company it is about.

Return only one word: MATCH, MISMATCH, or UNCLEAR. No explanation.
```

---

## Output

Deliver the prompts labeled clearly, ready to copy-paste into Clay. No explanations between them.

---

## Quality Check

Before delivering:
- Research prompt targets signals specific to THIS offer (not generic)
- Personalized line prompt references exact email sequence placement
- Tone and word budget match the sequence
- The "so what?" test passes — observation connects to problem
- No AI slop phrases in the rules
- Line prompt forbids assuming pain points or mentioning the offer

---

---

# Worked Example: Sagrada AI (Phoebe Brown)

## Client Profile
- **Offer:** AI system that turns existing video content into blog posts, shorts, newsletters, and social media posts on autopilot
- **ICP:** Coaches, consultants, trainers, YouTubers, podcasters — experts who produce video content but don't distribute it consistently
- **CTA:** "Want me to send over a few sample posts built from your existing content?"
- **Key qualifying signal:** Prospect already produces video content but has inconsistent or single-platform distribution

## Email 1 (for context):

```
Hi [Name],

[PERSONALIZED LINE GOES HERE]

Most coaching businesses have hours of content sitting in Google Drive or on YouTube that never gets turned into anything.

I build AI systems that take your existing videos and content and turn them into blog posts, social posts, newsletters, and shorts. All scheduled and posted without you touching it.

I can pull from what you already have online and put together a few sample posts.

Want me to send those over?

Cheers,
Phoebe
```

---

## Research Prompt

```
Visit the company's or individual's website and social media profiles, and write a single, detailed paragraph summarizing their current content and marketing presence. Focus on identifying what types of content they already produce — such as YouTube videos, podcast episodes, webinar recordings, long-form blog posts, case studies, client testimonials, or speaking engagements — and how frequently they appear to publish across platforms like LinkedIn, Instagram, Facebook, YouTube, or their own blog. Note whether their content appears to be repurposed across multiple channels or limited to just one or two platforms. Describe the nature of their expertise, the specific audience or clients they serve, and the core service or methodology they promote. Look for signs of content inconsistency — such as gaps in posting schedules, dormant social channels, or a mismatch between the depth of their expertise and the volume of content they produce. If they have video content (YouTube, Vimeo, embedded on their site), note the approximate quantity and format (long-form talks, short clips, interviews, course previews). If you find enough information, stop searching and present a clear, factual summary in one continuous paragraph.

Write it as a natural, continuous block of text — no bullet points, headings, or formatting. The goal is to clearly explain what this person or company does, who they serve, what content assets they already have, and where the gaps are in their content distribution — in enough detail that someone could write a highly personalized outreach message referencing their exact expertise, existing content, and the untapped opportunity to repurpose it across more platforms automatically.

Avoid generic marketing language; be specific, factual, and concise. Reference actual content you find (e.g., "they have 47 YouTube videos averaging 15 minutes each but only post to LinkedIn once a month"). If any information is missing from their website or profiles, leave it out rather than guessing.

My job depends on this output being detailed and having enough information to craft a personalized cold email that references their specific content, expertise, and the gap between what they produce and how far it reaches. Please be as extensive as you can.
```

---

## Personalized Line Prompt

```
You are writing a single personalized cold email opening for Sagrada AI — an AI system that turns existing video content into blog posts, shorts, and social media posts on autopilot.

This line will be inserted at the very beginning of the first email in a 4-step cold email sequence, right before the body copy. The email opens with "Hi [Name]," and the next line after your output will be: "Most coaching businesses have hours of content sitting in Google Drive or on YouTube that never gets turned into anything." Your line must flow naturally between the greeting and that sentence — acting as a personalized bridge that makes the reader feel this email was written specifically for them.

Input:

Using the prospect's website research, write a warm, personalized opening (2-3 short sentences) that shows you actually looked into their business. Follow this structure:

1. Acknowledge something specific about their business or expertise with genuine appreciation
2. Reference a specific detail explicitly mentioned in the research (their content, clients, methodology, niche)
3. Bridge into the conversation with "Wanted to run something by you."

STRICT ACCURACY RULES:
- Only reference details EXPLICITLY present in the research input
- Do NOT imply or assume the prospect has any problem, struggle, gap, or weakness
- Do NOT mention content repurposing, automation, multi-platform, or anything related to the offer
- If the research is sparse, default to acknowledging what they do and who they serve

Rules:
- Must read naturally before "Most coaching businesses have hours of content sitting in Google Drive or on YouTube..."
- Reference their actual expertise, audience, or content — not generic compliments
- Under 40 words total
- Casual, conversational tone — like a real person writing a quick email
- Always end with "Wanted to run something by you."
- No "I noticed," "I came across," "I was impressed," "I saw"
- No special characters, quotation marks, dashes, em dashes, or emojis
- Only reference information actually found in the research. Do not fabricate details

Return only the personalized opening — nothing else.
```

---

## Why This Example Works

1. **Research prompt** targets content assets and distribution gaps — the exact problem the system solves
2. **Personalized line** references what the prospect actually does and bridges into the pitch naturally
3. **Tone** matches the casual "Cheers, Phoebe" energy of the sequence
4. **Strict accuracy rules** prevent the AI from fabricating details or assuming pain points
5. **Placement** is precise — between "Hi [Name]," and the opening pitch line
