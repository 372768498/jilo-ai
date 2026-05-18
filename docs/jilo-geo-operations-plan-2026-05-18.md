# Jilo.ai GEO Operations Plan - 2026-05-18

## 1. New Operating Position

Jilo.ai is not an AI tool directory.

Jilo.ai is an information and decision site for ordinary users who want to use AI in real work and life.

The public site should answer four questions faster than competitors:

1. Which AI tool should I use for this task?
2. Can I use it from my location and setup?
3. Is the free version enough, and when is it worth paying?
4. What should I do first?

Internal topics such as GEO, revenue model, crawling strategy, traffic source design, and affiliate pipeline should not appear as first-level user-facing content. They belong in internal docs, admin reports, methodology pages, or short disclosure sections.

## 2. 2026 Market Signals We Must React To

The market is moving from single-tool adoption to personal AI stacks:

- ChatGPT is still the largest assistant, but Gemini, Claude, Perplexity, Copilot, and other assistants are gaining mindshare and referral share.
- Consumers increasingly use AI during buying decisions and productivity workflows, not just for curiosity.
- Traditional search is less reliable for small publishers because AI answers reduce clicks.
- Generative answer systems prefer concise, structured, directly answerable pages.

Working implication:

Jilo.ai should stop competing on "how many tools we list" and compete on "how clearly we answer the decision question."

Useful source references:

- Comscore, AI Assistants Head into 2026: https://www.comscore.com/Insights/Press-Releases/2026/1/AI-Assistants-Head-into-2026-on-a-High-Note
- Prophet, 2026 AI Powered Consumer Report: https://prophet.com/2026/04/the-2026-ai-powered-consumer-report/
- Axios / Chartbeat search traffic decline: https://www.axios.com/2026/03/17/chartbeat-search-traffic-ai-chatbots
- Trakkr AI search referral tracking: https://trakkr.ai/ai-search-traffic
- Google AI Overview academic measurement: https://arxiv.org/abs/2605.14021
- Google Search / Gemini / AI Overviews empirical study: https://arxiv.org/abs/2604.27790

## 3. Front-End Content Rules

Every user-facing page must pass this test:

> If a normal user lands here from Google, ChatGPT, Perplexity, Gemini, or a social post, can they decide the next action within 10 seconds?

Allowed on core pages:

- Direct answer
- Short recommendation
- Comparison table
- Use-case split
- Access or setup note
- Pricing and free-tier note
- Risk and "skip this if" note
- FAQ
- Update date
- Sources or methodology
- Clear CTA

Avoid on core pages:

- Internal revenue goals
- "We scan platforms" as a main value proposition
- GEO jargon
- Strategy labels
- Long platform philosophy
- Tool cards without decision context
- Pages that only say "this section is coming soon"

## 4. GEO Answer Page Template

Each GEO page should use this structure.

### Page Header

- H1: exact user question or decision phrase
- Last updated date
- One-sentence answer
- Disclosure if affiliate links are present

### Quick Answer

3-5 bullets:

- Best default choice
- Best free or low-cost choice
- Best choice for China / access-constrained users when relevant
- Who should not use the recommended option
- First step

### Comparison Table

Columns:

- Option
- Best for
- Free tier
- Paid price or cost range
- Access requirements
- Pros
- Cons
- Jilo verdict

### Decision Sections

Use H2/H3 sections that answer search and AI-assistant follow-ups:

- Who should use this?
- Who should skip this?
- Is the free version enough?
- What are the risks?
- What is the best alternative?
- What should I do first?

### FAQ

Minimum 5 questions:

- Is it free?
- Can I use it in China?
- Does it need Google login / phone / card / VPN?
- Is it safe for work or study?
- What is the best alternative?

### Structured Data

Use at least one where applicable:

- FAQPage
- HowTo
- ItemList
- SoftwareApplication
- Product / Review when the page is a true review

## 5. First 10 GEO Pages

Priority is based on: user urgency, search/GEO potential, monetization path, and fit with current Jilo assets.

