// app/[locale]/reviews/[slug]/page.tsx
// Maps /reviews/ URLs → news table (SEO review articles)
// These URLs are already indexed by Google with significant impressions.
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

async function getArticle(slug: string): Promise<NewsItem | null> {
  // Try exact slug match first
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (data) return data as NewsItem;

  // Try partial match (slug may have been generated differently)
  const { data: fuzzy } = await supabase
    .from("news")
    .select("*")
    .ilike("slug", `%${slug.split("-").slice(0, 3).join("-")}%`)
    .limit(1)
    .maybeSingle();

  return fuzzy as NewsItem | null;
}

// ————— SEO: 动态 Metadata —————
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: "Review Not Found | Jilo.ai" };

  const title = coalesceByLocale(params.locale, article.title_en, article.title_zh) || "Jilo.ai Review";
  const description = coalesceByLocale(params.locale, article.summary_en, article.summary_zh) || "";
  const cover = article.cover_url || article.cover_image_url || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: cover ? [{ url: cover }] : undefined,
      publishedTime: article.published_at || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ReviewPage({ params }: PageProps) {
  const { locale, slug } = params;
  const article = await getArticle(slug);

  if (!article) return notFound();

  const title = coalesceByLocale(locale, article.title_en, article.title_zh);
  const summary = coalesceByLocale(locale, article.summary_en, article.summary_zh);
  const content = coalesceByLocale(locale, article.content_en, article.content_zh);
  const cover = article.cover_url || article.cover_image_url || "";
  const published = article.published_at ? new Date(article.published_at).toISOString() : undefined;
  const updated = article.updated_at ? new Date(article.updated_at).toISOString() : published;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    headline: title,
    description: summary || undefined,
    image: cover ? [cover] : undefined,
    datePublished: published,
    dateModified: updated,
    author: { "@type": "Organization", name: "Jilo.ai" },
    publisher: {
      "@type": "Organization",
      name: "Jilo.ai",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.jilo.ai/${locale}/reviews/${slug}`,
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-3">{title}</h1>

      <div className="text-sm text-muted-foreground mb-4">
        {published ? new Date(published).toISOString().slice(0, 10) : ""}
        {article.source ? ` · ${article.source}` : ""}
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
