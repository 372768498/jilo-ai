import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, X, Star, DollarSign, Users, Clock, Zap, Shield, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ContextualDiscovery, { ContextualBreadcrumbs } from "@/components/contextual-discovery";
import ComparisonAffiliateCTA from "@/components/ComparisonAffiliateCTA";
import { generateComparisonSchema } from "@/lib/schema-generator";
import { getAffiliateConfig } from "@/lib/affiliate";
import fs from "fs";
import path from "path";

type PageProps = { 
  params: { locale: string; slug: string } 
};

// 对比元数据配置
const comparisonMeta: Record<string, {
  toolA: string;
  toolB: string;
  title_en: string;
  title_zh: string;
  description_en: string;
  description_zh: string;
  category: string;
  lastUpdated: string;
  logoA?: string;
  logoB?: string;
  popularity: string;
  views: string;
}> = {
  "chatgpt-vs-claude": {
    toolA: "ChatGPT",
    toolB: "Claude",
    title_en: "ChatGPT vs Claude: Complete Comparison Guide (2026)",
    title_zh: "ChatGPT vs Claude: 完整对比指南 (2026)",
    description_en: "Detailed comparison of ChatGPT and Claude across reasoning, coding, creativity, pricing, and enterprise features.",
    description_zh: "详细对比 ChatGPT 和 Claude 在推理、编程、创意、定价和企业功能方面的表现。",
    category: "AI Chatbots",
    lastUpdated: "2026-02-01",
    logoA: "/logos/chatgpt.png",
    logoB: "/logos/claude.png",
    popularity: "hot",
    views: "125K"
  },
  "chatgpt-vs-gemini": {
    toolA: "ChatGPT", 
    toolB: "Gemini",
    title_en: "ChatGPT vs Gemini: Which AI Is Better in 2026?",
    title_zh: "ChatGPT vs Gemini: 2026年哪个AI更好？",
    description_en: "OpenAI vs Google: Compare ChatGPT and Gemini across performance, features, pricing, and real-world use cases.",
    description_zh: "OpenAI vs Google：在性能、功能、价格和实际使用案例方面对比ChatGPT和Gemini。",
    category: "AI Chatbots",
    lastUpdated: "2026-02-01", 
    logoA: "/logos/chatgpt.png",
    logoB: "/logos/gemini.png",
    popularity: "hot",
    views: "98K"
  },
  "claude-vs-gemini": {
    toolA: "Claude",
    toolB: "Gemini", 
    title_en: "Claude vs Gemini: The Ultimate AI Assistant Showdown",
    title_zh: "Claude vs Gemini: AI助手终极对决",
    description_en: "Anthropic vs Google: Compare Claude and Gemini for advanced reasoning, safety, and multimodal capabilities.",
    description_zh: "Anthropic vs Google：在高级推理、安全性和多模态能力方面对比Claude和Gemini。",
    category: "AI Chatbots",
    lastUpdated: "2026-02-01",
    logoA: "/logos/claude.png", 
    logoB: "/logos/gemini.png",
    popularity: "trending",
    views: "67K"
  },
  "midjourney-vs-dall-e": {
    toolA: "Midjourney",
    toolB: "DALL-E", 
    title_en: "Midjourney vs DALL-E: Best AI Art Generator in 2026",
    title_zh: "Midjourney vs DALL-E: 2026年最佳AI艺术生成器",
    description_en: "Compare Midjourney and DALL-E across image quality, artistic styles, pricing, and commercial licensing.",
    description_zh: "在图像质量、艺术风格、价格和商业许可方面对比Midjourney和DALL-E。",
    category: "AI Art",
    lastUpdated: "2026-02-01",
    logoA: "/logos/midjourney.png",
    logoB: "/logos/dall-e.png", 
    popularity: "hot",
    views: "89K"
  },
  "chatgpt-vs-perplexity": {
    toolA: "ChatGPT",
    toolB: "Perplexity",
    title_en: "ChatGPT vs Perplexity: AI Search vs Chat in 2026",
    title_zh: "ChatGPT vs Perplexity: 2026年AI搜索与聊天对比",
    description_en: "Compare ChatGPT and Perplexity for search, research, real-time information, and accuracy.",
    description_zh: "在搜索、研究、实时信息和准确性方面对比ChatGPT和Perplexity。", 
    category: "AI Search",
    lastUpdated: "2026-02-01",
    logoA: "/logos/chatgpt.png",
    logoB: "/logos/perplexity.png",
    popularity: "trending", 
    views: "56K"
  },
  "github-copilot-vs-chatgpt": {
    toolA: "GitHub Copilot", 
    toolB: "ChatGPT",
    title_en: "GitHub Copilot vs ChatGPT: Best AI for Coding in 2026",
    title_zh: "GitHub Copilot vs ChatGPT: 2026年最佳编程AI",
    description_en: "Compare GitHub Copilot and ChatGPT for code generation, debugging, learning, and developer productivity.",
    description_zh: "在代码生成、调试、学习和开发者生产力方面对比GitHub Copilot和ChatGPT。",
    category: "AI Coding",
    lastUpdated: "2026-02-01",
    logoA: "/logos/github-copilot.png",
    logoB: "/logos/chatgpt.png",
    popularity: "hot", 
    views: "78K"
  },
  "jasper-vs-chatgpt": {
    toolA: "Jasper",
    toolB: "ChatGPT",
    title_en: "Jasper vs ChatGPT: Best AI Writer for Marketing in 2026", 
    title_zh: "Jasper vs ChatGPT: 2026年最佳营销AI写作工具",
    description_en: "Compare Jasper and ChatGPT for marketing copy, blog writing, SEO content, and business writing.",
    description_zh: "在营销文案、博客写作、SEO内容和商业写作方面对比Jasper和ChatGPT。",
    category: "AI Writing",
    lastUpdated: "2026-02-01",
    logoA: "/logos/jasper.png", 
    logoB: "/logos/chatgpt.png",
    popularity: "stable",
    views: "45K"
  },
  "notion-ai-vs-chatgpt": {
    toolA: "Notion AI",
    toolB: "ChatGPT", 
    title_en: "Notion AI vs ChatGPT: Productivity Tools Compared",
    title_zh: "Notion AI vs ChatGPT: 生产力工具对比",
    description_en: "Compare Notion AI and ChatGPT for note-taking, project management, team collaboration, and productivity.",
    description_zh: "在笔记记录、项目管理、团队协作和生产力方面对比Notion AI和ChatGPT。",
    category: "AI Productivity", 
    lastUpdated: "2026-02-01",
    logoA: "/logos/notion.png",
    logoB: "/logos/chatgpt.png",
    popularity: "trending",
    views: "52K"
  },
  "grammarly-vs-chatgpt": {
    toolA: "Grammarly",
    toolB: "ChatGPT",
    title_en: "Grammarly vs ChatGPT: Writing Assistant Showdown", 
    title_zh: "Grammarly vs ChatGPT: 写作助手对决",
    description_en: "Compare Grammarly and ChatGPT for grammar checking, writing improvement, style suggestions, and content creation.",
    description_zh: "在语法检查、写作改进、风格建议和内容创作方面对比Grammarly和ChatGPT。",
    category: "AI Writing",
    lastUpdated: "2026-02-01",
    logoA: "/logos/grammarly.png",
    logoB: "/logos/chatgpt.png", 
    popularity: "stable",
    views: "41K"
  },
  "stable-diffusion-vs-midjourney": {
    toolA: "Stable Diffusion",
    toolB: "Midjourney",
    title_en: "Stable Diffusion vs Midjourney: Open Source vs Commercial AI Art",
    title_zh: "Stable Diffusion vs Midjourney: 开源vs商业AI艺术工具", 
    description_en: "Compare Stable Diffusion and Midjourney across customization, cost, image quality, and ease of use.",
    description_zh: "在定制化、成本、图像质量和易用性方面对比Stable Diffusion和Midjourney。",
    category: "AI Art",
    lastUpdated: "2026-02-01",
    logoA: "/logos/stable-diffusion.png",
    logoB: "/logos/midjourney.png",
    popularity: "trending",
    views: "63K"
  },
  "cursor-vs-github-copilot": {
    toolA: "Cursor", toolB: "GitHub Copilot",
    title_en: "Cursor vs GitHub Copilot: Best AI Coding Assistant (2026)",
    title_zh: "Cursor vs GitHub Copilot: 最佳AI编程助手对比",
    description_en: "Compare Cursor and GitHub Copilot for AI-powered coding, IDE integration, and developer productivity.",
    description_zh: "对比Cursor和GitHub Copilot的AI编程能力。",
    category: "AI Coding", lastUpdated: "2026-02-01",
    logoA: "/logos/cursor.png", logoB: "/logos/github-copilot.png",
    popularity: "hot", views: "95K"
  },
  "crewai-vs-openclaw": {
    toolA: "CrewAI", toolB: "OpenClaw",
    title_en: "CrewAI vs OpenClaw: Best AI Agent Framework 2025 [Comparison]",
    title_zh: "CrewAI vs OpenClaw: 最佳AI Agent框架对比",
    description_en: "Compare CrewAI and OpenClaw: multi-agent orchestration vs personal AI assistant. Architecture, use cases, and which is right for you.",
    description_zh: "对比CrewAI和OpenClaw：多Agent编排vs个人AI助手，架构、用例及选择建议。",
    category: "AI Agents", lastUpdated: "2026-02-20",
    logoA: "/logos/crewai.png", logoB: "/logos/openclaw.png",
    popularity: "hot", views: "15K"
  },
  "deepseek-vs-chatgpt": {
    toolA: "DeepSeek", toolB: "ChatGPT",
    title_en: "DeepSeek vs ChatGPT: Free Open-Source vs Premium AI (2026)",
    title_zh: "DeepSeek vs ChatGPT: 免费开源vs付费AI对比",
    description_en: "Compare DeepSeek and ChatGPT across reasoning, coding, pricing, and accessibility.",
    description_zh: "对比DeepSeek和ChatGPT。",
    category: "AI Chatbots", lastUpdated: "2026-02-01",
    logoA: "/logos/deepseek.png", logoB: "/logos/chatgpt.png",
    popularity: "hot", views: "120K"
  },
  "runway-vs-pika": {
    toolA: "Runway", toolB: "Pika",
    title_en: "Runway vs Pika: Best AI Video Generator (2026)",
    title_zh: "Runway vs Pika: AI视频生成器对比",
    description_en: "Compare Runway and Pika for AI video generation, editing features, and creative tools.",
    description_zh: "对比Runway和Pika的AI视频生成能力。",
    category: "AI Video", lastUpdated: "2026-02-01",
    logoA: "/logos/runway.png", logoB: "/logos/pika.png",
    popularity: "trending", views: "45K"
  },
  "elevenlabs-vs-murf": {
    toolA: "ElevenLabs", toolB: "Murf AI",
    title_en: "ElevenLabs vs Murf: Best AI Voice Generator (2026)",
    title_zh: "ElevenLabs vs Murf: AI语音生成器对比",
    description_en: "Compare ElevenLabs and Murf for text-to-speech, voice cloning, and audio production.",
    description_zh: "对比ElevenLabs和Murf的AI语音能力。",
    category: "AI Voice", lastUpdated: "2026-02-01",
    logoA: "/logos/elevenlabs.png", logoB: "/logos/murf.png",
    popularity: "trending", views: "38K"
  },
  "canva-vs-figma": {
    toolA: "Canva", toolB: "Figma",
    title_en: "Canva vs Figma: Best Design Tool with AI (2026)",
    title_zh: "Canva vs Figma: AI设计工具对比",
    description_en: "Compare Canva and Figma for design, collaboration, AI features, and pricing.",
    description_zh: "对比Canva和Figma的设计能力。",
    category: "AI Design", lastUpdated: "2026-02-01",
    logoA: "/logos/canva.png", logoB: "/logos/figma.png",
    popularity: "trending", views: "72K"
  },
  "deepl-vs-google-translate": {
    toolA: "DeepL", toolB: "Google Translate",
    title_en: "DeepL vs Google Translate: Best AI Translation Tool (2026)",
    title_zh: "DeepL vs Google Translate: AI翻译工具对比",
    description_en: "Compare DeepL and Google Translate for translation accuracy, language support, and features.",
    description_zh: "对比DeepL和Google Translate的翻译能力。",
    category: "AI Translation", lastUpdated: "2026-02-01",
    logoA: "/logos/deepl.png", logoB: "/logos/google-translate.png",
    popularity: "stable", views: "55K"
  },
  "midjourney-vs-leonardo": {
    toolA: "Midjourney", toolB: "Leonardo AI",
    title_en: "Midjourney vs Leonardo AI: AI Art Generation Compared (2026)",
    title_zh: "Midjourney vs Leonardo AI: AI艺术生成对比",
    description_en: "Compare Midjourney and Leonardo AI for image generation, fine-tuning, and creative workflows.",
    description_zh: "对比Midjourney和Leonardo AI。",
    category: "AI Art", lastUpdated: "2026-02-01",
    logoA: "/logos/midjourney.png", logoB: "/logos/leonardo.png",
    popularity: "trending", views: "41K"
  },
  "notion-ai-vs-obsidian": {
    toolA: "Notion AI", toolB: "Obsidian",
    title_en: "Notion AI vs Obsidian: Best AI Note-Taking Tool (2026)",
    title_zh: "Notion AI vs Obsidian: AI笔记工具对比",
    description_en: "Compare Notion AI and Obsidian for note-taking, knowledge management, and AI features.",
    description_zh: "对比Notion AI和Obsidian。",
    category: "AI Productivity", lastUpdated: "2026-02-01",
    logoA: "/logos/notion.png", logoB: "/logos/obsidian.png",
    popularity: "stable", views: "48K"
  },
  "jasper-vs-copy-ai": {
    toolA: "Jasper", toolB: "Copy.ai",
    title_en: "Jasper vs Copy.ai: Best AI Marketing Copywriter (2026)",
    title_zh: "Jasper vs Copy.ai: AI营销文案工具对比",
    description_en: "In-depth comparison of Jasper and Copy.ai for marketing copy, content creation, and team workflows.",
    description_zh: "深入对比Jasper和Copy.ai的营销文案、内容创作和团队协作功能。",
    category: "AI Writing", lastUpdated: "2026-02-02",
    popularity: "hot", views: "67K"
  },
  "semrush-vs-surfer-seo": {
    toolA: "Semrush", toolB: "Surfer SEO",
    title_en: "Semrush vs Surfer SEO: Complete SEO Tool Comparison (2026)",
    title_zh: "Semrush vs Surfer SEO: SEO工具全面对比",
    description_en: "Detailed comparison of Semrush and Surfer SEO for keyword research, content optimization, and SEO strategy.",
    description_zh: "详细对比Semrush和Surfer SEO在关键词研究、内容优化和SEO策略方面的表现。",
    category: "AI SEO", lastUpdated: "2026-02-02",
    popularity: "rising", views: "52K"
  },
  "synthesia-vs-heygen": {
    toolA: "Synthesia", toolB: "HeyGen",
    title_en: "Synthesia vs HeyGen: Best AI Video Avatar Tool (2026)",
    title_zh: "Synthesia vs HeyGen: AI视频数字人对比",
    description_en: "Compare Synthesia and HeyGen for AI avatar video creation, enterprise features, and pricing.",
    description_zh: "对比Synthesia和HeyGen的AI数字人视频创作功能。",
    category: "AI Video", lastUpdated: "2026-02-02",
    popularity: "rising", views: "41K"
  },
  "grammarly-vs-writesonic": {
    toolA: "Grammarly", toolB: "Writesonic",
    title_en: "Grammarly vs Writesonic: Grammar Tool vs AI Writer (2026)",
    title_zh: "Grammarly vs Writesonic: 语法工具 vs AI写作",
    description_en: "Compare Grammarly's grammar checking with Writesonic's AI content generation. Which writing tool is right for you?",
    description_zh: "对比Grammarly的语法检查和Writesonic的AI内容生成功能。",
    category: "AI Writing", lastUpdated: "2026-02-02",
    popularity: "stable", views: "38K"
  },
  "fireflies-vs-otter": {
    toolA: "Fireflies.ai", toolB: "Otter.ai",
    title_en: "Fireflies vs Otter: Best AI Meeting Transcription (2026)",
    title_zh: "Fireflies vs Otter: AI会议转录工具对比",
    description_en: "Compare Fireflies.ai and Otter.ai for meeting transcription, AI summaries, and team collaboration.",
    description_zh: "对比Fireflies.ai和Otter.ai的会议转录和AI摘要功能。",
    category: "AI Productivity", lastUpdated: "2026-02-02",
    popularity: "rising", views: "35K"
  },
  "notion-vs-clickup": {
    toolA: "Notion", toolB: "ClickUp",
    title_en: "Notion vs ClickUp: Best AI Productivity Tool (2026)",
    title_zh: "Notion vs ClickUp: AI生产力工具对比",
    description_en: "Compare Notion and ClickUp for project management, docs, and AI features. Find the right productivity tool.",
    description_zh: "对比Notion和ClickUp的项目管理、文档和AI功能。",
    category: "AI Productivity", lastUpdated: "2026-02-02",
    popularity: "hot", views: "89K"
  },
  "canva-vs-leonardo-ai": {
    toolA: "Canva", toolB: "Leonardo AI",
    title_en: "Canva vs Leonardo AI: Design Tool vs AI Image Generator (2026)",
    title_zh: "Canva vs Leonardo AI: 设计工具 vs AI图片生成",
    description_en: "Compare Canva's all-in-one design platform with Leonardo AI's image generation capabilities.",
    description_zh: "对比Canva的全能设计平台和Leonardo AI的图片生成能力。",
    category: "AI Design", lastUpdated: "2026-02-02",
    popularity: "stable", views: "44K"
  },
  "pictory-vs-synthesia": {
    toolA: "Pictory", toolB: "Synthesia",
    title_en: "Pictory vs Synthesia: AI Video Creation Tools Compared (2026)",
    title_zh: "Pictory vs Synthesia: AI视频创作工具对比",
    description_en: "Compare Pictory's text-to-video with Synthesia's avatar videos. Which AI video tool is right for you?",
    description_zh: "对比Pictory的文本转视频和Synthesia的数字人视频功能。",
    category: "AI Video", lastUpdated: "2026-02-02",
    popularity: "stable", views: "29K"
  },
  "surfer-seo-vs-frase": {
    toolA: "Surfer SEO", toolB: "Frase",
    title_en: "Surfer SEO vs Frase: Best AI Content Optimization Tool (2026)",
    title_zh: "Surfer SEO vs Frase: AI内容优化工具对比",
    description_en: "Compare Surfer SEO and Frase for content optimization, SEO writing, and keyword research.",
    description_zh: "对比Surfer SEO和Frase的内容优化和SEO写作功能。",
    category: "AI SEO", lastUpdated: "2026-02-02",
    popularity: "stable", views: "31K"
  },
  "copy-ai-vs-writesonic": {
    toolA: "Copy.ai", toolB: "Writesonic",
    title_en: "Copy.ai vs Writesonic: Best AI Writing Tool (2026)",
    title_zh: "Copy.ai vs Writesonic: AI写作工具对比",
    description_en: "Compare Copy.ai and Writesonic for marketing copy, blog posts, and content generation.",
    description_zh: "对比Copy.ai和Writesonic的营销文案和内容生成功能。",
    category: "AI Writing", lastUpdated: "2026-02-02",
    popularity: "stable", views: "33K"
  },
  "cursor-vs-copilot-vs-windsurf": {
    toolA: "Cursor", toolB: "Copilot/Windsurf",
    title_en: "Cursor vs GitHub Copilot vs Windsurf: Ultimate AI Code Editor Comparison (2025)",
    title_zh: "Cursor vs GitHub Copilot vs Windsurf：2025年AI代码编辑器终极对比",
    description_en: "Comprehensive comparison of the three leading AI coding assistants: Cursor, GitHub Copilot, and Windsurf. Features, pricing, pros and cons.",
    description_zh: "全面对比三大AI代码助手：Cursor、GitHub Copilot和Windsurf的功能、价格、优缺点。",
    category: "AI Coding", lastUpdated: "2025-02-12",
    logoA: "/logos/cursor.png", logoB: "/logos/github-copilot.png",
    popularity: "hot", views: "0"
  },
};

