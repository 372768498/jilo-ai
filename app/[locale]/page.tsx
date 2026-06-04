import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Compass, Globe2, Radar, Search, ShieldCheck, Workflow } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import ArticleToolStrip from "@/components/ArticleToolStrip";

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
    href: "categories",
    en: {
      title: "I need a tool for writing, video, coding, or work",
      desc: "Browse by category to compare the best tools for each task.",
    },
    zh: {
      title: "我想找写作、视频、编程或办公工具",
      desc: "按分类浏览，直接对比每类最好的工具。",
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
        eyebrow: "AI 工具目录 · 每日更新",
        title: "找到、对比、用上最好的 AI 工具",
        subtitle:
          "搜索 100+ 经过整理的 AI 工具，按热度和评分对比，直接拿到访问方式、替代方案和是否值得付费的结论。",
        search: "搜索 AI 工具、访问方案或工作流...",
        browse: "按任务找工具",
        submit: "提交工具",
        signalTitle: "从真实任务开始",
        signalDesc: "先解决访问、选择、付费和上手问题，再推荐具体工具。",
        toolsTitle: "最新收录工具",
        newsTitle: "AI 情报",
        reviewsTitle: "评测方法",
        audienceTitle: "优先服务的人群",
        viewAll: "查看全部",
      }
    : {
        eyebrow: "AI tools directory · updated daily",
        title: "Find, compare, and use the best AI tools",
        subtitle:
          "Search 100+ curated AI tools, compare them by popularity and rating, and get the access, alternatives, and is-it-worth-paying answers — fast.",
        search: "Search AI tools, access guides, or workflows...",
        browse: "Find tools by task",
        submit: "Submit Tool",
        signalTitle: "Start from a real task",
        signalDesc: "We help with access, choice, payment, and practical first workflows before recommending tools.",
        toolsTitle: "Latest Tools",
        newsTitle: "AI Intelligence",
        reviewsTitle: "Review Method",
        audienceTitle: "Who We Serve First",
        viewAll: "View all",
      };

  const getName = (tool: any) => (isZh ? tool.name_zh || tool.name_en : tool.name_en || tool.name_zh);
  const getDesc = (tool: any) => (isZh ? tool.tagline_zh || tool.tagline_en : tool.tagline_en || tool.tagline_zh);
  const answerPages = isZh
    ? [
        {
          title: "在中国大陆能不能用 Claude？",
          desc: "先看官方可用性、账号风险、替代方案和新手选择。",
          href: `/${locale}/answers/can-i-use-claude-in-china`,
        },
        {
          title: "ChatGPT、Claude、Gemini 新手先用哪个？",
          desc: "用任务、预算和使用环境来选，不要一上来买三个订阅。",
          href: `/${locale}/answers/chatgpt-vs-claude-vs-gemini-for-beginners`,
        },
        {
          title: "哪些 AI 工具值得付费？",
          desc: "看真实用途、免费额度、替代品和是否能每周省时间。",
          href: `/${locale}/deals`,
        },
      ]
    : [
        {
          title: "Can I use Claude in China?",
          desc: "Check official availability, account risk, alternatives, and practical next steps.",
          href: `/${locale}/answers/can-i-use-claude-in-china`,
        },
        {
          title: "ChatGPT vs Claude vs Gemini for beginners",
          desc: "Choose by task, budget, access, and the workflows you repeat every week.",
          href: `/${locale}/answers/chatgpt-vs-claude-vs-gemini-for-beginners`,
        },
        {
          title: "Which AI tools are worth paying for?",
          desc: "Use real use cases, free limits, alternatives, and time saved to decide.",
          href: `/${locale}/deals`,
        },
      ];
  const beginnerSteps = isZh
    ? [
        "先选一个任务：写作、学习、办公、编程、图片、视频或搜索资料。",
        "确认你能不能稳定访问和付款，避免依赖来路不明的账号。",
        "先用免费版完成 3 次真实任务，再决定是否付费。",
        "保留一个备用 AI 助手，用来交叉验证重要答案。",
      ]
    : [
        "Pick one task first: writing, study, office work, coding, images, video, or research.",
        "Check access and payment before relying on any tool for work.",
        "Finish three real tasks on the free tier before paying.",
        "Keep one backup assistant to compare important answers.",
      ];

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white text-slate-950">
        <section className="border-b bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center lg:py-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm font-medium text-slate-700">
              <Compass className="h-4 w-4 text-emerald-600" />
              {t.eyebrow}
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
              {t.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t.subtitle}</p>

            <div className="mx-auto mt-8 max-w-2xl">
              <SearchBar locale={locale} placeholder={t.search} />
            </div>

            {/* Popular quick-searches → strong hub / ranking pages */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-slate-400">{isZh ? "热门：" : "Popular:"}</span>
              {(isZh
                ? [
                    { name: "最热门", href: `/${locale}/rankings/most-popular` },
                    { name: "AI 写作", href: `/${locale}/c/writing` },
                    { name: "AI 视频", href: `/${locale}/c/video` },
                    { name: "AI 图像", href: `/${locale}/c/image` },
                    { name: "免费工具", href: `/${locale}/rankings/best-free` },
                  ]
                : [
                    { name: "Most popular", href: `/${locale}/rankings/most-popular` },
                    { name: "AI writing", href: `/${locale}/c/writing` },
                    { name: "AI video", href: `/${locale}/c/video` },
                    { name: "AI image", href: `/${locale}/c/image` },
                    { name: "Free tools", href: `/${locale}/rankings/best-free` },
                  ]
              ).map((chip) => (
                <Link
                  key={chip.name}
                  href={chip.href}
                  className="rounded-full border bg-white px-3 py-1 font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                >
                  {chip.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Real, popular tools right under the hero — gives the homepage actual
            scannable tools + an outbound Visit CTA (audit: hero showed no real
            tools above the fold and the homepage carried zero outbound CTAs). */}
        <section className="mx-auto max-w-7xl px-4 pt-10">
          <ArticleToolStrip locale={locale} title={isZh ? "🔥 热门 AI 工具" : "🔥 Popular AI tools"} limit={6} />
          <div className="mt-3">
            <Link href={`/${locale}/rankings`} className="text-sm font-semibold text-emerald-700 hover:underline">
              {isZh ? "查看完整排行榜 →" : "See the full rankings →"}
            </Link>
          </div>
        </section>

        {/* Browse by task — demoted from the hero so real tools lead, but kept
            for the concierge/task-intent path. */}
        <section className="mx-auto max-w-7xl px-4 pt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isZh ? "按任务浏览" : "Browse by task"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {taskEntrances.map((task) => {
              const Icon = task.icon;
              const copy = isZh ? task.zh : task.en;
              return (
                <Link
                  key={task.href}
                  href={`/${locale}/${task.href}`}
                  className="group rounded-lg border bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{copy.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{copy.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3">
          <div className="rounded-lg border p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Search className="h-4 w-4" />
              {isZh ? "找工具" : "Find"}
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {isZh ? "按任务、预算、可用性和替代方案筛选，不再只看泛泛工具列表。" : "Filter by task, budget, availability, and alternatives instead of browsing generic tool lists."}
            </p>
          </div>
          <div className="rounded-lg border p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              {isZh ? "避坑" : "Avoid mistakes"}
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {isZh ? "先看访问、账号、付款、隐私和数据风险，再把工具放进日常工作。" : "Check access, account, payment, privacy, and data risks before using a tool for work."}
            </p>
          </div>
          <div className="rounded-lg border p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <BadgeDollarSign className="h-4 w-4" />
              {isZh ? "决定是否付费" : "Decide whether to pay"}
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {isZh ? "只有当一个工具每周真的帮你省时间、提升质量或解决限制时，才值得订阅。" : "Pay only when a tool saves time, improves quality, or removes a real workflow limit every week."}
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
              {isZh ? "先解决这些问题" : "Start with these questions"}
            </div>
            <h2 className="text-2xl font-bold text-slate-950">
              {isZh ? "普通用户进来后，不需要先理解 AI 行业" : "You do not need to understand the whole AI market first"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isZh
                ? "你只需要告诉我们想完成什么任务、在哪里使用、预算多少。我们会把可用性、风险、替代方案和下一步整理成直接答案。"
                : "Tell us the task, where you will use it, and your budget. We turn access, risk, alternatives, and next steps into direct answers."}
            </p>
          </div>
          <div className="grid gap-4">
            {answerPages.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border bg-white p-5 transition hover:border-emerald-300 hover:shadow-md">
                <div className="text-base font-semibold text-slate-950">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isZh ? "新手路径" : "Beginner path"}
              </div>
              <h2 className="text-2xl font-bold text-slate-950">
                {isZh ? "先能稳定使用，再谈高级技巧" : "Get stable first, then go deeper"}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {beginnerSteps.map((item) => (
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
