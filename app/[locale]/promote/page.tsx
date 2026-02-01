import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";

type PageProps = { params: { locale: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params?.locale === "zh";
  return {
    title: isZh ? "推广你的 AI 工具 - 获取更多曝光" : "Promote Your AI Tool - Get More Exposure",
    description: isZh
      ? "在 Jilo.ai 上推广你的 AI 工具，获取精准的 AI 用户流量。多种推广方案，效果可追踪。"
      : "Promote your AI tool on Jilo.ai to reach targeted AI users. Multiple promotion plans with trackable results.",
  };
}

export default function PromotePage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const plans = isZh
    ? [
        {
          name: "基础曝光",
          price: "$49/月",
          features: [
            "工具页面置顶标记 ⭐",
            "分类页精选展示",
            "每月基础流量报告",
          ],
          cta: "开始推广",
          popular: false,
        },
        {
          name: "专业推广",
          price: "$149/月",
          features: [
            "首页精选展示 🔥",
            "工具页面置顶 + 高亮",
            "深度评测文章（1篇/月）",
            "社交媒体推荐",
            "详细流量分析报告",
          ],
          cta: "最受欢迎",
          popular: true,
        },
        {
          name: "企业合作",
          price: "联系我们",
          features: [
            "全站 Banner 广告位",
            "定制深度评测系列",
            "Newsletter 专题推荐",
            "独家合作伙伴标识",
            "专属客户经理",
            "API 数据对接",
          ],
          cta: "联系洽谈",
          popular: false,
        },
      ]
    : [
        {
          name: "Basic Listing",
          price: "$49/mo",
          features: [
            "Featured badge on tool page ⭐",
            "Category page highlight",
            "Monthly basic traffic report",
          ],
          cta: "Get Started",
          popular: false,
        },
        {
          name: "Pro Promotion",
          price: "$149/mo",
          features: [
            "Homepage featured section 🔥",
            "Tool page top placement + highlight",
            "In-depth review article (1/mo)",
            "Social media recommendation",
            "Detailed analytics report",
          ],
          cta: "Most Popular",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "Contact Us",
          features: [
            "Site-wide banner ads",
            "Custom review series",
            "Newsletter feature",
            "Exclusive partner badge",
            "Dedicated account manager",
            "API data integration",
          ],
          cta: "Contact Sales",
          popular: false,
        },
      ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? "🚀 让你的 AI 工具被更多人发现" : "🚀 Get Your AI Tool Discovered"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isZh
              ? "Jilo.ai 每月为 AI 工具带来精准的目标用户流量。推广你的工具，获取更多注册和付费用户。"
              : "Jilo.ai drives targeted AI-interested traffic to your tool every month. Promote your tool to get more signups and paying users."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mb-16">
          {[
            { value: "551+", label: isZh ? "收录页面" : "Indexed Pages" },
            { value: "70+", label: isZh ? "AI 工具" : "AI Tools" },
            { value: "24/7", label: isZh ? "全球覆盖" : "Global Reach" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border-2 transition-all ${
                plan.popular
                  ? "border-primary shadow-xl scale-105 bg-primary/5"
                  : "border-border hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="text-center mb-4">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full font-medium">
                    {isZh ? "最受欢迎" : "Most Popular"}
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-primary mb-6">{plan.price}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hello@jilo.ai"
                className={`block w-full text-center py-3 rounded-lg font-medium transition ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Why promote */}
        <div className="bg-secondary/50 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isZh ? "为什么选择在 Jilo.ai 推广？" : "Why Promote on Jilo.ai?"}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {(isZh
              ? [
                  { icon: "🎯", title: "精准用户", desc: "来访用户都是正在寻找 AI 工具的目标用户，转化率远高于普通广告" },
                  { icon: "📈", title: "SEO 加持", desc: "我们的评测文章在 Google 排名优秀，你的工具将获得长期的自然搜索流量" },
                  { icon: "🌍", title: "全球覆盖", desc: "中英双语网站，同时覆盖中国和全球市场" },
                ]
              : [
                  { icon: "🎯", title: "Targeted Users", desc: "Visitors are actively looking for AI tools — much higher conversion than generic ads" },
                  { icon: "📈", title: "SEO Boost", desc: "Our review articles rank well on Google, giving your tool sustained organic traffic" },
                  { icon: "🌍", title: "Global Reach", desc: "Bilingual site covering both Chinese and international markets" },
                ]
            ).map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            {isZh ? "有问题？随时联系我们" : "Questions? Reach out anytime"}
          </p>
          <a
            href="mailto:hello@jilo.ai"
            className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-medium hover:bg-primary/90 transition"
          >
            {isZh ? "📧 联系我们：hello@jilo.ai" : "📧 Contact: hello@jilo.ai"}
          </a>
        </div>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
