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

const taskEntrances = [
  {
    icon: Compass,
    href: "workflows",
    en: {
      title: "I am new to AI",
      desc: "Start with simple workflows and a small set of reliable tools.",
    },
    zh: {
      title: "我是 AI 新手",
      desc: "从简单工作流开始，只先选少量可靠工具。",
    },
  },
  {
    icon: Globe2,
    href: "access",
    en: {
      title: "I want to use ChatGPT, Claude, Cursor, or Midjourney",
      desc: "Check access, subscription, payment, safety, and lower-risk alternatives.",
    },
    zh: {
      title: "我想用 ChatGPT、Claude、Cursor、Midjourney",
      desc: "先看访问、订阅、支付、安全风险和替代方案。",
    },
  },
  {
    icon: Search,
    href: "tools",
    en: {
      title: "I need a tool for writing, video, coding, or work",
      desc: "Browse tools by task, pricing, category, and practical use case.",
    },
    zh: {
      title: "我想找写作、视频、编程或办公工具",
      desc: "按任务、价格、分类和真实使用场景筛选。",
    },
  },
  {
    icon: BadgeDollarSign,
    href: "deals",
    en: {
      title: "I want to know what is worth paying for",
      desc: "See buying guidance, deal checks, and tools closest to purchase intent.",
    },
    zh: {
      title: "我想知道哪个 AI 工具值得付费",
      desc: "查看购买建议、优惠判断和高意图工具清单。",
    },
  },
  {
    icon: ShieldCheck,
    href: "reviews",
    en: {
      title: "I want comparisons and safer choices",
      desc: "Use reviews, alternatives, and risk notes before committing to a tool.",
    },
    zh: {
      title: "我想看对比和避坑",
      desc: "先看评测、替代品和风险提示，再决定是否使用。",
    },
  },
  {
    icon: ArrowRight,
    href: "submit",
    en: {
      title: "I want to submit or promote an AI product",
      desc: "Send us your product for review, listing, or future paid placement.",
    },
    zh: {
      title: "我想提交或推广 AI 产品",
      desc: "提交产品，进入收录、评测或后续付费展示流程。",
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
        eyebrow: "从这里开始",
        title: "告诉我们你想用 AI 做什么，我们帮你选工具和上手路径",
        subtitle:
          "不用先理解复杂概念。你只需要选择任务、预算和使用条件，Jilo.ai 会把工具、访问方式、替代方案和是否值得付费整理成可执行路径。",
        search: "搜索 AI 工具、访问方案或工作流...",
        browse: "按任务找工具",
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
        eyebrow: "Start here",
        title: "Tell us what you want to do with AI. We will point you to the right tools.",
        subtitle:
          "Choose a task, budget, and setup. Jilo.ai turns tool discovery, access notes, alternatives, and paid-tool decisions into a practical path.",
        search: "Search AI tools, access guides, or workflows...",
        browse: "Find tools by task",
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
  const revenuePlan = isZh
    ? [
        { label: "英文线", value: "$3,500/月", desc: "SaaS affiliate、赞助评测、付费提交。" },
        { label: "中文线", value: "$1,500/月", desc: "AI Access、教程资料、订阅解决方案和赞助位。" },
        { label: "目标", value: "$5,000/月", desc: "用高意图流量和转化链路，而不是泛目录浏览。" },
      ]
    : [
        { label: "English line", value: "$3,500/mo", desc: "SaaS affiliate, sponsored reviews, and paid submissions." },
        { label: "Chinese line", value: "$1,500/mo", desc: "AI Access, tutorials, subscription solutions, and sponsorship." },
        { label: "Target", value: "$5,000/mo", desc: "Driven by high-intent traffic, not generic directory browsing." },
      ];
  const trafficPlan = isZh
    ? ["SEO：best、alternatives、vs、国内可用等搜索", "GEO：让 ChatGPT、Perplexity、AI Overviews 更容易引用", "平台分发：X、Reddit、Product Hunt、AppSumo、小红书、B站、知乎", "合作流量：评测博主、工作流创作者、产品猎人和 deal 创作者"]
    : ["SEO: best, alternatives, vs, deals, and access searches", "GEO: make Jilo.ai easier for ChatGPT, Perplexity, and AI Overviews to cite", "Platform distribution: X, Reddit, Product Hunt, AppSumo, Xiaohongshu, Bilibili, Zhihu", "Partnership traffic: reviewers, workflow creators, product hunters, and deal creators"];

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

            <div className="grid content-start gap-3 sm:grid-cols-2">
              {taskEntrances.map((task) => {
                const Icon = task.icon;
                const copy = isZh ? task.zh : task.en;
                return (
                  <Link
                    key={task.href}
                    href={`/${locale}/${task.href}`}
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

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              {isZh ? "收入模型" : "Revenue Model"}
            </div>
            <h2 className="text-2xl font-bold text-slate-950">
              {isZh ? "围绕每月 5,000 美金利润倒推产品结构" : "Product structure mapped to a $5,000/month profit target"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isZh
                ? "Jilo.ai 2.0 的商业核心不是靠展示广告，而是把高意图用户导向 affiliate、赞助评测、付费提交和订阅解决方案。"
                : "Jilo.ai 2.0 is not built around display ads. It routes high-intent users toward affiliate, sponsored reviews, paid submissions, and access solutions."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {revenuePlan.map((item) => (
              <div key={item.label} className="rounded-lg border bg-white p-5">
                <div className="text-sm font-semibold text-slate-500">{item.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-950">{item.value}</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isZh ? "流量来源" : "Traffic Sources"}
              </div>
              <h2 className="text-2xl font-bold text-slate-950">
                {isZh ? "先找到流量来源，再扩产品" : "Find traffic sources before expanding product surface"}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {trafficPlan.map((item) => (
                <div key={item} className="rounded-lg border bg-white p-4 text-sm font-medium leading-6 text-slate-700">
                  {item}
                </div>
              ))}
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
