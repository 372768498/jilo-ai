import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import fs from "fs";
import path from "path";

type PageProps = { params: { locale: string; slug: string } };

const bestMeta: Record<string, {
  category: string;
  title_en: string;
  title_zh: string;
  description_en: string;
  description_zh: string;
  count: number;
  icon: string;
  lastUpdated: string;
}> = {
  "best-ai-writing-tools": {
    category: "Writing", icon: "✍️", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Writing Tools in 2026: Expert Tested & Reviewed",
    title_zh: "2026年15个最佳AI写作工具：专业评测",
    description_en: "Comprehensive guide to the best AI writing tools for content creation, blogging, copywriting, and more.",
    description_zh: "全面指南：最佳AI写作工具。",
  },
  "best-ai-coding-tools": {
    category: "Coding", icon: "💻", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Coding Tools in 2026: Developer's Guide",
    title_zh: "2026年15个最佳AI编程工具",
    description_en: "The best AI tools for programming, code generation, debugging and developer productivity.",
    description_zh: "最佳AI编程工具指南。",
  },
  "best-ai-design-tools": {
    category: "Design", icon: "🎨", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Design Tools in 2026",
    title_zh: "2026年15个最佳AI设计工具",
    description_en: "Top AI tools for graphic design, illustration, UI/UX, and creative work.",
    description_zh: "最佳AI设计工具。",
  },
  "best-ai-video-tools": {
    category: "Video", icon: "🎬", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Video Tools in 2026",
    title_zh: "2026年15个最佳AI视频工具",
    description_en: "Best AI tools for video creation, editing, and production.",
    description_zh: "最佳AI视频工具。",
  },
  "best-ai-tools-for-business": {
    category: "Business", icon: "💼", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Tools for Business in 2026",
    title_zh: "2026年15个最佳AI商业工具",
    description_en: "Top AI tools for business operations, analytics, and automation.",
    description_zh: "最佳AI商业工具。",
  },
  "best-ai-data-analysis-tools": {
    category: "Data Analysis", icon: "📊", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Data Analysis Tools in 2026",
    title_zh: "2026年15个最佳AI数据分析工具",
    description_en: "Top AI tools for data analysis, visualization, and business intelligence.",
    description_zh: "最佳AI数据分析工具。",
  },
  "best-ai-voice-tools": {
    category: "Voice & Audio", icon: "🎙️", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Voice & Audio Tools in 2026",
    title_zh: "2026年15个最佳AI语音工具",
    description_en: "Top AI tools for text-to-speech, voice cloning, and audio production.",
    description_zh: "最佳AI语音工具。",
  },
  "best-ai-translation-tools": {
    category: "Translation", icon: "🌐", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Translation Tools in 2026",
    title_zh: "2026年15个最佳AI翻译工具",
    description_en: "Top AI tools for translation, localization, and multilingual content.",
    description_zh: "最佳AI翻译工具。",
  },
  "best-ai-tools-for-education": {
    category: "Education", icon: "🎓", count: 15, lastUpdated: "2026-02-01",
    title_en: "15 Best AI Tools for Education in 2026",
    title_zh: "2026年15个最佳AI教育工具",
    description_en: "Top AI tools for learning, teaching, and educational content creation.",
    description_zh: "最佳AI教育工具。",
  },
  "best-free-ai-tools": {
    category: "Free Tools", icon: "🆓", count: 20, lastUpdated: "2026-02-01",
    title_en: "20 Best Free AI Tools in 2026 (No Credit Card Required)",
    title_zh: "2026年20个最佳免费AI工具",
    description_en: "The best free AI tools you can use right now without paying anything.",
    description_zh: "无需付费的最佳免费AI工具。",
  },
};

function getContent(slug: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "content", "best-tools", `${slug}.md`);
    let content = fs.readFileSync(filePath, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (fmMatch) content = content.slice(fmMatch[0].length);
    return content.trim();
  } catch { return null; }
}

function markdownToHtml(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (m) => {
      const c = m.replace(/```\w*\n?/, '').replace(/```$/, '');
      return `<pre class="bg-secondary p-4 rounded-lg overflow-x-auto my-4"><code>${c}</code></pre>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => `<td class="px-4 py-2 border">${c.trim()}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    })
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(?!<[hltpuo])/gm, (match) => match ? `<p class="mb-4">${match}` : match);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const meta = bestMeta[params.slug];
  if (!meta) return {};
  const isZh = params.locale === 'zh';
  return {
    title: isZh ? meta.title_zh : meta.title_en,
    description: isZh ? meta.description_zh : meta.description_en,
    openGraph: {
      title: isZh ? meta.title_zh : meta.title_en,
      description: isZh ? meta.description_zh : meta.description_en,
      url: `https://jilo.ai/${params.locale}/best/${params.slug}`,
      type: 'article',
      images: [{
        url: `https://jilo.ai/api/og?title=${encodeURIComponent(isZh ? meta.title_zh : meta.title_en)}&subtitle=${encodeURIComponent(`${meta.count} tools • Expert reviewed`)}`,
        width: 1200, height: 630,
      }],
    },
    alternates: { canonical: `https://jilo.ai/${params.locale}/best/${params.slug}` },
  };
}

export function generateStaticParams() {
  return Object.keys(bestMeta).map(slug => ({ slug }));
}

export default function BestToolPage({ params }: PageProps) {
  const meta = bestMeta[params.slug];
  if (!meta) notFound();
  const isZh = params.locale === 'zh';
  const content = getContent(params.slug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": isZh ? meta.title_zh : meta.title_en,
    "description": isZh ? meta.description_zh : meta.description_en,
    "datePublished": meta.lastUpdated,
    "dateModified": meta.lastUpdated,
    "author": { "@type": "Organization", "name": "Jilo.ai", "url": "https://jilo.ai" },
    "publisher": { "@type": "Organization", "name": "Jilo.ai", "url": "https://jilo.ai" },
    "mainEntityOfPage": `https://jilo.ai/${params.locale}/best/${params.slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={params.locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/${params.locale}`} className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href={`/${params.locale}/best`} className="hover:text-foreground">Best Tools</Link>
          <span>/</span>
          <span>{meta.category}</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{meta.icon}</span>
            <Badge>{meta.category}</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isZh ? meta.title_zh : meta.title_en}
          </h1>
          <p className="text-muted-foreground mb-4">
            {isZh ? meta.description_zh : meta.description_en}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>📅 Updated: {meta.lastUpdated}</span>
            <span>🔢 {meta.count} tools reviewed</span>
          </div>
        </div>

        {content ? (
          <article 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Content coming soon...</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 p-6 bg-secondary/50 rounded-xl">
          <h3 className="font-bold mb-3">
            {isZh ? '探索更多类别' : 'Explore More Categories'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(bestMeta)
              .filter(([slug]) => slug !== params.slug)
              .slice(0, 5)
              .map(([slug, m]) => (
                <Link key={slug} href={`/${params.locale}/best/${slug}`}>
                  <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                    {m.icon} {m.category}
                  </Badge>
                </Link>
              ))}
          </div>
        </div>
      </main>
      <Footer locale={params.locale} />
    </div>
  );
}
