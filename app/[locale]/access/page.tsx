import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, Globe2, ShieldCheck, Table2 } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
};

export default function AccessPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const cards = isZh
    ? [
        { icon: Globe2, title: "访问条件", desc: "标注工具是否能直接访问，是否依赖海外网络、Google 登录、海外手机号或地区限制。" },
        { icon: CreditCard, title: "订阅与支付", desc: "对比官方订阅、团队订阅、第三方订阅和替代工具，帮助用户选择风险更低的方案。" },
        { icon: ShieldCheck, title: "账号与隐私", desc: "说明账号安全、数据隐私、售后、退款和长期稳定性风险。" },
      ]
    : [
        { icon: Globe2, title: "Access requirements", desc: "Check whether a tool needs global network access, Google login, phone verification, or region-specific setup." },
        { icon: CreditCard, title: "Subscription and payment", desc: "Compare official plans, team plans, third-party subscription options, and alternatives." },
        { icon: ShieldCheck, title: "Account and privacy", desc: "Explain account safety, privacy, support, refund, and long-term reliability risks." },
      ];

  const channels = isZh
    ? [
        { name: "官方订阅", fit: "长期重度用户、企业用户", risk: "价格高，支付和访问门槛可能更高", action: "优先推荐" },
        { name: "银河录像局等主流合租/订阅渠道", fit: "想快速解决眼前访问和体验问题的普通用户", risk: "账号归属、隐私、售后和稳定性需要明确披露", action: "可评测，可导流，但必须写风险" },
        { name: "国内可直接使用的替代工具", fit: "不想处理海外访问和支付的用户", risk: "能力可能弱于原版海外工具", action: "作为低风险备选" },
      ]
    : [
        { name: "Official subscription", fit: "Heavy users and teams", risk: "Higher price and more access or payment friction", action: "Default recommendation when practical" },
        { name: "Mainstream shared subscription channels", fit: "Users who need a quick practical access path", risk: "Account ownership, privacy, support, and stability need disclosure", action: "Reviewable, but always disclose risk" },
        { name: "Local alternatives", fit: "Users who want fewer access and payment barriers", risk: "May be weaker than original global tools", action: "Lower-risk fallback option" },
      ];

  const checks = isZh
    ? ["是否能稳定访问", "是否支持中文用户", "是否需要海外支付", "是否适合长期使用", "是否有更低风险替代方案", "是否有明确售后和退款说明"]
    : ["Stable access", "Chinese user readiness", "Payment requirements", "Long-term reliability", "Lower-risk alternatives", "Support and refund clarity"];

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700">
                <Globe2 className="h-4 w-4 text-emerald-600" />
                AI Access
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {isZh ? "普通用户使用全球 AI 工具的访问、订阅与安全指南" : "Access, subscription, and safety guidance for global AI tools"}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {isZh
                  ? "这里不做灰产账号教程。Jilo.ai 会客观评测主流访问和订阅方案，说明适合谁、能解决什么问题、风险在哪里，以及什么时候应该选择官方或替代方案。"
                  : "This is not a gray-market account tutorial. Jilo.ai reviews mainstream access and subscription options, who they fit, what they solve, and where the risks are."}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-lg border p-5">
                <Icon className="mb-4 h-6 w-6 text-emerald-700" />
                <h2 className="font-semibold text-slate-950">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-6 flex items-center gap-3">
              <Table2 className="h-5 w-5 text-emerald-700" />
              <h2 className="text-2xl font-bold text-slate-950">{isZh ? "首批渠道评测框架" : "Initial Channel Review Framework"}</h2>
            </div>
            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="grid grid-cols-4 border-b bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>{isZh ? "渠道类型" : "Channel"}</div>
                <div>{isZh ? "适合谁" : "Best for"}</div>
                <div>{isZh ? "主要风险" : "Main risk"}</div>
                <div>{isZh ? "Jilo 动作" : "Jilo action"}</div>
              </div>
              {channels.map((channel) => (
                <div key={channel.name} className="grid grid-cols-4 gap-4 border-b px-4 py-4 text-sm text-slate-700 last:border-b-0">
                  <div className="font-semibold text-slate-950">{channel.name}</div>
                  <div>{channel.fit}</div>
                  <div>{channel.risk}</div>
                  <div>{channel.action}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{isZh ? "评测边界" : "Review Boundaries"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isZh
                ? "可以推荐主流实用渠道，但页面必须有风险披露和适用边界，不能教绕过平台风控、批量注册或买卖账号。"
                : "We can review mainstream practical channels, but every page needs risk disclosure and suitability boundaries."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {checks.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border bg-white p-4 text-sm font-medium text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h2 className="font-semibold text-amber-950">{isZh ? "下一步" : "Next Step"}</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  {isZh
                    ? "先选择 2-3 个主流 AI 访问/订阅渠道做客观评测，包括用户已经熟悉的银河录像局等方案，并用表格写清楚适用人群和风险。"
                    : "Start with 2-3 mainstream AI access or subscription channels and publish objective comparison pages with risk disclosure."}
                </p>
                <Link href={`/${locale}/submit`} className="mt-4 inline-flex rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
                  {isZh ? "提交渠道或工具" : "Submit a solution"}
                </Link>
              </div>
            </div>
          </div>

          {/* Conversion exits for high-intent access traffic (was: only /submit) */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-slate-700">{isZh ? "想直接用 AI：" : "Want to use AI now:"}</span>
            <Link href={`/${locale}/c/chat`} className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 font-medium text-slate-700 hover:text-slate-950">
              {isZh ? "AI 聊天助手" : "AI chat assistants"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/${locale}/deals`} className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 font-medium text-slate-700 hover:text-slate-950">
              {isZh ? "订阅 Deals" : "Subscription deals"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/${locale}/rankings/most-popular`} className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 font-medium text-slate-700 hover:text-slate-950">
              {isZh ? "最受欢迎工具" : "Most popular tools"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
