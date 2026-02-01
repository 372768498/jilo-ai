// app/submit/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function SubmitToolPage() {
  const [form, setForm] = useState({
    email: "",
    tool_name: "",
    official_url: "",
    pitch: "",
    pricing: "freemium",
    platforms: [] as string[],
    logo_url: "",
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const togglePlatform = (p: string) => {
    setForm((f) => {
      const has = f.platforms.includes(p);
      return { ...f, platforms: has ? f.platforms.filter((x) => x !== p) : [...f.platforms, p] };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const { error } = await supabase.from("submissions").insert({
        submitter_email: form.email || null,
        tool_name: form.tool_name,
        official_url: form.official_url || null,
        pitch: form.pitch || null,
        pricing: form.pricing || null,
        platforms: form.platforms,
        logo_url: form.logo_url || null,
        status: "pending",
      });
      if (error) throw error;
      setOk(true);
      setForm({
        email: "",
        tool_name: "",
        official_url: "",
        pitch: "",
        pricing: "freemium",
        platforms: [],
        logo_url: "",
      });
    } catch (e: any) {
      setErr(e?.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  const PLATFORMS = ["web", "chrome", "ios", "android", "vscode"];

  return (
    <>
    <Navbar locale="en" />
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Submit your AI tool</h1>
      <p className="text-sm text-muted-foreground mb-6">
        We review submissions within a few days. Approved tools will appear in our directory.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium">Contact email (optional)</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tool name *</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            required
            value={form.tool_name}
            onChange={(e) => setForm({ ...form, tool_name: e.target.value })}
            placeholder="Awesome AI"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Official URL</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.official_url}
            onChange={(e) => setForm({ ...form, official_url: e.target.value })}
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">One-liner / pitch</label>
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[100px]"
            value={form.pitch}
            onChange={(e) => setForm({ ...form, pitch: e.target.value })}
            placeholder="What is it? Who is it for? Key value in one or two sentences."
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Pricing</label>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.pricing}
            onChange={(e) => setForm({ ...form, pricing: e.target.value })}
          >
            <option value="free">Free</option>
            <option value="freemium">Freemium</option>
            <option value="paid">Paid</option>
            <option value="opensource">Open-source</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  form.platforms.includes(p) ? "bg-black text-white" : "bg-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Logo URL</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <button
          className="px-4 py-2 rounded-lg border bg-black text-white disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Submitting…" : "Submit"}
        </button>

        {ok && <div className="text-emerald-600">Thanks! We'll review your submission.</div>}
        {err && <div className="text-red-600">{err}</div>}
      </form>
    </div>
    <Footer locale="en" />
    </>
  );
}
