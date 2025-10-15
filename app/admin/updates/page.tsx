// app/admin/updates/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Tool = { id: string; name: string; slug: string };
type UpdateItem = {
  id: string; version: string | null; changelog: string | null; source_url: string | null; published_at: string;
  tools?: { name: string; slug: string };
};

const KEY = "jilo_admin_key";

export default function AdminUpdatesPage() {
  const [adminKey, setAdminKey] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [recent, setRecent] = useState<UpdateItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    tool_id: "",
    version: "",
    changelog: "",
    source_url: "",
    published_at: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
  });

  useEffect(() => {
    // 恢复 Admin Key
    const k = sessionStorage.getItem(KEY) || "";
    setAdminKey(k);

    // 拉工具列表
    (async () => {
      const { data } = await supabase.from("tools").select("id,name,slug").order("name");
      setTools(data || []);
    })();

    // 拉最近20条更新
    (async () => {
      const { data } = await supabase
        .from("tool_updates")
        .select("id,version,changelog,source_url,published_at,tools!inner(name,slug)")
        .order("published_at", { ascending: false })
        .limit(20);
      setRecent((data as any) || []);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (!adminKey) {
        setMsg("Please set Admin Key first.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/updates", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          tool_id: form.tool_id,
          version: form.version || null,
          changelog: form.changelog || null,
          source_url: form.source_url || null,
          published_at: new Date(form.published_at).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setMsg("Saved!");
      // refresh list
      const { data } = await supabase
        .from("tool_updates")
        .select("id,version,changelog,source_url,published_at,tools!inner(name,slug)")
        .order("published_at", { ascending: false })
        .limit(20);
      setRecent((data as any) || []);
      // reset version/changelog/source
      setForm((f) => ({ ...f, version: "", changelog: "", source_url: "" }));
    } catch (e: any) {
      setMsg(e?.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Admin · Tool Updates</h1>

      <div className="border rounded-2xl p-4 bg-white/60 mb-6">
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
            className="px-3 py-2 rounded-lg border bg-black text-white"
            onClick={() => sessionStorage.setItem(KEY, adminKey)}
          >
            Save
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Saved in sessionStorage. Only you can see this.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 border rounded-2xl p-4 bg-white/60">
        <div>
          <label className="block text-sm font-medium">Tool *</label>
          <select
            required
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.tool_id}
            onChange={(e) => setForm({ ...form, tool_id: e.target.value })}
          >
            <option value="">Select a tool…</option>
            {tools.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Version</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="e.g., 1.4.2"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Published at (UTC)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.published_at}
              onChange={(e) => setForm({ ...form, published_at: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Changelog</label>
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[100px]"
            placeholder="- Added …\n- Improved …\n- Fixed …"
            value={form.changelog}
            onChange={(e) => setForm({ ...form, changelog: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Source URL</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            placeholder="https://example.com/release-notes"
            value={form.source_url}
            onChange={(e) => setForm({ ...form, source_url: e.target.value })}
          />
        </div>

        <button className="px-4 py-2 rounded-lg border bg-black text-white disabled:opacity-60" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </form>

      {/* Recent list */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-3">Recent updates</h2>
        <ul className="space-y-3">
          {recent.map((u) => (
            <li key={u.id} className="border rounded-xl p-4">
              <div className="flex gap-2 items-center">
                <span className="font-medium">{u.tools?.name}</span>
                {u.version && <span className="text-xs px-2 py-0.5 rounded-full border">v{u.version}</span>}
                <span className="text-xs text-muted-foreground">{new Date(u.published_at).toISOString().slice(0,16).replace("T"," ")}</span>
              </div>
              {u.changelog && <pre className="text-sm mt-2 whitespace-pre-wrap">{u.changelog}</pre>}
              {u.source_url && <a className="text-sm underline mt-2 inline-block" href={u.source_url} target="_blank">Release notes</a>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
