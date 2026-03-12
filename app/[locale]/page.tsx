import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Workflow } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/search-bar";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import NewsletterSignup from "@/components/NewsletterSignup";
import CategoryScrollBar from "@/components/category-scroll-bar";
import TrendingTools from "@/components/trending-tools";
import QuickDiscovery from "@/components/quick-discovery";
import AdSlot from "@/components/ad-slot";
import type { Metadata } from "next";

type PageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params?.locale === 'zh';
  const locale = params?.locale || 'en';
  const altLocale = isZh ? 'en' : 'zh';

  return {
    title: isZh
      ? 'Jilo.ai - 发现最佳AI工具 | AI工具导航、评测与对比'
      : 'Jilo.ai - Discover & Compare the Best AI Tools',
    description: isZh
      ? '浏览70+精选AI工具，覆盖8大类别（写作、编程、设计、视频、商务等）。独立专业评测、工具对比、替代方案推荐，每日更新，完全免费。'
      : 'Browse 70+ curated AI tools across 8+ categories including writing, coding, design, video & business. Independent expert reviews, side-by-side comparisons, and alternatives — updated daily, 100% free.',
    openGraph: {
      title: isZh ? 'Jilo.ai - 发现最佳AI工具' : 'Jilo.ai - Discover & Compare AI Tools',
      description: isZh ? '70+ AI工具，每日更新' : '70+ AI Tools, Updated Daily',
      url: `https://jilo.ai/${locale}`,
      images: [{
        url: `https://jilo.ai/api/og?title=${encodeURIComponent(isZh ? '发现最好的 AI 工具' : 'Discover & Compare AI Tools')}&subtitle=${encodeURIComponent(isZh ? '70+ AI工具 · 每日更新 · 专业评测' : '70+ AI Tools · Updated Daily · Expert Reviews')}`,
        width: 1200,
        height: 630,
      }],
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}`,
      languages: {
        [locale]: `https://jilo.ai/${locale}`,
        [altLocale]: `https://jilo.ai/${altLocale}`,
      },
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  
  // 合并查询：一次获取所有工具数据（代替 9 个独立查询）
  const [allToolsRes, popularRes, featuredQuickRes, freeRes, updatedRes, newsRes] = await Promise.all([
    supabase
      .from("tools")
      .select("id, slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, pricing_type, is_featured")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("tools")
      .select("id, slug, name_en, name_zh, logo_url")
      .eq("status", "published")
      .order("click_count", { ascending: false })
      .limit(3),
    supabase
      .from("tools")
      .select("id, slug, name_en, name_zh, logo_url")
      .eq("status", "published")
      .eq("is_featured", true)
      .limit(3),
    supabase
      .from("tools")
      .select("id, slug, name_en, name_zh, logo_url")
      .eq("status", "published")
      .eq("pricing_type", "free")
      .limit(3),
    supabase
      .from("tools")
      .select("id, slug, name_en, name_zh, logo_url")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("news_simple")
      .select("id, slug, title, title_zh, summary, summary_zh, source, source_url, cover_url, published_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20),
  ]);

  const allTools = allToolsRes.data || [];
  const trendingTools = allTools.slice(0, 16);
  const featuredTools = allTools;
  const newestTools = allTools.slice(0, 3);
  const popularTools = popularRes.data || [];
  const featuredToolsQuick = featuredQuickRes.data || [];
  const freeTools = freeRes.data || [];
  const trendingToolsQuick = allTools.slice(9, 12);
  const updatedTools = updatedRes.data || [];
  const communityTools = allTools.slice(15, 18);
  const specialTools = allTools.slice(18, 21);
  const latestNews = newsRes.data;

  // 去重
  const uniqueNews = latestNews?.filter((news, index, self) =>
    index === self.findIndex((n) => n.id === news.id)
  );

  // 工具本地化辅助函数
  const getToolName = (tool: any) => isZh ? (tool.name_zh || tool.name_en) : tool.name_en;
  const getToolDesc = (tool: any) => isZh ? (tool.tagline_zh || tool.tagline_en) : tool.tagline_en;

  const t = isZh ? {
    hero_title: "发现最好的 AI 工具",
    hero_subtitle: "70+ AI工具，每日更新",
    search_placeholder: "搜索 AI 工具...",
    browse_all: "浏览所有工具",
    featured_tools: "✨ 精选工具",
    latest_news: "📰 AI 头条",
    view_all_news: "查看全部",
    view_all_tools: "查看全部",
    hand_picked: "精心挑选的优质 AI 工具",
    stay_updated: "紧跟 AI 行业最新动态",
    why_choose: "💎 为什么选择 Jilo.ai",
    reasons: [
      { icon: "📅", title: "每日更新", desc: "持续收录最新 AI 工具" },
      { icon: "🎯", title: "精准分类", desc: "8+ 核心分类" },
      { icon: "🆓", title: "完全免费", desc: "无需注册即可使用" },
      { icon: "⭐", title: "专业评测", desc: "编辑团队精心筛选" }
    ],
    tools: "工具",
    users: "用户",
    daily: "每日"
  } : {
    hero_title: "Discover the Best AI Tools",
    hero_subtitle: "70+ AI Tools, Updated Daily",
    search_placeholder: "Search AI tools...",
    browse_all: "Browse All Tools",
    featured_tools: "✨ Featured Tools",
    latest_news: "📰 AI Headlines",
    view_all_news: "View All",
    view_all_tools: "View All",
    hand_picked: "Hand-picked quality AI tools",
    stay_updated: "Stay updated with AI trends",
    why_choose: "💎 Why Choose Jilo.ai",
    reasons: [
      { icon: "📅", title: "Daily Updates", desc: "Fresh AI tools every day" },
      { icon: "🎯", title: "Precise Categories", desc: "8+ core categories" },
      { icon: "🆓", title: "Totally Free", desc: "No registration required" },
      { icon: "⭐", title: "Expert Reviews", desc: "Curated by our team" }
    ],
    tools: "Tools",
    users: "Users",
    daily: "Daily"
  };

  // 新闻本地化辅助函数
  const getTitle = (news: any) => isZh ? (news.title_zh || news.title) : news.title;
  const getSummary = (news: any) => isZh ? (news.summary_zh || news.summary) : news.summary;

  // 新闻占位图标
  const getNewsPlaceholder = (index: number) => {
    const icons = ["🔥", "⚡", "✨", "💡", "🚀", "🎯", "💻", "🤖", "📱", "🎨"];
    const gradients = [
      "from-red-500 to-orange-500",
      "from-orange-500 to-yellow-500",
      "from-yellow-500 to-amber-500",
      "from-blue-400 to-purple-500",
      "from-purple-400 to-pink-500",
      "from-green-400 to-teal-500",
      "from-indigo-400 to-blue-500",
      "from-pink-400 to-red-500",
      "from-teal-400 to-cyan-500",
      "from-cyan-400 to-blue-500",
    ];
    return {
      icon: icons[index % icons.length],
      gradient: gradients[index % gradients.length]
    };
  };

  // Schema.org JSON-LD for HomePage
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Jilo.ai",
    "url": "https://jilo.ai",
    "description": "Discover, compare and review the best AI tools",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `https://jilo.ai/en/tools?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Jilo.ai",
    "url": "https://jilo.ai",
    "logo": "https://jilo.ai/icon.png",
    "sameAs": []
  };

  return (
    <>
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      <Navbar locale={locale} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Hero Section - Redesigned for overseas users */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.04)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Trust Signals - Prominent Display */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">
                    {isZh ? "每日更新" : "Updated Daily"}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                  <span className="text-sm font-semibold text-blue-700">70+</span>
                  <span className="text-sm font-medium text-blue-600">
                    {isZh ? "AI工具已评测" : "Tools Reviewed"}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200">
                  <span className="text-sm font-medium text-purple-600">
                    {isZh ? "独立评测" : "Independent Reviews"}
                  </span>
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[0.9] tracking-tight">
                <span className="text-slate-900">
                  {isZh ? "找到" : "Find Your"}
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-600 to-purple-600 font-mono">
                  {isZh ? "最适合的 AI 工具" : "Right AI Tool"}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 mb-12 font-light leading-relaxed">
                {isZh 
                  ? "70+ 精选AI工具，按使用场景分类，专业评测帮你做决策"
                  : "70+ curated AI tools, organized by use case, expert reviews to help you decide"
                }
              </p>
              
              {/* Main CTA - Hero Search Box */}
              <div className="relative max-w-2xl mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-20"></div>
                <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-xl hover:shadow-2xl transition-all">
                  <div className="flex items-center">
                    <div className="flex-1 relative">
                      <SearchBar 
                        locale={locale} 
                        placeholder={isZh ? "搜索70+ AI工具，按使用场景..." : "Search 70+ AI tools by use case..."}
                      />
                    </div>
                    <Button size="lg" className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl px-8 h-12 font-semibold shadow-lg">
                      {isZh ? "发现工具" : "Find Tools"}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Popular Search Tags */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                <span className="text-sm font-medium text-slate-600 mr-2">
                  {isZh ? "热门搜索:" : "Popular:"}
                </span>
                {[
                  { en: "Writing", zh: "写作", icon: "✍️" },
                  { en: "Coding", zh: "编程", icon: "💻" },
                  { en: "Design", zh: "设计", icon: "🎨" },
                  { en: "Video", zh: "视频", icon: "🎬" },
                  { en: "Business", zh: "商务", icon: "💼" },
                ].map((tag) => (
                  <Button
                    key={tag.en}
                    variant="ghost"
                    size="sm"
                    asChild
                    className="rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2"
                  >
                    <Link href={`/${locale}/tools?category=${tag.en.toLowerCase()}`}>
                      <span className="mr-1">{tag.icon}</span>
                      {isZh ? tag.zh : tag.en}
                    </Link>
                  </Button>
                ))}
              </div>

              {/* Secondary CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="outline" className="rounded-xl border-2 border-slate-200 hover:border-blue-300 h-12 px-8 font-medium">
                  <Link href={`/${locale}/tools`}>
                    {isZh ? "浏览所有工具" : "Browse All Tools"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="rounded-xl h-12 px-8 font-medium text-slate-600 hover:text-slate-900">
                  <Link href={`/${locale}/workflows`}>
                    {isZh ? "查看工作流" : "Explore Workflows"}
                  </Link>
                </Button>
              </div>

              {/* Trust Stats - Prominent */}
              <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">70+</div>
                  <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    {isZh ? "精选工具" : "Curated Tools"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">10K+</div>
                  <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    {isZh ? "活跃用户" : "Active Users"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    {isZh ? "每日更新" : "Daily Updates"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Scroll Bar */}
        <CategoryScrollBar locale={locale} />

        {/* Scenario-Based Navigation - Key UX Improvement */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {isZh ? "我需要 AI 来..." : "I need AI for..."}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {isZh 
                  ? "基于真实使用场景，快速找到最适合的AI工具"
                  : "Based on real use cases, quickly find the perfect AI tool for your needs"
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[
                {
                  icon: "✍️",
                  title: { en: "Writing", zh: "写作创作" },
                  desc: { en: "Articles, blogs, copywriting", zh: "文章、博客、文案创作" },
                  category: "writing",
                  gradient: "from-emerald-500 to-teal-600",
                  count: "12+"
                },
                {
                  icon: "💻",
                  title: { en: "Coding", zh: "编程开发" },
                  desc: { en: "Code generation, debugging", zh: "代码生成、调试优化" },
                  category: "coding",
                  gradient: "from-blue-500 to-indigo-600",
                  count: "15+"
                },
                {
                  icon: "🎨",
                  title: { en: "Design", zh: "视觉设计" },
                  desc: { en: "Images, logos, graphics", zh: "图片、标志、图形设计" },
                  category: "design",
                  gradient: "from-purple-500 to-pink-600",
                  count: "18+"
                },
                {
                  icon: "🎬",
                  title: { en: "Video", zh: "视频制作" },
                  desc: { en: "Editing, effects, generation", zh: "剪辑、特效、生成" },
                  category: "video",
                  gradient: "from-orange-500 to-red-600",
                  count: "8+"
                },
                {
                  icon: "💼",
                  title: { en: "Business", zh: "商务办公" },
                  desc: { en: "Analysis, automation, insights", zh: "分析、自动化、洞察" },
                  category: "business",
                  gradient: "from-slate-700 to-slate-900",
                  count: "10+"
                }
              ].map((scenario) => (
                <Link
                  key={scenario.category}
                  href={`/${locale}/tools?category=${scenario.category}`}
                  className="group block"
                >
                  <Card className="h-full border-2 border-slate-200/50 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${scenario.gradient}`} />
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-4xl">{scenario.icon}</div>
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {scenario.count}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                        {isZh ? scenario.title.zh : scenario.title.en}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-slate-600 leading-relaxed">
                        {isZh ? scenario.desc.zh : scenario.desc.en}
                      </CardDescription>
                      <div className="mt-4 flex items-center text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                        <span>{isZh ? "探索工具" : "Explore Tools"}</span>
                        <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Quick Stats Bar */}
            <div className="mt-12 p-6 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isZh ? "每日新增AI工具" : "New AI Tools Daily"}
                    </div>
                    <div className="text-sm text-slate-600">
                      {isZh ? "我们的专家团队每天筛选最新工具" : "Our expert team curates the latest tools every day"}
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="rounded-xl font-medium">
                  <Link href={`/${locale}/tools?sort=newest`}>
                    {isZh ? "查看最新" : "View Latest"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Workflows */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                <Workflow className="w-7 h-7" />
                {isZh ? "热门 AI 工作流" : "Popular AI Workflows"}
              </h2>
              <p className="text-sm text-slate-600">
                {isZh ? "不是只看工具，而是直接看这件事怎么做。" : "Not just which tools to use, but how to get the job done."}
              </p>
            </div>
            <Button asChild variant="ghost" className="group hidden md:flex">
              <Link href={`/${locale}/workflows`}>
                {isZh ? "查看全部工作流" : "View All Workflows"}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                slug: 'write-seo-blog-posts-with-ai',
                title: isZh ? '用 AI 写 SEO 博客文章' : 'Write SEO Blog Posts with AI',
                desc: isZh ? '从关键词到提纲、初稿、优化和发布的一套标准流程。' : 'A practical flow from keyword research to outline, draft, optimization, and publish.',
                meta: isZh ? '入门 · 30-60 分钟 · 3 工具' : 'Beginner · 30–60 min · 3 tools'
              },
              {
                slug: 'turn-one-article-into-social-content',
                title: isZh ? '把一篇文章拆成社媒内容' : 'Turn One Article into Social Content',
                desc: isZh ? '把一篇长文快速拆成多平台可发的短内容。' : 'Repurpose one long-form article into multi-channel social content.',
                meta: isZh ? '入门 · 20-30 分钟 · 2 工具' : 'Beginner · 20–30 min · 2 tools'
              },
              {
                slug: 'research-competitors-in-30-minutes',
                title: isZh ? '30 分钟完成竞品研究' : 'Research Competitors in 30 Minutes',
                desc: isZh ? '快速梳理竞品定位、卖点和差异化机会。' : 'Quickly compare positioning, messaging, and differentiation opportunities.',
                meta: isZh ? '入门 · 30 分钟 · 2 工具' : 'Beginner · 30 min · 2 tools'
              },
              {
                slug: 'ai-coding-workflow-for-solo-developers',
                title: isZh ? '独立开发者的 AI 编码工作流' : 'AI Coding Workflow for Solo Developers',
                desc: isZh ? '需求澄清、实现、调试、发布，一套更稳的 AI 编码方式。' : 'A safer AI-assisted coding flow from feature planning to debugging and shipping.',
                meta: isZh ? '中级 · 1-3 小时 · 3 工具' : 'Intermediate · 1–3 hrs · 3 tools'
              }
            ].map((item) => (
              <Card key={item.slug} className="group hover:shadow-lg transition-all hover:-translate-y-0.5 border hover:border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg group-hover:text-blue-600 transition line-clamp-2">
                    <Link href={`/${locale}/workflows/${item.slug}`}>{item.title}</Link>
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-3">{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-slate-500 mb-4">{item.meta}</div>
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href={`/${locale}/workflows/${item.slug}`}>
                      {isZh ? '查看工作流' : 'View Workflow'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Tools */}
        <TrendingTools locale={locale} tools={trendingTools || []} />

        {/* Quick Discovery */}
        <QuickDiscovery 
          locale={locale}
          newest={newestTools || []}
          popular={popularTools || []}
          featured={featuredToolsQuick || []}
          free={freeTools || []}
          trending={trendingToolsQuick || []}
          updated={updatedTools || []}
          community={communityTools || []}
          special={specialTools || []}
        />

        {/* 广告位 */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AdSlot type="banner" height="h-28" locale={locale} />
        </div>

        {/* 深度评测入口 */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{isZh ? '🔥 深度评测' : '🔥 In-Depth Reviews'}</h2>
            <Link href={`/${locale}/reviews`} className="text-sm text-primary hover:underline">
              {isZh ? '查看全部 →' : 'View All →'}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { slug: 'perplexity-vs-google-vs-chatgpt-search', title: isZh ? 'Perplexity vs Google vs ChatGPT Search 搜索大战' : 'Perplexity vs Google vs ChatGPT Search', tag: '🔥 Hot' },
              { slug: 'cursor-vs-github-copilot-vs-windsurf', title: isZh ? 'Cursor vs Copilot vs Windsurf 编程神器对决' : 'Cursor vs Copilot vs Windsurf', tag: 'Coding' },
              { slug: 'claude-vs-gemini', title: isZh ? 'Claude vs Gemini AI 模型巅峰对决' : 'Claude vs Gemini', tag: 'AI Model' },
              { slug: 'chatgpt-vs-deepseek', title: isZh ? 'ChatGPT vs DeepSeek 国产AI的逆袭' : 'ChatGPT vs DeepSeek', tag: '🆚 VS' },
              { slug: 'openclaw-review-and-setup-guide', title: isZh ? 'OpenClaw 评测：12万Star的AI助手' : 'OpenClaw: 120K Star AI Assistant', tag: 'Review' },
              { slug: 'best-ai-agents', title: isZh ? '十大 AI Agent 横评' : '10 Best AI Agents 2025', tag: 'AI Agent' },
            ].map(r => (
              <Link key={r.slug} href={`/${locale}/reviews/${r.slug}`}
                className="block p-4 border rounded-xl hover:shadow-md hover:border-primary/30 transition group">
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{r.tag}</span>
                <h3 className="mt-2 font-semibold text-sm group-hover:text-primary transition line-clamp-2">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Tools Section */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-1">{t.featured_tools}</h2>
              <p className="text-sm text-slate-600">{t.hand_picked}</p>
            </div>
            <Button asChild variant="ghost" className="group hidden md:flex">
              <Link href={`/${locale}/tools`}>
                {t.view_all_tools}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {featuredTools?.map((tool) => (
              <Card key={tool.id} className="group hover:shadow-lg transition-all hover:-translate-y-0.5 border hover:border-blue-200">
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-start gap-2">
                    {tool.logo_url ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden">
                        <Image 
                          src={tool.logo_url} 
                          alt={getToolName(tool)} 
                          width={40}
                          height={40}
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-slate-400 font-semibold text-sm">
                        {getToolName(tool)?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm group-hover:text-blue-600 transition line-clamp-1">
                        <Link href={`/${locale}/tools/${tool.slug}`}>
                          {getToolName(tool)}
                        </Link>
                      </CardTitle>
                      {tool.pricing_type && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {tool.pricing_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  {getToolDesc(tool) && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {getToolDesc(tool)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section className="bg-slate-50 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-1">{t.latest_news}</h2>
                <p className="text-sm text-slate-600">{t.stay_updated}</p>
              </div>
              <Button asChild variant="ghost" className="group">
                <Link href={`/${locale}/news`}>
                  {t.view_all_news}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            <Card className="border-2 overflow-hidden">
              <div className="divide-y">
                {uniqueNews?.slice(0, 10).map((news, index) => {
                  const { icon, gradient } = getNewsPlaceholder(index);
                  return (
                    <Link
                      key={news.slug}
                      href={`/${locale}/news/${news.slug}`}
                      className="block hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex-shrink-0">
                          {index < 3 ? (
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-xl font-bold shadow-lg`}>
                              {icon}
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex flex-col items-center justify-center">
                              <div className="text-xs font-semibold opacity-60">No.</div>
                              <div className="text-lg font-bold leading-none">{index + 1}</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-blue-600 transition mb-2">
                            {getTitle(news)}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {news.published_at && (
                              <span className="flex items-center gap-1">
                                <span className="text-slate-400">📅</span>
                                {new Date(news.published_at).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                            {news.source && (
                              <Badge variant="secondary" className="text-xs">
                                {news.source}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              
              <div className="border-t bg-slate-50/50 p-4 text-center">
                <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <Link href={`/${locale}/news`}>
                    {t.view_all_news} →
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Why Choose Jilo.ai - Enhanced Trust Signals */}
        <section className="bg-slate-50 py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {isZh ? "为什么选择 Jilo.ai？" : "Why Choose Jilo.ai?"}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {isZh 
                  ? "我们不只是工具目录，我们是你的AI工具决策助手"
                  : "We're not just a tool directory, we're your AI tool decision assistant"
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {[
                {
                  icon: "📅",
                  title: { en: "Updated Daily", zh: "每日更新" },
                  desc: { en: "Fresh AI tools and reviews every day", zh: "每天更新最新AI工具和评测" },
                  metric: { en: "Daily", zh: "每日" },
                  gradient: "from-green-500 to-emerald-600"
                },
                {
                  icon: "⭐",
                  title: { en: "Expert Reviews", zh: "专业评测" },
                  desc: { en: "In-depth analysis by our expert team", zh: "专业团队深度分析评测" },
                  metric: { en: "Expert-Led", zh: "专家主导" },
                  gradient: "from-blue-500 to-indigo-600"
                },
                {
                  icon: "🆓",
                  title: { en: "Completely Free", zh: "完全免费" },
                  desc: { en: "No registration, no hidden costs", zh: "无需注册，无隐藏费用" },
                  metric: { en: "100% Free", zh: "100%免费" },
                  gradient: "from-purple-500 to-pink-600"
                },
                {
                  icon: "🎯",
                  title: { en: "Use Case Focused", zh: "场景导向" },
                  desc: { en: "Tools organized by actual use cases", zh: "按实际使用场景分类工具" },
                  metric: { en: "8+ Categories", zh: "8+类别" },
                  gradient: "from-orange-500 to-red-600"
                }
              ].map((feature, index) => (
                <Card key={index} className="group border-2 border-slate-200/50 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${feature.gradient}`} />
                  <CardHeader className="text-center pb-4">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <CardTitle className="text-lg font-bold text-slate-900 mb-2">
                      {isZh ? feature.title.zh : feature.title.en}
                    </CardTitle>
                    <Badge variant="secondary" className={`mx-auto text-xs font-semibold bg-gradient-to-r ${feature.gradient} text-white border-0`}>
                      {isZh ? feature.metric.zh : feature.metric.en}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <CardDescription className="text-sm text-slate-600 leading-relaxed">
                      {isZh ? feature.desc.zh : feature.desc.en}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Social Proof Section */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {isZh ? "用户怎么说？" : "What Users Say"}
                  </h3>
                  <div className="space-y-6">
                    {[
                      {
                        text: { 
                          en: "Finally, a tool directory that actually helps me make decisions instead of just listing everything.",
                          zh: "终于有一个工具目录真正帮助我做决策，而不只是列出所有东西。"
                        },
                        author: { en: "Sarah K., Product Manager", zh: "Sarah K., 产品经理" }
                      },
                      {
                        text: { 
                          en: "The use case organization is brilliant. I can find exactly what I need in seconds.",
                          zh: "按使用场景分类太棒了，我可以在几秒钟内找到我需要的工具。"
                        },
                        author: { en: "Mike T., Designer", zh: "Mike T., 设计师" }
                      }
                    ].map((testimonial, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-slate-600">
                            {testimonial.author.en.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-700 italic mb-2 leading-relaxed">
                            "{isZh ? testimonial.text.zh : testimonial.text.en}"
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            {isZh ? testimonial.author.zh : testimonial.author.en}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-black text-slate-900 mb-1">4.8</div>
                    <div className="text-yellow-500 mb-2">⭐⭐⭐⭐⭐</div>
                    <div className="text-sm font-medium text-slate-600">
                      {isZh ? "用户评分" : "User Rating"}
                    </div>
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-black text-slate-900 mb-1">99%</div>
                    <div className="text-green-500 mb-2">✓</div>
                    <div className="text-sm font-medium text-slate-600">
                      {isZh ? "推荐率" : "Recommend Rate"}
                    </div>
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-black text-slate-900 mb-1">24/7</div>
                    <div className="text-blue-500 mb-2">🔄</div>
                    <div className="text-sm font-medium text-slate-600">
                      {isZh ? "实时更新" : "Live Updates"}
                    </div>
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-black text-slate-900 mb-1">0</div>
                    <div className="text-purple-500 mb-2">🆓</div>
                    <div className="text-sm font-medium text-slate-600">
                      {isZh ? "注册费用" : "Signup Cost"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 广告位 - 底部 */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <AdSlot type="banner" height="h-32" locale={locale} />
        </div>

        {/* 最近更新滚动横幅 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 py-4 border-y">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="flex-shrink-0">
                {isZh ? "📢 最近更新" : "📢 Recent Updates"}
              </Badge>
              <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                {trendingTools?.slice(0, 10).map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/${locale}/tools/${tool.slug}`}
                    className="flex items-center gap-2 flex-shrink-0 hover:text-blue-600 transition"
                  >
                    {tool.logo_url && (
                      <div className="w-6 h-6 rounded overflow-hidden">
                        <Image 
                          src={tool.logo_url} 
                          alt={getToolName(tool)} 
                          width={24}
                          height={24}
                          className="object-cover"
                          sizes="24px"
                        />
                      </div>
                    )}
                    <span className="text-sm font-medium whitespace-nowrap">{getToolName(tool)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <NewsletterSignup />
      </div>

      <Footer locale={locale} />
    </>
  );
}