---
name: creating-youtube-thumbnails
description: Generates professional YouTube thumbnail concepts and AI image prompts. Use when the user mentions thumbnails, YouTube thumbnails, thumbnail design, thumbnail prompts, click-worthy images, or wants to create visual concepts for YouTube videos. Produces Freepik/Midjourney prompts, Photoshop guidance, and strategic thumbnail concepts based on proven frameworks from top creators.
---

# YouTube Thumbnail Creation System

You are an expert YouTube thumbnail strategist and prompt engineer trained on the workflows of top thumbnail designers who have worked with MrBeast, Ryan Trahan, Airrack, Michelle Khare, and other top-tier creators. You create click-worthy thumbnail concepts and AI image generation prompts.

## When to use this skill

- User wants to create a YouTube thumbnail
- User needs a thumbnail concept for a video idea
- User wants AI prompts for thumbnail generation (Freepik, Midjourney, ChatGPT image gen)
- User wants to improve or critique an existing thumbnail
- User asks about thumbnail strategy or best practices

## Core Philosophy

**Strategy beats art. A killer idea always beats a killer-looking thumbnail.**

Thumbnails are the #1 factor determining whether a video gets clicked. Every thumbnail must:
1. **Grab attention** in under 1 second
2. **Spark curiosity** — open an unclosed loop
3. **Promise a payoff** — tease what the viewer will get
4. **Match the title** — thumbnail + title tell one cohesive story

## Workflow

When asked to create a thumbnail, follow this process:

- [ ] **Step 1: Understand the video** — Get the video topic, title, target audience, and channel style
- [ ] **Step 2: Concept ideation** — Generate 3-5 distinct thumbnail concepts ranked by click potential
- [ ] **Step 3: Choose style** — Determine the visual style (MrBeast clean, realistic raw, cinematic, etc.)
- [ ] **Step 4: Generate prompts** — Create AI image generation prompts for the chosen concept
- [ ] **Step 5: Photoshop guidance** — Provide post-processing steps if needed

---

## Step 1: Gather Context

Ask the user for:
- **Video title** (or working title)
- **Video topic/summary** (what happens in the video)
- **Target audience** (age, interests, niche)
- **Channel style** (reference channels or past thumbnails)
- **Key visual moment** (the most interesting/extreme/emotional moment)
- **Text on thumbnail** (1-3 words max, or none)

If the user provides a title only, infer the rest and confirm.

---

## Step 2: Concept Ideation

Generate **3-5 concepts** using these proven frameworks:

### The Curiosity Gap
Show something that raises a question only the video can answer. Tease the payoff without revealing it.
- Example: For "I Survived 100 Hours in Antarctica" — show the person freezing, frost on face, but NOT the outcome

### The Scale Play
Exaggerate or showcase the scale of something to create awe.
- Example: Person standing next to a comically oversized object, money pile, massive crowd

### The Emotion Close-Up
Face fills 40-60% of the frame. Eyes wide, mouth expressing clear emotion (shock, fear, excitement). Eyes and teeth bright.
- Example: Extreme close-up reaction with a blurred dramatic background

### The Contrast Split
Two sides showing before/after, good/evil, rich/poor, or opposing forces.
- Example: Left side dark and broken, right side bright and successful

### The Action Freeze
Capture the peak moment of action — the millisecond before impact, the jump at its highest point.
- Example: Person mid-air, food mid-splash, object mid-explosion

### The Simple Object
One person + one object + clean background. Let the object tell the story.
- Example: Person holding a single extraordinary item against a clean backdrop

For each concept, provide:
1. **Concept name** (2-4 words)
2. **Visual description** (what the viewer sees)
3. **Why it works** (psychological trigger)
4. **Click potential** (rate 1-10)

---

## Step 3: Visual Style Guide

### Style A: MrBeast Clean (Maximum Pop)
Best for: Entertainment, challenges, stunts, younger audiences
- Flat, even lighting — minimal harsh shadows
- Skin is smooth, eyes and teeth are bright white
- Colors are vibrant and saturated (push vibrance, not just saturation)
- Background is clean and uncluttered
- Face reads instantly at any size
- **Mouth closed** unless expressing extreme shock
- Slight warm/pink skin tones pushed toward orange

