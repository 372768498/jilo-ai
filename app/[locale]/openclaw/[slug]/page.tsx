import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Download, Terminal, ExternalLink, Github } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";
import skillsData from "@/content/openclaw-skills.json";

export const revalidate = 600;

type PageProps = {
  params: { locale: string; slug: string };
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
  const { slug, locale } = params;
  const isZh = locale === "zh";
  const altLocale = isZh ? "en" : "zh";

  const skill = skillsData.find((s: any) => s.slug === slug);

  if (!skill) return { title: "Not Found" };

  const title = isZh
    ? `${skill.name} - OpenClaw Skill | Jilo.ai`
    : `${skill.name} - OpenClaw Skill | Jilo.ai`;
  const desc = isZh ? skill.description_zh || skill.description : skill.description;

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url: `https://jilo.ai/${locale}/openclaw/${slug}` },
    alternates: {
      canonical: `https://jilo.ai/${locale}/openclaw/${slug}`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/openclaw/${slug}`,
        [altLocale]: `https://jilo.ai/${altLocale}/openclaw/${slug}`,
      },
    },
  };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { slug, locale } = params;
  const isZh = locale === "zh";

  const skill = skillsData.find((s: any) => s.slug === slug);

  if (!skill) notFound();

  const cat = CATEGORIES[skill.category] || CATEGORIES.other;
  const desc = isZh ? skill.description_zh || skill.description : skill.description;

  const t = isZh
    ? { install: "安装命令", links: "相关链接", github: "GitHub", clawhub: "ClawHub", tags: "标签", back: "← 返回列表", downloads: "下载量", rating: "评分" }
    : { install: "Install Command", links: "Links", github: "GitHub", clawhub: "ClawHub", tags: "Tags", back: "← Back to list", downloads: "Downloads", rating: "Rating" };

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: skill.name,
    description: desc,
    applicationCategory: "AI Agent Skill",
    operatingSystem: "Cross-platform",
    url: `https://jilo.ai/${locale}/openclaw/${slug}`,
    aggregateRating: skill.rating ? { "@type": "AggregateRating", ratingValue: skill.rating, bestRating: 5 } : undefined,
  };

  return (
    <>
      <Navbar locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Back link */}
          <a href={`/${locale}/openclaw`} className="text-orange-600 hover:underline text-sm mb-6 inline-block">
            {t.back}
          </a>

          {/* Hero */}
          <div className={`rounded-2xl bg-gradient-to-br ${cat.gradient} p-8 mb-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{cat.icon}</span>
              <div>
                <h1 className="text-3xl font-bold">{skill.name}</h1>
                <Badge className="bg-white/20 text-white mt-1">{isZh ? cat.zh : cat.en}</Badge>
              </div>
            </div>
            <p className="text-lg opacity-90">{desc}</p>
            <div className="flex gap-6 mt-6">
              <span className="flex items-center gap-1"><Star className="w-4 h-4" /> {skill.rating}</span>
              <span className="flex items-center gap-1"><Download className="w-4 h-4" /> {skill.downloads?.toLocaleString()} {t.downloads}</span>
            </div>
          </div>

          {/* Install */}
          {skill.install_command && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-orange-600" /> {t.install}
                </h2>
                <code className="block bg-slate-900 text-green-400 p-4 rounded-lg text-sm font-mono">
                  $ {skill.install_command}
                </code>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg mb-3">{t.links}</h2>
              <div className="flex flex-col gap-3">
                {skill.github_url && (
                  <a href={skill.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 transition">
                    <Github className="w-4 h-4" /> {t.github} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {skill.clawhub_url && (
                  <a href={skill.clawhub_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 transition">
                    <span>🦞</span> {t.clawhub} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {skill.tags && skill.tags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-3">{t.tags}</h2>
                <div className="flex flex-wrap gap-2">
                  {skill.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="border-orange-200 text-orange-700">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer locale={locale} />
    </>
  );
}
