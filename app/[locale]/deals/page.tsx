import { BadgeDollarSign, Clock, ShieldQuestion, ShoppingCart, ThumbsUp } from "lucide-react";
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

  const pageTypes = isZh
    ? ["Best AppSumo AI deals", "AI lifetime deals 值不值得买", "某个 deal 的替代方案", "同类工具价格和功能对比", "买断工具长期风险清单"]
    : ["Best AppSumo AI deals", "Are AI lifetime deals worth it?", "Alternatives to a specific deal", "Price and feature comparison", "Lifetime deal risk checklist"];

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

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-emerald-700" />
                <h2 className="text-2xl font-bold text-slate-950">{isZh ? "优先承接的购买意图" : "High-Intent Deal Pages"}</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {isZh
                  ? "AI Deals 不是优惠搬运，而是承接正在准备购买的用户。页面必须能导向 affiliate、赞助评测或替代品推荐。"
                  : "AI Deals is not a repost feed. It should capture users who are close to buying and route them to affiliate, sponsored reviews, or alternatives."}
              </p>
            </div>
            <div className="grid gap-3">
              {pageTypes.map((item) => (
                <div key={item} className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
