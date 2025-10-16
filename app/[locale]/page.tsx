import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search } from "lucide-react";

type PageProps = {
  params: { locale: string };
};

export default async function HomePage({ params }: PageProps) {
  const locale = params?.locale || "en";
  
  // 获取精选工具（前6个）
  const { data: featuredTools } = await supabase
    .from("tools_simple")
    .select("id, slug, name, short_desc, logo_url, pricing")
    .order("slug", { ascending: true })
    .limit(6);

  // 获取最新新闻（前3条）
  const { data: latestNews } = await supabase
    .from("news_simple")
    .select("slug, title, summary, cover_url, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(3);

  const t = locale === "zh" ? {
    hero_title: "发现最好的 AI 工具",
    hero_subtitle: "探索精选的人工智能工具，提升您的工作效率",
    search_placeholder: "搜索 AI 工具...",
    browse_all: "浏览所有工具",
    featured_tools: "精选工具",
    latest_news: "最新资讯",
    view_all_news: "查看全部新闻",
    about_title: "关于我们",
    about_desc: "Jilo.ai 致力于为用户提供最全面、最新的人工智能工具目录。我们精心筛选和评测各类 AI 工具，帮助您找到最适合的解决方案。",
    updated: "更新于",
    visit: "访问官网"
  } : {
    hero_title: "Discover the Best AI Tools",
    hero_subtitle: "Explore curated AI tools to boost your productivity",
    search_placeholder: "Search AI tools...",
    browse_all: "Browse All Tools",
    featured_tools: "Featured Tools",
    latest_news: "Latest News",
    view_all_news: "View All News",
    about_title: "About Us",
    about_desc: "Jilo.ai is dedicated to providing the most comprehensive and up-to-date directory of AI tools. We carefully curate and review various AI solutions to help you find the perfect fit for your needs.",
    updated: "Updated",
    visit: "Visit website"
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.hero_title}
          </h1>
          <p className="text-xl text-gray-600 mb-8">{t.hero_subtitle}</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t.search_placeholder}
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = e.currentTarget.value;
                    window.location.href = `/${locale}/tools?search=${encodeURIComponent(query)}`;
                  }
                }}
              />
            </div>
          </div>

          <Link 
            href={`/${locale}/tools`}
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition"
          >
            {t.browse_all} →
          </Link>
        </div>
      </section>

      {/* Featured Tools Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">{t.featured_tools}</h2>
          <Link href={`/${locale}/tools`} className="text-blue-600 hover:underline">
            {t.browse_all} →
          </Link>
        </div>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools?.map((tool) => (
            <Link 
              key={tool.id} 
              href={`/${locale}/tools/${tool.slug}`}
              className="border rounded-2xl p-6 bg-white hover:shadow-lg transition group"
            >
              <div className="flex items-start gap-4">
                {tool.logo_url ? (
                  <img src={tool.logo_url} alt={tool.name} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center text-gray-400">
                    Logo
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition">
                    {tool.name}
                  </h3>
                  {tool.short_desc && (
                    <p className="text-sm text-gray-600 line-clamp-2">{tool.short_desc}</p>
                  )}
                  {tool.pricing && (
                    <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full border bg-gray-50">
                      {tool.pricing}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest News Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">{t.latest_news}</h2>
            <Link href={`/${locale}/news`} className="text-blue-600 hover:underline">
              {t.view_all_news} →
            </Link>
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {latestNews?.map((news) => (
              <Link
                key={news.slug}
                href={`/${locale}/news/${news.slug}`}
                className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition group"
              >
                {news.cover_url && (
                  <img 
                    src={news.cover_url} 
                    alt={news.title || ""} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition line-clamp-2">
                    {news.title}
                  </h3>
                  {news.summary && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">{news.summary}</p>
                  )}
                  {news.published_at && (
                    <div className="text-xs text-gray-400">
                      {new Date(news.published_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">{t.about_title}</h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          {t.about_desc}
        </p>
      </section>
    </div>
  );
}