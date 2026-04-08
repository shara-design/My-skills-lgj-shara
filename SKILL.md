---
name: bison-campaign-creator
description: Creates cold email campaigns in EmailBison (Bison) with properly formatted spintax variations. Use when user asks to "create Bison campaign", "set up cold email campaign", "build email sequence in Bison", mentions "EmailBison", or provides campaign details with sequences and spintax requirements. Handles multi-step sequences with Bison-specific spintax format using single curly brackets.
license: MIT
metadata:
  author: Cold Email Strategist
  version: 1.0.0
  mcp-server: bridgekit
  category: email-marketing
  tags: [cold-email, bison, spintax, sequences, outreach]
---

# Bison Campaign Creator

## Overview

This skill enables you to create professional cold email campaigns in EmailBison (Bison) with properly formatted spintax variations. It handles the complete workflow from campaign setup to multi-step sequence creation with Bison-specific spintax formatting.

## Instructions

### Step 1: Gather Campaign Requirements

When a user requests campaign creation, collect:

1. **Client Account**: Which Bison account/client to use (e.g., "Todd Fuller")
2. **Number of Campaigns**: How many campaigns to create
3. **Campaign Details** for each:
   - Campaign name/type (e.g., "Campaign A - Invoice Processing")
   - Target industry/audience
   - Subject line (with spintax if provided)
   - Sequence steps with content and timing

### Step 2: Connect to Bison Account

Use the bridgekit MCP tools to:

```
1. Call get_bison_clients to list available clients
2. Identify the correct client by name
3. Use that client's information for campaign creation
```

### Step 3: Apply Bison Spintax Rules

**CRITICAL**: Bison uses a specific spintax format that MUST be followed exactly:

#### Spintax Format Rules:
- Use single curly brackets `{}` - Format: `{option1|option2}`
- Separate variations with `|` (pipe character)
- No spaces required around pipes (but allowed)
- Limit to 2 options per spin block (recommended for deliverability)
- Each option must be grammatically correct on its own
- Can stack spintax in same line: `{Hello|Hi} {there|friend}`
- Keep variables exactly as provided: `{FIRST_NAME}`, `{COMPANY}`, `{SENDER_EMAIL_SIGNATURE}`

#### Good Spintax Examples:
```
{Hey|Hi} {FIRST_NAME}
{Quick question|Curious about something}
{We just helped|A printing company we work with|One of our clients}
{No friction, no complaints.|Zero pushback from their customers.}
```

#### Bad Spintax Examples (DO NOT USE):
```
{{option1||option2}}  // Wrong bracket style
[option1|option2]      // Wrong bracket type
{option1/option2}      // Wrong separator
{option1, option2}     // Wrong separator
```

### Step 4: Structure Each Sequence Step

For each email step in the sequence:

1. **Subject Line**: Apply spintax if variations provided
2. **Email Body**: Apply spintax following the rules above
3. **Timing**: Day 0, Day 3, Day 5, etc.
4. **Step Type**: Initial email or thread reply

**Template Structure**:
```
Step X: [Name] (Day Y, [initial/thread reply])

Subject: {variation1|variation2} if applicable

{Opening|Greeting} {FIRST_NAME},

{Sentence variant 1|Sentence variant 2}. {Next sentence variant 1|Next sentence variant 2}

{Closing|Sign-off},
{SENDER_EMAIL_SIGNATURE}
```

### Step 5: Create Campaigns via MCP

Use bridgekit tools to create each campaign:

```python
# Create campaign
create_bison_sequence(
    client_name="Client Name",
    campaign_name="Campaign A - Description",
    subject_line="Subject with {spintax|variations}",
    steps=[
        {
            "day": 0,
            "type": "initial",
            "content": "Email body with {proper|correct} spintax"
        },
        {
            "day": 3,
            "type": "thread_reply",
            "content": "Follow-up with {more|additional} spintax"
        }
    ]
)
```

