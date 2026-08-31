# LGJ Cold Email Skills

Claude Code Agent Skills for the Lead Gen Jay cold email operation — strategy, copy,
list building, deliverability, platform APIs, and client ops.

Each skill is a directory containing `SKILL.md` plus any scripts or reference files.

## Install

Copy any skill directory into your Claude Code skills folder:

```bash
git clone https://github.com/shara-design/My-skills-lgj-shara.git
cp -r My-skills-lgj-shara/cold-email-strategy ~/.claude/skills/
```

Or install the whole cold email stack:

```bash
cp -r My-skills-lgj-shara/*/ ~/.claude/skills/
```

Then invoke in Claude Code with `/skill-name` or let the description trigger it.

## Strategy & Copy
| Skill | What it does |
| --- | --- |
| [`cold-email-quickstart`](cold-email-quickstart/) | First-run wizard that walks users from zero to a launched cold email campaign by chaining 8 specialist skills with user-confirmation gates between… |
| [`cold-email-strategy`](cold-email-strategy/) | Cold email strategy development: discovery interview, ICP profiling, offer positioning, and messaging angles. Explicitly ingests transcripts… |
| [`cold-email`](cold-email/) | Write cold email sequences with copy constraints, spintax, and deliverability rules. Reads strategy from workspace if available, or works standalone.… |
| [`cold-email-copywriting`](cold-email-copywriting/) | Write cold email sequences with copy constraints, spintax, and deliverability rules. Reads strategy from workspace if available, or works standalone.… |
| [`cold-email-ab-testing`](cold-email-ab-testing/) | Full lifecycle A/B testing for cold email campaigns. Pre-launch: generate body and subject line variants with minimum thresholds (3/2/2/2) and… |
| [`pc-formula`](pc-formula/) | Write or rewrite cold emails using the pain-first formulas — P.C. (Pain point + Call to action, 2 lines), P.E.C. (Pain/Personalization +… |
| [`hormozi-tips`](hormozi-tips/) | Improve marketing/cold-email copy by applying Alex Hormozi's principles — the Value Equation, lead-magnet CTA, list-is-king targeting, human-first… |
| [`email-sequence`](email-sequence/) | You are an expert in email marketing and automation. Your goal is to create email sequences that nurture relationships, drive action, and move people… |
| [`spintax-campaign-relaunch`](spintax-campaign-relaunch/) | Analyze the copy of an existing Bison campaign, add heavy word-level spintax to it (subjects + bodies + signature) without changing the meaning, run… |

## List Building & Enrichment
| Skill | What it does |
| --- | --- |
| [`ai-ark-list-builder`](ai-ark-list-builder/) | Build lead lists from audience targeting documents using the AI ARK API. Trigger when the user wants to pull leads, build a prospect list, search for… |
| [`blitz-api`](blitz-api/) | Build and enrich B2B lead lists via the BlitzAPI (api.blitz-api.ai). Search people/companies by ICP, find employees/decision-makers at a company, run… |
| [`getleads`](getleads/) | Use when pulling leads, contacts, or emails from GetLeads / getleads.io (app.getleads.io MCP, glb_live_ API keys), enriching LinkedIn URLs to work… |
| [`consulti-scrape`](consulti-scrape/) | Scrape leads from the Consulti.ai database (500M+ B2B, Google Maps local businesses, podcasts/YouTube creators) via the Consulti REST API. Use when… |
| [`apify-scraping`](apify-scraping/) | Web scraping and lead research via Apify platform. Use when scraping websites for offer analysis, building lead lists, enriching prospect data, or… |
| [`bizbuysell-broker-list-builder`](bizbuysell-broker-list-builder/) | Use when building a business-broker or M&A-advisor list from BizBuySell, scraping the BizBuySell broker directory, or hitting HTTP 403 / anti-bot… |
| [`propstream-list-builder`](propstream-list-builder/) | Build, filter, save, and skip trace property lists in PropStream (app.propstream.com) by driving the user's own logged-in Chrome. Trigger when the… |
| [`propstream-export-to-instantly`](propstream-export-to-instantly/) | Turn a raw PropStream skip-traced contact export into a verified, deduped, Instantly-ready CSV. Trigger when the user has a PropStream export and… |
| [`list-optimize`](list-optimize/) | Clean a scraped lead list before campaign launch: AI-qualify against ICP, normalize company names, then (after email-verification) research each… |
| [`lead-tracking-db`](lead-tracking-db/) | Manage a Turso/SQLite lead-tracking database for cold email. Ships db-setup.sh + db-query.sh + 4 wrapper scripts (import-leads, email-guesser,… |
| [`clay-personalization`](clay-personalization/) | Analyze a client's offer, ICP, and email sequence, then output production-ready Clay prompts for prospect research and personalized cold email lines.… |
| [`pre-qualification-prompt`](pre-qualification-prompt/) | Generate Clay list pre-qualification prompts based on a client's offer and intake form. Use this skill whenever the user wants to write a… |
| [`sheets-duplicate-finder`](sheets-duplicate-finder/) | Identify and flag duplicate contacts (emails, phone numbers, names) between tabs in a Google Sheet by adding a "Duplicated" column powered by an… |

## Deliverability & Pre-Launch
| Skill | What it does |
| --- | --- |
| [`final-pre-launch`](final-pre-launch/) | Use when auditing a cold email client's campaigns before launch on EITHER Bison OR Instantly. Checks mailbox health, mailbox count, warmup, sending… |
| [`mailmeteor-spam-check`](mailmeteor-spam-check/) | Local, offline port of the Mailmeteor spam checker (mailmeteor.com/spam-checker) — the exact 769-keyword wordlist and scoring algorithm extracted… |
| [`blacklist-check`](blacklist-check/) | Check whether client sending domains are blacklisted (burned) and produce a listed/clean report. Use when someone provides a list of domains, a… |
| [`bison-mailbox-health`](bison-mailbox-health/) | Run a full mailbox and domain health audit on a Bison workspace. Pulls every sender account, warmup score, bounce data, and spam-placement signal,… |
| [`emailguard-api`](emailguard-api/) | Integrates with the EmailGuard (app.emailguard.io) deliverability monitoring API. Use when checking inbox placement, domain blacklists, spam scores,… |
| [`inbox-insiders`](inbox-insiders/) | End-to-end cold email mailbox ordering via Inbox Insiders Instant Order API. Use when ordering new mailboxes, provisioning domains + SMTP + Instantly… |
| [`winnr-api`](winnr-api/) | Integrates with the Winnr email infrastructure API. Use when building features that need domain management, mailbox provisioning, email… |

## Platforms & Deployment
| Skill | What it does |
| --- | --- |
| [`cold-email-campaign-deploy`](cold-email-campaign-deploy/) | Deploy cold email campaigns to Email Bison or Instantly. Generates campaign brief, runs pre-launch checklist (8 safety gates), creates campaign via… |
| [`bison-api`](bison-api/) | Integrates with the Bison (EmailBison) cold email platform API. Use when building features that need campaign data, reply management, lead… |
| [`bison-campaign-creator`](bison-campaign-creator/) | Create Bison email campaigns from a structured campaign sequences document. Use this skill whenever the user wants to create campaigns in Bison,… |
| [`instantly-cli`](instantly-cli/) | Instantly.ai cold email platform CLI — campaigns, leads, accounts, analytics, deliverability, inbox, enrichment. 156+ commands wrapping the full V2… |
| [`consulti-reply-agent`](consulti-reply-agent/) | Use when setting up, configuring, or building a reply agent, automated first-reply, or AI SDR in Consulti (Consultee / app.consulti.ai) for a cold… |
| [`high-ticket-portal`](high-ticket-portal/) | CLI for the High Ticket Portal API. Create/manage tasks, list clients, check campaigns, mailbox health, and EmailGuard deliverability. Triggers on… |

## Client Ops & Reporting
| Skill | What it does |
| --- | --- |
| [`lgj-client-lifecycle`](lgj-client-lifecycle/) | Master skill for the full Lead Gen Jay cold-email client lifecycle — one project per client, from onboarding through contract close. Each stage is a… |
| [`new-client`](new-client/) | End-to-end NEW CLIENT onboarding processor for LGJ. Pulls a strategy/onboarding call transcript from Fathom, saves it to the client's Google Drive… |
| [`strategy-call-recap`](strategy-call-recap/) | Process an LGJ cold email STRATEGY call for a client. Pulls the transcript from Fathom, saves it to the client's Google Drive folder as a Google Doc… |
| [`client-meeting`](client-meeting/) | Lightweight client meeting processor for LGJ. Takes a meeting transcript — either pulled from Fathom or provided directly by the user — for a named… |
| [`meeting-recap`](meeting-recap/) | Draft concise client meeting recap messages from a transcript. Output is two parts - first a per-person action items breakdown (internal), then the… |
| [`transcript-task-extractor`](transcript-task-extractor/) | Extract action items and tasks from a meeting transcript and group them by person (attendee). Use this whenever the user shares a meeting transcript,… |
| [`pull-client-docs`](pull-client-docs/) | Pull a client's strategy/meeting call transcript and intake form Google Docs into their local repo as full Markdown files, then commit and push. Use… |
| [`client-thread-reply`](client-thread-reply/) | Review the latest email thread with a client and draft a reply to their most recent message, grounded in the client repo's full context. Pulls the… |
| [`weekly-client-report`](weekly-client-report/) | Generate a weekly outbound report for a cold email client. Pulls Bison stats, reconciles against the client's positive replies tracker sheet, builds… |
| [`positive-reply-alert`](positive-reply-alert/) | Scan a cold email client's Bison account for POSITIVE replies that have not yet been responded to (hot leads sitting unanswered), then draft a… |
| [`refund-dispute-analysis`](refund-dispute-analysis/) | Analyze a client refund request end to end and build the internal defense case and client-facing response for a cold email or agency engagement. Use… |

## Other skills in this repo

This repo also carries non-cold-email skills (SEO, design, dev workflow, QA) as
loose `.md` files at the root, plus a few legacy one-off prompts:
`Qualification prompt generator`, `clay-personalization-SKILL.md`, and
`instantly-campaign-builder-SKILL.md`.

## Notes

- API keys are never committed — `.env` files are gitignored. See `blitz-api/.env.example` for the expected shape.
