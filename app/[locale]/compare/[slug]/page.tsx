// app/[locale]/compare/[slug]/page.tsx
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

type PageProps = {
  params: { locale: string; slug: string };
};

type CompareArticle = {
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  content: string;
  published_at: string | null;
  created_at: string | null;
};

async function getArticle(slug: string, locale: string): Promise<CompareArticle | null> {
  const actualSlug = locale === "zh" ? `${slug}-zh` : slug;
  const { data, error } = await supabase
    .from("compare_articles")
    .select("*")
    .eq("slug", actualSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    // Fallback: try the base slug
    const fallback = await supabase
      .from("compare_articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    return fallback.data as CompareArticle | null;
  }
  return data as CompareArticle;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug, params.locale);
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.title,
  };
}

export default async function CompareArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug, params.locale);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Article Not Found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article>
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        {article.published_at && (
          <p className="text-gray-500 text-sm mb-8">
            {new Date(article.published_at).toLocaleDateString(params.locale === "zh" ? "zh-CN" : "en-US")}
          </p>
        )}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}
