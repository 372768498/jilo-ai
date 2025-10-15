import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Filters from "@/components/filters";

type PageProps = {
  params: { locale: string };
  searchParams: {
    page?: string;
    pricing?: string | string[];
    lang?: string | string[];
    platform?: string | string[];
    opensource?: string; // "1"
    login?: string;      // "1"
  };
};

function asArray(v?: string | string[]) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  return d.toISOString().slice(0, 10);
}

export default async function ToolsIndexPage({ params, searchParams }: PageProps) {
  const locale = params?.locale || "en";
  const page = Number(searchParams?.page || 1);
  const pageSize = 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const pricing = asArray(searchParams.pricing);   // free | freemium | paid
  const langs = asArray(searchParams.lang);        // en | zh ...
  const plats = asArray(searchParams.platform);    // web | chrome | ios | android | vscode
  const onlyOpenSource = searchParams.opensource === "1";
  const onlyLogin = searchParams.login === "1";

  // 基于视图的查询（只有当参数存在时才加过滤条件）
  let query = supabase
    .from("tools_simple")
    .select(
      "id, slug, name, short_desc, official_url, logo_url, pricing, languages, platforms, open_source, need_login, last_update_at",
      { count: "exact" },
    );

  if (pricing.length) query = query.in("pricing", pricing);
  if (langs.length) query = query.overlaps("languages", langs);
  if (plats.length) query = query.overlaps("platforms", plats);
  if (onlyOpenSource) query = query.eq("open_source", true);
  if (onlyLogin) query = query.eq("need_login", true);

  query = query.order("slug", { ascending: true }).range(from, to);

  const { data, error, count } = await query;
  if (error) console.error("[tools_simple] error:", error);
  const items = data || [];
  const total = count ?? items.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">{locale === "zh" ? "人工智能工具" : "AI Tools"}</h1>

      <Filters />

      <div className="text-sm text-muted-foreground mb-4">{total} {locale === "zh" ? "个结果" : "results"}</div>

      {items.length === 0 ? (
        <div className="text-muted-foreground">
          {locale === "zh" ? "没有匹配的工具，请调整筛选条件。" : "No matching tools. Try clearing filters."}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <div key={t.id} className="border rounded-2xl p-4 bg-white/60 hover:shadow-sm transition">
              <div className="flex gap-3 items-start">
                {t.logo_url ? (
                  <img src={t.logo_url} alt={t.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-xs">Logo</div>
                )}
                <div className="flex-1">
                  <Link href={`/${locale}/tools/${t.slug}`} className="font-medium underline">
                    {t.name}
                  </Link>
                  {t.short_desc && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.short_desc}</p>}
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {t.pricing && <span className="px-2 py-0.5 rounded-full border">{t.pricing}</span>}
                    {Array.isArray(t.languages) && t.languages.slice(0, 2).map((x: string) => (
                      <span key={x} className="px-2 py-0.5 rounded-full border">{x}</span>
                    ))}
                    {Array.isArray(t.platforms) && t.platforms.slice(0, 2).map((x: string) => (
                      <span key={x} className="px-2 py-0.5 rounded-full border">{x}</span>
                    ))}
                    {t.open_source && <span className="px-2 py-0.5 rounded-full border">open-source</span>}
                    {t.need_login && <span className="px-2 py-0.5 rounded-full border">login</span>}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-3">
                {locale === "zh" ? "最近更新：" : "Updated:"} {fmtDate(t.last_update_at)}
              </div>
              {t.official_url && (
                <a href={t.official_url} target="_blank" rel="noopener noreferrer" className="text-sm underline mt-2 inline-block">
                  {locale === "zh" ? "访问官网" : "Visit website"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
