---
title: "Prompt Engineering Guide: The Complete Guide to Making AI Do What You Want"
description: "A systematic guide to prompt engineering covering role assignment, step-by-step reasoning, few-shot learning, chain of thought, and 10 universal prompt frameworks applicable to ChatGPT, Claude, Midjourney, and other AI tools."
date: 2025-01-31
author: "Jilo AI"
tags: ["Prompt Engineering", "AI", "ChatGPT", "Claude", "Midjourney", "LLM", "AI Tutorial", "Productivity"]
---

# Prompt Engineering Guide: The Complete Guide to Making AI Do What You Want

The difference between a mediocre AI response and a brilliant one isn't the model — it's the prompt. Prompt engineering is the art and science of communicating with AI systems to get exactly the output you need, consistently and reliably.

Whether you're using ChatGPT for writing, Claude for analysis, Midjourney for images, or any other AI tool, the principles of prompt engineering remain the same. This guide teaches you the systematic techniques that separate casual users from AI power users.

---

## Table of Contents

1. [What Is Prompt Engineering?](#what-is-prompt-engineering)
2. [Why Prompt Engineering Matters](#why-prompt-engineering-matters)
3. [Core Principles](#core-principles)
4. [Key Techniques](#key-techniques)
5. [10 Universal Prompt Frameworks](#10-universal-prompt-frameworks)
6. [Platform-Specific Tips](#platform-specific-tips)
7. [Common Mistakes & How to Fix Them](#common-mistakes--how-to-fix-them)
8. [Building Your Prompt Library](#building-your-prompt-library)
9. [The Future of Prompt Engineering](#the-future-of-prompt-engineering)
10. [FAQ](#faq)

---

## What Is Prompt Engineering?

Prompt engineering is the practice of designing and refining inputs (prompts) to AI systems to elicit optimal outputs. It encompasses:

- **Instruction design**: Crafting clear, precise directives
- **Context management**: Providing the right background information
- **Output formatting**: Specifying exactly how results should be structured
- **Iterative refinement**: Systematically improving prompts based on results
- **System design**: Creating reusable prompt templates and workflows

Think of it like this: if an AI model is a highly skilled professional, prompt engineering is the art of writing the perfect brief. A vague brief produces vague work; a precise brief produces exactly what you need.

---

## Why Prompt Engineering Matters

### The 10x Difference

The same AI model can produce wildly different results depending on the prompt:

**Basic prompt:**
```
Write about climate change.
```
*Result: Generic, surface-level essay that could come from any source.*

**Engineered prompt:**
```
You are an environmental scientist writing for a business audience. 
Explain the top 3 financial risks that climate change poses to 
commercial real estate in coastal cities over the next decade. 
Include specific data points, cite the methodology behind your 
estimates, and end with 3 actionable strategies for risk mitigation. 
Format as a professional memo with executive summary.
```
*Result: Focused, data-rich, actionable analysis tailored to the exact audience and purpose.*

### Career Value

Prompt engineering is becoming a recognized professional skill:
- **Dedicated roles**: "Prompt Engineer" positions at AI companies ($100K-300K+)
- **Productivity multiplier**: 3-10x output improvement across all AI tools
- **Competitive advantage**: Better prompts = better AI outputs = better work
- **Future-proof**: As AI becomes ubiquitous, prompt literacy becomes essential

---

## Core Principles

### 1. Be Specific, Not Vague

The most fundamental principle. Every word in your prompt should add information.

❌ **Vague:**
```
Help me with my presentation.
```

✅ **Specific:**
```
Create a 10-slide outline for a presentation about our Q4 product 
launch. Audience: C-suite executives. Include: key metrics, market 
positioning, competitive analysis, and go-to-market timeline. 
Tone: confident and data-driven.
```

### 2. Provide Context

AI models don't know your situation unless you tell them:

```
Context: I'm a Series A startup founder in the fintech space. 
We have 50 employees, $5M ARR, and are preparing for Series B 
fundraising in 6 months.

Task: Draft a board update email covering our Q3 performance, 
key challenges, and strategic priorities for Q4.
```

### 3. Define the Output Format

Never assume the AI knows how you want the response structured:

```
Format your response as:
1. Executive summary (3 sentences max)
2. Detailed analysis (bullet points)
3. Recommendations (numbered list with priority levels)
4. Next steps (action items with owners and deadlines)
```

### 4. Set Constraints

Boundaries focus the output and prevent rambling:

```
Constraints:
- Maximum 500 words
- Use only publicly available data
- No jargon — explain any technical terms
- Include at least 3 specific examples
- End with a clear call to action
```

### 5. Iterate, Don't Settle

Your first prompt is a rough draft. Refine based on the output:

1. Write initial prompt → Review output
2. Identify what's missing or wrong
3. Add clarifications, examples, or constraints
4. Regenerate → Review again
5. Repeat until satisfied

---

## Key Techniques

### 1. Role Assignment

**What:** Assign the AI a specific persona, expertise, or perspective.

**Why it works:** It activates domain-specific knowledge and adjusts the tone, vocabulary, and depth of the response.

**Pattern:**
```
You are a [role] with [years] of experience in [domain]. 
Your specialty is [specific area]. You communicate in a 
[style] manner.
```

**Examples:**

```
You are a senior tax attorney specializing in international 
corporate tax law. Explain the implications of establishing 
a subsidiary in Ireland for a US-based tech company.
```

```
You are a Michelin-starred chef who specializes in farm-to-table 
cuisine. Create a 5-course tasting menu using only ingredients 
available in the Pacific Northwest in January.
```

```
You are a YC partner reviewing startup pitches. Critique this 
pitch deck: [details]. Be direct and specific about what works, 
what doesn't, and what's missing.
```

**Pro tip:** Combine roles for unique perspectives:
```
You are both a software engineer and a UX researcher. Review 
this feature proposal from both technical feasibility and user 
experience perspectives.
```

### 2. Step-by-Step Reasoning (Chain of Thought)

**What:** Instruct the AI to think through problems sequentially rather than jumping to conclusions.

**Why it works:** Complex problems require intermediate reasoning. CoT prompting reduces errors and produces more reliable answers.

**Pattern:**
```
Think through this step by step:
1. First, [identify/analyze/consider] ...
2. Then, [evaluate/compare/calculate] ...
3. Finally, [conclude/recommend/synthesize] ...

Show your reasoning at each step.
```

**Example:**
```
Analyze whether our company should enter the Japanese market. 
Think through this step by step:

1. First, assess the market opportunity (size, growth, competition)
2. Then, evaluate entry barriers (regulatory, cultural, operational)
3. Next, estimate the required investment and timeline
4. Then, analyze potential risks and mitigation strategies
5. Finally, provide a recommendation with confidence level

Show your reasoning at each step.
```

**Variations:**
- "Let's think about this step by step."
- "Walk me through your reasoning process."
- "Break this down into sub-problems and solve each one."

### 3. Few-Shot Prompting

**What:** Provide examples of the desired input-output pattern before presenting the actual task.

**Why it works:** Examples are the most efficient way to communicate format, style, and quality expectations.

**Pattern:**
```
Here are examples of [task]:

Input: [example 1 input]
Output: [example 1 output]

Input: [example 2 input]
Output: [example 2 output]

Now do the same for:
Input: [actual task]
Output:
```

**Example:**
```
Convert technical feature descriptions into user-friendly benefit statements:

Feature: "256-bit AES encryption for all data at rest and in transit"
Benefit: "Your data is protected by the same security standard used by banks and governments — safe whether it's stored or being sent."

Feature: "99.99% uptime SLA with automated failover"
Benefit: "Your tools are always available when you need them. Our system automatically recovers from issues before you even notice."

Feature: "Real-time bidirectional sync across all devices"
Benefit:
```

**When to use few-shot:**
- Complex formatting requirements
- Specific tone or style matching
- Classification or categorization tasks
- When the AI misinterprets your zero-shot prompt

### 4. Chain of Thought (CoT) with Verification

**What:** Ask the AI to reason through a problem, then verify its own answer.

**Pattern:**
```
Solve this problem. Show your work step by step.
After reaching your answer, verify it by:
1. Checking your math/logic
2. Considering if the answer makes intuitive sense
3. Trying an alternative approach to confirm

If you find an error, correct it before giving your final answer.
```

**Example:**
```
A store offers a 20% discount, then applies a 10% member discount 
on the reduced price. If the original price is $200, what is the 
final price?

Solve step by step, then verify by calculating the total discount 
percentage. Do both approaches give the same answer?
```

### 5. Self-Consistency (Multiple Reasoning Paths)

**What:** Ask the AI to solve the same problem multiple ways and compare results.

**Pattern:**
```
Approach this problem from three different angles:

Approach 1: [methodology A]
Approach 2: [methodology B]  
Approach 3: [methodology C]

Compare the results. Where do they agree? Where do they differ? 
What's your final recommendation based on the consensus?
```

### 6. Structured Input/Output

**What:** Use explicit formatting for both your input and the requested output.

**Pattern:**
```
INPUT FORMAT:
- Company: [name]
- Industry: [sector]
- Challenge: [description]
- Budget: [amount]
- Timeline: [timeframe]

OUTPUT FORMAT:
## Analysis
[2-3 paragraph assessment]

## Options
| Option | Cost | Timeline | Risk | Impact |
|--------|------|----------|------|--------|

## Recommendation
[1 paragraph with clear action items]
```

### 7. Persona + Audience Calibration

**What:** Define both who the AI is AND who it's writing for.

**Pattern:**
```
Writer: You are a [role with specific expertise]
Audience: [describe the readers — their knowledge level, needs, context]
Goal: [what should the audience think, feel, or do after reading]
```

**Example:**
```
Writer: You are a cybersecurity expert who excels at explaining 
complex concepts simply.
Audience: Small business owners with no technical background who 
are worried about ransomware after hearing about recent attacks.
Goal: They should understand the top 3 preventive actions they 
can take this week without hiring an IT consultant.
```

### 8. Negative Prompting (What NOT to Do)

**What:** Explicitly state what you don't want in the output.

**Pattern:**
```
Important: Do NOT include:
- Generic platitudes ("In today's fast-paced world...")
- Unnecessary caveats or hedging
- Content that requires specialized tools to implement
- Recommendations that cost more than $500
```

### 9. Meta-Prompting (Ask the AI to Write Prompts)

**What:** Use AI to help design better prompts.

**Pattern:**
```
I want to use AI to [goal]. Help me write the optimal prompt by:

1. Asking me 5 clarifying questions about my needs
2. Based on my answers, draft 3 prompt variations
3. Explain the strengths of each variation
4. Recommend the best one and explain why
```

### 10. Recursive Refinement

**What:** Use the AI's output as input for the next iteration.

**Pattern:**
```
Step 1: "Generate a first draft of [content]"
Step 2: "Now critique this draft. What's weak? What's missing?"
Step 3: "Rewrite the draft incorporating your critique"
Step 4: "Rate the new version 1-10 and suggest final improvements"
Step 5: "Apply those improvements for the final version"
```

---

## 10 Universal Prompt Frameworks

These frameworks work across ChatGPT, Claude, Gemini, and other language models.

### 1. RACE Framework (Role, Action, Context, Expectation)

```
Role: You are a [specific role with expertise]
Action: [specific task to perform]
Context: [background information and constraints]
Expectation: [desired output format and quality criteria]
```

**Example:**
```
Role: You are a senior product manager at a SaaS company.
Action: Write a product requirements document (PRD) for a new 
       user onboarding flow.
Context: Our current onboarding has a 40% drop-off rate. We're a 
        B2B project management tool. Users need to create a project, 
        invite team members, and complete their first task.
Expectation: Include user stories, acceptance criteria, wireframe 
            descriptions, success metrics, and edge cases. Format 
            as a professional PRD document.
```

### 2. CREATE Framework (Character, Request, Examples, Adjustments, Type, Extras)

```
Character: [Who should the AI be?]
Request: [What do you need?]
Examples: [Show what good output looks like]
Adjustments: [Specific modifications or constraints]
Type: [Output format]
Extras: [Additional requirements]
```

### 3. COSTAR Framework (Context, Objective, Style, Tone, Audience, Response)

```
Context: [Background situation]
Objective: [What you want to achieve]
Style: [Writing style — academic, casual, technical]
Tone: [Emotional quality — confident, empathetic, urgent]
Audience: [Who will read this]
Response: [Format specification]
```

**Example:**
```
Context: Our SaaS product just experienced a 2-hour outage affecting 
        15% of users during business hours.
Objective: Write a post-incident communication to affected customers.
Style: Professional but human — not overly corporate.
Tone: Apologetic, transparent, and reassuring.
Audience: CTOs and engineering managers who rely on our API.
Response: Email format with subject line, body (under 300 words), 
         and a technical appendix with timeline.
```

### 4. The Interview Framework

```
I want to [achieve goal]. Before providing your response, interview 
me by asking one question at a time to gather the information you 
need. Ask up to [N] questions, then provide your recommendation 
based on my answers.
```

### 5. The Expert Panel Framework

```
Analyze [topic/decision] from three expert perspectives:

Expert 1: [Role A] — Focus on [aspect 1]
Expert 2: [Role B] — Focus on [aspect 2]
Expert 3: [Role C] — Focus on [aspect 3]

After each expert gives their analysis, have them debate the key 
points of disagreement. Then provide a synthesis with a balanced 
recommendation.
```

**Example:**
```
Analyze whether we should migrate from monolith to microservices:

Expert 1: Senior Backend Architect — Focus on technical complexity
Expert 2: VP of Engineering — Focus on team productivity and hiring
Expert 3: CFO — Focus on costs, timeline, and ROI

After each expert's analysis, have them debate. Then synthesize 
a recommendation.
```

### 6. The Template Filling Framework

```
Fill in this template based on the information I provide:

---
[SECTION 1: Title]
[Instruction for what goes here]

[SECTION 2: Title]
[Instruction for what goes here]

[SECTION 3: Title]
[Instruction for what goes here]
---

My information:
[Provide your raw information]
```

### 7. The Constraint Tightening Framework

```
Generate [content type] with these constraints:

Must include: [required elements]
Must NOT include: [excluded elements]  
Length: [exact specification]
Format: [structure requirement]
Tone: [specific tone]
Audience knowledge level: [beginner/intermediate/expert]
Success criteria: [how to judge if the output is good]
```

### 8. The Socratic Framework

```
Help me understand [topic] through Socratic dialogue.

Start by asking me what I already know about it. Based on my 
answer, ask probing questions that reveal gaps in my understanding. 
Guide me to discover the key insights rather than simply telling me.

After 5-7 exchanges, summarize what we've uncovered and highlight 
any remaining misconceptions.
```

### 9. The Before/After Framework

```
Here is the BEFORE version of [content]:
[paste original]

I want to transform it to achieve:
- [improvement 1]
- [improvement 2]
- [improvement 3]

Create the AFTER version, then explain the key changes you made 
and why each one improves the original.
```

### 10. The Scaffold Framework (for Complex Tasks)

```
I need to [complex goal]. Let's break this into phases:

Phase 1: Planning
- Help me define the scope and requirements
- Identify potential challenges

Phase 2: Research
- What information do I need?
- What are the best practices?

Phase 3: Execution
- Step-by-step implementation guide
- Quality checkpoints

Phase 4: Review
- How to evaluate the result
- Improvement opportunities

Start with Phase 1. I'll confirm before we move to each next phase.
```

---

## Platform-Specific Tips

### ChatGPT (GPT-4o / GPT-4)

- **Custom Instructions**: Use the "Custom Instructions" feature to set persistent context (your role, preferred response style) so you don't repeat yourself.
- **Memory**: Enable memory for long-term projects. ChatGPT will remember preferences across conversations.
- **Multimodal**: Upload images, PDFs, and data files directly. Say "Analyze this document" or "What's in this image?"
- **Advanced Data Analysis**: For data work, enable Code Interpreter. It can execute Python code, create charts, and process files.
- **GPTs**: For repeated workflows, create a custom GPT with pre-configured instructions and knowledge.

```
ChatGPT-specific tip: Start complex tasks with 
"Let me tell you about the project before you begin..." 
to front-load context before the actual request.
```

### Claude (Anthropic)

- **Long Context**: Claude excels at processing very long documents (200K+ tokens). Use it for analyzing entire codebases, contracts, or book manuscripts.
- **XML Tags**: Claude responds exceptionally well to XML-structured prompts:

```
<context>
You are reviewing a legal contract for a software licensing deal.
</context>

<document>
[paste full contract here]
</document>

<task>
Identify the top 5 risks for the licensee, explain each in plain 
English, and suggest specific amendment language for each.
</task>

<format>
Use numbered sections with headers: Risk, Explanation, 
Suggested Amendment.
</format>
```

- **Thinking**: Claude can be asked to think step-by-step naturally. It's particularly strong at nuanced analysis and avoiding harmful outputs.
- **Artifacts**: Use Claude's artifact feature for code, documents, and other standalone content that can be iterated on.

### Midjourney

- **Prompt Structure**: `[Subject], [Details], [Style], [Lighting], [Parameters]`
- **Weight System**: Use `::` for multi-prompting: `cat::2 astronaut::1`
- **Negative Prompting**: Use `--no` instead of "without" or "no"
- **Style Reference**: Use `--sref [URL]` for style consistency across generations
- **Character Reference**: Use `--cref [URL]` to maintain character consistency

```
Midjourney-specific: Photography terminology (lens focal length, 
film stock, lighting setup) produces more realistic results than 
generic descriptions.
```

### Stable Diffusion

- **Negative Prompts**: Use the dedicated negative prompt field extensively
- **Weighting**: Use `(emphasis:1.3)` syntax for important elements
- **LoRA/Embeddings**: Mention specific models for consistent styles
- **CFG Scale**: Lower (5-7) for creative freedom, higher (10-15) for prompt adherence

### General Cross-Platform Tips

1. **Test the same prompt across models** to find which handles your use case best
2. **Save winning prompts** in a personal library organized by task type
3. **Version your prompts** — small changes can dramatically change output
4. **Temperature matters** — use low temperature (0.1-0.3) for factual tasks, higher (0.7-1.0) for creative work

---

## Common Mistakes & How to Fix Them

### Mistake 1: Information Overload

❌ **Too much at once:**
```
Write a comprehensive 5000-word blog post about AI covering history, 
current applications, future predictions, ethical concerns, technical 
architecture, business implications, educational impact, healthcare 
applications, environmental considerations, and regulatory frameworks. 
Include examples, data, quotes, and actionable advice for each section.
```

✅ **Break it down:**
```
Let's write a comprehensive blog post about AI in healthcare. 
Start with an outline of 8-10 sections. I'll approve the outline 
before we write each section.
```

### Mistake 2: Ambiguous Instructions

❌ **Ambiguous:**
```
Make this better.
```

✅ **Specific:**
```
Improve this email by:
1. Making the opening more engaging (use a question or surprising stat)
2. Shortening each paragraph to 2-3 sentences
3. Adding a clear call-to-action at the end
4. Keeping the professional but friendly tone
```

### Mistake 3: No Quality Criteria

❌ **No criteria:**
```
Write a product description.
```

✅ **With criteria:**
```
Write a product description that:
- Leads with the primary benefit, not features
- Is 150-200 words
- Uses sensory language
- Addresses the target buyer's main pain point (time management)
- Ends with social proof (mention "10,000+ users")
- Score: Would a conversion rate optimization expert rate this 8+/10?
```

### Mistake 4: Ignoring the Conversation History

Don't repeat your full context in every message. Build on the conversation:

```
Message 1: [Full context + initial request]
Message 2: "Great, now expand section 3 with more technical detail"
Message 3: "Add a comparison table to section 3"
Message 4: "Perfect. Now let's move to section 4."
```

### Mistake 5: Not Using the AI's Strengths

Each model has strengths. Play to them:

- **ChatGPT**: Great at conversation, creative writing, code generation
- **Claude**: Excellent at long document analysis, nuanced reasoning, safety
- **Gemini**: Strong at multimodal tasks, Google ecosystem integration
- **Midjourney**: Best for artistic, stylized images
- **DALL·E**: Better at following literal image descriptions

---

## Building Your Prompt Library

### Organization System

Create a personal prompt library organized by category:

```
📁 Prompt Library
├── 📁 Writing
│   ├── blog-post-template.md
│   ├── email-templates.md
│   └── social-media.md
├── 📁 Coding
│   ├── code-review.md
│   ├── debug-template.md
│   └── documentation.md
├── 📁 Analysis
│   ├── data-analysis.md
│   ├── market-research.md
│   └── competitor-analysis.md
├── 📁 Creative
│   ├── midjourney-templates.md
│   ├── brainstorming.md
│   └── naming-generator.md
└── 📁 Business
    ├── strategy.md
    ├── hiring.md
    └── investor-update.md
```

### Template Format

For each saved prompt, record:

```markdown
## [Prompt Name]

**Purpose:** What this prompt is for
**Best Model:** Which AI model works best
**Temperature:** Recommended setting

### Prompt:
[The actual prompt text]

### Variables:
- [variable1]: Description
- [variable2]: Description

### Example Output:
[A sample of what good output looks like]

### Notes:
- What works well
- Known limitations
- Variations that work
```

### Continuous Improvement

1. **Test regularly**: Models update frequently — re-test your best prompts monthly
2. **A/B test**: Try variations and keep the winner
3. **Share and learn**: Exchange prompts with colleagues
4. **Document failures**: Understanding why a prompt fails is as valuable as knowing why one works

---

## The Future of Prompt Engineering

### Where We Are Now

Prompt engineering in 2025 is at an inflection point:
- Models are getting better at understanding vague instructions
- Multimodal prompting (text + image + audio) is becoming standard
- System prompts and custom instructions reduce repetitive prompting
- Specialized models reduce the need for complex prompt engineering in narrow domains

### What's Next

- **Agent-based workflows**: Prompts will increasingly orchestrate multi-step AI agent workflows rather than single completions
- **Prompt compilers**: Tools that optimize natural language prompts into model-specific formats
- **Adaptive prompting**: AI systems that learn your preferred prompt style over time
- **Visual prompt builders**: No-code tools for constructing complex prompt pipelines

### The Enduring Skill

Even as models improve, the core skill of clear, structured communication will remain valuable. The humans who can best articulate what they want — who can think systematically about problems and express their needs precisely — will always get better results from AI, regardless of how the technology evolves.

---

## FAQ

### 1. Does prompt engineering work the same across all AI models?

The core principles — specificity, context, structured output, and iterative refinement — apply universally. However, each model has quirks. ChatGPT responds well to conversational prompts, Claude excels with XML-structured prompts and very long context, and Midjourney requires a completely different descriptive style focused on visual attributes. Start with universal principles, then optimize for your specific model.

### 2. How long should a prompt be?

As long as it needs to be, but no longer. Simple tasks might need a single sentence. Complex tasks might require several paragraphs of context, constraints, and examples. The key is that every word should add value. Remove filler phrases like "I would like you to" or "Could you please" — they add tokens without adding information.

### 3. Is prompt engineering a real career?

Yes. While the title "Prompt Engineer" may evolve, the underlying skill — the ability to effectively communicate with AI systems to produce reliable, high-quality outputs — is increasingly valued. It's relevant for product managers, content creators, developers, data analysts, and anyone who works with AI tools regularly. Think of it less as a standalone career and more as a critical skill within any AI-augmented role.

### 4. Should I use ChatGPT, Claude, or something else?

It depends on the task. ChatGPT (GPT-4o) is the best all-rounder with strong multimodal capabilities. Claude is excellent for long-document analysis, nuanced reasoning, and tasks requiring careful safety considerations. Gemini integrates well with Google's ecosystem. For image generation, Midjourney produces the most artistic results, while DALL·E follows instructions more literally. Many power users use multiple models for different tasks.

### 5. Will prompt engineering become obsolete as AI gets smarter?

Partially. As models improve, simple prompting will yield better results with less effort. But complex, high-stakes, and creative applications will always benefit from skilled prompting. Think of it like photography: everyone can take a decent phone photo today, but professional photographers still exist because composition, lighting, and creative vision matter. Similarly, prompt engineering will evolve from a necessity into a craft.

---

## Conclusion

Prompt engineering is the most accessible AI skill you can learn today. It requires no coding, no special tools, and no technical background — just the willingness to think clearly about what you want and communicate it precisely.

Start with the core principles: be specific, provide context, define the output format, and iterate. Then layer on advanced techniques like role assignment, chain of thought, and few-shot learning as you tackle more complex tasks.

The 10 frameworks in this guide give you a toolkit for virtually any situation. Save the ones that resonate, customize them for your workflow, and build your personal prompt library over time.

The AI revolution isn't just about having access to powerful models — it's about knowing how to use them. And that starts with your next prompt.

**Next Steps:**
- Pick 3 frameworks from this guide and try them today
- Create your first prompt library folder
- Test the same task with different prompting techniques and compare
- Share a prompt with a colleague and see how they'd improve it
- Bookmark this guide and revisit it as you tackle new AI challenges

Master the prompt, master the AI. 🎯
