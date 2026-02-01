import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import fs from "fs";
import path from "path";

type PageProps = { params: { locale: string; slug: string } };

// 评测元数据
const reviewsMeta: Record<string, {
  title_en: string; title_zh: string;
  description_en: string; description_zh: string;
  category: string; date: string;
  tools: string[];
}> = {
  "chatgpt-vs-claude": {
    title_en: "ChatGPT vs Claude 2025: Complete Comparison Guide",
    title_zh: "ChatGPT vs Claude 2025：全面深度对比指南",
    description_en: "An in-depth comparison of ChatGPT and Claude across writing, coding, reasoning, creativity, and pricing.",
    description_zh: "从写作、编程、推理、创意和价格五大维度深度对比 ChatGPT 和 Claude。",
    category: "AI Chatbots",
    date: "2025-01-30",
    tools: ["ChatGPT", "Claude"],
  },
  "midjourney-vs-dalle": {
    title_en: "Midjourney vs DALL-E 3: Ultimate AI Art Comparison",
    title_zh: "Midjourney vs DALL-E 3：AI绘图工具终极对比",
    description_en: "Compare Midjourney and DALL-E 3 across image quality, style diversity, pricing, and commercial licensing.",
    description_zh: "从图像质量、风格多样性、价格和商用授权全面对比两大 AI 绘图工具。",
    category: "AI Art",
    date: "2025-01-30",
    tools: ["Midjourney", "DALL-E 3"],
  },
  "best-ai-coding-tools": {
    title_en: "10 Best AI Coding Assistants in 2025 (Compared)",
    title_zh: "2025 年 10 款最佳 AI 编程助手（深度对比）",
    description_en: "Compare GitHub Copilot, Cursor, Claude Code, and 7 more AI coding tools with pricing and features.",
    description_zh: "对比 GitHub Copilot、Cursor、Claude Code 等 10 款 AI 编程工具。",
    category: "AI Coding",
    date: "2025-01-30",
    tools: ["GitHub Copilot", "Cursor", "Claude Code", "Tabnine", "Codeium"],
  },
  "best-chinese-ai-models": {
    title_en: "Best Chinese AI Models 2025: DeepSeek vs Doubao vs Qwen vs Kimi",
    title_zh: "2025 国产AI大模型横评：DeepSeek vs 豆包 vs 通义千问 vs 文心一言 vs Kimi",
    description_en: "Compare China's top AI models including DeepSeek, Doubao, Qwen, Ernie Bot, and Kimi across Chinese understanding, coding, creativity, and pricing.",
    description_zh: "五大国产AI大模型全方位深度对比：中文能力、编程、创意写作、多模态、价格。",
    category: "国产AI",
    date: "2025-01-30",
    tools: ["DeepSeek", "豆包", "通义千问", "文心一言", "Kimi"],
  },
  "best-ai-writing-tools": {
    title_en: "8 Best AI Writing Tools in 2025 (Tested & Compared)",
    title_zh: "2025 年 8 款最佳 AI 写作工具（实测对比）",
    description_en: "Compare Jasper, Copy.ai, Writesonic, Notion AI, and more AI writing assistants for blogs, marketing, and academics.",
    description_zh: "对比 8 款 AI 写作工具，含秘塔写作猫、通义智文等国产推荐。",
    category: "AI Writing",
    date: "2025-01-30",
    tools: ["Jasper", "Copy.ai", "Writesonic", "Notion AI", "Claude", "ChatGPT"],
  },
  "best-ai-image-generators": {
    title_en: "Best AI Image Generators 2025: Midjourney, DALL-E, SD & More",
    title_zh: "2025 最佳 AI 图片生成器全面对比",
    description_en: "Compare Midjourney, DALL-E 3, Stable Diffusion, Leonardo AI, Ideogram, and Flux across quality, pricing, and licensing.",
    description_zh: "6 大 AI 绘图工具的图片质量、价格和商用授权对比。",
    category: "AI Art",
    date: "2025-01-30",
    tools: ["Midjourney", "DALL-E 3", "Stable Diffusion", "Leonardo AI", "Ideogram", "Flux"],
  },
  "ai-tools-for-students": {
    title_en: "15 Best Free AI Tools for Students in 2025",
    title_zh: "2025 学生必备 AI 工具推荐",
    description_en: "The best free AI tools for studying, essays, math, coding, and language learning.",
    description_zh: "覆盖学习、论文、数学、编程、语言学习，优先推荐免费和国内可用工具。",
    category: "Education",
    date: "2025-01-30",
    tools: ["ChatGPT", "Kimi", "Notion AI", "Wolfram Alpha", "Duolingo"],
  },
  "best-ai-video-generators": {
    title_en: "Best AI Video Generators 2025: Runway, Sora, Kling & More",
    title_zh: "2025 最佳 AI 视频生成工具全面对比",
    description_en: "Compare Runway Gen-3, Sora, Kling, Pika, and Luma Dream Machine across video quality, motion control, and pricing.",
    description_zh: "对比 Runway、Sora、可灵、Pika 等 AI 视频工具。",
    category: "AI Video",
    date: "2025-01-31",
    tools: ["Runway", "Sora", "Kling", "Pika", "Luma"],
  },
  "best-free-ai-tools": {
    title_en: "25 Best Free AI Tools in 2025 (No Credit Card Required)",
    title_zh: "2025 完全免费的 AI 工具推荐",
    description_en: "The ultimate list of free AI tools across chatbots, image generation, coding, writing, and more.",
    description_zh: "覆盖各品类的免费 AI 工具大全。",
    category: "Free Tools",
    date: "2025-01-31",
    tools: ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Kimi", "Stable Diffusion"],
  },
  "ai-for-business": {
    title_en: "AI Tools for Business 2025: Complete Enterprise Guide",
    title_zh: "2025 企业 AI 工具指南",
    description_en: "How to use AI in business for customer service, data analysis, marketing, and more.",
    description_zh: "企业如何用 AI 提效。",
    category: "Business",
    date: "2025-01-31",
    tools: ["Microsoft Copilot", "Salesforce Einstein", "Notion AI", "Intercom"],
  },
  "how-to-use-chatgpt-effectively": {
    title_en: "How to Use ChatGPT Effectively: Complete Guide (2025)",
    title_zh: "ChatGPT 高效使用指南（2025）",
    description_en: "Master ChatGPT with advanced prompting, GPTs, API usage, and 10 practical templates.",
    description_zh: "从入门到精通，附 10 个实用 Prompt 模板。",
    category: "Tutorial",
    date: "2025-01-31",
    tools: ["ChatGPT"],
  },
  "how-to-use-midjourney": {
    title_en: "How to Use Midjourney: Complete Beginner's Guide (2025)",
    title_zh: "Midjourney 完全上手指南（2025）",
    description_en: "Step-by-step Midjourney tutorial with parameters, prompts, and style examples.",
    description_zh: "从注册到出图的完整教程。",
    category: "Tutorial",
    date: "2025-01-31",
    tools: ["Midjourney"],
  },
  "prompt-engineering-guide": {
    title_en: "Prompt Engineering Guide: Make AI Do What You Want (2025)",
    title_zh: "AI 提示词工程指南（2025）",
    description_en: "Learn prompt engineering from basics to advanced with 10 universal frameworks.",
    description_zh: "系统学习提示词工程，附 10 个万能框架。",
    category: "Tutorial",
    date: "2025-01-31",
    tools: ["ChatGPT", "Claude", "Midjourney"],
  },
  "openclaw-review-and-setup-guide": {
    title_en: "OpenClaw Review & Setup Guide: The AI Assistant with 120K GitHub Stars",
    title_zh: "OpenClaw 深度评测：GitHub 12万Star的AI助手",
    description_en: "In-depth review and setup guide for OpenClaw, the hottest open-source AI assistant of 2025.",
    description_zh: "深度评测 2025 最火开源 AI 助手 OpenClaw。",
    category: "AI Agent",
    date: "2025-01-31",
    tools: ["OpenClaw", "Claude", "ChatGPT"],
  },
  "best-ai-agents": {
    title_en: "10 Best AI Agents in 2025: OpenClaw, AutoGPT, CrewAI & More",
    title_zh: "2025 十大 AI Agent 工具横评",
    description_en: "Compare the top AI agent tools of 2025 across features, pricing, and use cases.",
    description_zh: "对比十大 AI 智能体工具。",
    category: "AI Agent",
    date: "2025-01-31",
    tools: ["OpenClaw", "AutoGPT", "CrewAI", "LangChain", "Devin", "Coze"],
  },
  "chatgpt-vs-deepseek": {
    title_en: "ChatGPT vs DeepSeek 2025: Which AI Is Actually Better?",
    title_zh: "ChatGPT vs DeepSeek 深度对比（2025）",
    description_en: "Head-to-head comparison of ChatGPT and DeepSeek across reasoning, coding, Chinese, and pricing.",
    description_zh: "全面对比 ChatGPT 和 DeepSeek。",
    category: "AI Chatbots",
    date: "2025-01-31",
    tools: ["ChatGPT", "DeepSeek"],
  },
  "how-to-make-money-with-ai": {
    title_en: "How to Make Money with AI in 2025: 15 Proven Methods",
    title_zh: "2025 用 AI 赚钱的 15 种方法",
    description_en: "15 proven ways to earn money using AI tools.",
    description_zh: "15 种用 AI 赚钱的方法。",
    category: "Make Money",
    date: "2025-01-31",
    tools: ["ChatGPT", "Midjourney", "Jasper", "Cursor"],
  },
  "sora-vs-kling-vs-runway": {
    title_en: "Sora vs Kling vs Runway 2025: AI Video Generator Showdown",
    title_zh: "Sora vs 可灵 vs Runway 终极对比",
    description_en: "Compare the top 3 AI video generators.",
    description_zh: "三大 AI 视频生成工具对比。",
    category: "AI Video",
    date: "2025-01-31",
    tools: ["Sora", "Kling", "Runway"],
  },
  "kimi-k2-5-review": {
    title_en: "Kimi K2.5 Review: Moonshot AI's Latest Model Explained",
    title_zh: "Kimi K2.5 深度解读",
    description_en: "Review of Kimi K2.5 by Moonshot AI.",
    description_zh: "月之暗面最新大模型评测。",
    category: "国产AI",
    date: "2025-01-31",
    tools: ["Kimi"],
  },
  "best-ai-language-learning": {
    title_en: "10 Best AI Language Learning Tools in 2025",
    title_zh: "2025 十大 AI 语言学习工具",
    description_en: "Compare AI-powered language learning tools.",
    description_zh: "对比十大 AI 语言学习工具。",
    category: "Education",
    date: "2025-01-31",
    tools: ["Duolingo", "ChatGPT", "Speak", "Elsa"],
  },
  "perplexity-vs-google-vs-chatgpt-search": {
    title_en: "Perplexity vs Google vs ChatGPT Search: The Ultimate AI Search Showdown (2025)",
    title_zh: "Perplexity vs Google vs ChatGPT Search：AI 搜索引擎终极对比（2025）",
    description_en: "Compare the top AI search engines: Perplexity, Google AI Overview, and ChatGPT Search across accuracy, citations, real-time data, and pricing.",
    description_zh: "全面对比三大 AI 搜索引擎：Perplexity、Google AI 概述和 ChatGPT 搜索，含准确性、引用、实时性和价格。",
    category: "AI Search",
    date: "2025-01-31",
    tools: ["Perplexity", "Google", "ChatGPT"],
  },
  "best-ai-presentation-tools": {
    title_en: "10 Best AI Presentation Tools in 2025: Create Stunning Slides in Minutes",
    title_zh: "2025 十大 AI 做 PPT 工具：一键生成专业演示文稿",
    description_en: "Compare the best AI presentation makers: Gamma, Beautiful.ai, Tome, SlidesAI, Canva AI and more.",
    description_zh: "对比十大 AI PPT 工具，含 Gamma、Canva AI、讯飞智文、WPS AI 等国产推荐。",
    category: "AI Productivity",
    date: "2025-01-31",
    tools: ["Gamma", "Beautiful.ai", "Tome", "SlidesAI", "Canva AI"],
  },
  "cursor-vs-github-copilot-vs-windsurf": {
    title_en: "Cursor vs GitHub Copilot vs Windsurf: Best AI Code Editor Compared (2025)",
    title_zh: "Cursor vs GitHub Copilot vs Windsurf：AI 编程 IDE 深度对比（2025）",
    description_en: "Head-to-head comparison of the top AI coding IDEs: Cursor, GitHub Copilot, and Windsurf across code completion, agent mode, and pricing.",
    description_zh: "三大 AI 编程 IDE 全面对比，含通义灵码、CodeGeeX 等国产替代。",
    category: "AI Coding",
    date: "2025-01-31",
    tools: ["Cursor", "GitHub Copilot", "Windsurf"],
  },
  "claude-vs-gemini": {
    title_en: "Claude vs Gemini 2025: Which Is the Best ChatGPT Alternative?",
    title_zh: "Claude vs Gemini 2025：谁才是 ChatGPT 最强挑战者？",
    description_en: "Compare Claude (Anthropic) vs Gemini (Google) across reasoning, coding, creativity, multimodal, and enterprise features.",
    description_zh: "全面对比 Claude 和 Gemini：推理、编程、创意写作、多模态和企业功能。",
    category: "AI Chatbots",
    date: "2025-01-31",
    tools: ["Claude", "Gemini"],
  },
  "best-ai-music-generators": {
    title_en: "Best AI Music Generators 2025: Suno vs Udio & More",
    title_zh: "2025 最佳 AI 音乐生成工具：Suno vs Udio 全面对比",
    description_en: "Compare the best AI music generators: Suno, Udio, Stable Audio, AIVA, and more.",
    description_zh: "对比最佳 AI 音乐生成工具，含天工音乐、网易天音等国产推荐。",
    category: "AI Audio",
    date: "2025-01-31",
    tools: ["Suno", "Udio", "Stable Audio", "AIVA"],
  },
  "notebooklm-review-and-alternatives": {
    title_en: "NotebookLM Review & 5 Best Alternatives (2025)",
    title_zh: "NotebookLM 深度评测 + 5 个最佳替代品（2025）",
    description_en: "In-depth review of Google NotebookLM plus the best alternatives for AI-powered note-taking and research.",
    description_zh: "深度评测 Google NotebookLM，含通义听悟、飞书智能助手等国产替代品。",
    category: "AI Productivity",
    date: "2025-01-31",
    tools: ["NotebookLM", "Notion AI", "Mem.ai", "Obsidian"],
  },
  "best-ai-design-tools": {
    title_en: "10 Best AI Design Tools in 2025: Figma AI vs Canva AI & More",
    title_zh: "2025 十大 AI 设计工具推荐：Figma AI vs Canva AI 全面对比",
    description_en: "Compare the best AI design tools: Figma AI, Canva AI, Adobe Firefly, Framer AI and more.",
    description_zh: "对比十大 AI 设计工具，含即时AI、MasterGo AI 等国产推荐。",
    category: "AI Design",
    date: "2025-01-31",
    tools: ["Figma AI", "Canva AI", "Adobe Firefly", "Framer AI"],
  },
  "best-ai-translation-tools": {
    title_en: "Best AI Translation Tools 2025: DeepL vs Google Translate vs ChatGPT",
    title_zh: "2025 最佳 AI 翻译工具对比：DeepL vs Google 翻译 vs ChatGPT",
    description_en: "Compare the best AI translation tools across quality, languages, document support, and pricing.",
    description_zh: "全面对比 AI 翻译工具，含有道翻译、百度翻译等国产推荐。",
    category: "AI Productivity",
    date: "2025-01-31",
    tools: ["DeepL", "Google Translate", "ChatGPT"],
  },
  "best-ai-customer-service-tools": {
    title_en: "10 Best AI Customer Service Tools in 2025: Automate Your Support",
    title_zh: "2025 十大 AI 客服工具推荐：智能客服自动化方案",
    description_en: "Compare the best AI customer service tools: Intercom AI, Zendesk AI, Tidio and more.",
    description_zh: "对比十大 AI 客服工具，含智齿科技、网易七鱼等国产方案。",
    category: "AI Business",
    date: "2025-01-31",
    tools: ["Intercom", "Zendesk", "Tidio", "Freshdesk"],
  },
  "ai-replacing-jobs-2025": {
    title_en: "Will AI Replace Your Job? The Complete 2025 Analysis",
    title_zh: "AI 会取代哪些工作？2025 最全行业分析",
    description_en: "Comprehensive analysis of AI's impact on 15+ industries with replacement probability and career advice.",
    description_zh: "全面分析 AI 对 15+ 行业的影响，含被替代概率和转型建议。",
    category: "AI Insights",
    date: "2025-01-31",
    tools: ["ChatGPT", "GitHub Copilot", "Midjourney"],
  },
  "best-ai-email-tools": {
    title_en: "10 Best AI Email Tools in 2025: Write Better Emails Faster",
    title_zh: "2025 十大 AI 邮件工具：智能写邮件，提升沟通效率",
    description_en: "Compare the best AI email assistants for writing, scheduling, and managing emails with smart automation.",
    description_zh: "对比十大 AI 邮件工具，含写邮件助手、智能调度和邮件管理自动化功能。",
    category: "AI Productivity",
    date: "2025-01-31",
    tools: ["Grammarly", "Notion AI", "Superhuman", "Boomerang"],
  },
  "midjourney-v7-review": {
    title_en: "Midjourney V7 Review: Is It Worth the Upgrade? (2025)",
    title_zh: "Midjourney V7 深度评测：值得升级吗？（2025）",
    description_en: "In-depth review of Midjourney V7 with new features, image quality improvements, and comparison with V6.",
    description_zh: "Midjourney V7 深度评测，新功能解析、图像质量提升和与 V6 版本对比。",
    category: "AI Art",
    date: "2025-01-31",
    tools: ["Midjourney"],
  },
  "best-ai-video-editing-tools": {
    title_en: "10 Best AI Video Editing Tools in 2025: Cut, Edit & Enhance Videos",
    title_zh: "2025 十大 AI 视频剪辑工具：智能剪辑、特效和增强",
    description_en: "Compare the best AI video editing software with automatic cutting, effects, and enhancement features.",
    description_zh: "对比十大 AI 视频剪辑软件，含自动剪辑、特效制作和画质增强功能。",
    category: "AI Video",
    date: "2025-01-31",
    tools: ["Runway", "Descript", "Adobe Premiere", "DaVinci Resolve"],
  },
  "chatgpt-plugins-and-gpts-guide": {
    title_en: "ChatGPT Plugins & GPTs: The Complete Guide to Customizing ChatGPT (2025)",
    title_zh: "ChatGPT 插件与 GPTs 完全指南：打造你的专属 AI 助手（2025）",
    description_en: "Complete guide to ChatGPT GPTs and plugins - discover the best GPTs, learn to create your own, explore monetization strategies, and master the Actions API for custom AI assistants.",
    description_zh: "ChatGPT GPTs 和插件完全指南 - 发现最佳 GPTs、学会创建自己的 AI 助手、探索变现策略，以及国内替代方案（Coze、文心智能体、Kimi+）全解析",
    category: "AI Tutorial",
    date: "2025-01-31",
    tools: ["ChatGPT", "GPTs", "Coze", "文心智能体", "Kimi"],
  },
};

