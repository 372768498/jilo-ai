import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, FileQuestion, ShieldCheck } from "lucide-react";
import AiSubscriptionCostCalculator from "@/components/ai-subscription-cost-calculator";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import SeoJsonLd from "@/components/SeoJsonLd";

type PageProps = {
  params: { locale: string };
};

const updatedAt = "2026-05-25";

const copy = {
  en: {
    title: "AI Subscription Cost Calculator",
    description:
      "Calculate your monthly and yearly AI subscription cost before paying for ChatGPT, Claude, Gemini, Cursor, Perplexity, or another AI tool.",
    eyebrow: "Free AI tool",
    h1: "AI Subscription Cost Calculator",
    intro:
      "Before adding another AI plan, calculate what your stack really costs per month and per year. Edit every price because AI plans change often.",
    shortAnswer:
      "For most individual users, one paid general assistant is enough. Add a second subscription only when it solves a weekly task the first tool cannot handle.",
    bullets: [
      "Start with one default assistant, not three paid plans.",
      "Keep subscriptions only when they save time every week.",
      "Separate personal curiosity from work that produces money or grades.",
      "Review the stack every month and cancel overlapping tools.",
    ],
    sections: [
      {
        title: "When should you pay for more than one AI tool?",
        body: "Pay for multiple AI tools only when each one has a separate job. For example, ChatGPT as a general assistant, Claude for long document review, and Cursor for coding can make sense if you use all three every week.",
      },
      {
        title: "When should you stay free?",
        body: "Stay on free plans if you are still testing prompts, learning basic workflows, or using AI less than three days per week. A paid plan is a workflow upgrade, not a personality badge.",
      },
      {
        title: "What should teams calculate?",
        body: "Teams should calculate seats, duplicated subscriptions, admin control, privacy requirements, and whether a business plan is cheaper than many unmanaged personal plans.",
      },
    ],
    faqs: [
      {
        q: "Is the calculator using live prices?",
        a: "No. It uses editable starter prices. AI subscriptions change often, so check the official pricing page before subscribing.",
      },
      {
        q: "Is ChatGPT Plus enough for beginners?",
        a: "Usually yes if ChatGPT is your main assistant and you use it several times per week. Do not add Claude, Gemini, or Perplexity until you know why the second tool is needed.",
      },
      {
        q: "Should creators pay for many AI tools?",
        a: "Only if each tool maps to a production step: writing, image, video, voice, research, or scheduling. Otherwise, subscriptions quietly become fixed costs.",
      },
    ],
    sourcesTitle: "Official pricing sources",
    sourcesNote: "Use these to verify prices before buying. The calculator values are editable examples.",
    relatedTitle: "Next decision",
    relatedText: "Compare the main AI assistants before paying.",
    relatedHref: "/answers/chatgpt-vs-claude-vs-gemini-for-beginners",
    relatedCta: "Read comparison",
  },
  zh: {
    title: "AI 订阅成本计算器",
    description:
      "在购买 ChatGPT、Claude、Gemini、Cursor、Perplexity 或其他 AI 工具前，先计算每月和每年的 AI 订阅成本。",
    eyebrow: "免费 AI 小工具",
    h1: "AI 订阅成本计算器",
    intro:
      "继续买下一个 AI 付费计划前，先算清楚你的订阅组合每月和每年到底花多少钱。价格都可以改，因为 AI 订阅价格经常变化。",
    shortAnswer:
      "对大多数个人用户来说，一个付费通用 AI 助手通常够用。只有当第二个订阅能解决第一个工具每周都解决不了的任务时，才值得加。",
    bullets: [
      "先保留一个默认 AI 助手，不要一上来买三个。",
      "只有每周真实省时间的订阅才值得留。",
      "把个人好奇和能产生收入、成绩、交付的工作分开算。",
      "每月复盘一次，取消功能重叠的工具。",
    ],
    sections: [
      {
        title: "什么时候值得同时付费多个 AI 工具？",
        body: "只有当每个工具负责不同任务时才值得。例如 ChatGPT 做通用助手，Claude 做长文档审阅，Cursor 做编程。如果三者每周都在用，这个组合才可能合理。",
      },
      {
        title: "什么时候应该继续用免费版？",
        body: "如果你还在测试提示词、学习基础工作流，或者每周使用 AI 少于三天，就先别急着付费。付费计划应该是工作流升级，不是身份标签。",
      },
      {
        title: "团队应该算什么？",
        body: "团队要算人数、重复订阅、管理权限、隐私要求，以及企业计划是否比一堆没人管理的个人订阅更划算。",
      },
    ],
    faqs: [
      {
        q: "这个计算器使用实时价格吗？",
        a: "不是。这里使用的是可编辑起始价格。AI 订阅价格变化很快，订阅前请核对官方价格页。",
      },
      {
        q: "新手买 ChatGPT Plus 够不够？",
        a: "如果 ChatGPT 是你的主力助手，而且每周使用多次，通常够用。不要在不知道具体用途前同时加 Claude、Gemini 或 Perplexity。",
      },
      {
        q: "创作者应该买很多 AI 工具吗？",
        a: "只有当每个工具对应一个生产环节时才值得，比如写作、图片、视频、配音、资料整理或排期。否则订阅会悄悄变成固定成本。",
      },
    ],
    sourcesTitle: "官方价格来源",
    sourcesNote: "购买前用这些官方页面核对价格。计算器里的数值只是可编辑示例。",
    relatedTitle: "下一步决策",
    relatedText: "付费前先比较主流 AI 助手。",
    relatedHref: "/answers/chatgpt-vs-claude-vs-gemini-for-beginners",
    relatedCta: "查看对比",
  },
};