// 从内容文件获取对比内容
function getComparisonContent(slug: string, locale: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "content", "comparisons", `${slug}.md`);
    let content = fs.readFileSync(filePath, "utf-8");
    
    // 移除 frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (fmMatch) {
      content = content.slice(fmMatch[0].length);
    }
    
    return content.trim();
  } catch {
    return null;
  }
}

// Markdown 转 HTML
function markdownToHtml(md: string): string {
  return md
    // 代码块
    .replace(/```[\s\S]*?```/g, (match) => {
      const content = match.replace(/```\w*\n?/, '').replace(/```$/, '');
      return `<pre class="bg-secondary p-4 rounded-lg overflow-x-auto my-4"><code>${content}</code></pre>`;
    })
    // 表格
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_, header, body) => {
      const headers = header.split('|').filter(Boolean).map((h: string) => 
        `<th class="border px-4 py-2 bg-secondary font-semibold">${h.trim()}</th>`
      ).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter(Boolean).map((c: string) => 
          `<td class="border px-4 py-2">${c.trim()}</td>`
        ).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<div class="overflow-x-auto my-6"><table class="w-full border-collapse border">${headers ? `<thead><tr>${headers}</tr></thead>` : ''}<tbody>${rows}</tbody></table></div>`;
    })
    // 标题
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-8 mb-3">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold mt-6 mb-2">$1</h4>')
    // 格式化
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 列表
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // 段落
    .replace(/^(?!<[h|l|t|d|p])((?!^$).+)$/gm, '<p class="mb-4 leading-relaxed">$1</p>')
    // 整理列表
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="list-decimal my-4 space-y-1 ml-6">${match}</ol>`;
      }
      return `<ul class="list-disc my-4 space-y-1 ml-6">${match}</ul>`;
    });
}