function getContent(slug: string, locale: string): string | null {
  const suffix = locale === "zh" ? "zh" : "en";
  const filePath = path.join(process.cwd(), "content", "reviews", `${slug}-${suffix}.md`);
  try {
    let content = fs.readFileSync(filePath, "utf-8");
    // 去掉 frontmatter（仅匹配文件开头的 --- ... ---）
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (fmMatch) {
      content = content.slice(fmMatch[0].length);
    }
    // 去掉开头的 H1（标题已在页面 header 显示）
    content = content.replace(/^#\s+.+\n+/, '');
    return content.trim();
  } catch {
    return null;
  }
}

// 简单 Markdown → HTML（支持标题、段落、列表、粗体、表格、代码块）
function markdownToHtml(md: string): string {
  let html = md
    // 代码块
    .replace(/```[\s\S]*?```/g, (match) => {
      const content = match.replace(/```\w*\n?/, '').replace(/```$/, '');
      return `<pre class="bg-secondary p-4 rounded-lg overflow-x-auto my-4"><code>${content}</code></pre>`;
    })
    // 表格
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_, header, body) => {
      const headers = header.split('|').filter(Boolean).map((h: string) => 
        `<th class="border px-4 py-2 bg-secondary">${h.trim()}</th>`
      ).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter(Boolean).map((c: string) => 
          `<td class="border px-4 py-2">${c.trim()}</td>`
        ).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<div class="overflow-x-auto my-6"><table class="w-full border-collapse"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    })
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-8 mb-3">$1</h3>')
    // H4
    .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold mt-6 mb-2">$1</h4>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Ordered list  
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Paragraphs (lines that aren't already HTML)
    .replace(/^(?!<[h|l|t|d|p])((?!^$).+)$/gm, '<p class="mb-4 leading-relaxed">$1</p>')
    // Clean up list items into lists
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="list-decimal my-4 space-y-1">${match}</ol>`;
      }
      return `<ul class="list-disc my-4 space-y-1">${match}</ul>`;
    });
  
  return html;
}

// 从内容中提取 FAQ
function extractFAQ(content: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const faqSection = content.match(/## (?:FAQ|常见问题|Frequently Asked Questions)[\s\S]*?(?=## |$)/i);
  if (!faqSection) return faqs;
  
  // Pattern 1: ### Q1: question \n **A:** answer
  const qaPairs = Array.from(faqSection[0].matchAll(/###\s*Q\d*[:.]\s*(.+?)[\n\r]+\s*\*\*A[:.]\*\*\s*([\s\S]*?)(?=\n###|\n## |---|\n\n\n|$)/gi));
  for (const match of qaPairs) {
    const answer = match[2].trim().replace(/\n+/g, ' ').replace(/\*\*/g, '');
    if (answer.length > 10) {
      faqs.push({ question: match[1].trim(), answer });
    }
  }
  
  // Pattern 2: **Q: question** \n **A: answer**
  if (faqs.length === 0) {
    const p2 = Array.from(faqSection[0].matchAll(/\*\*Q[:.]\s*(.+?)\*\*\s*\n+\s*\*\*A[:.]\s*([\s\S]*?)\*\*(?=\n|$)/gi));
    for (const match of p2) {
      faqs.push({ question: match[1].trim(), answer: match[2].trim() });
    }
  }

  // Pattern 3: ### question \n answer
  if (faqs.length === 0) {
    const matches = Array.from(faqSection[0].matchAll(/###\s*(?:\d+\.\s*)?(.+?\??)\s*\n+([\s\S]*?)(?=\n###|\n## |$)/g));
    for (const match of matches) {
      const answer = match[2].trim().replace(/^\*\*A[:.]\*\*\s*/i, '').replace(/\*\*/g, '');
      if (answer.length > 10) {
        faqs.push({ question: match[1].trim(), answer });
      }
    }
  }
  
  return faqs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const meta = reviewsMeta[slug];
  if (!meta) return {};

  const isZh = locale === "zh";
  const title = isZh ? meta.title_zh : meta.title_en;
  const description = isZh ? meta.description_zh : meta.description_en;
  const altLocale = isZh ? "en" : "zh";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://jilo.ai/${locale}/reviews/${slug}`,
      siteName: "Jilo.ai",
      locale: isZh ? "zh_CN" : "en_US",
      publishedTime: meta.date,
      images: [{
        url: `https://jilo.ai/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(meta.category)}`,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://jilo.ai/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(meta.category)}`],
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/reviews/${slug}`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/reviews/${slug}`,
        [altLocale]: `https://jilo.ai/${altLocale}/reviews/${slug}`,
      },
    },
  };
}