const sources = [
  { label: "ChatGPT pricing", href: "https://openai.com/chatgpt/pricing" },
  { label: "Claude plan guide", href: "https://support.claude.com/en/articles/11049762-choose-a-claude-plan" },
  { label: "Google AI plans", href: "https://one.google.com/about/google-ai-plans/" },
];

export function generateMetadata({ params }: PageProps): Metadata {
  const locale = params.locale === "zh" ? "zh" : "en";
  const t = copy[locale];
  const path = `/${locale}/tools/ai-subscription-cost-calculator`;

  return {
    title: `${t.title} | Jilo.ai`,
    description: t.description,
    alternates: {
      canonical: `https://www.jilo.ai${path}`,
      languages: {
        en: "https://www.jilo.ai/en/tools/ai-subscription-cost-calculator",
        zh: "https://www.jilo.ai/zh/tools/ai-subscription-cost-calculator",
      },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: `https://www.jilo.ai${path}`,
      type: "website",
    },
  };
}

export default function AiSubscriptionCostCalculatorPage({ params }: PageProps) {
  const locale = params.locale === "zh" ? "zh" : "en";
  const isZh = locale === "zh";
  const t = copy[locale];
  const pageUrl = `https://www.jilo.ai/${locale}/tools/ai-subscription-cost-calculator`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t.title,
    description: t.description,
    url: pageUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    dateModified: updatedAt,
  };

  return (
    <>
      <SeoJsonLd data={faqJsonLd} />
      <SeoJsonLd data={webAppJsonLd} />
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
              <Link href={`/${locale}/tools`} className="hover:text-slate-950">
                {isZh ? "AI 工具" : "AI tools"}
              </Link>
              <span>/</span>
              <span>{t.eyebrow}</span>
              <span className="rounded-full border bg-white px-3 py-1 text-xs text-slate-600">
                {isZh ? "更新：" : "Updated: "}
                {updatedAt}
              </span>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">{t.h1}</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{t.intro}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <ShieldCheck className="h-4 w-4" />
                  {isZh ? "直接结论" : "Short answer"}
                </div>
                <p className="text-base leading-7 text-emerald-950">{t.shortAnswer}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <AiSubscriptionCostCalculator locale={locale} />
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-lg border bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">{isZh ? "使用原则" : "Buying rules"}</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                {t.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4">
              {t.sections.map((section) => (
                <article key={section.title} className="rounded-lg border bg-white p-5">
                  <h2 className="text-lg font-bold text-slate-950">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-950">
              <FileQuestion className="h-6 w-6 text-emerald-700" />
              FAQ
            </h2>
            <div className="mt-5 grid gap-4">
              {t.faqs.map((faq) => (
                <article key={faq.q} className="rounded-lg border p-5">
                  <h3 className="font-semibold text-slate-950">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.a}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{t.sourcesTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.sourcesNote}</p>
              <div className="mt-4 grid gap-3">
                {sources.map((source) => (
                  <a
                    key={source.href}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-950"
                  >
                    {source.label}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="text-lg font-bold text-slate-950">{t.relatedTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t.relatedText}</p>
              <Link
                href={`/${locale}${t.relatedHref}`}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                {t.relatedCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
