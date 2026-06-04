// app/[locale]/rankings/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { TrendingUp, Star, Sparkles, Gift } from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const RANKING_CARDS = [
  { type: "most-popular", icon: TrendingUp, en: "Most Popular AI Tools", zh: "最受欢迎的 AI 工具", enDesc: "Ranked by the tools visitors actually click through to.", zhDesc: "按访客真正点击访问的工具排名。" },
  { type: "top-rated", icon: Star, en: "Top-Rated AI Tools", zh: "评分最高的 AI 工具", enDesc: "Shortlist by quality before pricing and features.", zhDesc: "先按质量筛选,再看定价和功能。" },
  { type: "newest", icon: Sparkles, en: "Newest AI Tools", zh: "最新 AI 工具", enDesc: "The freshest launches worth a look this week.", zhDesc: "本周最值得一看的最新发布。" },
  { type: "best-free", icon: Gift, en: "Best Free AI Tools", zh: "最佳免费 AI 工具", enDesc: "Real capability without a subscription.", zhDesc: "不订阅也能用上真本事。" },
];

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const isZh = params.locale === "zh";
  const title = isZh ? "AI 工具排行榜 (2026) | Jilo.ai" : "AI Tool Rankings (2026) | Jilo.ai";
  return {
    title,
    description: isZh
      ? "AI 工具排行榜:最受欢迎、评分最高、最新、最佳免费 —— 用硬数据帮你快速选出值得用的 AI 工具。"
      : "AI tool rankings: most popular, top-rated, newest, and best free — pick the right AI tool fast with hard data.",
    alternates: { canonical: `https://www.jilo.ai/${params.locale}/rankings` },
  };
}

export default function RankingsIndex({ params }: { params: { locale: string } }) {
  const locale = params.locale === "zh" ? "zh" : "en";
  const isZh = locale === "zh";

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              {isZh ? "AI 工具排行榜" : "AI Tool Rankings"} <span className="text-slate-400">2026</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {isZh
                ? "用硬数据快速选出值得用的 AI 工具 —— 按热度、评分、新鲜度和免费档排名。"
                : "Pick the right AI tool fast with hard data — ranked by popularity, rating, freshness, and free tier."}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-4 sm:grid-cols-2">
            {RANKING_CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.type}
                  href={`/${locale}/rankings/${c.type}`}
                  className="group rounded-lg border p-6 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-bold text-slate-950 group-hover:text-primary">
                      {isZh ? c.zh : c.en}
                    </h2>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{isZh ? c.zhDesc : c.enDesc}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-primary">
                    {isZh ? "查看排行 →" : "View ranking →"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
