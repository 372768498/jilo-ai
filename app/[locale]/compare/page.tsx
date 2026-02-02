import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Zap, Users, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NewsletterSignup from "@/components/NewsletterSignup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";

type PageProps = {
  params: { locale: string };
};

// 对比页面数据
const comparisons = [
  {
    slug: "chatgpt-vs-claude",
    toolA: "ChatGPT",
    toolB: "Claude",
    category: "AI Chatbots",
    popularity: "hot",
    views: "125K",
    lastUpdated: "2026-02-01",
    summary_en: "Compare the two leading AI assistants across reasoning, coding, creativity and pricing",
    summary_zh: "对比两大领先AI助手在推理、编程、创意和价格方面的表现"
  },
  {
    slug: "chatgpt-vs-gemini",
    toolA: "ChatGPT",
    toolB: "Gemini",
    category: "AI Chatbots", 
    popularity: "hot",
    views: "98K",
    lastUpdated: "2026-02-01",
    summary_en: "OpenAI vs Google: Which AI chatbot wins in 2026?",
    summary_zh: "OpenAI vs Google：2026年哪个AI聊天机器人更胜一筹？"
  },
  {
    slug: "claude-vs-gemini",
    toolA: "Claude",
    toolB: "Gemini",
    category: "AI Chatbots",
    popularity: "trending", 
    views: "67K",
    lastUpdated: "2026-02-01",
    summary_en: "Anthropic vs Google: Advanced reasoning and multimodal capabilities compared",
    summary_zh: "Anthropic vs Google：高级推理和多模态能力对比"
  },
  {
    slug: "midjourney-vs-dall-e",
    toolA: "Midjourney",
    toolB: "DALL-E",
    category: "AI Art",
    popularity: "hot",
    views: "89K",
    lastUpdated: "2026-02-01", 
    summary_en: "The ultimate AI art generator showdown: quality, style, and pricing",
    summary_zh: "AI艺术生成器终极对决：质量、风格和价格全面比较"
  },
  {
    slug: "chatgpt-vs-perplexity",
    toolA: "ChatGPT",
    toolB: "Perplexity",
    category: "AI Search",
    popularity: "trending",
    views: "56K", 
    lastUpdated: "2026-02-01",
    summary_en: "ChatGPT Search vs Perplexity: Which AI search tool is better?",
    summary_zh: "ChatGPT搜索 vs Perplexity：哪个AI搜索工具更好？"
  },
  {
    slug: "github-copilot-vs-chatgpt",
    toolA: "GitHub Copilot",
    toolB: "ChatGPT",
    category: "AI Coding",
    popularity: "hot",
    views: "78K",
    lastUpdated: "2026-02-01",
    summary_en: "Specialized coding assistant vs general AI: Which is better for developers?", 
    summary_zh: "专业编程助手 vs 通用AI：开发者该选哪个？"
  },
  {
    slug: "jasper-vs-chatgpt", 
    toolA: "Jasper",
    toolB: "ChatGPT",
    category: "AI Writing",
    popularity: "stable",
    views: "45K",
    lastUpdated: "2026-02-01",
    summary_en: "Marketing-focused AI writer vs versatile chatbot for content creation",
    summary_zh: "专注营销的AI写作工具 vs 多功能聊天机器人内容创作对比"
  },
  {
    slug: "notion-ai-vs-chatgpt",
    toolA: "Notion AI", 
    toolB: "ChatGPT",
    category: "AI Productivity",
    popularity: "trending",
    views: "52K",
    lastUpdated: "2026-02-01",
    summary_en: "Integrated workspace AI vs standalone assistant for productivity",
    summary_zh: "集成工作区AI vs 独立助手生产力工具对比"
  },
  {
    slug: "grammarly-vs-chatgpt",
    toolA: "Grammarly", 
    toolB: "ChatGPT",
    category: "AI Writing",
    popularity: "stable",
    views: "41K",
    lastUpdated: "2026-02-01", 
    summary_en: "Grammar checker vs AI assistant: Which improves your writing more?",
    summary_zh: "语法检查器 vs AI助手：哪个更能提升你的写作水平？"
  },
  {
    slug: "stable-diffusion-vs-midjourney",
    toolA: "Stable Diffusion",
    toolB: "Midjourney", 
    category: "AI Art",
    popularity: "trending",
    views: "63K",
    lastUpdated: "2026-02-01",
    summary_en: "Open-source flexibility vs commercial polish in AI art generation",
    summary_zh: "开源灵活性 vs 商业精良度：AI艺术生成工具对比"
  },
];

