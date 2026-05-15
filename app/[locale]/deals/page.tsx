import { BadgeDollarSign, Clock, ShieldQuestion, ThumbsUp } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
};

export default function DealsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const rules = isZh
    ? [
        { icon: ThumbsUp, title: "先判断是否值得买", desc: "折扣不是理由，能不能解决真实任务才是理由。" },
        { icon: Clock, title: "检查长期可用性", desc: "关注产品更新、团队可信度、支持响应和退款政策。" },
        { icon: ShieldQuestion, title: "写清楚不适合谁", desc: "避免只做导购，必须告诉用户什么时候不应该买。" },
      ]
    : [
        { icon: ThumbsUp, title: "Judge value first", desc: "A discount is not enough. The tool must solve a real job." },
        { icon: Clock, title: "Check durability", desc: "Look at updates, team credibility, support, and refund policy." },
        { icon: ShieldQuestion, title: "Say who should skip it", desc: "Every deal review needs a clear not-for section." },
      ];

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700">
                <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                AI Deals
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {isZh ? "AI deal 和买断工具的独立购买建议" : "Independent buying guidance for AI deals and lifetime offers"}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {isZh
                  ? "重点覆盖 AppSumo 等平台上的 AI 工具，判断它是否值得买、适合谁、风险是什么，以及有没有更稳的替代方案。"
                  : "Focus on AppSumo and similar platforms: worth buying, who it fits, risks, and better alternatives."}
              </p>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 md:grid-cols-3">
          {rules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div key={rule.title} className="rounded-lg border p-5">
                <Icon className="mb-4 h-6 w-6 text-emerald-700" />
                <h2 className="font-semibold text-slate-950">{rule.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{rule.desc}</p>
              </div>
            );
          })}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
