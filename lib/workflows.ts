export type WorkflowStep = {
  title_en: string;
  title_zh: string;
  goal_en: string;
  goal_zh: string;
  body_en: string;
  body_zh: string;
  tools: string[];
  prompt_en?: string;
  prompt_zh?: string;
  tip_en?: string;
  tip_zh?: string;
};

export type Workflow = {
  slug: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  time: string;
  toolsCount: number;
  title_en: string;
  title_zh: string;
  summary_en: string;
  summary_zh: string;
  audience_en: string[];
  audience_zh: string[];
  notFor_en: string[];
  notFor_zh: string[];
  inputs_en: string[];
  inputs_zh: string[];
  recommendedTools: string[];
  outputs_en: string[];
  outputs_zh: string[];
  steps: WorkflowStep[];
  prompts_en: { title: string; text: string }[];
  prompts_zh: { title: string; text: string }[];
  variations_en: { title: string; text: string }[];
  variations_zh: { title: string; text: string }[];
  faqs_en: { q: string; a: string }[];
  faqs_zh: { q: string; a: string }[];
  related: string[];
};

export const workflows: Workflow[] = [
  {
    slug: 'write-seo-blog-posts-with-ai',
    category: 'Writing',
    difficulty: 'Beginner',
    time: '30–60 min',
    toolsCount: 3,
    title_en: 'Write SEO Blog Posts with AI',
    title_zh: '用 AI 写 SEO 博客文章',
    summary_en: 'Research, outline, draft, optimize, and polish SEO blog content with AI tools.',
    summary_zh: '用 AI 完成 SEO 文章的选题、提纲、初稿、优化和润色。',
    audience_en: ['Content marketers', 'Founders', 'Content teams'],
    audience_zh: ['内容营销人员', '创业者', '内容团队'],
    notFor_en: ['Highly regulated industries without review', 'Deep expert-only topics with no editor involved'],
    notFor_zh: ['没有人工审核的强监管行业', '完全依赖深度专家知识且没有编辑参与的主题'],
    inputs_en: ['Target keyword or topic', 'Audience profile', 'Brand voice notes'],
    inputs_zh: ['目标关键词或主题', '目标读者画像', '品牌语气说明'],
    recommendedTools: ['ChatGPT', 'Claude', 'Surfer SEO'],
    outputs_en: ['SEO outline', 'First draft', 'Optimized final article', 'Meta title and description'],
    outputs_zh: ['SEO 提纲', '文章初稿', '优化后的终稿', 'Meta title 和 description'],
    steps: [
      {
        title_en: 'Define the search intent',
        title_zh: '明确搜索意图',
        goal_en: 'Understand what the reader actually wants.',
        goal_zh: '先搞清楚用户真正想看什么。',
        body_en: 'Use the keyword to determine whether the article should educate, compare, or convert. Review current search results before drafting.',
        body_zh: '围绕关键词判断这篇内容是做科普、对比还是转化，动笔前先看当前搜索结果。',
        tools: ['ChatGPT', 'Claude'],
        prompt_en: 'Analyze the keyword [KEYWORD]. Explain likely search intent, target audience, and the kinds of pages currently ranking.',
        prompt_zh: '分析关键词 [KEYWORD]，说明它对应的搜索意图、目标读者，以及当前排名内容大致是什么类型。',
        tip_en: 'Most weak AI articles fail because intent is wrong from the start.',
        tip_zh: '很多 AI 文章效果差，根本原因是从一开始就写偏了意图。'
      },
      {
        title_en: 'Build the outline',
        title_zh: '搭建提纲',
        goal_en: 'Create a clear structure before drafting.',
        goal_zh: '先把结构搭清楚，再写正文。',
        body_en: 'Generate H1/H2/H3 sections, FAQs, and key arguments based on intent and reader questions.',
        body_zh: '基于搜索意图和用户问题生成 H1/H2/H3 结构、FAQ 和关键论点。',
        tools: ['ChatGPT', 'Claude'],
        prompt_en: 'Create an SEO-friendly outline for [TOPIC]. Include H2s, H3s, FAQs, and section angles.',
        prompt_zh: '为 [TOPIC] 生成 SEO 友好的文章提纲，包含 H2、H3、FAQ 以及每部分的写作角度。',
        tip_en: 'Edit the outline manually before drafting to remove fluff.',
        tip_zh: '在写初稿前先手动删掉空话和重复结构。'
      },
      {
        title_en: 'Draft section by section',
        title_zh: '分段写初稿',
        goal_en: 'Generate a controllable first draft.',
        goal_zh: '产出可控的第一版内容。',
        body_en: 'Write one section at a time instead of generating the full article in one pass.',
        body_zh: '不要一口气生成整篇，按章节逐段写，质量更稳定。',
        tools: ['ChatGPT', 'Claude'],
        prompt_en: 'Write the section for [HEADING] in a clear, practical, non-generic style. Use examples when helpful.',
        prompt_zh: '围绕 [HEADING] 写这一节内容，要求清晰、实用、不套话，必要时给出例子。',
        tip_en: 'Section-by-section drafting gives better quality and easier editing.',
        tip_zh: '分段写更容易控质量，也更方便后续编辑。'
      },
      {
        title_en: 'Optimize for SEO and readability',
        title_zh: '做 SEO 和可读性优化',
        goal_en: 'Improve coverage without stuffing keywords.',
        goal_zh: '在不堆砌关键词的前提下提升覆盖度。',
        body_en: 'Review topical coverage, missing entities, transitions, and readability with an SEO optimization tool or manual checklist.',
        body_zh: '用 SEO 工具或人工清单检查主题覆盖度、缺失要点、段落衔接和可读性。',
        tools: ['Surfer SEO'],
        tip_en: 'Optimization should improve usefulness, not just score higher.',
        tip_zh: '优化的目标是让文章更有用，不是单纯把分数刷高。'
      },
      {
        title_en: 'Polish and publish',
        title_zh: '润色并发布',
        goal_en: 'Make the article sound human and publish-ready.',
        goal_zh: '让文章更像人写的，并达到可发布标准。',
        body_en: 'Rewrite awkward phrases, add examples, tighten transitions, and create a title tag plus meta description.',
        body_zh: '改掉机器味、补例子、顺逻辑，再生成标题和 meta 描述。',
        tools: ['ChatGPT', 'Claude'],
        prompt_en: 'Rewrite this draft to sound more natural, concise, and useful. Reduce repetition and improve flow.',
        prompt_zh: '把这篇草稿改得更自然、更简洁、更有帮助，减少重复并优化行文流畅度。',
        tip_en: 'Always do a final human review before publishing.',
        tip_zh: '上线前一定要做最后一轮人工审核。'
      }
    ],
    prompts_en: [
      { title: 'Search intent analysis', text: 'Analyze the keyword [KEYWORD]. Explain likely search intent, audience, and top-ranking content patterns.' },
      { title: 'SEO outline generation', text: 'Create a detailed SEO-friendly outline for [TOPIC] with H2s, H3s, FAQs, and section goals.' },
      { title: 'Section drafting', text: 'Write the section [HEADING] in a practical, clear, non-generic tone with examples if useful.' },
      { title: 'Human rewrite', text: 'Rewrite this article to sound more natural and concise. Remove repetition and improve flow.' }
    ],
    prompts_zh: [
      { title: '搜索意图分析', text: '分析关键词 [KEYWORD] 的搜索意图、目标读者和当前排名内容模式。' },
      { title: 'SEO 提纲生成', text: '为 [TOPIC] 生成详细的 SEO 提纲，包含 H2、H3、FAQ 和各段目标。' },
      { title: '章节写作', text: '围绕 [HEADING] 写一节内容，要求实用、清晰、不套话，必要时给例子。' },
      { title: '人味化改写', text: '把这篇文章改得更自然、更简洁，删掉重复表达并提升流畅度。' }
    ],
    variations_en: [
      { title: 'Budget version', text: 'Use only ChatGPT or Claude plus Google Docs.' },
      { title: 'Team version', text: 'Let AI draft and a human editor finalize tone and facts.' }
    ],
    variations_zh: [
      { title: '低成本版', text: '只用 ChatGPT 或 Claude 加 Google Docs 就能跑通。' },
      { title: '团队版', text: '先让 AI 出草稿，再由编辑做人设、事实和语气把关。' }
    ],
    faqs_en: [
      { q: 'Can I do this with free tools?', a: 'Yes. A general AI assistant plus a doc editor is enough for the basic flow.' },
      { q: 'Does AI-written content need editing?', a: 'Yes. Human review is still needed for accuracy, tone, and originality.' }
    ],
    faqs_zh: [
      { q: '只用免费工具能做吗？', a: '可以。一个通用 AI 助手加文档编辑器就能跑通基础流程。' },
      { q: 'AI 写的内容还需要人工改吗？', a: '需要。事实、语气、原创性和细节仍然要人工把关。' }
    ],
    related: ['turn-one-article-into-social-content', 'research-competitors-in-30-minutes', 'ai-coding-workflow-for-solo-developers']
  },
  {
    slug: 'turn-one-article-into-social-content',
    category: 'Marketing',
    difficulty: 'Beginner',
    time: '20–30 min',
    toolsCount: 2,
    title_en: 'Turn One Article into Social Content',
    title_zh: '把一篇文章拆成社媒内容',
    summary_en: 'Repurpose one long-form article into multiple social posts for different channels.',
    summary_zh: '把一篇长文快速改造成适合不同渠道的社媒内容。',
    audience_en: ['Creators', 'Content operators', 'Solo founders'],
    audience_zh: ['内容创作者', '内容运营', '独立创业者'],
    notFor_en: ['Highly visual-first brands with no copy strategy'],
    notFor_zh: ['完全依赖视觉表达、几乎不靠文案的品牌'],
    inputs_en: ['One article or blog post', 'Target platforms', 'Brand tone'],
    inputs_zh: ['一篇文章或博客', '目标平台', '品牌语气'],
    recommendedTools: ['ChatGPT', 'Claude'],
    outputs_en: ['X posts', 'LinkedIn posts', 'Short captions', 'Hook ideas'],
    outputs_zh: ['X 帖子', 'LinkedIn 帖子', '短文案', '开头 hook'],
    steps: [
      { title_en: 'Extract the core points', title_zh: '提炼核心观点', goal_en: 'Find the strongest takeaways from the source article.', goal_zh: '先找出原文最值得传播的观点。', body_en: 'Summarize the article into key insights, examples, and actionable statements.', body_zh: '把文章拆成关键洞察、例子和可执行结论。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Map content to channels', title_zh: '映射到不同渠道', goal_en: 'Adapt content for each platform instead of copying blindly.', goal_zh: '按平台习惯改写，而不是一稿硬发 everywhere。', body_en: 'Define different output styles for X, LinkedIn, and short captions.', body_zh: '为 X、LinkedIn、短标题等渠道分别定义表达方式。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Generate post variants', title_zh: '批量生成文案版本', goal_en: 'Create multiple usable options quickly.', goal_zh: '一次产出多个可用版本。', body_en: 'Generate short, medium, and opinionated variants from the same source.', body_zh: '从同一篇源内容生成短版、中版、观点版多个版本。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Polish hooks and CTAs', title_zh: '优化 hook 和 CTA', goal_en: 'Increase click-through and engagement.', goal_zh: '提高点击率和互动。', body_en: 'Tighten first lines, sharpen opinions, and match CTA style to platform.', body_zh: '优化开头、强化观点，并让 CTA 更符合平台语境。', tools: ['ChatGPT', 'Claude'] }
    ],
    prompts_en: [{ title: 'Repurposing prompt', text: 'Turn this article into 5 X posts, 3 LinkedIn posts, and 5 short captions. Keep the tone practical and non-generic.' }],
    prompts_zh: [{ title: '内容拆分 Prompt', text: '把这篇文章改写成 5 条 X 帖子、3 条 LinkedIn 帖子和 5 条短 caption，要求实用，不套话。' }],
    variations_en: [{ title: 'Founder voice version', text: 'Rewrite posts in a direct founder-style tone.' }],
    variations_zh: [{ title: '创始人口吻版', text: '改成更直接、更有个人判断的创始人口吻。' }],
    faqs_en: [{ q: 'Should I post the same text everywhere?', a: 'No. Keep the same idea but adapt the format for each channel.' }],
    faqs_zh: [{ q: '可以同一段文案全平台通发吗？', a: '不建议。核心观点可以相同，但表达方式要按平台重写。' }],
    related: ['write-seo-blog-posts-with-ai', 'research-competitors-in-30-minutes']
  },
  {
    slug: 'research-competitors-in-30-minutes',
    category: 'Research',
    difficulty: 'Beginner',
    time: '30 min',
    toolsCount: 2,
    title_en: 'Research Competitors in 30 Minutes',
    title_zh: '30 分钟完成竞品研究',
    summary_en: 'Quickly analyze competitor positioning, messaging, and feature angles with AI.',
    summary_zh: '用 AI 快速梳理竞品定位、卖点和功能差异。',
    audience_en: ['Founders', 'Marketers', 'PMs'],
    audience_zh: ['创业者', '营销人员', '产品经理'],
    notFor_en: ['Formal due diligence that needs full data validation'],
    notFor_zh: ['需要严谨底稿和全量验证的正式尽调'],
    inputs_en: ['Competitor URLs', 'Your product angle', 'Research objective'],
    inputs_zh: ['竞品网址', '你的产品定位', '研究目标'],
    recommendedTools: ['ChatGPT', 'Perplexity'],
    outputs_en: ['Competitor summary', 'Positioning table', 'Messaging gaps'],
    outputs_zh: ['竞品摘要', '定位对比表', '文案空档'],
    steps: [
      { title_en: 'Define what to compare', title_zh: '先定义比较维度', goal_en: 'Keep the research focused.', goal_zh: '避免研究发散。', body_en: 'Decide whether you are comparing positioning, features, pricing, or messaging.', body_zh: '先决定这次重点看定位、功能、定价还是文案表达。', tools: ['ChatGPT'] },
      { title_en: 'Collect visible competitor signals', title_zh: '收集公开信号', goal_en: 'Capture enough public data for a fast judgment.', goal_zh: '快速抓到足够做判断的公开信息。', body_en: 'Review homepages, pricing pages, headlines, and key feature blocks.', body_zh: '重点看首页、定价页、首屏文案和核心功能模块。', tools: ['Perplexity'] },
      { title_en: 'Summarize positioning and gaps', title_zh: '总结定位和空档', goal_en: 'Turn raw notes into decisions.', goal_zh: '把信息整理成决策结论。', body_en: 'Group competitors by angle and identify where your product can be clearer or different.', body_zh: '把竞品按路线分组，再找出你可以打得更清楚或更差异化的点。', tools: ['ChatGPT'] }
    ],
    prompts_en: [{ title: 'Competitor analysis prompt', text: 'Compare these competitors on positioning, audience, messaging, pricing, and product strengths: [LIST]. Output a concise table plus 3 differentiation suggestions.' }],
    prompts_zh: [{ title: '竞品分析 Prompt', text: '对比这些竞品在定位、目标用户、文案表达、定价和产品优势上的差异：[LIST]。输出简明表格，并给 3 条差异化建议。' }],
    variations_en: [{ title: 'Messaging-only version', text: 'Focus only on homepage copy, headlines, and CTA patterns.' }],
    variations_zh: [{ title: '只看文案版', text: '只分析首页标题、副标题、CTA 和卖点表达。' }],
    faqs_en: [{ q: 'Is 30 minutes enough?', a: 'Enough for directional decisions, not enough for formal market research.' }],
    faqs_zh: [{ q: '30 分钟真的够吗？', a: '够做方向判断，但不够做正式市场研究。' }],
    related: ['write-seo-blog-posts-with-ai', 'ai-coding-workflow-for-solo-developers']
  },
  {
    slug: 'ai-coding-workflow-for-solo-developers',
    category: 'Coding',
    difficulty: 'Intermediate',
    time: '1–3 hrs',
    toolsCount: 3,
    title_en: 'AI Coding Workflow for Solo Developers',
    title_zh: '独立开发者的 AI 编码工作流',
    summary_en: 'Use AI to plan features, generate code, debug issues, and ship faster as a solo developer.',
    summary_zh: '让 AI 参与需求拆解、代码实现、调试和文档整理，加快独立开发速度。',
    audience_en: ['Solo developers', 'Indie hackers', 'Prototype builders'],
    audience_zh: ['独立开发者', '独立黑客', '原型搭建者'],
    notFor_en: ['Large regulated codebases without review process'],
    notFor_zh: ['没有审查机制的大型受监管代码库'],
    inputs_en: ['Feature request', 'Existing codebase', 'Acceptance criteria'],
    inputs_zh: ['功能需求', '现有代码库', '验收标准'],
    recommendedTools: ['Claude', 'ChatGPT', 'Cursor'],
    outputs_en: ['Implementation plan', 'Code changes', 'Debug checklist', 'Release notes'],
    outputs_zh: ['实现计划', '代码改动', '调试清单', '发布说明'],
    steps: [
      { title_en: 'Clarify the feature', title_zh: '先把需求说清楚', goal_en: 'Reduce rework before coding.', goal_zh: '减少返工。', body_en: 'Ask AI to restate the feature, assumptions, edge cases, and acceptance criteria.', body_zh: '先让 AI 帮你重述需求、补假设、列边界条件和验收标准。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Plan file-level changes', title_zh: '先做文件级改动计划', goal_en: 'Know where to change code before writing it.', goal_zh: '写代码前先确定改哪些文件。', body_en: 'Map the likely touched files, components, APIs, and data flow.', body_zh: '明确会影响哪些文件、组件、接口和数据流。', tools: ['Claude', 'Cursor'] },
      { title_en: 'Implement in small batches', title_zh: '小步实现', goal_en: 'Keep the code reviewable and testable.', goal_zh: '让改动可控、可测试。', body_en: 'Generate code in chunks, validate each chunk, and avoid giant one-shot edits.', body_zh: '分批生成和验证代码，不要一次性生成大坨改动。', tools: ['Cursor', 'Claude'] },
      { title_en: 'Debug with structured prompts', title_zh: '结构化调试', goal_en: 'Use AI for diagnosis, not random guessing.', goal_zh: '让 AI 帮你定位，而不是乱猜。', body_en: 'Provide the error, expected behavior, relevant code, and recent changes.', body_zh: '把报错、预期行为、相关代码和最近改动一起喂给 AI。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Document and ship', title_zh: '整理说明并发布', goal_en: 'Leave the change understandable for future you.', goal_zh: '让未来的你也看得懂这次改了什么。', body_en: 'Generate a short changelog, test checklist, and known limitations before shipping.', body_zh: '上线前让 AI 帮你整理 changelog、测试清单和已知限制。', tools: ['Claude', 'ChatGPT'] }
    ],
    prompts_en: [{ title: 'Feature clarification prompt', text: 'Restate this feature request as a concrete implementation plan. Include assumptions, edge cases, touched files, and acceptance criteria: [REQUEST]' }],
    prompts_zh: [{ title: '需求澄清 Prompt', text: '把这个功能需求重述成可执行实现计划，补充假设、边界条件、可能影响的文件和验收标准：[REQUEST]' }],
    variations_en: [{ title: 'MVP-first version', text: 'Implement only the smallest working version first, postpone refactors.' }],
    variations_zh: [{ title: 'MVP 优先版', text: '先实现最小可用版本，重构和扩展留到后面。' }],
    faqs_en: [{ q: 'Should I let AI edit large code sections directly?', a: 'Usually no. Smaller, controlled edits are safer and easier to verify.' }],
    faqs_zh: [{ q: '可以直接让 AI 一次性改很多代码吗？', a: '一般不建议。小步改动更安全，也更容易验证。' }],
    related: ['research-competitors-in-30-minutes', 'write-seo-blog-posts-with-ai']
  },
  {
    slug: 'create-landing-page-copy-with-ai',
    category: 'Marketing',
    difficulty: 'Beginner',
    time: '30–45 min',
    toolsCount: 2,
    title_en: 'Create Landing Page Copy with AI',
    title_zh: '用 AI 生成落地页文案',
    summary_en: 'Turn product positioning into headline, subheadline, feature blocks, and CTA copy faster.',
    summary_zh: '把产品定位快速变成首屏标题、副标题、卖点模块和 CTA 文案。',
    audience_en: ['Founders', 'Marketers', 'Product teams'],
    audience_zh: ['创业者', '营销人员', '产品团队'],
    notFor_en: ['Products with unclear positioning'],
    notFor_zh: ['产品定位还没想清楚的项目'],
    inputs_en: ['Product description', 'Target audience', 'Main value proposition'],
    inputs_zh: ['产品描述', '目标用户', '核心价值主张'],
    recommendedTools: ['Claude', 'ChatGPT'],
    outputs_en: ['Hero headline', 'Subheadline', 'Feature copy', 'CTA options'],
    outputs_zh: ['首屏标题', '副标题', '功能卖点文案', 'CTA 选项'],
    steps: [
      { title_en: 'Clarify positioning', title_zh: '先澄清定位', goal_en: 'Start with a clear angle.', goal_zh: '先把主打方向定清楚。', body_en: 'Ask AI to restate your product in one sentence for a specific audience.', body_zh: '先让 AI 用一句话为某个目标用户重述你的产品定位。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Generate hero options', title_zh: '生成首屏文案', goal_en: 'Get several messaging directions quickly.', goal_zh: '快速拿到多个卖点方向。', body_en: 'Create multiple headline + subheadline combinations from the same positioning.', body_zh: '围绕同一个定位生成多个标题 + 副标题组合。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Expand key sections', title_zh: '扩展重点模块', goal_en: 'Build the rest of the page.', goal_zh: '把正文结构补完整。', body_en: 'Generate feature blocks, proof points, objections, and CTA sections.', body_zh: '继续生成功能卖点、信任背书、异议处理和 CTA 模块。', tools: ['Claude', 'ChatGPT'] }
    ],
    prompts_en: [{ title: 'Landing page copy prompt', text: 'Based on this product and audience, write 5 landing page hero variations plus 3 CTA options: [INFO]' }],
    prompts_zh: [{ title: '落地页文案 Prompt', text: '基于这个产品和目标用户，输出 5 组落地页首屏文案和 3 个 CTA 选项：[INFO]' }],
    variations_en: [{ title: 'Conversion-first version', text: 'Focus copy on pain point, urgency, and CTA clarity.' }],
    variations_zh: [{ title: '转化优先版', text: '让文案更突出痛点、紧迫感和 CTA 清晰度。' }],
    faqs_en: [{ q: 'Can AI write the whole landing page?', a: 'Yes, but you should still refine positioning and proof manually.' }],
    faqs_zh: [{ q: 'AI 能直接写完整个落地页吗？', a: '可以，但定位和信任背书最好再人工精修。' }],
    related: ['turn-one-article-into-social-content', 'research-competitors-in-30-minutes']
  },
  {
    slug: 'build-a-weekly-content-workflow-with-ai',
    category: 'Marketing',
    difficulty: 'Intermediate',
    time: '1–2 hrs',
    toolsCount: 3,
    title_en: 'Build a Weekly Content Workflow with AI',
    title_zh: '用 AI 搭建周更内容工作流',
    summary_en: 'Plan, draft, repurpose, and schedule one week of content from a repeatable AI system.',
    summary_zh: '把选题、写作、拆分和排期做成可重复的周更内容流程。',
    audience_en: ['Creators', 'Content teams', 'Solo founders'],
    audience_zh: ['创作者', '内容团队', '独立创业者'],
    notFor_en: ['Teams without a clear content goal'],
    notFor_zh: ['内容目标还不明确的团队'],
    inputs_en: ['Content goals', 'Target channels', 'Content themes'],
    inputs_zh: ['内容目标', '目标渠道', '内容主题'],
    recommendedTools: ['ChatGPT', 'Notion', 'Claude'],
    outputs_en: ['Weekly calendar', 'Draft topics', 'Repurposing plan'],
    outputs_zh: ['周内容日历', '选题草稿', '内容拆分计划'],
    steps: [
      { title_en: 'Define weekly themes', title_zh: '确定本周主题', goal_en: 'Keep output focused.', goal_zh: '保证输出聚焦。', body_en: 'Choose 2–3 themes aligned with business goals and audience demand.', body_zh: '围绕业务目标和用户需求选 2–3 个主题。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Generate topic backlog', title_zh: '生成选题池', goal_en: 'Create enough content ideas for the week.', goal_zh: '一周内容先备足。', body_en: 'Generate topic titles, angles, and hooks for each chosen theme.', body_zh: '围绕每个主题生成标题、角度和开头 hook。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Map outputs by channel', title_zh: '按渠道分配产出', goal_en: 'Avoid random publishing.', goal_zh: '不要随意发。', body_en: 'Assign what becomes a blog, social post, thread, or email.', body_zh: '明确哪些内容做博客、社媒、thread 或邮件。', tools: ['Notion', 'ChatGPT'] }
    ],
    prompts_en: [{ title: 'Weekly planning prompt', text: 'Build a 7-day content plan for [AUDIENCE] around these themes: [THEMES]. Include titles, formats, and channels.' }],
    prompts_zh: [{ title: '周内容规划 Prompt', text: '围绕这些主题为 [AUDIENCE] 设计 7 天内容计划：[THEMES]。输出标题、形式和发布渠道。' }],
    variations_en: [{ title: 'Solo founder version', text: 'Keep the schedule lean: 1 long-form piece plus 5 short repurposed assets.' }],
    variations_zh: [{ title: '独立创业者版', text: '内容节奏压缩为 1 篇长文 + 5 条拆分短内容。' }],
    faqs_en: [{ q: 'How do I keep this sustainable?', a: 'Reduce the number of original pieces and increase repurposing.' }],
    faqs_zh: [{ q: '怎么让周更真的长期可持续？', a: '减少原创数量，增加拆分复用比例。' }],
    related: ['write-seo-blog-posts-with-ai', 'turn-one-article-into-social-content']
  },
  {
    slug: 'summarize-market-research-with-ai',
    category: 'Research',
    difficulty: 'Beginner',
    time: '30–45 min',
    toolsCount: 2,
    title_en: 'Summarize Market Research with AI',
    title_zh: '用 AI 总结市场研究',
    summary_en: 'Turn scattered notes, articles, and reports into a concise market summary and key decisions.',
    summary_zh: '把零散的市场资料、网页和笔记整理成清晰的市场判断。',
    audience_en: ['Founders', 'Researchers', 'Operators'],
    audience_zh: ['创业者', '研究人员', '运营'],
    notFor_en: ['Research requiring source-by-source legal validation'],
    notFor_zh: ['需要逐条做法律级验证的研究任务'],
    inputs_en: ['Research notes', 'Articles or reports', 'Decision questions'],
    inputs_zh: ['研究笔记', '文章或报告', '决策问题'],
    recommendedTools: ['Claude', 'Perplexity'],
    outputs_en: ['Market summary', 'Key risks', 'Top opportunities'],
    outputs_zh: ['市场摘要', '主要风险', '关键机会'],
    steps: [
      { title_en: 'Collect the raw material', title_zh: '收集原始资料', goal_en: 'Put everything into one place.', goal_zh: '先把资料收拢。', body_en: 'Gather notes, sources, and screenshots into one working document.', body_zh: '把笔记、链接、截图统一放进一个工作文档。', tools: ['Perplexity', 'Claude'] },
      { title_en: 'Cluster the findings', title_zh: '聚类整理发现', goal_en: 'Find patterns instead of isolated facts.', goal_zh: '从杂乱信息里找模式。', body_en: 'Group findings into themes like demand, competition, pricing, or user pain points.', body_zh: '把信息按需求、竞争、定价、用户痛点等主题分组。', tools: ['Claude'] },
      { title_en: 'Convert into decisions', title_zh: '转成决策结论', goal_en: 'Make the research useful.', goal_zh: '让研究可以直接拿来用。', body_en: 'Summarize what matters, what is uncertain, and what to do next.', body_zh: '最后归纳什么最重要、什么还不确定、下一步该做什么。', tools: ['Claude'] }
    ],
    prompts_en: [{ title: 'Research summary prompt', text: 'Summarize these market notes into key themes, risks, opportunities, and recommended next steps: [NOTES]' }],
    prompts_zh: [{ title: '市场总结 Prompt', text: '把这些市场调研资料总结成关键主题、风险、机会和下一步建议：[NOTES]' }],
    variations_en: [{ title: 'Exec summary version', text: 'Compress the output into a 1-page executive summary.' }],
    variations_zh: [{ title: '一页摘要版', text: '把结果压缩成一页可给管理层看的摘要。' }],
    faqs_en: [{ q: 'Can AI replace manual research?', a: 'No. It speeds up synthesis, but source quality still matters.' }],
    faqs_zh: [{ q: 'AI 能完全替代人工调研吗？', a: '不能。它擅长加速整理，但信息源质量仍然最重要。' }],
    related: ['research-competitors-in-30-minutes', 'create-landing-page-copy-with-ai']
  },
  {
    slug: 'create-sales-enablement-docs-with-ai',
    category: 'Marketing',
    difficulty: 'Intermediate',
    time: '45–60 min',
    toolsCount: 2,
    title_en: 'Create Sales Enablement Docs with AI',
    title_zh: '用 AI 制作销售支持文档',
    summary_en: 'Generate battlecards, objection handling, and quick product summaries for sales teams.',
    summary_zh: '用 AI 快速整理 battlecard、异议处理和产品摘要，提升销售效率。',
    audience_en: ['Sales teams', 'Founders', 'Growth teams'],
    audience_zh: ['销售团队', '创业者', '增长团队'],
    notFor_en: ['Complex enterprise procurement with legal review'],
    notFor_zh: ['需要法务与合规深度参与的复杂企业采购场景'],
    inputs_en: ['Product positioning', 'Competitor notes', 'Common objections'],
    inputs_zh: ['产品定位', '竞品笔记', '常见异议'],
    recommendedTools: ['Claude', 'ChatGPT'],
    outputs_en: ['Battlecard', 'Objection handling sheet', 'Sales summary'],
    outputs_zh: ['战卡', '异议处理文档', '销售摘要'],
    steps: [
      { title_en: 'List the core sales scenarios', title_zh: '列销售场景', goal_en: 'Know what docs to create.', goal_zh: '先确定文档用途。', body_en: 'Identify discovery calls, demo calls, and objection-heavy moments.', body_zh: '先明确文档是用于发现需求、产品演示还是处理异议。', tools: ['Claude'] },
      { title_en: 'Generate draft assets', title_zh: '生成第一版素材', goal_en: 'Produce useful docs quickly.', goal_zh: '先把可用版本做出来。', body_en: 'Create battlecards, objection responses, and product summaries from existing notes.', body_zh: '基于现有资料批量生成战卡、异议回复和产品摘要。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Refine with real calls', title_zh: '结合真实通话修正', goal_en: 'Keep docs practical.', goal_zh: '让文档真的能用。', body_en: 'Update the docs after reviewing actual sales calls and repeated objections.', body_zh: '结合真实销售通话和重复异议，持续修正文档。', tools: ['Claude'] }
    ],
    prompts_en: [{ title: 'Sales enablement prompt', text: 'Create a sales battlecard for [PRODUCT] versus [COMPETITOR]. Include positioning, strengths, objections, and talk tracks.' }],
    prompts_zh: [{ title: '销售支持 Prompt', text: '为 [PRODUCT] 对比 [COMPETITOR] 生成销售战卡，包含定位、优势、异议处理和话术建议。' }],
    variations_en: [{ title: 'Founder-led sales version', text: 'Keep the language sharp and concise for founder-led calls.' }],
    variations_zh: [{ title: '创始人销售版', text: '语言更直接，适合创始人亲自打销售电话。' }],
    faqs_en: [{ q: 'Can AI generate battlecards from raw notes?', a: 'Yes. It works especially well when you already have competitor and call notes.' }],
    faqs_zh: [{ q: '只有零散笔记，AI 也能生成战卡吗？', a: '可以，尤其适合你已经有竞品信息和销售通话笔记的情况。' }],
    related: ['research-competitors-in-30-minutes', 'create-landing-page-copy-with-ai']
  },
  {
    slug: 'build-an-mvp-faster-with-ai',
    category: 'Coding',
    difficulty: 'Intermediate',
    time: '2–4 hrs',
    toolsCount: 3,
    title_en: 'Build an MVP Faster with AI',
    title_zh: '用 AI 更快搭出 MVP',
    summary_en: 'Use AI to go from idea to scoped MVP, implementation plan, and initial build much faster.',
    summary_zh: '让 AI 参与从想法、范围界定到第一版实现，加速 MVP 落地。',
    audience_en: ['Indie hackers', 'Startup teams', 'Prototype builders'],
    audience_zh: ['独立黑客', '创业团队', '原型搭建者'],
    notFor_en: ['Full-scale production systems with undefined requirements'],
    notFor_zh: ['需求还没收敛的大型正式系统'],
    inputs_en: ['Product idea', 'Key user flow', 'Must-have scope'],
    inputs_zh: ['产品想法', '关键用户流程', '必须做的范围'],
    recommendedTools: ['Claude', 'Cursor', 'ChatGPT'],
    outputs_en: ['MVP scope', 'Feature list', 'Implementation sequence'],
    outputs_zh: ['MVP 范围', '功能列表', '实现顺序'],
    steps: [
      { title_en: 'Cut scope aggressively', title_zh: '先砍范围', goal_en: 'Protect speed.', goal_zh: '先保速度。', body_en: 'Ask AI to separate must-have features from nice-to-have ideas.', body_zh: '先让 AI 帮你把必须做和以后再做分开。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Map the implementation order', title_zh: '安排实现顺序', goal_en: 'Reduce dependency confusion.', goal_zh: '减少开发混乱。', body_en: 'List the user flow, core components, and backend needs in order.', body_zh: '按顺序列出用户流程、核心组件和后端需求。', tools: ['Claude', 'Cursor'] },
      { title_en: 'Ship the smallest usable version', title_zh: '先发最小可用版', goal_en: 'Avoid gold-plating.', goal_zh: '别过度打磨。', body_en: 'Implement the smallest version that users can actually try.', body_zh: '优先实现用户真的能试用的最小版本。', tools: ['Cursor', 'Claude'] }
    ],
    prompts_en: [{ title: 'MVP scoping prompt', text: 'Turn this product idea into a strict MVP scope. Separate must-have, should-have, and later features: [IDEA]' }],
    prompts_zh: [{ title: 'MVP 范围 Prompt', text: '把这个产品想法拆成严格的 MVP 范围，区分必须做、应该做和以后再做：[IDEA]' }],
    variations_en: [{ title: 'Weekend build version', text: 'Reduce scope to what can be built in 1–2 days.' }],
    variations_zh: [{ title: '周末版', text: '把范围压缩到 1–2 天能做完的程度。' }],
    faqs_en: [{ q: 'What is the biggest AI mistake in MVP building?', a: 'Letting AI expand scope instead of shrinking it.' }],
    faqs_zh: [{ q: 'AI 搭 MVP 最常见的错误是什么？', a: '不是做太少，而是让 AI 把范围越写越大。' }],
    related: ['ai-coding-workflow-for-solo-developers', 'debug-code-with-ai-assistants']
  },
  {
    slug: 'debug-code-with-ai-assistants',
    category: 'Coding',
    difficulty: 'Intermediate',
    time: '20–40 min',
    toolsCount: 2,
    title_en: 'Debug Code with AI Assistants',
    title_zh: '用 AI 助手调试代码',
    summary_en: 'Use structured prompts and context to debug errors faster without random guessing.',
    summary_zh: '通过结构化上下文把报错交给 AI，更快定位问题而不是瞎猜。',
    audience_en: ['Developers', 'Indie hackers', 'Technical operators'],
    audience_zh: ['开发者', '独立黑客', '技术运营'],
    notFor_en: ['Incidents requiring deep production forensics'],
    notFor_zh: ['需要深度生产排障的复杂事故'],
    inputs_en: ['Error logs', 'Expected behavior', 'Relevant code'],
    inputs_zh: ['报错日志', '预期行为', '相关代码'],
    recommendedTools: ['Claude', 'ChatGPT'],
    outputs_en: ['Likely root causes', 'Debug steps', 'Fix suggestions'],
    outputs_zh: ['可能根因', '排查步骤', '修复建议'],
    steps: [
      { title_en: 'Describe the bug clearly', title_zh: '先把 bug 说清楚', goal_en: 'Give AI enough context.', goal_zh: '先把上下文给够。', body_en: 'Include the exact error, expected behavior, and what changed recently.', body_zh: '把准确报错、预期行为和最近改动一起给 AI。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Ask for ranked hypotheses', title_zh: '让 AI 排序假设', goal_en: 'Prioritize likely causes.', goal_zh: '别盲查。', body_en: 'Request the top likely causes ranked by probability.', body_zh: '让 AI 给出按概率排序的根因假设。', tools: ['Claude', 'ChatGPT'] },
      { title_en: 'Test one hypothesis at a time', title_zh: '一次验证一个假设', goal_en: 'Debug systematically.', goal_zh: '按步骤排查。', body_en: 'Validate one possible cause, then continue only if needed.', body_zh: '一次验证一个可能原因，确认无效再继续往下查。', tools: ['Claude', 'ChatGPT'] }
    ],
    prompts_en: [{ title: 'Debug prompt', text: 'Here is the error, expected behavior, recent changes, and relevant code. Give me the top 3 likely causes in order, plus the fastest verification steps.' }],
    prompts_zh: [{ title: '调试 Prompt', text: '这是报错、预期行为、最近改动和相关代码。请按概率给出最可能的 3 个原因，并附最快的验证步骤。' }],
    variations_en: [{ title: 'Frontend-only version', text: 'Focus only on browser, state, and rendering issues.' }],
    variations_zh: [{ title: '前端专用版', text: '只看浏览器、状态和渲染相关问题。' }],
    faqs_en: [{ q: 'Why does AI debugging sometimes fail?', a: 'Because the prompt lacks context or mixes too many changes at once.' }],
    faqs_zh: [{ q: '为什么 AI 调试有时没用？', a: '通常是因为给的上下文不够，或者一次混进了太多变量。' }],
    related: ['ai-coding-workflow-for-solo-developers', 'build-an-mvp-faster-with-ai']
  },
  {
    slug: 'create-product-demo-videos-with-ai',
    category: 'Marketing',
    difficulty: 'Intermediate',
    time: '45–90 min',
    toolsCount: 4,
    title_en: 'Create Product Demo Videos with AI',
    title_zh: '用 AI 制作产品演示视频',
    summary_en: 'Generate scripts, scenes, voiceover ideas, and a short demo video flow with AI tools.',
    summary_zh: '用 AI 快速完成产品演示视频的脚本、镜头、配音和结构设计。',
    audience_en: ['Marketers', 'Product teams', 'Founders'],
    audience_zh: ['营销团队', '产品团队', '创业者'],
    notFor_en: ['High-budget brand films needing full production'],
    notFor_zh: ['需要完整拍摄团队的大型品牌片'],
    inputs_en: ['Product screenshots', 'Target audience', 'Main use case'],
    inputs_zh: ['产品截图', '目标用户', '核心使用场景'],
    recommendedTools: ['ChatGPT', 'Runway', 'CapCut', 'ElevenLabs'],
    outputs_en: ['Video script', 'Scene breakdown', 'Voiceover draft'],
    outputs_zh: ['视频脚本', '镜头拆解', '配音稿'],
    steps: [
      { title_en: 'Define the video goal', title_zh: '先定义视频目标', goal_en: 'Know what this demo needs to achieve.', goal_zh: '先定清楚视频是为了解释什么。', body_en: 'Choose whether the demo should explain, persuade, or convert.', body_zh: '先决定这条视频是做解释、打动还是促转化。', tools: ['ChatGPT'] },
      { title_en: 'Write the script', title_zh: '生成脚本', goal_en: 'Get a concise demo narrative.', goal_zh: '先拿到一版短而清晰的叙事。', body_en: 'Write the problem, solution, walkthrough, and CTA in sequence.', body_zh: '按痛点、方案、演示、CTA 的顺序生成脚本。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Plan visuals and audio', title_zh: '设计画面和配音', goal_en: 'Make production easier.', goal_zh: '让制作更顺。', body_en: 'Break the script into scenes and match each scene with screenshots, motion, or voiceover.', body_zh: '把脚本拆成镜头，并分别匹配截图、动效和配音。', tools: ['Runway', 'CapCut', 'ElevenLabs'] }
    ],
    prompts_en: [{ title: 'Demo script prompt', text: 'Write a 60-second product demo script for [PRODUCT] targeting [AUDIENCE]. Include hook, problem, walkthrough, and CTA.' }],
    prompts_zh: [{ title: '演示视频 Prompt', text: '为 [PRODUCT] 面向 [AUDIENCE] 写一段 60 秒产品演示视频脚本，包含 hook、痛点、演示和 CTA。' }],
    variations_en: [{ title: 'Short-form ad version', text: 'Compress the script into a 20-second paid social ad.' }],
    variations_zh: [{ title: '短广告版', text: '把脚本压缩成 20 秒投放广告版本。' }],
    faqs_en: [{ q: 'Do I need expensive video tools?', a: 'Not always. For MVP demos, simple editors plus AI scripting are usually enough.' }],
    faqs_zh: [{ q: '做 demo 视频一定要很贵的工具吗？', a: '不一定。对 MVP 演示来说，简单剪辑工具加 AI 脚本通常就够了。' }],
    related: ['generate-ad-creatives-with-ai', 'create-landing-page-copy-with-ai']
  },
  {
    slug: 'generate-ad-creatives-with-ai',
    category: 'Marketing',
    difficulty: 'Intermediate',
    time: '30–60 min',
    toolsCount: 3,
    title_en: 'Generate Ad Creatives with AI',
    title_zh: '用 AI 批量生成广告素材',
    summary_en: 'Generate angles, hooks, copy, and creative directions for paid acquisition faster.',
    summary_zh: '用 AI 更快产出广告角度、开头、文案和创意方向。',
    audience_en: ['Performance marketers', 'Growth teams', 'Founders'],
    audience_zh: ['效果营销人员', '增长团队', '创业者'],
    notFor_en: ['Brands without clear offer or audience'],
    notFor_zh: ['连目标人群和 offer 都没定清楚的项目'],
    inputs_en: ['Offer', 'Audience', 'Current winning angle'],
    inputs_zh: ['产品 offer', '目标人群', '当前有效卖点'],
    recommendedTools: ['ChatGPT', 'Claude', 'Midjourney'],
    outputs_en: ['Ad hooks', 'Creative angles', 'Copy variants'],
    outputs_zh: ['广告 hook', '创意角度', '文案版本'],
    steps: [
      { title_en: 'List angle hypotheses', title_zh: '列出角度假设', goal_en: 'Test multiple angles quickly.', goal_zh: '先把角度铺开。', body_en: 'Generate several pain-point, outcome, and curiosity-based ad angles.', body_zh: '先生成痛点型、结果型、好奇型等多个广告角度。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Turn angles into copy', title_zh: '把角度变成文案', goal_en: 'Create launch-ready variants.', goal_zh: '快速出可测试版本。', body_en: 'Generate headlines, body copy, and CTA combinations for each angle.', body_zh: '为每个角度生成标题、正文和 CTA 组合。', tools: ['ChatGPT', 'Claude'] },
      { title_en: 'Map visuals to each angle', title_zh: '为每个角度配视觉', goal_en: 'Make creatives easier to produce.', goal_zh: '让投放素材更容易出。', body_en: 'Define what image or motion concept best matches each angle.', body_zh: '给每个角度匹配最适合的视觉或动效概念。', tools: ['Midjourney'] }
    ],
    prompts_en: [{ title: 'Ad creative prompt', text: 'Generate 10 ad angles for [OFFER] targeting [AUDIENCE], then turn the top 3 into full ad copy plus visual direction.' }],
    prompts_zh: [{ title: '广告创意 Prompt', text: '为 [OFFER] 面向 [AUDIENCE] 生成 10 个广告角度，并把最好的 3 个扩展成完整广告文案和视觉方向。' }],
    variations_en: [{ title: 'UGC-style version', text: 'Rewrite the ads in a more casual creator/UGC tone.' }],
    variations_zh: [{ title: 'UGC 风格版', text: '把广告改写成更像创作者口吻的 UGC 风格。' }],
    faqs_en: [{ q: 'Should I generate a lot of ad copy?', a: 'Yes, but only test a few strong angles at once.' }],
    faqs_zh: [{ q: '广告文案是不是越多越好？', a: '可以多生成，但同时测试的强角度不要太多。' }],
    related: ['create-product-demo-videos-with-ai', 'create-landing-page-copy-with-ai']
  }
];

export function getWorkflowBySlug(slug: string) {
  return workflows.find((item) => item.slug === slug);
}
