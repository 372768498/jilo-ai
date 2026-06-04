// app/[locale]/news/[slug]/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ArticleToolStrip from "@/components/ArticleToolStrip";

// Access/China-intent signals. AEO answer pages matching these are where the
// site's #1 demand (ChatGPT/Claude access, "怎么用 / 充值 / 订阅") lands — they
// get a contextual CTA to /access, the hub that carries the commissioned access
// affiliate + risk disclosure. Without this the engine's dynamically generated
// answer pages have no conversion exit.
const ACCESS_INTENT_SIGNALS = [
  "access", "china", "chinese", "chatgpt", "claude", "gemini", "subscription",
  "vpn", "plus", "account", "充值", "订阅", "接入", "怎么用", "国内", "镜像",
  "账号", "会员", "怎么", "如何",
];

function isAccessIntent(n: NewsItem) {
  if (n.news_type !== "aeo_answer") return false;
  const hay = [
    n.title_en, n.title_zh, n.summary_en, n.summary_zh, n.slug,
    ...(n.tags_en || []), ...(n.tags_zh || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return ACCESS_INTENT_SIGNALS.some((s) => hay.includes(s));
}

type PageProps = {
  params: { locale: string; slug: string };
};

export const dynamic = "force-dynamic";

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
  news_type: string | null;
  cover_url: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  tags_en: string[] | null;
  tags_zh: string[] | null;
};

function textOnly(value: string) {
  return (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractFaq(content: string) {
  const faqs: Array<{ q: string; a: string }> = [];
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[^>]*>|<\/section>|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = h3Regex.exec(content || "")) && faqs.length < 8) {
    const q = textOnly(match[1]);
    const a = textOnly(match[2]);
    if (q && a && q.length <= 160) faqs.push({ q, a: a.slice(0, 800) });
  }
  return faqs;
}

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

  const rawTitle = coalesceByLocale(params.locale, n.title_en, n.title_zh) || "Jilo.ai News";
  // Ensure title has site branding for better recognition in SERP
  const title = rawTitle.includes("Jilo") ? rawTitle : `${rawTitle} | Jilo.ai`;
  const rawDesc = coalesceByLocale(params.locale, n.summary_en, n.summary_zh) || "";
  // Ensure description is within optimal length (140-160 chars)
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc;
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
      <>
        <Navbar locale={locale} />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-2xl font-semibold mb-2">
            {locale === "zh" ? "未找到该新闻" : "News not found"}
          </h1>
          <Link href={`/${locale}/news`} className="text-primary hover:underline">
            {locale === "zh" ? "← 返回资讯" : "← Back to news"}
          </Link>
        </div>
        <Footer locale={locale} />
      </>
    );
  }

  const title = coalesceByLocale(locale, n.title_en, n.title_zh);
  const summary = coalesceByLocale(locale, n.summary_en, n.summary_zh);
  const content = coalesceByLocale(locale, n.content_en, n.content_zh);
  const cover = (n.cover_url || n.cover_image_url) || "";
  const published = n.published_at ? new Date(n.published_at).toISOString() : undefined;
  const updated = n.updated_at ? new Date(n.updated_at).toISOString() : published;
  const faqs = n.news_type === "aeo_answer" ? extractFaq(content) : [];

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
  const faqJsonLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      }
    : null;

  return (
    <>
      <Navbar locale={locale} />
      <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href={`/${locale}/news`} className="hover:text-foreground">
          {locale === "zh" ? "资讯" : "News"}
        </Link>
        <span className="mx-2">/</span>
        <span>{locale === "zh" ? "文章" : "Article"}</span>
      </nav>
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

      {isAccessIntent(n) && (
        <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-950">
            {locale === "zh" ? "想知道怎么稳定访问 / 订阅？" : "Need a stable way to access or subscribe?"}
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-900">
            {locale === "zh"
              ? "对比主流访问与订阅方案（含官方、替代工具与风险披露），选最适合你的那个。"
              : "Compare mainstream access and subscription options — official plans, alternatives, and risk disclosure."}
          </p>
          <Link
            href={`/${locale}/access`}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {locale === "zh" ? "看访问 / 订阅方案对比" : "Compare access & subscription options"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <ArticleToolStrip locale={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      </div>
      <Footer locale={locale} />
    </>
  );
}
