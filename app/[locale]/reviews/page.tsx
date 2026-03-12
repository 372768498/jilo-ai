"use client";
import { useState, useMemo } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = { params: { locale: string } };

// 评测文章数据（后续可迁移到 Supabase）
const reviews = [
  {
    slug: "chatgpt-vs-claude",
    title_en: "ChatGPT vs Claude 2025: Complete Comparison Guide",
    title_zh: "ChatGPT vs Claude 2025：全面深度对比指南",
    description_en: "An in-depth comparison of ChatGPT and Claude across writing, coding, reasoning, creativity, and pricing. Find out which AI is right for you.",
    description_zh: "从写作、编程、推理、创意和价格五大维度深度对比 ChatGPT 和 Claude，帮你找到最适合的 AI 助手。",
    category: "AI Chatbots",
    date: "2025-01-30",
    readTime: "12 min",
    featured: true,
  },
  {
    slug: "midjourney-vs-dalle",
    title_en: "Midjourney vs DALL-E 3: Ultimate AI Art Comparison",
    title_zh: "Midjourney vs DALL-E 3：AI绘图工具终极对比",
    description_en: "Compare Midjourney and DALL-E 3 across image quality, style diversity, ease of use, pricing, and commercial licensing.",
    description_zh: "从图像质量、风格多样性、易用性、价格和商用授权全面对比 Midjourney 和 DALL-E 3。",
    category: "AI Art",
    date: "2025-01-30",
    readTime: "10 min",
    featured: true,
  },
  {
    slug: "best-ai-coding-tools",
    title_en: "10 Best AI Coding Assistants in 2025 (Compared)",
    title_zh: "2025 年 10 款最佳 AI 编程助手（深度对比）",
    description_en: "Compare GitHub Copilot, Cursor, Claude Code, and 7 more AI coding tools. Features, pricing, pros & cons for every developer.",
    description_zh: "对比 GitHub Copilot、Cursor、Claude Code 等 10 款 AI 编程工具，功能、价格、优缺点一网打尽。",
    category: "AI Coding",
    date: "2025-01-30",
    readTime: "15 min",
    featured: true,
  },
  {
    slug: "best-chinese-ai-models",
    title_en: "Best Chinese AI Models 2025: DeepSeek vs Doubao vs Qwen vs Kimi",
    title_zh: "2025 国产AI大模型横评：DeepSeek vs 豆包 vs 通义千问 vs 文心一言 vs Kimi",
    description_en: "Compare China's top AI models: DeepSeek, Doubao (ByteDance), Qwen (Alibaba), Ernie Bot (Baidu), and Kimi (Moonshot). Features, pricing, and real-world performance.",
    description_zh: "深度对比五大国产AI大模型：DeepSeek、豆包、通义千问、文心一言、Kimi。中文能力、编程、创意写作、价格全方位评测。",
    category: "国产AI",
    date: "2025-01-30",
    readTime: "15 min",
    featured: true,
  },
  {
    slug: "best-ai-writing-tools",
    title_en: "8 Best AI Writing Tools in 2025 (Tested & Compared)",
    title_zh: "2025 年 8 款最佳 AI 写作工具（实测对比）",
    description_en: "Compare Jasper, Copy.ai, Writesonic, Notion AI, and more. Find the best AI writing assistant for blogs, marketing, and academic writing.",
    description_zh: "对比 Jasper、Copy.ai、Writesonic、Notion AI 等 8 款 AI 写作工具，含秘塔写作猫、通义智文等国产推荐。",
    category: "AI Writing",
    date: "2025-01-30",
    readTime: "12 min",
    featured: false,
  },
  {
    slug: "best-ai-image-generators",
    title_en: "Best AI Image Generators 2025: Midjourney, DALL-E, SD & More",
    title_zh: "2025 最佳 AI 图片生成器：Midjourney、DALL-E、SD 全面对比",
    description_en: "Compare Midjourney, DALL-E 3, Stable Diffusion, Leonardo AI, Ideogram, and Flux across quality, pricing, and commercial use.",
    description_zh: "全面对比 6 大 AI 绘图工具的图片质量、文字渲染、风格控制、价格和商用授权。",
    category: "AI Art",
    date: "2025-01-30",
    readTime: "14 min",
    featured: false,
  },
  {
    slug: "ai-tools-for-students",
    title_en: "15 Best Free AI Tools for Students in 2025",
    title_zh: "2025 学生必备 AI 工具推荐（含免费工具 + 国内可用）",
    description_en: "Discover the best free AI tools for studying, writing essays, solving math, learning to code, and more.",
    description_zh: "覆盖学习辅助、论文写作、数学解题、编程学习、语言学习、笔记整理，优先推荐免费和国内可用工具。",
    category: "Education",
    date: "2025-01-30",
    readTime: "10 min",
    featured: false,
  },
  {
    slug: "best-ai-video-generators",
    title_en: "Best AI Video Generators 2025: Runway, Sora, Kling & More",
    title_zh: "2025 最佳 AI 视频生成工具：Runway、Sora、可灵全面对比",
    description_en: "Compare Runway Gen-3, Sora, Kling, Pika, and Luma across video quality, motion control, and pricing.",
    description_zh: "对比 Runway Gen-3、Sora、可灵、Pika 等 AI 视频工具的画质、运动控制和价格。",
    category: "AI Video",
    date: "2025-01-31",
    readTime: "13 min",
    featured: true,
  },
  {
    slug: "best-free-ai-tools",
    title_en: "25 Best Free AI Tools in 2025 (No Credit Card Required)",
    title_zh: "2025 完全免费的 AI 工具推荐（不花一分钱）",
    description_en: "The ultimate list of free AI tools across chatbots, image generation, coding, writing, and more. No signup tricks.",
    description_zh: "覆盖聊天、绘图、编程、写作等品类的免费 AI 工具大全，真正免费可用。",
    category: "Free Tools",
    date: "2025-01-31",
    readTime: "11 min",
    featured: true,
  },
  {
    slug: "ai-for-business",
    title_en: "AI Tools for Business 2025: Complete Enterprise Guide",
    title_zh: "2025 企业 AI 工具指南：从客服到数据分析",
    description_en: "How to use AI in business: customer service, data analysis, marketing, HR, and document processing with ROI analysis.",
    description_zh: "企业如何用 AI 提效：客服自动化、数据分析、营销、HR、文档处理，含 ROI 分析。",
    category: "Business",
    date: "2025-01-31",
    readTime: "14 min",
    featured: false,
  },
  {
    slug: "how-to-use-chatgpt-effectively",
    title_en: "How to Use ChatGPT Effectively: Complete Guide (2025)",
    title_zh: "ChatGPT 高效使用指南：从入门到精通（2025）",
    description_en: "Master ChatGPT with advanced prompting techniques, GPTs customization, API usage, and 10 practical prompt templates.",
    description_zh: "掌握 ChatGPT 高级提示词技巧、GPTs 自定义、API 使用，附 10 个实用 Prompt 模板。",
    category: "Tutorial",
    date: "2025-01-31",
    readTime: "15 min",
    featured: true,
  },
  {
    slug: "how-to-use-midjourney",
    title_en: "How to Use Midjourney: Complete Beginner's Guide (2025)",
    title_zh: "Midjourney 完全上手指南：从注册到出图（2025）",
    description_en: "Step-by-step Midjourney tutorial with parameter guides, 10 prompt templates, and style comparison examples.",
    description_zh: "手把手教你使用 Midjourney，含参数详解、10 个提示词模板和风格对比。",
    category: "Tutorial",
    date: "2025-01-31",
    readTime: "13 min",
    featured: false,
  },
  {
    slug: "prompt-engineering-guide",
    title_en: "Prompt Engineering Guide: Make AI Do What You Want (2025)",
    title_zh: "AI 提示词工程指南：让 AI 听你的话（2025）",
    description_en: "Learn prompt engineering from basics to advanced: role-playing, chain of thought, few-shot learning, and 10 universal frameworks.",
    description_zh: "系统学习提示词工程：角色设定、思维链、Few-shot 等技巧，附 10 个万能框架。",
    category: "Tutorial",
    date: "2025-01-31",
    readTime: "16 min",
    featured: true,
  },
  {
    slug: "openclaw-review-and-setup-guide",
    title_en: "OpenClaw Review & Setup Guide: The AI Assistant with 120K GitHub Stars",
    title_zh: "OpenClaw 深度评测：GitHub 12万Star的AI助手到底有多强？",
    description_en: "In-depth review of OpenClaw (formerly Moltbot/Clawdbot) — the hottest open-source AI assistant of 2025. Setup guide, features, pricing, and comparison.",
    description_zh: "深度评测 2025 最火开源 AI 助手 OpenClaw，含安装教程、功能介绍、费用分析和对比。",
    category: "AI Agent",
    date: "2025-01-31",
    readTime: "15 min",
    featured: true,
  },
  {
    slug: "best-ai-agents",
    title_en: "10 Best AI Agents in 2025: OpenClaw, AutoGPT, CrewAI & More",
    title_zh: "2025 十大 AI Agent 工具横评：OpenClaw、AutoGPT、CrewAI",
    description_en: "Compare the top AI agents: OpenClaw, AutoGPT, CrewAI, LangChain, Microsoft Copilot, Devin, and more.",
    description_zh: "对比十大 AI 智能体工具，含国产方案 Coze、Dify 等。",
    category: "AI Agent",
    date: "2025-01-31",
    readTime: "16 min",
    featured: true,
  },
  {
    slug: "chatgpt-vs-deepseek",
    title_en: "ChatGPT vs DeepSeek 2025: Which AI Is Actually Better?",
    title_zh: "ChatGPT vs DeepSeek 深度对比：到底谁更强？（2025）",
    description_en: "Head-to-head comparison of ChatGPT and DeepSeek across reasoning, coding, Chinese, pricing, and privacy.",
    description_zh: "全面对比 ChatGPT 和 DeepSeek：推理、编程、中文、价格、隐私，帮你选对工具。",
    category: "AI Chatbots",
    date: "2025-01-31",
    readTime: "14 min",
    featured: true,
  },
  {
    slug: "how-to-make-money-with-ai",
    title_en: "How to Make Money with AI in 2025: 15 Proven Methods",
    title_zh: "2025 用 AI 赚钱的 15 种方法（附实操指南）",
    description_en: "15 proven ways to earn money using AI tools — from freelancing to SaaS, with income estimates and step-by-step guides.",
    description_zh: "15 种用 AI 赚钱的实操方法，含预期收入、推荐工具和入门步骤。",
    category: "Make Money",
    date: "2025-01-31",
    readTime: "16 min",
    featured: true,
  },
  {
    slug: "sora-vs-kling-vs-runway",
    title_en: "Sora vs Kling vs Runway 2025: AI Video Generator Showdown",
    title_zh: "Sora vs 可灵 vs Runway：AI视频生成三巨头终极对比",
    description_en: "Compare Sora, Kling, and Runway across video quality, motion control, pricing, and commercial licensing.",
    description_zh: "三大 AI 视频生成工具的画质、运动控制、价格和商用对比。",
    category: "AI Video",
    date: "2025-01-31",
    readTime: "13 min",
    featured: true,
  },
  {
    slug: "kimi-k2-5-review",
    title_en: "Kimi K2.5 Review: Moonshot AI's Latest Model Explained",
    title_zh: "Kimi K2.5 深度解读：月之暗面最新大模型有多强？",
    description_en: "In-depth review of Kimi K2.5 — Moonshot AI's latest model with 128K context, strong Chinese capabilities, and competitive benchmarks.",
    description_zh: "深度解读 Kimi K2.5：128K 上下文、中文能力领先、基准测试对比分析。",
    category: "国产AI",
    date: "2025-01-31",
    readTime: "11 min",
    featured: true,
  },
  {
    slug: "best-ai-language-learning",
    title_en: "10 Best AI Language Learning Tools in 2025 (Beyond Duolingo)",
    title_zh: "2025 十大 AI 语言学习工具推荐（不只是多邻国）",
    description_en: "Compare Duolingo Max, ChatGPT, Speak, Elsa, and more AI-powered language learning tools.",
    description_zh: "对比十大 AI 语言学习工具，含流利说、有道等国产推荐。",
    category: "Education",
    date: "2025-01-31",
    readTime: "12 min",
    featured: false,
  },
  {
    slug: "perplexity-vs-google-vs-chatgpt-search",
    title_en: "Perplexity vs Google vs ChatGPT Search: The Ultimate AI Search Showdown (2025)",
    title_zh: "Perplexity vs Google vs ChatGPT Search：AI 搜索引擎终极对比（2025）",
    description_en: "Compare the top AI search engines across accuracy, citations, real-time data, and pricing.",
    description_zh: "三大 AI 搜索引擎全面对比：准确性、引用、实时性和价格。",
    category: "AI Search",
    date: "2025-01-31",
    readTime: "14 min",
    featured: true,
  },
  {
    slug: "best-ai-presentation-tools",
    title_en: "10 Best AI Presentation Tools in 2025: Create Stunning Slides in Minutes",
    title_zh: "2025 十大 AI 做 PPT 工具：一键生成专业演示文稿",
    description_en: "Compare the best AI presentation makers: Gamma, Beautiful.ai, Tome, SlidesAI, Canva AI and more.",
    description_zh: "对比十大 AI PPT 工具，含讯飞智文、WPS AI 等国产推荐。",
    category: "AI Productivity",
    date: "2025-01-31",
    readTime: "13 min",
    featured: true,
  },
  {
    slug: "cursor-vs-github-copilot-vs-windsurf",
    title_en: "Cursor vs GitHub Copilot vs Windsurf: Best AI Code Editor Compared (2025)",
    title_zh: "Cursor vs GitHub Copilot vs Windsurf：AI 编程 IDE 深度对比（2025）",
    description_en: "Head-to-head comparison of the top AI coding IDEs across code completion, agent mode, and pricing.",
    description_zh: "三大 AI 编程 IDE 全面对比，含国产替代推荐。",
    category: "AI Coding",
    date: "2025-01-31",
    readTime: "15 min",
    featured: true,
  },
  {
    slug: "claude-vs-gemini",
    title_en: "Claude vs Gemini 2025: Which Is the Best ChatGPT Alternative?",
    title_zh: "Claude vs Gemini 2025：谁才是 ChatGPT 最强挑战者？",
    description_en: "Compare Claude vs Gemini across reasoning, coding, creativity, multimodal, and enterprise features.",
    description_zh: "全面对比 Claude 和 Gemini 的推理、编程、创意和企业功能。",
    category: "AI Chatbots",
    date: "2025-01-31",
    readTime: "14 min",
    featured: true,
  },
  {
    slug: "best-ai-music-generators",
    title_en: "Best AI Music Generators 2025: Suno vs Udio & More",
    title_zh: "2025 最佳 AI 音乐生成工具：Suno vs Udio 全面对比",
    description_en: "Compare the best AI music generators: Suno, Udio, Stable Audio, AIVA, and more.",
    description_zh: "对比最佳 AI 音乐生成工具，含国产天工音乐、网易天音推荐。",
    category: "AI Audio",
    date: "2025-01-31",
    readTime: "12 min",
    featured: true,
  },
  {
    slug: "notebooklm-review-and-alternatives",
    title_en: "NotebookLM Review & 5 Best Alternatives (2025)",
    title_zh: "NotebookLM 深度评测 + 5 个最佳替代品（2025）",
    description_en: "In-depth review of Google NotebookLM plus the best alternatives for AI note-taking and research.",
    description_zh: "深度评测 NotebookLM，含通义听悟、飞书智能助手等国产替代。",
    category: "AI Productivity",
    date: "2025-01-31",
    readTime: "13 min",
    featured: true,
  },
  {
    slug: "best-ai-design-tools",
    title_en: "10 Best AI Design Tools in 2025: Figma AI vs Canva AI & More",
    title_zh: "2025 十大 AI 设计工具推荐：Figma AI vs Canva AI 全面对比",
    description_en: "Compare the best AI design tools: Figma AI, Canva AI, Adobe Firefly, Framer AI and more.",
    description_zh: "对比十大 AI 设计工具，含即时AI、MasterGo AI 等国产推荐。",
    category: "AI Design",
    date: "2025-01-31",
    readTime: "14 min",
    featured: true,
  },
  {
    slug: "best-ai-translation-tools",
    title_en: "Best AI Translation Tools 2025: DeepL vs Google Translate vs ChatGPT",
    title_zh: "2025 最佳 AI 翻译工具对比：DeepL vs Google 翻译 vs ChatGPT",
    description_en: "Compare the best AI translation tools across quality, languages, and pricing.",
    description_zh: "全面对比 AI 翻译工具，含有道、百度等国产推荐。",
    category: "AI Productivity",
    date: "2025-01-31",
    readTime: "13 min",
    featured: true,
  },
  {
    slug: "best-ai-customer-service-tools",
    title_en: "10 Best AI Customer Service Tools in 2025",
    title_zh: "2025 十大 AI 客服工具推荐",
    description_en: "Compare the best AI customer service tools for automated support.",
    description_zh: "对比十大 AI 客服工具，含智齿科技、网易七鱼等。",
    category: "AI Business",
    date: "2025-01-31",
    readTime: "13 min",
    featured: false,
  },
  {
    slug: "ai-replacing-jobs-2025",
    title_en: "Will AI Replace Your Job? The Complete 2025 Analysis",
    title_zh: "AI 会取代哪些工作？2025 最全行业分析",
    description_en: "AI's impact on 15+ industries with replacement probability and career advice.",
    description_zh: "全面分析 AI 对 15+ 行业的影响，含转型建议。",
    category: "AI Insights",
    date: "2025-01-31",
    readTime: "16 min",
    featured: true,
  },
  {
    slug: "best-ai-email-tools",
    title_en: "10 Best AI Email Tools in 2025: Write Better Emails Faster",
    title_zh: "2025 十大 AI 邮件工具：智能写邮件，提升沟通效率",
    description_en: "Compare the best AI email assistants for writing, scheduling, and managing emails with smart automation.",
    description_zh: "对比十大 AI 邮件工具，含写邮件助手、智能调度和邮件管理自动化功能。",
    category: "AI Productivity",
    date: "2025-01-31",
    readTime: "12 min",
    featured: false,
  },
  {
    slug: "midjourney-v7-review",
    title_en: "Midjourney V7 Review: Is It Worth the Upgrade? (2025)",
    title_zh: "Midjourney V7 深度评测：值得升级吗？（2025）",
    description_en: "In-depth review of Midjourney V7 with new features, image quality improvements, and comparison with V6.",
    description_zh: "Midjourney V7 深度评测，新功能解析、图像质量提升和与 V6 版本对比。",
    category: "AI Art",
    date: "2025-01-31",
    readTime: "11 min",
    featured: false,
  },
  {
    slug: "best-ai-video-editing-tools",
    title_en: "10 Best AI Video Editing Tools in 2025: Cut, Edit & Enhance Videos",
    title_zh: "2025 十大 AI 视频剪辑工具：智能剪辑、特效和增强",
    description_en: "Compare the best AI video editing software with automatic cutting, effects, and enhancement features.",
    description_zh: "对比十大 AI 视频剪辑软件，含自动剪辑、特效制作和画质增强功能。",
    category: "AI Video",
    date: "2025-01-31",
    readTime: "13 min",
    featured: false,
  },
  {
    slug: "chatgpt-plugins-and-gpts-guide",
    title_en: "ChatGPT Plugins & GPTs: The Complete Guide to Customizing ChatGPT (2025)",
    title_zh: "ChatGPT 插件与 GPTs 完全指南：打造你的专属 AI 助手（2025）",
    description_en: "Complete guide to ChatGPT GPTs and plugins - discover the best GPTs, learn to create your own, explore monetization strategies, and master the Actions API for custom AI assistants.",
    description_zh: "ChatGPT GPTs 和插件完全指南 - 发现最佳 GPTs、学会创建自己的 AI 助手、探索变现策略，以及国内替代方案（Coze、文心智能体、Kimi+）全解析",
    category: "AI Tutorial",
    date: "2025-01-31",
    readTime: "15 min",
    featured: true,
  },
];