### Step 6: Quality Validation

Before finalizing, verify:

✅ All spintax uses single curly brackets `{}`
✅ Maximum 2 options per spin block
✅ All variables preserved exactly: `{FIRST_NAME}`, `{COMPANY}`, etc.
✅ Each spintax option is grammatically complete
✅ No broken fragments or incomplete sentences
✅ Proper spacing and punctuation

### Step 7: Confirm Creation

After creating campaigns:
1. Confirm each campaign was created successfully
2. Provide campaign names and IDs
3. Show sample of the spintax output
4. Offer to make adjustments if needed

## Common Campaign Patterns

### Pattern 1: B2B Service Campaign
- Day 0: Problem identification + case study
- Day 3: Social proof + specific numbers
- Day 5: Final value proposition

### Pattern 2: Patient/Customer Campaign
- Day 0: Patient-focused angle + solution
- Day 3: Dollar impact + benefits
- Day 5: Urgency or limited offer

### Pattern 3: Creative/Professional Services
- Day 0: Pain point + quick win
- Day 3: Detailed solution + proof
- Day 5: Call to action

## Spintax Best Practices

### Opening Variations
```
{Hey|Hi} {FIRST_NAME}
{Quick question|Curious about something}
{Quick thought|Quick one}
{Following up|Bumping this}
```

### Question Variations
```
{What's {COMPANY} paying in|How much is {COMPANY} losing to|Is {COMPANY} eating}
{Want me to send|Should I send|Can I send}
{Happy to send|Want me to send one|Should I send one}
```

### Social Proof Variations
```
{We just helped|A company we work with|One of our clients}
{Their customers|The clients|Users}
{No friction, no complaints.|Zero pushback.|Actually prefer having the option.}
```

### Closing Variations
```
{Best|Thanks}
{Want me to|Should I|Can I}
{Happy to|Want me to|Should I}
```

## Troubleshooting

### Issue: Spintax not rendering correctly
**Cause**: Using wrong bracket format or separator
**Solution**: Verify using single `{}` and `|` separator

### Issue: Variables broken in output
**Cause**: Spintax applied to variable names
**Solution**: Keep variables exact: `{FIRST_NAME}` never `{FIRST_NAME|FIRSTNAME}`

### Issue: Grammatically incorrect variations
**Cause**: Incomplete sentence fragments in spintax options
**Solution**: Each option must be complete: `{We helped|We worked with}` not `{helped|worked with}`

### Issue: Campaign not created in Bison
**Cause**: MCP connection or authentication issue
**Solution**: Verify Bison client connection, check for API errors, retry with correct client ID

## Examples

### Example 1: Creating 4 Campaigns for Todd Fuller

**User request**: "Create 4 campaigns in Todd Fuller's Bison account for invoice processing services"

**Actions**:
1. Connect to Todd Fuller's Bison account via `get_bison_clients`
2. Create Campaign A with invoice processing focus
3. Create Campaign B with patient payment angle
4. Create Campaign C with creative services focus
5. Create Campaign D with healthcare focus
6. Apply proper spintax to all sequences
7. Confirm all 4 campaigns created successfully

### Example 2: Single Campaign with Custom Spintax

**User provides**: Raw email copy with spintax instructions

**Actions**:
1. Parse the provided email content
2. Apply Bison spintax format: `{option1|option2}`
3. Structure into sequence steps
4. Create campaign via MCP
5. Validate spintax rendering
6. Confirm creation

## Critical Reminders

- **ALWAYS** use single curly brackets `{}` for spintax
- **NEVER** modify variable names like `{FIRST_NAME}`, `{COMPANY}`, `{SENDER_EMAIL_SIGNATURE}`
- **LIMIT** to 2 options per spin block for deliverability
- **VERIFY** each spintax option is grammatically complete
- **TEST** one campaign first before batch creation
- **CONFIRM** with user before creating multiple campaigns
