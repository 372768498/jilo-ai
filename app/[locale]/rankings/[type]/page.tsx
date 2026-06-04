// app/[locale]/rankings/[type]/page.tsx
//
// Quantified ranking pages — the flagship SEO format (Toolify's #1 lever):
// "Top/Most Popular/Best <X> AI Tools" as ranked tables with hard numbers.
// Numbers + superlative + niche is the highest-CTR SERP format and the biggest
// PV driver beyond acquisition. Each row cross-links to the tool detail and
// carries an outbound Visit (/api/out) CTA so the pages also convert.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink, Star, TrendingUp } from "lucide-react";

import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const dynamic = "force-dynamic";

type Tool = {
  slug: string;
  name_en: string | null;
  name_zh: string | null;
  tagline_en: string | null;
  tagline_zh: string | null;
  category: string | null;
  pricing_type: string | null;
  rating: number | null;
  review_count: number | null;
  click_count: number | null;
  logo_url: string | null;
  affiliate_url: string | null;
  official_url: string | null;
  created_at: string | null;
};

type RankConfig = {
  en: { title: string; intro: string };
  zh: { title: string; intro: string };
  filter?: (t: Tool) => boolean;
  sort: (a: Tool, b: Tool) => number;
  metric: "popular" | "rating" | "new";
};

