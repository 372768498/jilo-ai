// app/weekly/page.tsx
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import WeeklyExport from "@/components/WeeklyExport";

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  return d.toISOString().slice(0, 10);
}

export default async function WeeklyPage() {
  const now = new Date();
  const endISO = now.toISOString();
  const startISO = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  const [newsRes, updRes] = await Promise.all([
    supabase
      .from("news")
      .select("id, slug, title, summary, source, source_url, published_at")
      .gte("published_at", startISO)
      .order("published_at", { ascending: false }),
    supabase
      .from("tool_updates")
      .select("id, tool_id, version, changelog, source_url, published_at, tools!inner(slug,name)")
      .gte("published_at", startISO)
      .order("published_at", { ascending: false }),
  ]);

  const news = newsRes.data || [];
  const updates = updRes.data || [];
  const top3 = news.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Weekly AI Digest</h1>
      <div className="text-sm text-muted-foreground mb-6">
        {fmtDate(startISO)} — {fmtDate(endISO)}
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-medium mb-3">Top headlines</h2>
        {top3.length === 0 ? (
          <div className="text-muted-foreground">No headlines this week.</div>
        ) : (
          <ol className="list-decimal pl-5 space-y-3">
            {top3.map((n) => (
              <li key={n.id}>
                <Link href={`/en/news/${n.slug}`} className="underline">{n.title}</Link>{" "}
                <span className="text-muted-foreground">({fmtDate(n.published_at)})</span>
                {n.summary && <p className="text-sm mt-1">{n.summary}</p>}
                {n.source_url && (
                  <a className="text-sm underline" href={n.source_url} target="_blank">Original</a>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-medium mb-3">New & updated tools</h2>
        {updates.length === 0 ? (
          <div className="text-muted-foreground">No updates recorded.</div>
        ) : (
          <ul className="space-y-3">
            {updates.map((u: any) => (
              <li key={u.id} className="border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Link href={`/en/tools/${u.tools.slug}`} className="font-medium underline">
                    {u.tools.name}
                  </Link>
                  {u.version && <span className="text-xs px-2 py-0.5 rounded-full border">v{u.version}</span>}
                  <span className="text-xs text-muted-foreground">{fmtDate(u.published_at)}</span>
                </div>
                {u.changelog && (
                  <div className="text-sm mt-2 whitespace-pre-wrap">{u.changelog}</div>
                )}
                {u.source_url && (
                  <a className="text-sm underline mt-2 inline-block" href={u.source_url} target="_blank">
                    Release notes
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Export buttons */}
      <WeeklyExport
        startISO={startISO}
        endISO={endISO}
        headlines={top3.map((n: any) => ({
          slug: n.slug, title: n.title, summary: n.summary, source_url: n.source_url, published_at: n.published_at
        }))}
        updates={updates as any}
      />
    </div>
  );
}
