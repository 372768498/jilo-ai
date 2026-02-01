import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = { params: { locale: string } };

const alternatives = [
  { slug: "chatgpt-alternatives", tool: "ChatGPT", category: "AI Chatbots", count: 10, icon: "💬", desc_en: "Best ChatGPT alternatives for AI conversation", desc_zh: "最佳ChatGPT替代方案" },
  { slug: "midjourney-alternatives", tool: "Midjourney", category: "AI Art", count: 10, icon: "🎨", desc_en: "Best Midjourney alternatives for AI art generation", desc_zh: "最佳Midjourney替代方案" },
  { slug: "grammarly-alternatives", tool: "Grammarly", category: "AI Writing", count: 10, icon: "✍️", desc_en: "Best Grammarly alternatives for writing assistance", desc_zh: "最佳Grammarly替代方案" },
  { slug: "notion-alternatives", tool: "Notion", category: "AI Productivity", count: 10, icon: "📝", desc_en: "Best Notion alternatives for productivity", desc_zh: "最佳Notion替代方案" },
  { slug: "jasper-alternatives", tool: "Jasper", category: "AI Marketing", count: 10, icon: "📢", desc_en: "Best Jasper alternatives for marketing copy", desc_zh: "最佳Jasper替代方案" },
  { slug: "github-copilot-alternatives", tool: "GitHub Copilot", category: "AI Coding", count: 10, icon: "💻", desc_en: "Best GitHub Copilot alternatives for coding", desc_zh: "最佳GitHub Copilot替代方案" },
  { slug: "canva-alternatives", tool: "Canva", category: "AI Design", count: 10, icon: "🖼️", desc_en: "Best Canva alternatives for graphic design", desc_zh: "最佳Canva替代方案" },
  { slug: "perplexity-alternatives", tool: "Perplexity", category: "AI Search", count: 10, icon: "🔍", desc_en: "Best Perplexity alternatives for AI search", desc_zh: "最佳Perplexity替代方案" },
  { slug: "elevenlabs-alternatives", tool: "ElevenLabs", category: "AI Voice", count: 10, icon: "🎙️", desc_en: "Best ElevenLabs alternatives for AI voice", desc_zh: "最佳ElevenLabs替代方案" },
  { slug: "runway-alternatives", tool: "Runway", category: "AI Video", count: 10, icon: "🎬", desc_en: "Best Runway alternatives for AI video", desc_zh: "最佳Runway替代方案" },
  { slug: "cursor-alternatives", tool: "Cursor", category: "AI Coding", count: 10, icon: "⌨️", desc_en: "Best Cursor alternatives for AI coding", desc_zh: "最佳Cursor替代方案" },
  { slug: "deepseek-alternatives", tool: "DeepSeek", category: "AI Chatbots", count: 10, icon: "🧠", desc_en: "Best DeepSeek alternatives for AI reasoning", desc_zh: "最佳DeepSeek替代方案" },
  { slug: "dall-e-alternatives", tool: "DALL-E", category: "AI Art", count: 10, icon: "🎨", desc_en: "Best DALL-E alternatives for AI image generation", desc_zh: "最佳DALL-E替代方案" },
  { slug: "synthesia-alternatives", tool: "Synthesia", category: "AI Video", count: 10, icon: "🎥", desc_en: "Best Synthesia alternatives for AI video", desc_zh: "最佳Synthesia替代方案" },
  { slug: "copy-ai-alternatives", tool: "Copy.ai", category: "AI Marketing", count: 10, icon: "📝", desc_en: "Best Copy.ai alternatives for copywriting", desc_zh: "最佳Copy.ai替代方案" },
  { slug: "deepl-alternatives", tool: "DeepL", category: "AI Translation", count: 10, icon: "🌐", desc_en: "Best DeepL alternatives for translation", desc_zh: "最佳DeepL替代方案" },
  { slug: "otter-ai-alternatives", tool: "Otter.ai", category: "AI Productivity", count: 10, icon: "🦦", desc_en: "Best Otter.ai alternatives for transcription", desc_zh: "最佳Otter.ai替代方案" },
  { slug: "figma-alternatives", tool: "Figma", category: "AI Design", count: 10, icon: "🎨", desc_en: "Best Figma alternatives with AI features", desc_zh: "最佳Figma替代方案" },
  { slug: "writesonic-alternatives", tool: "Writesonic", category: "AI Writing", count: 10, icon: "✍️", desc_en: "Best Writesonic alternatives for content", desc_zh: "最佳Writesonic替代方案" },
  { slug: "descript-alternatives", tool: "Descript", category: "AI Video", count: 10, icon: "🎬", desc_en: "Best Descript alternatives for editing", desc_zh: "最佳Descript替代方案" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params.locale === 'zh';
  return {
    title: isZh ? 'AI 工具替代方案' : 'AI Tool Alternatives',
    description: isZh
      ? '发现最佳AI工具替代方案，对比免费和付费选项。'
      : 'Discover the best AI tool alternatives. Compare free and paid options for ChatGPT, Midjourney, Grammarly and more.',
  };
}

export default function AlternativesListPage({ params }: PageProps) {
  const isZh = params.locale === 'zh';
  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={params.locale} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {isZh ? '🔄 AI 工具替代方案' : '🔄 AI Tool Alternatives'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isZh
              ? '找到最适合你的AI工具。对比功能、价格和真实用户体验。'
              : 'Find the perfect AI tool for your needs. Compare features, pricing, and real user experiences.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alternatives.map((alt) => (
            <Link key={alt.slug} href={`/${params.locale}/alternatives/${alt.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{alt.icon}</span>
                    <Badge variant="secondary">{alt.category}</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {alt.tool} {isZh ? '替代方案' : 'Alternatives'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {isZh ? alt.desc_zh : alt.desc_en}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{alt.count} alternatives</span>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer locale={params.locale} />
    </div>
  );
}
