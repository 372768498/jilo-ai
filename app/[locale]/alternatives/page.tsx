import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = { params: { locale: string } };

const alternatives = [
  { slug: "chatgpt-alternatives", tool: "ChatGPT", category: "AI Chatbots", category_zh: "AI聊天机器人", count: 10, icon: "💬", desc_en: "Best ChatGPT alternatives for AI conversation", desc_zh: "不止ChatGPT！对比10款热门AI对话工具，找到更适合你的选择" },
  { slug: "midjourney-alternatives", tool: "Midjourney", category: "AI Art", category_zh: "AI绘画", count: 10, icon: "🎨", desc_en: "Best Midjourney alternatives for AI art generation", desc_zh: "Midjourney太贵？这10款AI绘画工具同样出色，部分免费可用" },
  { slug: "grammarly-alternatives", tool: "Grammarly", category: "AI Writing", category_zh: "AI写作", count: 10, icon: "✍️", desc_en: "Best Grammarly alternatives for writing assistance", desc_zh: "10款Grammarly替代工具，语法纠错、润色改写一步到位" },
  { slug: "notion-alternatives", tool: "Notion", category: "AI Productivity", category_zh: "AI效率", count: 10, icon: "📝", desc_en: "Best Notion alternatives for productivity", desc_zh: "比Notion更好用？10款AI生产力工具助你高效办公" },
  { slug: "jasper-alternatives", tool: "Jasper", category: "AI Marketing", category_zh: "AI营销", count: 10, icon: "📢", desc_en: "Best Jasper alternatives for marketing copy", desc_zh: "10款Jasper替代工具，轻松搞定营销文案和内容创作" },
  { slug: "github-copilot-alternatives", tool: "GitHub Copilot", category: "AI Coding", category_zh: "AI编程", count: 10, icon: "💻", desc_en: "Best GitHub Copilot alternatives for coding", desc_zh: "10款GitHub Copilot替代品，AI辅助编程提效神器" },
  { slug: "canva-alternatives", tool: "Canva", category: "AI Design", category_zh: "AI设计", count: 10, icon: "🖼️", desc_en: "Best Canva alternatives for graphic design", desc_zh: "不用Canva也能做设计！10款AI设计工具推荐" },
  { slug: "perplexity-alternatives", tool: "Perplexity", category: "AI Search", category_zh: "AI搜索", count: 10, icon: "🔍", desc_en: "Best Perplexity alternatives for AI search", desc_zh: "10款Perplexity替代品，AI搜索引擎哪家强？" },
  { slug: "elevenlabs-alternatives", tool: "ElevenLabs", category: "AI Voice", category_zh: "AI语音", count: 10, icon: "🎙️", desc_en: "Best ElevenLabs alternatives for AI voice", desc_zh: "10款ElevenLabs替代工具，AI语音合成和声音克隆推荐" },
  { slug: "runway-alternatives", tool: "Runway", category: "AI Video", category_zh: "AI视频", count: 10, icon: "🎬", desc_en: "Best Runway alternatives for AI video", desc_zh: "10款Runway替代品，AI视频生成和编辑工具盘点" },
  { slug: "cursor-alternatives", tool: "Cursor", category: "AI Coding", category_zh: "AI编程", count: 10, icon: "⌨️", desc_en: "Best Cursor alternatives for AI coding", desc_zh: "10款Cursor替代工具，AI代码编辑器哪个更好用？" },
  { slug: "deepseek-alternatives", tool: "DeepSeek", category: "AI Chatbots", category_zh: "AI聊天机器人", count: 10, icon: "🧠", desc_en: "Best DeepSeek alternatives for AI reasoning", desc_zh: "10款DeepSeek替代品，高性能AI推理工具推荐" },
  { slug: "dall-e-alternatives", tool: "DALL-E", category: "AI Art", category_zh: "AI绘画", count: 10, icon: "🎨", desc_en: "Best DALL-E alternatives for AI image generation", desc_zh: "10款DALL-E替代工具，AI图片生成免费和付费选项" },
  { slug: "synthesia-alternatives", tool: "Synthesia", category: "AI Video", category_zh: "AI视频", count: 10, icon: "🎥", desc_en: "Best Synthesia alternatives for AI video", desc_zh: "10款Synthesia替代品，AI数字人视频制作工具" },
  { slug: "copy-ai-alternatives", tool: "Copy.ai", category: "AI Marketing", category_zh: "AI营销", count: 10, icon: "📝", desc_en: "Best Copy.ai alternatives for copywriting", desc_zh: "10款Copy.ai替代工具，AI文案自动生成推荐" },
  { slug: "deepl-alternatives", tool: "DeepL", category: "AI Translation", category_zh: "AI翻译", count: 10, icon: "🌐", desc_en: "Best DeepL alternatives for translation", desc_zh: "10款DeepL替代品，AI翻译工具精准度对比" },
  { slug: "otter-ai-alternatives", tool: "Otter.ai", category: "AI Productivity", category_zh: "AI效率", count: 10, icon: "🦦", desc_en: "Best Otter.ai alternatives for transcription", desc_zh: "10款Otter.ai替代品，AI会议转录和语音笔记工具" },
  { slug: "figma-alternatives", tool: "Figma", category: "AI Design", category_zh: "AI设计", count: 10, icon: "🎨", desc_en: "Best Figma alternatives with AI features", desc_zh: "10款Figma替代品，带AI功能的UI/UX设计工具" },
  { slug: "writesonic-alternatives", tool: "Writesonic", category: "AI Writing", category_zh: "AI写作", count: 10, icon: "✍️", desc_en: "Best Writesonic alternatives for content", desc_zh: "10款Writesonic替代工具，AI内容创作和SEO写作" },
  { slug: "descript-alternatives", tool: "Descript", category: "AI Video", category_zh: "AI视频", count: 10, icon: "🎬", desc_en: "Best Descript alternatives for editing", desc_zh: "10款Descript替代品，AI音视频编辑工具推荐" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params.locale === 'zh';
  return {
    title: isZh ? 'AI工具替代方案 | 20+热门工具平替推荐 - Jilo.ai' : 'AI Tool Alternatives | Find Better Options - Jilo.ai',
    description: isZh
      ? '精选20+热门AI工具的最佳替代方案，涵盖ChatGPT、Midjourney、Grammarly、Cursor等，免费和付费选项全面对比，帮你找到性价比最高的选择。'
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
              ? '用不惯某个AI工具？太贵了？这里有更好的选择。对比功能、价格和真实用户体验，找到最适合你的平替。'
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
                    <Badge variant="secondary">{isZh ? (alt as any).category_zh || alt.category : alt.category}</Badge>
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
                    <span className="text-sm text-muted-foreground">{alt.count} {isZh ? '个替代方案' : 'alternatives'}</span>
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
