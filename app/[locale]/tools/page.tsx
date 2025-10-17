import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
  searchParams: { category?: string };
};

export default async function ToolsListPage({ params, searchParams }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  const category = searchParams?.category;

  // 从 tools 表获取所有工具（包含中英文数据）
  const { data: allToolsList, error: allError } = await supabase
    .from("tools")
    .select("*")
    .eq("status", "published")
    .order(isZh ? "name_zh" : "name_en", { ascending: true });

  // 根据分类筛选（不区分大小写）
  const toolsList = category && category !== 'all'
    ? allToolsList?.filter(tool => tool.category?.toLowerCase() === category.toLowerCase())
    : allToolsList;

  const error = allError;

  console.log("Filtered tools count:", toolsList?.length);
  console.log("Selected category:", category);

  const toolsCount = allToolsList?.length || 0;

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

  return (
    <>
      <Navbar locale={locale} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section - 简洁的标题 */}
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 py-10 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                ✨ {t.page_title}
              </h1>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                {toolsCount}
              </Badge>
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
                        href={`/${locale}/tools${cat.id !== 'all' ? `?category=${cat.id}` : ''}`}
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
                        <span className="text-xs text-slate-400">{cat.count}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Skool 广告位 */}
                <a
                  href="https://www.skool.com/signup?ref=37b1672271fd4149b32cb4947874e1ba"
                  target="_blank"
                  rel="noopener noreferrer"
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
                  {toolsList.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/${locale}/tools/${tool.slug}`}
                      className="group flex items-start gap-3 p-3 bg-white rounded-lg border hover:border-blue-200 hover:shadow-md transition-all duration-200"
                    >
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
                          <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50 text-blue-700 border-blue-200 px-2 py-0">
                            {t.ai_chat}
                          </Badge>
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
                            <span key={idx} className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {Array.isArray(tool.tags_en) && (isZh ? tool.tags_zh : tool.tags_en)?.length > 2 && (
                            <span className="text-xs text-slate-400">
                              +{(isZh ? tool.tags_zh : tool.tags_en).length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* 空状态 */
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-slate-600 text-lg mb-2 font-medium">
                    {t.no_tools}
                  </p>
                  <p className="text-slate-500 text-sm">
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