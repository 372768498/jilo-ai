import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Star, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

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

async function getCategory(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from("categories")
    .select("slug, name_en, name_zh, description_en, description_zh")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Category) || null;
}

async function getTools(slug: string) {
  const { data } = await supabase
    .from("tools")
    .select("slug, name_en, name_zh, tagline_en, tagline_zh, pricing_type, rating, logo_url, affiliate_url, official_url, is_featured, click_count")
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
  const { data } = await supabase
    .from("compare_articles")
    .select("slug, title, locale")
    .eq("locale", locale)
    .eq("status", "published")
    .limit(60);
  // Keep comparisons that involve a tool from this category.
  return (data || [])
    .filter((c: any) => toolSlugs.some((s) => (c.slug || "").includes(s)))
    .slice(0, 8);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = await getCategory(params.slug);
  if (!cat) return {};
  const isZh = params.locale === "zh";
  const name = isZh ? cat.name_zh : cat.name_en;
  const title = isZh ? `2026 年最佳${name}工具 | Jilo.ai` : `Best ${name} Tools in 2026 | Jilo.ai`;
  const description = isZh
    ? `2026 年最佳${name}工具对比与排行：功能、价格、适用场景，帮你最快选对工具。`
    : `Compare the best ${name} tools in 2026 — features, pricing, and use cases to pick the right one fast.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE}/${params.locale}/c/${params.slug}`,
      languages: {
        en: `${SITE}/en/c/${params.slug}`,
        zh: `${SITE}/zh/c/${params.slug}`,
      },
    },
  };
}

const PRICING_LABEL: Record<string, { en: string; zh: string }> = {
  free: { en: "Free", zh: "免费" },
  freemium: { en: "Freemium", zh: "免费增值" },
  paid: { en: "Paid", zh: "付费" },
  subscription: { en: "Subscription", zh: "订阅" },
};

export default async function CategoryHubPage({ params }: PageProps) {
  const { locale, slug } = params;
  const isZh = locale === "zh";
  const cat = await getCategory(slug);
  if (!cat) notFound();

  const tools = await getTools(slug);
  const comparisons = await getComparisons(locale, tools.map((t: any) => t.slug));

  const name = isZh ? cat.name_zh : cat.name_en;
  const description = isZh ? cat.description_zh : cat.description_en;
  const t = (en: string, zh: string) => (isZh ? zh : en);
  const pricing = (p: string) => PRICING_LABEL[p]?.[isZh ? "zh" : "en"] || p || "—";
  const toolName = (x: any) => (isZh ? x.name_zh || x.name_en : x.name_en || x.name_zh);
  const tagline = (x: any) => (isZh ? x.tagline_zh || x.tagline_en : x.tagline_en || x.tagline_zh);
  const cta = (x: any) => x.affiliate_url || x.official_url || `/${locale}/tools/${x.slug}`;

  return (
    <>
      <Navbar locale={locale} />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <nav className="mb-3 text-sm text-slate-500">
              <Link href={`/${locale}/categories`} className="hover:text-slate-800">{t("Categories", "分类")}</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-700">{name}</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              {t(`Best ${name} Tools in 2026`, `2026 年最佳${name}工具`)}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              {t(
                `${tools.length} hand-picked ${name} tools, compared by features, pricing, and best use case.`,
                `精选 ${tools.length} 款${name}工具，按功能、价格、适用场景为你对比，帮你最快选对。`,
              )}
            </p>
          </div>
        </section>

        {/* Engine-written intro */}
        {description ? (
          <section className="mx-auto max-w-3xl px-4 pt-10">
            <div className="space-y-4 text-base leading-7 text-slate-700">
              {description.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        ) : null}

        {/* Comparison table */}
        {tools.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-10">
            <h2 className="mb-4 text-2xl font-bold text-slate-950">{t("Quick comparison", "快速对比")}</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t("Tool", "工具")}</th>
                    <th className="px-4 py-3">{t("Pricing", "价格")}</th>
                    <th className="px-4 py-3">{t("Rating", "评分")}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tools.slice(0, 12).map((x: any) => (
                    <tr key={x.slug} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/${locale}/tools/${x.slug}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                          {toolName(x)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{pricing(x.pricing_type)}</td>
                      <td className="px-4 py-3 text-slate-600">{x.rating ? `${x.rating.toFixed(1)}★` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <a href={cta(x)} target="_blank" rel="nofollow sponsored noopener" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                          {t("Visit", "访问")} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Ranked cards */}
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">{t(`All ${name} tools`, `全部${name}工具`)}</h2>
          {tools.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((x: any) => (
                <div key={x.slug} className="flex flex-col rounded-lg border bg-white p-5 transition hover:border-emerald-300 hover:shadow-md">
                  <div className="mb-3 flex items-center gap-3">
                    {x.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.logo_url} alt={toolName(x)} className="h-10 w-10 rounded-md object-contain" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-slate-500">
                        {toolName(x)?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <Link href={`/${locale}/tools/${x.slug}`} className="font-semibold text-slate-950 hover:text-emerald-700">
                        {toolName(x)}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {pricing(x.pricing_type)}
                        {x.rating ? <span className="ml-2 inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{x.rating.toFixed(1)}</span> : null}
                      </div>
                    </div>
                  </div>
                  <p className="line-clamp-2 flex-1 text-sm text-slate-600">{tagline(x)}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href={`/${locale}/tools/${x.slug}`} className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                      {t("Details", "详情")}
                    </Link>
                    <a href={cta(x)} target="_blank" rel="nofollow sponsored noopener" className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
                      {t("Visit", "访问")} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-slate-50 p-10 text-center text-slate-600">
              {t("No tools yet in this category.", "该类目暂无工具。")}
            </div>
          )}
        </section>

        {/* Popular comparisons in this category */}
        {comparisons.length > 0 && (
          <section className="border-t bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-10">
              <h2 className="mb-4 text-2xl font-bold text-slate-950">{t("Popular comparisons", "热门对比")}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {comparisons.map((c: any) => (
                  <Link key={c.slug} href={`/${locale}/compare/${c.slug.replace(/-zh$/, "")}`} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 hover:border-emerald-300">
                    <span className="font-medium text-slate-800">{c.title}</span>
                    <ArrowRight className="h-4 w-4 text-emerald-600" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer locale={locale} />
    </>
  );
}
