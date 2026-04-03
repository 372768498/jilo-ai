import Link from "next/link";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

type Health = {
  env: Record<string, boolean>;
  anon_select_news?: { ok: boolean; count?: number };
  service_access?: { ok: boolean };
};

export const dynamic = "force-dynamic";

async function getHealth(baseUrl: string, sessionCookie: string) {
  const url = `${baseUrl}/api/health`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: sessionCookie ? { cookie: `${ADMIN_SESSION_COOKIE}=${sessionCookie}` } : undefined,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as Health;
  } catch {
    return null;
  }
}

export default async function AdminHealth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const health = await getHealth(base, sessionCookie);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">System Health</h1>

      {!health ? (
        <div className="text-red-600">Failed to load /api/health</div>
      ) : (
        <>
          <h2 className="font-semibold mt-6 mb-2">Environment</h2>
          <ul className="space-y-1">
            {Object.entries(health.env).map(([key, value]) => (
              <li key={key}>
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    value ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <code>{key}</code>: {value ? "OK" : "FAIL"}
              </li>
            ))}
          </ul>

          <h2 className="font-semibold mt-6 mb-2">Database access</h2>
          <ul className="space-y-1">
            <li>
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  health.anon_select_news?.ok ? "bg-green-500" : "bg-red-500"
                }`}
              />
              Anon select news (count: {health.anon_select_news?.count ?? 0})
            </li>
            <li>
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  health.service_access?.ok ? "bg-green-500" : "bg-red-500"
                }`}
              />
              Service role access to tools
            </li>
          </ul>

          <h2 className="font-semibold mt-6 mb-2">Manual checks</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <Link className="underline" href="/en/news">
                /en/news
              </Link>
            </li>
            <li>
              <Link className="underline" href="/en/tools">
                /en/tools
              </Link>
            </li>
            <li>
              <Link className="underline" href="/admin/updates">
                /admin/updates
              </Link>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
