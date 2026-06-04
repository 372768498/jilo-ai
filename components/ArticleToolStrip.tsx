// components/ArticleToolStrip.tsx
//
// De-islands content pages (news/reviews/answers) and gives them a money exit.
// The 2026-06 layout audit found these pages had zero internal links and zero
// outbound CTAs — readers (and AI-engine referrals) landed and left, sending
// nothing into the tool funnel. This strip always renders a few popular,
// monetizable tools with a Visit (/api/out) CTA so every article recirculates
// traffic into /tools and outbound affiliate clicks.
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { supabase } from "@/lib/supabase";

type Tool = {
  id: string;
  slug: string;
  name_en: string | null;
  name_zh: string | null;
  tagline_en: string | null;
  tagline_zh: string | null;
  pricing_type: string | null;
  logo_url: string | null;
  affiliate_url: string | null;
  official_url: string | null;
};

type Props = { locale: string; title?: string; limit?: number };

export default async function ArticleToolStrip({ locale, title, limit = 6 }: Props) {
  const isZh = (locale || "en").toLowerCase().startsWith("zh");

  let tools: Tool[] = [];
  try {
    const { data } = await supabase
      .from("tools")
      .select("id, slug, name_en, name_zh, tagline_en, tagline_zh, pricing_type, logo_url, affiliate_url, official_url")
      .eq("status", "published")
      .order("click_count", { ascending: false })
      .limit(limit);
    tools = (data as Tool[]) || [];
  } catch {
    return null;
  }
  if (!tools.length) return null;

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="mb-4 text-xl font-bold tracking-tight">
        {title || (isZh ? "热门 AI 工具" : "Popular AI tools")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const name = (isZh ? tool.name_zh || tool.name_en : tool.name_en || tool.name_zh) || tool.slug;
          const tagline = isZh ? tool.tagline_zh || tool.tagline_en : tool.tagline_en || tool.tagline_zh;
          const canVisit = Boolean(tool.affiliate_url || tool.official_url);
          return (
            <div key={tool.slug} className="flex flex-col rounded-lg border p-4 transition hover:shadow-sm">
              <Link
                href={`/${locale}/tools/${tool.slug}`}
                className="flex items-center gap-3 font-semibold text-slate-950 hover:text-primary"
              >
                {tool.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tool.logo_url} alt={name} className="h-8 w-8 rounded object-contain" />
                ) : null}
                <span className="min-w-0 truncate">{name}</span>
              </Link>
              {tagline ? (
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-5 text-muted-foreground">{tagline}</p>
              ) : <div className="flex-1" />}
              <div className="mt-3 flex items-center gap-3 text-sm">
                <Link href={`/${locale}/tools/${tool.slug}`} className="font-medium text-primary hover:underline">
                  {isZh ? "查看详情" : "Details"}
                </Link>
                {canVisit ? (
                  <a
                    href={`/api/out?tool=${encodeURIComponent(tool.slug)}&source=article&locale=${encodeURIComponent(locale)}`}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                  >
                    {isZh ? "访问" : "Visit"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5">
        <Link href={`/${locale}/tools`} className="text-sm font-medium text-primary hover:underline">
          {isZh ? "浏览全部 AI 工具 →" : "Browse all AI tools →"}
        </Link>
      </div>
    </section>
  );
}
