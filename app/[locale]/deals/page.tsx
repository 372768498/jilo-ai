import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getAffiliateTools, type AffiliateConfig } from "@/lib/affiliate";
import type { Metadata } from "next";

type PageProps = { params: { locale: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params?.locale === "zh";
  const locale = params?.locale || "en";
  const altLocale = isZh ? "en" : "zh";

  return {
    title: isZh
      ? "AI 工具优惠 & 独家折扣 - Jilo.ai"
      : "AI Tool Deals & Exclusive Discounts - Jilo.ai",
    description: isZh
      ? "发现最佳 AI 工具的独家优惠、免费试用和折扣。Jasper、Copy.ai、Synthesia 等热门工具的最新优惠信息。"
      : "Discover exclusive deals, free trials, and discounts on the best AI tools. Latest offers on Jasper, Copy.ai, Synthesia, and more.",
    openGraph: {
      title: isZh ? "AI 工具优惠 | Jilo.ai" : "AI Tool Deals | Jilo.ai",
      description: isZh
        ? "发现最佳 AI 工具独家优惠和折扣"
        : "Discover exclusive deals and discounts on the best AI tools",
      url: `https://jilo.ai/${locale}/deals`,
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/deals`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/deals`,
        [altLocale]: `https://jilo.ai/${altLocale}/deals`,
      },
    },
  };
}

// Group tools by category for display
function categorizeTools(tools: AffiliateConfig[]) {
  const categories: Record<string, { en: string; zh: string; tools: AffiliateConfig[] }> = {
    writing: { en: "AI Writing", zh: "AI 写作", tools: [] },
    video: { en: "AI Video", zh: "AI 视频", tools: [] },
    audio: { en: "AI Audio", zh: "AI 音频", tools: [] },
    image: { en: "AI Image & Design", zh: "AI 图片与设计", tools: [] },
    seo: { en: "AI SEO & Marketing", zh: "AI SEO 与营销", tools: [] },
    productivity: { en: "AI Productivity", zh: "AI 生产力", tools: [] },
    coding: { en: "AI Coding", zh: "AI 编程", tools: [] },
    other: { en: "Other AI Tools", zh: "其他 AI 工具", tools: [] },
  };

  const slugMap: Record<string, string> = {
    jasper: "writing", "copy-ai": "writing", writesonic: "writing", grammarly: "writing",
    rytr: "writing", wordtune: "writing", anyword: "writing",
    synthesia: "video", pictory: "video", descript: "video", "runway-ml": "video", heygen: "video",
    elevenlabs: "audio", "murf-ai": "audio", "otter-ai": "audio", "fireflies-ai": "audio",
    "leonardo-ai": "image", canva: "image", photoroom: "image", "remove-bg": "image",
    "surfer-seo": "seo", semrush: "seo", frase: "seo", scalenut: "seo",
    notion: "productivity", clickup: "productivity", taskade: "productivity",
    tabnine: "coding",
  };

  for (const tool of tools) {
    const cat = slugMap[tool.slug] || "other";
    categories[cat].tools.push(tool);
  }

  return Object.values(categories).filter((c) => c.tools.length > 0);
}

// Format slug to display name
function formatName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bSeo\b/g, "SEO")
    .replace(/\bBg\b/g, "BG");
}

export default function DealsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const tools = getAffiliateTools();
  const categories = categorizeTools(tools);

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? "AI 工具优惠 & 独家折扣" : "AI Tool Deals & Exclusive Discounts"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isZh
              ? "精选热门 AI 工具的免费试用、独家折扣和优惠活动。通过下方链接注册即可享受优惠。"
              : "Curated free trials, exclusive discounts, and special offers on popular AI tools. Sign up through the links below to claim your deal."}
          </p>
          <p className="text-sm text-muted-foreground mt-4 max-w-xl mx-auto">
            {isZh
              ? "* 部分链接为推广链接，如果您通过这些链接购买，我们可能会获得佣金，且不会增加您的费用。"
              : "* Some links are affiliate links. If you purchase through them, we may earn a commission at no extra cost to you."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mb-16">
          {[
            { value: `${tools.length}+`, label: isZh ? "合作工具" : "Partner Tools" },
            { value: "45%", label: isZh ? "最高佣金" : "Top Commission" },
            { value: "$0", label: isZh ? "用户额外费用" : "Extra Cost to You" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tool categories */}
        {categories.map((category) => (
          <section key={category.en} className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              {isZh ? category.zh : category.en}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tools.map((tool) => (
                <div
                  key={tool.slug}
                  className="rounded-xl border p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{formatName(tool.slug)}</h3>
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium whitespace-nowrap">
                      {tool.commission}
                    </span>
                  </div>
                  {tool.dealText && (
                    <p className="text-sm text-muted-foreground mb-4">{tool.dealText}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
                    >
                      {isZh ? "立即试用" : "Try Now"} →
                    </a>
                    <span
                      className="text-[10px] text-muted-foreground"
                      title={isZh ? "推广链接" : "Affiliate link"}
                    >
                      {isZh ? "推广链接" : "Sponsored"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* FTC Disclosure */}
        <div className="mt-16 p-6 bg-secondary/50 rounded-xl">
          <h3 className="font-semibold mb-2">
            {isZh ? "免责声明" : "Affiliate Disclosure"}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isZh
              ? "本页面包含推广链接。当您通过这些链接注册或购买产品时，Jilo.ai 可能会获得佣金，但这不会增加您的任何费用。我们只推荐我们认为优质的产品。所有观点均为我们的真实看法。"
              : "This page contains affiliate links. When you sign up or purchase through these links, Jilo.ai may earn a commission at no additional cost to you. We only recommend products we believe offer genuine value. All opinions are our own."}
          </p>
        </div>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
