import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { supabase } from "@/lib/supabase";

type Tool = {
  id: string;
  slug: string;
  name_en: string | null;
  name_zh: string | null;
  tagline_en: string | null;
  tagline_zh: string | null;
  category: string | null;
  pricing_type: string | null;
  logo_url: string | null;
  official_url: string | null;
  affiliate_url: string | null;
  click_count: number | null;
};

const categoryRules = [
  { terms: ["video", "runway", "kling", "luma", "sora", "heygen", "capcut"], category: "Video", label: "AI video tools" },
  { terms: ["music", "audio", "voice", "suno", "udio", "elevenlabs"], category: "Audio", label: "AI audio tools" },
  { terms: ["image", "midjourney", "dall", "design"], category: "Image Generation", label: "AI image tools" },
  { terms: ["coding", "code", "cursor", "copilot", "windsurf", "developer"], category: "Developer Tools", label: "AI coding tools" },
  { terms: ["chat", "chatgpt", "claude", "gemini", "deepseek"], category: "Chatbot", label: "AI chatbot tools" },
  { terms: ["writing", "writer", "copy", "seo", "content"], category: "Writing", label: "AI writing tools" },
  { terms: ["ppt", "presentation", "productivity", "office"], category: "Productivity", label: "AI productivity tools" },
  { terms: ["marketing", "sales", "crm"], category: "Marketing", label: "AI marketing tools" },
];

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function inferCategory(slug: string) {
  const normalized = normalizeSlug(slug);
  return categoryRules.find((rule) => rule.terms.some((term) => normalized.includes(term)));
}

function titleFromSlug(slug: string) {
  return normalizeSlug(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function localizedName(tool: Tool, isZh: boolean) {
  return (isZh ? tool.name_zh || tool.name_en : tool.name_en || tool.name_zh) || "AI Tool";
}

function localizedDesc(tool: Tool, isZh: boolean) {
  return (isZh ? tool.tagline_zh || tool.tagline_en : tool.tagline_en || tool.tagline_zh) || "";
}

async function getToolsForSlug(slug: string, limit = 12) {
  const rule = inferCategory(slug);
  let query = supabase
    .from("tools")
    .select("id,slug,name_en,name_zh,tagline_en,tagline_zh,category,pricing_type,logo_url,official_url,affiliate_url,click_count")
    .eq("status", "published")
    .order("click_count", { ascending: false })
    .limit(limit);

  if (rule?.category) query = query.eq("category", rule.category);

  const { data } = await query;
  if (data && data.length > 0) return data as Tool[];

  const fallback = await supabase
    .from("tools")
    .select("id,slug,name_en,name_zh,tagline_en,tagline_zh,category,pricing_type,logo_url,official_url,affiliate_url,click_count")
    .eq("status", "published")
    .order("click_count", { ascending: false })
    .limit(limit);

  return (fallback.data || []) as Tool[];
}

async function findToolByToken(token: string) {
  const clean = normalizeSlug(token);
  const { data } = await supabase
    .from("tools")
    .select("id,slug,name_en,name_zh,tagline_en,tagline_zh,category,pricing_type,logo_url,official_url,affiliate_url,click_count")
    .eq("status", "published")
    .or(`slug.ilike.%${clean}%,name_en.ilike.%${clean.replace(/-/g, " ")}%`)
    .limit(1)
    .maybeSingle();

  return data as Tool | null;
}

export function getFallbackMetadata(slug: string, type: "best" | "review" | "alternatives" | "compare", locale: string) {
  const isZh = locale === "zh";
  const readable = titleFromSlug(slug);
  const prefix = type === "alternatives" ? "Alternatives to" : type === "compare" ? "Compare" : "Best";
  const enCore = type === "best" || type === "review" && readable.toLowerCase().startsWith("best ")
    ? readable
    : `${prefix} ${readable}`;
  const enTitle = `${enCore} | Jilo.ai`;
  const zhTitle = `${readable} - AI 工具推荐 | Jilo.ai`;
  return {
    title: isZh ? zhTitle : enTitle,
    description: isZh
      ? `Jilo.ai 根据任务、价格和使用门槛整理 ${readable} 相关 AI 工具。`
      : `Jilo.ai helps you compare ${readable} options by use case, pricing, access, and alternatives.`,
  };
}

export async function BestToolsFallbackPage({ locale, slug, mode = "best" }: { locale: string; slug: string; mode?: "best" | "review" | "alternatives" }) {
  const isZh = locale === "zh";
  const tools = await getToolsForSlug(slug);
  const rule = inferCategory(slug);
  const readable = rule?.label || titleFromSlug(slug);
  const title = isZh ? `${readable} 推荐` : `Best ${readable}`;
  const subtitle = isZh
    ? "这是一个兼容旧 SEO 链接的推荐页。Jilo.ai 会继续补充更完整的实测、价格和替代品信息。"
    : "This page keeps an indexed SEO URL useful while Jilo.ai expands the full review, pricing, and alternatives coverage.";

  return (
    <>
      <Navbar locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase text-emerald-700">{mode === "alternatives" ? "Alternatives" : "AI Tool Guide"}</p>
          <h1 className="text-3xl font-bold text-slate-950 md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">{subtitle}</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.id} href={`/${locale}/tools/${tool.slug}`} className="rounded-lg border bg-white p-4 transition hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-start gap-3">
                {tool.logo_url ? <img src={tool.logo_url} alt="" className="h-10 w-10 rounded-md border object-cover" /> : <div className="h-10 w-10 rounded-md bg-slate-900" />}
                <div>
                  <h2 className="font-semibold text-slate-950">{localizedName(tool, isZh)}</h2>
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{localizedDesc(tool, isZh)}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                    {tool.category ? <span className="rounded border px-2 py-1">{tool.category}</span> : null}
                    {tool.pricing_type ? <span className="rounded border px-2 py-1">{tool.pricing_type}</span> : null}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}

export async function CompareFallbackPage({ locale, slug }: { locale: string; slug: string }) {
  const isZh = locale === "zh";
  const parts = normalizeSlug(slug).split("-vs-");
  const candidates = await Promise.all(parts.slice(0, 4).map((part) => findToolByToken(part)));
  const namedTools = candidates.filter(Boolean) as Tool[];
  const relatedTools = namedTools.length ? namedTools : await getToolsForSlug(slug, 8);

  return (
    <>
      <Navbar locale={locale} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="mb-3 text-sm font-semibold uppercase text-emerald-700">Comparison</p>
        <h1 className="text-3xl font-bold text-slate-950 md:text-4xl">{titleFromSlug(slug)}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          {isZh
            ? "这个对比页正在补充完整评测。先根据现有工具库给出可点击的相关工具，避免旧搜索链接落空。"
            : "This comparison is being expanded. For now, Jilo.ai keeps the indexed URL useful with related tools from the directory."}
        </p>

        <div className="mt-8 overflow-hidden rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3">Tool</th>
                <th className="p-3">Category</th>
                <th className="p-3">Pricing</th>
                <th className="p-3">Next step</th>
              </tr>
            </thead>
            <tbody>
              {relatedTools.map((tool) => (
                <tr key={tool.id} className="border-t">
                  <td className="p-3 font-medium">{localizedName(tool, isZh)}</td>
                  <td className="p-3">{tool.category || "-"}</td>
                  <td className="p-3">{tool.pricing_type || "-"}</td>
                  <td className="p-3">
                    <Link className="font-semibold text-emerald-700" href={`/${locale}/tools/${tool.slug}`}>
                      {isZh ? "查看工具" : "View tool"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
