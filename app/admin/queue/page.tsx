// app/admin/queue/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type GapItem = {
  id: string;
  slug: string;
  name: string;
  clicks: number;
  priority: "high" | "medium" | "low";
  reason: string;
  tool_id: string | null;
  created_at: string;
};

const KEY = "jilo_admin_key";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-700",
};

export default function AdminQueuePage() {
  const [adminKey, setAdminKey] = useState("");
  const [items, setItems] = useState<GapItem[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (key: string) => {
    if (!key) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/queue", { headers: { "x-admin-key": key } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setItems(json.items || []);
      setTotalClicks(json.totalClicks || 0);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const k = sessionStorage.getItem(KEY) || "";
    setAdminKey(k);
    if (k) load(k);
  }, [load]);

  const resolve = async (id: string, status: "done" | "skipped") => {
    try {
      const res = await fetch("/api/admin/queue", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      setMsg(e?.message || "Failed to update");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Monetization Gaps</h1>
          <Link href="/admin" className="px-4 py-2 border rounded hover:bg-gray-50">Back</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Admin key */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="text-sm font-medium mb-2">Admin Key</div>
          <div className="flex gap-2">
            <input
              type="password"
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Enter ADMIN_KEY"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded-lg border bg-black text-white whitespace-nowrap"
              onClick={() => {
                sessionStorage.setItem(KEY, adminKey);
                load(adminKey);
              }}
            >
              Save &amp; Load
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-8">
            <div>
              <div className="text-4xl font-bold text-red-600">{items.length}</div>
              <div className="text-gray-600">Tools leaking revenue</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-800">{totalClicks}</div>
              <div className="text-gray-600">Outbound clicks at stake</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            These published tools get clicks but have no affiliate link. Apply for each program,
            then set the affiliate URL on the tool — the flag closes automatically on the next monitor run.
          </p>
        </div>

        {msg && <div className="text-sm text-red-600 mb-4">{msg}</div>}
        {loading && <div className="text-sm text-gray-500 mb-4">Loading…</div>}

        {/* List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3 tabular-nums">{i.clicks}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${PRIORITY_STYLE[i.priority] || ""}`}>
                      {i.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {i.tool_id && (
                      <Link href={`/admin/tools/${i.tool_id}`} className="text-indigo-600 hover:underline text-sm mr-3">
                        Set affiliate
                      </Link>
                    )}
                    <button
                      onClick={() => resolve(i.id, "skipped")}
                      className="text-gray-400 hover:text-gray-700 text-sm"
                      title="Won't pursue this one"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No open monetization gaps. {adminKey ? "" : "Enter your admin key to load."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
