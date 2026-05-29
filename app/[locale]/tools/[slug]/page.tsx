// app/[locale]/tools/[slug]/page.tsx
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SeoJsonLd from "@/components/SeoJsonLd";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

type PageProps = { params: { locale: string; slug: string } };

// China-accessibility display (jilo's differentiator). null/unknown → not shown.
const CHINA_ACCESS: Record<string, { en: string; zh: string; cls: string }> = {
  direct:  { en: "🟢 Available in China",  zh: "🟢 中国可直连", cls: "bg-green-50 text-green-700 border-green-200" },
  proxy:   { en: "🟡 VPN / proxy needed",  zh: "🟡 需代理/VPN", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  blocked: { en: "🔴 Blocked in China",    zh: "🔴 中国不可用", cls: "bg-red-50 text-red-700 border-red-200" },
};

// 通用英文→中文翻译映射
const TRANSLATIONS: Record<string, string> = {
  // Feature Titles
  "Natural Language Understanding": "自然语言理解",
  "Content Generation": "内容生成",
  "Coding Assistance": "编程辅助",
  "24/7 Availability": "全天候可用",
  "Multi-Topic Support": "多主题支持",
  "Interactive Conversations": "互动对话",
  "Customizable Responses": "可自定义响应",
  
  // Feature Descriptions
  "ChatGPT can comprehend and respond to human language effectively.": "ChatGPT能够有效理解和回应人类语言。",
  "Easily create articles, essays, and creative writing with AI support.": "借助AI支持轻松创建文章、论文和创意写作。",
  "Get help with coding tasks, debugging, and programming concepts.": "获取编程任务、调试和编程概念方面的帮助。",
  "Access assistance anytime, anywhere, without waiting for human help.": "随时随地获取帮助，无需等待人工支持。",
  "Engage on a wide range of subjects, from science to pop culture.": "涵盖从科学到流行文化的广泛主题。",
  "Enjoy seamless, back-and-forth dialogue with the AI.": "享受与AI的无缝双向对话。",
  "Tailor tone and style based on user preferences.": "根据用户偏好定制语气和风格。",
  
  // Pros
  "Offers instant responses to a variety of queries.": "为各种查询提供即时响应。",
  "Enhances productivity with quick content generation.": "通过快速内容生成提高工作效率。",
  "Available 24/7, providing assistance whenever needed.": "全天候可用，随时提供帮助。",
  "Learns and adapts to user preferences over time.": "随着时间推移学习并适应用户偏好。",
  
  // Cons
  "May provide inaccurate or misleading information at times.": "有时可能提供不准确或误导性信息。",
  "Lacks deep understanding of some niche topics.": "对某些小众话题缺乏深入理解。",
  "Responses can occasionally be repetitive or generic.": "响应有时可能重复或过于笼统。",
  
  // Use Case Titles
  "Content Writing": "内容写作",
  "Homework Help": "作业帮助",
  "Customer Support": "客户支持",
  "Language Learning": "语言学习",
  
  // Use Case Descriptions
  "Use ChatGPT to brainstorm and draft articles or blog posts effortlessly.": "使用ChatGPT轻松构思和撰写文章或博客文章。",
  "Get explanations and assistance with complex homework problems.": "获取复杂作业问题的解释和帮助。",
  "Deploy ChatGPT for automated responses to customer inquiries.": "部署ChatGPT自动回复客户咨询。",
  "Practice conversations in different languages with the chatbot.": "与聊天机器人练习不同语言的对话。",
  
  // Common patterns
  "AI-powered": "AI驱动",
  "Machine Learning": "机器学习",
  "Deep Learning": "深度学习",
  "Neural Network": "神经网络",
  "Real-time": "实时",
  "Automated": "自动化",
  "Advanced": "高级",
  "Professional": "专业",
  "Enterprise": "企业级",
};

// 获取本地化文本（支持双语格式）
function getLocalizedText(item: any, field: string, locale: string): string {
  const isZh = locale === "zh";
  
  // 如果数据是双语格式 {en: "...", zh: "..."}
  if (typeof item === "object" && item !== null) {
    if ("en" in item && "zh" in item) {
      return isZh ? (item.zh || item.en) : item.en;
    }
    
    // 如果数据有 _en 和 _zh 后缀
    if (`${field}_en` in item && `${field}_zh` in item) {
      return isZh ? (item[`${field}_zh`] || item[`${field}_en`]) : item[`${field}_en`];
    }
    
    // 如果有直接的字段（旧格式）
    if (field in item) {
      return item[field];
    }
  }
  
  // 如果是字符串，直接返回
  if (typeof item === "string") {
    return item;
  }
  
  return "";
}

// ————— SEO: 动态 Metadata —————
async function getToolData(slug: string) {
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
      category, category_canonical, china_access,
      features, pros, cons, use_cases,
      meta_title_en, meta_title_zh,
      meta_description_en, meta_description_zh,
      tags_en, tags_zh,
      updated_at
    `)
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data;
}

async function getRelated(categoryCanonical: string | null, selfSlug: string, locale: string) {
  let alternatives: any[] = [];
  if (categoryCanonical) {
    const { data: alts } = await supabase
      .from("tools")
      .select("slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, pricing_type, rating")
      .eq("category_canonical", categoryCanonical)
      .eq("status", "published")
      .neq("slug", selfSlug)
      .order("rating", { ascending: false })
      .order("click_count", { ascending: false })
      .limit(6);
    alternatives = alts || [];
  }
  const { data: cmps } = await supabase
    .from("compare_articles")
    .select("slug, title, locale")
    .eq("locale", locale)
    .eq("status", "published")
    .limit(60);
  const comparisons = (cmps || []).filter((c: any) => (c.slug || "").includes(selfSlug)).slice(0, 6);
  return { alternatives, comparisons };
}

export async function generateMetadata({ params }: PageProps): Promise<import("next").Metadata> {
  const data = await getToolData(params.slug);
  if (!data) return { title: "Tool Not Found | Jilo.ai" };

  const isZh = (params.locale || "en") === "zh";
  const name = isZh ? (data.name_zh || data.name_en) : data.name_en;
  const tagline = isZh ? (data.tagline_zh || data.tagline_en) : data.tagline_en;
  const metaTitle = isZh
    ? (data.meta_title_zh || `${name} - 评测、价格与替代方案 (2026) | Jilo.ai`)
    : (data.meta_title_en || `${name} Review: Pricing, Features & Alternatives (2026) | Jilo.ai`);
  const metaDescription = isZh
    ? (data.meta_description_zh || `${name}${tagline ? '：' + tagline : ''} 深度评测，包含功能、价格、优缺点和最佳替代方案。`)
    : (data.meta_description_en || `${name}${tagline ? ' - ' + tagline : ''}. In-depth review with features, pricing, pros & cons, and best alternatives.`);

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
      images: data.logo_url ? [{ url: data.logo_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const slug = params?.slug;

  const data = await getToolData(slug);

  if (!data) return notFound();

  const { alternatives, comparisons } = await getRelated(data.category_canonical, data.slug, locale);

  const isZh = locale === "zh";
  const name = isZh ? data.name_zh : data.name_en;
  const tagline = isZh ? data.tagline_zh : data.tagline_en;
  const description = isZh ? data.description_zh : data.description_en;
  const longDescription = isZh ? data.long_description_zh : data.long_description_en;
  const pricingDetails = isZh ? data.pricing_details_zh : data.pricing_details_en;
  const metaTitle = isZh ? data.meta_title_zh : data.meta_title_en;
  const metaDescription = isZh ? data.meta_description_zh : data.meta_description_en;
  const outboundUrl = `/api/out?tool=${encodeURIComponent(data.id)}&source=tool_detail&locale=${encodeURIComponent(locale)}`;

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `https://www.jilo.ai/${locale}/tools/${data.slug}`,
    description: metaDescription || description,
    image: data.logo_url,
    brand: {
      "@type": "Organization",
      name: name
    },
    offers: data.pricing_type || data.price_range ? {
      "@type": "Offer",
      price: data.pricing_type === "free" 
        ? "0" 
        : data.price_range?.split("-")[0]?.replace(/[^0-9.]/g, "") || null,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock"
    } : undefined,
    aggregateRating: data.rating ? {
      "@type": "AggregateRating",
      ratingValue: data.rating,
      reviewCount: data.review_count || 1
    } : undefined
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SeoJsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <div className="text-sm mb-6 text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground">
          {isZh ? "首页" : "Home"}
        </Link>
        {" / "}
        <Link href={`/${locale}/tools`} className="hover:text-foreground">
          {isZh ? "工具" : "Tools"}
        </Link>
        {" / "}
        {data.category_canonical && (
          <>
            <Link href={`/${locale}/c/${data.category_canonical}`} className="hover:text-foreground">
              {data.category || data.category_canonical}
            </Link>
            {" / "}
          </>
        )}
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
          {tagline && <p className="text-xl text-muted-foreground mb-4">{tagline}</p>}
          <div className="flex gap-3">
            {data.official_url && (
              <a
                href={outboundUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {isZh ? "访问网站" : "Visit Website"} →
              </a>
            )}
            {data.affiliate_url && (
              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {isZh ? "联盟链接" : "Affiliate link"}
              </span>
            )}
            {data.rating && (
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold">{data.rating}</span>
                {data.review_count && (
                  <span className="text-sm text-muted-foreground">
                    ({data.review_count} {isZh ? "评价" : "reviews"})
                  </span>
                )}
              </div>
            )}
            {data.china_access && CHINA_ACCESS[data.china_access] && (
              <span className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium ${CHINA_ACCESS[data.china_access].cls}`}>
                {isZh ? CHINA_ACCESS[data.china_access].zh : CHINA_ACCESS[data.china_access].en}
              </span>
            )}
          </div>
          {data.affiliate_url && (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {isZh
                ? "披露：如果你通过此链接购买，Jilo.ai 可能获得佣金；这不会影响我们的评测结论。"
                : "Disclosure: Jilo.ai may earn a commission if you buy through this link. This does not affect our review."}
            </p>
          )}
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
            {isZh ? "核心功能" : "Key Features"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.features.map((feature: any, i: number) => {
              const title = getLocalizedText(feature, "title", locale);
              const desc = getLocalizedText(feature, "description", locale);
              
              return (
                <div key={i} className="p-5 border rounded-xl hover:shadow-md transition">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {title}
                  </h3>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pros & Cons */}
      {(data.pros || data.cons) && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {isZh ? "优缺点分析" : "Pros & Cons"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pros */}
            {data.pros && data.pros.length > 0 && (
              <div className="p-6 border border-green-200 dark:border-green-800 rounded-xl bg-green-50 dark:bg-green-950/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  {isZh ? "优点" : "Pros"}
                </h3>
                <ul className="space-y-2">
                  {data.pros.map((pro: any, i: number) => {
                    const text = getLocalizedText(pro, "", locale);
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                        <span>{text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Cons */}
            {data.cons && data.cons.length > 0 && (
              <div className="p-6 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-950/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="w-5 h-5" />
                  {isZh ? "缺点" : "Cons"}
                </h3>
                <ul className="space-y-2">
                  {data.cons.map((con: any, i: number) => {
                    const text = getLocalizedText(con, "", locale);
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                        <span>{text}</span>
                      </li>
                    );
                  })}
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
            {isZh ? "使用场景" : "Use Cases"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.use_cases.map((useCase: any, i: number) => {
              const title = getLocalizedText(useCase, "title", locale);
              const desc = getLocalizedText(useCase, "description", locale);
              
              return (
                <div key={i} className="p-5 border rounded-xl bg-secondary/30">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{title}</h3>
                      <p className="text-muted-foreground text-sm">{desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tool Info Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          {isZh ? "工具信息" : "Tool Information"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              {isZh ? "定价" : "Pricing"}
            </div>
            <div className="font-semibold capitalize">{data.pricing_type || "-"}</div>
            {pricingDetails && (
              <div className="text-sm text-muted-foreground mt-1">{pricingDetails}</div>
            )}
          </div>

          {data.price_range && (
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                {isZh ? "价格区间" : "Price Range"}
              </div>
              <div className="font-semibold">{data.price_range}</div>
            </div>
          )}

          {data.china_access && CHINA_ACCESS[data.china_access] && (
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                {isZh ? "中国可用性" : "China Access"}
              </div>
              <div className="font-semibold">
                {isZh ? CHINA_ACCESS[data.china_access].zh : CHINA_ACCESS[data.china_access].en}
              </div>
            </div>
          )}

          {data.updated_at && (
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                {isZh ? "最后更新" : "Last Updated"}
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
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{isZh ? "标签" : "Tags"}</h2>
          <div className="flex flex-wrap gap-2">
            {(isZh ? data.tags_zh : data.tags_en)?.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Key comparisons involving this tool */}
      {comparisons.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{isZh ? "相关对比" : "Key Comparisons"}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {comparisons.map((c: any) => (
              <Link
                key={c.slug}
                href={`/${locale}/compare/${c.slug.replace(/-zh$/, "")}`}
                className="flex items-center justify-between p-4 border rounded-xl hover:border-emerald-300 hover:shadow-sm transition"
              >
                <span className="font-medium">{c.title}</span>
                <span className="text-emerald-600">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Alternatives — same category */}
      {alternatives.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{isZh ? `${name} 的替代品` : `${name} Alternatives`}</h2>
            {data.category_canonical && (
              <Link href={`/${locale}/c/${data.category_canonical}`} className="text-sm font-medium text-emerald-700 hover:underline">
                {isZh ? "查看全部同类 →" : "Browse all →"}
              </Link>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alternatives.map((alt: any) => {
              const altName = isZh ? alt.name_zh || alt.name_en : alt.name_en || alt.name_zh;
              const altTagline = isZh ? alt.tagline_zh || alt.tagline_en : alt.tagline_en || alt.tagline_zh;
              return (
                <Link
                  key={alt.slug}
                  href={`/${locale}/tools/${alt.slug}`}
                  className="flex flex-col p-5 border rounded-xl hover:border-emerald-300 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {alt.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={alt.logo_url} alt={altName} className="w-9 h-9 rounded-md object-contain" />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-sm font-bold">{altName?.[0]}</div>
                    )}
                    <div>
                      <div className="font-semibold">{altName}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {alt.pricing_type || "-"}{alt.rating ? ` · ${alt.rating}★` : ""}
                      </div>
                    </div>
                  </div>
                  {altTagline && <p className="text-sm text-muted-foreground line-clamp-2">{altTagline}</p>}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
