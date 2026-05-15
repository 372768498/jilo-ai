import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Compass, Globe2, Radar, Search, ShieldCheck, Workflow } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";

type PageProps = {
  params: { locale: string };
};

const pillars = [
  {
    icon: Globe2,
    href: "access",
    en: {
      title: "AI Access",
      desc: "Access, subscription, payment, and safety guidance for global AI tools.",
    },
    zh: {
      title: "AI Access",
      desc: "解决访问、订阅、支付和账号安全，让普通用户真正用上全球 AI 工具。",
    },
  },
  {
    icon: Workflow,
    href: "workflows",
    en: {
      title: "AI Workflows",
      desc: "Role-based workflows for students, creators, developers, marketers, and small teams.",
    },
    zh: {
      title: "AI 工作流",
      desc: "按学生、创作者、开发者、营销人和小团队整理可执行的 AI 工作流。",
    },
  },
  {
    icon: Radar,
    href: "radar",
    en: {
      title: "AI Radar",
      desc: "A signal layer for new projects from GitHub, Product Hunt, AppSumo, X, Reddit, and more.",
    },
    zh: {
      title: "AI Radar",
      desc: "扫描 GitHub、Product Hunt、AppSumo、X、Reddit 等平台的新项目信号。",
    },
  },
  {
    icon: BadgeDollarSign,
    href: "deals",
    en: {
      title: "AI Deals",
      desc: "Deal reviews focused on whether an AI product is worth buying, not just discounted.",
    },
    zh: {
      title: "AI Deals",
      desc: "评测 AI 优惠和买断产品是否值得买，而不是只搬运折扣。",
    },
  },
];

const audiences = {
  en: [
    "Students choosing reliable study tools",
    "Creators building content workflows",
    "Developers comparing coding assistants",
    "Small teams buying AI subscriptions",
  ],
  zh: [
    "零基础用户开始使用 ChatGPT、Claude、Cursor",
    "创作者搭建内容生产工作流",
    "开发者比较 AI 编程工具",
    "小团队选择值得付费的 AI 订阅",
  ],
};

const reviewPaths = {
  en: [
    "Best AI tools by job-to-be-done",
    "Tool alternatives and comparisons",
    "Domestic availability and access notes",
    "Pros, cons, pricing, and who should skip it",
  ],
  zh: [
    "按真实任务推荐工具，而不是泛泛列清单",
    "替代品和工具对比承接高意图搜索",
    "标注国内可用性、订阅方式和访问门槛",
    "写清楚优点、缺点、价格和不适合谁",
  ],
};

