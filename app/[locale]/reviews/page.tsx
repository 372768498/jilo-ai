import { CheckCircle2, FileQuestion, ListChecks, Scale, SearchCheck, XCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
};

export default function ReviewsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

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

  const firstPages = isZh
    ? ["Can I use Claude in China?", "Best ways to access ChatGPT Plus from China", "Cursor vs Windsurf for beginners", "Best AI tools for Chinese content creators", "银河录像局值得用于 AI 订阅吗？"]
    : ["Can I use Claude in China?", "Best ways to access ChatGPT Plus from China", "Cursor vs Windsurf for beginners", "Best AI tools for Chinese content creators", "Is Galaxy-style shared subscription worth it?"];

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
                <h2 className="text-2xl font-bold text-slate-950">{isZh ? "优先做的问题型页面" : "Priority Question Pages"}</h2>
              </div>
              <div className="grid gap-3">
                {firstPages.map((page) => (
                  <div key={page} className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700">
                    {page}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
