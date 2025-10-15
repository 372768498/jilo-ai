// app/admin/health/page.tsx
import Link from "next/link";

type Health = {
  env: Record<string, boolean>;
  anon_select_news?: { ok: boolean; count?: number };
  service_access?: { ok: boolean };
};

export const dynamic = "force-dynamic"; // no cache

async function getHealth(baseUrl: string) {
  const url = `${baseUrl}/api/health`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Health;
  } catch (e) {
    return null;
  }
}

export default async function AdminHealth() {
  // 在 Vercel/本地都能工作：优先 NEXT_PUBLIC_SITE_URL，退化到 相对路径
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const health = await getHealth(base || "");

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">System Health</h1>

      {!health ? (
        <div className="text-red-600">Failed to load /api/health</div>
      ) : (
        <>
          <h2 className="font-semibold mt-6 mb-2">Environment</h2>
          <ul className="space-y-1">
            {Object.entries(health.env).map(([k, v]) => (
              <li key={k}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${v ? "bg-green-500" : "bg-red-500"}`} />
                <code>{k}</code>: {v ? "OK" : "FAIL"}
              </li>
            ))}
          </ul>

          <h2 className="font-semibold mt-6 mb-2">Database access</h2>
          <ul className="space-y-1">
            <li>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${health.anon_select_news?.ok ? "bg-green-500" : "bg-red-500"}`} />
              Anon select news (count: {health.anon_select_news?.count ?? 0})
            </li>
            <li>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${health.service_access?.ok ? "bg-green-500" : "bg-red-500"}`} />
              Service role access to tools
            </li>
          </ul>

          <h2 className="font-semibold mt-6 mb-2">Manual checks</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li><Link className="underline" href="/en/news">/en/news</Link></li>
            <li><Link className="underline" href="/en/tools">/en/tools</Link></li>
            <li><Link className="underline" href="/admin/updates">/admin/updates</Link></li>
          </ul>
        </>
      )}
    </div>
  );
}
