import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";
import fs from "fs";
import path from "path";

type PageProps = { params: { locale: string } };

interface WeeklyMeta {
  slug: string;
  title_en: string;
  title_zh: string;
  week: string;
  date_range: string;
  published_at: string;
  description_en: string;
  description_zh: string;
}

function parseFrontMatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return meta;
}

function getAllWeeklies(): WeeklyMeta[] {
  const dir = path.join(process.cwd(), "content", "weekly");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().reverse();

  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    const meta = parseFrontMatter(raw);
    const slug = f.replace(/\.md$/, "");
    return {
      slug,
      title_en: meta.title_en || `Weekly Digest ${slug}`,
      title_zh: meta.title_zh || `AI工具周刊 ${slug}`,
      week: meta.week || slug,
      date_range: meta.date_range || "",
      published_at: meta.published_at || "",
      description_en: meta.description_en || "",
      description_zh: meta.description_zh || "",
    };
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params.locale === "zh";
  const locale = params.locale || "en";
  return {
    title: isZh ? "AI工具周刊 - Jilo.ai" : "Weekly AI Digest - Jilo.ai",
    description: isZh
      ? "每周精选 AI 工具推荐、行业头条和趋势分析。订阅 Jilo.ai 周刊，不错过任何 AI 新动态。"
      : "Weekly curated AI tool recommendations, industry headlines and trend analysis. Stay informed with Jilo.ai Weekly.",
    openGraph: {
      title: isZh ? "AI工具周刊 | Jilo.ai" : "Weekly AI Digest | Jilo.ai",
      description: isZh ? "每周精选 AI 工具与行业动态" : "Weekly curated AI tools and industry trends",
      url: `https://jilo.ai/${locale}/weekly`,
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/weekly`,
      languages: {
        en: "https://jilo.ai/en/weekly",
        zh: "https://jilo.ai/zh/weekly",
      },
    },
  };
}

export default function WeeklyListPage({ params }: PageProps) {
  const { locale } = params;
  const isZh = locale === "zh";
  const weeklies = getAllWeeklies();

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <nav className="text-sm mb-4 text-muted-foreground">
            <Link href={`/${locale}`} className="hover:text-foreground">
              {isZh ? "首页" : "Home"}
            </Link>
            {" / "}
            <span className="text-foreground">{isZh ? "AI工具周刊" : "Weekly Digest"}</span>
          </nav>
          <h1 className="text-4xl font-bold mb-3">
            {isZh ? "📬 AI工具周刊" : "📬 Weekly AI Digest"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isZh
              ? "每周精选 AI 工具推荐、行业头条和趋势分析，帮你快速掌握 AI 领域最新动态。"
              : "Weekly curated AI tool picks, industry headlines, and trend analysis to keep you ahead in the AI space."}
          </p>
        </div>

        {/* Weekly List */}
        {weeklies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-xl text-muted-foreground">
              {isZh ? "首期周刊即将发布，敬请期待！" : "First issue coming soon — stay tuned!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {weeklies.map((w, i) => (
              <Link
                key={w.slug}
                href={`/${locale}/weekly/${w.slug}`}
                className="block border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {i === 0 && (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                          {isZh ? "最新" : "Latest"}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground font-mono">{w.week}</span>
                      {w.date_range && (
                        <span className="text-sm text-muted-foreground">· {w.date_range}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold group-hover:text-primary transition line-clamp-2">
                      {isZh ? w.title_zh : w.title_en}
                    </h2>
                    {(isZh ? w.description_zh : w.description_en) && (
                      <p className="mt-2 text-muted-foreground line-clamp-2">
                        {isZh ? w.description_zh : w.description_en}
                      </p>
                    )}
                  </div>
                  <div className="text-2xl text-muted-foreground group-hover:text-primary transition shrink-0 mt-2">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 bg-secondary/50 rounded-xl text-center">
          <h3 className="text-xl font-bold mb-2">
            {isZh ? "发现更多 AI 工具" : "Discover More AI Tools"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isZh
              ? "浏览我们的 AI 工具目录，找到最适合你的工具。"
              : "Browse our AI tools directory to find the perfect tool for your needs."}
          </p>
          <Link
            href={`/${locale}/tools`}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            {isZh ? "浏览工具目录" : "Browse Tools"} →
          </Link>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