export default async function HomePage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const { data: featuredTools } = await supabase
    .from("tools")
    .select("id, slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, pricing_type, category")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(8);

  const { data: latestNews } = await supabase
    .from("news_simple")
    .select("id, slug, title, title_zh, summary, summary_zh, source, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(4);

  const t = isZh
    ? {
        eyebrow: "AI 工具情报与上手平台",
        title: "从发现 AI 工具，到真正用 AI 改善工作和生活",
        subtitle:
          "Jilo.ai 2.0 不再只是工具目录。我们扫描新项目、筛选可用工具、评测访问与订阅方案，并把它们整理成普通用户能执行的 AI 工作流。",
        search: "搜索 AI 工具、访问方案或工作流...",
        browse: "浏览工具库",
        submit: "提交工具",
        signalTitle: "我们关注高意图流量",
        signalDesc: "SEO、GEO、平台分发和合作流量一起推进，优先服务正在选择、购买和使用 AI 工具的人。",
        toolsTitle: "最新收录工具",
        newsTitle: "AI 情报",
        reviewsTitle: "评测方法",
        audienceTitle: "优先服务的人群",
        viewAll: "查看全部",
      }
    : {
        eyebrow: "AI tool intelligence and onboarding",
        title: "From discovering AI tools to using the right workflow",
        subtitle:
          "Jilo.ai 2.0 is not just a directory. We scan new projects, filter useful tools, review access and subscription options, and turn them into practical AI workflows.",
        search: "Search AI tools, access guides, or workflows...",
        browse: "Browse Tools",
        submit: "Submit Tool",
        signalTitle: "Built for high-intent traffic",
        signalDesc: "SEO, GEO, platform distribution, and partner traffic are designed around people choosing, buying, and using AI tools.",
        toolsTitle: "Latest Tools",
        newsTitle: "AI Intelligence",
        reviewsTitle: "Review Method",
        audienceTitle: "Who We Serve First",
        viewAll: "View all",
      };

  const getName = (tool: any) => (isZh ? tool.name_zh || tool.name_en : tool.name_en || tool.name_zh);
  const getDesc = (tool: any) => (isZh ? tool.tagline_zh || tool.tagline_en : tool.tagline_en || tool.tagline_zh);

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white text-slate-950">
        <section className="border-b bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700">
                <Compass className="h-4 w-4 text-emerald-600" />
                {t.eyebrow}
              </div>
              <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-normal text-slate-950 md:text-6xl">
                {t.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t.subtitle}</p>

              <div className="mt-8 max-w-2xl">
                <SearchBar locale={locale} placeholder={t.search} />
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/tools`}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {t.browse}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href={`/${locale}/submit`}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  {t.submit}
                </Link>
              </div>
            </div>

            <div className="grid content-start gap-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                const copy = isZh ? pillar.zh : pillar.en;
                return (
                  <Link
                    key={pillar.href}
                    href={`/${locale}/${pillar.href}`}
                    className="group rounded-lg border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-950 group-hover:text-emerald-700">{copy.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{copy.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3">
          <div className="rounded-lg border p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Search className="h-4 w-4" />
              SEO
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {isZh ? "承接 best、alternatives、vs、国内可用等高意图搜索。" : "Capture best, alternatives, vs, deals, and access-intent searches."}
            </p>
          </div>
          <div className="rounded-lg border p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              GEO
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {isZh ? "用清晰结论、表格、FAQ 和来源，让 AI 答案系统更容易引用。" : "Use conclusions, tables, FAQs, and sources so answer engines can cite Jilo.ai."}
            </p>
          </div>
          <div className="rounded-lg border p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <BadgeDollarSign className="h-4 w-4" />
              Revenue
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {isZh ? "英文线做 affiliate 和赞助评测，中文线做 Access、教程和订阅解决方案。" : "English drives affiliate and sponsorship; Chinese drives access, guides, and subscription solutions."}
            </p>
          </div>
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{t.audienceTitle}</div>
              <div className="grid gap-3">
                {(isZh ? audiences.zh : audiences.en).map((item) => (
                  <div key={item} className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{t.reviewsTitle}</div>
              <div className="grid gap-3">
                {(isZh ? reviewPaths.zh : reviewPaths.en).map((item) => (
                  <div key={item} className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{t.toolsTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.signalDesc}</p>
            </div>
            <Link href={`/${locale}/tools`} className="hidden text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:inline-flex">
              {t.viewAll}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(featuredTools || []).map((tool) => (
              <Link key={tool.id} href={`/${locale}/tools/${tool.slug}`} className="rounded-lg border bg-white p-4 transition hover:border-emerald-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={getName(tool)} className="h-10 w-10 rounded-md border object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 font-semibold text-slate-600">
                      {getName(tool)?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-sm font-semibold text-slate-950">{getName(tool)}</h3>
                    <div className="mt-1 text-xs text-slate-500">{tool.category || tool.pricing_type}</div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{getDesc(tool)}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t.newsTitle}</h2>
            <Link href={`/${locale}/news`} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              {t.viewAll}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(latestNews || []).map((news) => (
              <Link key={news.id} href={`/${locale}/news/${news.slug}`} className="rounded-lg border p-4 transition hover:border-emerald-300 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>{news.source || "Jilo.ai"}</span>
                  {news.published_at ? <span>{new Date(news.published_at).toISOString().slice(0, 10)}</span> : null}
                </div>
                <h3 className="line-clamp-2 font-semibold text-slate-950">{isZh ? news.title_zh || news.title : news.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {isZh ? news.summary_zh || news.summary : news.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
