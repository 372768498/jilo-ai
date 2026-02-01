---
title: "How to Use Midjourney: The Complete Guide from Registration to Stunning AI Art"
description: "Master Midjourney with this comprehensive guide covering setup, prompting techniques, parameter deep-dives, 10 scene-specific prompt templates, and style comparisons for photorealistic, anime, watercolor, and oil painting aesthetics."
date: 2025-01-31
author: "Jilo AI"
tags: ["Midjourney", "AI Art", "Image Generation", "AI Guide", "Prompt Engineering", "Digital Art", "Creative AI"]
---

# How to Use Midjourney: The Complete Guide from Registration to Stunning AI Art

Midjourney has established itself as the leading AI image generation tool, producing stunningly beautiful visuals that rival professional photography and illustration. Whether you're a designer seeking rapid prototyping, a marketer needing eye-catching visuals, or a creative exploring new artistic frontiers, Midjourney is an indispensable tool in 2025.

This complete guide walks you through everything — from creating your first image to mastering advanced parameters and developing a consistent visual style.

---

## Table of Contents

1. [Getting Started: Registration & Setup](#getting-started-registration--setup)
2. [Your First Image: The Basics](#your-first-image-the-basics)
3. [Understanding the Interface](#understanding-the-interface)
4. [Parameter Deep Dive](#parameter-deep-dive)
5. [Prompting Techniques for Better Results](#prompting-techniques-for-better-results)
6. [10 Scene-Specific Prompt Templates](#10-scene-specific-prompt-templates)
7. [Style Reference & Comparison](#style-reference--comparison)
8. [Advanced Features](#advanced-features)
9. [Tips & Best Practices](#tips--best-practices)
10. [FAQ](#faq)

---

## Getting Started: Registration & Setup

### Step 1: Create a Discord Account (if needed)

Midjourney primarily operates through Discord, though a web interface is now available.

1. Visit [discord.com](https://discord.com) and create an account
2. Download the Discord app (desktop or mobile) for the best experience

### Step 2: Subscribe to Midjourney

1. Visit [midjourney.com](https://www.midjourney.com)
2. Click **Sign In** with your Discord account
3. Choose a subscription plan:

| Plan | Price | GPU Time | Features |
|------|-------|----------|----------|
| **Basic** | $10/month | ~3.3 hrs/month | Standard generation, web access |
| **Standard** | $30/month | 15 hrs/month | Unlimited relaxed mode, stealth mode |
| **Pro** | $60/month | 30 hrs/month | 12 concurrent fast jobs, stealth mode |
| **Mega** | $120/month | 60 hrs/month | 12 concurrent fast jobs, extra GPU time |

**Recommendation:** Start with Basic to learn. Upgrade to Standard once you're comfortable and generating frequently — the unlimited relaxed mode is invaluable for experimentation.

### Step 3: Access Midjourney

**Via Discord:**
1. Join the official Midjourney Discord server
2. Navigate to any `#general` or `#newbie` channel
3. Type `/imagine` followed by your prompt

**Via Web (midjourney.com):**
1. Sign in at midjourney.com
2. Click "Create" to access the web editor
3. Type your prompt in the input field
4. The web interface offers a cleaner, more visual experience

---

## Your First Image: The Basics

### The /imagine Command

In Discord, everything starts with the `/imagine` command:

```
/imagine prompt: a cozy coffee shop on a rainy day, warm lighting, 
steam rising from cups, watercolor style
```

Within seconds, Midjourney generates a grid of 4 images. From here, you can:

- **U1-U4**: Upscale a specific image (full resolution)
- **V1-V4**: Create variations of a specific image
- **🔄**: Reroll — generate 4 entirely new images

### Anatomy of a Good Prompt

A well-structured Midjourney prompt follows this pattern:

```
[Subject] + [Description/Details] + [Environment/Setting] + [Style/Medium] + [Lighting] + [Parameters]
```

**Example:**
```
/imagine prompt: a samurai warrior standing on a cliff, cherry blossoms 
falling, dramatic sunset, cinematic lighting, hyperrealistic photography, 
8K resolution --ar 16:9 --v 6.1
```

### Key Principles

1. **Be descriptive, not instructive**: Say "a red car" not "make a car that is red"
2. **Front-load important elements**: Midjourney gives more weight to words at the beginning
3. **Use commas to separate concepts**: This helps the AI distinguish between different elements
4. **Avoid negatives**: Instead of "no people," use `--no people` parameter

---

## Understanding the Interface

### Discord Bot Commands

| Command | Function |
|---------|----------|
| `/imagine` | Generate images from a text prompt |
| `/describe` | Get prompt suggestions from an uploaded image |
| `/blend` | Blend 2-5 images together |
| `/shorten` | Analyze and optimize a long prompt |
| `/settings` | Adjust default settings |
| `/info` | Check subscription status and GPU usage |

### Web Interface Features

The web interface at midjourney.com provides:

- **Gallery**: Browse all your generated images
- **Create**: Generate new images with a clean editor
- **Explore**: Discover other users' creations and their prompts
- **Organize**: Sort images into folders and collections
- **Edit**: Use in-painting and out-painting tools directly

---

## Parameter Deep Dive

Parameters are added at the end of your prompt using `--` syntax. They are the key to controlling Midjourney's output precisely.

### --ar (Aspect Ratio)

Controls the width-to-height ratio of your image.

```
--ar 1:1    → Square (default) — profiles, social media posts
--ar 16:9   → Widescreen — desktop wallpapers, YouTube thumbnails
--ar 9:16   → Vertical — phone wallpapers, Instagram stories
--ar 3:2    → Classic photo — print photography
--ar 4:5    → Portrait — Instagram feed posts
--ar 21:9   → Ultra-wide — cinematic, panoramic
--ar 2:3    → Tall portrait — Pinterest pins, book covers
```

**Example:**
```
/imagine prompt: sweeping mountain landscape at golden hour, 
dramatic clouds --ar 21:9
```

### --v (Version)

Selects the Midjourney model version. Each version has distinct characteristics.

```
--v 6.1    → Latest version, best overall quality and prompt adherence
--v 6      → Excellent detail, strong text rendering
--v 5.2    → Beautiful aesthetics, slightly more artistic interpretation
--niji 6   → Anime/illustration specialized model
```

**Example:**
```
/imagine prompt: cyberpunk street scene with neon signs --v 6.1
```

### --style

Adjusts the aesthetic intensity within a model version.

```
--style raw    → Less Midjourney "beautification," more literal interpretation
--style scenic → Enhanced landscape and environment aesthetics (niji)
--style cute   → Softer, more adorable aesthetic (niji)
--style expressive → More dynamic, emotional interpretation (niji)
```

**Example:**
```
/imagine prompt: product photography of a luxury watch on marble --style raw --v 6.1
```

### --chaos (0-100)

Controls how varied the 4 initial images are from each other.

```
--chaos 0     → All 4 images are very similar (safe, predictable)
--chaos 25    → Moderate variation (good default for exploration)
--chaos 50    → Significant variation (great for brainstorming)
--chaos 100   → Maximum variation (wild, unexpected results)
```

**Example:**
```
/imagine prompt: futuristic city --chaos 75
```

**When to use high chaos:** Early exploration, brainstorming, discovering unexpected compositions.
**When to use low chaos:** Refining a specific concept, maintaining consistency.

### --stylize (0-1000)

Controls how much Midjourney applies its own artistic interpretation. Abbreviated as `--s`.

```
--s 0       → Minimal artistic styling, closely follows prompt
--s 100     → Low stylization (default in v6)
--s 250     → Default in v5, balanced
--s 500     → Strong artistic interpretation
--s 750     → Very stylized, painterly quality
--s 1000    → Maximum stylization, highly artistic
```

**Example:**
```
/imagine prompt: a simple wooden chair --s 0
/imagine prompt: a simple wooden chair --s 750
```

The first gives you a realistic chair; the second transforms it into an artistic masterpiece.

### --no (Negative Prompting)

Excludes specific elements from the image.

```
--no text, watermark, people, borders
```

**Example:**
```
/imagine prompt: serene forest path, morning light --no people, animals, text
```

### --seed

Provides a specific seed number for reproducible results.

```
--seed 12345
```

Use the same seed + similar prompt to get consistent results. Useful for iterating while maintaining the same composition.

### --tile

Creates seamless, tileable patterns.

```
/imagine prompt: floral pattern, vintage wallpaper design --tile
```

### --q (Quality)

Controls rendering quality and time.

```
--q .25   → Quarter quality (fastest, lowest detail)
--q .5    → Half quality
--q 1     → Standard quality (default)
```

---

## Prompting Techniques for Better Results

### 1. The Layered Description Method

Build your prompt in layers:

```
/imagine prompt: [Layer 1: Subject] a young woman reading a book,
[Layer 2: Details] wearing a cream knit sweater, round glasses, 
[Layer 3: Setting] sitting by a window in a cozy library,
[Layer 4: Atmosphere] soft afternoon light streaming in, dust particles in air,
[Layer 5: Style] shot on Kodak Portra 400, 85mm lens, shallow depth of field
--ar 3:2 --v 6.1
```

### 2. Camera & Photography Terms

Using photography terminology produces incredibly realistic results:

```
Shot types: close-up, medium shot, wide angle, bird's eye view, 
            low angle, macro, fisheye

Lens specs: 35mm lens, 85mm portrait lens, 200mm telephoto, tilt-shift

Film stocks: Kodak Portra 400, Fujifilm Velvia, Ilford HP5, Cinestill 800T

Lighting: golden hour, blue hour, Rembrandt lighting, butterfly lighting,
          rim lighting, neon lighting, chiaroscuro
```

### 3. Art Medium References

Specify the medium for distinct visual styles:

```
Digital art, oil painting, watercolor, charcoal sketch, pencil drawing,
acrylic painting, gouache, pastel, ink wash, linocut print, 
screen print, risograph, collage, mixed media
```

### 4. Artist & Style References

Reference well-known artistic styles (not individual living artists):

```
Art Nouveau style, Bauhaus design, Impressionist painting,
Studio Ghibli aesthetic, Pixar style, comic book illustration,
vintage travel poster, Soviet propaganda poster, Japanese ukiyo-e,
Art Deco architecture
```

### 5. Multi-Prompt Weighting

Use `::` to assign different weights to concepts:

```
/imagine prompt: cat::2 space::1 astronaut suit::1.5
```

This gives "cat" the most emphasis, followed by "astronaut suit," then "space."

---

## 10 Scene-Specific Prompt Templates

### 1. Product Photography

```
/imagine prompt: product photography of [product], placed on [surface], 
[background], professional studio lighting, sharp focus, high-end 
commercial photography, 4K --ar 4:5 --style raw --v 6.1

Example:
/imagine prompt: product photography of a minimalist ceramic vase, 
placed on white marble surface, soft gradient background in warm beige, 
professional studio lighting with soft shadows, sharp focus, high-end 
commercial photography, 4K --ar 4:5 --style raw --v 6.1
```

### 2. Professional Headshot / Avatar

```
/imagine prompt: professional headshot portrait of [description], 
[clothing], [expression], clean background in [color], soft studio 
lighting, shot on Canon EOS R5, 85mm f/1.4 lens, shallow depth of 
field --ar 3:4 --v 6.1

Example:
/imagine prompt: professional headshot portrait of a confident 
businesswoman in her 30s, wearing a navy blazer, warm genuine smile, 
clean background in light gray, soft studio lighting, shot on 
Canon EOS R5, 85mm f/1.4 lens --ar 3:4 --v 6.1
```

### 3. Landscape / Scene

```
/imagine prompt: [type] landscape of [location/description], 
[time of day], [weather/atmosphere], [foreground elements], 
dramatic [lighting type], award-winning nature photography 
--ar 16:9 --v 6.1

Example:
/imagine prompt: epic mountain landscape of snow-capped peaks 
reflecting in a crystal-clear alpine lake, golden hour, wispy 
clouds, wildflowers in foreground, dramatic rim lighting, 
award-winning nature photography --ar 16:9 --v 6.1
```

### 4. Illustration / Editorial

```
/imagine prompt: editorial illustration of [concept], [art style], 
[color palette], bold composition, magazine quality, trending on 
Behance --ar 3:4 --v 6.1

Example:
/imagine prompt: editorial illustration of the future of remote work, 
flat design with isometric perspective, vibrant purple and teal 
color palette, bold composition, magazine quality, trending on 
Behance --ar 3:4 --v 6.1
```

### 5. Interior Design

```
/imagine prompt: interior design photography of a [room type], 
[design style], [key furniture/elements], [color scheme], natural 
light from [direction], architectural digest style, professional 
interior photography --ar 16:9 --v 6.1

Example:
/imagine prompt: interior design photography of a modern Scandinavian 
living room, minimalist design, low-profile sofa in cream linen, 
oak coffee table, large monstera plant, neutral earth tones with 
sage green accents, natural light from floor-to-ceiling windows, 
architectural digest style --ar 16:9 --v 6.1
```

### 6. Food Photography

```
/imagine prompt: food photography of [dish], [plating style], 
[props and setting], [lighting], overhead/45-degree angle, 
appetizing, Bon Appetit magazine style --ar 4:5 --v 6.1

Example:
/imagine prompt: food photography of artisan sourdough toast with 
avocado, poached egg, and microgreens, rustic ceramic plate, 
linen napkin, morning light from side window, 45-degree angle, 
appetizing, Bon Appetit magazine style --ar 4:5 --v 6.1
```

### 7. Character Design

```
/imagine prompt: character design sheet of [character description], 
[outfit details], [personality traits reflected in design], 
multiple poses, full body, [art style], white background 
--ar 16:9 --v 6.1

Example:
/imagine prompt: character design sheet of a steampunk inventor 
girl, goggles on head, leather apron with pockets full of tools, 
mechanical arm prosthetic, curious and energetic personality, 
multiple poses, full body, anime style with Western influence, 
white background --ar 16:9 --niji 6
```

### 8. Social Media Graphics

```
/imagine prompt: [platform] social media graphic for [purpose], 
[visual style], [color palette matching brand], eye-catching 
composition, clean and modern design, [mood] --ar [platform ratio] --v 6.1

Example:
/imagine prompt: Instagram post graphic for a summer sale 
announcement, tropical theme with palm leaves and sunset gradient, 
coral pink and golden yellow palette, eye-catching composition, 
clean and modern design, energetic and fun mood --ar 1:1 --v 6.1
```

### 9. Concept Art / Environment

```
/imagine prompt: concept art of [environment description], 
[architectural style], [atmosphere/mood], [time period/era], 
[lighting conditions], matte painting, highly detailed, 
cinematic --ar 21:9 --v 6.1

Example:
/imagine prompt: concept art of an ancient underwater temple 
rediscovered by deep-sea explorers, bioluminescent coral growing 
on carved stone pillars, mysterious blue-green atmosphere, beams 
of light from above, matte painting, highly detailed, cinematic 
--ar 21:9 --v 6.1
```

### 10. Logo & Icon Design

```
/imagine prompt: minimalist logo design for [brand/concept], 
[style: geometric/organic/abstract], [key symbol or element], 
clean lines, vector style, [color] on white background, 
professional brand identity --ar 1:1 --style raw --v 6.1

Example:
/imagine prompt: minimalist logo design for a mountain coffee 
brand, geometric style, mountain peak integrated with coffee cup 
silhouette, clean lines, vector style, deep brown and forest 
green on white background, professional brand identity 
--ar 1:1 --style raw --v 6.1
```

---

## Style Reference & Comparison

Understanding different styles helps you achieve consistent results. Here's how to prompt for each major aesthetic:

### Photorealistic

```
/imagine prompt: [subject], hyperrealistic photography, shot on 
Sony A7R IV, 85mm lens, natural lighting, 8K resolution, 
photojournalism style --style raw --v 6.1
```

**Characteristics:** True-to-life details, natural imperfections, realistic lighting, lens effects
**Best for:** Product shots, portraits, architectural photography, stock images

### Anime / Manga

```
/imagine prompt: [subject], anime style, Studio Ghibli inspired, 
soft cel shading, vibrant colors, detailed background --niji 6

/imagine prompt: [subject], manga illustration, black and white 
ink, dynamic action lines, dramatic perspective --niji 6 --style expressive
```

**Characteristics:** Clean linework, expressive eyes, stylized proportions, vibrant palettes
**Best for:** Character design, storytelling, fan art, social media avatars

### Watercolor

```
/imagine prompt: [subject], watercolor painting, soft washes of 
color, visible paper texture, gentle color bleeding, delicate 
brushstrokes, white space, ethereal --v 6.1
```

**Characteristics:** Translucent layers, paper texture, soft edges, organic color bleeding
**Best for:** Invitations, editorial illustrations, nature scenes, gentle portraits

### Oil Painting

```
/imagine prompt: [subject], oil painting, thick impasto 
brushstrokes, rich color palette, dramatic chiaroscuro lighting, 
gallery quality, reminiscent of classical masters --v 6.1 --s 500
```

**Characteristics:** Visible brushstrokes, rich textures, deep colors, dramatic lighting
**Best for:** Portraits, landscapes, still life, fine art prints

### Digital Art / Concept Art

```
/imagine prompt: [subject], digital concept art, trending on 
ArtStation, highly detailed, dramatic lighting, cinematic 
composition, matte painting --v 6.1
```

**Characteristics:** Polished finish, dramatic compositions, atmospheric lighting, detail
**Best for:** Game art, movie concepts, fantasy/sci-fi scenes, book covers

### Vintage / Retro

```
/imagine prompt: [subject], vintage 1970s photography, warm 
color cast, film grain, Kodachrome colors, slightly faded, 
nostalgic atmosphere --v 6.1
```

**Characteristics:** Color casts, film grain, faded tones, period-appropriate aesthetics
**Best for:** Branding, editorial, nostalgia marketing, social media aesthetics

---

## Advanced Features

### Image-to-Image (Image Prompts)

Upload an image as a reference by pasting its URL before your text prompt:

```
/imagine prompt: https://example.com/reference-image.jpg a modern 
reimagining of this scene in cyberpunk style --v 6.1
```

### Blend

Combine multiple images into one:

```
/blend [image1] [image2] [image3]
```

Great for mixing styles, creating hybrid concepts, or combining reference images.

### Describe

Upload an image and Midjourney will suggest prompts that could recreate it:

```
/describe [upload image]
```

This is incredibly useful for:
- Learning how to describe what you see
- Reverse-engineering styles you like
- Building your prompting vocabulary

### In-Painting (Vary Region)

After generating an image, use the **Vary (Region)** button to:
1. Select a specific area of the image
2. Describe what you want in that area
3. Midjourney regenerates only the selected region

### Zoom Out

Expand your image beyond its original borders:
- **Zoom Out 2x**: Doubles the canvas, generating new content around the original
- **Zoom Out 1.5x**: Subtler expansion
- **Custom Zoom**: Specify exact zoom level and modify the prompt

### Pan

Extend the image in a specific direction (left, right, up, down) while maintaining the existing content.

---

## Tips & Best Practices

### 1. Start Broad, Then Refine
Begin with a simple prompt to see Midjourney's interpretation, then add details:
- Round 1: `a castle` → See the baseline
- Round 2: `a gothic castle on a cliff` → Add setting
- Round 3: `a gothic castle on a cliff, stormy sky, lightning, dramatic` → Add atmosphere
- Round 4: Add parameters: `--ar 16:9 --v 6.1 --s 400`

### 2. Use /describe to Learn
Upload images you love, use `/describe`, and study the prompts it suggests. This is the fastest way to build your vocabulary.

### 3. Save Your Seeds
When you love a composition but want to try different styles, note the seed number (`/info` or envelope emoji reaction) and reuse it.

### 4. Create Style Guides
For consistent projects, develop a "style suffix" you append to every prompt:
```
, cinematic lighting, muted tones, 35mm photography, 
grain texture --ar 16:9 --v 6.1 --s 300
```

### 5. Experiment with Unexpected Combinations
Some of the most striking images come from unusual mashups:
```
/imagine prompt: a Japanese zen garden made of circuit boards 
and fiber optic cables, morning mist, serene --v 6.1
```

### 6. Use Permutation Prompts
Test multiple variations at once using curly braces:
```
/imagine prompt: a {red, blue, golden} dragon in {watercolor, oil painting, digital art} style
```
This generates all combinations automatically.

---

## FAQ

### 1. Do I own the images I create with Midjourney?

If you're on a paid plan, you have general commercial usage rights to the images you create. However, if you're on the free tier, images are licensed under Creative Commons Noncommercial 4.0. For corporate use (revenue over $1M/year), you need at least the Pro plan. Always review Midjourney's current Terms of Service for the latest details.

### 2. How can I generate consistent characters across multiple images?

Use a combination of techniques: (1) Reference the same detailed character description in every prompt. (2) Use `--seed` with the same number. (3) Use image-to-image with a previous result as reference. (4) Use the `--cref` (character reference) parameter with a reference image URL. This is the most reliable method in v6.

### 3. Why do my images look different from what I described?

Midjourney interprets prompts artistically, not literally. To get closer to your vision: use `--style raw` for more literal interpretation, lower `--stylize` values, front-load the most important elements in your prompt, and use precise descriptive language rather than abstract concepts. The `/shorten` command can help identify which words Midjourney actually uses.

### 4. What's the maximum resolution I can generate?

Standard generation produces images around 1024×1024 pixels. After upscaling, you can reach approximately 2048×2048 or higher depending on the aspect ratio. For print-quality resolution, use external upscalers like Topaz Gigapixel AI or Real-ESRGAN after Midjourney generation.

### 5. Can I use Midjourney to create images in someone's likeness or copy a specific artist's style?

Midjourney has policies against generating images of real public figures and has blocked many specific artist names. While you can describe art styles generically (e.g., "impressionist style" vs. naming a specific living artist), always be mindful of ethical and legal considerations around likeness rights and artistic copyright.

---

## Conclusion

Midjourney is an incredibly powerful creative tool that rewards experimentation and precise communication. The gap between a mediocre image and a breathtaking one often comes down to how well you can describe what you envision.

Start with the templates in this guide, experiment with parameters, and build your personal style vocabulary over time. The more you create, the more intuitive the prompting process becomes.

**Next Steps:**
- Generate your first 10 images using the templates above
- Experiment with the same prompt at different `--stylize` values
- Use `/describe` on 5 images you admire
- Build a personal "style suffix" for your most common aesthetic
- Join the Midjourney Discord community to learn from others

Create something amazing! 🎨