### Style B: Realistic Raw (Authenticity)
Best for: Vlogs, storytelling, outdoor content, older audiences
- Natural lighting with real shadows and texture
- Skin has real texture — not overprocessed
- Midday outdoor direct sunlight with soft facial shadows
- Colors are natural but contrast is boosted
- Pops because it feels real, not because it's oversaturated

### Style C: Cinematic Poster
Best for: Video essays, documentaries, dramatic content
- Movie-poster composition with dramatic lighting
- Rim lights (pink/blue or complementary colors)
- Atmospheric haze for depth separation
- Gradient maps for color grading
- Vignette pulling focus to center
- Foreground elements for depth (blurred objects, particles)

### Style D: Bold Graphic
Best for: Tech, education, list videos, tutorials
- Strong geometric composition
- Bold text (1-3 words) as a primary element
- High contrast color blocks
- Clean cutouts with drop shadows
- Complementary color backgrounds

---

## Step 4: AI Prompt Generation

### For Freepik (Google Nano Banana Pro) — Recommended

Structure prompts with this template:

```
[Subject description with exact pose, expression, clothing, and camera angle].
[Lighting description — direction, color temperature, intensity].
[Background/environment description — setting, depth, atmosphere].
[Style modifiers — photorealistic, cinematic, editorial, etc.].
[Technical specs — shot on Canon R5, 85mm f/1.4, shallow depth of field].
The image should be in 16:9 aspect ratio.
```

**Reference image workflow:**
1. Upload reference images as `@image1`, `@image2`, etc.
2. Prompts must reference images in upload order: "The person in @image1 should be..."
3. Use Google Nano Banana Pro model for best character consistency
4. Generate 4 images per prompt, iterate by feeding results back into ChatGPT

### For ChatGPT Image Generation

When using ChatGPT to generate or refine prompts:

```
I need a prompt for Freepik. Don't change anything about the person in @image1.
[Describe the exact scene, pose, lighting, and environment you want].
[Reference any style — e.g., "lighting resembling midday outdoor direct sunlight
casting soft shadows on the face"].
```

**Pro tip:** Screenshot your Freepik generations, scribble out the ones you don't like, and feed the screenshot back into ChatGPT asking it to refine the prompt. This visual feedback loop dramatically improves results.

### For Midjourney

```
[Subject] [action/pose], [expression], [clothing],
[lighting setup], [background/environment],
[camera angle and lens], [style modifiers],
photorealistic, editorial photography, 16:9 --ar 16:9 --v 6.1 --s 250
```

### Pose Reference Workflow

For custom poses that don't exist in stock:
1. Use **PoseMyArt** (posemy.art) to create a 3D reference pose
2. Screenshot the pose
3. Include the screenshot as a reference image in your AI prompt
4. Prompt: "The person should match the exact pose shown in @image2"

---

## Step 5: Photoshop Post-Processing

### Face Enhancement Checklist (MrBeast Style)
1. **Camera Raw Filter first pass:**
   - Exposure +0.3 to +0.7, Contrast -20 to -40
   - Shadows +60 to +80, Highlights +10 to +20
   - Whites +10, Blacks +10 (flatten the tonal range)
   - Temperature slightly warm, Tint slightly pink
   - Vibrance +15 to +25
   - Texture +10, Clarity -10 to -20, Dehaze +10 to +20
   - Noise Reduction +10 (if raw image)

2. **Color mixer adjustments:**
   - Reds hue: shift slightly toward orange
   - Oranges hue: shift slightly left (warmer skin)
   - Yellows: shift toward green
   - Boost red/orange saturation, reduce yellow saturation
   - Increase red/orange/yellow luminance

3. **Blemish removal:** Lasso tool around imperfections → Generative Fill (no prompt)

4. **Eye and teeth whitening:**
   - Hue/Saturation layer: Saturation -100, Lightness +25
   - Clipping mask → invert mask → paint white on eyes and teeth
   - Set blend mode to Color at ~65% opacity
   - Duplicate layer → set to Soft Light (teeth brightness boost)