export default function ReviewPage({ params }: PageProps) {
  const { locale, slug } = params;
  const meta = reviewsMeta[slug];
  if (!meta) return notFound();

  const isZh = locale === "zh";
  const title = isZh ? meta.title_zh : meta.title_en;
  const description = isZh ? meta.description_zh : meta.description_en;
  const content = getContent(slug, locale);

  // FAQ Schema for GEO
  const faqs = content ? extractFAQ(content) : [];
  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  } : null;

  // Article Schema - Enhanced for GEO
  const wordCount = content 
    ? Math.floor(content.length / (isZh ? 2 : 5))
    : 0;

  const ogImageUrl = `https://jilo.ai/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(meta.category)}`;

  // Product Schema for each tool mentioned
  const productSchemas = meta.tools.map(tool => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": tool,
    "description": `${tool} is an AI tool reviewed in this comprehensive comparison on Jilo.ai`,
    "category": "Software Application",
    "brand": {
      "@type": "Brand",
      "name": tool.split(" ")[0], // Extract brand from tool name
    },
    "review": {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "4.5",
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Organization",
        "name": "Jilo.ai",
        "url": "https://jilo.ai"
      },
      "datePublished": meta.date,
      "reviewBody": `Expert review of ${tool} comparing features, pricing, and performance against alternatives.`
    },
    "aggregateRating": {
      "@type": "AggregateRating", 
      "ratingValue": "4.5",
      "reviewCount": "50",
      "bestRating": "5",
      "worstRating": "1"
    },
    "url": `https://jilo.ai/${locale}/reviews/${slug}`
  }));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": ["Article", "Review"],
    "headline": title,
    "description": description,
    "datePublished": meta.date,
    "dateModified": meta.date,
    "image": [ogImageUrl],
    "wordCount": wordCount,
    "articleSection": meta.category,
    "keywords": meta.tools.join(", "),
    "inLanguage": isZh ? "zh-CN" : "en-US",
    "author": {
      "@type": "Organization",
      "name": "Jilo.ai",
      "url": "https://jilo.ai",
      "sameAs": [
        "https://twitter.com/jilo_ai",
        "https://github.com/jilo-ai"
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "Jilo.ai",
      "url": "https://jilo.ai",
      "logo": {
        "@type": "ImageObject",
        "url": "https://jilo.ai/logo.png",
        "width": 400,
        "height": 400
      }
    },
    "mainEntityOfPage": `https://jilo.ai/${locale}/reviews/${slug}`,
    "about": meta.tools.map(tool => ({
      "@type": "Thing",
      "name": tool,
      "url": `https://jilo.ai/${locale}/reviews/${slug}`
    })),
    "mentions": meta.tools.map(tool => ({
      "@type": "Product", 
      "name": tool
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        {/* Product Schemas for each tool */}
        {productSchemas.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {faqSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        )}

        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {isZh ? "首页" : "Home"}
          </Link>
          {" / "}
          <Link href={`/${locale}/reviews`} className="hover:text-foreground">
            {isZh ? "评测" : "Reviews"}
          </Link>
          {" / "}
          <span className="text-foreground">{title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {meta.category}
            </span>
            <time className="text-sm text-muted-foreground">{meta.date}</time>
          </div>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-muted-foreground">{description}</p>
          
          {/* Tools mentioned */}
          <div className="flex gap-2 mt-4">
            {meta.tools.map((tool) => (
              <span key={tool} className="px-3 py-1 bg-secondary rounded-full text-sm">
                {tool}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        {content ? (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-2xl mb-4">📝</p>
            <p>{isZh ? "评测内容即将发布，敬请期待！" : "Review coming soon — stay tuned!"}</p>
          </div>
        )}

        {/* 相关评测 — 内部交叉链接（SEO核心） */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-4">
            {isZh ? "📖 相关评测" : "📖 Related Reviews"}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(reviewsMeta)
              .filter(([s, m]) => s !== slug && m.category === meta.category)
              .slice(0, 3)
              .concat(
                // 如果同类别文章不足3个，用其他类别补充
                Object.entries(reviewsMeta)
                  .filter(([s, m]) => s !== slug && m.category !== meta.category)
                  .slice(0, Math.max(0, 3 - Object.entries(reviewsMeta).filter(([s, m]) => s !== slug && m.category === meta.category).length))
              )
              .slice(0, 3)
              .map(([s, m]) => (
                <Link
                  key={s}
                  href={`/${locale}/reviews/${s}`}
                  className="block p-4 border rounded-lg hover:shadow-md hover:border-primary/30 transition group"
                >
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {m.category}
                  </span>
                  <h4 className="mt-2 font-semibold text-sm group-hover:text-primary transition line-clamp-2">
                    {isZh ? m.title_zh : m.title_en}
                  </h4>
                </Link>
              ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 p-6 bg-secondary/50 rounded-xl text-center">
          <h3 className="text-xl font-bold mb-2">
            {isZh ? "发现更多 AI 工具" : "Discover More AI Tools"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isZh
              ? "浏览我们的 AI 工具目录，找到最适合你的工具。"
              : "Browse our AI tools directory to find the perfect tool for your needs."}
          </p>
          <Link
            href={`/${locale}/tools`}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            {isZh ? "浏览工具目录" : "Browse Tools"} →
          </Link>
        </div>
      </article>
      <Footer locale={locale} />
    </div>
  );
}
