import { Github, Radio, SearchCheck, SignalHigh } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
};

export default function RadarPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const sources = ["GitHub Trending", "Product Hunt", "Hacker News", "AppSumo", "Reddit", "X/Twitter", "YouTube", "Bilibili", "Xiaohongshu", "Zhihu"];
  const scoring = isZh
    ? ["增长信号", "商业信号", "用户价值", "普通用户可用性", "风险信号"]
    : ["Growth signal", "Business signal", "User value", "Ordinary-user readiness", "Risk signal"];

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700">
                <Radio className="h-4 w-4 text-emerald-600" />
                AI Radar
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {isZh ? "跨平台扫描新 AI 项目，只留下有信号的机会" : "Cross-platform AI project scanning, filtered by real signals"}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {isZh
                  ? "Radar 不是把所有新项目都收进来，而是按增长、商业、用户价值、可用性和风险进行筛选。"
                  : "Radar should not collect everything. It filters new products by growth, business, user value, readiness, and risk."}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-950">{isZh ? "扫描来源" : "Sources"}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {sources.map((source) => (
                <div key={source} className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium text-slate-700">
                  <Github className="h-4 w-4 text-slate-500" />
                  {source}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-950">{isZh ? "评分维度" : "Scoring"}</h2>
            <div className="space-y-3">
              {scoring.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4 text-sm font-medium text-slate-700">
                  <SignalHigh className="h-4 w-4 text-emerald-700" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="rounded-lg border bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <SearchCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
              <p className="text-sm leading-6 text-emerald-950">
                {isZh
                  ? "输出标签只保留四类：值得试、值得买、先观望、不推荐。这样才能避免把 Jilo.ai 变成新的噪音池。"
                  : "Output labels stay simple: worth trying, worth buying, watch first, and not recommended."}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
