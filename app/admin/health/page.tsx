"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Report = {
  env: Record<string, boolean>;
  anon_select_news: { ok: boolean; count?: number; error?: string } | null;
  service_access: { ok: boolean; error?: string } | null;
};

export default function HealthPage() {
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health");
        const json = await res.json();
        setR(json);
      } catch (e: any) {
        setErr(e?.message || "failed");
      }
    })();
  }, []);

  const Badge = ({ ok }: { ok: boolean }) => (
    <span className={`px-2 py-0.5 rounded-full text-xs ${ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {ok ? "OK" : "FAIL"}
    </span>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">System Health</h1>
      {err && <div className="text-red-600">{err}</div>}
      {!r ? (
        <div className="text-muted-foreground">Checking…</div>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="text-lg font-medium mb-2">Environment</h2>
            <ul className="space-y-2">
              {Object.entries(r.env).map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  <Badge ok={!!v} />
                  <code className="text-sm">{k}</code>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-medium mb-2">Database access</h2>
            <div className="flex items-center gap-3">
              <Badge ok={!!r.anon_select_news?.ok} />
              <div className="text-sm">Anon select news (count: {r.anon_select_news?.count ?? 0})</div>
              {r.anon_select_news?.error && <code className="text-xs text-red-600">{r.anon_select_news.error}</code>}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Badge ok={!!r.service_access?.ok} />
              <div className="text-sm">Service role access to tools</div>
              {r.service_access?.error && <code className="text-xs text-red-600">{r.service_access.error}</code>}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-medium mb-2">Manual checks</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li><Link className="underline" href="/en/news">/en/news</Link></li>
              <li><Link className="underline" href="/en/tools">/en/tools</Link></li>
              <li><Link className="underline" href="/compare">/compare</Link></li>
              <li><Link className="underline" href="/submit">/submit</Link></li>
              <li><Link className="underline" href="/weekly">/weekly</Link></li>
              <li><Link className="underline" href="/admin/updates">/admin/updates</Link></li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
