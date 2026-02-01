import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import fs from "fs";
import path from "path";

type PageProps = { params: { locale: string; slug: string } };

function parseFrontMatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body: match[2] };
}

function getWeeklyContent(slug: string): { meta: Record<string, string>; body: string } | null {
  const filePath = path.join(process.cwd(), "content", "weekly", `${slug}.md`);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return parseFrontMatter(raw);
  } catch {
    return null;
  }
}

function getAllWeeklySlugs(): string[] {
  const dir = path.join(process.cwd(), "content", "weekly");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

// 简单 Markdown → HTML
function markdownToHtml(md: string): string {
  let html = md
    // 代码块
    .replace(/```[\s\S]*?```/g, (match) => {
      const content = match.replace(/```\w*\n?/, "").replace(/```$/, "");
      return `<pre class="bg-secondary p-4 rounded-lg overflow-x-auto my-4"><code>${content}</code></pre>`;
    })
    // H1
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-8 mb-3">$1</h3>')
    // H4
    .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold mt-6 mb-2">$1</h4>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-8 border-border" />')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/80" target="_blank" rel="noopener">$1</a>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Paragraphs (lines that aren't already HTML)
    .replace(/^(?!<[h|l|t|d|p|b|a|u|o|e])((?!^$).+)$/gm, '<p class="mb-4 leading-relaxed">$1</p>')
    // Clean up list items into lists
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      if (match.includes("list-decimal")) {
        return `<ol class="list-decimal my-4 space-y-1">${match}</ol>`;
      }
      return `<ul class="list-disc my-4 space-y-1">${match}</ul>`;
    });

  return html;
}

export async function generateStaticParams() {
  const slugs = getAllWeeklySlugs();
  const params: { locale: string; slug: string }[] = [];
  for (const slug of slugs) {
    params.push({ locale: "en", slug });
    params.push({ locale: "zh", slug });
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const data = getWeeklyContent(slug);
  if (!data) return {};

  const isZh = locale === "zh";
  const title = isZh ? data.meta.title_zh || data.meta.title_en : data.meta.title_en || `Weekly ${slug}`;
  const description = isZh
    ? data.meta.description_zh || data.meta.description_en
    : data.meta.description_en || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://jilo.ai/${locale}/weekly/${slug}`,
      siteName: "Jilo.ai",
      locale: isZh ? "zh_CN" : "en_US",
      publishedTime: data.meta.published_at,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/weekly/${slug}`,
      languages: {
        en: `https://jilo.ai/en/weekly/${slug}`,
        zh: `https://jilo.ai/zh/weekly/${slug}`,
      },
    },
  };
}

export default function WeeklyDetailPage({ params }: PageProps) {
  const { locale, slug } = params;
  const data = getWeeklyContent(slug);
  if (!data) return notFound();

  const isZh = locale === "zh";
  const title = isZh ? data.meta.title_zh || data.meta.title_en : data.meta.title_en || `Weekly ${slug}`;
  const description = isZh ? data.meta.description_zh : data.meta.description_en;

  // Find adjacent weeks for navigation
  const allSlugs = getAllWeeklySlugs().sort();
  const currentIdx = allSlugs.indexOf(slug);
  const prevSlug = currentIdx > 0 ? allSlugs[currentIdx - 1] : null;
  const nextSlug = currentIdx < allSlugs.length - 1 ? allSlugs[currentIdx + 1] : null;

  // Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: data.meta.published_at,
    dateModified: data.meta.published_at,
    author: { "@type": "Organization", name: "Jilo.ai", url: "https://jilo.ai" },
    publisher: { "@type": "Organization", name: "Jilo.ai" },
    mainEntityOfPage: `https://jilo.ai/${locale}/weekly/${slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {isZh ? "首页" : "Home"}
          </Link>
          {" / "}
          <Link href={`/${locale}/weekly`} className="hover:text-foreground">
            {isZh ? "AI工具周刊" : "Weekly Digest"}
          </Link>
          {" / "}
          <span className="text-foreground">{slug}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {isZh ? "周刊" : "Weekly"}
            </span>
            {data.meta.date_range && (
              <span className="text-sm text-muted-foreground">{data.meta.date_range}</span>
            )}
            {data.meta.published_at && (
              <time className="text-sm text-muted-foreground">
                {isZh ? "发布于 " : "Published "}
                {data.meta.published_at}
              </time>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          {description && <p className="text-xl text-muted-foreground">{description}</p>}
        </header>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(data.body) }}
        />

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t">
          {prevSlug ? (
            <Link
              href={`/${locale}/weekly/${prevSlug}`}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              ← {isZh ? "上一期" : "Previous"} ({prevSlug})
            </Link>
          ) : (
            <div />
          )}
          <Link
            href={`/${locale}/weekly`}
            className="text-muted-foreground hover:text-foreground"
          >
            {isZh ? "全部期刊" : "All Issues"}
          </Link>
          {nextSlug ? (
            <Link
              href={`/${locale}/weekly/${nextSlug}`}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              {isZh ? "下一期" : "Next"} ({nextSlug}) →
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 p-6 bg-secondary/50 rounded-xl text-center">
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
      </article>
      <Footer locale={locale} />
    </div>
  );
}
