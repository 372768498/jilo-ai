// app/[locale]/news/[slug]/page.tsx
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import Image from "next/image";

type PageProps = {
  params: { locale: string; slug: string };
};

function coalesceByLocale(
  locale: string,
  en?: string | null,
  zh?: string | null,
  fallback?: string | null
) {
  const l = (locale || "en").toLowerCase();
  if (l.startsWith("zh")) return zh || en || fallback || "";
  return en || zh || fallback || "";
}

async function getNews(slug: string) {
  // 详情页直接读表，以便拿到 content_* 等完整字段
  const { data, error } = await supabase
    .from("news")
    .select(
      [
        "slug",
        "title_en", "title_zh",
        "summary_en", "summary_zh",
        "content_en", "content_zh",
        "source", "source_url",
        "cover_url", "cover_image_url",
        "published_at", "updated_at", "created_at",
        "tags_en", "tags_zh",
        "meta_title_en", "meta_title_zh",
        "meta_description_en", "meta_description_zh"
      ].join(", ")
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ————— SEO: 动态 Metadata —————
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const n = await getNews(params.slug);
  if (!n) return {};

  const title = coalesceByLocale(params.locale, n.meta_title_en, n.meta_title_zh) ||
                coalesceByLocale(params.locale, n.title_en, n.title_zh) ||
                "Jilo.ai News";

  const description = coalesceByLocale(params.locale, n.meta_description_en, n.meta_description_zh) ||
                      coalesceByLocale(params.locale, n.summary_en, n.summary_zh) || "";

  const cover = (n.cover_url || n.cover_image_url) || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: cover ? [{ url: cover }] : undefined,
      publishedTime: n.published_at || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { locale, slug } = params;
  const n = await getNews(slug);

  if (!n) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-2">{locale === "zh" ? "未找到该新闻" : "News not found"}</h1>
      </div>
    );
  }

  const title = coalesceByLocale(locale, n.title_en, n.title_zh);
  const summary = coalesceByLocale(locale, n.summary_en, n.summary_zh);
  const content = coalesceByLocale(locale, n.content_en, n.content_zh);
  const cover = (n.cover_url || n.cover_image_url) || "";
  const published = n.published_at ? new Date(n.published_at).toISOString() : undefined;
  const updated = n.updated_at ? new Date(n.updated_at).toISOString() : published;

  // JSON-LD（Article）— author/publisher 均用 Jilo.ai
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": summary || undefined,
    "image": cover ? [cover] : undefined,
    "datePublished": published,
    "dateModified": updated,
    "author": { "@type": "Organization", "name": "Jilo.ai" },
    "publisher": {
      "@type": "Organization",
      "name": "Jilo.ai",
      "logo": cover ? { "@type": "ImageObject", "url": cover } : undefined
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `https://www.jilo.ai/${locale}/news/${slug}` }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-3">{title}</h1>

      <div className="text-sm text-muted-foreground mb-4">
        {published ? new Date(published).toISOString().slice(0,10) : ""}
        {n.source ? ` · ${n.source}` : ""}
        {n.source_url ? (
          <>
            {" · "}
            <a href={n.source_url} target="_blank" rel="noopener noreferrer" className="underline">
              {locale === "zh" ? "原文链接" : "Original"}
            </a>
          </>
        ) : null}
      </div>

      {cover && (
        // 用 img 以避免外域图片的 next/image 域名限制
        <img src={cover} alt={title} className="w-full rounded-xl mb-6 object-cover" />
      )}

      {summary && <p className="text-base mb-4">{summary}</p>}

      {/* 如果 content 是 HTML，就按 HTML 渲染；如果是纯文本，保持段落显示 */}
      {content ? (
        /<\/[a-z][\s\S]*>/i.test(content) ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="prose max-w-none whitespace-pre-line">{content}</div>
        )
      ) : null}

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
