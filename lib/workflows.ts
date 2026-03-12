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
      {
        title_en: 'Extract the core points',
        title_zh: '提炼核心观点',
        goal_en: 'Find the strongest takeaways from the source article.',
        goal_zh: '先找出原文最值得传播的观点。',
        body_en: 'Summarize the article into key insights, examples, and actionable statements.',
        body_zh: '把文章拆成关键洞察、例子和可执行结论。',
        tools: ['ChatGPT', 'Claude']
      },
      {
        title_en: 'Map content to channels',
        title_zh: '映射到不同渠道',
        goal_en: 'Adapt content for each platform instead of copying blindly.',
        goal_zh: '按平台习惯改写，而不是一稿硬发 everywhere。',
        body_en: 'Define different output styles for X, LinkedIn, and short captions.',
        body_zh: '为 X、LinkedIn、短标题等渠道分别定义表达方式。',
        tools: ['ChatGPT', 'Claude']
      },
      {
        title_en: 'Generate post variants',
        title_zh: '批量生成文案版本',
        goal_en: 'Create multiple usable options quickly.',
        goal_zh: '一次产出多个可用版本。',
        body_en: 'Generate short, medium, and opinionated variants from the same source.',
        body_zh: '从同一篇源内容生成短版、中版、观点版多个版本。',
        tools: ['ChatGPT', 'Claude']
      },
      {
        title_en: 'Polish hooks and CTAs',
        title_zh: '优化 hook 和 CTA',
        goal_en: 'Increase click-through and engagement.',
        goal_zh: '提高点击率和互动。',
        body_en: 'Tighten first lines, sharpen opinions, and match CTA style to platform.',
        body_zh: '优化开头、强化观点，并让 CTA 更符合平台语境。',
        tools: ['ChatGPT', 'Claude']
      }
    ],
    prompts_en: [
      { title: 'Repurposing prompt', text: 'Turn this article into 5 X posts, 3 LinkedIn posts, and 5 short captions. Keep the tone practical and non-generic.' }
    ],
    prompts_zh: [
      { title: '内容拆分 Prompt', text: '把这篇文章改写成 5 条 X 帖子、3 条 LinkedIn 帖子和 5 条短 caption，要求实用，不套话。' }
    ],
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
      {
        title_en: 'Define what to compare',
        title_zh: '先定义比较维度',
        goal_en: 'Keep the research focused.',
        goal_zh: '避免研究发散。',
        body_en: 'Decide whether you are comparing positioning, features, pricing, or messaging.',
        body_zh: '先决定这次重点看定位、功能、定价还是文案表达。',
        tools: ['ChatGPT']
      },
      {
        title_en: 'Collect visible competitor signals',
        title_zh: '收集公开信号',
        goal_en: 'Capture enough public data for a fast judgment.',
        goal_zh: '快速抓到足够做判断的公开信息。',
        body_en: 'Review homepages, pricing pages, headlines, and key feature blocks.',
        body_zh: '重点看首页、定价页、首屏文案和核心功能模块。',
        tools: ['Perplexity']
      },
      {
        title_en: 'Summarize positioning and gaps',
        title_zh: '总结定位和空档',
        goal_en: 'Turn raw notes into decisions.',
        goal_zh: '把信息整理成决策结论。',
        body_en: 'Group competitors by angle and identify where your product can be clearer or different.',
        body_zh: '把竞品按路线分组，再找出你可以打得更清楚或更差异化的点。',
        tools: ['ChatGPT']
      }
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
      {
        title_en: 'Clarify the feature',
        title_zh: '先把需求说清楚',
        goal_en: 'Reduce rework before coding.',
        goal_zh: '减少返工。',
        body_en: 'Ask AI to restate the feature, assumptions, edge cases, and acceptance criteria.',
        body_zh: '先让 AI 帮你重述需求、补假设、列边界条件和验收标准。',
        tools: ['Claude', 'ChatGPT']
      },
      {
        title_en: 'Plan file-level changes',
        title_zh: '先做文件级改动计划',
        goal_en: 'Know where to change code before writing it.',
        goal_zh: '写代码前先确定改哪些文件。',
        body_en: 'Map the likely touched files, components, APIs, and data flow.',
        body_zh: '明确会影响哪些文件、组件、接口和数据流。',
        tools: ['Claude', 'Cursor']
      },
      {
        title_en: 'Implement in small batches',
        title_zh: '小步实现',
        goal_en: 'Keep the code reviewable and testable.',
        goal_zh: '让改动可控、可测试。',
        body_en: 'Generate code in chunks, validate each chunk, and avoid giant one-shot edits.',
        body_zh: '分批生成和验证代码，不要一次性生成大坨改动。',
        tools: ['Cursor', 'Claude']
      },
      {
        title_en: 'Debug with structured prompts',
        title_zh: '结构化调试',
        goal_en: 'Use AI for diagnosis, not random guessing.',
        goal_zh: '让 AI 帮你定位，而不是乱猜。',
        body_en: 'Provide the error, expected behavior, relevant code, and recent changes.',
        body_zh: '把报错、预期行为、相关代码和最近改动一起喂给 AI。',
        tools: ['Claude', 'ChatGPT']
      },
      {
        title_en: 'Document and ship',
        title_zh: '整理说明并发布',
        goal_en: 'Leave the change understandable for future you.',
        goal_zh: '让未来的你也看得懂这次改了什么。',
        body_en: 'Generate a short changelog, test checklist, and known limitations before shipping.',
        body_zh: '上线前让 AI 帮你整理 changelog、测试清单和已知限制。',
        tools: ['Claude', 'ChatGPT']
      }
    ],
    prompts_en: [{ title: 'Feature clarification prompt', text: 'Restate this feature request as a concrete implementation plan. Include assumptions, edge cases, touched files, and acceptance criteria: [REQUEST]' }],
    prompts_zh: [{ title: '需求澄清 Prompt', text: '把这个功能需求重述成可执行实现计划，补充假设、边界条件、可能影响的文件和验收标准：[REQUEST]' }],
    variations_en: [{ title: 'MVP-first version', text: 'Implement only the smallest working version first, postpone refactors.' }],
    variations_zh: [{ title: 'MVP 优先版', text: '先实现最小可用版本，重构和扩展留到后面。' }],
    faqs_en: [{ q: 'Should I let AI edit large code sections directly?', a: 'Usually no. Smaller, controlled edits are safer and easier to verify.' }],
    faqs_zh: [{ q: '可以直接让 AI 一次性改很多代码吗？', a: '一般不建议。小步改动更安全，也更容易验证。' }],
    related: ['research-competitors-in-30-minutes', 'write-seo-blog-posts-with-ai']
  }
];

export function getWorkflowBySlug(slug: string) {
  return workflows.find((item) => item.slug === slug);
}