const RANKINGS: Record<string, RankConfig> = {
  "most-popular": {
    en: { title: "Most Popular AI Tools", intro: "The AI tools our visitors click through to most — ranked by outbound visits. A practical popularity signal: these are the tools people actually choose after comparing options on Jilo.ai." },
    zh: { title: "最受欢迎的 AI 工具", intro: "访客点击访问最多的 AI 工具 —— 按出站点击量排名。这是一个务实的热度信号:这些是用户在 Jilo.ai 对比后真正选择的工具。" },
    sort: (a, b) => (b.click_count || 0) - (a.click_count || 0),
    metric: "popular",
  },
  "top-rated": {
    en: { title: "Top-Rated AI Tools", intro: "AI tools ranked by rating. We surface the tools that score highest so you can shortlist by quality before diving into pricing and features." },
    zh: { title: "评分最高的 AI 工具", intro: "按评分排名的 AI 工具。我们把得分最高的工具排在前面,方便你先按质量筛选,再深入看定价和功能。" },
    filter: (t) => (t.rating || 0) > 0,
    sort: (a, b) => (b.rating || 0) - (a.rating || 0),
    metric: "rating",
  },
  "newest": {
    en: { title: "Newest AI Tools", intro: "The most recently added AI tools on Jilo.ai. New launches move fast — this is the freshest set of tools worth a look this week." },
    zh: { title: "最新 AI 工具", intro: "Jilo.ai 最近收录的 AI 工具。新品发布很快 —— 这是本周最值得一看的最新工具。" },
    sort: (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")),
    metric: "new",
  },
  "best-free": {
    en: { title: "Best Free AI Tools", intro: "Free and freemium AI tools ranked by popularity. Start here if you want real capability without a subscription — every tool below has a free tier." },
    zh: { title: "最佳免费 AI 工具", intro: "按热度排名的免费及免费增值 AI 工具。如果你想不订阅就用上真本事,从这里开始 —— 下面每个工具都有免费档。" },
    filter: (t) => ["free", "freemium"].includes((t.pricing_type || "").toLowerCase()),
    sort: (a, b) => (b.click_count || 0) - (a.click_count || 0),
    metric: "popular",
  },
};

const TYPES = Object.keys(RANKINGS);

export function generateStaticParams() {
  return ["en", "zh"].flatMap((locale) => TYPES.map((type) => ({ locale, type })));
}

export function generateMetadata({ params }: { params: { locale: string; type: string } }): Metadata {
  const cfg = RANKINGS[params.type];
  if (!cfg) return {};
  const isZh = params.locale === "zh";
  const copy = isZh ? cfg.zh : cfg.en;
  const title = `${copy.title} (2026) | Jilo.ai`;
  return {
    title,
    description: copy.intro.slice(0, 160),
    alternates: {
      canonical: `https://www.jilo.ai/${params.locale}/rankings/${params.type}`,
      languages: {
        en: `https://www.jilo.ai/en/rankings/${params.type}`,
        zh: `https://www.jilo.ai/zh/rankings/${params.type}`,
      },
    },
  };
}

function pricingLabel(p: string | null, isZh: boolean) {
  switch ((p || "").toLowerCase()) {
    case "free": return isZh ? "免费" : "Free";
    case "freemium": return isZh ? "免费增值" : "Freemium";
    case "paid":
    case "subscription": return isZh ? "付费" : "Paid";
    default: return "—";
  }
}

export default async function RankingPage({ params }: { params: { locale: string; type: string } }) {
  const { locale, type } = params;
  const cfg = RANKINGS[type];
  if (!cfg) notFound();

  const isZh = locale === "zh";
  const copy = isZh ? cfg.zh : cfg.en;

  const { data } = await supabase
    .from("tools")
    .select("slug, name_en, name_zh, tagline_en, tagline_zh, category, pricing_type, rating, review_count, click_count, logo_url, affiliate_url, official_url, created_at")
    .eq("status", "published");

  let tools = (data as Tool[]) || [];
  if (cfg.filter) tools = tools.filter(cfg.filter);
  tools = tools.slice().sort(cfg.sort).slice(0, 50);

  const name = (t: Tool) => (isZh ? t.name_zh || t.name_en : t.name_en || t.name_zh) || t.slug;
  const tagline = (t: Tool) => (isZh ? t.tagline_zh || t.tagline_en : t.tagline_en || t.tagline_zh) || "";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.title,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.jilo.ai/${locale}/tools/${t.slug}`,
      name: name(t),
    })),
  };

  const otherRankings = TYPES.filter((tp) => tp !== type);

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-10 md:py-12">
            <nav className="mb-4 text-sm text-slate-500">
              <Link href={`/${locale}/rankings`} className="hover:text-slate-900">
                {isZh ? "排行榜" : "Rankings"}
              </Link>
              <span className="mx-2">/</span>
              <span>{copy.title}</span>
            </nav>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              <TrendingUp className="h-7 w-7 text-emerald-600" />
              {copy.title} <span className="text-slate-400">2026</span>
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{copy.intro}</p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8">
          <div className="overflow-hidden rounded-lg border">
            <div className="hidden bg-slate-950 px-4 py-3 text-sm font-semibold text-white md:grid md:grid-cols-[40px_1.6fr_0.8fr_0.7fr_0.7fr_90px]">
              <div>#</div>
              <div>{isZh ? "工具" : "Tool"}</div>
              <div>{isZh ? "分类" : "Category"}</div>
              <div>{isZh ? "定价" : "Pricing"}</div>
              <div>{cfg.metric === "rating" ? (isZh ? "评分" : "Rating") : isZh ? "热度" : "Popularity"}</div>
              <div className="text-right">{isZh ? "访问" : "Visit"}</div>
            </div>
            {tools.map((t, i) => {
              const canVisit = Boolean(t.affiliate_url || t.official_url);
              return (
                <div
                  key={t.slug}
                  className="grid gap-2 border-t px-4 py-3 text-sm md:grid-cols-[40px_1.6fr_0.8fr_0.7fr_0.7fr_90px] md:items-center"
                >
                  <div className="font-bold text-slate-400">{i + 1}</div>
                  <div className="min-w-0">
                    <Link href={`/${locale}/tools/${t.slug}`} className="flex items-center gap-2 font-semibold text-slate-950 hover:text-primary">
                      {t.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.logo_url} alt={name(t)} className="h-7 w-7 rounded object-contain" />
                      ) : null}
                      <span className="truncate">{name(t)}</span>
                    </Link>
                    {tagline(t) ? <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{tagline(t)}</p> : null}
                  </div>
                  <div className="text-slate-600">{t.category || "—"}</div>
                  <div className="text-slate-600">{pricingLabel(t.pricing_type, isZh)}</div>
                  <div className="text-slate-700">
                    {cfg.metric === "rating" ? (
                      t.rating ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          {t.rating}
                          {t.review_count ? <span className="text-slate-400">({t.review_count})</span> : null}
                        </span>
                      ) : "—"
                    ) : cfg.metric === "new" ? (
                      t.created_at ? String(t.created_at).slice(0, 10) : "—"
                    ) : (
                      <span>{t.click_count || 0}</span>
                    )}
                  </div>
                  <div className="md:text-right">
                    {canVisit ? (
                      <a
                        href={`/api/out?tool=${encodeURIComponent(t.slug)}&source=rankings&locale=${encodeURIComponent(locale)}`}
                        target="_blank"
                        rel="sponsored nofollow noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                      >
                        {isZh ? "访问" : "Visit"}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <Link href={`/${locale}/tools/${t.slug}`} className="text-primary hover:underline">
                        {isZh ? "详情" : "Details"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            {tools.length === 0 ? (
              <div className="border-t px-4 py-10 text-center text-slate-500">
                {isZh ? "暂无数据" : "No tools yet"}
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {isZh ? "更多排行榜" : "More rankings"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherRankings.map((tp) => (
                <Link
                  key={tp}
                  href={`/${locale}/rankings/${tp}`}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-950"
                >
                  {(isZh ? RANKINGS[tp].zh : RANKINGS[tp].en).title}
                </Link>
              ))}
              <Link href={`/${locale}/tools`} className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-primary hover:underline">
                {isZh ? "浏览全部工具 →" : "Browse all tools →"}
              </Link>
            </div>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
