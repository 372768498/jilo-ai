import Link from "next/link";
import { BadgeDollarSign, ExternalLink, ShieldCheck, Sparkles, Timer, Trophy } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: { locale: string };
};

type DealTool = {
  id: string;
  slug: string;
  name_en: string | null;
  name_zh: string | null;
  tagline_en: string | null;
  tagline_zh: string | null;
  category: string | null;
  pricing_type: string | null;
  official_url: string | null;
  affiliate_url: string | null;
  click_count: number | null;
};

const prioritySlugs = [
  "elevenlabs",
  "grammarly",
  "quillbot",
  "descript",
  "writesonic",
  "copy-ai",
  "jasper",
  "surfer-seo",
  "semrush",
  "canva",
  "runway",
  "reclaim-ai",
  "gamma",
  "framer",
  "perplexity-ai",
  "cursor",
];

function targetHref(target: string, locale: string, source: string) {
  return `/api/out?target=${encodeURIComponent(target)}&source=${encodeURIComponent(source)}&locale=${encodeURIComponent(locale)}`;
}

function nameOf(tool: DealTool, isZh: boolean) {
  return (isZh ? tool.name_zh || tool.name_en : tool.name_en || tool.name_zh) || "AI tool";
}

function descOf(tool: DealTool, isZh: boolean) {
  return (isZh ? tool.tagline_zh || tool.tagline_en : tool.tagline_en || tool.tagline_zh) || "";
}

function outHref(tool: DealTool, locale: string, source: string) {
  return `/api/out?tool=${encodeURIComponent(tool.id)}&source=${encodeURIComponent(source)}&locale=${encodeURIComponent(locale)}`;
}

async function getDealTools() {
  const { data } = await supabase
    .from("tools")
    .select("id,slug,name_en,name_zh,tagline_en,tagline_zh,category,pricing_type,official_url,affiliate_url,click_count")
    .eq("status", "published")
    .in("slug", prioritySlugs)
    .limit(30);

  const tools = (data || []) as DealTool[];
  return tools.sort((a, b) => {
    const affiliateDiff = Number(Boolean(b.affiliate_url)) - Number(Boolean(a.affiliate_url));
    if (affiliateDiff) return affiliateDiff;
    return prioritySlugs.indexOf(a.slug) - prioritySlugs.indexOf(b.slug);
  });
}

export default async function DealsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  const tools = await getDealTools();

  const principles = isZh
    ? [
        { icon: ShieldCheck, title: "先判断是否值得买", desc: "不因为有折扣就推荐，优先看它能不能解决真实任务。" },
        { icon: Timer, title: "检查长期可用性", desc: "关注更新频率、团队可信度、退款政策和替代方案。" },
        { icon: Trophy, title: "优先推荐能省时间的工具", desc: "真正能缩短工作流、提高产出的工具，才值得付费。" },
      ]
    : [
        { icon: ShieldCheck, title: "Value before discount", desc: "We do not recommend a tool just because it is discounted." },
        { icon: Timer, title: "Durability check", desc: "We look at updates, team credibility, refund policy, and alternatives." },
        { icon: Trophy, title: "Time saved wins", desc: "Paid tools need to clearly save time or improve output quality." },
      ];

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700">
                <BadgeDollarSign className="h-4 w-4 text-emerald-700" />
                AI Deals
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {isZh ? "值得买的 AI 工具、优惠和订阅选择" : "AI tools, deals, and subscriptions worth checking"}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {isZh
                  ? "这里不是优惠搬运，而是把普通用户最可能付费的 AI 工具放在一起：先看适合谁、风险是什么，再决定是否访问官网或查看替代方案。"
                  : "This is not a coupon feed. It groups high-intent AI tools by use case, value, risk, and practical next step."}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-3">
          {principles.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border bg-white p-5">
                <Icon className="mb-4 h-6 w-6 text-emerald-700" />
                <h2 className="font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-700">
                  {isZh ? "优先评测清单" : "Priority Picks"}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {isZh ? "最接近付费决策的工具" : "Tools closest to a purchase decision"}
                </h2>
              </div>
              <Link href={`/${locale}/tools`} className="hidden text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:inline-flex">
                {isZh ? "查看全部工具" : "View all tools"}
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <div key={tool.id} className="rounded-lg border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/${locale}/tools/${tool.slug}`} className="text-lg font-semibold text-slate-950 hover:text-emerald-700">
                        {nameOf(tool, isZh)}
                      </Link>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{descOf(tool, isZh)}</p>
                    </div>
                    {tool.affiliate_url ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Partner</span>
                    ) : (
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        {isZh ? "待接入" : "Candidate"}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-700">
                    {tool.category ? <span className="rounded border px-2 py-1">{tool.category}</span> : null}
                    {tool.pricing_type ? <span className="rounded border px-2 py-1">{tool.pricing_type}</span> : null}
                    <span className="rounded border px-2 py-1">{tool.click_count || 0} clicks</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={outHref(tool, locale, "deals_page")}
                      target="_blank"
                      rel="sponsored nofollow noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                      {isZh ? "访问官网" : "Visit site"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Link href={`/${locale}/tools/${tool.slug}`} className="inline-flex rounded-md border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {isZh ? "查看评测" : "Review"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 lg:grid-cols-2">
          <a
            href={targetHref("appsumo-ai", locale, "deals_page")}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            className="rounded-lg border bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
          >
            <Sparkles className="mb-4 h-6 w-6 text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-950">{isZh ? "查看 AppSumo AI 限时工具" : "Browse AppSumo AI deals"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isZh
                ? "适合寻找买断工具和早期 SaaS 优惠的用户。购买前仍建议检查更新频率、退款政策和替代品。"
                : "Useful for lifetime deals and early-stage SaaS offers. Check updates, refund terms, and alternatives before buying."}
            </p>
          </a>

          <a
            href={targetHref("skool-community", locale, "deals_page")}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            className="rounded-lg border bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
          >
            <Sparkles className="mb-4 h-6 w-6 text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-950">{isZh ? "加入 AI 学习社区" : "Join an AI learning community"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isZh
                ? "适合想和其他用户交流工具、工作流和上手经验的人。"
                : "Useful for users who want peer discussion around AI tools, workflows, and practical adoption."}
            </p>
          </a>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12">
          <p className="text-xs leading-6 text-slate-500">
            {isZh
              ? "披露：部分链接可能是联盟链接或推荐链接。如果你通过这些链接购买，我们可能获得佣金；这不会影响我们的排序和判断。"
              : "Disclosure: Some links may be affiliate or referral links. We may earn a commission if you buy through them, but rankings and recommendations are not pay-to-play."}
          </p>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
