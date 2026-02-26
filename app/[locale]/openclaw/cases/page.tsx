import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, DollarSign, TrendingUp, Zap } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";
import casesData from "@/content/openclaw-cases.json";

export const revalidate = 600;

type PageProps = {
  params: { locale: string };
};

const DIFFICULTY: Record<string, { en: string; zh: string; color: string }> = {
  easy: { en: "Easy", zh: "简单", color: "bg-green-100 text-green-700" },
  medium: { en: "Medium", zh: "中等", color: "bg-yellow-100 text-yellow-700" },
  hard: { en: "Hard", zh: "困难", color: "bg-red-100 text-red-700" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params?.locale === "zh";
  const locale = params?.locale || "en";
  const altLocale = isZh ? "en" : "zh";

  const title = isZh
    ? "OpenClaw 赚钱案例 - AI Agent 变现指南 2026 | Jilo.ai"
    : "OpenClaw Money-Making Cases - AI Agent Revenue Guide 2026 | Jilo.ai";
  const description = isZh
    ? "7个已验证的 OpenClaw AI Agent 赚钱案例，从$600/月到$121K/72小时。包含详细收入数据、利润率和实操工具。"
    : "7 verified OpenClaw AI agent money-making cases, from $600/mo to $121K in 72 hours. Detailed revenue data, margins, and tools.";

  return {
    title,
    description,
    openGraph: { title, description, url: `https://jilo.ai/${locale}/openclaw/cases` },
    alternates: {
      canonical: `https://jilo.ai/${locale}/openclaw/cases`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/openclaw/cases`,
        [altLocale]: `https://jilo.ai/${altLocale}/openclaw/cases`,
      },
    },
  };
}

export default async function OpenClawCasesPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const t = isZh
    ? {
        hero: "OpenClaw 赚钱案例",
        subtitle: "7个已验证的 AI Agent 变现模式，从$600/月到$121K/72小时",
        revenue: "收入",
        margin: "利润率",
        difficulty: "难度",
        tools: "所需工具",
        details: "详细案例",
        backToSkills: "← 返回 Skills 列表",
        updated: "数据更新于 2026年2月",
        cta: "开始搭建你的 AI Agent →",
      }
    : {
        hero: "OpenClaw Money-Making Cases",
        subtitle: "7 verified AI agent revenue models, from $600/mo to $121K in 72 hours",
        revenue: "Revenue",
        margin: "Margin",
        difficulty: "Difficulty",
        tools: "Tools Required",
        details: "Case Details",
        backToSkills: "← Back to Skills",
        updated: "Data updated Feb 2026",
        cta: "Start Building Your AI Agent →",
      };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: isZh ? "OpenClaw 赚钱案例 2026" : "OpenClaw Money-Making Cases 2026",
    description: isZh
      ? "7个已验证的 OpenClaw AI Agent 赚钱案例"
      : "7 verified OpenClaw AI agent money-making cases",
    url: `https://jilo.ai/${locale}/openclaw/cases`,
    publisher: { "@type": "Organization", name: "Jilo.ai" },
  };

  return (
    <>
      <Navbar locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Hero */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="text-5xl mb-4">💰</div>
            <h1 className="text-4xl font-bold mb-3">{t.hero}</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">{t.subtitle}</p>
            <p className="text-sm opacity-60 mt-4">{t.updated}</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <a href={`/${locale}/openclaw`} className="text-green-600 hover:underline text-sm mb-8 inline-block">
            {t.backToSkills}
          </a>

          {/* Cases Grid */}
          <div className="grid gap-6">
            {casesData.map((c: any) => {
              const diff = DIFFICULTY[c.difficulty] || DIFFICULTY.medium;
              return (
                <Card key={c.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Icon + Revenue */}
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 md:w-64 flex flex-col items-center justify-center">
                        <span className="text-4xl mb-2">{c.icon}</span>
                        <div className="text-2xl font-bold text-center">{isZh ? c.revenue_zh : c.revenue}</div>
                        <div className="flex items-center gap-1 mt-2 text-sm opacity-80">
                          <TrendingUp className="w-3 h-3" />
                          {t.margin}: {c.margin}
                        </div>
                      </div>
                      {/* Right: Details */}
                      <div className="p-6 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-bold">{isZh ? c.title_zh : c.title}</h2>
                          <Badge className={diff.color}>{isZh ? diff.zh : diff.en}</Badge>
                        </div>
                        <p className="text-slate-600 mb-4">{isZh ? c.summary_zh : c.summary}</p>
                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                          <h3 className="text-sm font-semibold text-slate-500 mb-1">{t.details}</h3>
                          <p className="text-sm text-slate-700">{isZh ? c.details_zh : c.details}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {c.tools.map((tool: string) => (
                            <Badge key={tool} variant="outline" className="border-green-200 text-green-700 text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 mb-8">
            <a
              href={`/${locale}/openclaw`}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition"
            >
              {t.cta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  );
}
