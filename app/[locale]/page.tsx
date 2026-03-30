import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/search-bar";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CategoryScrollBar from "@/components/category-scroll-bar";
import TrendingTools from "@/components/trending-tools";
import QuickDiscovery from "@/components/quick-discovery";
import AdSlot from "@/components/ad-slot";

type PageProps = {
  params: { locale: string };
};

export default async function HomePage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  
  // 从 tools 表获取数据（包含中英文）
  const { data: trendingTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, pricing_type")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(16);

  // Quick Discovery 数据
  const { data: newestTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: popularTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .order("click_count", { ascending: false })
    .range(0, 2);

  const { data: featuredToolsQuick } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .eq("is_featured", true)
    .limit(3);

  const { data: freeTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .eq("pricing_type", "free")
    .limit(3);

  const { data: trendingToolsQuick } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .range(9, 11);

  const { data: updatedTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .range(0, 2);

  const { data: communityTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .range(15, 17);

  const { data: specialTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, logo_url")
    .eq("status", "published")
    .range(18, 20);

  // 获取精选工具（24个）
  const { data: featuredTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, pricing_type")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(24);

  // 获取最新新闻（20条）
  const { data: latestNews } = await supabase
    .from("news_simple")
    .select("id, slug, title, title_zh, summary, summary_zh, source, source_url, cover_url, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);

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

  return (
    <>
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
                  <div className="text-3xl font-bold text-slate-900">70+</div>
                  <div className="text-sm text-slate-600">{t.tools}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">10K+</div>
                  <div className="text-sm text-slate-600">{t.users}</div>
                </div>
                <div>
                  <TrendingUp className="inline w-8 h-8 text-green-500 mx-auto" />
                  <div className="text-sm text-slate-600">{t.daily}</div>
                </div>
              </div>
              
              <SearchBar locale={locale} placeholder={t.search_placeholder} />
              
              <div className="flex gap-4 justify-center mt-6">
                <Button asChild size="lg" className="rounded-full shadow-lg h-12 px-8">
                  <Link href={`/${locale}/tools`}>
                    {t.browse_all}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8">
                  <Link href={`/${locale}/news`}>
                    {t.latest_news}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Category Scroll Bar */}
        <CategoryScrollBar locale={locale} />

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
                      <img src={tool.logo_url} alt={getToolName(tool)} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
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
                              <div className="text-xs font-semibold text-slate-500">No.</div>
                              <div className="text-lg font-bold leading-none">{index + 1}</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-blue-600 transition mb-2">
                            {getTitle(news)}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-600">
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

                        <div className="flex-shrink-0 text-slate-500 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
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

        {/* Why Choose Us */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center mb-8">{t.why_choose}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.reasons.map((reason, index) => (
              <Card key={index} className="text-center p-4 hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                <div className="text-3xl mb-3">{reason.icon}</div>
                <h3 className="font-bold text-sm mb-1">{reason.title}</h3>
                <p className="text-xs text-slate-600">{reason.desc}</p>
              </Card>
            ))}
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
                      <img src={tool.logo_url} alt={getToolName(tool)} className="w-6 h-6 rounded object-cover" />
                    )}
                    <span className="text-sm font-medium whitespace-nowrap">{getToolName(tool)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer locale={locale} />
    </>
  );
}