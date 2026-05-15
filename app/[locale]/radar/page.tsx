import { Github, Handshake, Radio, SearchCheck, SignalHigh, Users } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
};

export default function RadarPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const sources = ["GitHub Trending", "Product Hunt", "Hacker News", "AppSumo", "Reddit", "X/Twitter", "YouTube", "Bilibili", "Xiaohongshu", "Zhihu", "Jike", "Newsletters"];
  const scoring = isZh
    ? [
        { name: "增长信号", detail: "stars 增速、votes、转发、讨论量、社区热度。" },
        { name: "商业信号", detail: "定价页、affiliate 计划、AppSumo/deal 上架、团队可信度。" },
        { name: "用户价值", detail: "是否解决明确任务，是否明显优于现有工具。" },
        { name: "普通用户可用性", detail: "中文支持、国内访问、支付方式、教程质量。" },
        { name: "风险信号", detail: "隐私、夸大宣传、停更、定价不清、售后差。" },
      ]
    : [
        { name: "Growth signal", detail: "Star velocity, votes, reposts, discussion volume, and community heat." },
        { name: "Business signal", detail: "Pricing page, affiliate program, AppSumo listing, and team credibility." },
        { name: "User value", detail: "Clear job-to-be-done and meaningful improvement over existing tools." },
        { name: "Ordinary-user readiness", detail: "Chinese support, local access, payment options, and tutorial quality." },
        { name: "Risk signal", detail: "Privacy, hype, abandonment, unclear pricing, and poor support." },
      ];

  const creators = isZh
    ? [
        "AI 工具评测博主",
        "工作流教程创作者",
        "独立开发者和产品猎人",
        "AppSumo / deal 评测者",
        "中文 AI 入门上手创作者",
      ]
    : [
        "AI tool reviewers",
        "Workflow tutorial creators",
        "Independent developers and product hunters",
        "AppSumo and deal reviewers",
        "Chinese AI onboarding creators",
      ];

  const channelFields = isZh
    ? ["平台", "受众", "内容类型", "互动质量", "是否接赞助", "是否适合合作", "历史推荐质量"]
    : ["Platform", "Audience", "Content type", "Engagement quality", "Accepts sponsorship", "Partnership fit", "Historical recommendation quality"];

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
                  ? "Radar 不是把所有新项目都收进来，而是按增长、商业、用户价值、可用性和风险进行筛选。目标是减少噪音，找到值得试、值得买、值得合作的机会。"
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
            <h2 className="mb-4 text-2xl font-bold text-slate-950">{isZh ? "评分维度" : "Scoring Model"}</h2>
            <div className="space-y-3">
              {scoring.map((item) => (
                <div key={item.name} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-950">
                    <SignalHigh className="h-4 w-4 text-emerald-700" />
                    {item.name}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-emerald-700" />
                <h2 className="text-2xl font-bold text-slate-950">{isZh ? "渠道情报库" : "Channel Intelligence Database"}</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {isZh
                  ? "战略文档里的合作流量需要落成数据库：不是只看粉丝量，而是记录平台、受众、互动质量、赞助意愿和历史推荐质量。"
                  : "Partnership traffic needs a real database: platform, audience, engagement quality, sponsorship fit, and historical recommendation quality."}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {channelFields.map((field) => (
                  <div key={field} className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700">
                    {field}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Handshake className="h-5 w-5 text-emerald-700" />
                <h2 className="text-2xl font-bold text-slate-950">{isZh ? "优先合作对象" : "High-Value Creator Types"}</h2>
              </div>
              <div className="grid gap-3">
                {creators.map((creator) => (
                  <div key={creator} className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700">
                    {creator}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
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
