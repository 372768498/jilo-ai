// app/[locale]/tools/[slug]/page.tsx
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SeoJsonLd from "@/components/SeoJsonLd";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

type PageProps = { params: { locale: string; slug: string } };

export default async function ToolDetailPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const slug = params?.slug;

  // 🆕 使用正确的字段名
  const { data, error } = await supabase
    .from("tools")
    .select(`
      id, slug, 
      name_en, name_zh,
      tagline_en, tagline_zh,
      description_en, description_zh,
      long_description_en, long_description_zh,
      official_url, affiliate_url,
      logo_url, cover_image_url,
      pricing_type, pricing_details_en, pricing_details_zh, price_range,
      rating, review_count,
      features, pros, cons, use_cases,
      meta_title_en, meta_title_zh,
      meta_description_en, meta_description_zh,
      tags_en, tags_zh,
      updated_at
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) return notFound();

  // 🆕 根据语言选择字段
  const isZh = locale === "zh";
  const name = isZh ? data.name_zh : data.name_en;
  const tagline = isZh ? data.tagline_zh : data.tagline_en;
  const description = isZh ? data.description_zh : data.description_en;
  const longDescription = isZh ? data.long_description_zh : data.long_description_en;
  const pricingDetails = isZh ? data.pricing_details_zh : data.pricing_details_en;
  const metaTitle = isZh ? data.meta_title_zh : data.meta_title_en;
  const metaDescription = isZh ? data.meta_description_zh : data.meta_description_en;

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "applicationCategory": "AI Tool",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": data.pricing_type === "free" ? "0" : undefined,
      "priceCurrency": "USD"
    },
    "url": `https://www.jilo.ai/${locale}/tools/${data.slug}`,
    "description": metaDescription || description,
    "image": data.logo_url || undefined,
    "aggregateRating": data.rating ? {
      "@type": "AggregateRating",
      "ratingValue": data.rating,
      "reviewCount": data.review_count || 0
    } : undefined
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SeoJsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <div className="text-sm mb-6 text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground">Home</Link>
        {" / "}
        <Link href={`/${locale}/tools`} className="hover:text-foreground">Tools</Link>
        {" / "}
        <span className="text-foreground">{name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {data.logo_url && (
          <img
            src={data.logo_url}
            alt={name}
            className="w-20 h-20 rounded-2xl object-cover shadow-lg"
          />
        )}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{name}</h1>
          {tagline && (
            <p className="text-xl text-muted-foreground mb-4">{tagline}</p>
          )}
          <div className="flex gap-3">
            {data.official_url && (
              <a
                href={data.affiliate_url || data.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Visit Website →
              </a>
            )}
            {data.rating && (
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold">{data.rating}</span>
                {data.review_count && (
                  <span className="text-sm text-muted-foreground">
                    ({data.review_count} reviews)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {data.cover_image_url && (
        <img
          src={data.cover_image_url}
          alt={name}
          className="w-full rounded-xl mb-8 shadow-lg"
        />
      )}

      {/* Short Description */}
      {description && (
        <div className="mb-8 p-6 bg-secondary/50 rounded-xl">
          <p className="text-lg leading-relaxed">{description}</p>
        </div>
      )}

      {/* Long Description */}
      {longDescription && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            {isZh ? `关于 ${name}` : `About ${name}`}
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="leading-relaxed whitespace-pre-line">{longDescription}</p>
          </div>
        </section>
      )}

      {/* Features */}
      {data.features && data.features.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {isZh ? '核心功能' : 'Key Features'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.features.map((feature: any, i: number) => (
              <div key={i} className="p-5 border rounded-xl hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pros & Cons */}
      {(data.pros || data.cons) && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {isZh ? '优缺点分析' : 'Pros & Cons'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pros */}
            {data.pros && data.pros.length > 0 && (
              <div className="p-6 border border-green-200 dark:border-green-800 rounded-xl bg-green-50 dark:bg-green-950/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  {isZh ? '优点' : 'Pros'}
                </h3>
                <ul className="space-y-2">
                  {data.pros.map((pro: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {data.cons && data.cons.length > 0 && (
              <div className="p-6 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-950/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="w-5 h-5" />
                  {isZh ? '缺点' : 'Cons'}
                </h3>
                <ul className="space-y-2">
                  {data.cons.map((con: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Use Cases */}
      {data.use_cases && data.use_cases.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {isZh ? '使用场景' : 'Use Cases'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.use_cases.map((useCase: any, i: number) => (
              <div key={i} className="p-5 border rounded-xl bg-secondary/30">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{useCase.title}</h3>
                    <p className="text-muted-foreground text-sm">{useCase.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tool Info Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          {isZh ? '工具信息' : 'Tool Information'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              {isZh ? '定价' : 'Pricing'}
            </div>
            <div className="font-semibold capitalize">
              {data.pricing_type || '-'}
            </div>
            {pricingDetails && (
              <div className="text-sm text-muted-foreground mt-1">{pricingDetails}</div>
            )}
          </div>

          {data.price_range && (
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                {isZh ? '价格区间' : 'Price Range'}
              </div>
              <div className="font-semibold">{data.price_range}</div>
            </div>
          )}

          {data.updated_at && (
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                {isZh ? '最后更新' : 'Last Updated'}
              </div>
              <div className="font-semibold">
                {new Date(data.updated_at).toLocaleDateString(locale)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tags */}
      {((isZh && data.tags_zh) || (!isZh && data.tags_en)) && (
        <section>
          <h2 className="text-2xl font-bold mb-4">
            {isZh ? '标签' : 'Tags'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(isZh ? data.tags_zh : data.tags_en)?.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1 bg-secondary rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}