const categories = [
  { name: "AI Chatbots", name_zh: "AI聊天机器人", count: 3, icon: "💬" },
  { name: "AI Art", name_zh: "AI艺术生成", count: 2, icon: "🎨" },
  { name: "AI Writing", name_zh: "AI写作工具", count: 2, icon: "✍️" },
  { name: "AI Coding", name_zh: "AI编程助手", count: 1, icon: "💻" },
  { name: "AI Search", name_zh: "AI搜索", count: 1, icon: "🔍" },
  { name: "AI Productivity", name_zh: "AI生产力", count: 1, icon: "⚡" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params?.locale === 'zh';
  const locale = params?.locale || 'en';
  const altLocale = isZh ? 'en' : 'zh';

  return {
    title: isZh 
      ? 'AI 工具对比 | 找到最适合你的 AI 工具'
      : 'AI Tool Comparisons | Find Your Perfect AI Tool',
    description: isZh
      ? '专业的AI工具对比分析，深度对比ChatGPT、Claude、Midjourney等热门工具的功能、价格和使用场景，帮您做出明智选择。'
      : 'Professional AI tool comparisons. Deep analysis of ChatGPT, Claude, Midjourney and more popular tools across features, pricing and use cases.',
    openGraph: {
      title: isZh ? 'AI 工具对比 | Jilo.ai' : 'AI Tool Comparisons | Jilo.ai',
      description: isZh ? '10+ 深度对比分析，帮您选择最佳AI工具' : '10+ In-depth comparisons to help you choose the best AI tools',
      url: `https://jilo.ai/${locale}/compare`,
      images: [{
        url: `https://jilo.ai/api/og?title=${encodeURIComponent(isZh ? 'AI 工具对比' : 'AI Tool Comparisons')}&subtitle=${encodeURIComponent(isZh ? '专业深度对比分析' : 'Professional In-depth Analysis')}`,
        width: 1200,
        height: 630,
      }],
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/compare`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/compare`,
        [altLocale]: `https://jilo.ai/${altLocale}/compare`,
      },
    },
  };
}

