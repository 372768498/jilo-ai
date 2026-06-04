import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Star, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

import SeoJsonLd from "@/components/SeoJsonLd";
import { supabase } from "@/lib/supabase";

type PageProps = { params: { locale: string; slug: string } };

const SITE = "https://www.jilo.ai";

const TOOL_SELECT = `
  id, slug,
  name_en, name_zh,
  tagline_en, tagline_zh,
  description_en, description_zh,
  long_description_en, long_description_zh,
  official_url, affiliate_url,
  logo_url, cover_image_url,
  pricing_type, pricing_details_en, pricing_details_zh, price_range,
  rating, review_count,
  category, category_canonical,
  features, pros, cons, use_cases,
  meta_title_en, meta_title_zh,
  meta_description_en, meta_description_zh,
  tags_en, tags_zh,
  updated_at
`;

function pickLocalized(item: any, field: string, locale: string): string {
  if (!item) return "";
  const isZh = locale === "zh";

  if (typeof item === "string") return item;
  if (typeof item !== "object") return String(item);
  if ("en" in item || "zh" in item) return isZh ? item.zh || item.en || "" : item.en || item.zh || "";

  const zhField = `${field}_zh`;
  const enField = `${field}_en`;
  if (field && (zhField in item || enField in item)) {
    return isZh ? item[zhField] || item[enField] || "" : item[enField] || item[zhField] || "";
  }

  if (field && field in item) return item[field] || "";
  return "";
}

function localizedArray(value: any, locale: string): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => pickLocalized(item, "text", locale)).filter(Boolean);
}

async function getToolData(slug: string) {
  const { data, error } = await supabase.from("tools").select(TOOL_SELECT).eq("slug", slug).single();
  if (error || !data) return null;
  return data;
}

