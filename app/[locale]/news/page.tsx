import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
};

export const dynamic = "force-dynamic";

export default async function NewsListPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const { data: newsList } = await supabase
    .from("news_simple")
    .select("id, slug, title, title_zh, summary, summary_zh, source, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(60);

  const uniqueNews = newsList?.filter((news, index, self) => index === self.findIndex((item) => item.id === news.id)) || [];

  const copy = isZh
    ? {
        title: "AI 情报",
        subtitle: "跟踪 AI 产品、平台、开源项目和市场变化。后续会逐步升级为 AI Radar 的每日/每周信号层。",
        count: `${uniqueNews.length} 条`,
        readMore: "查看详情",
        empty: "暂无新闻",
      }
    : {
        title: "AI Intelligence",
        subtitle: "Track AI products, platforms, open-source projects, and market shifts. This will evolve into the AI Radar signal layer.",
        count: `${uniqueNews.length} items`,
        readMore: "Read more",
        empty: "No news available",
      };

  const getTitle = (news: any) => (isZh ? news.title_zh || news.title : news.title || news.title_zh);
  const getSummary = (news: any) => (isZh ? news.summary_zh || news.summary : news.summary || news.summary_zh);

  return (
    <>
      <Navbar locale={locale} />
      <main className="min-h-screen bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700">
                <Newspaper className="h-4 w-4 text-emerald-600" />
                {copy.count}
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">{copy.title}</h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          {uniqueNews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uniqueNews.map((news) => (
                <Link key={news.id} href={`/${locale}/news/${news.slug}`} className="group rounded-lg border bg-white p-5 transition hover:border-emerald-300 hover:shadow-md">
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <span>{news.source || "Jilo.ai"}</span>
                    {news.published_at ? <span>{new Date(news.published_at).toISOString().slice(0, 10)}</span> : null}
                  </div>
                  <h2 className="line-clamp-3 min-h-[4.5rem] text-lg font-semibold leading-6 text-slate-950 group-hover:text-emerald-700">
                    {getTitle(news)}
                  </h2>
                  {getSummary(news) ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{getSummary(news)}</p> : null}
                  <div className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700">
                    {copy.readMore}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-slate-50 p-10 text-center text-slate-600">{copy.empty}</div>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
