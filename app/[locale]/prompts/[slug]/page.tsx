import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, Lightbulb } from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SeoJsonLd from "@/components/SeoJsonLd";
import PromptBuilder from "@/components/PromptBuilder";
import { supabase } from "@/lib/supabase";
import {
  PROMPT_BLOCKS,
  PROMPT_TEMPLATES,
  categoryLabel,
  getTemplate,
  relatedTemplates,
  templateName,
} from "@/lib/prompt-templates";

type PageProps = { params: { locale: string; slug: string } };

const SITE = "https://www.jilo.ai";

export function generateStaticParams() {
  return PROMPT_TEMPLATES.flatMap((t) =>
    ["en", "zh"].map((locale) => ({ locale, slug: t.slug }))
  );
}

export function generateMetadata({ params }: PageProps): Metadata {
  const tpl = getTemplate(params.slug);
  if (!tpl) return { title: "Prompt Template Not Found | Jilo.ai" };
  const isZh = params.locale === "zh";
  const name = templateName(tpl, params.locale);
  const useWhen = isZh ? tpl.useWhen_zh : tpl.useWhen_en;
  const title = isZh
    ? `${name} · GPT-Image-2 提示词模板与生成器 | Jilo.ai`
    : `${name} · GPT-Image-2 Prompt Template & Builder | Jilo.ai`;
  const description = isZh
    ? `${name}：${useWhen} 含撰写指引、避坑点和一键 GPT-Image-2 提示词生成器。`
    : `${name}: ${useWhen} Includes writing guidance, pitfalls, and a one-click GPT-Image-2 prompt builder.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE}/${params.locale}/prompts/${params.slug}`,
      languages: {
        en: `${SITE}/en/prompts/${params.slug}`,
        zh: `${SITE}/zh/prompts/${params.slug}`,
      },
    },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function getImageTools() {
  const { data } = await supabase
    .from("tools")
    .select("slug, name_en, name_zh, tagline_en, tagline_zh, logo_url")
    .eq("category", "Image Generation")
    .eq("status", "published")
    .order("click_count", { ascending: false })
    .limit(4);
  return data || [];
}

export default async function PromptTemplatePage({ params }: PageProps) {
  const locale = params.locale || "en";
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);

  const tpl = getTemplate(params.slug);
  if (!tpl) notFound();

  const tools = await getImageTools();
  const related = relatedTemplates(tpl);

  const name = templateName(tpl, locale);
  const useWhen = isZh ? tpl.useWhen_zh : tpl.useWhen_en;
  const guidance = isZh ? tpl.guidance_zh : tpl.guidance_en;
  const pitfalls = isZh ? tpl.pitfalls_zh : tpl.pitfalls_en;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t(`How to write a GPT-Image-2 prompt: ${name}`, `如何写 GPT-Image-2 提示词：${name}`),
    description: useWhen,
    step: PROMPT_BLOCKS.map((b, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: isZh ? b.label_zh : b.label_en,
    })),
  };

  return (
    <>
      <Navbar locale={locale} />
      <SeoJsonLd data={jsonLd} />
      <main className="bg-white">
        {/* Header */}
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <nav className="mb-4 text-xs text-slate-500">
              <Link href={`/${locale}`} className="hover:text-slate-800">
                {t("Home", "首页")}
              </Link>
              <span className="mx-1.5">/</span>
              <Link href={`/${locale}/prompts`} className="hover:text-slate-800">
                {t("Prompts", "提示词")}
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-700">{name}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {categoryLabel(tpl.category, locale)}
              </span>
              <span className="rounded-full border bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                GPT-Image-2
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">{name}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{useWhen}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...tpl.styles, ...tpl.scenes].map((tag) => (
                <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-10">
          {/* Builder */}
          <PromptBuilder template={tpl} blocks={PROMPT_BLOCKS} locale={locale} />

          {/* Outbound CTA → image tools (funnel) */}
          {tools.length > 0 && (
            <section className="mt-10 rounded-xl border bg-slate-50 p-6">
              <h2 className="text-lg font-bold text-slate-950">{t("Run this prompt in", "用这套提示词去生成")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {t("Paste your prompt into one of these AI image tools.", "把生成的提示词粘贴到下面任一 AI 图像工具中使用。")}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tools.map((tool: any) => {
                  const toolName = isZh ? tool.name_zh || tool.name_en : tool.name_en || tool.name_zh;
                  return (
                    <a
                      key={tool.slug}
                      href={`/api/out?tool=${tool.slug}&source=prompt-${tpl.slug}&locale=${locale}`}
                      rel="nofollow sponsored"
                      className="group flex items-center justify-between rounded-lg border bg-white px-4 py-3 transition hover:border-emerald-300 hover:shadow-sm"
                    >
                      <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">{toolName}</span>
                      <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                    </a>
                  );
                })}
              </div>
              <Link
                href={`/${locale}/c/image`}
                className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {t("Browse all AI image generators", "查看全部 AI 图像生成工具")}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </section>
          )}

          {/* Guidance + Pitfalls */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border p-6">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-950">{t("Writing guidance", "撰写指引")}</h2>
              </div>
              <ul className="space-y-3">
                {guidance.map((g) => (
                  <li key={g} className="flex gap-2.5 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-950">{t("Common pitfalls", "常见避坑")}</h2>
              </div>
              <ul className="space-y-3">
                {pitfalls.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm leading-6 text-slate-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Related templates */}
          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-slate-950">{t("Related templates", "相关模板")}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/${locale}/prompts/${r.slug}`}
                    className="group rounded-lg border p-4 transition hover:border-emerald-300 hover:shadow-sm"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                      {templateName(r, locale)}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                      {isZh ? r.useWhen_zh : r.useWhen_en}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