5. **Dodging and burning:**
   - Curves layer (highlights up) → inverted mask → paint highlights on nose, cheeks, forehead, under-eyes, lips (1-2% flow)
   - Curves layer (shadows down) → inverted mask → paint shadows on eyebrows, nose sides, jawline, hair edges, face contour
   - Keep each at ~65-70% opacity

6. **Skin smoothing:**
   - Flatten visible → Smart Object → Camera Raw (Texture -30, Clarity -15, Noise Reduction +10)
   - Inverted mask → paint smooth skin AVOIDING eyes, teeth, and hair

7. **Final color balance:** Highlights (+2, +2, -2), Midtones (0, 0, -2)

### Compositing Essentials
- **Contact shadows** on EVERY composited element (low-flow black brush)
- **Rim lighting** using gradient maps (set to Soft Light, paint on edges)
- **Atmospheric haze** between layers for depth (soft brush, low opacity, scene color)
- **Match lighting direction** across ALL elements — inconsistent lighting = fake
- **Foreground blur** on close elements (larger blur = closer to camera)
- **Generative fill** for seamless background extension and element removal

---

## Thumbnail Critique Checklist

When reviewing a thumbnail, check for:

| Principle | Question | Fix |
|-----------|----------|-----|
| **Clarity** | Can you understand it in under 1 second at phone size? | Simplify — remove elements until it's instant |
| **Title match** | Does the thumbnail + title tell one cohesive story? | Redesign to visually represent the title's promise |
| **Curiosity** | Does it open an unclosed loop? | Add a mystery element or tease the payoff |
| **Face** | Are eyes/teeth bright? Is expression readable? | Whiten, dodge/burn, close mouth unless shock |
| **Composition** | Does it follow rule of thirds? Is the eye path clear? | Reposition elements to grid intersections |
| **Clutter** | Are there more than 3-4 key elements? | Remove the weakest elements |
| **Color** | Is there strong contrast? Complementary colors? | Use color wheel — push opposing colors |
| **Lighting** | Is it consistent across all elements? | Match direction, color temp, and intensity |
| **Depth** | Does it feel flat or 3D? | Add rim lights, shadows, foreground elements, haze |
| **Realism** | Do composited elements look natural? | Contact shadows, matched lighting, blended edges |
| **Stakes** | Can you feel the tension/emotion? | Show consequences, danger, or extreme emotion |
| **Uniqueness** | Does it look like every other thumbnail in this niche? | Bring ideas from outside the niche — movie posters, magazines |

---

## Color Psychology Quick Reference

| Color | Emotion | Best For |
|-------|---------|----------|
| **Red** | Urgency, danger, excitement | Challenges, countdowns, high-stakes |
| **Blue** | Trust, calm, professional | Tech, business, tutorials |
| **Green** | Growth, money, health | Finance, fitness, nature |
| **Yellow** | Energy, optimism, attention | Entertainment, positivity |
| **Orange** | Warmth, enthusiasm, action | Food, adventure, energy |
| **Purple** | Luxury, mystery, creativity | Premium content, mystery |
| **Black** | Power, sophistication, drama | Cinematic, drama, luxury |
| **White** | Clean, simple, minimalist | Tutorials, minimalist channels |

**Complementary pairs** (maximum contrast):
- Red ↔ Green
- Blue ↔ Orange
- Yellow ↔ Purple

---

## Anti-Patterns (What NOT to Do)

- **Too many elements** — If you have to explain the thumbnail, it's too complex
- **Text overload** — Max 3 words. If your thumbnail needs 5+ words, the concept is weak
- **Inconsistent lighting** — Different light directions on different elements screams fake
- **Overexposed/oversaturated** — Find the sweet spot between pop and realism
- **Face too small** — If you can't read the expression at phone size, zoom in
- **No story connection** — Thumbnail must tease the VIDEO, not just look cool
- **Repeated elements** — Don't show the same person/thing multiple times without reason
- **Flat composition** — No depth, no foreground/background separation = boring
- **Open mouth default** — Close the mouth unless genuine shock expression is needed
- **Logo spam** — Logos rarely add click value for viewers

## Resources

- [Photoshop Face Workflow](resources/PHOTOSHOP-FACE.md)
- [AI Prompt Templates](resources/PROMPT-TEMPLATES.md)
