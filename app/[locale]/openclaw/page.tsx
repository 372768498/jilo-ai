import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Download, Terminal } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const revalidate = 600;

type PageProps = {
  params: { locale: string };
};

const CATEGORIES: Record<string, { en: string; zh: string; icon: string; gradient: string }> = {
  research: { en: "Research", zh: "研究", icon: "🔬", gradient: "from-blue-500 to-indigo-600" },
  marketing: { en: "Marketing", zh: "营销", icon: "📈", gradient: "from-green-500 to-emerald-600" },
  trends: { en: "Trends", zh: "趋势", icon: "🔥", gradient: "from-orange-500 to-red-500" },
  content: { en: "Content", zh: "内容", icon: "✍️", gradient: "from-purple-500 to-pink-500" },
  automation: { en: "Automation", zh: "自动化", icon: "⚡", gradient: "from-yellow-500 to-orange-500" },
  other: { en: "Other", zh: "其他", icon: "🧩", gradient: "from-slate-500 to-slate-600" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params?.locale === "zh";
  const locale = params?.locale || "en";
  const altLocale = isZh ? "en" : "zh";

  return {
    title: isZh
      ? "OpenClaw Skills - AI Agent 技能市场 | Jilo.ai"
      : "OpenClaw Skills - AI Agent Skill Marketplace | Jilo.ai",
    description: isZh
      ? "发现和评测最佳 OpenClaw Skills，自动化研究、营销、内容创作和趋势监控。5700+ Skills 精选推荐。"
      : "Discover and review the best OpenClaw Skills for research, marketing, content creation and trend monitoring. 5700+ curated skills.",
    openGraph: {
      title: isZh ? "OpenClaw Skills | Jilo.ai" : "OpenClaw Skills | Jilo.ai",
      description: isZh ? "AI Agent 技能市场" : "AI Agent Skill Marketplace",
      url: `https://jilo.ai/${locale}/openclaw`,
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/openclaw`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/openclaw`,
        [altLocale]: `https://jilo.ai/${altLocale}/openclaw`,
      },
    },
  };
}

export default async function OpenClawSkillsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const { data: skills } = await supabase
    .from("openclaw_skills")
    .select("*")
    .order("featured", { ascending: false })
    .order("downloads", { ascending: false });

  const categories = Array.from(new Set(skills?.map((s: any) => s.category) || []));

  const t = isZh
    ? {
        title: "OpenClaw Skills",
        subtitle: "AI Agent 技能市场",
        desc: "发现最佳 AI Agent 技能，自动化你的工作流",
        total: `${skills?.length || 0} 个技能`,
        featured: "精选",
        install: "安装命令",
        downloads: "下载",
        view: "查看详情",
      }
    : {
        title: "OpenClaw Skills",
        subtitle: "AI Agent Skill Marketplace",
        desc: "Discover the best AI agent skills to automate your workflow",
        total: `${skills?.length || 0} skills`,
        featured: "Featured",
        install: "Install",
        downloads: "downloads",
        view: "View Details",
      };

  const getName = (s: any) => s.name;
  const getDesc = (s: any) => (isZh ? s.description_zh || s.description : s.description);
  const getCat = (cat: string) => {
    const c = CATEGORIES[cat] || CATEGORIES.other;
    return isZh ? c.zh : c.en;
  };
  const getCatStyle = (cat: string) => CATEGORIES[cat] || CATEGORIES.other;

  return (
    <>
      <Navbar locale={locale} />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🦞</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
              {t.title}
            </h1>
            <p className="text-xl text-slate-600 mb-4">{t.subtitle}</p>
            <p className="text-slate-500 mb-4">{t.desc}</p>
            <Badge variant="outline" className="text-base px-4 py-1 border-orange-300 text-orange-700">
              {t.total}
            </Badge>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => {
              const style = getCatStyle(cat);
              return (
                <Badge key={cat} className={`bg-gradient-to-r ${style.gradient} text-white px-3 py-1 text-sm`}>
                  {style.icon} {getCat(cat)}
                </Badge>
              );
            })}
          </div>

          {/* Skills grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {skills?.map((skill) => {
              const style = getCatStyle(skill.category);
              return (
                <Card key={skill.id} className="group hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-orange-300 overflow-hidden">
                  <Link href={`/${locale}/openclaw/${skill.slug}`}>
                    <div className={`relative h-28 bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                      <div className="text-4xl opacity-90 group-hover:scale-110 transition-transform">
                        {style.icon}
                      </div>
                      {skill.featured && (
                        <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs">
                          ⭐ {t.featured}
                        </Badge>
                      )}
                      <Badge className="absolute top-3 right-3 bg-white/90 text-slate-700 text-xs">
                        {getCat(skill.category)}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg group-hover:text-orange-600 transition mb-2">
                        {getName(skill)}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4 min-h-[2.5rem]">
                        {getDesc(skill)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {skill.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {skill.downloads?.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                          {t.view} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>

          {(!skills || skills.length === 0) && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🦞</div>
              <p className="text-slate-600 text-lg">
                {isZh ? "暂无技能数据" : "No skills available yet"}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer locale={locale} />
    </>
  );
}
