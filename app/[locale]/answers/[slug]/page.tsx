import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ExternalLink, FileQuestion, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SeoJsonLd from "@/components/SeoJsonLd";

type PageProps = {
  params: { locale: string; slug: string };
};

type AnswerPage = {
  slug: string;
  updatedAt: string;
  en: PageCopy;
  zh: PageCopy;
};

type PageCopy = {
  title: string;
  description: string;
  shortAnswer: string;
  verdict: string;
  bullets: string[];
  table: { label: string; value: string; note: string }[];
  sections: { title: string; body: string[] }[];
  steps: string[];
  faqs: { q: string; a: string }[];
  sources: { label: string; href: string }[];
};

const pages: Record<string, AnswerPage> = {
  "can-i-use-claude-in-china": {
    slug: "can-i-use-claude-in-china",
    updatedAt: "2026-05-18",
    en: {
      title: "Can I use Claude in China?",
      description:
        "A practical 2026 answer for mainland China users checking Claude availability, safer alternatives, subscriptions, and what not to do.",
      shortAnswer:
        "As of May 18, 2026, mainland China is not shown in Claude's official supported locations list. Treat Claude as not directly available there unless Anthropic updates its official availability page.",
      verdict:
        "If you are in mainland China, start with tools that are officially available to you, or use Claude only where your account, location, and payment method comply with Anthropic's rules.",
      bullets: [
        "Do not buy grey-market Claude accounts or shared logins.",
        "Do not build work or client delivery on a setup that may be suspended without warning.",
        "For everyday AI use, compare ChatGPT, Gemini, local AI products, and workplace-approved tools before paying.",
        "For Claude-specific work such as long writing or code review, verify official availability first.",
      ],
      table: [
        { label: "Mainland China", value: "Not listed", note: "Claude's official access page lists supported locations; mainland China is not listed in the page we checked." },
        { label: "Hong Kong / Taiwan", value: "Check official list", note: "Availability can change. Use the official supported locations page before subscribing." },
        { label: "Best beginner fallback", value: "ChatGPT or Gemini", note: "Pick the tool you can access and pay for normally, then upgrade only after you have a real weekly use case." },
        { label: "Risk level of reseller accounts", value: "High", note: "You may lose access, history, payment, or workspace data. We do not recommend this route." },
      ],
      sections: [
        {
          title: "What this means in practice",
          body: [
            "For ordinary users, the real question is not whether a workaround exists. The real question is whether the setup is stable enough for study, work, writing, coding, or business use.",
            "If a tool is not officially available in your location, do not make it the center of your workflow. Use it only after you understand the account, billing, and compliance risk.",
          ],
        },
        {
          title: "When Claude is still worth tracking",
          body: [
            "Claude is strong for long-form writing, document reasoning, coding review, and careful analysis. If your work depends on these use cases, track official Claude availability and compare it with ChatGPT and Gemini every month.",
            "If you only need simple chat, translation, summaries, or beginner AI learning, the safest tool is usually the one you can access reliably and pay for normally.",
          ],
        },
      ],
      steps: [
        "Check Anthropic's official supported locations page.",
        "Check whether your payment method and account location are normal for that service.",
        "Write down your weekly use case: study, writing, coding, research, or office work.",
        "Test one free or low-cost alternative before buying a monthly subscription.",
      ],
      faqs: [
        {
          q: "Does Jilo.ai recommend buying Claude accounts?",
          a: "No. We do not recommend buying grey-market AI accounts, shared logins, or account bundles because they are unstable and may violate platform rules.",
        },
        {
          q: "What should beginners use if Claude is not available?",
          a: "Start with a tool that is officially available to you. For many users, ChatGPT or Gemini is easier to try first, while local AI products may be better for domestic payment and support.",
        },
        {
          q: "Is Claude better than ChatGPT?",
          a: "It depends on the job. Claude is often strong for long context and writing review. ChatGPT is usually the safest default for broad beginner use. Gemini is strongest when you already live in Google's ecosystem.",
        },
      ],
      sources: [
        { label: "Claude supported locations", href: "https://support.claude.com/articles/8461763-where-can-i-access-claude-ai" },
        { label: "Claude Pro cost", href: "https://support.anthropic.com/en/articles/8325610-how-much-does-claude-pro-cost" },
        { label: "Claude Max plan", href: "https://support.claude.com/en/articles/11049741-what-is-the-max-plan" },
      ],
    },
    zh: {
      title: "在中国大陆能不能用 Claude？",
      description: "面向中国大陆用户的 Claude 可用性、替代方案、订阅风险和新手选择指南。",
      shortAnswer:
        "截至 2026-05-18，Claude 官方支持地区页面没有列出中国大陆。除非 Anthropic 更新官方可用地区，否则应把 Claude 视为在中国大陆不可直接稳定使用。",
      verdict:
        "普通用户不要把工作流建立在灰色账号、共享账号或不稳定访问方式上。先选能正常访问、正常付款、长期可用的 AI 工具。",
      bullets: [
        "不建议购买灰色 Claude 账号、共享账号或账号包。",
        "不要把学习、工作、客户交付押在随时可能失效的访问方式上。",
        "日常使用先比较 ChatGPT、Gemini、国内 AI 产品和公司允许使用的工具。",
        "如果你特别需要 Claude 的长文、代码审阅和分析能力，先核对官方可用地区。",
      ],
      table: [
        { label: "中国大陆", value: "官方列表未列出", note: "我们核对的 Claude 官方访问地区页面未列出中国大陆。" },
        { label: "香港 / 台湾", value: "以官方列表为准", note: "可用性会变，订阅前先看官方支持地区页面。" },
        { label: "新手替代选择", value: "ChatGPT 或 Gemini", note: "先选你能稳定访问和正常付款的工具，再决定是否付费。" },
        { label: "账号商风险", value: "高", note: "可能丢账号、聊天记录、付款权益或工作数据，不建议作为长期方案。" },
      ],
      sections: [
        {
          title: "这对普通用户意味着什么",
          body: [
            "真正的问题不是有没有绕路，而是这个工具能不能稳定支撑你的学习、办公、写作、编程或业务交付。",
            "如果一个工具没有正式支持你所在地区，就不要把它作为核心工作流。你可以关注它，但不要依赖不稳定账号来做长期事情。",
          ],
        },
        {
          title: "Claude 什么时候仍然值得关注",
          body: [
            "Claude 在长文写作、文档理解、代码审阅和严谨分析上很有价值。如果你的工作正好依赖这些能力，可以持续关注官方可用性，并每月和 ChatGPT、Gemini 做一次对比。",
            "如果你只是做翻译、总结、简单问答或 AI 入门，最适合你的工具通常是能稳定打开、稳定付款、稳定保存记录的那个。",
          ],
        },
      ],
      steps: [
        "先查看 Anthropic 官方支持地区页面。",
        "确认账号地区和付款方式是否符合平台规则。",
        "写清楚你的每周真实用途：学习、写作、编程、研究还是办公。",
        "先试一个免费或低成本替代方案，再决定是否付月费。",
      ],
      faqs: [
        {
          q: "Jilo.ai 推荐购买 Claude 账号吗？",
          a: "不推荐。我们不推荐灰色 AI 账号、共享登录或账号包，因为稳定性差，也可能违反平台规则。",
        },
        {
          q: "Claude 不可用时，新手先用什么？",
          a: "先用你能官方访问、正常付款、稳定保存记录的工具。很多用户可以先试 ChatGPT 或 Gemini，国内支付和客服需求更强的用户也可以考虑国内 AI 产品。",
        },
        {
          q: "Claude 一定比 ChatGPT 好吗？",
          a: "不一定。Claude 常见优势是长上下文、写作审阅和谨慎分析；ChatGPT 更适合作为泛用新手默认选择；Gemini 更适合已经深度使用 Google 生态的人。",
        },
      ],
      sources: [
        { label: "Claude 官方支持地区", href: "https://support.claude.com/articles/8461763-where-can-i-access-claude-ai" },
        { label: "Claude Pro 费用说明", href: "https://support.anthropic.com/en/articles/8325610-how-much-does-claude-pro-cost" },
        { label: "Claude Max 计划说明", href: "https://support.claude.com/en/articles/11049741-what-is-the-max-plan" },
      ],
    },
  },
  "chatgpt-vs-claude-vs-gemini-for-beginners": {
    slug: "chatgpt-vs-claude-vs-gemini-for-beginners",
    updatedAt: "2026-05-18",
    en: {
      title: "ChatGPT vs Claude vs Gemini: which should beginners use?",
      description:
        "A beginner-friendly comparison of ChatGPT, Claude, and Gemini for everyday work, study, writing, coding, search, and paid upgrades.",
      shortAnswer:
        "Most beginners should start with ChatGPT, add Gemini if they use Google heavily, and test Claude when they need long writing, document reasoning, or code review.",
      verdict:
        "Do not buy three subscriptions at once. Use one default assistant for two weeks, then add a second tool only when a specific task keeps failing.",
      bullets: [
        "ChatGPT is the safest general default for most beginners.",
        "Claude is useful when writing quality, long context, and careful review matter.",
        "Gemini is a strong choice for Google users and multimodal everyday tasks.",
        "The best paid plan is the one tied to a weekly workflow, not the one with the most hype.",
      ],
      table: [
        { label: "Best default", value: "ChatGPT", note: "Broad use cases, mature consumer experience, strong paid tiers." },
        { label: "Best for long writing", value: "Claude", note: "Good for drafts, review, long documents, and structured analysis." },
        { label: "Best for Google users", value: "Gemini", note: "Good fit if your work already lives in Gmail, Docs, Drive, Search, and Android." },
        { label: "Best first upgrade", value: "One paid plan only", note: "Pay after you have repeated weekly usage, not before." },
      ],
      sections: [
        {
          title: "How to choose in five minutes",
          body: [
            "Pick ChatGPT if you want one assistant for writing, planning, learning, research, images, files, and general work.",
            "Pick Claude if you often paste long documents, need careful reasoning, or want a second opinion on writing and code.",
            "Pick Gemini if your daily work depends on Google's products and you want AI closer to that ecosystem.",
          ],
        },
        {
          title: "A practical beginner stack",
          body: [
            "Start with one free account. Save five prompts you actually reuse. If you use the same assistant at least three days per week, then consider a paid plan.",
            "After that, add a second model only for a specific weakness: Claude for long review, Gemini for Google workflows, or a specialized tool for video, design, coding, or meetings.",
          ],
        },
      ],
      steps: [
        "Choose one default assistant and use it for two weeks.",
        "Track the three tasks you repeat most: writing, research, learning, coding, or office work.",
        "Upgrade only if the free limits slow down a real weekly workflow.",
        "Keep one backup assistant so you can compare answers and avoid overtrusting one model.",
      ],
      faqs: [
        {
          q: "Should beginners pay for ChatGPT Plus first?",
          a: "Usually yes if they already use ChatGPT several times per week. If not, stay free until you have a repeat workflow.",
        },
        {
          q: "Should I subscribe to Claude Max as a beginner?",
          a: "Usually no. Claude Max is designed for frequent heavy use. Beginners should start with free or lower-cost plans first.",
        },
        {
          q: "Is Gemini enough by itself?",
          a: "For many Google-heavy users, yes. But if you do broad writing, coding, or research, compare it with ChatGPT before committing.",
        },
      ],
      sources: [
        { label: "ChatGPT pricing", href: "https://openai.com/chatgpt/pricing" },
        { label: "Claude Pro cost", href: "https://support.anthropic.com/en/articles/8325610-how-much-does-claude-pro-cost" },
        { label: "Claude Max plan", href: "https://support.claude.com/en/articles/11049741-what-is-the-max-plan" },
        { label: "Google AI plans", href: "https://one.google.com/about/google-ai-plans/" },
      ],
    },
    zh: {
      title: "ChatGPT、Claude、Gemini：AI 新手先用哪个？",
      description: "给 AI 新手看的 ChatGPT、Claude、Gemini 选择指南：学习、办公、写作、编程、搜索和付费升级怎么选。",
      shortAnswer:
        "大多数新手先从 ChatGPT 开始；重度 Google 用户可以同时看 Gemini；需要长文、文档推理、代码审阅时再测试 Claude。",
      verdict:
        "不要一上来同时买三个订阅。先用一个默认助手两周，只有当某个具体任务反复做不好时，再加第二个工具。",
      bullets: [
        "ChatGPT 是多数新手最稳妥的泛用默认选择。",
        "Claude 更适合长文、长文档、写作审阅和谨慎分析。",
        "Gemini 更适合重度 Google 生态用户和日常多模态任务。",
        "最值得付费的不是最热门的工具，而是能每周真实帮你省时间的工具。",
      ],
      table: [
        { label: "泛用默认", value: "ChatGPT", note: "场景覆盖广，消费者产品成熟，付费层级清晰。" },
        { label: "长文和审阅", value: "Claude", note: "适合草稿、长文档、结构化分析和代码审阅。" },
        { label: "Google 生态", value: "Gemini", note: "如果你常用 Gmail、Docs、Drive、Search、Android，会更顺手。" },
        { label: "第一笔付费", value: "只买一个", note: "先证明每周会用，再付费，不要为焦虑买订阅。" },
      ],
      sections: [
        {
          title: "五分钟怎么选",
          body: [
            "如果你只想要一个通用助手，用来写作、规划、学习、查资料、处理图片和文件，先试 ChatGPT。",
            "如果你经常粘贴长文档、需要严谨分析、写作修改或代码审阅，可以把 Claude 作为第二选择。",
            "如果你的工作主要在 Google 产品里完成，Gemini 的生态协同更值得优先测试。",
          ],
        },
        {
          title: "新手的实际组合",
          body: [
            "先开一个免费账号，保存五个你会重复使用的提示词。如果你每周至少三天都在用同一个 AI，再考虑付费。",
            "之后只针对明确短板增加第二个模型：长文审阅用 Claude，Google 工作流用 Gemini，视频、设计、编程、会议再找垂直工具。",
          ],
        },
      ],
      steps: [
        "先选一个默认 AI 助手，用两周。",
        "记录你最常重复的三个任务：写作、资料整理、学习、编程或办公。",
        "只有当免费额度影响真实工作流时，再升级付费。",
        "保留一个备用助手，用来交叉验证答案，避免过度相信单一模型。",
      ],
      faqs: [
        {
          q: "新手应该先买 ChatGPT Plus 吗？",
          a: "如果你每周已经多次使用 ChatGPT，通常可以优先考虑。否则先用免费版，等有重复工作流后再付费。",
        },
        {
          q: "新手要不要直接买 Claude Max？",
          a: "通常不需要。Claude Max 更适合高频重度用户，新手先从免费或低成本方案开始。",
        },
        {
          q: "只用 Gemini 够不够？",
          a: "对很多重度 Google 用户够用。但如果你做大量写作、编程或研究，建议和 ChatGPT 对比后再决定。",
        },
      ],
      sources: [
        { label: "ChatGPT 官方价格", href: "https://openai.com/chatgpt/pricing" },
        { label: "Claude Pro 费用说明", href: "https://support.anthropic.com/en/articles/8325610-how-much-does-claude-pro-cost" },
        { label: "Claude Max 计划说明", href: "https://support.claude.com/en/articles/11049741-what-is-the-max-plan" },
        { label: "Google AI 计划", href: "https://one.google.com/about/google-ai-plans/" },
      ],
    },
  },
};

