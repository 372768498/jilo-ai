import { ArrowRight, CheckCircle2, FileQuestion, ListChecks, Scale, SearchCheck, XCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { locale: string };
};

export default async function ReviewsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  // Real, recent articles instead of hardcoded placeholder links (audit: 3/5
  // links pointed back at /reviews itself). Maps to the news table that
  // /reviews/[slug] and /news/[slug] render.
  const { data: recent } = await supabase
    .from("news")
    .select("slug, title_en, title_zh, summary_en, summary_zh, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(12);
  const articles = (recent || []).filter((a) => a.slug && (a.title_en || a.title_zh));

  const blocks = isZh
    ? [
        { icon: ListChecks, title: "评测结构", desc: "结论、适合谁、价格、访问条件、优点、缺点、替代方案和 FAQ。" },
        { icon: Scale, title: "决策对比", desc: "用表格比较功能、成本、使用门槛、中文支持和商业价值。" },
        { icon: CheckCircle2, title: "推荐理由", desc: "说明为什么值得试或值得买，而不是只写工具介绍。" },
        { icon: XCircle, title: "不推荐场景", desc: "明确告诉用户什么时候不该用，提升信任和长期转化。" },
      ]
    : [
        { icon: ListChecks, title: "Review structure", desc: "Conclusion, who it fits, pricing, access, pros, cons, alternatives, and FAQ." },
        { icon: Scale, title: "Decision comparison", desc: "Compare features, cost, difficulty, language support, and business value." },
        { icon: CheckCircle2, title: "Why recommend it", desc: "Explain why it is worth trying or buying, not just what it is." },
        { icon: XCircle, title: "When to skip it", desc: "Tell users when not to use it to improve trust and long-term conversion." },
      ];

  const geoChecklist = isZh
    ? ["页面开头有明确结论", "有表格和对比模块", "有 FAQ", "有更新时间", "有作者或编辑标准", "有可验证来源", "有结构化数据", "有简短直接的问题回答"]
    : ["Clear conclusion near the top", "Tables and comparison blocks", "FAQ section", "Updated date", "Author or editorial standard", "Verifiable sources", "Structured data", "Short direct answers"];

  const featured = isZh
    ? [
        { title: "在中国大陆能不能用 Claude？", href: `/${locale}/answers/can-i-use-claude-in-china` },
        { title: "ChatGPT、Claude、Gemini：AI 新手先用哪个？", href: `/${locale}/answers/chatgpt-vs-claude-vs-gemini-for-beginners` },
      ]
    : [
        { title: "Can I use Claude in China?", href: `/${locale}/answers/can-i-use-claude-in-china` },
        { title: "ChatGPT vs Claude vs Gemini for beginners", href: `/${locale}/answers/chatgpt-vs-claude-vs-gemini-for-beginners` },
      ];

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {isZh ? "面向 SEO、GEO 和转化的 AI 工具评测体系" : "AI reviews built for SEO, GEO, and conversion"}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {isZh
                  ? "Jilo.ai 的评测页要服务用户决策，也要适合搜索引擎和 AI 答案系统引用。每篇内容都必须能回答一个具体问题。"
                  : "Jilo.ai reviews should help users decide and be easy for search engines and AI answer engines to cite."}
              </p>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 md:grid-cols-2">
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <div key={block.title} className="rounded-lg border p-5">
                <Icon className="mb-4 h-6 w-6 text-emerald-700" />
                <h2 className="font-semibold text-slate-950">{block.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{block.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <SearchCheck className="h-5 w-5 text-emerald-700" />
                <h2 className="text-2xl font-bold text-slate-950">{isZh ? "GEO 内容检查清单" : "GEO Content Checklist"}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {geoChecklist.map((item) => (
                  <div key={item} className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-4 flex items-center gap-3">
                <FileQuestion className="h-5 w-5 text-emerald-700" />
                <h2 className="text-2xl font-bold text-slate-950">{isZh ? "精选解答" : "Featured answers"}</h2>
              </div>
              <div className="grid gap-3">
                {featured.map((page) => (
                  <Link
                    key={page.title}
                    href={page.href}
                    className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:text-slate-950"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {articles.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="mb-5 text-2xl font-bold text-slate-950">{isZh ? "最新评测与解读" : "Latest reviews & analysis"}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => {
                const title = isZh ? a.title_zh || a.title_en : a.title_en || a.title_zh;
                const summary = isZh ? a.summary_zh || a.summary_en : a.summary_en || a.summary_zh;
                return (
                  <Link
                    key={a.slug}
                    href={`/${locale}/news/${a.slug}`}
                    className="flex flex-col rounded-lg border p-5 transition hover:border-emerald-300 hover:shadow-sm"
                  >
                    <h3 className="font-semibold leading-6 text-slate-950 line-clamp-2">{title}</h3>
                    {summary ? <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{summary}</p> : <div className="flex-1" />}
                    {a.published_at ? <span className="mt-3 text-xs text-slate-400">{String(a.published_at).slice(0, 10)}</span> : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Conversion exit so this page isn't a methodology dead-end */}
        <section className="border-t bg-slate-50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-8 text-sm">
            <span className="font-semibold text-slate-700">{isZh ? "继续探索：" : "Keep exploring:"}</span>
            <Link href={`/${locale}/tools`} className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 font-medium text-slate-700 hover:text-slate-950">
              {isZh ? "浏览全部工具" : "Browse all tools"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/${locale}/rankings`} className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 font-medium text-slate-700 hover:text-slate-950">
              {isZh ? "AI 工具排行榜" : "AI tool rankings"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/${locale}/deals`} className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 font-medium text-slate-700 hover:text-slate-950">
              {isZh ? "今日 Deals" : "Today's deals"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
