import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { notFound } from "next/navigation";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: { locale: string; slug: string } };

const SITE = "https://www.jilo.ai";

type Category = {
  slug: string;
  name_en: string;
  name_zh: string;
  description_en: string | null;
  description_zh: string | null;
};

const PRICING_LABEL: Record<string, { en: string; zh: string }> = {
  free: { en: "Free", zh: "免费" },
  freemium: { en: "Freemium", zh: "免费增值" },
  paid: { en: "Paid", zh: "付费" },
  subscription: { en: "Subscription", zh: "订阅" },
};

async function getCategory(slug: string): Promise<Category | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("categories")
    .select("slug, name_en, name_zh, description_en, description_zh")
    .eq("slug", slug)
    .maybeSingle();

  return (data as Category) || null;
}

async function getTools(slug: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tools")
    .select(
      "id, slug, name_en, name_zh, tagline_en, tagline_zh, pricing_type, rating, logo_url, affiliate_url, official_url, is_featured, click_count",
    )
    .eq("category_canonical", slug)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("click_count", { ascending: false })
    .order("rating", { ascending: false })
    .limit(40);

  return data || [];
}

async function getComparisons(locale: string, toolSlugs: string[]) {
  if (!toolSlugs.length) return [];

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("compare_articles")
    .select("slug, title, locale")
    .eq("locale", locale)
    .eq("status", "published")
    .limit(60);

  return (data || [])
    .filter((comparison: any) => toolSlugs.some((slug) => (comparison.slug || "").includes(slug)))
    .slice(0, 8);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getCategory(params.slug);
  if (!category) return {};

  const isZh = params.locale === "zh";
  const name = isZh ? category.name_zh || category.name_en : category.name_en || category.name_zh;

  return {
    title: isZh ? `2026 最佳 ${name} 工具 | Jilo.ai` : `Best ${name} Tools in 2026 | Jilo.ai`,
    description: isZh
      ? `对比 2026 年最佳 ${name} 工具：功能、价格、适用场景和替代方案。`
      : `Compare the best ${name} tools in 2026: features, pricing, use cases, and alternatives.`,
    alternates: {
      canonical: `${SITE}/${params.locale}/c/${params.slug}`,
      languages: {
        en: `${SITE}/en/c/${params.slug}`,
        zh: `${SITE}/zh/c/${params.slug}`,
      },
    },
  };
}

export default async function CategoryHubPage({ params }: PageProps) {
  const { locale, slug } = params;
  const isZh = locale === "zh";
  const category = await getCategory(slug);
  if (!category) notFound();

  const tools = await getTools(slug);
  const comparisons = await getComparisons(locale, tools.map((tool: any) => tool.slug));

  const t = (en: string, zh: string) => (isZh ? zh : en);
  const name = isZh ? category.name_zh || category.name_en : category.name_en || category.name_zh;
  const description = isZh ? category.description_zh || category.description_en : category.description_en || category.description_zh;
  const pricing = (value: string | null) => (value ? PRICING_LABEL[value]?.[isZh ? "zh" : "en"] || value : "-");
  const toolName = (tool: any) => (isZh ? tool.name_zh || tool.name_en : tool.name_en || tool.name_zh);
  const tagline = (tool: any) => (isZh ? tool.tagline_zh || tool.tagline_en : tool.tagline_en || tool.tagline_zh);
  const outbound = (tool: any) => `/api/out?tool=${encodeURIComponent(tool.id)}&source=category_hub&locale=${encodeURIComponent(locale)}`;

  return (
    <>
      <Navbar locale={locale} />
      <main className="min-h-screen bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <nav className="mb-3 text-sm text-slate-500">
              <Link href={`/${locale}/tools`} className="hover:text-slate-800">
                {t("Tools", "工具")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-700">{name}</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              {t(`Best ${name} Tools in 2026`, `2026 最佳 ${name} 工具`)}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              {description ||
                t(
                  `${tools.length} hand-picked ${name} tools, compared by features, pricing, rating, and use case.`,
                  `精选 ${tools.length} 款 ${name} 工具，按功能、价格、评分和适用场景对比。`,
                )}
            </p>
          </div>
        </section>

        {tools.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-10">
            <h2 className="mb-4 text-2xl font-bold text-slate-950">{t("Quick comparison", "快速对比")}</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t("Tool", "工具")}</th>
                    <th className="px-4 py-3">{t("Pricing", "价格")}</th>
                    <th className="px-4 py-3">{t("Rating", "评分")}</th>
                    <th className="px-4 py-3 text-right">{t("Action", "操作")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tools.slice(0, 12).map((tool: any) => (
                    <tr key={tool.slug} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/${locale}/tools/${tool.slug}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                          {toolName(tool)}
                        </Link>
                        {tagline(tool) ? <div className="mt-1 max-w-xl text-xs text-slate-500">{tagline(tool)}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{pricing(tool.pricing_type)}</td>
                      <td className="px-4 py-3 text-slate-600">{tool.rating ? tool.rating.toFixed(1) : "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {tool.official_url || tool.affiliate_url ? (
                          <a
                            href={outbound(tool)}
                            target="_blank"
                            rel="nofollow sponsored noopener"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                          >
                            {t("Visit", "访问")} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <Link href={`/${locale}/tools/${tool.slug}`} className="font-semibold text-emerald-700 hover:underline">
                            {t("Review", "评测")}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 pb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">{t(`All ${name} tools`, `全部 ${name} 工具`)}</h2>
          {tools.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool: any) => (
                <article key={tool.slug} className="flex flex-col rounded-lg border bg-white p-5 transition hover:border-emerald-300 hover:shadow-md">
                  <div className="mb-3 flex items-center gap-3">
                    {tool.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tool.logo_url} alt={toolName(tool)} className="h-10 w-10 rounded-md object-contain" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-slate-500">
                        {toolName(tool)?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <Link href={`/${locale}/tools/${tool.slug}`} className="font-semibold text-slate-950 hover:text-emerald-700">
                        {toolName(tool)}
                      </Link>
                      <div className="mt-0.5 text-xs text-slate-500">{pricing(tool.pricing_type)}</div>
                    </div>
                  </div>
                  <p className="min-h-[48px] text-sm leading-6 text-slate-600">{tagline(tool) || t("AI tool in this category.", "该分类下的 AI 工具。")}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Star className="h-4 w-4 text-amber-500" />
                      {tool.rating ? tool.rating.toFixed(1) : "-"}
                    </span>
                    <a href={outbound(tool)} target="_blank" rel="nofollow sponsored noopener" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                      {t("Visit", "访问")} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-slate-50 p-8 text-slate-600">{t("No published tools in this category yet.", "该分类暂时没有已发布工具。")}</div>
          )}
        </section>

        {comparisons.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 pb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-950">{t("Related comparisons", "相关对比")}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {comparisons.map((comparison: any) => (
                <Link
                  key={comparison.slug}
                  href={`/${locale}/compare/${comparison.slug}`}
                  className="rounded-lg border p-4 font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {comparison.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer locale={locale} />
    </>
  );
}
