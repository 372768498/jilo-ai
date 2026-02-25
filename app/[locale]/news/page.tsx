import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";

// ISR: 每10分钟重新验证一次，确保新闻更新更及时
export const revalidate = 600;

type PageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params?.locale === 'zh';
  const locale = params?.locale || 'en';
  const altLocale = isZh ? 'en' : 'zh';

  return {
    title: isZh ? 'AI行业资讯 - 最新AI新闻动态' : 'AI News - Latest AI Industry Updates',
    description: isZh
      ? '追踪AI行业最新动态，了解人工智能领域的突破性进展、产品发布和行业趋势。'
      : 'Stay updated with the latest AI industry news, breakthrough developments, product launches and trends.',
    openGraph: {
      title: isZh ? 'AI行业资讯 | Jilo.ai' : 'AI News | Jilo.ai',
      description: isZh ? '追踪AI行业最新动态' : 'Latest AI industry updates',
      url: `https://jilo.ai/${locale}/news`,
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/news`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/news`,
        [altLocale]: `https://jilo.ai/${altLocale}/news`,
      },
    },
  };
}

export default async function NewsListPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  // 获取所有新闻（包含中英文字段）
  const { data: rawNews } = await supabase
    .from("news")
    .select("id, slug, title_en, title_zh, summary_en, summary_zh, source, published_at")
    .order("published_at", { ascending: false, nullsFirst: false });

  // 映射字段名兼容原模板
  const newsList = rawNews?.map(n => ({
    id: n.id,
    slug: n.slug,
    title: n.title_en,
    title_zh: n.title_zh,
    summary: n.summary_en,
    summary_zh: n.summary_zh,
    source: n.source,
    published_at: n.published_at,
  }));

  // 去重
  const uniqueNews = newsList?.filter((news, index, self) =>
    index === self.findIndex((n) => n.id === news.id)
  );

  const t = isZh ? {
    page_title: "人工智能新闻",
    total_news: `${uniqueNews?.length || 0} 条`,
    read_more: "查看详情"
  } : {
    page_title: "AI News",
    total_news: `${uniqueNews?.length || 0} articles`,
    read_more: "Read More"
  };

  // 辅助函数：根据语言获取标题
  const getTitle = (news: any) => {
    if (isZh) {
      return news.title_zh || news.title;
    }
    return news.title;
  };

  // 辅助函数：根据语言获取摘要
  const getSummary = (news: any) => {
    if (isZh) {
      return news.summary_zh || news.summary;
    }
    return news.summary;
  };

  // 辅助函数：生成新闻图标和渐变色
  const getNewsStyle = (index: number) => {
    const styles = [
      { icon: "🔥", gradient: "from-red-500 to-orange-500" },
      { icon: "⚡", gradient: "from-orange-500 to-yellow-500" },
      { icon: "✨", gradient: "from-yellow-500 to-amber-500" },
      { icon: "💡", gradient: "from-blue-400 to-purple-500" },
      { icon: "🚀", gradient: "from-purple-400 to-pink-500" },
      { icon: "🎯", gradient: "from-green-400 to-teal-500" },
      { icon: "💻", gradient: "from-indigo-400 to-blue-500" },
      { icon: "🤖", gradient: "from-pink-400 to-red-500" },
      { icon: "📱", gradient: "from-teal-400 to-cyan-500" },
      { icon: "🎨", gradient: "from-cyan-400 to-blue-500" },
    ];
    return styles[index % styles.length];
  };

  return (
    <>
      <Navbar locale={locale} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              {t.page_title}
            </h1>
            <Badge variant="outline" className="text-base px-4 py-1">
              {t.total_news}
            </Badge>
          </div>

          {/* 新闻网格 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {uniqueNews?.map((news, index) => {
              const newsTitle = getTitle(news);
              const newsSummary = getSummary(news);
              const style = getNewsStyle(index);

              return (
                <Card key={news.id} className="group hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-blue-300 overflow-hidden">
                  <Link href={`/${locale}/news/${news.slug}`}>
                    {/* 渐变背景头部 */}
                    <div className={`relative h-32 bg-gradient-to-br ${style.gradient} flex items-center justify-center overflow-hidden`}>
                      <div className="absolute inset-0 bg-grid-white/10" />
                      <div className="relative text-5xl opacity-90 group-hover:scale-110 transition-transform duration-500">
                        {style.icon}
                      </div>
                      {news.source && (
                        <Badge className="absolute top-3 left-3 bg-white/95 text-slate-900 text-xs shadow-lg">
                          {news.source}
                        </Badge>
                      )}
                    </div>

                    {/* 内容区域 */}
                    <CardContent className="p-5">
                      {/* 标题 */}
                      <h3 className="font-bold text-lg line-clamp-3 group-hover:text-blue-600 transition mb-3 min-h-[4.5rem]">
                        {newsTitle}
                      </h3>

                      {/* 摘要 */}
                      {newsSummary && (
                        <p className="text-sm text-slate-600 line-clamp-3 mb-4 min-h-[3.75rem]">
                          {newsSummary}
                        </p>
                      )}

                      {/* 底部信息 */}
                      <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-3">
                        {news.published_at && (
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            {new Date(news.published_at).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                        
                        <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                          {t.read_more}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>

          {/* 如果没有新闻 */}
          {(!uniqueNews || uniqueNews.length === 0) && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📰</div>
              <p className="text-slate-600 text-lg">
                {isZh ? "暂无新闻" : "No news available"}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer locale={locale} />
    </>
  );
}