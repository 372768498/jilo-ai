import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Star, DollarSign, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ContextualDiscovery, { ContextualBreadcrumbs } from "@/components/contextual-discovery";
import { generateAlternativeSchema } from "@/lib/schema-generator";
import fs from "fs";
import path from "path";

type PageProps = { params: { locale: string; slug: string } };

const alternativesMeta: Record<string, {
  tool: string;
  title_en: string;
  title_zh: string;
  description_en: string;
  description_zh: string;
  category: string;
  count: number;
  lastUpdated: string;
}> = {
  "chatgpt-alternatives": {
    tool: "ChatGPT",
    title_en: "10 Best ChatGPT Alternatives in 2026 (Free & Paid)",
    title_zh: "2026年10个最佳ChatGPT替代方案（免费和付费）",
    description_en: "Looking for ChatGPT alternatives? Compare the best AI chatbots including Claude, Gemini, Perplexity and more.",
    description_zh: "寻找ChatGPT替代品？对比最佳AI聊天机器人，包括Claude、Gemini、Perplexity等。",
    category: "AI Chatbots",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "midjourney-alternatives": {
    tool: "Midjourney",
    title_en: "10 Best Midjourney Alternatives in 2026 (Free & Paid)",
    title_zh: "2026年10个最佳Midjourney替代方案",
    description_en: "Find the best Midjourney alternatives for AI art generation, including free options like Stable Diffusion.",
    description_zh: "发现最佳Midjourney替代方案，包括Stable Diffusion等免费选项。",
    category: "AI Art",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "grammarly-alternatives": {
    tool: "Grammarly",
    title_en: "10 Best Grammarly Alternatives in 2026",
    title_zh: "2026年10个最佳Grammarly替代方案",
    description_en: "Compare the best Grammarly alternatives for grammar checking, writing improvement, and AI-powered editing.",
    description_zh: "对比最佳Grammarly替代方案。",
    category: "AI Writing",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "notion-alternatives": {
    tool: "Notion",
    title_en: "10 Best Notion Alternatives in 2026",
    title_zh: "2026年10个最佳Notion替代方案",
    description_en: "Discover the best Notion alternatives for project management, note-taking, and team collaboration with AI.",
    description_zh: "发现最佳Notion替代方案。",
    category: "AI Productivity",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "jasper-alternatives": {
    tool: "Jasper",
    title_en: "10 Best Jasper Alternatives for AI Marketing in 2026",
    title_zh: "2026年10个最佳Jasper替代方案",
    description_en: "Find the best Jasper alternatives for AI marketing copy, blog writing, and content creation.",
    description_zh: "发现最佳Jasper替代方案。",
    category: "AI Marketing",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "github-copilot-alternatives": {
    tool: "GitHub Copilot",
    title_en: "10 Best GitHub Copilot Alternatives for AI Coding in 2026",
    title_zh: "2026年10个最佳GitHub Copilot替代方案",
    description_en: "Compare the best GitHub Copilot alternatives including Cursor, Codeium, and Amazon CodeWhisperer.",
    description_zh: "对比最佳GitHub Copilot替代方案。",
    category: "AI Coding",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "canva-alternatives": {
    tool: "Canva",
    title_en: "10 Best Canva Alternatives in 2026 (Free & Paid)",
    title_zh: "2026年10个最佳Canva替代方案",
    description_en: "Discover the best Canva alternatives for graphic design, including AI-powered options.",
    description_zh: "发现最佳Canva替代方案。",
    category: "AI Design",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "perplexity-alternatives": {
    tool: "Perplexity",
    title_en: "10 Best Perplexity Alternatives for AI Search in 2026",
    title_zh: "2026年10个最佳Perplexity替代方案",
    description_en: "Find the best Perplexity alternatives for AI-powered search and research.",
    description_zh: "发现最佳Perplexity替代方案。",
    category: "AI Search",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "elevenlabs-alternatives": {
    tool: "ElevenLabs",
    title_en: "10 Best ElevenLabs Alternatives for AI Voice in 2026",
    title_zh: "2026年10个最佳ElevenLabs替代方案",
    description_en: "Compare the best ElevenLabs alternatives for text-to-speech, voice cloning, and AI audio.",
    description_zh: "对比最佳ElevenLabs替代方案。",
    category: "AI Voice",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "runway-alternatives": {
    tool: "Runway",
    title_en: "10 Best Runway Alternatives for AI Video in 2026",
    title_zh: "2026年10个最佳Runway替代方案",
    description_en: "Discover the best Runway alternatives for AI video generation and editing.",
    description_zh: "发现最佳Runway替代方案。",
    category: "AI Video",
    count: 10,
    lastUpdated: "2026-02-01"
  },
  "cursor-alternatives": {
    tool: "Cursor",
    title_en: "10 Best Cursor Alternatives for AI Coding in 2026",
    title_zh: "2026年10个最佳Cursor替代方案",
    description_en: "Find the best Cursor alternatives for AI-powered code editing and programming assistance.",
    description_zh: "发现最佳Cursor替代方案。",
    category: "AI Coding", count: 10, lastUpdated: "2026-02-01"
  },
  "deepseek-alternatives": {
    tool: "DeepSeek",
    title_en: "10 Best DeepSeek Alternatives in 2026",
    title_zh: "2026年10个最佳DeepSeek替代方案",
    description_en: "Compare the best DeepSeek alternatives for AI reasoning, coding, and conversation.",
    description_zh: "发现最佳DeepSeek替代方案。",
    category: "AI Chatbots", count: 10, lastUpdated: "2026-02-01"
  },
  "dall-e-alternatives": {
    tool: "DALL-E",
    title_en: "10 Best DALL-E Alternatives for AI Image Generation in 2026",
    title_zh: "2026年10个最佳DALL-E替代方案",
    description_en: "Discover the best DALL-E alternatives for AI art and image generation.",
    description_zh: "发现最佳DALL-E替代方案。",
    category: "AI Art", count: 10, lastUpdated: "2026-02-01"
  },
  "synthesia-alternatives": {
    tool: "Synthesia",
    title_en: "10 Best Synthesia Alternatives for AI Video in 2026",
    title_zh: "2026年10个最佳Synthesia替代方案",
    description_en: "Find the best Synthesia alternatives for AI avatar video creation.",
    description_zh: "发现最佳Synthesia替代方案。",
    category: "AI Video", count: 10, lastUpdated: "2026-02-01"
  },
  "copy-ai-alternatives": {
    tool: "Copy.ai",
    title_en: "10 Best Copy.ai Alternatives for AI Copywriting in 2026",
    title_zh: "2026年10个最佳Copy.ai替代方案",
    description_en: "Compare the best Copy.ai alternatives for marketing copy and content creation.",
    description_zh: "发现最佳Copy.ai替代方案。",
    category: "AI Marketing", count: 10, lastUpdated: "2026-02-01"
  },
  "deepl-alternatives": {
    tool: "DeepL",
    title_en: "10 Best DeepL Alternatives for AI Translation in 2026",
    title_zh: "2026年10个最佳DeepL替代方案",
    description_en: "Find the best DeepL alternatives for accurate AI-powered translation.",
    description_zh: "发现最佳DeepL替代方案。",
    category: "AI Translation", count: 10, lastUpdated: "2026-02-01"
  },
  "otter-ai-alternatives": {
    tool: "Otter.ai",
    title_en: "10 Best Otter.ai Alternatives for AI Transcription in 2026",
    title_zh: "2026年10个最佳Otter.ai替代方案",
    description_en: "Discover the best Otter.ai alternatives for AI meeting transcription and notes.",
    description_zh: "发现最佳Otter.ai替代方案。",
    category: "AI Productivity", count: 10, lastUpdated: "2026-02-01"
  },
  "figma-alternatives": {
    tool: "Figma",
    title_en: "10 Best Figma Alternatives with AI Features in 2026",
    title_zh: "2026年10个最佳Figma替代方案",
    description_en: "Find the best Figma alternatives for UI/UX design with AI capabilities.",
    description_zh: "发现最佳Figma替代方案。",
    category: "AI Design", count: 10, lastUpdated: "2026-02-01"
  },
  "writesonic-alternatives": {
    tool: "Writesonic",
    title_en: "10 Best Writesonic Alternatives for AI Writing in 2026",
    title_zh: "2026年10个最佳Writesonic替代方案",
    description_en: "Compare the best Writesonic alternatives for AI content writing and SEO.",
    description_zh: "发现最佳Writesonic替代方案。",
    category: "AI Writing", count: 10, lastUpdated: "2026-02-01"
  },
  "descript-alternatives": {
    tool: "Descript",
    title_en: "10 Best Descript Alternatives for AI Video/Audio Editing in 2026",
    title_zh: "2026年10个最佳Descript替代方案",
    description_en: "Find the best Descript alternatives for AI-powered video and audio editing.",
    description_zh: "发现最佳Descript替代方案。",
    category: "AI Video", count: 10, lastUpdated: "2026-02-01"
  },
};

function getContent(slug: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "content", "alternatives", `${slug}.md`);
    let content = fs.readFileSync(filePath, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (fmMatch) content = content.slice(fmMatch[0].length);
    return content.trim();
  } catch { return null; }
}

function markdownToHtml(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (m) => {
      const c = m.replace(/```\w*\n?/, '').replace(/```$/, '');
      return `<pre class="bg-secondary p-4 rounded-lg overflow-x-auto my-4"><code>${c}</code></pre>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => `<td class="px-4 py-2 border">${c.trim()}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    })
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(?!<[hltpuo])/gm, (match) => match ? `<p class="mb-4">${match}` : match);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const meta = alternativesMeta[params.slug];
  if (!meta) return {};
  const isZh = params.locale === 'zh';
  return {
    title: isZh ? meta.title_zh : meta.title_en,
    description: isZh ? meta.description_zh : meta.description_en,
    openGraph: {
      title: isZh ? meta.title_zh : meta.title_en,
      description: isZh ? meta.description_zh : meta.description_en,
      url: `https://jilo.ai/${params.locale}/alternatives/${params.slug}`,
      type: 'article',
      images: [{
        url: `https://jilo.ai/api/og?title=${encodeURIComponent(`Best ${meta.tool} Alternatives`)}&subtitle=${encodeURIComponent(`${meta.count} options compared • ${meta.category}`)}`,
        width: 1200, height: 630,
      }],
    },
    alternates: {
      canonical: `https://jilo.ai/${params.locale}/alternatives/${params.slug}`,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(alternativesMeta).map(slug => ({ slug }));
}

export default function AlternativePage({ params }: PageProps) {
  const meta = alternativesMeta[params.slug];
  if (!meta) notFound();
  const isZh = params.locale === 'zh';
  const content = getContent(params.slug);

  // Extract FAQs from content
  const faqItems = content?.match(/## FAQ[\s\S]*$/)?.[0]?.match(/### .+[\s\S]*?(?=###|$)/g) || [];
  const faqs = faqItems.map(faq => {
    const lines = faq.trim().split('\n');
    return {
      question: lines[0].replace(/^### /, '').trim(),
      answer: lines.slice(1).join(' ').replace(/<[^>]*>/g, '').trim(),
    };
  }).filter(f => f.question && f.answer);

  // Protocol 4 unified Schema
  const schemas = generateAlternativeSchema(params.slug, params.locale, {
    description: isZh ? meta.description_zh : meta.description_en,
    faqs,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={params.locale} />
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <ContextualBreadcrumbs slug={params.slug} pageType="alternative" locale={params.locale} />

        <div className="mb-8">
          <Badge className="mb-3">{meta.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isZh ? meta.title_zh : meta.title_en}
          </h1>
          <p className="text-muted-foreground mb-4">
            {isZh ? meta.description_zh : meta.description_en}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>📅 Updated: {meta.lastUpdated}</span>
            <span>🔢 {meta.count} alternatives compared</span>
          </div>
        </div>

        {content ? (
          <article 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Content coming soon...</p>
            </CardContent>
          </Card>
        )}

        {/* Contextual Discovery — 动态三层内链 */}
        <ContextualDiscovery slug={params.slug} pageType="alternative" locale={params.locale} />
      </main>
      <Footer locale={params.locale} />
    </div>
  );
}
