import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const dynamic = "force-dynamic";

type PageProps = { params: { locale: string } };

const SITE = "https://www.jilo.ai";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params.locale === "zh";
  return {
    title: isZh ? "AI 工具分类 | Jilo.ai" : "AI Tool Categories | Jilo.ai",
    description: isZh
      ? "按类目浏览最佳 AI 工具：视频、图像、写作、编程、音频等，一站找到你需要的。"
      : "Browse the best AI tools by category — video, image, writing, coding, audio and more.",
    alternates: {
      canonical: `${SITE}/${params.locale}/categories`,
      languages: { en: `${SITE}/en/categories`, zh: `${SITE}/zh/categories` },
    },
  };
}

export default async function CategoriesIndexPage({ params }: PageProps) {
  const { locale } = params;
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);

  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name_en, name_zh, description_en, description_zh")
    .order("display_order", { ascending: true });

  // Tool counts per canonical category.
  const { data: tools } = await supabase
    .from("tools")
    .select("category_canonical")
    .eq("status", "published");
  const counts: Record<string, number> = {};
  for (const x of tools || []) {
    const c = (x as any).category_canonical;
    if (c) counts[c] = (counts[c] || 0) + 1;
  }

  return (
    <>
      <Navbar locale={locale} />
      <main className="min-h-screen bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700">
              <LayoutGrid className="h-4 w-4 text-emerald-600" />
              {t("Categories", "分类")}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              {t("Browse AI Tools by Category", "按类目浏览 AI 工具")}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              {t(
                "Pick a category to see the best tools compared by features, pricing, and use case.",
                "选一个类目，查看该领域最佳工具的功能、价格、适用场景对比。",
              )}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(categories || []).filter((c: any) => (counts[c.slug] || 0) > 0).map((c: any) => {
              const name = isZh ? c.name_zh : c.name_en;
              const desc = isZh ? c.description_zh : c.description_en;
              return (
                <Link
                  key={c.slug}
                  href={`/${locale}/c/${c.slug}`}
                  className="group flex flex-col rounded-lg border bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-950 group-hover:text-emerald-700">{name}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {counts[c.slug] || 0}
                    </span>
                  </div>
                  {desc ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{desc}</p> : null}
                  <div className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700">
                    {t("View tools", "查看工具")}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
