// app/[locale]/news/[slug]/page.tsx
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

type PageProps = {
  params: { locale: string; slug: string };
};

type NewsItem = {
  slug: string;
  title_en: string | null;
  title_zh: string | null;
  summary_en: string | null;
  summary_zh: string | null;
  content_en: string | null;
  content_zh: string | null;
  source: string | null;
  source_url: string | null;
  cover_url: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  tags_en: string[] | null;
  tags_zh: string[] | null;
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

async function getNews(slug: string): Promise<NewsItem | null> {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as NewsItem | null;
}

// ————— SEO: 动态 Metadata —————
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const n = await getNews(params.slug);
  if (!n) return {};

  const title = coalesceByLocale(params.locale, n.title_en, n.title_zh) || "Jilo.ai News";
  const description = coalesceByLocale(params.locale, n.summary_en, n.summary_zh) || "";
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
        <h1 className="text-2xl font-semibold mb-2">
          {locale === "zh" ? "未找到该新闻" : "News not found"}
        </h1>
      </div>
    );
  }

  const title = coalesceByLocale(locale, n.title_en, n.title_zh);
  const summary = coalesceByLocale(locale, n.summary_en, n.summary_zh);
  const content = coalesceByLocale(locale, n.content_en, n.content_zh);
  const cover = (n.cover_url || n.cover_image_url) || "";
  const published = n.published_at ? new Date(n.published_at).toISOString() : undefined;
  const updated = n.updated_at ? new Date(n.updated_at).toISOString() : published;

  // JSON-LD（Article）
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: summary || undefined,
    image: cover ? [cover] : undefined,
    datePublished: published,
    dateModified: updated,
    author: { "@type": "Organization", name: "Jilo.ai" },
    publisher: {
      "@type": "Organization",
      name: "Jilo.ai",
      logo: cover ? { "@type": "ImageObject", url: cover } : undefined,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.jilo.ai/${locale}/news/${slug}`,
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-3">{title}</h1>

      <div className="text-sm text-muted-foreground mb-4">
        {published ? new Date(published).toISOString().slice(0, 10) : ""}
        {n.source ? ` · ${n.source}` : ""}
        {n.source_url ? (
          <>
            {" · "}
            <a
              href={n.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {locale === "zh" ? "原文链接" : "Original"}
            </a>
          </>
        ) : null}
      </div>

      {cover && (
        <img
          src={cover}
          alt={title}
          className="w-full rounded-xl mb-6 object-cover"
        />
      )}

      {summary && <p className="text-base mb-4">{summary}</p>}

      {content ? (
        /<\/[a-z][\s\S]*>/i.test(content) ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="prose max-w-none whitespace-pre-line">{content}</div>
        )
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}