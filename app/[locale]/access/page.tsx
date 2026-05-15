import Link from "next/link";
import { AlertTriangle, CheckCircle2, CreditCard, Globe2, ShieldCheck } from "lucide-react";
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
        { icon: Globe2, title: "访问条件", desc: "标注工具是否国内可直接访问，是否依赖海外网络、Google 登录或特定地区服务。" },
        { icon: CreditCard, title: "订阅与支付", desc: "对比官方订阅、第三方订阅、团队方案和替代工具，帮助用户判断哪种方式更合适。" },
        { icon: ShieldCheck, title: "账号与隐私", desc: "提醒账号安全、数据隐私、售后、退款和长期稳定性风险。" },
      ]
    : [
        { icon: Globe2, title: "Access requirements", desc: "See whether a tool works locally, requires global network access, Google login, or region-specific setup." },
        { icon: CreditCard, title: "Subscription and payment", desc: "Compare official subscriptions, third-party options, team plans, and practical alternatives." },
        { icon: ShieldCheck, title: "Account and privacy", desc: "Understand account safety, data privacy, support, refund, and long-term reliability risks." },
      ];

  const checks = isZh
    ? ["是否能稳定访问", "是否支持中文用户", "是否需要海外支付", "是否适合长期使用", "是否有更低风险替代方案"]
    : ["Stable access", "Chinese user readiness", "Payment requirements", "Long-term reliability", "Lower-risk alternatives"];

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
                  ? "这里不做灰产账号教程。Jilo.ai 会评测主流访问和订阅方案，说明适合谁、能解决什么问题、风险在哪里，以及什么时候应该选择官方或替代方案。"
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
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
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
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h2 className="font-semibold text-amber-950">{isZh ? "当前优先任务" : "Current Priority"}</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  {isZh
                    ? "先选择 2-3 个主流 AI 访问/订阅渠道做客观评测，包括银河录像局等用户已经熟悉的方案。"
                    : "Start with 2-3 mainstream AI access or subscription channels and review them objectively."}
                </p>
                <Link href={`/${locale}/submit`} className="mt-4 inline-flex rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
                  {isZh ? "提交渠道或工具" : "Submit a solution"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