// 从内容提取 FAQ
function extractFAQ(content: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const faqSection = content.match(/## (?:FAQ|常见问题|Frequently Asked Questions)[\s\S]*?(?=## |$)/i);
  if (!faqSection) return faqs;
  
  // 提取 Q&A 对
  const qaPairs = Array.from(faqSection[0].matchAll(/###\s*(.+?)[\n\r]+([\s\S]*?)(?=\n###|\n## |$)/gi));
  for (const match of qaPairs) {
    const question = match[1].trim().replace(/^Q\d*[:.]\s*/, '');
    const answer = match[2].trim().replace(/^\*\*A[:.]\*\*\s*/i, '').replace(/\*\*/g, '');
    if (answer.length > 10) {
      faqs.push({ question, answer });
    }
  }
  
  return faqs.slice(0, 5); // 最多5个FAQ
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const meta = comparisonMeta[slug];
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
      url: `https://jilo.ai/${locale}/compare/${slug}`,
      siteName: "Jilo.ai",
      locale: isZh ? "zh_CN" : "en_US",
      publishedTime: meta.lastUpdated,
      images: [{
        url: `https://jilo.ai/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(`${meta.toolA} vs ${meta.toolB}`)}`,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://jilo.ai/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(`${meta.toolA} vs ${meta.toolB}`)}`],
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/compare/${slug}`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/compare/${slug}`,
        [altLocale]: `https://jilo.ai/${altLocale}/compare/${slug}`,
      },
    },
  };
}

export default function ComparisonPage({ params }: PageProps) {
  const { locale, slug } = params;
  const meta = comparisonMeta[slug];
  if (!meta) return notFound();

  const isZh = locale === "zh";
  const title = isZh ? meta.title_zh : meta.title_en;
  const description = isZh ? meta.description_zh : meta.description_en;
  const content = getComparisonContent(slug, locale);

  // Extract FAQs for Schema
  const faqs = content ? extractFAQ(content) : [];

  // Unified Schema from Protocol 4 generator
  const schemas = generateComparisonSchema(slug, locale, {
    description,
    faqs: faqs.map(f => ({ question: f.question, answer: f.answer })),
  });

  const t = isZh ? {
    home: "首页",
    compare: "对比",
    vs: "vs",
    updated: "更新时间",
    views: "浏览量",
    category: "分类",
    quick_comparison: "⚡ 快速对比",
    choose_if: "选择条件",
    detailed_analysis: "📊 详细分析", 
    related_comparisons: "🔗 相关对比",
    discover_tools: "发现更多AI工具",
    browse_directory: "浏览工具目录",
    browse_desc: "探索我们的AI工具目录，找到完美匹配您需求的工具。",
    view_tool: "查看工具",
    best_for: "最适合",
    pros: "优势",
    cons: "劣势", 
    pricing: "定价",
    final_verdict: "总结推荐"
  } : {
    home: "Home",
    compare: "Compare",
    vs: "vs", 
    updated: "Updated",
    views: "views",
    category: "Category",
    quick_comparison: "⚡ Quick Comparison",
    choose_if: "Choose If",
    detailed_analysis: "📊 Detailed Analysis",
    related_comparisons: "🔗 Related Comparisons", 
    discover_tools: "Discover More AI Tools",
    browse_directory: "Browse Tools Directory",
    browse_desc: "Explore our AI tools directory to find the perfect match for your needs.",
    view_tool: "View Tool",
    best_for: "Best For",
    pros: "Pros",
    cons: "Cons",
    pricing: "Pricing", 
    final_verdict: "Final Verdict"
  };

  // 模拟工具图标组件
  const ToolIcon = ({ tool, size = 48 }: { tool: string; size?: number }) => (
    <div 
      className="rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-slate-700 font-bold shadow-sm"
      style={{ width: size, height: size }}
    >
      {tool.charAt(0)}
    </div>
  );

  const getPopularityBadge = (popularity: string) => {
    switch (popularity) {
      case 'hot':
        return { text: isZh ? '热门' : 'Hot', variant: 'destructive' as const, icon: '🔥' };
      case 'trending': 
        return { text: isZh ? '趋势' : 'Trending', variant: 'default' as const, icon: '📈' };
      default:
        return { text: isZh ? '稳定' : 'Stable', variant: 'secondary' as const, icon: '📊' };
    }
  };

  const badge = getPopularityBadge(meta.popularity);

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      
      {/* Schema.org JSON-LD — Protocol 4 unified */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="max-w-6xl mx-auto px-4 py-8">
        {/* 面包屑 — Protocol 2 dynamic */}
        <ContextualBreadcrumbs slug={slug} pageType="comparison" locale={locale} />

        {/* 头部对比 */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={badge.variant} className="text-sm font-medium">
              {badge.icon} {badge.text}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {meta.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {meta.views} {t.views} • {t.updated}: {meta.lastUpdated}
            </span>
          </div>
          
          {/* VS 标题区 */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <ToolIcon tool={meta.toolA} size={80} />
                <h2 className="text-2xl font-bold mt-3">{meta.toolA}</h2>
              </div>
              
              <div className="text-4xl font-bold text-slate-400">VS</div>
              
              <div className="text-center">
                <ToolIcon tool={meta.toolB} size={80} />
                <h2 className="text-2xl font-bold mt-3">{meta.toolB}</h2>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">{title}</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              {description}
            </p>
          </div>

          {/* 快速对比表格 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {t.quick_comparison}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Feature</th>
                      <th className="text-center py-3 px-4 font-semibold">{meta.toolA}</th>
                      <th className="text-center py-3 px-4 font-semibold">{meta.toolB}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 px-4 font-medium">{isZh ? "价格" : "Pricing"}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline">$20/mo</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline">$20/mo</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">{isZh ? "免费试用" : "Free Plan"}</td>
                      <td className="py-3 px-4 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">{isZh ? "API访问" : "API Access"}</td>
                      <td className="py-3 px-4 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">{isZh ? "多模态" : "Multimodal"}</td>
                      <td className="py-3 px-4 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 使用场景推荐 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                    {meta.toolA.charAt(0)}
                  </div>
                  {t.choose_if} {meta.toolA}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {isZh ? "需要最新的GPT-4模型" : "You need the latest GPT-4 model"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {isZh ? "广泛的插件生态系统" : "Extensive plugin ecosystem"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {isZh ? "代码生成和调试" : "Code generation and debugging"}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    {meta.toolB.charAt(0)}
                  </div>
                  {t.choose_if} {meta.toolB}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {isZh ? "注重AI安全和对话质量" : "AI safety and conversation quality"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {isZh ? "长文档分析和处理" : "Long document analysis"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {isZh ? "更好的推理能力" : "Superior reasoning capabilities"}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* 详细内容 */}
        {content ? (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              {t.detailed_analysis}
            </h2>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </section>
        ) : (
          <div className="text-center py-20 text-muted-foreground mb-10">
            <p className="text-2xl mb-4">📝</p>
            <p>{isZh ? "详细对比内容即将发布，敬请期待！" : "Detailed comparison coming soon — stay tuned!"}</p>
          </div>
        )}

        {/* 相关对比 */}
        <section className="mb-10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-500" />
            {t.related_comparisons}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(comparisonMeta)
              .filter(([s, m]) => s !== slug && (m.toolA === meta.toolA || m.toolB === meta.toolB || m.toolA === meta.toolB || m.toolB === meta.toolA))
              .slice(0, 3)
              .concat(
                // 补充其他对比
                Object.entries(comparisonMeta)
                  .filter(([s, m]) => s !== slug && m.category === meta.category)
                  .slice(0, Math.max(0, 3 - Object.entries(comparisonMeta).filter(([s, m]) => s !== slug && (m.toolA === meta.toolA || m.toolB === meta.toolB || m.toolA === meta.toolB || m.toolB === meta.toolA)).length))
              )
              .slice(0, 3)
              .map(([s, m]) => (
                <Link
                  key={s}
                  href={`/${locale}/compare/${s}`}
                  className="block p-4 border rounded-xl hover:shadow-md hover:border-primary/30 transition group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <ToolIcon tool={m.toolA} size={24} />
                    <span className="text-xs text-muted-foreground">vs</span>
                    <ToolIcon tool={m.toolB} size={24} />
                  </div>
                  <h4 className="font-semibold text-sm group-hover:text-primary transition line-clamp-2">
                    {m.toolA} vs {m.toolB}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isZh ? m.description_zh : m.description_en}
                  </p>
                </Link>
              ))}
          </div>
        </section>

        {/* Affiliate CTA */}
        <ComparisonAffiliateCTA
          toolA={{
            name: meta.toolA,
            slug: slug.split('-vs-')[0] || '',
            affiliateUrl: getAffiliateConfig(slug.split('-vs-')[0] || '')?.url,
            dealText: getAffiliateConfig(slug.split('-vs-')[0] || '')?.dealText,
          }}
          toolB={{
            name: meta.toolB,
            slug: slug.split('-vs-').slice(1).join('-vs-') || '',
            affiliateUrl: getAffiliateConfig(slug.split('-vs-').slice(1).join('-vs-') || '')?.url,
            dealText: getAffiliateConfig(slug.split('-vs-').slice(1).join('-vs-') || '')?.dealText,
          }}
        />

        {/* CTA */}
        <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">{t.discover_tools}</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t.browse_desc}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link href={`/${locale}/tools`}>
                  {t.browse_directory}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href={`/${locale}/compare`}>
                  {isZh ? "更多对比" : "More Comparisons"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </article>

      {/* Contextual Discovery — 动态三层内链 */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <ContextualDiscovery slug={slug} pageType="comparison" locale={locale} />
      </div>

      <Footer locale={locale} />
    </div>
  );
}