// app/[locale]/news/page.tsx
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type PageProps = { params: { locale: string }, searchParams: { page?: string } };

const PAGE_SIZE = 10;

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(+d) ? "" : d.toISOString().slice(0, 10);
}

function getSourceBadge(source?: string | null) {
  const s = (source || "").toLowerCase();
  if (s.includes("techcrunch")) return "TC";
  if (s.includes("theverge") || s.includes("verge")) return "Verge";
  if (s.includes("openai")) return "OpenAI";
  return null;
}

function makePages(cur: number, total: number) {
  const pages = new Set<number>();
  const add = (n: number) => { if (n >= 1 && n <= total) pages.add(n); };
  [1, 2, total - 1, total].forEach(add);
  for (let i = cur - 2; i <= cur + 2; i++) add(i);
  return Array.from(pages).sort((a, b) => a - b);
}

export default async function NewsIndexPage({ params, searchParams }: PageProps) {
  const locale = params?.locale || "en";
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("news_simple")
    .select("slug, title, summary, source, source_url, cover_url, published_at", { count: "exact" })
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) console.error("[news_simple] error:", error);

  const items = data || [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pages = makePages(page, totalPages);
  const linkTo = (p: number) => `/${locale}/news${p > 1 ? `?page=${p}` : ""}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">
        {locale === "zh" ? "人工智能新闻" : "AI News"}
      </h1>
      <div className="text-sm text-muted-foreground mb-6">{total} {locale === "zh" ? "条" : "items"}</div>

      {items.length === 0 ? (
        <div className="text-muted-foreground">
          {locale === "zh" ? "暂无消息。请稍后再回来。" : "No news yet. Come back later."}
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((n) => {
              const badge = getSourceBadge(n.source);
              return (
                <li key={n.slug} className="border rounded-2xl p-4 bg-white/60 hover:shadow-sm transition">
                  <div className="flex gap-4">
                    {n.cover_url ? (
                      <img src={n.cover_url} alt={n.title || ""} className="w-32 h-20 object-cover rounded-lg flex-shrink-0" />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/${locale}/news/${n.slug}`} className="font-medium underline">{n.title}</Link>
                        {badge && <span className="text-xs px-2 py-0.5 rounded-full border">{badge}</span>}
                      </div>
                      {n.summary && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{n.summary}</p>}
                      <div className="text-xs text-muted-foreground mt-2">
                        {fmtDate(n.published_at)} · {n.source || "Source"}
                        {n.source_url && (
                          <> · <a href={n.source_url} target="_blank" className="underline" rel="noopener noreferrer">
                            {locale === "zh" ? "原文链接" : "Original"}
                          </a></>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* 分页条 */}
          <nav className="flex items-center justify-center gap-2 mt-8">
            <Link href={linkTo(Math.max(1, page - 1))} aria-disabled={page === 1}
              className={`px-3 py-1 rounded-md border ${page === 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}>
              {locale === "zh" ? "上一页" : "Prev"}
            </Link>

            {pages.map((p, i) => {
              const prev = pages[i - 1];
              const needDots = prev && p - prev > 1;
              return (
                <span key={p} className="flex">
                  {needDots && <span className="px-2 text-muted-foreground">…</span>}
                  <Link href={linkTo(p)} className={`px-3 py-1 rounded-md border ${p === page ? "bg-black text-white border-black" : "hover:bg-gray-50"}`}>
                    {p}
                  </Link>
                </span>
              );
            })}

            <Link href={linkTo(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages}
              className={`px-3 py-1 rounded-md border ${page === totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}>
              {locale === "zh" ? "下一页" : "Next"}
            </Link>
          </nav>

          <div className="text-xs text-muted-foreground text-center mt-3">
            {Math.min(total, from + 1)}–{Math.min(total, to + 1)} / {total}
          </div>
        </>
      )}
    </div>
  );
}
