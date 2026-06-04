import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Camera,
  Clapperboard,
  FileText,
  FlaskConical,
  Layout,
  Palette,
  Scroll,
  ShoppingBag,
  Sparkles,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SeoJsonLd from "@/components/SeoJsonLd";
import {
  CATEGORY_META,
  PROMPT_TEMPLATES,
  categoryLabel,
  coverSrc,
  templateName,
  templatesByCategory,
} from "@/lib/prompt-templates";

type PageProps = { params: { locale: string } };

const SITE = "https://www.jilo.ai";

const ICONS: Record<string, LucideIcon> = {
  Layout,
  BarChart3,
  Type,
  ShoppingBag,
  Sparkles,
  Building2,
  Camera,
  Palette,
  Users,
  Clapperboard,
  Scroll,
  FileText,
  FlaskConical,
};

export function generateMetadata({ params }: PageProps): Metadata {
  const isZh = params.locale === "zh";
  const title = isZh
    ? "GPT-Image-2 提示词模板库（22 套）| Jilo.ai"
    : "GPT-Image-2 Prompt Templates: 22 Production-Ready Styles | Jilo.ai";
  const description = isZh
    ? "海报、信息图、电商主图、UI、品牌、人物、写实摄影等 22 套 GPT-Image-2 提示词模板，含撰写指引、避坑点和一键提示词生成器。"
    : "22 GPT-Image-2 prompt templates for posters, infographics, product shots, UI, brand, characters, and photography — with guidance, pitfalls, and a one-click prompt builder.";
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE}/${params.locale}/prompts`,
      languages: { en: `${SITE}/en/prompts`, zh: `${SITE}/zh/prompts` },
    },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function PromptsHubPage({ params }: PageProps) {
  const locale = params.locale || "en";
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);

  const groups = templatesByCategory();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("GPT-Image-2 Prompt Templates", "GPT-Image-2 提示词模板库"),
    numberOfItems: PROMPT_TEMPLATES.length,
    itemListElement: PROMPT_TEMPLATES.map((tpl, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: templateName(tpl, locale),
      url: `${SITE}/${locale}/prompts/${tpl.slug}`,
    })),
  };

  return (
    <>
      <Navbar locale={locale} />
      <SeoJsonLd data={jsonLd} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <nav className="mb-4 text-xs text-slate-500">
              <Link href={`/${locale}`} className="hover:text-slate-800">
                {t("Home", "首页")}
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-700">{t("Prompts", "提示词")}</span>
            </nav>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {t("GPT-Image-2 Prompt Templates", "GPT-Image-2 提示词模板库")}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {t(
                  "22 production-ready prompt templates across posters, infographics, product, UI, brand, characters, and photography. Each has writing guidance, common pitfalls, and a one-click prompt builder.",
                  "覆盖海报、信息图、电商、UI、品牌、人物、写实摄影等 22 套可直接使用的提示词模板。每套都附撰写指引、常见避坑点和一键提示词生成器。"
                )}
              </p>
            </div>
            {/* Category jump nav */}
            <div className="mt-7 flex flex-wrap gap-2">
              {groups.map(({ category }) => (
                <a
                  key={category}
                  href={`#${slugifyAnchor(category)}`}
                  className="rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {categoryLabel(category, locale)}
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12">
          {groups.map(({ category, items }) => {
            const Icon = ICONS[CATEGORY_META[category]?.icon] || Sparkles;
            return (
              <section key={category} id={slugifyAnchor(category)} className="mb-12 scroll-mt-20">
                <div className="mb-5 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-2xl font-bold text-slate-950">{categoryLabel(category, locale)}</h2>
                  <span className="text-sm text-slate-400">{items.length}</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((tpl) => (
                    <Link
                      key={tpl.slug}
                      href={`/${locale}/prompts/${tpl.slug}`}
                      className="group flex flex-col overflow-hidden rounded-lg border transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverSrc(tpl.slug)}
                          alt={`${templateName(tpl, locale)} — GPT-Image-2 ${t("example", "示例")}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-semibold text-slate-950 group-hover:text-emerald-700">
                          {templateName(tpl, locale)}
                        </h3>
                        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                          {isZh ? tpl.useWhen_zh : tpl.useWhen_en}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {tpl.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700">
                          {t("Open builder", "打开生成器")}
                          <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}

function slugifyAnchor(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