| Priority | Page | Locale | Intent | Monetization path | Why now |
| --- | --- | --- | --- | --- | --- |
| P0 | Can I use Claude in China? | EN + ZH | Access decision | Access guides, alternatives, newsletter | High pain, clear answer format, GEO-friendly |
| P0 | Best ways to access ChatGPT Plus from China | EN + ZH | Access + subscription | Mainstream access channels, official guidance, risk disclosure | Chinese user cash-flow path |
| P0 | ChatGPT vs Claude vs Gemini for beginners | EN | Tool choice | Official tools, future affiliate alternatives | Users are no longer single-tool loyal |
| P0 | Cursor vs Windsurf for beginners | EN | Coding assistant comparison | Coding tools, sponsored reviews later | High commercial intent and frequent comparison query |
| P0 | Best AI tools for students in 2026 | EN | Role-based tool stack | Grammarly, QuillBot, Notion, study tools | Strong SEO + affiliate fit |
| P1 | Best AI video editors in 2026 | EN | Tool selection | Descript, Runway, InVideo, creator tools | Existing GSC signal around video editor terms |
| P1 | Is ElevenLabs worth it? | EN | Paid-tool decision | ElevenLabs affiliate candidate | Existing click signal, strong audio intent |
| P1 | Best AppSumo AI deals worth buying | EN | Purchase decision | AppSumo affiliate candidate | Clear buying intent and Deals page support |
| P1 | Which AI tools are actually usable in China? | ZH | Access + tool selection | Access guides, alternatives, subscription solutions | Differentiated Chinese lane |
| P1 | AI tools for office workers: writing, slides, meetings, automation | ZH | Workflow | Tool affiliate, paid templates later | Large ordinary-user audience |

## 6. Daily Market Monitoring Workflow

Daily inputs:

- GA4: landing pages, pageviews, engagement, outbound clicks
- GSC: rising queries, impressions, positions, low-CTR pages
- Supabase `ops_logs`: outbound clicks, affiliate clicks, crawler/report errors
- GitHub Trending: new developer tools and agent frameworks
- Product Hunt: new AI launches and vote/comment signals
- AppSumo: new AI deals and lifetime offers
- Hacker News / Reddit: practical complaints, comparisons, "worth it" discussions
- X / YouTube / Bilibili / Xiaohongshu / Zhihu: recurring user questions and creator topics

Daily output should be short and operational:

1. Yesterday traffic snapshot
2. Rising queries
3. Pages that need updates today
4. New market signal worth turning into content
5. Outbound / affiliate click opportunities
6. Today's 3 execution tasks
7. Risks or blockers

Do not report only crawler success. Crawler success is an internal health metric, not an operating result.

## 7. Weekly Review Targets

Review every Monday.

### Traffic

- GSC impressions
- GSC clicks
- Average CTR on top 20 queries
- GA landing page PV
- AI referral traffic where detectable

### Content

- Number of new GEO pages published
- Number of existing pages updated
- Number of pages with structured FAQ/table
- Number of pages with clear verdict and update date

### Conversion

- Outbound clicks
- Affiliate clicks
- Affiliate tools live
- Top clicked tools without affiliate links
- Deals page clicks
- Access page clicks

### Decision

Each weekly review must decide:

- Keep / update / merge / delete underperforming pages
- Next 5 GEO pages
- Next 3 affiliate applications or follow-ups
- One UX improvement to reduce user confusion

## 8. Execution Rules For The Next Build Cycle

1. Remove internal strategy content from first-level pages.
2. Turn each core page into a user question answer.
3. Add a visible update date and verdict to all GEO pages.
4. Never publish a page that only explains what Jilo.ai plans to do.
5. Prioritize pages with existing GSC impressions or outbound click evidence.
6. Keep monetization transparent: affiliate disclosure where needed, `rel="sponsored nofollow"` on monetized outbound links.
7. Do not recommend gray-market account sellers or instructions for bypassing platform controls.

## 9. Immediate Next Tasks

1. Build the first reusable GEO page component/template.
2. Publish the first two pages:
   - `Can I use Claude in China?`
   - `ChatGPT vs Claude vs Gemini for beginners`
3. Add daily report fields:
   - Today's 3 tasks
   - Pages to update
   - Top clicked tools without affiliate
4. Replace homepage lower sections that still show internal strategy with user-facing decision modules.
