import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Star } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
  searchParams: { category?: string; q?: string; sort?: string };
};

export default async function ToolsListPage({ params, searchParams }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  const category = searchParams?.category;
  const q = (searchParams?.q || "").trim();
  const sort = searchParams?.sort || "popular";

  // 从 tools 表获取所有已发布工具
  const { data: allToolsList } = await supabase
    .from("tools")
    .select("*")
    .eq("status", "published");

  const all = allToolsList || [];

  // 分类筛选 + 站内搜索（q 匹配名称/标语/描述）
  let toolsList = category && category !== "all"
    ? all.filter((tool) => tool.category?.toLowerCase() === category.toLowerCase())
    : all.slice();
  if (q) {
    const ql = q.toLowerCase();
    toolsList = toolsList.filter((tool) =>
      [tool.name_en, tool.name_zh, tool.tagline_en, tool.tagline_zh, tool.description_en, tool.description_zh]
        .some((f) => (f || "").toLowerCase().includes(ql))
    );
  }

  // 排序：默认按热度（出站点击），不再按字母 —— 字母序对发现最差
  const sorters: Record<string, (a: any, b: any) => number> = {
    popular: (a, b) => (b.click_count || 0) - (a.click_count || 0),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    newest: (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")),
    name: (a, b) => String((isZh ? a.name_zh : a.name_en) || a.name_en || "").localeCompare(String((isZh ? b.name_zh : b.name_en) || b.name_en || "")),
  };
  toolsList = toolsList.slice().sort(sorters[sort] || sorters.popular);

  const toolsCount = all.length;

  // 在保留其它参数的前提下构造 URL（用于分类/排序切换）
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = { category, q: q || undefined, sort: sort !== "popular" ? sort : undefined, ...overrides };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all") sp.set(k, v);
    });
    const qs = sp.toString();
    return `/${locale}/tools${qs ? `?${qs}` : ""}`;
  };

  const sortOptions = isZh
    ? [{ id: "popular", name: "最热门" }, { id: "rating", name: "评分" }, { id: "newest", name: "最新" }, { id: "name", name: "名称" }]
    : [{ id: "popular", name: "Popular" }, { id: "rating", name: "Rating" }, { id: "newest", name: "Newest" }, { id: "name", name: "Name" }];

  // 统计每个分类的工具数量
  const categoryCounts: Record<string, number> = {};
  
  allToolsList?.forEach((tool) => {
    const cat = tool.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // 定义分类标签（匹配数据库实际分类）
  const categories = isZh ? [
    { id: "all", name: "全部工具", icon: "📦", count: toolsCount },
    { id: "Writing", name: "文本生成", icon: "📝", count: categoryCounts['Writing'] || 0 },
    { id: "Image Generation", name: "图像生成", icon: "🎨", count: categoryCounts['Image Generation'] || 0 },
    { id: "Video", name: "视频生成", icon: "🎬", count: categoryCounts['Video'] || 0 },
    { id: "Audio", name: "音频生成", icon: "🎵", count: categoryCounts['Audio'] || 0 },
    { id: "Developer Tools", name: "代码助手", icon: "💻", count: categoryCounts['Developer Tools'] || 0 },
    { id: "Chatbot", name: "对话聊天", icon: "💬", count: categoryCounts['Chatbot'] || 0 },
    { id: "Productivity", name: "办公工具", icon: "📊", count: categoryCounts['Productivity'] || 0 },
    { id: "Marketing", name: "营销工具", icon: "📢", count: categoryCounts['Marketing'] || 0 },
  ] : [
    { id: "all", name: "All Tools", icon: "📦", count: toolsCount },
    { id: "Writing", name: "Writing", icon: "📝", count: categoryCounts['Writing'] || 0 },
    { id: "Image Generation", name: "Image Generation", icon: "🎨", count: categoryCounts['Image Generation'] || 0 },
    { id: "Video", name: "Video", icon: "🎬", count: categoryCounts['Video'] || 0 },
    { id: "Audio", name: "Audio", icon: "🎵", count: categoryCounts['Audio'] || 0 },
    { id: "Developer Tools", name: "Developer Tools", icon: "💻", count: categoryCounts['Developer Tools'] || 0 },
    { id: "Chatbot", name: "Chatbot", icon: "💬", count: categoryCounts['Chatbot'] || 0 },
    { id: "Productivity", name: "Productivity", icon: "📊", count: categoryCounts['Productivity'] || 0 },
    { id: "Marketing", name: "Marketing", icon: "📢", count: categoryCounts['Marketing'] || 0 },
  ];

  const t = isZh ? {
    page_title: "人工智能工具",
    all_categories: "全部分类",
    ai_chat: "AI聊天",
    no_tools: "暂无工具",
    try_filters: "请尝试其他筛选条件"
  } : {
    page_title: "AI Tools",
    all_categories: "All Categories",
    ai_chat: "AI Chat",
    no_tools: "No tools found",
    try_filters: "Try different filters"
  };

  // 获取工具的本地化描述
  const getLocalizedDesc = (tool: any) => {
    if (isZh) {
      return tool.tagline_zh || tool.description_zh || tool.tagline_en || tool.description_en || '';
    }
    return tool.tagline_en || tool.description_en || '';
  };

  // 获取工具的本地化名称
  const getLocalizedName = (tool: any) => {
    if (isZh) {
      return tool.name_zh || tool.name_en || '';
    }
    return tool.name_en || tool.name_zh || '';
  };

  // 获取定价标签样式
  const getPricingBadge = (pricingType: string | null) => {
    switch (pricingType) {
      case 'free':
        return { label: isZh ? '免費' : 'Free', className: 'bg-green-50 text-green-700 border-green-200' };
      case 'freemium':
        return { label: isZh ? '免費增值' : 'Freemium', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'paid':
      case 'subscription':
        return { label: isZh ? '付費' : 'Paid', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar locale={locale} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section - 简洁的标题 */}
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 py-10 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                ✨ {t.page_title}
              </h1>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                {toolsCount}
              </Badge>
            </div>

            {/* 站内搜索（GET 表单 → 服务端筛选，保留当前分类）*/}
            <form action={`/${locale}/tools`} method="get" className="relative max-w-xl">
              {category ? <input type="hidden" name="category" value={category} /> : null}
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={isZh ? "搜索 AI 工具…" : "Search AI tools…"}
                className="h-12 w-full rounded-full border-2 border-white bg-white pl-12 pr-4 text-base shadow-sm focus:border-blue-300 focus:outline-none"
              />
            </form>

            {/* 排序 */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">{isZh ? "排序：" : "Sort:"}</span>
              {sortOptions.map((opt) => (
                <Link
                  key={opt.id}
                  href={buildUrl({ sort: opt.id })}
                  className={`rounded-full px-3 py-1 transition ${
                    sort === opt.id ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {opt.name}
                </Link>
              ))}
              {q ? (
                <span className="ml-2 text-slate-500">
                  {isZh ? `“${q}” 的 ${toolsList.length} 个结果` : `${toolsList.length} results for “${q}”`}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* 主内容区 - 左右布局 */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-5">
            {/* 左侧标签栏 */}
            <aside className="w-60 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* 分类列表 */}
                <div className="bg-white rounded-lg border shadow-sm p-3">
                  <h3 className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-2">
                    <span>📋</span>
                    {t.all_categories}
                  </h3>
                  <nav className="space-y-0.5">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={buildUrl({ category: cat.id === 'all' ? undefined : cat.id })}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                          (!category && cat.id === 'all') || category === cat.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span className="text-xs text-slate-600">{cat.count}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Skool 广告位 */}
                <a
                  href={`/api/out?target=skool-community&source=tools_sidebar&locale=${encodeURIComponent(locale)}`}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  className="block bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200 p-4 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                      S
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition">
                        {isZh ? '加入 Skool 社区' : 'Join Skool Community'}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {isZh 
                      ? '连接志同道合的创作者，学习和分享AI工具经验' 
                      : 'Connect with like-minded creators and share AI tool experiences'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-600">
                      {isZh ? '免费加入 →' : 'Join Free →'}
                    </span>
                    <ExternalLink className="w-3 h-3 text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </a>
              </div>
            </aside>

            {/* 右侧工具列表 - 三列网格，横向卡片 */}
            <main className="flex-1">
              {toolsList && toolsList.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {toolsList.map((tool) => {
                    const canVisit = Boolean(tool.affiliate_url || tool.official_url);
                    return (
                    <div
                      key={tool.id}
                      className="group flex flex-col gap-2 p-3 bg-white rounded-lg border hover:border-blue-200 hover:shadow-md transition-all duration-200"
                    >
                      <Link href={`/${locale}/tools/${tool.slug}`} className="flex items-start gap-3">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                          {tool.logo_url ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white">
                              <img
                                src={tool.logo_url}
                                alt={tool.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {tool.name?.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* 内容区 */}
                        <div className="flex-1 min-w-0">
                          {/* 标题和标签 */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-base text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                              {getLocalizedName(tool)}
                            </h3>
                            {(() => {
                              const badge = getPricingBadge(tool.pricing_type);
                              return badge ? (
                                <Badge variant="outline" className={`text-xs flex-shrink-0 px-2 py-0 ${badge.className}`}>
                                  {badge.label}
                                </Badge>
                              ) : null;
                            })()}
                          </div>

                          {/* 描述 */}
                          {getLocalizedDesc(tool) && (
                            <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                              {getLocalizedDesc(tool)}
                            </p>
                          )}

                          {/* 平台标签 */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {Array.isArray(tool.tags_en) && (isZh ? tool.tags_zh : tool.tags_en)?.slice(0, 2).map((tag: string, idx: number) => (
                              <span key={idx} className="text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>

                      {/* 评分 + 访问（出站/联盟）*/}
                      <div className="flex items-center justify-between border-t pt-2">
                        {tool.rating ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            {tool.rating}
                            {tool.review_count ? <span className="text-slate-400">({tool.review_count})</span> : null}
                          </span>
                        ) : (tool.click_count || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                            🔥 {tool.click_count} {isZh ? "次访问" : "visits"}
                          </span>
                        ) : <span />}
                        {canVisit ? (
                          <a
                            href={`/api/out?tool=${encodeURIComponent(tool.slug)}&source=tools_list&locale=${encodeURIComponent(locale)}`}
                            target="_blank"
                            rel="sponsored nofollow noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            {isZh ? "访问" : "Visit"}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                /* 空状态 */
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-slate-600 text-lg mb-2 font-medium">
                    {t.no_tools}
                  </p>
                  <p className="text-slate-700 text-sm">
                    {t.try_filters}
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer locale={locale} />
    </>
  );
}