// Metadata is handled by layout.tsx for client components

export default function ReviewsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  
  // 分类筛选状态
  const [selectedCategory, setSelectedCategory] = useState("全部");
  
  // 提取所有唯一的分类
  const categories = useMemo(() => {
    const allCategories = reviews.map(review => review.category);
    const uniqueCategories = Array.from(new Set(allCategories));
    return [isZh ? "全部" : "All", ...uniqueCategories];
  }, [isZh]);
  
  // 根据选中的分类筛选文章
  const filteredReviews = useMemo(() => {
    if (selectedCategory === "全部" || selectedCategory === "All") {
      return reviews;
    }
    return reviews.filter(review => review.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="text-sm mb-6 text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {isZh ? "首页" : "Home"}
          </Link>
          {" / "}
          <span className="text-foreground">{isZh ? "深度评测" : "Reviews"}</span>
        </div>

        <h1 className="text-4xl font-bold mb-4">
          {isZh ? "🔍 AI工具深度评测" : "🔍 AI Tool Reviews & Comparisons"}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {isZh
            ? "不只是工具列表，我们提供真实的深度评测和横向对比，帮你做出最佳选择。"
            : "More than just listings — we provide honest, in-depth reviews and head-to-head comparisons to help you choose wisely."}
        </p>

        {/* 分类筛选标签 */}
        <div className="mb-8">
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition ${
                  selectedCategory === category
                    ? "bg-primary text-white"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">
                {isZh ? '不只看评测，也可以直接看工作流' : 'Not just reviews — you can also jump straight to workflows'}
              </h2>
              <p className="text-sm text-slate-600">
                {isZh ? '如果你已经知道要解决什么问题，而不是只想比较工具，可以直接进入工作流库。' : 'If you already know the job to be done, start with workflows instead of only comparing tools.'}
              </p>
            </div>
            <Link href={`/${locale}/workflows`} className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
              {isZh ? '浏览工作流' : 'Browse Workflows'} →
            </Link>
          </div>
        </div>

        {/* 筛选后的评测文章 */}
        <div className="grid gap-6">
          {filteredReviews.map((review) => (
            <Link
              key={review.slug}
              href={`/${locale}/reviews/${review.slug}`}
              className="block p-6 border rounded-xl hover:shadow-lg transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {review.category}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {review.readTime} {isZh ? "阅读" : "read"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition">
                    {isZh ? review.title_zh : review.title_en}
                  </h2>
                  <p className="text-muted-foreground">
                    {isZh ? review.description_zh : review.description_en}
                  </p>
                </div>
                <span className="text-2xl ml-4 group-hover:translate-x-1 transition">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