export function generateStaticParams() {
  return Object.keys(pages).flatMap((slug) => [
    { locale: "en", slug },
    { locale: "zh", slug },
  ]);
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = pages[params.slug];
  if (!page) return {};
  const locale = params.locale === "zh" ? "zh" : "en";
  const copy = page[locale];
  const path = `/${locale}/answers/${page.slug}`;

  return {
    title: `${copy.title} | Jilo.ai`,
    description: copy.description,
    alternates: {
      canonical: `https://jilo.ai${path}`,
      languages: {
        en: `https://jilo.ai/en/answers/${page.slug}`,
        zh: `https://jilo.ai/zh/answers/${page.slug}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `https://jilo.ai${path}`,
      type: "article",
    },
  };
}

export default function AnswerPage({ params }: PageProps) {
  const page = pages[params.slug];
  if (!page) notFound();

  const locale = params.locale === "zh" ? "zh" : "en";
  const isZh = locale === "zh";
  const copy = page[locale];
  const path = `https://jilo.ai/${locale}/answers/${page.slug}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: copy.title,
    description: copy.description,
    dateModified: page.updatedAt,
    datePublished: page.updatedAt,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    mainEntityOfPage: path,
    publisher: { "@type": "Organization", name: "Jilo.ai", url: "https://jilo.ai" },
  };

  return (
    <>
      <SeoJsonLd data={faqJsonLd} />
      <SeoJsonLd data={articleJsonLd} />
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
              <Link href={`/${locale}/reviews`} className="hover:text-slate-950">
                {isZh ? "AI 决策页" : "AI decision pages"}
              </Link>
              <span>/</span>
              <span>{isZh ? "已核对答案" : "Verified answer"}</span>
              <span className="rounded-full border bg-white px-3 py-1 text-xs text-slate-600">
                {isZh ? "更新：" : "Updated: "}
                {page.updatedAt}
              </span>
            </div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{copy.description}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {isZh ? "直接结论" : "Short answer"}
            </div>
            <p className="text-xl font-semibold leading-8 text-slate-950">{copy.shortAnswer}</p>
            <p className="mt-4 text-sm leading-6 text-emerald-900">{copy.verdict}</p>
          </div>
          <div className="rounded-lg border p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              <ShieldAlert className="h-4 w-4" />
              {isZh ? "判断要点" : "Decision notes"}
            </div>
            <ul className="space-y-3 text-sm leading-6 text-slate-700">
              {copy.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="overflow-hidden rounded-lg border">
            <div className="grid bg-slate-950 px-5 py-3 text-sm font-semibold text-white md:grid-cols-[0.8fr_0.8fr_1.4fr]">
              <div>{isZh ? "问题" : "Question"}</div>
              <div>{isZh ? "结论" : "Answer"}</div>
              <div>{isZh ? "备注" : "Note"}</div>
            </div>
            {copy.table.map((row) => (
              <div key={row.label} className="grid gap-2 border-t px-5 py-4 text-sm md:grid-cols-[0.8fr_0.8fr_1.4fr]">
                <div className="font-semibold text-slate-950">{row.label}</div>
                <div className="text-emerald-700">{row.value}</div>
                <div className="leading-6 text-slate-600">{row.note}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_0.85fr]">
            <div className="space-y-7">
              {copy.sections.map((section) => (
                <article key={section.title}>
                  <h2 className="text-2xl font-bold text-slate-950">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-base leading-7 text-slate-700">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <aside className="rounded-lg border bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <ArrowRight className="h-5 w-5 text-emerald-700" />
                {isZh ? "下一步" : "Next steps"}
              </h2>
              <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
                {copy.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-950">
            <FileQuestion className="h-6 w-6 text-emerald-700" />
            FAQ
          </h2>
          <div className="mt-5 grid gap-4">
            {copy.faqs.map((faq) => (
              <article key={faq.q} className="rounded-lg border p-5">
                <h3 className="font-semibold text-slate-950">{faq.q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              {isZh ? "来源" : "Sources"}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {copy.sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-950"
                >
                  {source.label}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