export default function ComparePage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  
  const t = isZh ? {
    hero_title: "AI 工具对比",
    hero_subtitle: "专业深度分析，帮您找到最适合的 AI 工具",
    search_placeholder: "搜索对比...",
    browse_categories: "浏览分类",
    hot_comparisons: "🔥 热门对比",
    trending: "📈 趋势对比", 
    all_comparisons: "📋 全部对比",
    views: "浏览量",
    updated: "更新",
    category: "分类",
    view_comparison: "查看对比",
    hot: "热门",
    trending_tag: "趋势", 
    stable: "稳定",
    total_comparisons: "个对比分析",
    why_compare: "💎 为什么要对比 AI 工具？",
    reasons: [
      { icon: "🎯", title: "精准选择", desc: "避免选择困难，找到最适合的工具" },
      { icon: "💰", title: "成本优化", desc: "对比价格和性价比，节省订阅费用" },
      { icon: "⚡", title: "效率提升", desc: "了解功能差异，最大化工作效率" },
      { icon: "🔄", title: "替换指导", desc: "平滑迁移，避免工具切换成本" }
    ]
  } : {
    hero_title: "AI Tool Comparisons", 
    hero_subtitle: "Professional analysis to help you find the perfect AI tool",
    search_placeholder: "Search comparisons...",
    browse_categories: "Browse Categories",
    hot_comparisons: "🔥 Hot Comparisons",
    trending: "📈 Trending", 
    all_comparisons: "📋 All Comparisons",
    views: "views",
    updated: "updated",
    category: "category",
    view_comparison: "View Comparison",
    hot: "Hot",
    trending_tag: "Trending",
    stable: "Stable", 
    total_comparisons: "comparisons",
    why_compare: "💎 Why Compare AI Tools?",
    reasons: [
      { icon: "🎯", title: "Smart Choice", desc: "Avoid decision paralysis, find the perfect fit" },
      { icon: "💰", title: "Cost Savings", desc: "Compare pricing and value, save on subscriptions" },
      { icon: "⚡", title: "Efficiency", desc: "Understand differences, maximize productivity" },
      { icon: "🔄", title: "Migration", desc: "Smooth transitions, minimize switching costs" }
    ]
  };

  // 分类对比数据
  const getCategoryName = (cat: any) => isZh ? cat.name_zh : cat.name;
  const getSummary = (comp: any) => isZh ? comp.summary_zh : comp.summary_en;

  const getPopularityBadge = (popularity: string) => {
    switch (popularity) {
      case 'hot':
        return { text: t.hot, variant: 'destructive' as const, icon: '🔥' };
      case 'trending': 
        return { text: t.trending_tag, variant: 'default' as const, icon: '📈' };
      default:
        return { text: t.stable, variant: 'secondary' as const, icon: '📊' };
    }
  };

  const hotComparisons = comparisons.filter(c => c.popularity === 'hot');
  const trendingComparisons = comparisons.filter(c => c.popularity === 'trending');

  // Schema.org JSON-LD
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": isZh ? "AI 工具对比" : "AI Tool Comparisons",
    "description": isZh 
      ? "专业的AI工具对比分析，帮您找到最适合的工具"
      : "Professional AI tool comparisons to help you find the perfect tool",
    "url": `https://jilo.ai/${locale}/compare`,
    "publisher": {
      "@type": "Organization", 
      "name": "Jilo.ai",
      "url": "https://jilo.ai"
    }
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      <Navbar locale={locale} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  {t.hero_title}
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8">{t.hero_subtitle}</p>
              
              {/* 统计数据 */}
              <div className="flex justify-center gap-8 mb-8">
                <div>
                  <div className="text-3xl font-bold text-slate-900">{comparisons.length}+</div>
                  <div className="text-sm text-slate-600">{t.total_comparisons}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">6</div>
                  <div className="text-sm text-slate-600">{t.category}</div>
                </div>
                <div>
                  <TrendingUp className="inline w-8 h-8 text-green-500 mx-auto" />
                  <div className="text-sm text-slate-600">{t.updated}</div>
                </div>
              </div>
              
              <SearchBar locale={locale} placeholder={t.search_placeholder} />
              
              <div className="flex gap-4 justify-center mt-6">
                <Button size="lg" className="rounded-full shadow-lg h-12 px-8">
                  {t.hot_comparisons}
                  <Zap className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 分类导航 */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">{t.browse_categories}</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => (
              <Card key={cat.name} className="hover:shadow-lg transition-all hover:-translate-y-0.5 border-2 hover:border-blue-200">
                <CardHeader className="pb-2 text-center">
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <CardTitle className="text-sm">{getCategoryName(cat)}</CardTitle>
                  <CardDescription className="text-xs">
                    {cat.count} {isZh ? "个对比" : "comparisons"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* 热门对比 */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t.hot_comparisons}</h2>
            <span className="text-sm text-muted-foreground">
              {hotComparisons.length} {isZh ? "项" : "items"}
            </span>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hotComparisons.map((comp) => {
              const badge = getPopularityBadge(comp.popularity);
              return (
                <Card key={comp.slug} className="group hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.icon} {badge.text}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{comp.views} {t.views}</span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-orange-600 transition">
                      {comp.toolA} vs {comp.toolB}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {getSummary(comp)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {isZh ? 
                          categories.find(c => c.name === comp.category)?.name_zh || comp.category
                          : comp.category
                        }
                      </Badge>
                      <Button asChild variant="ghost" size="sm" className="group-hover:text-orange-600">
                        <Link href={`/${locale}/compare/${comp.slug}`}>
                          {t.view_comparison}
                          <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 趋势对比 */}
        <section className="bg-slate-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t.trending}</h2>
              <span className="text-sm text-muted-foreground">
                {trendingComparisons.length} {isZh ? "项" : "items"}
              </span>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {trendingComparisons.map((comp) => {
                const badge = getPopularityBadge(comp.popularity);
                return (
                  <Card key={comp.slug} className="group hover:shadow-lg transition-all hover:-translate-y-0.5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.icon} {badge.text}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{comp.views} {t.views}</span>
                      </div>
                      <CardTitle className="text-base group-hover:text-blue-600 transition">
                        {comp.toolA} vs {comp.toolB}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button asChild variant="ghost" size="sm" className="w-full justify-between group-hover:text-blue-600">
                        <Link href={`/${locale}/compare/${comp.slug}`}>
                          {t.view_comparison}
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 全部对比 */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">{t.all_comparisons}</h2>
          
          <div className="space-y-4">
            {comparisons.map((comp) => {
              const badge = getPopularityBadge(comp.popularity);
              return (
                <Card key={comp.slug} className="group hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                            {comp.toolA} vs {comp.toolB}
                          </h3>
                          <Badge variant={badge.variant} className="text-xs">
                            {badge.icon} {badge.text}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {isZh ? 
                              categories.find(c => c.name === comp.category)?.name_zh || comp.category
                              : comp.category
                            }
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {getSummary(comp)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {comp.views} {t.views}
                          </span>
                          <span>{t.updated}: {comp.lastUpdated}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button asChild variant="ghost" className="group-hover:text-blue-600">
                          <Link href={`/${locale}/compare/${comp.slug}`}>
                            {t.view_comparison}
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Why Compare Section */}
        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">{t.why_compare}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {t.reasons.map((reason, index) => (
                <Card key={index} className="text-center p-4 hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                  <div className="text-3xl mb-3">{reason.icon}</div>
                  <h3 className="font-bold text-sm mb-1">{reason.title}</h3>
                  <p className="text-xs text-slate-600">{reason.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <NewsletterSignup />
      </div>

      <Footer locale={locale} />
    </>
  );
}