async function getRelated(categoryCanonical: string | null, selfSlug: string, locale: string) {
  const alternativesQuery = categoryCanonical
    ? supabase
        .from("tools")
        .select("slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, pricing_type, rating")
        .eq("category_canonical", categoryCanonical)
        .eq("status", "published")
        .neq("slug", selfSlug)
        .order("rating", { ascending: false })
        .order("click_count", { ascending: false })
        .limit(6)
    : Promise.resolve({ data: [] });

  const comparisonsQuery = supabase
    .from("compare_articles")
    .select("slug, title, locale")
    .eq("locale", locale)
    .eq("status", "published")
    .limit(60);

  const [{ data: alternatives }, { data: comparisons }] = await Promise.all([alternativesQuery, comparisonsQuery]);

  // Always recirculate: if the category has too few siblings (or none), fall
  // back to popular tools so the page never dead-ends (audit: the alternatives
  // block silently vanished on thin records, leaving readers no next step).
  let altList: any[] = alternatives || [];
  if (altList.length < 3) {
    const { data: popular } = await supabase
      .from("tools")
      .select("slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, pricing_type, rating")
      .eq("status", "published")
      .neq("slug", selfSlug)
      .order("click_count", { ascending: false })
      .limit(8);
    const seen = new Set(altList.map((a: any) => a.slug));
    for (const p of popular || []) {
      if (altList.length >= 6) break;
      if (!seen.has(p.slug)) altList.push(p);
    }
  }

  return {
    alternatives: altList,
    comparisons: (comparisons || []).filter((item: any) => (item.slug || "").includes(selfSlug)).slice(0, 6),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getToolData(params.slug);
  if (!data) return { title: "Tool Not Found | Jilo.ai" };

  const isZh = params.locale === "zh";
  const name = isZh ? data.name_zh || data.name_en : data.name_en || data.name_zh;
  const tagline = isZh ? data.tagline_zh || data.tagline_en : data.tagline_en || data.tagline_zh;
  const title =
    (isZh ? data.meta_title_zh : data.meta_title_en) ||
    (isZh ? `${name} 评测、价格与替代方案 | Jilo.ai` : `${name} Review: Pricing, Features & Alternatives | Jilo.ai`);
  const description =
    (isZh ? data.meta_description_zh : data.meta_description_en) ||
    (isZh
      ? `${name}${tagline ? `：${tagline}` : ""}。查看功能、价格、优缺点和替代方案。`
      : `${name}${tagline ? ` - ${tagline}` : ""}. Compare features, pricing, pros, cons, and alternatives.`);

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE}/${params.locale}/tools/${params.slug}`,
      languages: {
        en: `${SITE}/en/tools/${params.slug}`,
        zh: `${SITE}/zh/tools/${params.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: data.cover_image_url || data.logo_url ? [{ url: data.cover_image_url || data.logo_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const locale = params.locale || "en";
  const isZh = locale === "zh";
  const data = await getToolData(params.slug);
  if (!data) notFound();

  const { alternatives, comparisons } = await getRelated(data.category_canonical, data.slug, locale);

  const t = (en: string, zh: string) => (isZh ? zh : en);
  const name = isZh ? data.name_zh || data.name_en : data.name_en || data.name_zh;
  const tagline = isZh ? data.tagline_zh || data.tagline_en : data.tagline_en || data.tagline_zh;
  const description = isZh ? data.description_zh || data.description_en : data.description_en || data.description_zh;
  const longDescription = isZh
    ? data.long_description_zh || data.long_description_en
    : data.long_description_en || data.long_description_zh;
  const pricingDetails = isZh ? data.pricing_details_zh || data.pricing_details_en : data.pricing_details_en || data.pricing_details_zh;
  const tags = isZh ? data.tags_zh || data.tags_en || [] : data.tags_en || data.tags_zh || [];
  const pros = localizedArray(data.pros, locale);
  const cons = localizedArray(data.cons, locale);
  const outboundUrl = `/api/out?tool=${encodeURIComponent(data.id)}&source=tool_detail&locale=${encodeURIComponent(locale)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${SITE}/${locale}/tools/${data.slug}`,
    description: description || tagline,
    image: data.logo_url || data.cover_image_url,
    offers:
      data.pricing_type || data.price_range
        ? {
            "@type": "Offer",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          }
        : undefined,
    aggregateRating: data.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: data.rating,
          reviewCount: data.review_count || 1,
        }
      : undefined,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <SeoJsonLd data={jsonLd} />

      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground">
          {t("Home", "首页")}
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/${locale}/tools`} className="hover:text-foreground">
          {t("Tools", "工具")}
        </Link>
        {data.category_canonical ? (
          <>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/c/${data.category_canonical}`} className="hover:text-foreground">
              {data.category || data.category_canonical}
            </Link>
          </>
        ) : null}
      </nav>

      <section className="mb-8 flex flex-col gap-6 border-b pb-8 md:flex-row md:items-start">
        {data.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logo_url} alt={name} className="h-20 w-20 rounded-lg object-contain shadow-sm" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-bold tracking-tight">{name}</h1>
          {tagline ? <p className="mt-3 text-xl leading-8 text-muted-foreground">{tagline}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {(data.affiliate_url || data.official_url) ? (
              <a
                href={outboundUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t("Visit website", "访问官网")}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
            {data.rating ? (
              <span className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 font-semibold">
                <Star className="h-4 w-4 text-amber-500" />
                {data.rating}
                {data.review_count ? <span className="text-sm font-normal text-muted-foreground">({data.review_count})</span> : null}
              </span>
            ) : null}
            {data.affiliate_url ? (
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {t("Affiliate link active", "联盟链接已接入")}
              </span>
            ) : null}
          </div>
          {data.affiliate_url ? (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {t(
                "Disclosure: Jilo.ai may earn a commission if you buy through this link. This does not affect our review.",
                "披露：如果你通过此链接购买，Jilo.ai 可能获得佣金；这不影响评测结论。",
              )}
            </p>
          ) : null}
        </div>
      </section>

      {data.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.cover_image_url} alt={name} className="mb-8 w-full rounded-lg object-cover shadow-sm" />
      ) : null}

      {description ? (
        <section className="mb-10 rounded-lg bg-secondary/50 p-6">
          <p className="text-lg leading-8">{description}</p>
        </section>
      ) : null}

      {longDescription ? (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">{t(`About ${name}`, `关于 ${name}`)}</h2>
          <p className="whitespace-pre-line leading-8 text-muted-foreground">{longDescription}</p>
        </section>
      ) : null}

      {Array.isArray(data.features) && data.features.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">{t("Key features", "核心功能")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.features.map((feature: any, index: number) => {
              const title = pickLocalized(feature, "title", locale);
              const featureDescription = pickLocalized(feature, "description", locale);
              return (
                <div key={index} className="rounded-lg border p-5">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {title || t("Feature", "功能")}
                  </h3>
                  {featureDescription ? <p className="text-sm leading-6 text-muted-foreground">{featureDescription}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {(pros.length > 0 || cons.length > 0) && (
        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">{t("Pros and cons", "优缺点")}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {pros.length > 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  {t("Pros", "优点")}
                </h3>
                <ul className="space-y-2 text-sm leading-6 text-emerald-950">
                  {pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {cons.length > 0 ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-rose-800">
                  <XCircle className="h-5 w-5" />
                  {t("Cons", "缺点")}
                </h3>
                <ul className="space-y-2 text-sm leading-6 text-rose-950">
                  {cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {Array.isArray(data.use_cases) && data.use_cases.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">{t("Best use cases", "适用场景")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.use_cases.map((useCase: any, index: number) => (
              <div key={index} className="rounded-lg border bg-secondary/30 p-5">
                <h3 className="mb-2 font-semibold">{pickLocalized(useCase, "title", locale) || `${index + 1}`}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{pickLocalized(useCase, "description", locale)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-12">
        <h2 className="mb-5 text-2xl font-bold">{t("Tool information", "工具信息")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Info label={t("Pricing", "定价")} value={data.pricing_type || "-"} />
          <Info label={t("Price range", "价格区间")} value={data.price_range || "-"} />
          <Info label={t("Details", "价格说明")} value={pricingDetails || "-"} />
        </div>
      </section>

      {Array.isArray(tags) && tags.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">{t("Tags", "标签")}</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-sm">
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {comparisons.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">{t("Related comparisons", "相关对比")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {comparisons.map((comparison: any) => (
              <Link key={comparison.slug} href={`/${locale}/compare/${comparison.slug.replace(/-zh$/, "")}`} className="rounded-lg border p-4 font-semibold hover:border-emerald-300">
                {comparison.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {alternatives.length > 0 ? (
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">{t(`${name} alternatives`, `${name} 替代品`)}</h2>
            {data.category_canonical ? (
              <Link href={`/${locale}/c/${data.category_canonical}`} className="text-sm font-semibold text-emerald-700 hover:underline">
                {t("Browse all", "查看全部")}
              </Link>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alt: any) => {
              const altName = isZh ? alt.name_zh || alt.name_en : alt.name_en || alt.name_zh;
              const altTagline = isZh ? alt.tagline_zh || alt.tagline_en : alt.tagline_en || alt.tagline_zh;
              return (
                <Link key={alt.slug} href={`/${locale}/tools/${alt.slug}`} className="rounded-lg border p-5 hover:border-emerald-300">
                  <div className="mb-2 flex items-center gap-3">
                    {alt.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={alt.logo_url} alt={altName} className="h-9 w-9 rounded-md object-contain" />
                    ) : null}
                    <div>
                      <div className="font-semibold">{altName}</div>
                      <div className="text-xs text-muted-foreground">{alt.pricing_type || "-"}</div>
                    </div>
                  </div>
                  {altTagline ? <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{altTagline}</p> : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-1 text-sm text-muted-foreground">{label}</div>
      <div className="font-semibold capitalize">{value}</div>
    </div>
  );
}
